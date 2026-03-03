import React, { createContext, useContext, useState, useCallback } from "react";
import type { ComponentDefinition, PropDef } from "@/types/connection";
import {
  makeDefinition,
  makeRootDefinition,
  makePropDef,
} from "@/utils/defaults";
import { genId, toCamelCase } from "@/utils/stringUtils";

interface ConnectionContextValue {
  definitions: ComponentDefinition[];
  activeDefId: string;
  activeDef: ComponentDefinition;
  setActiveDefId: (id: string) => void;

  // Definition-level actions
  addDefinition: (rootName?: string) => void;
  removeDefinition: (id: string) => void;
  updateDefinition: <K extends keyof ComponentDefinition>(
    id: string,
    field: K,
    value: ComponentDefinition[K],
  ) => void;

  // Prop-level actions
  addProp: (type?: PropDef["type"]) => void;
  removeProp: (propId: string) => void;
  updateProp: (propId: string, updated: PropDef) => void;
  reorderProps: (orderedIds: string[]) => void;

  // Bulk replace (used for template loading)
  setDefinitions: (defs: ComponentDefinition[]) => void;

  // Multi-library actions
  addRootDefinition: (name?: string) => void;
  mergeDefinitions: (defs: ComponentDefinition[]) => void;
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null);

export function ConnectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const initial = makeDefinition(0);
  const [definitions, setDefinitions] = useState<ComponentDefinition[]>([
    initial,
  ]);
  const [activeDefId, setActiveDefId] = useState<string>(initial.id);

  const activeDef =
    definitions.find((d) => d.id === activeDefId) ?? definitions[0];

  const updateDefinitions = useCallback(
    (updater: (prev: ComponentDefinition[]) => ComponentDefinition[]) => {
      setDefinitions((prev) => updater(prev));
    },
    [],
  );

  const addDefinition = useCallback(
    (rootName?: string) => {
      const newDef = makeDefinition(definitions.length);
      newDef.id = genId();
      // Find the root definition to inherit importPath from; fall back to first def
      const resolvedRoot = rootName ?? definitions[0].name.split(".")[0];
      const parentDef =
        definitions.find((d) => d.name.split(".")[0] === resolvedRoot) ??
        definitions[0];
      newDef.name = `${resolvedRoot}.SubComponent`;
      newDef.importPath = parentDef.importPath;
      updateDefinitions((prev) => [...prev, newDef]);
      setActiveDefId(newDef.id);
    },
    [definitions, updateDefinitions],
  );

  const removeDefinition = useCallback(
    (id: string) => {
      if (definitions.length <= 1) return;
      updateDefinitions((prev) => prev.filter((d) => d.id !== id));
      if (activeDefId === id) {
        const remaining = definitions.filter((d) => d.id !== id);
        setActiveDefId(remaining[0]?.id ?? "");
      }
    },
    [definitions, activeDefId, updateDefinitions],
  );

  const updateDefinition = useCallback(
    <K extends keyof ComponentDefinition>(
      id: string,
      field: K,
      value: ComponentDefinition[K],
    ) => {
      updateDefinitions((prev) =>
        prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
      );
    },
    [updateDefinitions],
  );

  const addProp = useCallback(
    (type: PropDef["type"] = "string") => {
      const newProp = makePropDef(type);
      updateDefinitions((prev) =>
        prev.map((d) =>
          d.id === activeDefId ? { ...d, props: [...d.props, newProp] } : d,
        ),
      );
    },
    [activeDefId, updateDefinitions],
  );

  const removeProp = useCallback(
    (propId: string) => {
      updateDefinitions((prev) =>
        prev.map((d) =>
          d.id === activeDefId
            ? { ...d, props: d.props.filter((p) => p.id !== propId) }
            : d,
        ),
      );
    },
    [activeDefId, updateDefinitions],
  );

  const updateProp = useCallback(
    (propId: string, updated: PropDef) => {
      updateDefinitions((prev) =>
        prev.map((d) => {
          if (d.id !== activeDefId) return d;
          return {
            ...d,
            props: d.props.map((p) => {
              if (p.id !== propId) return p;
              // Auto-populate reactProp from figmaProp if reactProp is still empty
              if (
                "figmaProp" in updated &&
                updated.figmaProp !== p.figmaProp &&
                !p.reactProp.trim()
              ) {
                return {
                  ...updated,
                  reactProp: toCamelCase(updated.figmaProp),
                };
              }
              return updated;
            }),
          };
        }),
      );
    },
    [activeDefId, updateDefinitions],
  );

  const reorderProps = useCallback(
    (orderedIds: string[]) => {
      updateDefinitions((prev) =>
        prev.map((d) => {
          if (d.id !== activeDefId) return d;
          const propMap = Object.fromEntries(d.props.map((p) => [p.id, p]));
          const reordered = orderedIds
            .map((id) => propMap[id])
            .filter(Boolean) as PropDef[];
          return { ...d, props: reordered };
        }),
      );
    },
    [activeDefId, updateDefinitions],
  );

  const addRootDefinition = useCallback(
    (name?: string) => {
      // Generate a unique name if none provided
      const baseName = name ?? "NewComponent";
      const existingNames = new Set(definitions.map((d) => d.name));
      let finalName = baseName;
      let suffix = 2;
      while (existingNames.has(finalName)) {
        finalName = `${baseName}${suffix++}`;
      }
      const newDef = makeRootDefinition(finalName);
      updateDefinitions((prev) => [...prev, newDef]);
      setActiveDefId(newDef.id);
    },
    [definitions, updateDefinitions],
  );

  const mergeDefinitions = useCallback(
    (incoming: ComponentDefinition[]) => {
      updateDefinitions((prev) => {
        const seen = new Set(prev.map((d) => `${d.name}::${d.figmaUrl}`));
        const toAdd = incoming.filter(
          (d) => !seen.has(`${d.name}::${d.figmaUrl}`),
        );
        return [...prev, ...toAdd];
      });
      // Activate the first newly merged definition
      if (incoming.length > 0) setActiveDefId(incoming[0].id);
    },
    [updateDefinitions],
  );

  const value: ConnectionContextValue = {
    definitions,
    activeDefId,
    activeDef,
    setActiveDefId,
    addDefinition,
    removeDefinition,
    updateDefinition,
    addProp,
    removeProp,
    updateProp,
    reorderProps,
    setDefinitions,
    addRootDefinition,
    mergeDefinitions,
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection(): ConnectionContextValue {
  const ctx = useContext(ConnectionContext);
  if (!ctx)
    throw new Error("useConnection must be used inside ConnectionProvider");
  return ctx;
}

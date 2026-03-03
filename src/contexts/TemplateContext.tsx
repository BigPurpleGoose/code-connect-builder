import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { Template, ComponentDefinition } from "@/types/connection";
import { genId } from "@/utils/stringUtils";

const STORAGE_KEY = "cc-builder-templates";

interface TemplateContextValue {
  templates: Template[];
  saveTemplate: (name: string, definitions: ComponentDefinition[]) => void;
  loadTemplate: (id: string) => ComponentDefinition[] | null;
  deleteTemplate: (id: string) => void;
  renameTemplate: (id: string, name: string) => void;
}

const TemplateContext = createContext<TemplateContextValue | null>(null);

export function TemplateProvider({ children }: { children: React.ReactNode }) {
  const [templates, setTemplates] = useState<Template[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Template[];
        setTemplates(parsed);
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  const persist = useCallback((updated: Template[]) => {
    setTemplates(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage quota errors
    }
  }, []);

  const saveTemplate = useCallback(
    (name: string, definitions: ComponentDefinition[]) => {
      const template: Template = {
        id: genId(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
        definitions,
      };
      persist([...templates, template]);
    },
    [templates, persist],
  );

  const loadTemplate = useCallback(
    (id: string): ComponentDefinition[] | null => {
      const t = templates.find((t) => t.id === id);
      return t ? t.definitions : null;
    },
    [templates],
  );

  const deleteTemplate = useCallback(
    (id: string) => {
      persist(templates.filter((t) => t.id !== id));
    },
    [templates, persist],
  );

  const renameTemplate = useCallback(
    (id: string, name: string) => {
      persist(
        templates.map((t) => (t.id === id ? { ...t, name: name.trim() } : t)),
      );
    },
    [templates, persist],
  );

  return (
    <TemplateContext.Provider
      value={{
        templates,
        saveTemplate,
        loadTemplate,
        deleteTemplate,
        renameTemplate,
      }}
    >
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplates(): TemplateContextValue {
  const ctx = useContext(TemplateContext);
  if (!ctx)
    throw new Error("useTemplates must be used inside TemplateProvider");
  return ctx;
}

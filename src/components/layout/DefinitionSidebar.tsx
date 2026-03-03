import React, { useCallback, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useConnection } from "@/contexts/ConnectionContext";
import { cn } from "@/components/ui/cn";

/** Group definitions by the root name segment (portion before the first "."). */
function groupByRoot(
  definitions: ReturnType<typeof useConnection>["definitions"],
) {
  const order: string[] = [];
  const map = new Map<string, typeof definitions>();

  for (const def of definitions) {
    const root = def.name.split(".")[0] || def.name;
    if (!map.has(root)) {
      map.set(root, []);
      order.push(root);
    }
    map.get(root)!.push(def);
  }

  return order.map((root) => ({ root, defs: map.get(root)! }));
}

export function DefinitionSidebar() {
  const {
    definitions,
    activeDefId,
    setActiveDefId,
    addDefinition,
    addRootDefinition,
    removeDefinition,
  } = useConnection();

  // Track which root groups are collapsed (by root name)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = useCallback((root: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(root)) next.delete(root);
      else next.add(root);
      return next;
    });
  }, []);

  const groups = groupByRoot(definitions);
  const totalRoots = groups.length;

  return (
    <div className="flex w-52 shrink-0 flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Components
        </p>

        <div className="space-y-1">
          {groups.map(({ root, defs }) => {
            const isCollapsed = collapsed.has(root);
            const hasMultipleRoots = totalRoots > 1;
            const hasSubComponents =
              defs.length > 1 || defs[0]?.name.includes(".");

            return (
              <div key={root}>
                {/* Root group header — only shown when there are multiple roots or sub-components */}
                {(hasMultipleRoots || hasSubComponents) && (
                  <div className="flex items-center gap-0.5 py-0.5">
                    <button
                      onClick={() => toggleCollapse(root)}
                      className="flex items-center gap-1 flex-1 min-w-0 rounded px-1 py-1 text-left text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-3 w-3 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-3 w-3 flex-shrink-0" />
                      )}
                      <span className="truncate font-mono">{root}</span>
                      <span className="ml-auto flex-shrink-0 text-[10px] text-slate-400">
                        {defs.length}
                      </span>
                    </button>
                    {/* Add sub-component button */}
                    <button
                      onClick={() => addDefinition(root)}
                      title={`Add sub-component of ${root}`}
                      className="flex-shrink-0 rounded p-1 text-slate-300 hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-950 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Definitions within this root */}
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {defs.map((def) => {
                      const isRoot = !def.name.includes(".");
                      const subLabel = def.name.includes(".")
                        ? def.name.slice(def.name.indexOf(".") + 1)
                        : def.name;

                      return (
                        <div
                          key={def.id}
                          className="group relative flex items-center"
                        >
                          <button
                            onClick={() => setActiveDefId(def.id)}
                            className={cn(
                              "flex-1 truncate rounded-lg text-left text-xs font-medium transition-all",
                              hasMultipleRoots || hasSubComponents
                                ? "pl-5 pr-3 py-2"
                                : "px-3 py-2.5",
                              activeDefId === def.id
                                ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                                : "text-slate-600 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200",
                            )}
                            title={def.name}
                          >
                            <span className="block truncate">
                              {isRoot && !hasSubComponents
                                ? def.name
                                : subLabel || def.name}
                            </span>
                            <span className="text-[10px] font-normal text-slate-400">
                              {def.props.length} prop
                              {def.props.length !== 1 ? "s" : ""}
                            </span>
                          </button>

                          {definitions.length > 1 && (
                            <button
                              onClick={() => removeDefinition(def.id)}
                              className="absolute right-1 rounded p-1 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950"
                              title="Remove component"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-3 space-y-2">
        {/* Add sub-component (only shown when there's a single root) */}
        {groups.length === 1 && (
          <button
            onClick={() => addDefinition(groups[0].root)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-500 dark:hover:border-blue-600 dark:hover:bg-blue-950"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Sub-component
          </button>
        )}

        {/* New root component */}
        <button
          onClick={() => addRootDefinition()}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-blue-200 dark:border-blue-900 py-2 text-xs font-medium text-blue-500 dark:text-blue-400 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
        >
          <Plus className="h-3.5 w-3.5" />
          New Component
        </button>

        <p className="text-[10px] text-slate-400 leading-relaxed">
          Add sub-components like <code className="font-mono">Button.Icon</code>{" "}
          to generate multiple{" "}
          <code className="font-mono">figma.connect()</code> calls in one file.
        </p>
      </div>
    </div>
  );
}

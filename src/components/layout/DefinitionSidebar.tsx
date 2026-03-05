import React, { useCallback, useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, Info, X } from "lucide-react";
import { useConnection } from "@/contexts/ConnectionContext";
import { Tooltip } from "@/components/ui/Tooltip";
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

interface DefinitionSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DefinitionSidebar({ isOpen, onClose }: DefinitionSidebarProps) {
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

  // Close sidebar on escape key (mobile)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const sidebarContent = (
    <>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-caption font-bold uppercase tracking-wider text-neutral-500">
            Components
          </p>
          {/* Close button - mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-neutral-400 hover:text-neutral-200 rounded"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

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
                      className="flex items-center gap-1 flex-1 min-w-0 rounded px-1 py-1 text-left text-body-sm font-semibold text-neutral-400 hover:text-neutral-200 transition-colors"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-3 w-3 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-3 w-3 flex-shrink-0" />
                      )}
                      <span className="truncate font-mono">{root}</span>
                      <span className="ml-auto flex-shrink-0 text-[10px] text-neutral-400">
                        {defs.length}
                      </span>
                    </button>
                    {/* Add sub-component button */}
                    <Tooltip content={`Add sub-component of ${root}`}>
                      <button
                        onClick={() => addDefinition(root)}
                        className="flex-shrink-0 rounded p-1 text-neutral-500 hover:bg-primary-900 hover:text-primary-400 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </Tooltip>
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
                              "flex-1 truncate rounded-lg text-left text-body-sm font-medium transition-all",
                              hasMultipleRoots || hasSubComponents
                                ? "pl-5 pr-3 py-2"
                                : "px-3 py-2.5",
                              activeDefId === def.id
                                ? "bg-neutral-800 text-primary-400 shadow-sm ring-1 ring-neutral-700"
                                : "text-neutral-300 hover:bg-neutral-800/50 hover:text-neutral-100",
                            )}
                            title={def.name}
                          >
                            <span className="block truncate">
                              {isRoot && !hasSubComponents
                                ? def.name
                                : subLabel || def.name}
                            </span>
                            <span className="text-caption font-normal text-neutral-400">
                              {def.props.length} prop
                              {def.props.length !== 1 ? "s" : ""}
                            </span>
                          </button>

                          {definitions.length > 1 && (
                            <button
                              onClick={() => removeDefinition(def.id)}
                              className="absolute right-1 rounded p-1 text-neutral-500 opacity-0 transition-all hover:bg-danger-900 hover:text-danger-400 group-hover:opacity-100"
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
      <div className="border-t border-neutral-700 p-3 space-y-2">
        {/* Add sub-component (only shown when there's a single root) */}
        {groups.length === 1 && (
          <button
            onClick={() => addDefinition(groups[0].root)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-neutral-700 py-2 text-body-sm font-medium text-neutral-400 transition-colors hover:border-primary-600 hover:bg-primary-900 hover:text-primary-400"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Sub-component
          </button>
        )}

        {/* New root component */}
        <button
          onClick={() => addRootDefinition()}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-primary-700 py-2 text-body-sm font-medium text-primary-400 transition-colors hover:border-primary-600 hover:bg-primary-900"
        >
          <Plus className="h-3.5 w-3.5" />
          New Component
        </button>

        <div className="flex items-center gap-1.5">
          <Tooltip content="Add sub-components like Button.Icon to generate multiple figma.connect() calls in one file">
            <Info className="h-3.5 w-3.5 text-neutral-400 cursor-help" />
          </Tooltip>
          <p className="text-caption text-neutral-400 leading-relaxed">
            Sub-components bundle in one file
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - slide-over on mobile, fixed on desktop */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-[280px] shrink-0 flex-col border-r border-neutral-700 bg-neutral-900 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-80",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}

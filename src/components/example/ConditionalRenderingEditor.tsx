import React, { useState } from "react";
import { Plus, X, ChevronDown, ChevronRight } from "lucide-react";
import type { ConditionalBranch, PropDef } from "@/types/connection";
import { makeConditionalBranch } from "@/utils/defaults";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/components/ui/cn";

interface ConditionalRenderingEditorProps {
  conditionalBranches: ConditionalBranch[];
  props: PropDef[]; // Used to filter to boolean/enum props
  onChange: (updated: ConditionalBranch[]) => void;
}

export function ConditionalRenderingEditor({
  conditionalBranches,
  props,
  onChange,
}: ConditionalRenderingEditorProps) {
  const [expanded, setExpanded] = useState(true);

  const addBranch = () =>
    onChange([...conditionalBranches, makeConditionalBranch()]);

  const removeBranch = (id: string) =>
    onChange(conditionalBranches.filter((b) => b.id !== id));

  const updateBranch = (id: string, fields: Partial<ConditionalBranch>) => {
    onChange(
      conditionalBranches.map((b) => {
        if (b.id !== id) return b;
        const updated = { ...b, ...fields };

        // When prop changes, auto-set propType and reset condition
        if (fields.propName !== undefined) {
          const selectedProp = props.find(
            (p) => p.reactProp === fields.propName,
          );
          if (selectedProp) {
            if (selectedProp.type === "boolean") {
              updated.propType = "boolean";
              updated.condition = "true";
            } else if (selectedProp.type === "enum") {
              updated.propType = "enum";
              updated.condition = selectedProp.enumOptions[0]?.figma || "";
            }
          }
        }

        return updated;
      }),
    );
  };

  // Get boolean and enum props that can be used in conditionals
  const conditionalProps = props.filter(
    (p) => (p.type === "boolean" || p.type === "enum") && p.reactProp.trim(),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
          <p className="text-caption font-bold text-neutral-400 uppercase tracking-wider">
            Conditional Rendering
          </p>
          <Tooltip
            content="Add if/else branches in the example based on boolean or enum prop values"
            side="right"
          >
            <button
              type="button"
              className="text-neutral-500 hover:text-primary-400"
            >
              <span className="text-[10px] border border-neutral-300 rounded-full w-4 h-4 inline-flex items-center justify-center font-bold">
                ?
              </span>
            </button>
          </Tooltip>
        </div>
        {expanded && conditionalBranches.length > 0 && (
          <button
            type="button"
            onClick={addBranch}
            className="text-[11px] text-primary-600 hover:text-primary-700 font-medium flex items-center gap-0.5"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        )}
      </div>

      {expanded && (
        <>
          {conditionalBranches.length === 0 ? (
            <button
              type="button"
              onClick={addBranch}
              className="flex w-full items-center justify-center gap-1 rounded-lg border-2 border-dashed border-neutral-200 py-3 text-xs text-neutral-400 hover:border-primary-300 hover:text-primary-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add conditional branch
            </button>
          ) : (
            <div className="space-y-3">
              {conditionalBranches.map((branch) => {
                const selectedProp = props.find(
                  (p) => p.reactProp === branch.propName,
                );
                const hasElse =
                  branch.elseRender !== undefined && branch.elseRender !== "";

                return (
                  <div
                    key={branch.id}
                    className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3 space-y-3"
                  >
                    {/* Prop selector and condition */}
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <label
                          htmlFor={`cond-prop-${branch.id}`}
                          className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1 block"
                        >
                          Check prop
                        </label>
                        <select
                          id={`cond-prop-${branch.id}`}
                          value={branch.propName}
                          onChange={(e) =>
                            updateBranch(branch.id, {
                              propName: e.target.value,
                            })
                          }
                          className="h-8 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2.5 text-xs text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                        >
                          <option value="">Select prop...</option>
                          {conditionalProps.map((p) => (
                            <option key={p.id} value={p.reactProp}>
                              {p.reactProp} ({p.type})
                            </option>
                          ))}
                        </select>
                        {!branch.propName && (
                          <p className="text-[9px] text-amber-500 mt-0.5">
                            Select a boolean or enum prop
                          </p>
                        )}
                        {branch.propName && !selectedProp && (
                          <p className="text-[9px] text-danger-500 mt-0.5">
                            Prop not found or wrong type
                          </p>
                        )}
                      </div>

                      <div className="flex-1">
                        <label
                          htmlFor={`cond-value-${branch.id}`}
                          className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1 block"
                        >
                          Condition
                        </label>
                        {selectedProp?.type === "boolean" ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                updateBranch(branch.id, { condition: "true" })
                              }
                              className={cn(
                                "flex-1 h-8 rounded-md border text-xs font-medium transition-colors",
                                branch.condition === "true"
                                  ? "border-primary-500 bg-primary-500/20 text-primary-300"
                                  : "border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-600",
                              )}
                            >
                              true
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateBranch(branch.id, { condition: "false" })
                              }
                              className={cn(
                                "flex-1 h-8 rounded-md border text-xs font-medium transition-colors",
                                branch.condition === "false"
                                  ? "border-primary-500 bg-primary-500/20 text-primary-300"
                                  : "border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-600",
                              )}
                            >
                              false
                            </button>
                          </div>
                        ) : selectedProp?.type === "enum" ? (
                          <select
                            id={`cond-value-${branch.id}`}
                            value={branch.condition}
                            onChange={(e) =>
                              updateBranch(branch.id, {
                                condition: e.target.value,
                              })
                            }
                            className="h-8 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2.5 text-xs text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                          >
                            {selectedProp.enumOptions.map((opt, idx) => (
                              <option key={idx} value={opt.figma}>
                                {opt.figma}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="h-8 flex items-center px-2.5 rounded-md border border-neutral-700 bg-neutral-800 text-xs text-neutral-500 italic">
                            Select prop first
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeBranch(branch.id)}
                        className="text-neutral-400 hover:text-danger-500 transition-colors mt-6"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Then render */}
                    <div>
                      <label
                        htmlFor={`cond-then-${branch.id}`}
                        className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1 block"
                      >
                        Then render
                      </label>
                      <textarea
                        id={`cond-then-${branch.id}`}
                        value={branch.thenRender}
                        onChange={(e) =>
                          updateBranch(branch.id, {
                            thenRender: e.target.value,
                          })
                        }
                        placeholder="<Component>{children}</Component>"
                        rows={2}
                        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-xs text-neutral-100 transition-colors resize-none placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                      />
                    </div>

                    {/* Else render toggle and textarea */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          id={`cond-else-toggle-${branch.id}`}
                          checked={hasElse}
                          onChange={(e) =>
                            updateBranch(branch.id, {
                              elseRender: e.target.checked ? "" : undefined,
                            })
                          }
                          className="h-3 w-3 rounded border-neutral-700 text-primary-500 focus:ring-2 focus:ring-primary-500/30"
                        />
                        <label
                          htmlFor={`cond-else-toggle-${branch.id}`}
                          className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider cursor-pointer"
                        >
                          Add else branch
                        </label>
                      </div>
                      {hasElse && (
                        <textarea
                          id={`cond-else-${branch.id}`}
                          value={branch.elseRender || ""}
                          onChange={(e) =>
                            updateBranch(branch.id, {
                              elseRender: e.target.value,
                            })
                          }
                          placeholder="<Component />"
                          rows={2}
                          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-xs text-neutral-100 transition-colors resize-none placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

import React from "react";
import { Plus, X, Code } from "lucide-react";
import type { PropDef, NestedPropDef, EnumOption } from "@/types/connection";
import { makeNestedPropDef, makeEnumOption } from "@/utils/defaults";
import { toCamelCase } from "@/utils/stringUtils";
import { cn } from "@/components/ui/cn";

interface NestedPropsBuilderProps {
  prop: Extract<PropDef, { type: "nestedProps" }>;
  onChange: (updated: Extract<PropDef, { type: "nestedProps" }>) => void;
}

const NESTED_TYPE_OPTIONS: { value: NestedPropDef["type"]; label: string }[] = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "enum", label: "Enum" },
  { value: "instance", label: "Instance" },
  { value: "children", label: "Children" },
  { value: "textContent", label: "Text Content" },
];

export function NestedPropsBuilder({
  prop,
  onChange,
}: NestedPropsBuilderProps) {
  const updateNested = (nested: NestedPropDef[]) =>
    onChange({ ...prop, nestedProps: nested });

  const addNested = () =>
    updateNested([...prop.nestedProps, makeNestedPropDef()]);

  const removeNested = (id: string) =>
    updateNested(prop.nestedProps.filter((n) => n.id !== id));

  const updateNestedProp = (id: string, fields: Partial<NestedPropDef>) => {
    updateNested(
      prop.nestedProps.map((n) => {
        if (n.id !== id) return n;
        const updated = { ...n, ...fields };
        // Auto-populate reactProp from figmaProp
        if (fields.figmaProp !== undefined && !n.reactProp) {
          updated.reactProp = toCamelCase(fields.figmaProp);
        }
        // Initialize enumOptions when type changes to enum
        if (fields.type === "enum" && !updated.enumOptions) {
          updated.enumOptions = [makeEnumOption()];
        }
        return updated;
      }),
    );
  };

  const updateEnumOption = (
    npId: string,
    optionIndex: number,
    fields: Partial<EnumOption>,
  ) => {
    updateNested(
      prop.nestedProps.map((n) => {
        if (n.id !== npId || n.type !== "enum" || !n.enumOptions) return n;
        const updatedOptions = n.enumOptions.map((opt, i) =>
          i === optionIndex ? { ...opt, ...fields } : opt,
        );
        return { ...n, enumOptions: updatedOptions };
      }),
    );
  };

  const addEnumOption = (npId: string) => {
    updateNested(
      prop.nestedProps.map((n) => {
        if (n.id !== npId || n.type !== "enum") return n;
        return {
          ...n,
          enumOptions: [...(n.enumOptions || []), makeEnumOption()],
        };
      }),
    );
  };

  const removeEnumOption = (npId: string, optionIndex: number) => {
    updateNested(
      prop.nestedProps.map((n) => {
        if (n.id !== npId || n.type !== "enum" || !n.enumOptions) return n;
        return {
          ...n,
          enumOptions: n.enumOptions.filter((_, i) => i !== optionIndex),
        };
      }),
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-neutral-500 leading-relaxed">
        Define the props that exist on the{" "}
        <strong>{prop.figmaProp || "sub-component"}</strong> Figma layer. These
        will be aggregated into the parent component's{" "}
        <code className="font-mono">{prop.reactProp || "prop"}</code> using{" "}
        <code className="font-mono">figma.nestedProps()</code>.
      </p>

      {/* Header row */}
      {prop.nestedProps.length > 0 && (
        <div className="grid grid-cols-[1fr_1fr_120px_auto] gap-2">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            React Prop
          </span>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            Figma Prop
          </span>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            Type
          </span>
          <span className="w-6" />
        </div>
      )}

      {/* Nested prop rows */}
      <div className="space-y-2">
        {prop.nestedProps.map((np) => (
          <div key={np.id} className="space-y-1.5">
            <div className="grid grid-cols-[1fr_1fr_120px_auto] gap-2 items-end">
              <input
                id={`nested-react-${np.id}`}
                type="text"
                value={np.reactProp || ""}
                onChange={(e) =>
                  updateNestedProp(np.id, { reactProp: e.target.value })
                }
                placeholder="reactProp"
                className="h-8 rounded-md border border-neutral-700 bg-neutral-900 px-2.5 font-mono text-xs text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 placeholder:text-neutral-500"
              />
              <input
                id={`nested-figma-${np.id}`}
                type="text"
                value={np.figmaProp || ""}
                onChange={(e) =>
                  updateNestedProp(np.id, { figmaProp: e.target.value })
                }
                placeholder="Figma Prop"
                className="h-8 rounded-md border border-neutral-700 bg-neutral-900 px-2.5 text-xs text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 placeholder:text-neutral-500"
              />
              <select
                value={np.type}
                onChange={(e) =>
                  updateNestedProp(np.id, {
                    type: e.target.value as NestedPropDef["type"],
                  })
                }
                className="h-8 appearance-none rounded-md border border-neutral-700 bg-neutral-900 px-2 text-xs text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 cursor-pointer"
              >
                {NESTED_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeNested(np.id)}
                className="text-neutral-400 hover:text-danger-500 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Boolean sub-options for nested props */}
            {np.type === "boolean" && (
              <div className={cn("ml-0 grid grid-cols-3 gap-1 pl-0")}>
                {(["simple", "inverse", "visibility"] as const).map((mode) => (
                  <label
                    key={mode}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`nested-bool-${np.id}`}
                      checked={np.boolMode === mode}
                      onChange={() =>
                        updateNestedProp(np.id, { boolMode: mode })
                      }
                      className="accent-primary-600"
                    />
                    <span className="text-[10px] text-neutral-600 capitalize">
                      {mode}
                    </span>
                  </label>
                ))}
                {np.boolMode === "visibility" && (
                  <div className="col-span-3 mt-1">
                    <input
                      id={`nested-bool-layer-${np.id}`}
                      type="text"
                      value={np.boolChildLayer ?? ""}
                      onChange={(e) =>
                        updateNestedProp(np.id, {
                          boolChildLayer: e.target.value,
                        })
                      }
                      placeholder="Layer name to show"
                      className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-[11px] text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Enum sub-options for nested props */}
            {np.type === "enum" && (
              <div className="ml-0 space-y-1.5 pl-2 border-l-2 border-purple-500/30">
                <div className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide">
                  Enum Options
                </div>
                {np.enumOptions &&
                  np.enumOptions.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className="grid grid-cols-[1fr_auto_1fr_auto_auto] gap-1.5 items-center"
                    >
                      <input
                        type="text"
                        value={opt.figma || ""}
                        onChange={(e) =>
                          updateEnumOption(np.id, optIdx, {
                            figma: e.target.value,
                          })
                        }
                        placeholder="Figma option"
                        className="h-7 rounded border border-neutral-700 bg-neutral-900 px-2 text-[11px] text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-neutral-500"
                      />
                      <span className="text-neutral-500 text-[10px]">→</span>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={opt.react || ""}
                          onChange={(e) =>
                            updateEnumOption(np.id, optIdx, {
                              react: e.target.value,
                            })
                          }
                          placeholder={opt.isCode ? "JS value" : "string"}
                          className={cn(
                            "h-7 w-full rounded border px-2 pr-7 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-neutral-500",
                            opt.isCode
                              ? "bg-primary-900/20 border-primary-700 text-primary-300"
                              : "bg-neutral-900 border-neutral-700 text-neutral-100",
                          )}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateEnumOption(np.id, optIdx, {
                              isCode: !opt.isCode,
                            })
                          }
                          title={
                            opt.isCode ? "Treat as string" : "Treat as code"
                          }
                          className={cn(
                            "absolute right-1 rounded p-0.5 transition-colors",
                            opt.isCode
                              ? "text-primary-600 bg-primary-900/40"
                              : "text-neutral-500 hover:text-neutral-300",
                          )}
                        >
                          <Code className="h-2.5 w-2.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEnumOption(np.id, optIdx)}
                        className="text-neutral-500 hover:text-danger-500 transition-colors"
                        disabled={np.enumOptions && np.enumOptions.length <= 1}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                <button
                  type="button"
                  onClick={() => addEnumOption(np.id)}
                  className="flex items-center gap-1 text-[10px] text-primary-600 hover:text-primary-700 font-medium"
                >
                  <Plus className="h-3 w-3" /> Add Option
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {prop.nestedProps.length === 0 && (
        <p className="text-[11px] text-neutral-400 italic">
          No nested props added yet. Add one below to define the sub-component
          mapping.
        </p>
      )}

      <button
        type="button"
        onClick={addNested}
        className="flex items-center gap-1.5 text-[11px] text-primary-600 hover:text-primary-700 font-medium transition-colors"
      >
        <Plus className="h-3.5 w-3.5" /> Add Nested Prop
      </button>
    </div>
  );
}

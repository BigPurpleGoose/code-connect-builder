import React from "react";
import { Plus, X } from "lucide-react";
import type { PropDef, NestedPropDef } from "@/types/connection";
import { makeNestedPropDef } from "@/utils/defaults";
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
        return updated;
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

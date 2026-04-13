import React from "react";
import { Plus, X, ChevronDown } from "lucide-react";
import type { JsxPropValue, JsxPropAttr, PropDef } from "@/types/connection";
import { makeJsxPropValue, makeJsxPropAttr } from "@/utils/defaults";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/components/ui/cn";

interface JsxPropValueEditorProps {
  jsxPropValues: JsxPropValue[];
  props: PropDef[]; // Used to suggest nested prop paths
  onChange: (updated: JsxPropValue[]) => void;
}

export function JsxPropValueEditor({
  jsxPropValues,
  props,
  onChange,
}: JsxPropValueEditorProps) {
  const addJsxProp = () => onChange([...jsxPropValues, makeJsxPropValue()]);

  const removeJsxProp = (id: string) =>
    onChange(jsxPropValues.filter((jp) => jp.id !== id));

  const updateJsxProp = (id: string, fields: Partial<JsxPropValue>) =>
    onChange(
      jsxPropValues.map((jp) => (jp.id === id ? { ...jp, ...fields } : jp)),
    );

  const addAttr = (jsxPropId: string) => {
    onChange(
      jsxPropValues.map((jp) =>
        jp.id === jsxPropId
          ? { ...jp, componentProps: [...jp.componentProps, makeJsxPropAttr()] }
          : jp,
      ),
    );
  };

  const removeAttr = (jsxPropId: string, attrId: string) => {
    onChange(
      jsxPropValues.map((jp) =>
        jp.id === jsxPropId
          ? {
              ...jp,
              componentProps: jp.componentProps.filter((a) => a.id !== attrId),
            }
          : jp,
      ),
    );
  };

  const updateAttr = (
    jsxPropId: string,
    attrId: string,
    fields: Partial<JsxPropAttr>,
  ) => {
    onChange(
      jsxPropValues.map((jp) =>
        jp.id === jsxPropId
          ? {
              ...jp,
              componentProps: jp.componentProps.map((a) =>
                a.id === attrId ? { ...a, ...fields } : a,
              ),
            }
          : jp,
      ),
    );
  };

  // Generate nested prop path suggestions like "props.heading.text"
  const getNestedPropPaths = (): string[] => {
    const paths: string[] = [];
    props.forEach((prop) => {
      if (prop.type === "nestedProps" && prop.reactProp) {
        prop.nestedProps.forEach((np) => {
          if (np.reactProp) {
            paths.push(`props.${prop.reactProp}.${np.reactProp}`);
          }
        });
      }
    });
    return paths;
  };

  const nestedPropPaths = getNestedPropPaths();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <p className="text-caption font-bold text-neutral-400 uppercase tracking-wider">
            JSX Prop Values
          </p>
          <Tooltip
            content="Build JSX component elements as prop values (e.g., heading={<TaskCard.Heading text={props.heading.text} />})"
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
        {jsxPropValues.length > 0 && (
          <button
            type="button"
            onClick={addJsxProp}
            className="text-[11px] text-primary-600 hover:text-primary-700 font-medium flex items-center gap-0.5"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        )}
      </div>

      {jsxPropValues.length === 0 ? (
        <button
          type="button"
          onClick={addJsxProp}
          className="flex w-full items-center justify-center gap-1 rounded-lg border-2 border-dashed border-neutral-200 py-3 text-xs text-neutral-400 hover:border-primary-300 hover:text-primary-500 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add JSX prop value
        </button>
      ) : (
        <div className="space-y-4">
          {jsxPropValues.map((jsxProp) => (
            <div
              key={jsxProp.id}
              className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3 space-y-3"
            >
              {/* Prop key and component name */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label
                    htmlFor={`jsx-prop-key-${jsxProp.id}`}
                    className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1 block"
                  >
                    Prop name
                  </label>
                  <input
                    id={`jsx-prop-key-${jsxProp.id}`}
                    type="text"
                    value={jsxProp.propKey}
                    onChange={(e) =>
                      updateJsxProp(jsxProp.id, { propKey: e.target.value })
                    }
                    placeholder="heading"
                    className="h-8 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2.5 font-mono text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor={`jsx-component-${jsxProp.id}`}
                    className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1 block"
                  >
                    Component
                  </label>
                  <input
                    id={`jsx-component-${jsxProp.id}`}
                    type="text"
                    value={jsxProp.componentName}
                    onChange={(e) =>
                      updateJsxProp(jsxProp.id, {
                        componentName: e.target.value,
                      })
                    }
                    placeholder="TaskCard.Heading"
                    className="h-8 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2.5 font-mono text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeJsxProp(jsxProp.id)}
                  className="text-neutral-400 hover:text-danger-500 transition-colors mt-6"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Component props */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Component Props
                  </p>
                  <button
                    type="button"
                    onClick={() => addAttr(jsxProp.id)}
                    className="text-[10px] text-primary-600 hover:text-primary-700 font-medium flex items-center gap-0.5"
                  >
                    <Plus className="h-2.5 w-2.5" /> Add
                  </button>
                </div>

                {jsxProp.componentProps.length === 0 ? (
                  <p className="text-[10px] text-neutral-500 italic">
                    No props configured
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {jsxProp.componentProps.map((attr) => (
                      <div
                        key={attr.id}
                        className="flex items-center gap-1.5 bg-neutral-900 rounded p-1.5"
                      >
                        {/* Key */}
                        <input
                          type="text"
                          value={attr.key}
                          onChange={(e) =>
                            updateAttr(jsxProp.id, attr.id, {
                              key: e.target.value,
                            })
                          }
                          placeholder="text"
                          className="h-7 w-24 rounded border border-neutral-700 bg-neutral-800 px-2 font-mono text-[10px] text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
                        />
                        <span className="text-neutral-500 text-xs">=</span>

                        {/* Value */}
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={attr.value}
                            onChange={(e) =>
                              updateAttr(jsxProp.id, attr.id, {
                                value: e.target.value,
                              })
                            }
                            placeholder={
                              attr.valueType === "nestedProp"
                                ? "props.heading.text"
                                : attr.valueType === "static"
                                  ? '"value"'
                                  : "expression"
                            }
                            className="h-7 w-full rounded border border-neutral-700 bg-neutral-800 px-2 pr-16 font-mono text-[10px] text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
                          />
                          {/* Type selector dropdown */}
                          <select
                            value={attr.valueType}
                            onChange={(e) =>
                              updateAttr(jsxProp.id, attr.id, {
                                valueType: e.target
                                  .value as JsxPropAttr["valueType"],
                              })
                            }
                            className="absolute right-1 top-1 h-5 text-[9px] rounded border border-neutral-600 bg-neutral-700 px-1 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
                          >
                            <option value="static">Static</option>
                            <option value="nestedProp">Nested</option>
                            <option value="code">Code</option>
                          </select>
                        </div>

                        {/* Nested prop suggestion dropdown */}
                        {attr.valueType === "nestedProp" &&
                          nestedPropPaths.length > 0 && (
                            <select
                              value={attr.value}
                              onChange={(e) =>
                                updateAttr(jsxProp.id, attr.id, {
                                  value: e.target.value,
                                })
                              }
                              className="h-7 w-32 rounded border border-neutral-700 bg-neutral-800 px-1 font-mono text-[10px] text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
                            >
                              <option value="">Select...</option>
                              {nestedPropPaths.map((path) => (
                                <option key={path} value={path}>
                                  {path}
                                </option>
                              ))}
                            </select>
                          )}

                        <button
                          type="button"
                          onClick={() => removeAttr(jsxProp.id, attr.id)}
                          className="text-neutral-500 hover:text-danger-500 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

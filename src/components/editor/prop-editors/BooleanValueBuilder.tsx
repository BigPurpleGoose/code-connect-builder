import React, { useState, useEffect } from "react";
import { Code, Blocks, Plus, X } from "lucide-react";
import { cn } from "@/components/ui/cn";
import type { NestedPropDef } from "@/types/connection";
import { makeNestedPropDef } from "@/utils/defaults";
import { toCamelCase } from "@/utils/stringUtils";

interface BooleanValueBuilderProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

type ValueType =
  | "undefined"
  | "stringLiteral"
  | "figma.string"
  | "figma.textContent"
  | "figma.children"
  | "figma.nestedProps";

const TYPE_OPTIONS: { value: ValueType; label: string }[] = [
  { value: "undefined", label: "undefined" },
  { value: "stringLiteral", label: "String Literal" },
  { value: "figma.string", label: "figma.string() - Figma Property" },
  { value: "figma.textContent", label: "figma.textContent() - Layer Text" },
  { value: "figma.children", label: "figma.children() - Child Layers" },
  { value: "figma.nestedProps", label: "figma.nestedProps() - Nested Object" },
];

const NESTED_TYPE_OPTIONS: { value: NestedPropDef["type"]; label: string }[] = [
  { value: "string", label: "string" },
  { value: "textContent", label: "text" },
  { value: "boolean", label: "bool" },
  { value: "children", label: "children" },
];

export function BooleanValueBuilder({
  label,
  value,
  onChange,
  placeholder,
  error,
}: BooleanValueBuilderProps) {
  const [mode, setMode] = useState<"visual" | "manual">(() => {
    const trimmed = value.trim();
    if (
      !trimmed ||
      trimmed === "undefined" ||
      trimmed.includes("figma.") ||
      trimmed.match(/^["'].*["']$/)
    ) {
      return "visual";
    }
    return "manual";
  });

  const [visualType, setVisualType] = useState<ValueType>("undefined");
  const [stringValue, setStringValue] = useState("");
  const [layerPath, setLayerPath] = useState("");
  const [parentLayer, setParentLayer] = useState("");
  const [nestedProps, setNestedProps] = useState<NestedPropDef[]>([]);

  // Parse value on mount and when value changes externally
  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "undefined") {
      setVisualType("undefined");
    } else if (trimmed.match(/^["'](.*)["']$/)) {
      const match = trimmed.match(/^["'](.*)["']$/);
      setVisualType("stringLiteral");
      setStringValue(match?.[1] || "");
    } else if (trimmed.includes("figma.string(")) {
      setVisualType("figma.string");
      const match = trimmed.match(/figma\.string\(['"]([^'"]+)['"]\)/);
      setLayerPath(match?.[1] || "");
    } else if (trimmed.includes("figma.textContent(")) {
      setVisualType("figma.textContent");
      const match = trimmed.match(/figma\.textContent\(['"]([^'"]+)['"]\)/);
      setLayerPath(match?.[1] || "");
    } else if (trimmed.includes("figma.children(")) {
      setVisualType("figma.children");
      const match = trimmed.match(/figma\.children\(\[['"]([^'"]+)['"]\]\)/);
      setLayerPath(match?.[1] || "");
    } else if (trimmed.includes("figma.nestedProps(")) {
      setVisualType("figma.nestedProps");
      const parentMatch = trimmed.match(/figma\.nestedProps\(['"]([^'"]+)['"]/);
      setParentLayer(parentMatch?.[1] || "");
      // Try to parse nested props
      const propsMatch = trimmed.match(/\{([^}]+)\}/s);
      if (propsMatch) {
        const propsContent = propsMatch[1];
        const propLines = propsContent.split(",").filter((l) => l.trim());
        const parsed: NestedPropDef[] = [];
        propLines.forEach((line) => {
          const propMatch = line.match(
            /(\w+):\s*figma\.(\w+)\(['"]([^'"]+)['"]\)/,
          );
          if (propMatch) {
            const [, reactProp, figmaType, figmaProp] = propMatch;
            const type =
              figmaType === "textContent"
                ? "textContent"
                : figmaType === "children"
                  ? "children"
                  : figmaType === "boolean"
                    ? "boolean"
                    : "string";
            parsed.push({
              id: Math.random().toString(36).substr(2, 9),
              reactProp,
              figmaProp,
              type: type as NestedPropDef["type"],
            });
          }
        });
        if (parsed.length > 0) {
          setNestedProps(parsed);
        }
      }
    }
  }, [value]);

  const generateValue = (): string => {
    switch (visualType) {
      case "undefined":
        return "undefined";
      case "stringLiteral":
        return stringValue.trim() ? `"${stringValue.trim()}"` : "undefined";
      case "figma.string":
        return layerPath.trim()
          ? `figma.string('${layerPath.trim()}')`
          : "undefined";
      case "figma.textContent":
        return layerPath.trim()
          ? `figma.textContent('${layerPath.trim()}')`
          : "undefined";
      case "figma.children":
        return layerPath.trim()
          ? `figma.children(['${layerPath.trim()}'])`
          : "undefined";
      case "figma.nestedProps":
        if (!parentLayer.trim()) return "undefined";
        const props = nestedProps
          .filter((np) => np.reactProp.trim() && np.figmaProp.trim())
          .map((np) => {
            const figmaCall =
              np.type === "textContent"
                ? "textContent"
                : np.type === "children"
                  ? "children"
                  : np.type === "boolean"
                    ? "boolean"
                    : "string";
            return `    ${np.reactProp.trim()}: figma.${figmaCall}('${np.figmaProp.trim()}')`;
          })
          .join(",\n");
        return `figma.nestedProps('${parentLayer.trim()}', {\n${props},\n  })`;
      default:
        return "undefined";
    }
  };

  const handleVisualChange = () => {
    const generated = generateValue();
    onChange(generated);
  };

  const handleTypeChange = (newType: ValueType) => {
    setVisualType(newType);
    setStringValue("");
    setLayerPath("");
    setParentLayer("");
    setNestedProps([]);
    const newValue = newType === "undefined" ? "undefined" : "";
    onChange(newValue);
  };

  const addNestedProp = () => {
    setNestedProps([...nestedProps, makeNestedPropDef()]);
  };

  const removeNestedProp = (id: string) => {
    setNestedProps(nestedProps.filter((np) => np.id !== id));
    setTimeout(handleVisualChange, 0);
  };

  const updateNestedProp = (id: string, fields: Partial<NestedPropDef>) => {
    setNestedProps(
      nestedProps.map((np) => {
        if (np.id !== id) return np;
        const updated = { ...np, ...fields };
        if (fields.figmaProp !== undefined && !np.reactProp) {
          updated.reactProp = toCamelCase(fields.figmaProp);
        }
        return updated;
      }),
    );
    setTimeout(handleVisualChange, 0);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setMode(mode === "visual" ? "manual" : "visual")}
          className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-neutral-400 hover:text-neutral-200 transition-colors rounded border border-neutral-700 hover:border-neutral-600"
        >
          {mode === "visual" ? (
            <>
              <Code size={12} />
              Manual
            </>
          ) : (
            <>
              <Blocks size={12} />
              Visual
            </>
          )}
        </button>
      </div>

      {mode === "manual" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className={cn(
            "flex w-full rounded-md border bg-neutral-900 px-3 py-2 font-mono text-xs text-neutral-100 transition-colors resize-y",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 placeholder-neutral-500",
            error ? "border-danger-300" : "border-neutral-700",
          )}
        />
      ) : (
        <div className="space-y-3 rounded-md border border-neutral-700 bg-neutral-900/50 p-3">
          <select
            value={visualType}
            onChange={(e) => handleTypeChange(e.target.value as ValueType)}
            className="flex h-8 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-xs text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {visualType === "stringLiteral" && (
            <input
              type="text"
              value={stringValue}
              onChange={(e) => {
                setStringValue(e.target.value);
                handleVisualChange();
              }}
              placeholder="Enter string value"
              className="flex h-8 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-xs text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            />
          )}

          {(visualType === "figma.string" ||
            visualType === "figma.textContent" ||
            visualType === "figma.children") && (
            <input
              type="text"
              value={layerPath}
              onChange={(e) => {
                setLayerPath(e.target.value);
                handleVisualChange();
              }}
              placeholder="Layer name or path (e.g., Icon, error)"
              className="flex h-8 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-xs text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            />
          )}

          {visualType === "figma.nestedProps" && (
            <div className="space-y-2">
              <input
                type="text"
                value={parentLayer}
                onChange={(e) => {
                  setParentLayer(e.target.value);
                  handleVisualChange();
                }}
                placeholder="Parent layer name (e.g., _Error Message)"
                className="flex h-8 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-xs text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
              <div className="space-y-2">
                {nestedProps.map((np) => (
                  <div key={np.id} className="flex gap-2 items-start">
                    <input
                      type="text"
                      value={np.reactProp}
                      onChange={(e) =>
                        updateNestedProp(np.id, { reactProp: e.target.value })
                      }
                      placeholder="React prop"
                      className="flex h-7 flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 text-[11px] text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
                    />
                    <input
                      type="text"
                      value={np.figmaProp}
                      onChange={(e) =>
                        updateNestedProp(np.id, { figmaProp: e.target.value })
                      }
                      placeholder="Figma layer"
                      className="flex h-7 flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 text-[11px] text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
                    />
                    <select
                      value={np.type}
                      onChange={(e) =>
                        updateNestedProp(np.id, {
                          type: e.target.value as NestedPropDef["type"],
                        })
                      }
                      className="flex h-7 rounded-md border border-neutral-700 bg-neutral-900 px-2 text-[11px] text-neutral-100 focus:outline-none"
                    >
                      {NESTED_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeNestedProp(np.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-700 text-neutral-400 hover:border-danger-500 hover:text-danger-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addNestedProp}
                  className="flex h-7 items-center gap-1 px-2 text-[11px] font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  <Plus size={12} />
                  Add Property
                </button>
              </div>
            </div>
          )}

          {visualType === "undefined" && (
            <p className="text-[10px] text-neutral-500 italic">
              The prop will be omitted from the code when this condition is met.
            </p>
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-danger-500">{error}</p>}
    </div>
  );
}

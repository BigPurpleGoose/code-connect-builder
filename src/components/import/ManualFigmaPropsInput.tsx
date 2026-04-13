import { useState } from "react";
import { Plus, X, Code, FormInput, AlertCircle } from "lucide-react";

/**
 * Manual Figma property definition (mirrors FigmaPropertyDefinition)
 */
export interface ManualFigmaProperty {
  name: string;
  type: "BOOLEAN" | "TEXT" | "VARIANT" | "INSTANCE_SWAP";
  defaultValue?: string | boolean;
  variantOptions?: string[];
  description?: string;
}

interface ManualFigmaPropsInputProps {
  properties: ManualFigmaProperty[];
  onChange: (properties: ManualFigmaProperty[]) => void;
}

type InputMode = "form" | "json";

export function ManualFigmaPropsInput({
  properties,
  onChange,
}: ManualFigmaPropsInputProps) {
  const [mode, setMode] = useState<InputMode>("form");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");

  // Form state for adding new property
  const [newProp, setNewProp] = useState<ManualFigmaProperty>({
    name: "",
    type: "TEXT",
  });

  const handleAddProperty = () => {
    if (!newProp.name.trim()) return;

    onChange([...properties, { ...newProp }]);
    setNewProp({ name: "", type: "TEXT" });
  };

  const handleRemoveProperty = (index: number) => {
    onChange(properties.filter((_, i) => i !== index));
  };

  const handleUpdateProperty = (
    index: number,
    updates: Partial<ManualFigmaProperty>,
  ) => {
    const updated = [...properties];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const handleJsonPaste = () => {
    try {
      const parsed = JSON.parse(jsonText);

      // Support both {props: [...]} and direct array
      const propsArray = Array.isArray(parsed) ? parsed : parsed.props;

      if (!Array.isArray(propsArray)) {
        setJsonError("Expected array of properties or {props: [...]} format");
        return;
      }

      // Validate each property
      const validated: ManualFigmaProperty[] = propsArray.map((p: any) => {
        if (!p.name || typeof p.name !== "string") {
          throw new Error("Each property must have a name");
        }
        if (!["BOOLEAN", "TEXT", "VARIANT", "INSTANCE_SWAP"].includes(p.type)) {
          throw new Error(`Invalid type "${p.type}" for property "${p.name}"`);
        }

        return {
          name: p.name,
          type: p.type,
          defaultValue: p.defaultValue,
          variantOptions: p.variantOptions,
          description: p.description,
        };
      });

      onChange(validated);
      setJsonError("");
      setJsonText("");
      setMode("form"); // Switch back to form view after successful paste
    } catch (error) {
      setJsonError(
        error instanceof Error ? error.message : "Invalid JSON format",
      );
    }
  };

  return (
    <div className="space-y-3">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("form")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            mode === "form"
              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          }`}
        >
          <FormInput size={14} />
          Form
        </button>
        <button
          type="button"
          onClick={() => setMode("json")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            mode === "json"
              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          }`}
        >
          <Code size={14} />
          Paste JSON
        </button>
        {properties.length > 0 && (
          <span className="ml-auto text-xs text-neutral-500">
            {properties.length}{" "}
            {properties.length === 1 ? "property" : "properties"}
          </span>
        )}
      </div>

      {/* Form Mode */}
      {mode === "form" && (
        <div className="space-y-3">
          {/* Existing Properties */}
          {properties.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {properties.map((prop, idx) => (
                <PropertyRow
                  key={idx}
                  property={prop}
                  onUpdate={(updates) => handleUpdateProperty(idx, updates)}
                  onRemove={() => handleRemoveProperty(idx)}
                />
              ))}
            </div>
          )}

          {/* Add New Property Form */}
          <div className="border border-zinc-200 dark:border-zinc-700 rounded-md p-3 bg-zinc-50 dark:bg-zinc-800/50">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="new-prop-name"
                  type="text"
                  placeholder="Property name"
                  value={newProp.name}
                  onChange={(e) =>
                    setNewProp({ ...newProp, name: e.target.value })
                  }
                  className="px-2 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  onKeyPress={(e) => e.key === "Enter" && handleAddProperty()}
                />
                <select
                  value={newProp.type}
                  onChange={(e) =>
                    setNewProp({
                      ...newProp,
                      type: e.target.value as ManualFigmaProperty["type"],
                    })
                  }
                  className="px-2 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="TEXT">Text</option>
                  <option value="BOOLEAN">Boolean</option>
                  <option value="VARIANT">Variant</option>
                  <option value="INSTANCE_SWAP">Instance Swap</option>
                </select>
              </div>

              {newProp.type === "VARIANT" && (
                <textarea
                  aria-label="Variant options"
                  placeholder="Variant options (one per line)"
                  value={newProp.variantOptions?.join("\n") || ""}
                  onChange={(e) =>
                    setNewProp({
                      ...newProp,
                      variantOptions: e.target.value
                        .split("\n")
                        .filter((s) => s.trim()),
                    })
                  }
                  className="w-full px-2 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  rows={3}
                />
              )}

              <button
                type="button"
                onClick={handleAddProperty}
                disabled={!newProp.name.trim()}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={14} />
                Add Property
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Mode */}
      {mode === "json" && (
        <div className="space-y-2">
          <textarea
            aria-label="JSON schema input"
            placeholder={`Paste JSON schema:
[
  {"name": "variant", "type": "VARIANT", "variantOptions": ["primary", "secondary"]},
  {"name": "disabled", "type": "BOOLEAN"},
  {"name": "label", "type": "TEXT"}
]`}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            rows={10}
          />
          {jsonError && (
            <div className="flex items-start gap-2 p-2 rounded bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
              <AlertCircle
                size={14}
                className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
              />
              <p className="text-xs text-red-700 dark:text-red-300">
                {jsonError}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleJsonPaste}
            disabled={!jsonText.trim()}
            className="w-full px-3 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Import from JSON
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Individual property row component for editing
 */
function PropertyRow({
  property,
  onUpdate,
  onRemove,
}: {
  property: ManualFigmaProperty;
  onUpdate: (updates: Partial<ManualFigmaProperty>) => void;
  onRemove: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 p-2">
      <div className="flex items-center gap-2">
        <input
          id={`prop-name-${property.name}`}
          type="text"
          value={property.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="flex-1 px-2 py-1 text-sm font-mono border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
        />
        <select
          value={property.type}
          onChange={(e) =>
            onUpdate({ type: e.target.value as ManualFigmaProperty["type"] })
          }
          className="px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
        >
          <option value="TEXT">Text</option>
          <option value="BOOLEAN">Boolean</option>
          <option value="VARIANT">Variant</option>
          <option value="INSTANCE_SWAP">Instance Swap</option>
        </select>
        {property.type === "VARIANT" && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isExpanded ? "Hide" : "Options"}
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {isExpanded && property.type === "VARIANT" && (
        <textarea
          aria-label="Variant options for this property"
          placeholder="Variant options (one per line)"
          value={property.variantOptions?.join("\n") || ""}
          onChange={(e) =>
            onUpdate({
              variantOptions: e.target.value
                .split("\n")
                .filter((s) => s.trim()),
            })
          }
          className="w-full mt-2 px-2 py-1.5 text-sm font-mono border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
          rows={3}
        />
      )}
    </div>
  );
}

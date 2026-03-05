import React from "react";
import { Plus, X, Code } from "lucide-react";
import type { PropDef, EnumOption } from "@/types/connection";
import { cn } from "@/components/ui/cn";
import { makeEnumOption } from "@/utils/defaults";

interface EnumEditorProps {
  prop: Extract<PropDef, { type: "enum" }>;
  onChange: (updated: Extract<PropDef, { type: "enum" }>) => void;
  errors?: Record<string, string>;
}

export function EnumEditor({ prop, onChange, errors = {} }: EnumEditorProps) {
  const updateOptions = (options: EnumOption[]) =>
    onChange({ ...prop, enumOptions: options });

  const updateOption = (index: number, fields: Partial<EnumOption>) => {
    const next = prop.enumOptions.map((o, i) =>
      i === index ? { ...o, ...fields } : o,
    );
    updateOptions(next);
  };

  const addOption = () =>
    updateOptions([...prop.enumOptions, makeEnumOption()]);

  const removeOption = (index: number) =>
    updateOptions(prop.enumOptions.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center mb-1">
        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
          Figma Option
        </span>
        <span className="w-6" />
        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
          React Value
        </span>
        <span className="w-6" />
      </div>

      {/* Option rows */}
      <div className="space-y-2">
        {prop.enumOptions.map((opt, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center"
          >
            {/* Figma option name */}
            <input
              id={`enum-figma-${prop.id}-${i}`}
              type="text"
              value={opt.figma || ""}
              onChange={(e) => updateOption(i, { figma: e.target.value })}
              placeholder="Figma option name"
              className="h-8 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2.5 text-xs text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 placeholder:text-neutral-500"
            />
            <span className="text-neutral-400 text-xs font-mono">→</span>

            {/* React value + code toggle */}
            <div className="relative flex items-center">
              <input
                id={`enum-react-${prop.id}-${i}`}
                type="text"
                value={opt.react || ""}
                onChange={(e) => updateOption(i, { react: e.target.value })}
                placeholder={
                  opt.isCode ? "Raw JS value" : "React value (string)"
                }
                className={cn(
                  "h-8 w-full rounded-md border px-2.5 pr-8 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 placeholder:text-neutral-500",
                  opt.isCode
                    ? "bg-primary-900/20 border-primary-700 text-primary-300 placeholder:text-primary-400"
                    : "bg-neutral-900 border-neutral-700 text-neutral-100",
                )}
              />
              <button
                type="button"
                onClick={() => updateOption(i, { isCode: !opt.isCode })}
                title={
                  opt.isCode
                    ? "Treating as raw JS — click to treat as string"
                    : "Click to treat as raw JS code (not a string)"
                }
                className={cn(
                  "absolute right-1.5 rounded p-0.5 transition-colors",
                  opt.isCode
                    ? "text-primary-600 bg-primary-100"
                    : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100",
                )}
              >
                <Code className="h-3 w-3" />
              </button>
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={() => removeOption(i)}
              className="text-neutral-400 hover:text-danger-500 transition-colors rounded p-0.5"
              disabled={prop.enumOptions.length <= 1}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Errors */}
      {errors.enumOptions && (
        <p className="text-[11px] text-danger-500">{errors.enumOptions}</p>
      )}

      {/* Add row */}
      <button
        type="button"
        onClick={addOption}
        className="mt-1 flex items-center gap-1 text-[11px] text-primary-600 hover:text-primary-700 font-medium transition-colors"
      >
        <Plus className="h-3 w-3" /> Add Option
      </button>

      {/* Code toggle explainer */}
      <div className="rounded-md bg-neutral-800 border border-neutral-700 p-2.5 text-[10px] text-neutral-400 leading-relaxed">
        <strong className="text-neutral-300">{"{}"} Code toggle:</strong> By
        default, React values are treated as strings (wrapped in quotes). Toggle
        the <Code className="inline h-3 w-3 text-primary-400" /> button on a row
        when the React value is raw JavaScript — e.g.{" "}
        <code className="font-mono">true</code>,{" "}
        <code className="font-mono">42</code>, or JSX like{" "}
        <code className="font-mono">{"<Icon />"}</code>.
      </div>
    </div>
  );
}

import React from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { cn } from "@/components/ui/cn";
import type { PropDef, BooleanMode } from "@/types/connection";
import { BooleanValueBuilder } from "./BooleanValueBuilder";

interface BooleanEditorProps {
  prop: Extract<PropDef, { type: "boolean" }>;
  onChange: (updated: Extract<PropDef, { type: "boolean" }>) => void;
  errors?: Record<string, string>;
}

const MODES: { value: BooleanMode; label: string; description: string }[] = [
  {
    value: "simple",
    label: "Simple",
    description: "Direct boolean pass-through",
  },
  {
    value: "inverse",
    label: "Inverse",
    description: "Flips true ↔ false (e.g. Enable → disable)",
  },
  {
    value: "visibility",
    label: "Visibility",
    description: "Shows a child layer when true, hides it when false",
  },
  {
    value: "complex",
    label: "Custom",
    description: "Map each boolean state to a custom value",
  },
];

export function BooleanEditor({
  prop,
  onChange,
  errors = {},
}: BooleanEditorProps) {
  const update = (fields: Partial<typeof prop>) =>
    onChange({ ...prop, ...fields });

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <RadioGroup.Root
        value={prop.boolMode}
        onValueChange={(v) => update({ boolMode: v as BooleanMode })}
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {MODES.map((mode) => (
          <RadioGroup.Item key={mode.value} value={mode.value} asChild>
            <button
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                prop.boolMode === mode.value
                  ? "border-primary-500 bg-primary-900/20 text-primary-300"
                  : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800",
              )}
            >
              <span className="text-xs font-semibold leading-none">
                {mode.label}
              </span>
              <span className="text-[10px] leading-snug opacity-70">
                {mode.description}
              </span>
            </button>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>

      {/* Simple: just a description */}
      {prop.boolMode === "simple" && (
        <p className="text-[11px] text-neutral-400 italic">
          Outputs:{" "}
          <code className="font-mono text-neutral-600">
            figma.boolean(&#34;{prop.figmaProp || "propName"}&#34;)
          </code>
          <br />
          The Figma boolean property value maps directly to the React prop.
        </p>
      )}

      {/* Inverse: just a description */}
      {prop.boolMode === "inverse" && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800 leading-relaxed">
          <strong>When to use:</strong> The Figma control is logically opposite
          to the React prop. For example, Figma has an &#34;Enable Arrow&#34;
          toggle but the React component uses a{" "}
          <code className="font-mono">disableArrow</code> prop.
          <br />
          <br />
          Outputs:{" "}
          <code className="font-mono">{"{ true: false, false: true }"}</code>
        </div>
      )}

      {/* Visibility: layer name input */}
      {prop.boolMode === "visibility" && (
        <div className="space-y-2">
          <label
            htmlFor="bool-child-layer"
            className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block"
          >
            Canvas Layer Name to Show
          </label>
          <input
            id="bool-child-layer"
            type="text"
            value={prop.boolChildLayer || ""}
            onChange={(e) => update({ boolChildLayer: e.target.value })}
            placeholder="e.g. Icon Layer, Start Icon"
            className={cn(
              "flex h-9 w-full rounded-md border bg-neutral-900 px-3 text-sm text-neutral-100 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
              errors.boolChildLayer
                ? "border-danger-300"
                : "border-neutral-700",
            )}
          />
          {errors.boolChildLayer && (
            <p className="text-[11px] text-danger-500">
              {errors.boolChildLayer}
            </p>
          )}
          <p className="text-[10px] text-neutral-400 leading-relaxed">
            When the Figma boolean is <strong>true</strong>, this layer is
            passed as{" "}
            <code className="font-mono">
              figma.children(&#34;Layer Name&#34;)
            </code>
            . When <strong>false</strong>, the prop is{" "}
            <code className="font-mono">undefined</code> and disappears from the
            code snippet.
          </p>
        </div>
      )}

      {/* Complex: true/false value inputs */}
      {prop.boolMode === "complex" && (
        <div className="space-y-4">
          <BooleanValueBuilder
            label="When True"
            value={prop.boolTrueValue || ""}
            onChange={(v) => update({ boolTrueValue: v })}
            placeholder="Value when boolean is true"
          />
          <BooleanValueBuilder
            label="When False"
            value={prop.boolFalseValue || ""}
            onChange={(v) => update({ boolFalseValue: v })}
            placeholder="Value when boolean is false"
          />
          <p className="text-[10px] text-neutral-400">
            Use <strong>Visual mode</strong> to compose{" "}
            <code className="font-mono">figma.*</code> calls with a guided UI,
            or <strong>Manual mode</strong> for custom JavaScript expressions.
          </p>
        </div>
      )}
    </div>
  );
}

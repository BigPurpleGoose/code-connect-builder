import React from "react";
import { Plus, X } from "lucide-react";
import type { PropDef } from "@/types/connection";
import { cn } from "@/components/ui/cn";

interface ChildrenEditorProps {
  prop: Extract<PropDef, { type: "children" }>;
  onChange: (updated: Extract<PropDef, { type: "children" }>) => void;
}

export function ChildrenEditor({ prop, onChange }: ChildrenEditorProps) {
  const layers = prop.childrenLayers;
  const isWildcard = layers.length === 1 && layers[0] === "*";

  const updateLayers = (next: string[]) =>
    onChange({ ...prop, childrenLayers: next });

  const addLayer = () => updateLayers([...layers.filter((l) => l !== "*"), ""]);

  const updateLayer = (i: number, value: string) =>
    updateLayers(layers.map((l, idx) => (idx === i ? value : l)));

  const removeLayer = (i: number) => {
    const next = layers.filter((_, idx) => idx !== i);
    updateLayers(next.length === 0 ? [""] : next);
  };

  const toggleWildcard = () => {
    if (isWildcard) {
      updateLayers([""]);
    } else {
      updateLayers(["*"]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Wildcard toggle */}
      <label className="flex items-center gap-2 cursor-pointer group w-fit">
        <div
          onClick={toggleWildcard}
          className={cn(
            "relative h-5 w-9 rounded-full transition-colors cursor-pointer",
            isWildcard ? "bg-primary-500" : "bg-neutral-300",
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
              isWildcard ? "translate-x-4" : "translate-x-0.5",
            )}
          />
        </div>
        <span className="text-xs text-neutral-600 font-medium">
          Use wildcard (<code className="font-mono">*</code>) — pass all child
          layers
        </span>
      </label>

      {/* Named layer list */}
      {!isWildcard && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Figma Layer Names
          </p>
          {layers.map((layer, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                id={`layer-name-${prop.id}-${i}`}
                type="text"
                value={layer || ""}
                onChange={(e) => updateLayer(i, e.target.value)}
                placeholder={`Layer name ${i + 1}`}
                className="h-8 flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-2.5 text-xs text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 placeholder:text-neutral-500"
              />
              <button
                type="button"
                onClick={() => removeLayer(i)}
                disabled={layers.length <= 1}
                className="text-neutral-400 hover:text-danger-500 disabled:opacity-30 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addLayer}
            className="flex items-center gap-1 text-[11px] text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="h-3 w-3" /> Add Layer
          </button>
        </div>
      )}

      <p className="text-[10px] text-neutral-400 leading-relaxed">
        {isWildcard ? (
          <>
            All child layers in the Figma component will be passed through.
            Generates: <code className="font-mono">figma.children(['*'])</code>
          </>
        ) : layers.length === 1 ? (
          'A single named layer passes as a string: figma.children("LayerName")'
        ) : (
          'Multiple layers pass as an array: figma.children(["Layer1", "Layer2"])'
        )}
      </p>
    </div>
  );
}

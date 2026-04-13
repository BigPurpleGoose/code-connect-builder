import React from "react";
import { HelpCircle } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { PROP_TYPE_DOCS } from "@/utils/docs";
import type { PropType } from "@/types/connection";

interface PropTypeTooltipProps {
  propType: PropType;
}

export function PropTypeTooltip({ propType }: PropTypeTooltipProps) {
  const doc = PROP_TYPE_DOCS[propType];
  if (!doc) return null;

  const content = (
    <div className="space-y-2 max-w-[280px]">
      <p className="font-semibold text-white">{doc.label}</p>
      <p className="text-neutral-300 leading-relaxed">{doc.description}</p>
      <div className="border-t border-neutral-700 pt-2">
        <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
          When to use
        </p>
        <p className="text-neutral-300">{doc.whenToUse}</p>
      </div>
      <div className="bg-neutral-800 rounded p-2">
        <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
          Output example
        </p>
        <code className="text-emerald-400 text-[10px] font-mono whitespace-pre-wrap">
          {doc.exampleOutput}
        </code>
      </div>
      {doc.inkPattern && (
        <div className="border-t border-slate-700 pt-2">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
            Ink DS Pattern
          </p>
          <p className="text-slate-300 whitespace-pre-line">{doc.inkPattern}</p>
        </div>
      )}
    </div>
  );

  return (
    <Tooltip content={content} side="right" align="start" delayDuration={300}>
      <button
        type="button"
        className="inline-flex items-center text-slate-400 hover:text-blue-500 transition-colors"
        aria-label={`Help for ${doc.label} prop type`}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
    </Tooltip>
  );
}

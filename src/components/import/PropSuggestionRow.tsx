import { Ban, CheckCircle2, AlertTriangle } from "lucide-react";
import type { PropMatchResult } from "@/utils/propMatcher";
import { getConfidenceLabel, getConfidenceColor } from "@/utils/propMatcher";

interface PropSuggestionRowProps {
  match: PropMatchResult;
}

/**
 * Display a React prop with its ranked Figma property suggestions.
 * Shows pattern detection, confidence scores, and semantic compatibility.
 */
export function PropSuggestionRow({ match }: PropSuggestionRowProps) {
  const { reactProp, reactType, pattern, rankedSuggestions } = match;

  // Show incompatibility icon for calculated/handler props
  const isIncompatible = pattern?.isCalculated || pattern?.isHandler;

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 p-3 space-y-2">
      {/* React Prop Header */}
      <div className="flex items-start gap-2">
        <div className="mt-0.5">
          {isIncompatible ? (
            <Ban size={16} className="text-red-500" />
          ) : rankedSuggestions && rankedSuggestions.length > 0 ? (
            <CheckCircle2 size={16} className="text-emerald-500" />
          ) : (
            <AlertTriangle size={16} className="text-amber-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono font-medium text-zinc-900 dark:text-zinc-100">
              {reactProp}
            </code>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {reactType}
            </span>
          </div>
          {pattern && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
              {pattern.reason}
            </p>
          )}
        </div>
      </div>

      {/* Ranked Suggestions */}
      {isIncompatible ? (
        <div className="pl-6 text-xs text-red-600 dark:text-red-400">
          Cannot map to Figma: {pattern?.reason}
        </div>
      ) : rankedSuggestions && rankedSuggestions.length > 0 ? (
        <div className="pl-6 space-y-1.5">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Suggested matches:
          </p>
          {rankedSuggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2 px-2 py-1.5 rounded text-xs ${
                idx === 0
                  ? "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800"
                  : "bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
              }`}
            >
              {/* Rank Badge */}
              <span
                className={`flex-shrink-0 font-bold ${
                  idx === 0
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                #{idx + 1}
              </span>

              {/* Suggestion Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                    {suggestion.figmaProp}
                  </code>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {suggestion.figmaType}
                  </span>
                  <span
                    className={`font-medium ${getConfidenceColor(suggestion.confidence)}`}
                  >
                    {getConfidenceLabel(suggestion.confidence)}
                  </span>
                  {suggestion.semanticCompatibility === "incompatible" && (
                    <span className="text-red-600 dark:text-red-400">
                      ⚠️ Incompatible
                    </span>
                  )}
                  {suggestion.semanticCompatibility === "warning" && (
                    <span className="text-amber-600 dark:text-amber-400">
                      ⚠️ Warning
                    </span>
                  )}
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                  {suggestion.reasoning}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="pl-6 text-xs text-amber-600 dark:text-amber-400">
          No matching Figma properties found
        </div>
      )}
    </div>
  );
}

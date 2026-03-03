import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useConnection } from "@/contexts/ConnectionContext";
import { buildValidationMap, validateDefinition } from "@/utils/validation";
import { cn } from "@/components/ui/cn";

export function ValidationBar() {
  const { definitions } = useConnection();

  // Count only blocking errors across ALL definitions (warnings don't block generation)
  let totalPropErrors = 0;
  let totalDefErrors = 0;
  const defErrorNames: string[] = [];

  for (const def of definitions) {
    const propMap = buildValidationMap(def);
    const defErrs = validateDefinition(def);
    // Only count blocking errors (severity: 'error' or absent)
    const blockingPropErrors = Object.values(propMap)
      .flat()
      .filter((e) => !e.severity || e.severity === "error").length;
    const defCount = Object.keys(defErrs).length;
    totalPropErrors += blockingPropErrors;
    totalDefErrors += defCount;
    if (blockingPropErrors + defCount > 0)
      defErrorNames.push(def.name || "Unnamed");
  }

  const totalErrors = totalPropErrors + totalDefErrors;

  if (totalErrors === 0) {
    return (
      <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-6 py-2">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
        <p className="text-[11px] font-medium text-emerald-700">
          All fields look good — ready to copy the generated code.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-2 border-b bg-amber-50 border-amber-100 px-6 py-2",
      )}
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-[1px]" />
      <p className="text-[11px] font-medium text-amber-800 leading-relaxed">
        {totalErrors} issue{totalErrors !== 1 ? "s" : ""} to fix
        {defErrorNames.length > 0 && (
          <span className="font-normal text-amber-700">
            {" "}
            in: {defErrorNames.join(", ")}
          </span>
        )}
        <span className="ml-1 font-normal text-amber-600">
          — Required fields are highlighted in the editor below.
        </span>
      </p>
    </div>
  );
}

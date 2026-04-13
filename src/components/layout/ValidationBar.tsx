import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { useConnection } from "@/contexts/ConnectionContext";
import { buildValidationMap, validateDefinition } from "@/utils/validation";
import { cn } from "@/components/ui/cn";

export function ValidationBar() {
  const { definitions } = useConnection();

  // Count only blocking errors across ALL definitions (warnings don't block generation)
  let totalPropErrors = 0;
  let totalDefErrors = 0;
  let totalWarnings = 0;
  let totalProps = 0;
  let mappedProps = 0;
  const defErrorNames: string[] = [];

  for (const def of definitions) {
    const propMap = buildValidationMap(def);
    const defErrs = validateDefinition(def);

    // Count total props and mapped props
    totalProps += def.props.length;
    mappedProps += def.props.filter(
      (p) => p.reactProp.trim() && p.figmaProp.trim(),
    ).length;

    // Count blocking errors and warnings
    const allErrors = Object.values(propMap).flat();
    const blockingPropErrors = allErrors.filter(
      (e) => !e.severity || e.severity === "error",
    ).length;
    const warningCount = allErrors.filter(
      (e) => e.severity === "warning",
    ).length;

    const defCount = Object.keys(defErrs).length;
    totalPropErrors += blockingPropErrors;
    totalDefErrors += defCount;
    totalWarnings += warningCount;

    if (blockingPropErrors + defCount > 0)
      defErrorNames.push(def.name || "Unnamed");
  }

  const totalErrors = totalPropErrors + totalDefErrors;
  const completionPercentage =
    totalProps > 0 ? Math.round((mappedProps / totalProps) * 100) : 0;

  // Determine health status
  const getHealthStatus = () => {
    if (totalErrors > 0) return "error";
    if (totalWarnings > 0) return "warning";
    if (completionPercentage < 100) return "incomplete";
    return "success";
  };

  const healthStatus = getHealthStatus();

  if (healthStatus === "success") {
    return (
      <div className="border-b border-success-100 bg-success-50">
        <div className="flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success-500" />
            <p className="text-[11px] font-medium text-success-600">
              All fields complete — ready to generate code
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-success-600">
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span className="font-semibold">
                {completionPercentage}%
              </span>{" "}
              mapped
            </div>
            <span className="text-success-400">•</span>
            <span>
              {mappedProps}/{totalProps} props
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-b",
        healthStatus === "error"
          ? "bg-danger-50 border-danger-100"
          : healthStatus === "warning"
            ? "bg-warning-50 border-warning-100"
            : "bg-blue-50 border-blue-100",
      )}
    >
      {/* Progress bar */}
      <div className="h-1 bg-neutral-200/50">
        <div
          className={cn(
            "h-full transition-all duration-300",
            healthStatus === "error"
              ? "bg-danger-500"
              : healthStatus === "warning"
                ? "bg-warning-500"
                : "bg-blue-500",
          )}
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-6 py-2">
        <div className="flex items-start gap-2">
          {healthStatus === "error" ? (
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-danger-500 mt-[1px]" />
          ) : healthStatus === "warning" ? (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning-500 mt-[1px]" />
          ) : (
            <Activity className="h-3.5 w-3.5 shrink-0 text-blue-500 mt-[1px]" />
          )}
          <div className="space-y-0.5">
            <p
              className={cn(
                "text-[11px] font-medium leading-relaxed",
                healthStatus === "error"
                  ? "text-danger-600"
                  : healthStatus === "warning"
                    ? "text-warning-600"
                    : "text-blue-600",
              )}
            >
              {totalErrors > 0 ? (
                <>
                  {totalErrors} error{totalErrors !== 1 ? "s" : ""} to fix
                  {defErrorNames.length > 0 && (
                    <span className="font-normal">
                      {" "}
                      in: {defErrorNames.join(", ")}
                    </span>
                  )}
                </>
              ) : totalWarnings > 0 ? (
                `${totalWarnings} warning${totalWarnings !== 1 ? "s" : ""} — review recommended`
              ) : (
                "In progress — complete all prop mappings"
              )}
            </p>
            {totalErrors > 0 && (
              <p
                className={cn(
                  "text-[10px]",
                  healthStatus === "error"
                    ? "text-danger-600/70"
                    : "text-warning-600/70",
                )}
              >
                Required fields are highlighted in the editor below
              </p>
            )}
          </div>
        </div>

        {/* Health metrics */}
        <div className="flex items-center gap-3 text-[10px]">
          <div
            className={cn(
              "flex items-center gap-1 font-semibold",
              healthStatus === "error"
                ? "text-danger-600"
                : healthStatus === "warning"
                  ? "text-warning-600"
                  : "text-blue-600",
            )}
          >
            <Activity className="h-3 w-3" />
            <span className="text-xs">{completionPercentage}%</span>
          </div>
          <span className="text-neutral-400">•</span>
          <span
            className={cn(
              "font-medium",
              healthStatus === "error"
                ? "text-danger-600"
                : healthStatus === "warning"
                  ? "text-warning-600"
                  : "text-blue-600",
            )}
          >
            {mappedProps}/{totalProps} props
          </span>
          {totalErrors > 0 && (
            <>
              <span className="text-neutral-400">•</span>
              <span className="text-danger-600 font-medium">
                {totalErrors} error{totalErrors !== 1 ? "s" : ""}
              </span>
            </>
          )}
          {totalWarnings > 0 && (
            <>
              <span className="text-neutral-400">•</span>
              <span className="text-warning-600 font-medium">
                {totalWarnings} warning{totalWarnings !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

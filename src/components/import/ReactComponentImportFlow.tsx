/**
 * ReactComponentImportFlow
 *
 * Improved multi-step import flow for React components:
 * 1. Upload React component file
 * 2. Auto-detect props from TypeScript interfaces
 * 3. Preview and edit detected props
 * 4. (Optional) Add Figma properties for intelligent matching
 * 5. Import into project
 */

import React, { useState, useCallback } from "react";
import {
  Upload,
  ArrowRight,
  ArrowLeft,
  Check,
  FileCode,
  Wand2,
  Settings,
} from "lucide-react";
import type { ComponentDefinition } from "@/types/connection";
import {
  parseReactComponentFile,
  parseReactComponentFileWithManualFigma,
  type EnhancedParseResult,
} from "@/utils/importParser";
import type { ManualFigmaProperty } from "./ManualFigmaPropsInput";
import { ManualFigmaPropsInput } from "./ManualFigmaPropsInput";
import { PropSuggestionRow } from "./PropSuggestionRow";
import { getConfidenceLabel, getConfidenceColor } from "@/utils/propMatcher";

type Step = "upload" | "preview" | "figma-mapping" | "review";

interface ParsedComponent {
  filename: string;
  definition: ComponentDefinition;
  enhancedResult?: EnhancedParseResult;
}

interface ReactComponentImportFlowProps {
  onImport: (definitions: ComponentDefinition[]) => void;
  onCancel: () => void;
}

export function ReactComponentImportFlow({
  onImport,
  onCancel,
}: ReactComponentImportFlowProps) {
  const [step, setStep] = useState<Step>("upload");
  const [parsedComponent, setParsedComponent] =
    useState<ParsedComponent | null>(null);
  const [manualFigmaProps, setManualFigmaProps] = useState<
    ManualFigmaProperty[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Step 1: Upload and parse React component
  const handleFileUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0]; // Single file for now
    setIsProcessing(true);

    try {
      const content = await file.text();
      const definition = parseReactComponentFile(content, file.name);

      setParsedComponent({
        filename: file.name,
        definition,
      });

      setStep("preview");
    } catch (error) {
      console.error("Failed to parse component:", error);
      alert(
        `Failed to parse component: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Step 2 → Step 3: Apply Figma mapping
  const handleApplyFigmaMapping = useCallback(async () => {
    if (!parsedComponent || manualFigmaProps.length === 0) return;

    setIsProcessing(true);

    try {
      const content = await fetch(parsedComponent.filename)
        .then((r) => r.text())
        .catch(() => {
          // If file not available, we already have the definition, just enhance it
          return "";
        });

      // Re-parse with Figma properties for intelligent matching
      if (content) {
        const enhancedResult = await parseReactComponentFileWithManualFigma(
          content,
          parsedComponent.filename,
          manualFigmaProps,
        );

        setParsedComponent({
          ...parsedComponent,
          definition: enhancedResult.definition,
          enhancedResult,
        });
      }

      setStep("review");
    } catch (error) {
      console.error("Failed to apply Figma mapping:", error);
      alert(
        `Failed to apply mapping: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsProcessing(false);
    }
  }, [parsedComponent, manualFigmaProps]);

  // Skip Figma mapping
  const handleSkipFigmaMapping = useCallback(() => {
    setStep("review");
  }, []);

  // Import
  const handleImport = useCallback(() => {
    if (!parsedComponent) return;
    onImport([parsedComponent.definition]);
  }, [parsedComponent, onImport]);

  return (
    <div className="flex flex-col h-full">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 py-4 px-6 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
        <StepIndicator
          number={1}
          label="Upload"
          active={step === "upload"}
          completed={step !== "upload"}
        />
        <ArrowRight size={14} className="text-zinc-400" />
        <StepIndicator
          number={2}
          label="Preview Props"
          active={step === "preview"}
          completed={step === "figma-mapping" || step === "review"}
        />
        <ArrowRight size={14} className="text-zinc-400" />
        <StepIndicator
          number={3}
          label="Figma Mapping"
          active={step === "figma-mapping"}
          completed={step === "review"}
          optional
        />
        <ArrowRight size={14} className="text-zinc-400" />
        <StepIndicator
          number={4}
          label="Review"
          active={step === "review"}
          completed={false}
        />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto p-6">
        {step === "upload" && (
          <UploadStep
            onFileUpload={handleFileUpload}
            isProcessing={isProcessing}
          />
        )}

        {step === "preview" && parsedComponent && (
          <PreviewStep
            parsedComponent={parsedComponent}
            onNext={() => setStep("figma-mapping")}
            onEdit={(updated) =>
              setParsedComponent({ ...parsedComponent, definition: updated })
            }
          />
        )}

        {step === "figma-mapping" && (
          <FigmaMappingStep
            manualFigmaProps={manualFigmaProps}
            onPropsChange={setManualFigmaProps}
            onApply={handleApplyFigmaMapping}
            onSkip={handleSkipFigmaMapping}
            isProcessing={isProcessing}
          />
        )}

        {step === "review" && parsedComponent && (
          <ReviewStep
            parsedComponent={parsedComponent}
            onBack={() => setStep("figma-mapping")}
            onImport={handleImport}
          />
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          Cancel
        </button>

        <div className="flex items-center gap-3">
          {step === "preview" && (
            <button
              onClick={() => setStep("upload")}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <ArrowLeft size={14} />
              Back
            </button>
          )}

          {step === "figma-mapping" && (
            <button
              onClick={() => setStep("preview")}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <ArrowLeft size={14} />
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step Components ──────────────────────────────────────────────────────────

function StepIndicator({
  number,
  label,
  active,
  completed,
  optional,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors ${
          completed
            ? "bg-green-500 text-white"
            : active
              ? "bg-blue-500 text-white"
              : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
        }`}
      >
        {completed ? <Check size={14} /> : number}
      </div>
      <span
        className={`text-xs font-medium ${
          active
            ? "text-zinc-900 dark:text-zinc-100"
            : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        {label}
        {optional && <span className="text-zinc-400 ml-1">(opt)</span>}
      </span>
    </div>
  );
}

function UploadStep({
  onFileUpload,
  isProcessing,
}: {
  onFileUpload: (files: File[]) => void;
  isProcessing: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files).filter(
        (f) => f.name.endsWith(".tsx") || f.name.endsWith(".ts"),
      );
      if (files.length) onFileUpload(files);
    },
    [onFileUpload],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length) onFileUpload(files);
    },
    [onFileUpload],
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Upload React Component
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Upload a{" "}
          <code className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs">
            .tsx
          </code>{" "}
          or{" "}
          <code className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs">
            .ts
          </code>{" "}
          file to automatically detect props
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 cursor-pointer transition-colors select-none
          ${
            dragging
              ? "border-blue-400 bg-blue-50 dark:bg-blue-950"
              : "border-zinc-300 dark:border-zinc-600 hover:border-blue-400 dark:hover:border-blue-500 bg-zinc-50 dark:bg-zinc-800"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".tsx,.ts"
          className="sr-only"
          onChange={handleChange}
        />
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Processing component...
            </p>
          </>
        ) : (
          <>
            <Upload size={40} className="text-zinc-400 dark:text-zinc-500" />
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                Drop your React component here
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                or click to browse · supports .tsx and .ts files
              </p>
            </div>
          </>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4">
        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-2">
          💡 What we'll detect:
        </p>
        <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 ml-4 list-disc">
          <li>Component name from filename or export</li>
          <li>Props interface or type definition</li>
          <li>TypeScript types mapped to Figma prop types</li>
          <li>String literal unions as enum options</li>
        </ul>
      </div>
    </div>
  );
}

function PreviewStep({
  parsedComponent,
  onNext,
  onEdit,
}: {
  parsedComponent: ParsedComponent;
  onNext: () => void;
  onEdit: (updated: ComponentDefinition) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Preview Detected Props
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Review the props detected from{" "}
          <code className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-mono">
            {parsedComponent.filename}
          </code>
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 font-mono">
              {parsedComponent.definition.name}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {parsedComponent.definition.props.length} props detected
            </p>
          </div>
          <FileCode size={20} className="text-zinc-400" />
        </div>

        {parsedComponent.definition.props.length > 0 ? (
          <div className="space-y-2">
            {parsedComponent.definition.props.map((prop) => (
              <div
                key={prop.id}
                className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700"
              >
                <div className="flex items-center gap-3">
                  <code className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                    {prop.reactProp}
                  </code>
                  <span className="text-[10px] font-medium text-zinc-400">
                    →
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">
                    {prop.type}
                  </span>
                </div>
                {"figmaProp" in prop && prop.figmaProp && (
                  <code className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    {prop.figmaProp}
                  </code>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-zinc-400">
            <p className="text-sm">No props detected</p>
            <p className="text-xs mt-1">
              You can add them manually after import
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
      >
        Continue to Figma Mapping
        <ArrowRight size={14} />
      </button>
    </div>
  );
}

function FigmaMappingStep({
  manualFigmaProps,
  onPropsChange,
  onApply,
  onSkip,
  isProcessing,
}: {
  manualFigmaProps: ManualFigmaProperty[];
  onPropsChange: (props: ManualFigmaProperty[]) => void;
  onApply: () => void;
  onSkip: () => void;
  isProcessing: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Figma Property Mapping
          </h3>
          <span className="text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
            Optional
          </span>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Define Figma component properties to enable intelligent prop matching
        </p>
      </div>

      <ManualFigmaPropsInput
        properties={manualFigmaProps}
        onChange={onPropsChange}
      />

      <div className="flex items-center gap-3">
        <button
          onClick={onSkip}
          disabled={isProcessing}
          className="flex-1 px-4 py-3 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          Skip for Now
        </button>
        {manualFigmaProps.length > 0 && (
          <button
            onClick={onApply}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Matching...
              </>
            ) : (
              <>
                <Wand2 size={14} />
                Apply Intelligent Matching
              </>
            )}
          </button>
        )}
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md p-4">
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          <strong>Tip:</strong> If you skip this step, you can still manually
          map props after import. Figma properties enable automatic prop
          matching based on naming patterns and types.
        </p>
      </div>
    </div>
  );
}

function ReviewStep({
  parsedComponent,
  onBack,
  onImport,
}: {
  parsedComponent: ParsedComponent;
  onBack: () => void;
  onImport: () => void;
}) {
  const { enhancedResult } = parsedComponent;
  const hasMatchResults =
    enhancedResult?.matchResults && enhancedResult.matchResults.length > 0;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Review & Import
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Final review before importing into your project
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Component Details
            </h4>
            {enhancedResult?.overallConfidence !== undefined && (
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${getConfidenceColor(enhancedResult.overallConfidence)}`}
              >
                {getConfidenceLabel(enhancedResult.overallConfidence)}{" "}
                Confidence
              </span>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">Name:</span>
              <code className="text-zinc-900 dark:text-zinc-100 font-mono">
                {parsedComponent.definition.name}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">Props:</span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {parsedComponent.definition.props.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">File:</span>
              <code className="text-zinc-900 dark:text-zinc-100 font-mono text-xs">
                {parsedComponent.filename}
              </code>
            </div>
          </div>
        </div>

        {hasMatchResults && (
          <div>
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
              Property Matches
            </h4>
            <div className="space-y-2">
              {enhancedResult.matchResults?.map((match, idx) => (
                <PropSuggestionRow key={idx} match={match} />
              ))}
            </div>
          </div>
        )}

        {enhancedResult?.warnings && enhancedResult.warnings.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
              Warnings
            </h4>
            <div className="space-y-1">
              {enhancedResult.warnings.map((warning, idx) => (
                <p
                  key={idx}
                  className={`text-xs ${
                    warning.severity === "error"
                      ? "text-red-600 dark:text-red-400"
                      : warning.severity === "warning"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {warning.message}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-3 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        >
          <Settings size={14} />
          Adjust Mapping
        </button>
        <button
          onClick={onImport}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm rounded-md bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
        >
          <Check size={14} />
          Import Component
        </button>
      </div>
    </div>
  );
}

/**
 * ImportModal - Simplified import flow with two modes:
 *
 * 1. Figma Connect Import: Import existing .figma.tsx files with all mappings
 * 2. React Component Import: Import React .tsx files, auto-detect props from TypeScript
 */

import React, { useState, useCallback, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Upload,
  X,
  FileCode,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { ComponentDefinition } from "@/types/connection";
import {
  parseFigmaConnectFile,
  parseReactComponentFile,
} from "@/utils/importParser";
import { useConnection } from "@/contexts/ConnectionContext";

type ImportMode = "figma" | "react";

interface ParsedFile {
  filename: string;
  definitions: ComponentDefinition[];
  error?: string;
}

export function ImportModal() {
  const { mergeDefinitions } = useConnection();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ImportMode>("figma");
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allDefs = parsedFiles.flatMap((f) => f.definitions);
  const hasErrors = parsedFiles.some((f) => f.error);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      setParsedFiles([]);

      const results: ParsedFile[] = [];

      for (const file of files) {
        try {
          const content = await file.text();

          if (mode === "figma") {
            // Parse .figma.tsx files - returns array of definitions
            const definitions = parseFigmaConnectFile(content);
            results.push({ filename: file.name, definitions });
          } else {
            // Parse React component - returns single definition
            const definition = parseReactComponentFile(content, file.name);
            results.push({ filename: file.name, definitions: [definition] });
          }
        } catch (err) {
          results.push({
            filename: file.name,
            definitions: [],
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      setParsedFiles(results);

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [mode],
  );

  const handleImport = () => {
    if (allDefs.length > 0) {
      mergeDefinitions(allDefs);
      setOpen(false);
      setParsedFiles([]);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setParsedFiles([]);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => (v ? setOpen(true) : handleClose())}
    >
      <Dialog.Trigger asChild>
        <button
          title="Import files"
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-neutral-300 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-600 transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Import</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-neutral-900 shadow-2xl border border-neutral-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-neutral-700">
            <Dialog.Title className="text-lg font-semibold text-neutral-100">
              Import Component
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded p-1 text-neutral-500 hover:text-neutral-300 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode("figma")}
                className={`flex flex-col items-center gap-3 px-4 py-5 rounded-lg border-2 transition-all ${
                  mode === "figma"
                    ? "border-primary-500 bg-primary-900/20 shadow-sm"
                    : "border-neutral-700 hover:border-primary-500/50 hover:bg-neutral-800"
                }`}
              >
                <FileCode
                  className={`h-8 w-8 ${mode === "figma" ? "text-primary-400" : "text-neutral-400"}`}
                />
                <div className="text-center">
                  <div
                    className={`font-semibold text-sm ${mode === "figma" ? "text-primary-300" : "text-neutral-300"}`}
                  >
                    Figma Connect File
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Import .figma.tsx with all mappings
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode("react")}
                className={`flex flex-col items-center gap-3 px-4 py-5 rounded-lg border-2 transition-all ${
                  mode === "react"
                    ? "border-primary-500 bg-primary-900/20 shadow-sm"
                    : "border-neutral-700 hover:border-primary-500/50 hover:bg-neutral-800"
                }`}
              >
                <FileText
                  className={`h-8 w-8 ${mode === "react" ? "text-primary-400" : "text-neutral-400"}`}
                />
                <div className="text-center">
                  <div
                    className={`font-semibold text-sm ${mode === "react" ? "text-primary-300" : "text-neutral-300"}`}
                  >
                    React Component
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Auto-detect props from TypeScript
                  </div>
                </div>
              </button>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Select files
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept={mode === "figma" ? ".tsx" : ".tsx,.ts"}
                multiple
                onChange={handleFileSelect}
                className="block w-full text-sm text-neutral-300
                  file:mr-4 file:py-2.5 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-900/30 file:text-primary-300
                  hover:file:bg-primary-900/50 file:cursor-pointer
                  border border-neutral-700 rounded-lg bg-neutral-900
                  focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              <p className="mt-2 text-xs text-neutral-400">
                {mode === "figma" ? (
                  <>
                    Import existing{" "}
                    <code className="px-1 py-0.5 bg-neutral-800 rounded text-xs text-neutral-300">
                      .figma.tsx
                    </code>{" "}
                    files with complete Code Connect definitions
                  </>
                ) : (
                  <>
                    Import React component files. Props will be auto-detected
                    from TypeScript interfaces.
                    <strong className="block mt-1">
                      After import: add Figma URLs and map prop names in the
                      editor.
                    </strong>
                  </>
                )}
              </p>
            </div>

            {/* Preview */}
            {parsedFiles.length > 0 && (
              <div className="border border-neutral-700 rounded-lg overflow-hidden">
                <div className="bg-neutral-800 px-4 py-2.5 border-b border-neutral-700 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-200">
                    Preview ({allDefs.length} component
                    {allDefs.length !== 1 ? "s" : ""})
                  </h3>
                  <button
                    onClick={() => setParsedFiles([])}
                    className="text-xs text-neutral-400 hover:text-danger-400 transition-colors font-medium"
                  >
                    Clear all
                  </button>
                </div>

                <div className="divide-y divide-neutral-700">
                  {parsedFiles.map((file) => (
                    <div key={file.filename} className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          {file.error ? (
                            <AlertTriangle className="h-4 w-4 text-danger-500" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-success-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-100 truncate">
                            {file.filename}
                          </p>
                          {file.error ? (
                            <p className="text-xs text-danger-400 mt-1">
                              {file.error}
                            </p>
                          ) : (
                            <div className="mt-2 space-y-1.5">
                              {file.definitions.map((def) => (
                                <div
                                  key={def.id}
                                  className="flex items-center justify-between text-xs bg-neutral-800 rounded px-2 py-1.5"
                                >
                                  <span className="font-mono text-neutral-300">
                                    {def.name}
                                  </span>
                                  <span className="text-neutral-400">
                                    {def.props.length} prop
                                    {def.props.length !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-700 bg-neutral-800">
            <Dialog.Close asChild>
              <button className="px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-700 rounded-lg transition-colors">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleImport}
              disabled={allDefs.length === 0 || hasErrors}
              className="px-4 py-2 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Import {allDefs.length > 0 && `(${allDefs.length})`}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * ImportModal
 *
 * Radix Dialog that handles:
 *   Tab 1 – "Code Connect File" – parse .figma.tsx files back into ComponentDefinitions
 *   Tab 2 – "React Component"   – parse .tsx/.ts prop interfaces into starter definitions
 *
 * Parsed results are previewed with per-definition warnings before the user commits.
 * Actions:
 *   "Add to project" → mergeDefinitions (deduplicates by name+url)
 *   "Replace all"    → setDefinitions (after AlertDialog confirmation)
 */

import React, { useCallback, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Separator from "@radix-ui/react-separator";
import {
  Upload,
  X,
  FileCode,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

import type { ComponentDefinition } from "@/types/connection";
import {
  parseFigmaConnectFile,
  parseReactComponentFile,
  getDefinitionWarnings,
} from "@/utils/importParser";
import { useConnection } from "@/contexts/ConnectionContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "connect" | "react";

interface ParsedFile {
  filename: string;
  definitions: ComponentDefinition[];
  rawError?: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        active
          ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function DropZone({
  accept,
  multiple,
  onFiles,
  children,
}: {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  children?: React.ReactNode;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        accept.split(",").some((ext) => f.name.endsWith(ext.trim())),
      );
      if (files.length) onFiles(files);
    },
    [accept, onFiles],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length) onFiles(files);
      // Reset so same file can be re-imported
      if (inputRef.current) inputRef.current.value = "";
    },
    [onFiles],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors select-none
        ${
          dragging
            ? "border-blue-400 bg-blue-50 dark:bg-blue-950"
            : "border-zinc-300 dark:border-zinc-600 hover:border-blue-400 dark:hover:border-blue-500 bg-zinc-50 dark:bg-zinc-800"
        }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={handleChange}
      />
      {children}
    </div>
  );
}

function DefPreviewRow({ def }: { def: ComponentDefinition }) {
  const warnings = getDefinitionWarnings(def);
  return (
    <div className="flex items-start gap-3 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3">
      <div className="mt-0.5 flex-shrink-0">
        {warnings.length === 0 ? (
          <CheckCircle2 size={16} className="text-emerald-500" />
        ) : (
          <AlertTriangle size={16} className="text-amber-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 font-mono truncate">
          {def.name}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {def.props.length} prop{def.props.length !== 1 ? "s" : ""}
          {def.figmaUrl ? "" : " · ⚠ no Figma URL"}
        </p>
        {warnings.map((w, i) => (
          <p
            key={i}
            className="text-xs text-amber-600 dark:text-amber-400 mt-1"
          >
            {w.message}
          </p>
        ))}
      </div>
      <ChevronRight size={14} className="mt-1 flex-shrink-0 text-zinc-400" />
    </div>
  );
}

function FilePreviewSection({ file }: { file: ParsedFile }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide truncate">
        {file.filename}
      </p>
      {file.rawError ? (
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950 rounded p-2">
          {file.rawError}
        </p>
      ) : (
        <div className="space-y-2">
          {file.definitions.map((def) => (
            <DefPreviewRow key={def.id} def={def} />
          ))}
          {file.definitions.length === 0 && (
            <p className="text-xs text-zinc-400 italic">
              No components detected in this file.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ImportModal() {
  const { mergeDefinitions, setDefinitions } = useConnection();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("connect");
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false);

  const allDefs = parsedFiles.flatMap((f) => f.definitions);

  // ── Parse helpers ──

  const readFiles = useCallback(
    (files: File[]): Promise<{ name: string; content: string }[]> => {
      return Promise.all(
        files.map(
          (f) =>
            new Promise<{ name: string; content: string }>(
              (resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) =>
                  resolve({
                    name: f.name,
                    content: e.target?.result as string,
                  });
                reader.onerror = () =>
                  reject(new Error(`Failed to read ${f.name}`));
                reader.readAsText(f);
              },
            ),
        ),
      );
    },
    [],
  );

  const handleConnectFiles = useCallback(
    async (files: File[]) => {
      const loaded = await readFiles(files);
      const results: ParsedFile[] = loaded.map(({ name, content }) => {
        try {
          const definitions = parseFigmaConnectFile(content);
          return { filename: name, definitions };
        } catch (e: unknown) {
          return {
            filename: name,
            definitions: [],
            rawError: e instanceof Error ? e.message : String(e),
          };
        }
      });
      setParsedFiles((prev) => [...prev, ...results]);
    },
    [readFiles],
  );

  const handleReactFiles = useCallback(
    async (files: File[]) => {
      const loaded = await readFiles(files);
      const results: ParsedFile[] = loaded.map(({ name, content }) => {
        try {
          const def = parseReactComponentFile(content, name);
          return { filename: name, definitions: [def] };
        } catch (e: unknown) {
          return {
            filename: name,
            definitions: [],
            rawError: e instanceof Error ? e.message : String(e),
          };
        }
      });
      setParsedFiles((prev) => [...prev, ...results]);
    },
    [readFiles],
  );

  // ── Actions ──

  const handleAddToProject = useCallback(() => {
    if (allDefs.length === 0) return;
    mergeDefinitions(allDefs);
    setParsedFiles([]);
    setOpen(false);
  }, [allDefs, mergeDefinitions]);

  const handleReplaceAll = useCallback(() => {
    if (allDefs.length === 0) return;
    setDefinitions(allDefs);
    setParsedFiles([]);
    setOpen(false);
    setReplaceConfirmOpen(false);
  }, [allDefs, setDefinitions]);

  const handleClearFile = useCallback((filename: string) => {
    setParsedFiles((prev) => prev.filter((f) => f.filename !== filename));
  }, []);

  const handleClose = useCallback(() => {
    setParsedFiles([]);
    setOpen(false);
  }, []);

  return (
    <>
      <Dialog.Root
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClose();
          else setOpen(true);
        }}
      >
        <Dialog.Trigger asChild>
          <button
            title="Import files"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <Upload size={15} />
            <span className="hidden sm:inline">Import</span>
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <Dialog.Title className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Import Components
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>

            <Separator.Root className="h-px bg-zinc-200 dark:bg-zinc-700" />

            {/* Tab bar */}
            <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 px-6 py-2.5">
              <TabButton
                active={activeTab === "connect"}
                onClick={() => setActiveTab("connect")}
                icon={<FileCode size={14} />}
                label="Code Connect File"
              />
              <TabButton
                active={activeTab === "react"}
                onClick={() => setActiveTab("react")}
                icon={<FileText size={14} />}
                label="React Component"
              />
            </div>

            <Separator.Root className="h-px bg-zinc-200 dark:bg-zinc-700" />

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Drop zone */}
              {activeTab === "connect" ? (
                <DropZone
                  accept=".tsx,.ts"
                  multiple
                  onFiles={handleConnectFiles}
                >
                  <Upload
                    size={28}
                    className="text-zinc-400 dark:text-zinc-500"
                  />
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    Drop{" "}
                    <code className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">
                      .figma.tsx
                    </code>{" "}
                    or any Code Connect file
                  </p>
                  <p className="text-xs text-zinc-400">
                    or click to browse · multiple files supported
                  </p>
                </DropZone>
              ) : (
                <DropZone accept=".tsx,.ts" multiple onFiles={handleReactFiles}>
                  <Upload
                    size={28}
                    className="text-zinc-400 dark:text-zinc-500"
                  />
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    Drop React component files
                  </p>
                  <p className="text-xs text-zinc-400">
                    Props interfaces are extracted automatically · paste the
                    Figma URL after import
                  </p>
                </DropZone>
              )}

              {/* Preview */}
              {parsedFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                      Preview — {allDefs.length} component
                      {allDefs.length !== 1 ? "s" : ""} found
                    </p>
                    <button
                      onClick={() => setParsedFiles([])}
                      className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>

                  {parsedFiles.map((file) => (
                    <div key={file.filename} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <FilePreviewSection file={file} />
                        <button
                          onClick={() => handleClearFile(file.filename)}
                          className="ml-2 self-start flex-shrink-0 text-zinc-300 hover:text-red-400 transition-colors"
                          title="Remove this file"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <Separator.Root className="h-px bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex items-center justify-end gap-3 px-6 py-4">
              <Dialog.Close asChild>
                <button className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Cancel
                </button>
              </Dialog.Close>

              {allDefs.length > 0 && (
                <>
                  <button
                    onClick={() => setReplaceConfirmOpen(true)}
                    className="px-4 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Replace all
                  </button>
                  <button
                    onClick={handleAddToProject}
                    className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                  >
                    Add to project ({allDefs.length})
                  </button>
                </>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Replace-all confirmation */}
      <AlertDialog.Root
        open={replaceConfirmOpen}
        onOpenChange={setReplaceConfirmOpen}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-700 p-6 space-y-4">
            <AlertDialog.Title className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Replace all components?
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-zinc-500 dark:text-zinc-400">
              This will remove all {"{"}currently defined components{"}"} and
              replace them with the {allDefs.length} component
              {allDefs.length !== 1 ? "s" : ""} from this import. This cannot be
              undone.
            </AlertDialog.Description>
            <div className="flex items-center justify-end gap-3 pt-2">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Keep current
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={handleReplaceAll}
                  className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
                >
                  Replace all
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}

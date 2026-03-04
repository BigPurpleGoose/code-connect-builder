/**
 * ImprovedImportModal
 *
 * Enhanced version of ImportModal with the new React Component import wizard.
 * This file serves as a clean integration layer until the original is fully migrated.
 */

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Separator from "@radix-ui/react-separator";
import { Upload, X, FileCode, FileText } from "lucide-react";
import { ReactComponentImportFlow } from "./ReactComponentImportFlow";
import { useConnection } from "@/contexts/ConnectionContext";
import type { ComponentDefinition } from "@/types/connection";

// Import the original modal for Code Connect files
import { ImportModal as OriginalImportModal } from "./ImportModal";

type TabId = "connect" | "react";

export function ImprovedImportModal() {
  const { mergeDefinitions } = useConnection();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("react");
  const [showReactWizard, setShowReactWizard] = useState(false);

  const handleReactImport = (definitions: ComponentDefinition[]) => {
    mergeDefinitions(definitions);
    setShowReactWizard(false);
    setOpen(false);
  };

  // If showing React wizard, display it in a full dialog
  if (showReactWizard) {
    return (
      <>
        {/* Trigger button for the main modal */}
        <Dialog.Root open={false}>
          <Dialog.Trigger asChild>
            <button
              title="Import files"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              onClick={() => setOpen(true)}
            >
              <Upload size={15} />
              <span className="hidden sm:inline">Import</span>
            </button>
          </Dialog.Trigger>
        </Dialog.Root>

        {/* React wizard dialog */}
        <Dialog.Root open={showReactWizard} onOpenChange={setShowReactWizard}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-5 pb-4">
                <Dialog.Title className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Import React Component
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                    <X size={18} />
                  </button>
                </Dialog.Close>
              </div>
              <Separator.Root className="h-px bg-zinc-200 dark:bg-zinc-700" />
              <div className="flex-1 overflow-hidden">
                <ReactComponentImportFlow
                  onImport={handleReactImport}
                  onCancel={() => setShowReactWizard(false)}
                />
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </>
    );
  }

  // For Code Connect files, delegate to original modal
  // This allows the original modal to handle its own state and logic
  if (activeTab === ("connect" as TabId)) {
    return <OriginalImportModal />;
  }

  // Main modal with tab selection
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
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

          {/* Tab selection */}
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 px-6 py-2.5">
            <button
              onClick={() => setActiveTab("connect")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "connect"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              <FileCode size={14} />
              Code Connect File
            </button>
            <button
              onClick={() => setActiveTab("react")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "react"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              <FileText size={14} />
              React Component
            </button>
          </div>

          <Separator.Root className="h-px bg-zinc-200 dark:bg-zinc-700" />

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "react" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                    Import React Component
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                    Use our guided workflow to import React components with
                    intelligent prop detection and Figma mapping.
                  </p>
                  <button
                    onClick={() => {
                      setShowReactWizard(true);
                      setOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                  >
                    <FileText size={16} />
                    Start Component Import Wizard
                  </button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-2">
                    ✨ New Import Experience
                  </p>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 ml-4 list-disc">
                    <li>Step-by-step guided workflow</li>
                    <li>Automatic prop detection from TypeScript</li>
                    <li>Optional intelligent Figma property matching</li>
                    <li>Preview and review before importing</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === ("connect" as TabId) && (
              <div className="text-center py-8">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Switch to the original modal for Code Connect file import.
                </p>
                <button
                  onClick={() => {
                    setOpen(false);
                    setActiveTab("connect" as TabId);
                  }}
                  className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                >
                  Use Original Import
                </button>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

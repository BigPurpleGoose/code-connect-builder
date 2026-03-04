import React, { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Save, Trash2, FolderOpen, PlusCircle, Check, X } from "lucide-react";
import { useTemplates } from "@/contexts/TemplateContext";
import { useConnection } from "@/contexts/ConnectionContext";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/components/ui/cn";
import type { Template } from "@/types/connection";

export function TemplateManager() {
  const {
    templates,
    saveTemplate,
    loadTemplate,
    deleteTemplate,
    renameTemplate,
  } = useTemplates();
  const { definitions, setDefinitions, setActiveDefId } = useConnection();
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const handleSave = () => {
    if (!saveName.trim()) return;
    saveTemplate(saveName, definitions);
    setSaveName("");
    setShowSaveInput(false);
  };

  const handleLoad = (id: string) => {
    const defs = loadTemplate(id);
    if (!defs) return;
    setDefinitions(defs);
    setActiveDefId(defs[0].id);
  };

  const handleRenameSubmit = (id: string) => {
    if (renameValue.trim()) renameTemplate(id, renameValue);
    setRenamingId(null);
    setRenameValue("");
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });

  return (
    <Popover.Root>
      <Tooltip content="Templates">
        <Popover.Trigger asChild>
          <button className="inline-flex items-center justify-center gap-1.5 rounded-md p-2 text-neutral-300 border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 hover:border-neutral-600 transition-colors relative">
            <Save className="h-4 w-4" />
            {templates.length > 0 && (
              <span className="absolute -top-1 -right-1 rounded-full bg-primary-500 px-1.5 py-px text-[9px] font-bold text-white min-w-[18px] text-center">
                {templates.length}
              </span>
            )}
          </button>
        </Popover.Trigger>
      </Tooltip>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-40 w-72 overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 shadow-xl animate-fade-in"
        >
          {/* Save section */}
          <div className="border-b border-neutral-700 p-3">
            {showSaveInput ? (
              <div className="flex items-center gap-2">
                <input
                  id="template-save-name"
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") setShowSaveInput(false);
                  }}
                  placeholder="Template name..."
                  autoFocus
                  className="flex-1 h-8 rounded-md border border-neutral-300 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                />
                <button
                  onClick={handleSave}
                  disabled={!saveName.trim()}
                  className="p-1.5 rounded-md bg-primary-600 text-white disabled:opacity-40 hover:bg-primary-700"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setShowSaveInput(false)}
                  className="p-1.5 rounded-md text-neutral-400 hover:bg-neutral-800"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveInput(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-primary-400 hover:bg-primary-900/20 transition-colors font-medium"
              >
                <PlusCircle className="h-4 w-4" />
                Save current setup as template
              </button>
            )}
          </div>

          {/* Template list */}
          <div className="max-h-64 overflow-y-auto p-1.5">
            {templates.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-neutral-400 italic">
                No saved templates yet.
              </p>
            )}
            {templates.map((t) => (
              <TemplateRow
                key={t.id}
                template={t}
                onLoad={() => handleLoad(t.id)}
                onDelete={() => deleteTemplate(t.id)}
                isRenaming={renamingId === t.id}
                renameValue={renameValue}
                onRenameStart={() => {
                  setRenamingId(t.id);
                  setRenameValue(t.name);
                }}
                onRenameChange={setRenameValue}
                onRenameSubmit={() => handleRenameSubmit(t.id)}
                onRenameCancel={() => setRenamingId(null)}
                formatDate={formatDate}
              />
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

interface TemplateRowProps {
  template: Template;
  onLoad: () => void;
  onDelete: () => void;
  isRenaming: boolean;
  renameValue: string;
  onRenameStart: () => void;
  onRenameChange: (v: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  formatDate: (iso: string) => string;
}

function TemplateRow({
  template,
  onLoad,
  onDelete,
  isRenaming,
  renameValue,
  onRenameStart,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  formatDate,
}: TemplateRowProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-2 hover:bg-neutral-800 transition-colors",
      )}
    >
      {isRenaming ? (
        <div className="flex flex-1 items-center gap-1.5">
          <input
            id={`template-rename-${template.id}`}
            type="text"
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRenameSubmit();
              if (e.key === "Escape") onRenameCancel();
            }}
            autoFocus
            className="flex-1 h-7 rounded border border-primary-400 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <button
            onClick={onRenameSubmit}
            className="text-primary-600 hover:text-primary-800"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onRenameCancel}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <>
          <Popover.Close asChild>
            <button onClick={onLoad} className="flex-1 text-left">
              <p className="text-sm font-medium text-neutral-700 truncate">
                {template.name}
              </p>
              <p className="text-[10px] text-neutral-400">
                {template.definitions.length} component
                {template.definitions.length !== 1 ? "s" : ""} ·{" "}
                {formatDate(template.createdAt)}
              </p>
            </button>
          </Popover.Close>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onRenameStart}
              className="rounded p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 transition-colors"
              title="Rename"
            >
              <FolderOpen className="h-3 w-3" />
            </button>
            <DeleteTemplateButton onConfirm={onDelete} name={template.name} />
          </div>
        </>
      )}
    </div>
  );
}

function DeleteTemplateButton({
  onConfirm,
  name,
}: {
  onConfirm: () => void;
  name: string;
}) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <button
          className="rounded p-1 text-neutral-400 hover:bg-danger-50 hover:text-danger-500 transition-colors"
          title="Delete template"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[60] -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-xl border border-neutral-700 bg-neutral-900 p-6 shadow-xl radix-content">
          <AlertDialog.Title className="text-base font-bold text-neutral-100 mb-2">
            Delete template?
          </AlertDialog.Title>
          <AlertDialog.Description className="text-sm text-neutral-400 mb-5">
            "<strong className="text-neutral-200">{name}</strong>" will be
            permanently deleted. This cannot be undone.
          </AlertDialog.Description>
          <div className="flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" size="sm">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant="destructive" size="sm" onClick={onConfirm}>
                Delete
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

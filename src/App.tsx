import React, { useState, useMemo } from "react";
import {
  Code2,
  Pencil,
  Plus,
  Eye,
  Maximize2,
  Columns,
  FileCode,
} from "lucide-react";
import { ConnectionProvider } from "@/contexts/ConnectionContext";
import { TemplateProvider } from "@/contexts/TemplateContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { DefinitionSidebar } from "@/components/layout/DefinitionSidebar";
import { EditorPanel } from "@/components/layout/EditorPanel";
import { ValidationBar } from "@/components/layout/ValidationBar";
import { OutputPanel } from "@/components/output/OutputPanel";
import { useLayoutMode } from "@/hooks/useLayoutMode";
import {
  CommandPalette,
  useCommandPalette,
  type CommandItem,
} from "@/components/ui/CommandPalette";
import { useConnection } from "@/contexts/ConnectionContext";

function AppContent() {
  const [mobileView, setMobileView] = useState<"editor" | "output">("editor");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { mode, config, setLayoutMode } = useLayoutMode("split");
  const commandPalette = useCommandPalette();

  const {
    definitions,
    addDefinition,
    addRootDefinition,
    removeDefinition,
    setActiveDefId,
  } = useConnection();

  // Build command list
  const commands = useMemo<CommandItem[]>(() => {
    const cmds: CommandItem[] = [
      // Component actions
      {
        id: "add-root",
        label: "Add New Component",
        description: "Create a new root component definition",
        icon: Plus,
        category: "Components",
        keywords: ["new", "create", "component"],
        onSelect: () => addRootDefinition(),
      },
      // Layout modes
      {
        id: "layout-edit",
        label: "Edit Focus Mode",
        description: "Focus on editing properties",
        icon: Maximize2,
        category: "View",
        keywords: ["layout", "focus", "editor"],
        onSelect: () => setLayoutMode("edit"),
      },
      {
        id: "layout-split",
        label: "Split View Mode",
        description: "Balanced editor and code view",
        icon: Columns,
        category: "View",
        keywords: ["layout", "split", "balance"],
        onSelect: () => setLayoutMode("split"),
      },
      {
        id: "layout-preview",
        label: "Preview Focus Mode",
        description: "Focus on generated code",
        icon: Eye,
        category: "View",
        keywords: ["layout", "preview", "code"],
        onSelect: () => setLayoutMode("preview"),
      },
    ];

    // Add commands for navigating to each definition
    definitions.forEach((def) => {
      cmds.push({
        id: `goto-${def.id}`,
        label: `Go to ${def.name}`,
        description: `${def.props.length} properties`,
        icon: FileCode,
        category: "Navigation",
        keywords: ["goto", "jump", "navigate", def.name],
        onSelect: () => setActiveDefId(def.id),
      });

      // Add sub-component command
      if (def.name.split(".").length === 1) {
        cmds.push({
          id: `add-sub-${def.id}`,
          label: `Add Sub-component to ${def.name}`,
          description: `Create ${def.name}.SubComponent`,
          icon: Plus,
          category: "Components",
          keywords: ["add", "sub", "child", def.name],
          onSelect: () => addDefinition(def.name),
        });
      }
    });

    return cmds;
  }, [
    definitions,
    addRootDefinition,
    addDefinition,
    setActiveDefId,
    setLayoutMode,
  ]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AppHeader
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        layoutMode={mode}
        onLayoutModeChange={setLayoutMode}
      />
      <ValidationBar />

      {/* Mobile tab bar */}
      <div className="flex shrink-0 border-b border-neutral-700 bg-neutral-900 lg:hidden">
        <button
          onClick={() => setMobileView("editor")}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
            mobileView === "editor"
              ? "border-primary-500 text-primary-400"
              : "border-transparent text-neutral-400"
          }`}
        >
          <Pencil className="h-3.5 w-3.5" /> Editor
        </button>
        <button
          onClick={() => setMobileView("output")}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
            mobileView === "output"
              ? "border-primary-500 text-primary-400"
              : "border-transparent text-neutral-400"
          }`}
        >
          <Code2 className="h-3.5 w-3.5" /> Code Output
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile: use tab-based navigation */}
        <div className="lg:hidden flex flex-1 flex-col overflow-hidden">
          {mobileView === "editor" ? (
            <div className="flex flex-1 flex-col overflow-hidden border-r border-neutral-700">
              <DefinitionSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
              <EditorPanel />
            </div>
          ) : (
            <OutputPanel />
          )}
        </div>

        {/* Desktop: use layout mode config */}
        <div className="hidden lg:flex flex-1 overflow-hidden">
          {/* Sidebar - conditionally shown based on layout mode */}
          {config.showSidebar && (
            <DefinitionSidebar isOpen={true} onClose={() => {}} />
          )}

          {/* Editor panel */}
          {config.showEditor && (
            <div
              className="flex flex-col overflow-hidden border-r border-neutral-700"
              style={{ width: config.editorWidth }}
            >
              <EditorPanel />
            </div>
          )}

          {/* Output panel */}
          {config.showOutput && (
            <div
              className="flex flex-col overflow-hidden"
              style={{ width: config.outputWidth }}
            >
              <OutputPanel />
            </div>
          )}
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
        commands={commands}
      />
    </div>
  );
}

export default function App() {
  return (
    <TemplateProvider>
      <ConnectionProvider>
        <AppContent />
      </ConnectionProvider>
    </TemplateProvider>
  );
}

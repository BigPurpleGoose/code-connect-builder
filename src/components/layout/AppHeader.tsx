import React from "react";
import { Figma } from "lucide-react";
import { TemplateManager } from "@/components/templates/TemplateManager";
import { DocsPanel } from "@/components/docs/DocsPanel";
import { DiagramView } from "@/components/output/DiagramView";
import { ImportModal } from "@/components/import/ImportModal";

export function AppHeader() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-6 py-3 z-10">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-600 to-primary-600 shadow-sm">
          <Figma className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-bold text-neutral-900 leading-none">
            Code Connect Builder
          </h1>
          <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-widest">
            Ink Design System
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <ImportModal />
        <DiagramView />
        <TemplateManager />
        <DocsPanel />
      </div>
    </header>
  );
}

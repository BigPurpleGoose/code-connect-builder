import React from "react";
import { Figma, Menu } from "lucide-react";
import { TemplateManager } from "@/components/templates/TemplateManager";
import { DocsPanel } from "@/components/docs/DocsPanel";
import { DiagramView } from "@/components/output/DiagramView";
import { ImportModal } from "@/components/import/ImportModal";
import { LayoutModeSwitcher } from "./LayoutModeSwitcher";
import type { LayoutMode } from "@/hooks/useLayoutMode";

interface AppHeaderProps {
  onToggleSidebar: () => void;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
}

export function AppHeader({
  onToggleSidebar,
  layoutMode,
  onLayoutModeChange,
}: AppHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-neutral-700 bg-neutral-900 px-4 lg:px-6 h-header z-10">
      {/* Brand */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Hamburger menu - mobile only */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 text-neutral-300 hover:text-neutral-100 rounded-md hover:bg-neutral-800"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-600 to-primary-600 shadow-sm">
          <Figma className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight hidden sm:block">
          <h1 className="text-sm font-bold text-neutral-100 leading-none">
            Code Connect Builder
          </h1>
          <p className="text-caption text-neutral-500 font-medium uppercase tracking-widest">
            Ink Design System
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Layout mode switcher - desktop only */}
        <div className="hidden lg:block">
          <LayoutModeSwitcher mode={layoutMode} onChange={onLayoutModeChange} />
        </div>
        <ImportModal />
        <DiagramView />
        <TemplateManager />
        <DocsPanel />
      </div>
    </header>
  );
}

import { useState, useCallback } from "react";

export type LayoutMode = "edit" | "split" | "preview";

export interface LayoutModeConfig {
  mode: LayoutMode;
  sidebarWidth: number;
  editorWidth: string;
  outputWidth: string;
  showSidebar: boolean;
  showEditor: boolean;
  showOutput: boolean;
}

const LAYOUT_CONFIGS: Record<LayoutMode, LayoutModeConfig> = {
  edit: {
    mode: "edit",
    sidebarWidth: 320,
    editorWidth: "100%",
    outputWidth: "0%",
    showSidebar: true,
    showEditor: true,
    showOutput: false,
  },
  split: {
    mode: "split",
    sidebarWidth: 320,
    editorWidth: "58%",
    outputWidth: "42%",
    showSidebar: true,
    showEditor: true,
    showOutput: true,
  },
  preview: {
    mode: "preview",
    sidebarWidth: 0,
    editorWidth: "35%",
    outputWidth: "65%",
    showSidebar: false,
    showEditor: true,
    showOutput: true,
  },
};

export function useLayoutMode(initialMode: LayoutMode = "split") {
  const [mode, setMode] = useState<LayoutMode>(initialMode);

  const config = LAYOUT_CONFIGS[mode];

  const setLayoutMode = useCallback((newMode: LayoutMode) => {
    setMode(newMode);
  }, []);

  return {
    mode,
    config,
    setLayoutMode,
    isEditMode: mode === "edit",
    isSplitMode: mode === "split",
    isPreviewMode: mode === "preview",
  };
}

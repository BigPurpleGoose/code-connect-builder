import React, { useState } from "react";
import { Code2, Pencil } from "lucide-react";
import { ConnectionProvider } from "@/contexts/ConnectionContext";
import { TemplateProvider } from "@/contexts/TemplateContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { DefinitionSidebar } from "@/components/layout/DefinitionSidebar";
import { EditorPanel } from "@/components/layout/EditorPanel";
import { ValidationBar } from "@/components/layout/ValidationBar";
import { OutputPanel } from "@/components/output/OutputPanel";

export default function App() {
  const [mobileView, setMobileView] = useState<"editor" | "output">("editor");

  return (
    <TemplateProvider>
      <ConnectionProvider>
        <div className="flex h-screen flex-col overflow-hidden">
          <AppHeader />
          <ValidationBar />

          {/* Mobile tab bar */}
          <div className="flex shrink-0 border-b border-slate-200 bg-white lg:hidden">
            <button
              onClick={() => setMobileView("editor")}
              className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                mobileView === "editor"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500"
              }`}
            >
              <Pencil className="h-3.5 w-3.5" /> Editor
            </button>
            <button
              onClick={() => setMobileView("output")}
              className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                mobileView === "output"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" /> Code Output
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Left column: sidebar + editor (hidden on mobile when output is active) */}
            <div
              className={`flex flex-1 flex-col overflow-hidden border-r border-slate-200 lg:flex lg:flex-row ${
                mobileView === "output" ? "hidden" : "flex"
              }`}
            >
              <DefinitionSidebar />
              <EditorPanel />
            </div>

            {/* Right column: code output */}
            <div
              className={`w-full shrink-0 flex-col lg:flex lg:w-[42%] ${
                mobileView === "output" ? "flex" : "hidden"
              }`}
            >
              <OutputPanel />
            </div>
          </div>
        </div>
      </ConnectionProvider>
    </TemplateProvider>
  );
}

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, BookOpen } from "lucide-react";
import { REFERENCE_SECTIONS } from "@/utils/docs";
import { PROP_TYPE_DOCS } from "@/utils/docs";
import type { PropType } from "@/types/connection";
import { cn } from "@/components/ui/cn";

export function DocsPanel() {
  const [activeSection, setActiveSection] = useState(0);

  const propTypes = Object.entries(PROP_TYPE_DOCS) as [
    PropType,
    (typeof PROP_TYPE_DOCS)[PropType],
  ][];

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors"
          aria-label="Open documentation"
        >
          <BookOpen className="h-3.5 w-3.5" />
          Docs
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm radix-overlay" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-white shadow-2xl sheet-content focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
            <div>
              <Dialog.Title className="text-lg font-bold text-slate-900">
                Documentation & Reference
              </Dialog.Title>
              <Dialog.Description className="text-xs text-slate-500 mt-0.5">
                Code Connect patterns and prop type reference
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Nav tabs */}
          <div className="flex gap-1 border-b border-slate-200 bg-white px-4 pt-3 overflow-x-auto">
            {["Guides", "Prop Types"].map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveSection(i)}
                className={cn(
                  "shrink-0 rounded-t-md px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                  activeSection === i
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700",
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {activeSection === 0 && (
              <>
                {REFERENCE_SECTIONS.map((section, si) => (
                  <section key={si}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100">
                      {section.title}
                    </h3>
                    <div className="space-y-3">
                      {section.items.map((item, ii) => (
                        <div
                          key={ii}
                          className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-blue-100 hover:shadow-sm transition-all"
                        >
                          <h4 className="font-mono text-sm font-bold text-blue-600 mb-2">
                            {item.term}
                          </h4>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {item.desc}
                          </p>
                          {item.example && (
                            <div className="mt-3 rounded-md bg-slate-900 p-3">
                              <code className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap">
                                {item.example}
                              </code>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </>
            )}

            {activeSection === 1 && (
              <div className="space-y-4">
                {propTypes.map(([type, doc]) => (
                  <div
                    key={type}
                    className="rounded-xl border border-slate-200 overflow-hidden hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 border-b border-slate-200">
                      <span className="font-mono text-sm font-bold text-blue-600">
                        {doc.label}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        figma.{type}()
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {doc.description}
                      </p>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          When to use
                        </p>
                        <p className="text-sm text-slate-500">
                          {doc.whenToUse}
                        </p>
                      </div>
                      {doc.inkPattern && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Ink DS Pattern
                          </p>
                          <p className="text-sm text-slate-500 whitespace-pre-line">
                            {doc.inkPattern}
                          </p>
                        </div>
                      )}
                      <div className="rounded-md bg-slate-900 p-3">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-bold">
                          Output example
                        </p>
                        <code className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap">
                          {doc.exampleOutput}
                        </code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

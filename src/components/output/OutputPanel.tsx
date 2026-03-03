import React, { useState } from "react";
import { Copy, Check, Download, Archive, AlertTriangle } from "lucide-react";
import { useCodeGen } from "@/hooks/useCodeGen";
import { useConnection } from "@/contexts/ConnectionContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { isDefinitionValid } from "@/utils/validation";
import { generateFile } from "@/utils/codeGen";
import { createZipBlob, downloadBlob } from "@/utils/zipWriter";

/** Group definitions by root name (before the first "."). */
function getRootGroups(
  definitions: ReturnType<typeof useConnection>["definitions"],
) {
  const order: string[] = [];
  const map = new Map<string, typeof definitions>();
  for (const def of definitions) {
    const root = def.name.split(".")[0] || def.name;
    if (!map.has(root)) {
      map.set(root, []);
      order.push(root);
    }
    map.get(root)!.push(def);
  }
  return order.map((root) => ({ root, defs: map.get(root)! }));
}

export function OutputPanel() {
  const code = useCodeGen();
  const { definitions } = useConnection();
  const [copied, setCopied] = useState(false);

  const rootGroups = getRootGroups(definitions);
  const hasMultipleRoots = rootGroups.length > 1;
  const outputFilename = `${(definitions[0]?.name ?? "Component").split(".")[0]}.figma.tsx`;
  const allValid = definitions.every(isDefinitionValid);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = outputFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = async () => {
    if (!hasMultipleRoots) {
      handleDownload();
      return;
    }
    const entries = rootGroups.map(({ root, defs }) => ({
      name: `${root}.figma.tsx`,
      content: generateFile(defs),
    }));
    const blob = await createZipBlob(entries);
    downloadBlob(blob, "components.figma.zip");
  };

  return (
    <div className="flex h-full flex-col bg-[#0F172A]">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#1E293B] px-4 py-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "h-2.5 w-2.5 rounded-full transition-colors",
              allValid
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"
                : "bg-amber-500",
            )}
          />
          <span className="font-mono text-xs text-slate-400">
            {hasMultipleRoots
              ? `${rootGroups.length} components · components.figma.zip`
              : outputFilename}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Single-file download (always available) */}
          <button
            onClick={handleDownload}
            title="Download current view as single file"
            className="rounded p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          {/* Bulk zip export (only shown when multiple roots) */}
          {hasMultipleRoots && (
            <button
              onClick={handleExportAll}
              title={`Export all ${rootGroups.length} components as a .zip`}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
            >
              <Archive className="h-3.5 w-3.5" />
              Export All
            </button>
          )}

          <Button
            size="xs"
            onClick={handleCopy}
            className={cn(
              "border-none text-xs",
              copied
                ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                : "bg-blue-600 hover:bg-blue-500 text-white",
            )}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" /> Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Validation warning banner */}
      {!allValid && (
        <div className="flex items-start gap-2 border-b border-amber-900/50 bg-amber-950/40 px-4 py-2.5 shrink-0">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-px" />
          <p className="text-[11px] text-amber-300 leading-relaxed">
            Some required fields are incomplete. Fix the highlighted errors in
            the editor — the output below is a partial preview and may not be
            valid until all fields are filled.
          </p>
        </div>
      )}

      {/* Code output */}
      <div className="flex-1 relative overflow-hidden">
        <textarea
          readOnly
          value={code}
          spellCheck={false}
          aria-label="Generated code"
          className="h-full w-full bg-transparent p-6 font-mono text-[12.5px] leading-relaxed text-slate-300 resize-none focus:outline-none selection:bg-blue-500/30"
          style={{ caretColor: "transparent" }}
        />
      </div>

      {/* Footer info */}
      <div className="border-t border-slate-800 px-4 py-2 flex items-center justify-between shrink-0">
        <span className="text-[10px] text-slate-600">
          {definitions.length} component{definitions.length !== 1 ? "s" : ""}{" "}
          {hasMultipleRoots && `across ${rootGroups.length} files`} ·{" "}
          {definitions.reduce((acc, d) => acc + d.props.length, 0)} total props
        </span>
        <span className="text-[10px] text-slate-600 font-mono">
          @figma/code-connect
        </span>
      </div>
    </div>
  );
}

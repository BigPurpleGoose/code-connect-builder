import React from "react";
import { Input } from "@/components/ui/Input";
import { useConnection } from "@/contexts/ConnectionContext";
import type {
  DefValidationErrors,
  VariantEntry,
  LinkDef,
} from "@/types/connection";
import { ExternalLink, Plus, X, Link2 } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { makeVariantEntry, makeLinkDef } from "@/utils/defaults";
import { normalizeFigmaUrl } from "@/utils/stringUtils";
import { cn } from "@/components/ui/cn";

interface ComponentMetaProps {
  defErrors: DefValidationErrors;
}

export function ComponentMeta({ defErrors }: ComponentMetaProps) {
  const { activeDef, activeDefId, updateDefinition } = useConnection();

  const variantScope = activeDef.variantScope ?? [];
  const links = activeDef.links ?? [];

  const addVariant = () =>
    updateDefinition(activeDefId, "variantScope", [
      ...variantScope,
      makeVariantEntry(),
    ]);
  const removeVariant = (id: string) =>
    updateDefinition(
      activeDefId,
      "variantScope",
      variantScope.filter((v) => v.id !== id),
    );
  const updateVariant = (id: string, fields: Partial<VariantEntry>) =>
    updateDefinition(
      activeDefId,
      "variantScope",
      variantScope.map((v) => (v.id === id ? { ...v, ...fields } : v)),
    );

  const addLink = () =>
    updateDefinition(activeDefId, "links", [...links, makeLinkDef()]);
  const removeLink = (id: string) =>
    updateDefinition(
      activeDefId,
      "links",
      links.filter((l) => l.id !== id),
    );
  const updateLink = (id: string, fields: Partial<LinkDef>) =>
    updateDefinition(
      activeDefId,
      "links",
      links.map((l) => (l.id === id ? { ...l, ...fields } : l)),
    );

  return (
    <div className="rounded-xl border border-neutral-700 bg-neutral-900/60 p-5 space-y-4">
      <h3 className="text-caption font-bold text-neutral-400 uppercase tracking-wider">
        Component Configuration
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* React component name */}
        <Input
          label="React Component Name"
          value={activeDef.name}
          onChange={(e) =>
            updateDefinition(activeDefId, "name", e.target.value)
          }
          placeholder="Button or Button.Icon"
          mono
          error={defErrors.name}
        />

        {/* Import path */}
        <div>
          <Input
            label="Import Path"
            value={activeDef.importPath}
            onChange={(e) =>
              updateDefinition(activeDefId, "importPath", e.target.value)
            }
            placeholder="./Button or @acme/ui"
            mono
            error={defErrors.importPath}
          />
          <p className="mt-1 text-caption text-neutral-500">
            Where the component is imported from in the output file.
          </p>
        </div>
      </div>

      {/* Figma URL — full width */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <label
            htmlFor="figma-url"
            className="text-caption font-bold text-neutral-500 uppercase tracking-wider"
          >
            Figma URL or Node ID
          </label>
          <Tooltip
            content={
              <div className="space-y-1.5">
                <p className="font-semibold">Finding the URL</p>
                <p>
                  In Figma, right-click a component on the canvas → "Copy link
                  to selection". Paste the full URL here.
                </p>
                <p className="text-neutral-400">
                  You can also enter a node ID in the format:{" "}
                  <code className="font-mono">123:456</code>
                </p>
              </div>
            }
            side="right"
          >
            <button
              type="button"
              className="text-neutral-500 hover:text-primary-400 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>
        <input
          id="figma-url"
          type="text"
          value={activeDef.figmaUrl}
          onChange={(e) =>
            updateDefinition(activeDefId, "figmaUrl", e.target.value)
          }
          onBlur={(e) => {
            // Normalize percent-encoded colons (%3A → :) on blur
            const normalized = normalizeFigmaUrl(e.target.value);
            if (normalized !== e.target.value) {
              updateDefinition(activeDefId, "figmaUrl", normalized);
            }
          }}
          placeholder="https://www.figma.com/design/..."
          className={`flex h-9 w-full rounded-md border bg-neutral-900 text-neutral-100 px-3 text-sm transition-colors font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 placeholder:text-neutral-500 ${
            defErrors.figmaUrl ? "border-danger-600" : "border-neutral-700"
          }`}
        />
        {defErrors.figmaUrl && (
          <p className="mt-1 text-body-sm text-danger-400">
            {defErrors.figmaUrl}
          </p>
        )}
      </div>

      {/* ── Variant Scope ────────────────────────────────────────────── */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-caption font-bold text-neutral-400 uppercase tracking-wider">
              Variant Scope
            </span>
            <Tooltip
              content={
                <div className="space-y-1.5 max-w-xs">
                  <p className="font-semibold">When to use</p>
                  <p>
                    Scope this{" "}
                    <code className="font-mono">figma.connect()</code> call to a
                    specific Figma variant state — for example, a separate entry
                    for the Disabled or Loading state of the same component.
                  </p>
                  <p className="text-neutral-400 font-mono text-[10px]">
                    variant: {"{"} &quot;State&quot;: &quot;Disabled&quot; {"}"}
                  </p>
                </div>
              }
              side="right"
            >
              <button
                type="button"
                className="text-neutral-400 hover:text-primary-500"
              >
                <span className="text-[10px] border border-neutral-300 rounded-full w-4 h-4 inline-flex items-center justify-center font-bold">
                  ?
                </span>
              </button>
            </Tooltip>
          </div>
          <button
            type="button"
            onClick={addVariant}
            className="text-[11px] text-accent-600 hover:text-accent-700 font-medium flex items-center gap-0.5"
          >
            <Plus className="h-3 w-3" /> Add variant
          </button>
        </div>

        {variantScope.length === 0 ? (
          <p className="text-[10px] text-neutral-400 italic">
            No variant scope — this connect applies to all states. Add a variant
            to scope it (e.g. State = Disabled).
          </p>
        ) : (
          <div className="space-y-1.5">
            {variantScope.length > 0 && (
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Figma Property
                </span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Variant Value
                </span>
                <span className="w-6" />
              </div>
            )}
            {variantScope.map((v) => (
              <div
                key={v.id}
                className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center"
              >
                <input
                  id={`variant-key-${v.id}`}
                  type="text"
                  value={v.key}
                  onChange={(e) => updateVariant(v.id, { key: e.target.value })}
                  placeholder="State"
                  className="h-8 rounded-md border border-neutral-700 bg-neutral-900 text-neutral-100 px-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-400 placeholder:text-neutral-500"
                />
                <input
                  id={`variant-value-${v.id}`}
                  type="text"
                  value={v.value}
                  onChange={(e) =>
                    updateVariant(v.id, { value: e.target.value })
                  }
                  placeholder="Disabled"
                  className="h-8 rounded-md border border-neutral-700 bg-neutral-900 text-neutral-100 px-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-400 placeholder:text-neutral-500"
                />
                <button
                  type="button"
                  onClick={() => removeVariant(v.id)}
                  className="text-neutral-500 hover:text-danger-400 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Dev Mode Links ───────────────────────────────────────────── */}
      <div className="space-y-2 pt-1 border-t border-neutral-700">
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-caption font-bold text-neutral-400 uppercase tracking-wider">
              Dev Mode Links
            </span>
            <Tooltip
              content={
                <div className="space-y-1.5 max-w-xs">
                  <p className="font-semibold">Dev Mode links</p>
                  <p>
                    Links shown alongside the code snippet in Figma Dev Mode.
                    Use these to point developers to Storybook, Notion docs, or
                    a changelog.
                  </p>
                  <p className="text-neutral-400 font-mono text-[10px]">
                    links: [{"{"} name: &apos;Storybook&apos;, url:
                    &apos;...&apos; {"}"}]
                  </p>
                </div>
              }
              side="right"
            >
              <button
                type="button"
                className="text-neutral-400 hover:text-primary-500"
              >
                <span className="text-[10px] border border-neutral-300 rounded-full w-4 h-4 inline-flex items-center justify-center font-bold">
                  ?
                </span>
              </button>
            </Tooltip>
          </div>
          <button
            type="button"
            onClick={addLink}
            className="text-body-sm text-primary-400 hover:text-primary-300 font-medium flex items-center gap-0.5"
          >
            <Plus className="h-3 w-3" /> Add link
          </button>
        </div>

        {links.length === 0 ? (
          <p className="text-[10px] text-neutral-400 italic">
            No links added. Add Storybook, Notion, or changelog URLs to surface
            them in Dev Mode.
          </p>
        ) : (
          <div className="space-y-1.5">
            {links.length > 0 && (
              <div className="grid grid-cols-[140px_1fr_auto] gap-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Display Name
                </span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  URL
                </span>
                <span className="w-6" />
              </div>
            )}
            {links.map((link) => (
              <div
                key={link.id}
                className="grid grid-cols-[140px_1fr_auto] gap-2 items-center"
              >
                <input
                  id={`link-name-${link.id}`}
                  type="text"
                  value={link.name}
                  onChange={(e) =>
                    updateLink(link.id, { name: e.target.value })
                  }
                  placeholder="Storybook"
                  className="h-8 rounded-md border border-neutral-700 bg-neutral-900 px-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                />
                <div className="relative">
                  <Link2 className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-400 pointer-events-none" />
                  <input
                    id={`link-url-${link.id}`}
                    type="url"
                    value={link.url}
                    onChange={(e) =>
                      updateLink(link.id, { url: e.target.value })
                    }
                    placeholder="https://..."
                    className={cn(
                      "h-8 w-full rounded-md border border-neutral-700 bg-neutral-900 pl-6 pr-2.5 font-mono text-xs text-neutral-100 placeholder-neutral-500",
                      "focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
                    )}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLink(link.id)}
                  className="text-neutral-400 hover:text-danger-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React from "react";
import { Plus, X } from "lucide-react";
import * as Switch from "@radix-ui/react-switch";
import type { ExampleConfig, PropDef, PropOverride } from "@/types/connection";
import { makePropOverride } from "@/utils/defaults";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/components/ui/cn";

interface ExampleBuilderProps {
  config: ExampleConfig;
  componentName: string;
  /** Mapped prop definitions — used to build the destructured example param list. */
  props: PropDef[];
  onChange: (config: ExampleConfig) => void;
}

export function ExampleBuilder({
  config,
  componentName,
  props,
  onChange,
}: ExampleBuilderProps) {
  const update = (fields: Partial<ExampleConfig>) =>
    onChange({ ...config, ...fields });

  const addOverride = () =>
    update({ propOverrides: [...config.propOverrides, makePropOverride()] });

  const removeOverride = (id: string) =>
    update({ propOverrides: config.propOverrides.filter((o) => o.id !== id) });

  const updateOverride = (id: string, fields: Partial<PropOverride>) =>
    update({
      propOverrides: config.propOverrides.map((o) =>
        o.id === id ? { ...o, ...fields } : o,
      ),
    });

  // Preview the example output
  const preview = buildPreview(componentName, config, props);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-5">
      <div>
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
          Example Render
        </h3>
        <p className="text-[11px] text-slate-400">
          Configure how the component appears in Figma's Dev Mode code snippet.
        </p>
      </div>

      {/* Spread props toggle */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
        <div>
          <p className="text-sm font-medium text-slate-700">
            Spread Figma props
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Adds <code className="font-mono">&#123;...props&#125;</code> —
            passes all mapped prop values into the component.
          </p>
        </div>
        <Switch.Root
          checked={config.spreadFigmaProps}
          onCheckedChange={(checked) => update({ spreadFigmaProps: checked })}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            config.spreadFigmaProps ? "bg-blue-500" : "bg-slate-300",
          )}
        >
          <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-5" />
        </Switch.Root>
      </div>

      {/* Prop overrides */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Prop Overrides
            </p>
            <Tooltip
              content="Hardcode specific prop values in the example. Useful for showing the component in a specific state (e.g. size='lg', disabled=true)."
              side="right"
            >
              <button
                type="button"
                className="text-slate-400 hover:text-blue-500"
              >
                <span className="text-[10px] border border-slate-300 rounded-full w-4 h-4 inline-flex items-center justify-center font-bold">
                  ?
                </span>
              </button>
            </Tooltip>
          </div>
          {config.propOverrides.length > 0 && (
            <button
              type="button"
              onClick={addOverride}
              className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          )}
        </div>

        {config.propOverrides.length === 0 ? (
          <button
            type="button"
            onClick={addOverride}
            className="flex w-full items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 py-3 text-xs text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add hardcoded prop
          </button>
        ) : (
          <div className="space-y-2">
            {config.propOverrides.map((override) => (
              <div key={override.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={override.key}
                  onChange={(e) =>
                    updateOverride(override.id, { key: e.target.value })
                  }
                  placeholder="propName"
                  className="h-8 w-32 rounded-md border border-slate-300 bg-white px-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
                <span className="text-slate-400 text-xs">=</span>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={override.value}
                    onChange={(e) =>
                      updateOverride(override.id, { value: e.target.value })
                    }
                    placeholder={override.isCode ? "raw JS" : '"string value"'}
                    className={cn(
                      "h-8 w-full rounded-md border px-2.5 pr-8 font-mono text-xs focus:outline-none focus:ring-2",
                      override.isCode
                        ? "bg-blue-50 border-blue-200 text-blue-700 focus:ring-blue-500/30 focus:border-blue-400"
                        : "bg-white border-slate-300 focus:ring-blue-500/30 focus:border-blue-500",
                    )}
                  />
                  <button
                    type="button"
                    title={
                      override.isCode
                        ? "Code mode: value used as-is"
                        : "String mode: value wrapped in quotes"
                    }
                    onClick={() =>
                      updateOverride(override.id, { isCode: !override.isCode })
                    }
                    className={cn(
                      "absolute right-1.5 top-1.5 rounded px-0.5 text-[10px] font-bold transition-colors",
                      override.isCode
                        ? "text-blue-600 bg-blue-100"
                        : "text-slate-400 hover:bg-slate-100",
                    )}
                  >
                    {"{}"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeOverride(override.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Static children */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Static Children
          </label>
          <Tooltip
            content='JSX content to render inside the component (between opening and closing tags). E.g. "Click me" or <Icon />.'
            side="right"
          >
            <button
              type="button"
              className="text-slate-400 hover:text-blue-500"
            >
              <span className="text-[10px] border border-slate-300 rounded-full w-4 h-4 inline-flex items-center justify-center font-bold">
                ?
              </span>
            </button>
          </Tooltip>
        </div>
        <textarea
          value={config.staticChildren}
          onChange={(e) => update({ staticChildren: e.target.value })}
          placeholder="e.g. Click me  or  <Icon name='save' />"
          rows={2}
          className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs transition-colors resize-none placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        />
      </div>

      {/* Live preview */}
      <div className="rounded-lg bg-slate-900 p-3">
        <p className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider font-bold">
          Preview
        </p>
        <code className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap">
          {preview}
        </code>
      </div>
    </div>
  );
}

function buildPreview(
  name: string,
  config: ExampleConfig,
  props: PropDef[],
): string {
  const overrideStr = config.propOverrides
    .filter((o) => o.key.trim() && o.value.trim())
    .map((o) => {
      const val = o.isCode ? `{${o.value}}` : `"${o.value}"`;
      return `${o.key}=${val}`;
    })
    .join(" ");

  const children = config.staticChildren.trim();

  if (config.spreadFigmaProps) {
    const attrs = ["{...props}", overrideStr].filter(Boolean).join(" ");
    if (children) {
      return `(props) => (\n  <${name}${attrs ? " " + attrs : ""}>\n    ${children}\n  </${name}>\n)`;
    }
    return `(props) => <${name}${attrs ? " " + attrs : ""} />`;
  }

  // Destructured form
  const mappedProps = props.filter((p) => p.reactProp.trim());
  const overrideKeys = new Set(
    config.propOverrides.map((o) => o.key.trim()).filter(Boolean),
  );
  const destructuredProps = mappedProps.filter(
    (p) => !overrideKeys.has(p.reactProp.trim()),
  );

  const destructureStr =
    destructuredProps.length > 0
      ? `{ ${destructuredProps.map((p) => p.reactProp.trim()).join(", ")} }`
      : "";

  const propAttrs = destructuredProps
    .map((p) => `${p.reactProp.trim()}={${p.reactProp.trim()}}`)
    .join(" ");
  const attrs = [propAttrs, overrideStr].filter(Boolean).join(" ");

  if (children) {
    return `(${destructureStr}) => (\n  <${name}${attrs ? " " + attrs : ""}>\n    ${children}\n  </${name}>\n)`;
  }
  return `(${destructureStr}) => <${name}${attrs ? " " + attrs : ""} />`;
}

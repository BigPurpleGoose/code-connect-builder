import React from "react";
import { Plus, X } from "lucide-react";
import * as Switch from "@radix-ui/react-switch";
import type {
  ExampleConfig,
  PropDef,
  PropOverride,
  JsxPropValue,
  ConditionalBranch,
} from "@/types/connection";
import { makePropOverride } from "@/utils/defaults";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/components/ui/cn";
import { JsxPropValueEditor } from "./JsxPropValueEditor";
import { ConditionalRenderingEditor } from "./ConditionalRenderingEditor";

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
    <div className="rounded-xl border border-neutral-700 bg-neutral-900/60 p-5 space-y-5">
      <div>
        <h3 className="text-caption font-bold text-neutral-400 uppercase tracking-wider mb-0.5">
          Example Render
        </h3>
        <p className="text-body-sm text-neutral-500">
          Configure how the component appears in Figma's Dev Mode code snippet.
        </p>
      </div>

      {/* Spread props toggle */}
      <div className="flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-900 p-3">
        <div>
          <p className="text-sm font-medium text-neutral-200">
            Spread Figma props
          </p>
          <p className="text-body-sm text-neutral-500 mt-0.5">
            Adds <code className="font-mono">&#123;...props&#125;</code> —
            passes all mapped prop values into the component.
          </p>
        </div>
        <Switch.Root
          checked={config.spreadFigmaProps}
          onCheckedChange={(checked) => update({ spreadFigmaProps: checked })}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
            config.spreadFigmaProps ? "bg-primary-500" : "bg-neutral-300",
          )}
        >
          <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-5" />
        </Switch.Root>
      </div>

      {/* Prop overrides */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <p className="text-caption font-bold text-neutral-400 uppercase tracking-wider">
              Prop Overrides
            </p>
            <Tooltip
              content="Hardcode specific prop values in the example. Useful for showing the component in a specific state (e.g. size='lg', disabled=true)."
              side="right"
            >
              <button
                type="button"
                className="text-neutral-500 hover:text-primary-400"
              >
                <span className="text-[10px] border border-neutral-300 rounded-full w-4 h-4 inline-flex items-center justify-center font-bold">
                  ?
                </span>
              </button>
            </Tooltip>
          </div>
          {config.propOverrides.length > 0 && (
            <button
              type="button"
              onClick={addOverride}
              className="text-[11px] text-primary-600 hover:text-primary-700 font-medium flex items-center gap-0.5"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          )}
        </div>

        {config.propOverrides.length === 0 ? (
          <button
            type="button"
            onClick={addOverride}
            className="flex w-full items-center justify-center gap-1 rounded-lg border-2 border-dashed border-neutral-200 py-3 text-xs text-neutral-400 hover:border-primary-300 hover:text-primary-500 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add hardcoded prop
          </button>
        ) : (
          <div className="space-y-2">
            {config.propOverrides.map((override) => (
              <div key={override.id} className="flex items-center gap-2">
                <input
                  id={`override-key-${override.id}`}
                  type="text"
                  value={override.key}
                  onChange={(e) =>
                    updateOverride(override.id, { key: e.target.value })
                  }
                  placeholder="propName"
                  className="h-8 w-32 rounded-md border border-neutral-700 bg-neutral-900 px-2.5 font-mono text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                />
                <span className="text-neutral-400 text-xs">=</span>
                <div className="relative flex-1">
                  <input
                    id={`override-value-${override.id}`}
                    type="text"
                    value={override.value}
                    onChange={(e) =>
                      updateOverride(override.id, { value: e.target.value })
                    }
                    placeholder={override.isCode ? "raw JS" : '"string value"'}
                    className={cn(
                      "h-8 w-full rounded-md border px-2.5 pr-8 font-mono text-xs focus:outline-none focus:ring-2",
                      override.isCode
                        ? "bg-primary-900/20 border-primary-700 text-primary-300 focus:ring-primary-500/30 focus:border-primary-400"
                        : "bg-neutral-900 border-neutral-700 text-neutral-100 focus:ring-primary-500/30 focus:border-primary-500",
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
                        ? "text-primary-600 bg-primary-100"
                        : "text-neutral-400 hover:bg-neutral-100",
                    )}
                  >
                    {"{}"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeOverride(override.id)}
                  className="text-neutral-400 hover:text-danger-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* JSX Prop Values */}
      <JsxPropValueEditor
        jsxPropValues={config.jsxPropValues}
        props={props}
        onChange={(updated) => update({ jsxPropValues: updated })}
      />

      {/* Conditional Rendering */}
      <ConditionalRenderingEditor
        conditionalBranches={config.conditionalBranches}
        props={props}
        onChange={(updated) => update({ conditionalBranches: updated })}
      />

      {/* Static children */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <label
            htmlFor="static-children"
            className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider"
          >
            Static Children
          </label>
          <Tooltip
            content='JSX content to render inside the component (between opening and closing tags). E.g. "Click me" or <Icon />.'
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
        <textarea
          id="static-children"
          value={config.staticChildren}
          onChange={(e) => update({ staticChildren: e.target.value })}
          placeholder="e.g. Click me  or  <Icon name='save' />"
          rows={2}
          className="flex w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-xs text-neutral-100 transition-colors resize-none placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
        />
      </div>

      {/* Live preview */}
      <div className="rounded-lg bg-neutral-900 p-3">
        <p className="text-[10px] text-neutral-500 mb-1.5 uppercase tracking-wider font-bold">
          Preview
        </p>
        <code className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap">
          {preview}
        </code>
      </div>
    </div>
  );
}

// Helper to generate JSX element for JSX prop value
function buildJsxPropElement(jsxProp: JsxPropValue): string {
  if (!jsxProp.componentName.trim()) return "";

  const attrs = jsxProp.componentProps
    .filter((attr) => attr.key.trim() && attr.value.trim())
    .map((attr) => {
      const key = attr.key.trim();
      let value: string;

      switch (attr.valueType) {
        case "static":
          value = `"${attr.value.trim()}"`;
          break;
        case "nestedProp":
        case "code":
          value = `{${attr.value.trim()}}`;
          break;
        default:
          value = `"${attr.value.trim()}"`;
      }

      return `${key}=${value}`;
    })
    .join(" ");

  const component = jsxProp.componentName.trim();
  if (attrs) {
    return `<${component} ${attrs} />`;
  }
  return `<${component} />`;
}

// Helper to wrap JSX in conditional
function wrapInConditionalPreview(
  jsx: string,
  branch: ConditionalBranch,
  usePropsObject: boolean,
): string {
  if (!branch.propName.trim() || !branch.thenRender.trim()) return jsx;

  const propRef = usePropsObject
    ? `props.${branch.propName.trim()}`
    : branch.propName.trim();

  let condition: string;
  if (branch.propType === "boolean") {
    if (branch.condition === "false") {
      condition = `!${propRef}`;
    } else {
      condition = propRef;
    }
  } else {
    condition = `${propRef} === "${branch.condition}"`;
  }

  const thenBlock = branch.thenRender.trim();
  const elseBlock = branch.elseRender?.trim();

  if (elseBlock) {
    return `${condition} ? (\n    ${thenBlock}\n  ) : (\n    ${elseBlock}\n  )`;
  } else {
    return `${condition} ? (\n    ${thenBlock}\n  ) : (\n    ${jsx}\n  )`;
  }
}

function buildPreview(
  name: string,
  config: ExampleConfig,
  props: PropDef[],
): string {
  // Step 1: Process JSX prop values
  const jsxPropOverrides = config.jsxPropValues
    .filter((jp) => jp.propKey.trim() && jp.componentName.trim())
    .map((jp) => ({
      key: jp.propKey.trim(),
      value: buildJsxPropElement(jp),
      isCode: true,
    }));

  const allOverrides = [
    ...config.propOverrides.filter((o) => o.key.trim() && o.value.trim()),
    ...jsxPropOverrides,
  ];

  const overrideStr = allOverrides
    .map((o) => {
      const val = o.isCode ? `{${o.value}}` : `"${o.value}"`;
      return `${o.key}=${val}`;
    })
    .join(" ");

  const children = config.staticChildren.trim();

  // Step 2: Generate base JSX
  let baseJsx: string;
  let paramStr: string;

  if (config.spreadFigmaProps) {
    paramStr = "props";
    const attrs = ["{...props}", overrideStr].filter(Boolean).join(" ");
    if (children) {
      baseJsx = `<${name}${attrs ? " " + attrs : ""}>\n    ${children}\n  </${name}>`;
    } else {
      baseJsx = `<${name}${attrs ? " " + attrs : ""} />`;
    }
  } else {
    // Destructured form
    const mappedProps = props.filter((p) => p.reactProp.trim());
    const overrideKeys = new Set(allOverrides.map((o) => o.key.trim()));
    const destructuredProps = mappedProps.filter(
      (p) => !overrideKeys.has(p.reactProp.trim()),
    );

    paramStr =
      destructuredProps.length > 0
        ? `{ ${destructuredProps.map((p) => p.reactProp.trim()).join(", ")} }`
        : "";

    const propAttrs = destructuredProps
      .map((p) => `${p.reactProp.trim()}={${p.reactProp.trim()}}`)
      .join(" ");
    const attrs = [propAttrs, overrideStr].filter(Boolean).join(" ");

    if (children) {
      baseJsx = `<${name}${attrs ? " " + attrs : ""}>\n    ${children}\n  </${name}>`;
    } else {
      baseJsx = `<${name}${attrs ? " " + attrs : ""} />`;
    }
  }

  // Step 3: Wrap in conditionals if any exist
  let finalJsx = baseJsx;
  const validBranches = config.conditionalBranches.filter(
    (b) => b.propName.trim() && b.thenRender.trim(),
  );

  if (validBranches.length > 0) {
    const branch = validBranches[0];
    finalJsx = wrapInConditionalPreview(
      baseJsx,
      branch,
      config.spreadFigmaProps,
    );
  }

  // Step 4: Format the arrow function
  const isMultiLine = finalJsx.includes("\n");
  if (isMultiLine) {
    return `(${paramStr}) => (\n  ${finalJsx}\n)`;
  } else {
    return `(${paramStr}) => ${finalJsx}`;
  }
}

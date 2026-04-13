import React, { useState } from "react";
import { GripVertical, Trash2, ChevronRight } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PropDef, PropType } from "@/types/connection";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { PropTypeTooltip } from "@/components/docs/PropTypeTooltip";
import { Tooltip } from "@/components/ui/Tooltip";
import { BooleanEditor } from "./prop-editors/BooleanEditor";
import { EnumEditor } from "./prop-editors/EnumEditor";
import { ChildrenEditor } from "./prop-editors/ChildrenEditor";
import { NestedPropsBuilder } from "./prop-editors/NestedPropsBuilder";
import { StringEditor } from "./prop-editors/StringEditor";
import { NumberEditor } from "./prop-editors/NumberEditor";
import { InstanceEditor } from "./prop-editors/InstanceEditor";
import { TextContentEditor } from "./prop-editors/TextContentEditor";
import { makePropDef } from "@/utils/defaults";
import { toCamelCase } from "@/utils/stringUtils";
import type { PropValidationError } from "@/types/connection";
import { cn } from "@/components/ui/cn";

// Generate tooltip content showing example transformation
function getPreviewTooltip(prop: PropDef): React.ReactNode {
  if (!prop.figmaProp && !prop.reactProp) {
    return "Configure this prop to see preview";
  }

  const figma = prop.figmaProp || "(not set)";
  const react = prop.reactProp || "(not set)";

  switch (prop.type) {
    case "string":
    case "textContent":
    case "instance":
    case "number":
      return (
        <div className="space-y-1">
          <div className="text-neutral-400 text-[10px] font-semibold uppercase">
            Mapping Preview
          </div>
          <div className="font-mono text-xs">
            Figma: <span className="text-purple-300">"{figma}"</span> →{" "}
            <span className="text-blue-300">{react}</span>
          </div>
        </div>
      );

    case "boolean":
      return (
        <div className="space-y-1">
          <div className="text-neutral-400 text-[10px] font-semibold uppercase">
            Boolean Mapping
          </div>
          <div className="font-mono text-xs">
            Figma: <span className="text-purple-300">"{figma}"</span> →{" "}
            <span className="text-blue-300">{react}</span>
          </div>
          <div className="text-neutral-400 text-[10px] mt-1">
            Mode:{" "}
            <span className="text-neutral-200">
              {prop.boolMode || "simple"}
            </span>
            {prop.boolMode === "visibility" && prop.boolChildLayer && (
              <div>
                Layer:{" "}
                <span className="text-neutral-200">{prop.boolChildLayer}</span>
              </div>
            )}
          </div>
        </div>
      );

    case "enum":
      return (
        <div className="space-y-1">
          <div className="text-neutral-400 text-[10px] font-semibold uppercase">
            Variant Mapping
          </div>
          <div className="font-mono text-xs mb-1">
            Figma: <span className="text-purple-300">"{figma}"</span> →{" "}
            <span className="text-blue-300">{react}</span>
          </div>
          {prop.enumOptions && prop.enumOptions.length > 0 && (
            <div className="text-[10px] space-y-0.5 border-t border-neutral-700 pt-1">
              {prop.enumOptions.slice(0, 3).map((opt, i) => (
                <div key={i} className="flex items-center gap-1 font-mono">
                  <span className="text-purple-300">"{opt.figma}"</span>
                  <span className="text-neutral-500">→</span>
                  <span
                    className={opt.isCode ? "text-green-300" : "text-blue-300"}
                  >
                    {opt.isCode ? opt.react : `"${opt.react}"`}
                  </span>
                </div>
              ))}
              {prop.enumOptions.length > 3 && (
                <div className="text-neutral-500 italic">
                  +{prop.enumOptions.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      );

    case "children":
      return (
        <div className="space-y-1">
          <div className="text-neutral-400 text-[10px] font-semibold uppercase">
            Children Mapping
          </div>
          <div className="font-mono text-xs">
            React prop: <span className="text-blue-300">{react}</span>
          </div>
          {prop.childrenLayers && prop.childrenLayers.length > 0 && (
            <div className="text-[10px] border-t border-neutral-700 pt-1">
              Layers:{" "}
              <span className="text-purple-300">
                {prop.childrenLayers.filter((l) => l.trim()).join(", ") || "*"}
              </span>
            </div>
          )}
        </div>
      );

    case "nestedProps":
      return (
        <div className="space-y-1">
          <div className="text-neutral-400 text-[10px] font-semibold uppercase">
            Nested Props
          </div>
          <div className="font-mono text-xs">
            Figma: <span className="text-purple-300">"{figma}"</span> →{" "}
            <span className="text-blue-300">{react}</span>
          </div>
          {prop.nestedProps && prop.nestedProps.length > 0 && (
            <div className="text-[10px] border-t border-neutral-700 pt-1">
              {prop.nestedProps.length} sub-prop
              {prop.nestedProps.length !== 1 ? "s" : ""} defined
            </div>
          )}
        </div>
      );

    default:
      return "Hover for mapping preview";
  }
}

const PROP_TYPE_OPTIONS: {
  value: PropType;
  label: string;
  description?: string;
}[] = [
  { value: "string", label: "String", description: "Text property" },
  { value: "number", label: "Number", description: "Numeric property" },
  { value: "boolean", label: "Boolean", description: "On/off toggle" },
  { value: "enum", label: "Enum (Variant)", description: "Named options" },
  { value: "instance", label: "Instance Swap", description: "Component swap" },
  { value: "children", label: "Children", description: "Canvas layers" },
  { value: "textContent", label: "Text Content", description: "Layer text" },
  { value: "nestedProps", label: "Nested Props", description: "Sub-component" },
];

interface PropCardProps {
  prop: PropDef;
  index: number;
  errors: PropValidationError[];
  onUpdate: (prop: PropDef) => void;
  onRemove: () => void;
}

export function PropCard({
  prop,
  index,
  errors,
  onUpdate,
  onRemove,
}: PropCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: prop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Split errors from warnings so they can be styled differently
  const errMap = Object.fromEntries(
    errors
      .filter((e) => !e.severity || e.severity === "error")
      .map((e) => [e.field, e.message]),
  );
  const warnMap = Object.fromEntries(
    errors
      .filter((e) => e.severity === "warning")
      .map((e) => [e.field, e.message]),
  );
  const hasBlockingErrors = Object.keys(errMap).length > 0;

  const handleTypeChange = (newType: string) => {
    const base = makePropDef(newType as PropType);
    onUpdate({
      ...base,
      id: prop.id,
      reactProp: prop.reactProp,
      figmaProp: prop.figmaProp,
    });
  };

  const handleFigmaPropChange = (value: string) => {
    const updated = { ...prop, figmaProp: value } as PropDef;
    // Auto-populate reactProp if it's still empty
    if (!prop.reactProp.trim() && value.trim()) {
      (updated as Record<string, unknown>).reactProp = toCamelCase(value);
    }
    onUpdate(updated);
  };

  // Render the type-specific editor
  const renderEditor = () => {
    switch (prop.type) {
      case "string":
        return <StringEditor />;
      case "number":
        return <NumberEditor />;
      case "instance":
        return <InstanceEditor />;
      case "textContent":
        return <TextContentEditor />;
      case "boolean":
        return (
          <BooleanEditor prop={prop} onChange={onUpdate} errors={errMap} />
        );
      case "enum":
        return <EnumEditor prop={prop} onChange={onUpdate} errors={errMap} />;
      case "children":
        return <ChildrenEditor prop={prop} onChange={onUpdate} />;
      case "nestedProps":
        return <NestedPropsBuilder prop={prop} onChange={onUpdate} />;
    }
  };

  // Type badge colors
  const typeColorMap: Record<PropType, string> = {
    string: "bg-blue-100 text-blue-700",
    number: "bg-emerald-100 text-emerald-700",
    boolean: "bg-purple-100 text-purple-700",
    enum: "bg-amber-100 text-amber-700",
    instance: "bg-pink-100 text-pink-700",
    children: "bg-indigo-100 text-indigo-700",
    textContent: "bg-cyan-100 text-cyan-700",
    nestedProps: "bg-violet-100 text-violet-700",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border bg-neutral-900 transition-all",
        isDragging
          ? "shadow-lg ring-2 ring-primary-500/20"
          : "hover:shadow-md hover:border-primary-600",
        hasBlockingErrors ? "border-danger-600" : "border-neutral-700",
        isExpanded ? "shadow-sm" : "",
      )}
    >
      {/* Collapsed view - single row */}
      {!isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex w-full items-center gap-2 p-2 text-left hover:bg-neutral-800/50 rounded-lg transition-colors"
        >
          {/* Drag handle */}
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab text-neutral-600 hover:text-neutral-400 active:cursor-grabbing touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </span>

          {/* Expand chevron */}
          <ChevronRight className="h-4 w-4 text-neutral-400" />

          {/* Index badge */}
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-caption font-bold text-neutral-500">
            {index + 1}
          </span>

          {/* Property names with preview tooltip */}
          <Tooltip
            content={getPreviewTooltip(prop)}
            side="top"
            delayDuration={300}
          >
            <div className="flex flex-1 items-center gap-2 min-w-0">
              <code className="text-body font-mono text-neutral-400 font-medium truncate min-w-0">
                {prop.reactProp || (
                  <span className="text-neutral-400">unnamed</span>
                )}
              </code>
              <span className="text-neutral-100 flex-shrink-0">→</span>
              <span className="text-body text-neutral-600 truncate min-w-0">
                {prop.figmaProp || (
                  <span className="text-neutral-300 italic">no mapping</span>
                )}
              </span>
            </div>
          </Tooltip>

          {/* Type badge */}
          <span
            className={cn(
              "px-2 py-0.5 rounded text-caption font-medium shrink-0",
              typeColorMap[prop.type],
            )}
          >
            {PROP_TYPE_OPTIONS.find((o) => o.value === prop.type)?.label}
          </span>

          {/* Error indicator */}
          {hasBlockingErrors && (
            <span className="h-2 w-2 rounded-full bg-danger-500 shrink-0" />
          )}

          {/* Remove button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="rounded p-1 text-neutral-600 opacity-0 transition-all hover:bg-danger-900 hover:text-danger-400 group-hover:opacity-100 shrink-0"
            aria-label="Remove property"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </button>
      )}

      {/* Expanded view - full editor */}
      {isExpanded && (
        <>
          {/* Header */}
          <div className="flex items-start gap-3 p-3">
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className="mt-1 cursor-grab text-neutral-600 hover:text-neutral-400 active:cursor-grabbing touch-none"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>

            {/* Collapse button */}
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="mt-1 text-neutral-500 hover:text-neutral-300"
            >
              <ChevronRight className="h-4 w-4 rotate-90" />
            </button>

            {/* Index badge */}
            <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-caption font-bold text-neutral-500">
              {index + 1}
            </span>

            {/* Main fields */}
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                label={index === 0 ? "React Prop Name" : undefined}
                value={prop.reactProp}
                onChange={(e) =>
                  onUpdate({ ...prop, reactProp: e.target.value } as PropDef)
                }
                placeholder="propName"
                mono
                error={errMap.reactProp}
              />
              <Input
                label={index === 0 ? "Figma Property / Layer Name" : undefined}
                value={prop.figmaProp}
                onChange={(e) => handleFigmaPropChange(e.target.value)}
                placeholder="Figma Property"
                error={errMap.figmaProp}
              />
              {warnMap.figmaProp && !errMap.figmaProp && (
                <p className="-mt-2 text-caption text-amber-600">
                  {warnMap.figmaProp}
                </p>
              )}
              <div className="flex items-end gap-1">
                <Select
                  label={index === 0 ? "Type" : undefined}
                  value={prop.type}
                  onValueChange={handleTypeChange}
                  options={PROP_TYPE_OPTIONS}
                  className="flex-1"
                />
                <div className={cn("mb-0", index === 0 ? "mt-5" : "")}>
                  <PropTypeTooltip propType={prop.type} />
                </div>
              </div>
            </div>

            {/* Remove button */}
            <button
              type="button"
              onClick={onRemove}
              className="mt-0.5 rounded p-1.5 text-neutral-600 transition-all hover:bg-danger-900 hover:text-danger-400"
              aria-label="Remove property"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Type-specific editor */}
          <div className="border-t border-neutral-800 bg-neutral-900/60 px-4 pb-4 pt-3 rounded-b-lg">
            {renderEditor()}
          </div>
        </>
      )}
    </div>
  );
}

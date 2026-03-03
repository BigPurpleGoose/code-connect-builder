import React from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PropDef, PropType } from "@/types/connection";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { PropTypeTooltip } from "@/components/docs/PropTypeTooltip";
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-xl border bg-white shadow-sm transition-all",
        isDragging
          ? "shadow-lg ring-2 ring-blue-500/20"
          : "hover:shadow-md hover:border-blue-300",
        hasBlockingErrors ? "border-red-200" : "border-slate-200",
      )}
    >
      {/* Card header */}
      <div className="flex items-start gap-3 p-4">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Index badge */}
        <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-400">
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
            <p className="-mt-2 text-[10px] text-amber-600">
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
          className="mt-0.5 rounded p-1.5 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
          aria-label="Remove property"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Type-specific editor */}
      <div className="border-t border-slate-100 bg-slate-50/60 px-4 pb-4 pt-3 rounded-b-xl">
        {renderEditor()}
      </div>
    </div>
  );
}

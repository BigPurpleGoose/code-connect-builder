import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, ChevronDown, List } from "lucide-react";
import { useConnection } from "@/contexts/ConnectionContext";
import { PropCard } from "./PropCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Tooltip";
import type { PropType, PropDef } from "@/types/connection";
import type { ValidationMap } from "@/types/connection";
import * as Popover from "@radix-ui/react-popover";

const ADD_OPTIONS: { type: PropType; label: string; hint: string }[] = [
  { type: "string", label: "String", hint: "Text property" },
  { type: "number", label: "Number", hint: "Numeric property" },
  { type: "boolean", label: "Boolean", hint: "Toggle / on-off" },
  { type: "enum", label: "Enum (Variant)", hint: "Named variant options" },
  { type: "instance", label: "Instance Swap", hint: "Nested component swap" },
  { type: "children", label: "Children", hint: "Canvas layers" },
  { type: "textContent", label: "Text Content", hint: "Raw text from layer" },
  { type: "nestedProps", label: "Nested Props", hint: "Sub-component mapping" },
];

interface PropListProps {
  validationMap: ValidationMap;
}

export function PropList({ validationMap }: PropListProps) {
  const { activeDef, addProp, removeProp, updateProp, reorderProps } =
    useConnection();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = activeDef.props.map((p) => p.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));

    const reordered = [...ids];
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, String(active.id));
    reorderProps(reordered);
  };

  return (
    <div>
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <List className="h-4 w-4 text-neutral-500" />
          <h2 className="text-sm font-bold text-neutral-200">Props</h2>
          <Badge>{activeDef.props.length}</Badge>
        </div>
        <AddPropMenu onAdd={addProp} />
      </div>

      {/* Empty state */}
      {activeDef.props.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-700 py-12 text-center">
          <List className="h-8 w-8 text-neutral-600 mb-3" />
          <p className="text-sm font-medium text-neutral-400">
            No properties mapped yet
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Click "Add Prop" above to connect Figma properties
          </p>
        </div>
      )}

      {/* Sortable prop cards */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={activeDef.props.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {activeDef.props.map((prop, index) => (
              <PropCard
                key={prop.id}
                prop={prop}
                index={index}
                errors={validationMap[prop.id] ?? []}
                onUpdate={(updated: PropDef) => updateProp(prop.id, updated)}
                onRemove={() => removeProp(prop.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function AddPropMenu({ onAdd }: { onAdd: (type: PropType) => void }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button size="xs" variant="primary">
          <Plus className="h-3.5 w-3.5" />
          Add Prop
          <ChevronDown className="h-3 w-3 ml-0.5 opacity-60" />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-40 w-52 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl animate-fade-in"
        >
          <div className="p-1.5">
            <p className="px-2 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Prop Type
            </p>
            {ADD_OPTIONS.map((opt) => (
              <Popover.Close asChild key={opt.type}>
                <button
                  onClick={() => onAdd(opt.type)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-[10px] text-neutral-400">
                    {opt.hint}
                  </span>
                </button>
              </Popover.Close>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

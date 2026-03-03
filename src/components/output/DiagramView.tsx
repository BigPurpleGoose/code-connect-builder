import React, { useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Share2, Download } from "lucide-react";
import { useConnection } from "@/contexts/ConnectionContext";
import type { ComponentDefinition } from "@/types/connection";

// Layout constants
const W = 860;
const COL_W = 220;
const LEFT_X = 40;
const RIGHT_X = W - COL_W - 40;
const CENTER_X = W / 2;
const NODE_H = 36;
const NODE_GAP = 12;
const COMPONENT_HEADER_H = 52;
const COMPONENT_PADDING = 24;
const COMPONENT_GAP = 32;
const TITLE_SECTION_H = 90;

function computeComponentHeight(def: ComponentDefinition): number {
  const propsH = Math.max(def.props.length, 1) * (NODE_H + NODE_GAP) - NODE_GAP;
  return COMPONENT_HEADER_H + COMPONENT_PADDING + propsH + COMPONENT_PADDING;
}

function computeTotalHeight(definitions: ComponentDefinition[]): number {
  return (
    TITLE_SECTION_H +
    definitions.reduce(
      (acc, def) => acc + computeComponentHeight(def) + COMPONENT_GAP,
      0,
    )
  );
}

const TYPE_COLORS: Record<string, string> = {
  string: "#60A5FA",
  number: "#34D399",
  boolean: "#F59E0B",
  enum: "#A78BFA",
  instance: "#F472B6",
  children: "#FB923C",
  textContent: "#2DD4BF",
  nestedProps: "#E879F9",
};

function PropTypeChip({ type }: { type: string }) {
  const color = TYPE_COLORS[type] ?? "#94A3B8";
  return (
    <g>
      <rect
        x={CENTER_X - 32}
        y={-9}
        width={64}
        height={18}
        rx={9}
        fill={color}
        fillOpacity={0.15}
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.5}
      />
      <text
        x={CENTER_X}
        y={4}
        textAnchor="middle"
        fill={color}
        style={{ fontSize: 9, fontFamily: "monospace", fontWeight: 600 }}
      >
        {type}
      </text>
    </g>
  );
}

interface ComponentBlockProps {
  def: ComponentDefinition;
  yOffset: number;
}

function ComponentBlock({ def, yOffset }: ComponentBlockProps) {
  const blockH = computeComponentHeight(def);
  const showProps = def.props.filter((p) => p.reactProp.trim());

  return (
    <g transform={`translate(0, ${yOffset})`}>
      {/* Component container */}
      <rect
        x={LEFT_X - 8}
        y={0}
        width={W - (LEFT_X - 8) * 2}
        height={blockH}
        rx={12}
        fill="#F8FAFC"
        stroke="#E2E8F0"
        strokeWidth={1.5}
      />

      {/* Component name header */}
      <rect
        x={LEFT_X - 8}
        y={0}
        width={W - (LEFT_X - 8) * 2}
        height={COMPONENT_HEADER_H}
        rx={12}
        fill="#EFF6FF"
        stroke="#DBEAFE"
        strokeWidth={1.5}
      />
      {/* Bottom of header is square */}
      <rect
        x={LEFT_X - 8}
        y={COMPONENT_HEADER_H - 12}
        width={W - (LEFT_X - 8) * 2}
        height={12}
        fill="#EFF6FF"
        stroke="none"
      />
      <rect
        x={LEFT_X - 7}
        y={COMPONENT_HEADER_H - 1}
        width={W - (LEFT_X - 8) * 2 - 2}
        height={1}
        fill="#DBEAFE"
      />

      <text
        x={CENTER_X}
        y={22}
        textAnchor="middle"
        fill="#1E40AF"
        style={{ fontSize: 14, fontWeight: 700, fontFamily: "system-ui" }}
      >
        {def.name}
      </text>
      <text
        x={CENTER_X}
        y={38}
        textAnchor="middle"
        fill="#93C5FD"
        style={{ fontSize: 10, fontFamily: "monospace" }}
      >
        {def.figmaUrl
          ? def.figmaUrl.replace(/^https?:\/\/[^/]+/, "").slice(0, 60) + "..."
          : "No Figma URL"}
      </text>

      {/* Props */}
      {showProps.length === 0 && (
        <text
          x={CENTER_X}
          y={COMPONENT_HEADER_H + COMPONENT_PADDING + NODE_H / 2}
          textAnchor="middle"
          fill="#94A3B8"
          style={{ fontSize: 11, fontStyle: "italic" }}
        >
          No mapped props yet
        </text>
      )}

      {showProps.map((prop, i) => {
        const y =
          COMPONENT_HEADER_H +
          COMPONENT_PADDING +
          i * (NODE_H + NODE_GAP) +
          NODE_H / 2;

        return (
          <g key={prop.id} transform={`translate(0, ${y})`}>
            {/* Figma node */}
            <rect
              x={LEFT_X}
              y={-NODE_H / 2}
              width={COL_W}
              height={NODE_H}
              rx={6}
              fill="white"
              stroke="#DDD6FE"
              strokeWidth={1.5}
            />
            <text
              x={LEFT_X + 10}
              y={5}
              fill="#6D28D9"
              style={{ fontSize: 11, fontFamily: "monospace" }}
            >
              {prop.figmaProp || "(unnamed)"}
            </text>

            {/* Connector line */}
            <line
              x1={LEFT_X + COL_W + 4}
              y1={0}
              x2={CENTER_X - 36}
              y2={0}
              stroke="#CBD5E1"
              strokeWidth={1}
              strokeDasharray="3 2"
            />
            <line
              x1={CENTER_X + 36}
              y1={0}
              x2={RIGHT_X - 4}
              y2={0}
              stroke="#CBD5E1"
              strokeWidth={1}
              strokeDasharray="3 2"
            />

            {/* Type chip */}
            <g transform={`translate(0, 0)`}>
              <PropTypeChip type={prop.type} />
            </g>

            {/* Arrowhead */}
            <polygon
              points={`${RIGHT_X - 6},${-4} ${RIGHT_X},0 ${RIGHT_X - 6},${4}`}
              fill="#CBD5E1"
            />

            {/* React node */}
            <rect
              x={RIGHT_X}
              y={-NODE_H / 2}
              width={COL_W}
              height={NODE_H}
              rx={6}
              fill="white"
              stroke="#BFDBFE"
              strokeWidth={1.5}
            />
            <text
              x={RIGHT_X + 10}
              y={5}
              fill="#1D4ED8"
              style={{ fontSize: 11, fontFamily: "monospace" }}
            >
              {prop.reactProp}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function DiagramView() {
  const { definitions } = useConnection();
  const svgRef = useRef<SVGSVGElement>(null);
  const totalH = computeTotalHeight(definitions);

  const downloadSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgRef.current);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${definitions[0].name.split(".")[0]}_mapping.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Compute Y offsets per definition
  let currentY = TITLE_SECTION_H;
  const offsets: number[] = [];
  for (const def of definitions) {
    offsets.push(currentY);
    currentY += computeComponentHeight(def) + COMPONENT_GAP;
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors">
          <Share2 className="h-3.5 w-3.5" />
          Diagram
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm radix-overlay" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-5xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl radix-content focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50 rounded-t-2xl shrink-0">
            <div>
              <Dialog.Title className="text-base font-bold text-slate-900">
                Mapping Diagram
              </Dialog.Title>
              <Dialog.Description className="text-xs text-slate-500 mt-0.5">
                Visual overview of Figma → React connections
              </Dialog.Description>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadSvg}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
              >
                <Download className="h-3.5 w-3.5" /> Download SVG
              </button>
              <Dialog.Close asChild>
                <button className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* SVG canvas */}
          <div className="flex-1 overflow-auto bg-slate-100 p-6 rounded-b-2xl">
            <div className="flex justify-center">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <svg
                  ref={svgRef}
                  width={W}
                  height={totalH}
                  viewBox={`0 0 ${W} ${totalH}`}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Title */}
                  <text
                    x={40}
                    y={32}
                    fill="#0F172A"
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      fontFamily: "system-ui",
                    }}
                  >
                    {definitions[0].name.split(".")[0]} — Code Connect Mapping
                  </text>
                  <text
                    x={40}
                    y={52}
                    fill="#94A3B8"
                    style={{ fontSize: 12, fontFamily: "system-ui" }}
                  >
                    Generated by Code Connect Builder
                  </text>

                  {/* Column labels */}
                  <text
                    x={LEFT_X}
                    y={76}
                    fill="#7C3AED"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "system-ui",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    FIGMA PROPERTY
                  </text>
                  <text
                    x={CENTER_X}
                    y={76}
                    textAnchor="middle"
                    fill="#94A3B8"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "system-ui",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    MAPPING TYPE
                  </text>
                  <text
                    x={RIGHT_X}
                    y={76}
                    fill="#1D4ED8"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "system-ui",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    REACT PROP
                  </text>
                  <line
                    x1={40}
                    y1={82}
                    x2={W - 40}
                    y2={82}
                    stroke="#E2E8F0"
                    strokeWidth={1}
                  />

                  {/* Component blocks */}
                  {definitions.map((def, i) => (
                    <ComponentBlock
                      key={def.id}
                      def={def}
                      yOffset={offsets[i]}
                    />
                  ))}
                </svg>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

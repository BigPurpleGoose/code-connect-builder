import React from "react";

export function NumberEditor() {
  return (
    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-1.5">
      <p className="text-[11px] text-amber-800 leading-relaxed">
        <strong>API note:</strong>{" "}
        <code className="font-mono">figma.number()</code> does not exist in the
        Code Connect API. This prop type maps your Figma numeric variable using{" "}
        <code className="font-mono">figma.string()</code> — which is the correct
        and only supported approach.
      </p>
      <p className="text-[10px] text-amber-700">
        If you need a fixed numeric value in the example, add it as a{" "}
        <strong>Prop Override</strong> in the Example section below.
      </p>
    </div>
  );
}

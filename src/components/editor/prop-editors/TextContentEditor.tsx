import React from "react";

export function TextContentEditor() {
  return (
    <p className="text-[11px] text-slate-400 italic">
      Extracts the raw text content from a named Figma{" "}
      <strong className="text-slate-600">canvas layer</strong> (not a sidebar
      property). The "Figma Property / Layer Name" field above should be the
      exact name of the text layer in the Figma file.
    </p>
  );
}

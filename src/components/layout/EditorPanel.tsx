import React from "react";
import { ComponentMeta } from "@/components/editor/ComponentMeta";
import { PropList } from "@/components/editor/PropList";
import { ExampleBuilder } from "@/components/example/ExampleBuilder";
import { useConnection } from "@/contexts/ConnectionContext";
import { useValidation } from "@/hooks/useValidation";

export function EditorPanel() {
  const { activeDef, activeDefId, updateDefinition } = useConnection();
  const { props: propErrors, def: defErrors } = useValidation();

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="mx-auto max-w-3xl space-y-8 p-8">
        {/* Component configuration (name, URL, import path) */}
        <ComponentMeta defErrors={defErrors} />

        {/* Prop mappings */}
        <PropList validationMap={propErrors} />

        {/* Example render configuration */}
        <ExampleBuilder
          config={activeDef.example}
          componentName={activeDef.name}
          props={activeDef.props}
          onChange={(config) =>
            updateDefinition(activeDefId, "example", config)
          }
        />
      </div>
    </div>
  );
}

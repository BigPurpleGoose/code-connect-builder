// ─── Prop Types ──────────────────────────────────────────────────────────────

export type BooleanMode = 'simple' | 'inverse' | 'visibility' | 'complex';

export interface EnumOption {
  figma: string;
  react: string;
  isCode: boolean; // treat react value as raw code literal (not wrapped in quotes)
}

export interface NestedPropDef {
  id: string;
  reactProp: string;
  figmaProp: string;
  type: 'string' | 'boolean' | 'children' | 'textContent' | 'number' | 'enum' | 'instance';
  boolMode?: BooleanMode;
  boolChildLayer?: string;
  enumOptions?: EnumOption[];
}

export type PropType =
  | 'string'
  | 'boolean'
  | 'enum'
  | 'instance'
  | 'children'
  | 'textContent'
  | 'nestedProps'
  | 'number';

// Discriminated union — each prop type carries only its relevant extra fields
export type PropDef =
  | { id: string; reactProp: string; figmaProp: string; type: 'string' }
  | { id: string; reactProp: string; figmaProp: string; type: 'number' }
  | { id: string; reactProp: string; figmaProp: string; type: 'instance' }
  | { id: string; reactProp: string; figmaProp: string; type: 'textContent' }
  | {
      id: string;
      reactProp: string;
      figmaProp: string;
      type: 'boolean';
      boolMode: BooleanMode;
      boolChildLayer: string;
      boolTrueValue: string;
      boolFalseValue: string;
      autoGenerateConditional?: boolean;  // Auto-create conditional branch for visibility mode
    }
  | {
      id: string;
      reactProp: string;
      figmaProp: string;
      type: 'enum';
      enumOptions: EnumOption[];
    }
  | {
      id: string;
      reactProp: string;
      figmaProp: string;
      type: 'children';
      childrenLayers: string[];
    }
  | {
      id: string;
      reactProp: string;
      figmaProp: string;
      type: 'nestedProps';
      nestedProps: NestedPropDef[];
    };

// ─── Example Config ───────────────────────────────────────────────────────────

export interface PropOverride {
  id: string;
  key: string;
  value: string;
  isCode: boolean;
}

// ─── Conditional Rendering ────────────────────────────────────────────────────

export interface ConditionalBranch {
  id: string;
  propName: string;        // Which prop to check (must be boolean or enum)
  propType: 'boolean' | 'enum';
  condition: string;       // e.g., "true" or "disabled" (enum value)
  thenRender: string;      // JSX when condition matches
  elseRender?: string;     // JSX when condition doesn't match (optional)
}

// ─── JSX Prop Values ─────────────────────────────────────────────────────────

export interface JsxPropAttr {
  id: string;
  key: string;             // Prop name on the JSX element
  value: string;           // Value (can reference nestedProps with dot notation)
  valueType: 'static' | 'nestedProp' | 'code';
}

export interface JsxPropValue {
  id: string;
  propKey: string;         // Target prop name (e.g., "heading")
  componentName: string;   // JSX element name (e.g., "TaskCard.Heading")
  componentProps: JsxPropAttr[];  // Props passed to the JSX element
}

export interface ExampleConfig {
  spreadFigmaProps: boolean;
  staticChildren: string;
  propOverrides: PropOverride[];
  conditionalBranches: ConditionalBranch[];
  jsxPropValues: JsxPropValue[];
}

// ─── Variant Scope & Links ───────────────────────────────────────────────────

/**
 * A single entry in the variant scope — scopes a figma.connect() call to a
 * specific combination of Figma variant property values.
 * Generates: variant: { "State": "Disabled" }
 */
export interface VariantEntry {
  id: string;
  key: string;   // Figma variant property name, e.g. "State"
  value: string; // Variant value, e.g. "Disabled"
}

/**
 * A link shown in Figma Dev Mode alongside the code snippet.
 * Generates: links: [{ name: 'Storybook', url: '...' }]
 */
export interface LinkDef {
  id: string;
  name: string; // Display label, e.g. "Storybook"
  url: string;  // Full URL
}

// ─── Component Definition ─────────────────────────────────────────────────────

export interface ComponentDefinition {
  id: string;
  name: string;          // React component name e.g. "Button" or "Button.Icon"
  figmaUrl: string;      // Figma file/node URL
  importPath: string;    // e.g. './components/Button'
  props: PropDef[];
  example: ExampleConfig;
  variantScope: VariantEntry[];  // Scopes this connect to specific Figma variant states
  links: LinkDef[];              // Dev Mode links (Storybook, Figma, etc.)
}

// ─── Template ─────────────────────────────────────────────────────────────────

export interface Template {
  id: string;
  name: string;
  createdAt: string;     // ISO date string
  definitions: ComponentDefinition[];
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface PropValidationError {
  field: 'reactProp' | 'figmaProp' | 'boolChildLayer' | 'boolTrueValue' | 'boolFalseValue' | 'enumOptions' | 'children' | 'importPath' | 'nestedProps' | 'conditionalBranch' | 'jsxPropValue';
  message: string;
  severity?: 'error' | 'warning'; // defaults to 'error' when absent
}

export type ValidationMap = Record<string, PropValidationError[]>; // keyed by propId
export type DefValidationErrors = { importPath?: string; figmaUrl?: string; name?: string };

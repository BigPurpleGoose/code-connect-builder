import type { ComponentDefinition, PropDef, ExampleConfig, NestedPropDef, EnumOption, PropOverride, VariantEntry, LinkDef, ConditionalBranch, JsxPropValue, JsxPropAttr } from '@/types/connection';
import { genId } from './stringUtils';

export function makeExampleConfig(overrides?: Partial<ExampleConfig>): ExampleConfig {
  return {
    spreadFigmaProps: true,
    staticChildren: '',
    propOverrides: [],
    conditionalBranches: [],
    jsxPropValues: [],
    ...overrides,
  };
}

export function makePropDef(type: PropDef['type'] = 'string'): PropDef {
  const base = { id: genId(), reactProp: '', figmaProp: '' };
  switch (type) {
    case 'boolean':
      return { ...base, type: 'boolean', boolMode: 'simple', boolChildLayer: '', boolTrueValue: '', boolFalseValue: '', autoGenerateConditional: false };
    case 'enum':
      return { ...base, type: 'enum', enumOptions: [makeEnumOption()] };
    case 'children':
      return { ...base, type: 'children', childrenLayers: [''] };
    case 'nestedProps':
      return { ...base, type: 'nestedProps', nestedProps: [] };
    default:
      return { ...base, type } as PropDef;
  }
}

export function makeEnumOption(overrides?: Partial<EnumOption>): EnumOption {
  return { figma: '', react: '', isCode: false, ...overrides };
}

export function makePropOverride(): PropOverride {
  return { id: genId(), key: '', value: '', isCode: false };
}

export function makeConditionalBranch(): ConditionalBranch {
  return {
    id: genId(),
    propName: '',
    propType: 'boolean',
    condition: 'true',
    thenRender: '',
    elseRender: '',
  };
}

export function makeJsxPropAttr(): JsxPropAttr {
  return {
    id: genId(),
    key: '',
    value: '',
    valueType: 'static',
  };
}

export function makeJsxPropValue(): JsxPropValue {
  return {
    id: genId(),
    propKey: '',
    componentName: '',
    componentProps: [],
  };
}

export function makeNestedPropDef(type: NestedPropDef['type'] = 'string'): NestedPropDef {
  const base = { id: genId(), reactProp: '', figmaProp: '', type };
  if (type === 'enum') {
    return { ...base, type: 'enum', enumOptions: [makeEnumOption()] };
  }
  if (type === 'boolean') {
    return { ...base, type: 'boolean', boolMode: 'simple', boolChildLayer: '' };
  }
  return base as NestedPropDef;
}

export function makeVariantEntry(): VariantEntry {
  return { id: genId(), key: '', value: '' };
}

export function makeLinkDef(): LinkDef {
  return { id: genId(), name: '', url: '' };
}

/**
 * Create a blank named root ComponentDefinition — used by addRootDefinition.
 * No sample props, empty variantScope/links so the user fills everything in.
 */
export function makeRootDefinition(name: string = 'NewComponent'): ComponentDefinition {
  return {
    id: genId(),
    name,
    figmaUrl: '',
    importPath: `./${name}`,
    props: [],
    example: makeExampleConfig(),
    variantScope: [],
    links: [],
  };
}

export function makeDefinition(index: number = 0): ComponentDefinition {
  return {
    id: genId(),
    name: index === 0 ? 'Button' : `Button.SubComponent`,
    figmaUrl: '',
    importPath: './Button',
    props: [
      { ...makePropDef('enum'), reactProp: 'kind', figmaProp: 'Kind', type: 'enum', enumOptions: [{ figma: 'Brand', react: 'brand', isCode: false }] } as PropDef,
      { ...makePropDef('boolean'), reactProp: 'disabled', figmaProp: 'Disabled', type: 'boolean', boolMode: 'simple', boolChildLayer: '', boolTrueValue: '', boolFalseValue: '', autoGenerateConditional: false } as PropDef,
    ],
    example: makeExampleConfig(),
    variantScope: [],
    links: [],
  };
}

import type { ComponentDefinition, PropDef, ExampleConfig, NestedPropDef, JsxPropValue, JsxPropAttr, ConditionalBranch } from '@/types/connection';
import { toStringLiteral, needsQuotes } from './stringUtils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Render an enum object key: unquoted when it's a valid JS identifier
 * (e.g. Primary), single-quoted when it contains spaces or special chars
 * (e.g. 'With Icon'). Matches the style used in the official Code Connect docs.
 */
function enumKey(str: string): string {
  return needsQuotes(str) ? toStringLiteral(str) : str;
}

// ─── Per-prop generators ──────────────────────────────────────────────────────

function genNestedPropLine(np: NestedPropDef): string {
  const key = np.figmaProp ? toStringLiteral(np.figmaProp) : '""';
  switch (np.type) {
    case 'string':
      return `figma.string(${key})`;
    case 'number':
      // figma.number() does not exist in the Code Connect API.
      // Numeric Figma variables are mapped via figma.string().
      return `figma.string(${key})`;
    case 'textContent':
      return `figma.textContent(${key})`;
    case 'children':
      // Always use array form inside nestedProps for consistency
      return `figma.children([${key}])`;
    case 'instance':
      return `figma.instance(${key})`;
    case 'enum': {
      if (!np.enumOptions || np.enumOptions.length === 0) {
        return `figma.enum(${key}, {})`;
      }
      const entries = np.enumOptions
        .filter((o) => o.figma.trim())
        .map((o) => {
          const k = enumKey(o.figma.trim());
          const reactVal = o.isCode ? o.react.trim() : toStringLiteral(o.react.trim());
          return `${k}: ${reactVal}`;
        })
        .join(', ');
      return `figma.enum(${key}, { ${entries} })`;
    }
    case 'boolean': {
      if (np.boolMode === 'inverse') return `figma.boolean(${key}, { true: false, false: true })`;
      if (np.boolMode === 'visibility') {
        const layer = np.boolChildLayer ? toStringLiteral(np.boolChildLayer) : "'Layer'";
        return `figma.boolean(${key}, { true: figma.children([${layer}]), false: undefined })`;
      }
      return `figma.boolean(${key})`;
    }
    default:
      return `figma.string(${key})`;
  }
}

function generatePropMapping(prop: PropDef): string {
  const figmaKey = prop.figmaProp.trim()
    ? toStringLiteral(prop.figmaProp.trim())
    : '""';

  switch (prop.type) {
    case 'string':
      return `figma.string(${figmaKey})`;

    case 'number':
      // figma.number() is not a real API method. Code Connect maps numeric
      // Figma variables to React via figma.string() or figma.enum().
      return `figma.string(${figmaKey})`;

    case 'textContent':
      return `figma.textContent(${figmaKey})`;

    case 'instance':
      return `figma.instance(${figmaKey})`;

    case 'boolean': {
      const { boolMode, boolChildLayer, boolTrueValue, boolFalseValue } = prop;
      if (boolMode === 'simple') return `figma.boolean(${figmaKey})`;
      if (boolMode === 'inverse') return `figma.boolean(${figmaKey}, { true: false, false: true })`;
      if (boolMode === 'visibility') {
        const layer = boolChildLayer.trim()
          ? toStringLiteral(boolChildLayer.trim())
          : "'Layer'";
        // The true branch MUST be a figma.* call per the API — figma.children() wraps the layer
        return `figma.boolean(${figmaKey}, {\n      true: figma.children([${layer}]),\n      false: undefined,\n    })`;
      }
      if (boolMode === 'complex') {
        const t = boolTrueValue.trim() || 'undefined';
        const f = boolFalseValue.trim() || 'undefined';
        return `figma.boolean(${figmaKey}, {\n      true: ${t},\n      false: ${f},\n    })`;
      }
      return `figma.boolean(${figmaKey})`;
    }

    case 'enum': {
      if (prop.enumOptions.length === 0) return `figma.enum(${figmaKey}, {})`;
      const entries = prop.enumOptions
        .filter((o) => o.figma.trim())
        .map((o) => {
          // Quote keys only when required (e.g. 'With Icon' vs Primary)
          const k = enumKey(o.figma.trim());
          const reactVal = o.isCode ? o.react.trim() : toStringLiteral(o.react.trim());
          return `      ${k}: ${reactVal},`;
        })
        .join('\n');
      return `figma.enum(${figmaKey}, {\n${entries}\n    })`;
    }

    case 'children': {
      const filled = prop.childrenLayers.filter((l) => l.trim());
      // Wildcard (or no layers configured): figma.children(['*'])
      // The string form figma.children('*') is NOT in the documented API.
      if (filled.length === 0 || (filled.length === 1 && filled[0] === '*')) {
        return `figma.children(['*'])`;
      }
      // Single named layer: string form is valid per API docs
      if (filled.length === 1) {
        return `figma.children(${toStringLiteral(filled[0].trim())})`;
      }
      // Multiple layers: array form required
      const list = filled.map((l) => toStringLiteral(l.trim())).join(', ');
      return `figma.children([${list}])`;
    }

    case 'nestedProps': {
      if (prop.nestedProps.length === 0) {
        return `figma.nestedProps(${figmaKey}, {})`;
      }
      const entries = prop.nestedProps
        .filter((np) => np.reactProp.trim())
        .map((np) => `      ${np.reactProp}: ${genNestedPropLine(np)},`)
        .join('\n');
      return `figma.nestedProps(${figmaKey}, {\n${entries}\n    })`;
    }
  }
}

// ─── Example block ────────────────────────────────────────────────────────────

/**
 * Generate a JSX element for a JSX prop value.
 * Example: <TaskCard.Heading text={props.heading.text} level="2" />
 */
function generateJsxPropElement(jsxProp: JsxPropValue): string {
  if (!jsxProp.componentName.trim()) return '';

  const attrs = jsxProp.componentProps
    .filter((attr) => attr.key.trim() && attr.value.trim())
    .map((attr) => {
      const key = attr.key.trim();
      let value: string;

      switch (attr.valueType) {
        case 'static':
          // Wrap in quotes
          value = toStringLiteral(attr.value.trim());
          break;
        case 'nestedProp':
          // Output as code reference (e.g., {props.heading.text})
          value = `{${attr.value.trim()}}`;
          break;
        case 'code':
          // Output raw code wrapped in braces
          value = `{${attr.value.trim()}}`;
          break;
        default:
          value = toStringLiteral(attr.value.trim());
      }

      return `${key}=${value}`;
    })
    .join(' ');

  const component = jsxProp.componentName.trim();
  if (attrs) {
    return `<${component} ${attrs} />`;
  }
  return `<${component} />`;
}

/**
 * Wrap JSX in conditional rendering based on a branch.
 * Example: props.hasIcon ? <Component>{icon}</Component> : <Component />
 */
function wrapInConditional(
  jsx: string,
  branch: ConditionalBranch,
  usePropsObject: boolean
): string {
  if (!branch.propName.trim() || !branch.thenRender.trim()) return jsx;

  // Determine how to reference the prop
  const propRef = usePropsObject
    ? `props.${branch.propName.trim()}`
    : branch.propName.trim();

  // Build condition based on type
  let condition: string;
  if (branch.propType === 'boolean') {
    if (branch.condition === 'false') {
      condition = `!${propRef}`;
    } else {
      condition = propRef;
    }
  } else {
    // Enum - compare with the value
    condition = `${propRef} === ${toStringLiteral(branch.condition)}`;
  }

  const thenBlock = branch.thenRender.trim();
  const elseBlock = branch.elseRender?.trim();

  // Format with proper indentation
  if (elseBlock) {
    return `${condition} ? (\n      ${thenBlock}\n    ) : (\n      ${elseBlock}\n    )`;
  } else {
    // No else branch - just the ternary with undefined
    return `${condition} ? (\n      ${thenBlock}\n    ) : (\n      ${jsx}\n    )`;
  }
}

/**
 * Generate the example function expression.
 *
 * When spreadFigmaProps = true  → (props) => <Component {...props} />
 * When spreadFigmaProps = false → ({ label, kind }) => <Component label={label} kind={kind} />
 *
 * The destructured form matches the official Code Connect API docs and makes
 * it explicit which props come from Figma vs. are hardcoded.
 */
function generateExample(name: string, config: ExampleConfig, props: PropDef[]): string {
  // Step 0: Auto-generate conditional branches for visibility mode booleans
  const autoConditionalBranches = props
    .filter((p): p is Extract<PropDef, { type: 'boolean' }> =>
      p.type === 'boolean' &&
      p.boolMode === 'visibility' &&
      p.autoGenerateConditional === true &&
      p.reactProp.trim() !== '' &&
      p.boolChildLayer.trim() !== ''
    )
    .map((p) => ({
      id: `auto-${p.id}`,
      propName: p.reactProp.trim(),
      propType: 'boolean' as const,
      condition: 'true',
      thenRender: `{${p.reactProp.trim()}}`,
      elseRender: undefined,
    }));

  // Combine auto-generated with manual conditional branches
  const allBranches = [...autoConditionalBranches, ...config.conditionalBranches];

  // Step 1: Process JSX prop values and add them as code-mode overrides
  const jsxPropOverrides = config.jsxPropValues
    .filter((jp) => jp.propKey.trim() && jp.componentName.trim())
    .map((jp) => ({
      key: jp.propKey.trim(),
      value: generateJsxPropElement(jp),
      isCode: true,
    }));

  // Combine with regular overrides
  const allOverrides = [
    ...config.propOverrides.filter((o) => o.key.trim() && o.value.trim()),
    ...jsxPropOverrides,
  ];

  const overrides = allOverrides
    .map((o) => {
      const val = o.isCode ? `{${o.value.trim()}}` : `"${o.value.trim()}"`;
      return `${o.key.trim()}=${val}`;
    })
    .join(' ');

  const children = config.staticChildren.trim();

  // Step 2: Generate base JSX
  let baseJsx: string;
  let paramStr: string;

  if (config.spreadFigmaProps) {
    paramStr = 'props';
    const attrsStr = ['{...props}', overrides].filter(Boolean).join(' ');
    if (children) {
      baseJsx = `<${name} ${attrsStr}>\n      ${children}\n    </${name}>`;
    } else {
      baseJsx = `<${name} ${attrsStr} />`;
    }
  } else {
    // Destructured form — official API style
    const mappedProps = props.filter((p) => p.reactProp.trim());
    const overrideKeys = new Set(allOverrides.map((o) => o.key.trim()));
    const destructuredProps = mappedProps.filter((p) => !overrideKeys.has(p.reactProp.trim()));

    paramStr =
      destructuredProps.length > 0
        ? `{ ${destructuredProps.map((p) => p.reactProp.trim()).join(', ')} }`
        : '';

    const propAttrs = destructuredProps
      .map((p) => `${p.reactProp.trim()}={${p.reactProp.trim()}}`)
      .join(' ');
    const attrsStr = [propAttrs, overrides].filter(Boolean).join(' ');

    if (children) {
      baseJsx = `<${name}${attrsStr ? ' ' + attrsStr : ''}>\n      ${children}\n    </${name}>`;
    } else {
      baseJsx = `<${name}${attrsStr ? ' ' + attrsStr : ''} />`;
    }
  }

  // Step 3: Wrap in conditionals if any exist
  let finalJsx = baseJsx;
  const validBranches = allBranches.filter(
    (b) => b.propName.trim() && b.thenRender.trim()
  );

  if (validBranches.length > 0) {
    // For now, support one conditional (can be extended to nested later)
    const branch = validBranches[0];
    finalJsx = wrapInConditional(baseJsx, branch, config.spreadFigmaProps);
  }

  // Step 4: Format the arrow function
  const isMultiLine = finalJsx.includes('\n');
  if (isMultiLine) {
    return `(${paramStr}) => (\n    ${finalJsx}\n  )`;
  } else {
    return `(${paramStr}) => ${finalJsx}`;
  }
}

// ─── Full connect block ───────────────────────────────────────────────────────

function generateConnect(def: ComponentDefinition): string {
  const propLines = def.props
    .filter((p) => p.reactProp.trim())
    .map((p) => `    ${p.reactProp}: ${generatePropMapping(p)},`)
    .join('\n');

  const exampleStr = generateExample(def.name, def.example, def.props);

  const bodyParts: string[] = [];

  // variant — scopes this connect call to specific Figma variant states.
  // Must come before props per the Code Connect API docs.
  const validVariants = (def.variantScope ?? []).filter((v) => v.key.trim() && v.value.trim());
  if (validVariants.length > 0) {
    const variantLines = validVariants
      .map((v) => `      ${toStringLiteral(v.key.trim())}: ${toStringLiteral(v.value.trim())},`)
      .join('\n');
    bodyParts.push(`    variant: {\n${variantLines}\n    },`);
  }

  bodyParts.push(`    props: {\n${propLines}\n    },`);
  bodyParts.push(`    example: ${exampleStr},`);

  // links — shown in Figma Dev Mode alongside the code snippet.
  const validLinks = (def.links ?? []).filter((l) => l.name.trim() && l.url.trim());
  if (validLinks.length > 0) {
    const linkLines = validLinks
      .map((l) => `      { name: ${toStringLiteral(l.name.trim())}, url: ${toStringLiteral(l.url.trim())} },`)
      .join('\n');
    bodyParts.push(`    links: [\n${linkLines}\n    ],`);
  }

  return [
    `figma.connect(`,
    `  ${def.name},`,
    `  '${def.figmaUrl}',`,
    `  {\n${bodyParts.join('\n')}\n  }`,
    `);`,
  ].join('\n');
}

// ─── Full file ────────────────────────────────────────────────────────────────

/**
 * Generate the complete *.figma.tsx file content from all definitions.
 */
export function generateFile(definitions: ComponentDefinition[]): string {
  if (definitions.length === 0) return '';

  // Group imports by importPath
  const importMap: Record<string, Set<string>> = {};
  for (const def of definitions) {
    const path = def.importPath.trim() || './Component';
    const rootName = def.name.split('.')[0];
    if (!importMap[path]) importMap[path] = new Set();
    importMap[path].add(rootName);
  }

  const importLines = [
    `import React from 'react';`,
    `import figma from '@figma/code-connect';`,
    ...Object.entries(importMap).map(
      ([path, names]) =>
        `import { ${[...names].sort().join(', ')} } from '${path}';`
    ),
  ].join('\n');

  const connects = definitions.map(generateConnect).join('\n\n');

  return `${importLines}\n\n${connects}\n`;
}

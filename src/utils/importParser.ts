/**
 * Parser utilities for importing existing Code Connect and React component files.
 *
 * Two entry points:
 *   parseFigmaConnectFile(source)  → ComponentDefinition[]  (from .figma.tsx)
 *   parseReactComponentFile(source, filename) → ComponentDefinition  (from .tsx/.ts)
 *
 * Approach: regex + brace-depth scanner (no AST dependency, browser-safe).
 */

import type {
  ComponentDefinition,
  PropDef,
  EnumOption,
  NestedPropDef,
  VariantEntry,
  LinkDef,
  ExampleConfig,
  BooleanMode,
} from '@/types/connection';
import {
  makeExampleConfig,
  makePropDef,
  makeEnumOption,
  makeNestedPropDef,
  makeVariantEntry,
  makeLinkDef,
} from '@/utils/defaults';
import { genId } from '@/utils/stringUtils';
import type { FigmaComponentSchema } from './figmaApi';
import { fetchComponentPropertiesWithError, hasToken } from './figmaApi';
import {
  matchPropsToFigma,
  matchPropsToFigmaWithPatterns,
  generateEnumOptionsFromVariant,
  type PropMatchResult
} from './propMatcher';

// ─── Brace / paren / bracket scanners ────────────────────────────────────────

/**
 * Given source starting at index of an opening delimiter, find the matching closer.
 * Returns the index after the closing delimiter, or -1 if not found.
 */
function findMatchingClose(src: string, start: number, open: string, close: string): number {
  let depth = 0;
  let i = start;
  while (i < src.length) {
    const ch = src[i];
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return i + 1;
    } else if (ch === '"' || ch === "'" || ch === '`') {
      // Skip string literals
      const quote = ch;
      i++;
      while (i < src.length) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === quote) break;
        i++;
      }
    }
    i++;
  }
  return -1;
}

/** Extract the content between the first occurrence of open and its match. */
function extractBetween(src: string, open: string, close: string, from = 0): string | null {
  const start = src.indexOf(open, from);
  if (start === -1) return null;
  const end = findMatchingClose(src, start, open, close);
  if (end === -1) return null;
  return src.slice(start + 1, end - 1);
}

/** Unquote a JS string literal value (strips surrounding quotes, unescapes). */
function unquote(s: string): string {
  s = s.trim();
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    return s.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  return s;
}

// ─── figma.connect() extractor ────────────────────────────────────────────────

/**
 * Extract each complete figma.connect(...) call from a source file as raw strings.
 */
function extractConnectCalls(source: string): string[] {
  const calls: string[] = [];
  const marker = 'figma.connect(';
  let pos = 0;
  while (true) {
    const idx = source.indexOf(marker, pos);
    if (idx === -1) break;
    const start = idx + marker.length - 1; // position of opening '('
    const end = findMatchingClose(source, start, '(', ')');
    if (end === -1) break;
    calls.push(source.slice(idx, end));
    pos = end;
  }
  return calls;
}

// ─── Figma call parsers ───────────────────────────────────────────────────────

/**
 * Parse a single figma.XYZ(...) expression and return a PropDef.
 * reactProp is injected by the caller.
 */
function parseFigmaCall(reactProp: string, raw: string): PropDef | null {
  const callMatch = raw.match(/figma\.(\w+)\s*\(/);
  if (!callMatch) return null;
  const fnName = callMatch[1];
  const innerStart = raw.indexOf('(');
  if (innerStart === -1) return null;
  const innerEnd = findMatchingClose(raw, innerStart, '(', ')');
  if (innerEnd === -1) return null;
  const inner = raw.slice(innerStart + 1, innerEnd - 1).trim();
  const id = genId();

  switch (fnName) {
    case 'string': {
      const figmaProp = unquote(inner.split(',')[0]);
      return { id, reactProp, figmaProp, type: 'string' };
    }
    case 'textContent': {
      const figmaProp = unquote(inner.split(',')[0]);
      return { id, reactProp, figmaProp, type: 'textContent' };
    }
    case 'instance': {
      const figmaProp = unquote(inner.split(',')[0]);
      return { id, reactProp, figmaProp, type: 'instance' };
    }
    case 'number': {
      const figmaProp = unquote(inner.split(',')[0]);
      return { id, reactProp, figmaProp, type: 'number' };
    }
    case 'boolean': {
      const figmaProp = unquote(inner.split(',')[0]);
      const mappingStr = extractBetween(inner, '{', '}');
      if (!mappingStr) {
        return { id, reactProp, figmaProp, type: 'boolean', boolMode: 'simple', boolChildLayer: '', boolTrueValue: '', boolFalseValue: '' };
      }
      // Detect mode from mapping
      if (mappingStr.includes('false: true') || mappingStr.includes('true: false')) {
        return { id, reactProp, figmaProp, type: 'boolean', boolMode: 'inverse', boolChildLayer: '', boolTrueValue: '', boolFalseValue: '' };
      }
      if (mappingStr.includes('figma.children')) {
        // visibility mode — extract layer name
        const layerMatch = mappingStr.match(/figma\.children\(\[?(['"])(.*?)\1\]?\)/);
        const boolChildLayer = layerMatch ? layerMatch[2] : '';
        return { id, reactProp, figmaProp, type: 'boolean', boolMode: 'visibility', boolChildLayer, boolTrueValue: '', boolFalseValue: '' };
      }
      // complex mode
      const trueMatch = mappingStr.match(/true\s*:\s*([^,\n}]+)/);
      const falseMatch = mappingStr.match(/false\s*:\s*([^,\n}]+)/);
      const boolTrueValue = trueMatch ? trueMatch[1].trim() : '';
      const boolFalseValue = falseMatch ? falseMatch[1].trim() : '';
      return { id, reactProp, figmaProp, type: 'boolean', boolMode: 'complex', boolChildLayer: '', boolTrueValue, boolFalseValue };
    }
    case 'enum': {
      const figmaProp = unquote(inner.split(',')[0]);
      const optStr = extractBetween(inner, '{', '}');
      const enumOptions: EnumOption[] = [];
      if (optStr) {
        // Match "Key": 'value' or Key: 'value' or Key: SomeCode
        const rowRe = /(['"]?)([\w\s]+)\1\s*:\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|[^,\n}]+)/g;
        let m: RegExpExecArray | null;
        while ((m = rowRe.exec(optStr)) !== null) {
          const figma = m[2].trim();
          const rawVal = m[3].trim();
          const isCode = !(rawVal.startsWith("'") || rawVal.startsWith('"'));
          const react = isCode ? rawVal : unquote(rawVal);
          enumOptions.push({ figma, react, isCode });
        }
      }
      return { id, reactProp, figmaProp, type: 'enum', enumOptions: enumOptions.length ? enumOptions : [makeEnumOption()] };
    }
    case 'children': {
      // figma.children('Layer') or figma.children(['Layer1', 'Layer2']) or figma.children(['*'])
      const arrayStr = extractBetween(inner, '[', ']');
      if (arrayStr !== null) {
        const names = arrayStr.match(/['"]([^'"]+)['"]/g)?.map(unquote) ?? [];
        const isWildcard = names.length === 1 && names[0] === '*';
        return { id, reactProp, figmaProp: '', type: 'children', childrenLayers: isWildcard ? ['*'] : names };
      }
      // Single string form
      const singleName = unquote(inner.trim());
      return { id, reactProp, figmaProp: '', type: 'children', childrenLayers: [singleName] };
    }
    case 'nestedProps': {
      const figmaProp = unquote(inner.split(',')[0]);
      const objStr = extractBetween(inner, '{', '}');
      const nestedProps: NestedPropDef[] = [];
      if (objStr) {
        // Parse each nested sub-prop
        const subPropRe = /(\w+)\s*:\s*(figma\.\w+\s*\([^;)]*\))/g;
        let m: RegExpExecArray | null;
        while ((m = subPropRe.exec(objStr)) !== null) {
          const subReactProp = m[1].trim();
          const subRaw = m[2].trim();
          const subCallMatch = subRaw.match(/figma\.(\w+)\s*\(/);
          if (!subCallMatch) continue;
          const subFn = subCallMatch[1];
          const subInner = extractBetween(subRaw, '(', ')');
          const subFigmaProp = subInner ? unquote(subInner.split(',')[0]) : '';
          const np = makeNestedPropDef();
          np.reactProp = subReactProp;
          np.figmaProp = subFigmaProp;
          np.type = (subFn === 'textContent' ? 'textContent'
            : subFn === 'children' ? 'children'
            : subFn === 'boolean' ? 'boolean'
            : subFn === 'number' ? 'number'
            : 'string') as NestedPropDef['type'];
          if (subFn === 'boolean' && subInner) {
            const mapping = extractBetween(subInner, '{', '}');
            if (mapping?.includes('false: true')) np.boolMode = 'inverse';
            else if (mapping?.includes('figma.children')) {
              np.boolMode = 'visibility';
              const lm = mapping.match(/figma\.children\(\[?(['"])(.*?)\1\]?\)/);
              np.boolChildLayer = lm ? lm[2] : '';
            } else {
              np.boolMode = 'simple';
            }
          }
          nestedProps.push(np);
        }
      }
      return { id, reactProp, figmaProp, type: 'nestedProps', nestedProps };
    }
    default:
      return null;
  }
}

// ─── Import path extractor ────────────────────────────────────────────────────

function extractImportPath(source: string, componentName: string): string {
  const root = componentName.split('.')[0];
  // Try named import: import { Button } from './Button'
  const re = new RegExp(`import\\s*\\{[^}]*\\b${root}\\b[^}]*\\}\\s*from\\s*(['"])(.*?)\\1`);
  const m = re.exec(source);
  return m ? m[2] : `./${root}`;
}

// ─── figma.connect() parser ───────────────────────────────────────────────────

/**
 * Parse a complete source `.figma.tsx` file and return all ComponentDefinitions.
 */
export function parseFigmaConnectFile(source: string): ComponentDefinition[] {
  const calls = extractConnectCalls(source);
  const defs: ComponentDefinition[] = [];

  for (const call of calls) {
    try {
      // figma.connect( ComponentName, 'url', { ... } )
      // Get the args string inside figma.connect(...)
      const argsRaw = call.slice('figma.connect('.length, -1).trim();

      // First arg: component name (identifier, e.g. "Button" or "Button.Icon")
      const nameMatch = argsRaw.match(/^([\w.]+)/);
      if (!nameMatch) continue;
      const name = nameMatch[1];

      // Second arg: figma URL string
      const urlMatch = argsRaw.match(/,\s*(['"`])(.*?)\1\s*,/);
      const figmaUrl = urlMatch ? urlMatch[2] : '';

      // Third arg: config object — find the opening brace after the URL
      const urlEnd = argsRaw.indexOf(',', argsRaw.indexOf(',', 0) + 1);
      if (urlEnd === -1) continue;
      const configStart = argsRaw.indexOf('{', urlEnd);
      if (configStart === -1) continue;
      const configEnd = findMatchingClose(argsRaw, configStart, '{', '}');
      if (configEnd === -1) continue;
      const configStr = argsRaw.slice(configStart + 1, configEnd - 1);

      // — variant scope —
      const variantScope: VariantEntry[] = [];
      const variantBlockStart = configStr.indexOf('variant:');
      if (variantBlockStart !== -1) {
        const vObjStart = configStr.indexOf('{', variantBlockStart);
        const vObjEnd = findMatchingClose(configStr, vObjStart, '{', '}');
        if (vObjStart !== -1 && vObjEnd !== -1) {
          const vStr = configStr.slice(vObjStart + 1, vObjEnd - 1);
          const vRe = /(['"]?)([\w\s]+)\1\s*:\s*(['"])(.*?)\3/g;
          let vm: RegExpExecArray | null;
          while ((vm = vRe.exec(vStr)) !== null) {
            const v = makeVariantEntry();
            v.key = vm[2].trim();
            v.value = vm[4];
            variantScope.push(v);
          }
        }
      }

      // — props —
      const props: PropDef[] = [];
      const propsBlockStart = configStr.indexOf('props:');
      if (propsBlockStart !== -1) {
        const pObjStart = configStr.indexOf('{', propsBlockStart);
        const pObjEnd = findMatchingClose(configStr, pObjStart, '{', '}');
        if (pObjStart !== -1 && pObjEnd !== -1) {
          const propsStr = configStr.slice(pObjStart + 1, pObjEnd - 1);
          // Find each top-level prop entry: propName: figma.xyz(...)
          // Walk character by character to correctly handle nested calls
          let pi = 0;
          while (pi < propsStr.length) {
            // Skip whitespace
            while (pi < propsStr.length && /\s/.test(propsStr[pi])) pi++;
            // Read identifier
            const identStart = pi;
            while (pi < propsStr.length && /[\w]/.test(propsStr[pi])) pi++;
            const reactProp = propsStr.slice(identStart, pi).trim();
            if (!reactProp) { pi++; continue; }
            // Skip to colon
            while (pi < propsStr.length && propsStr[pi] !== ':') pi++;
            pi++; // skip ':'
            while (pi < propsStr.length && /\s/.test(propsStr[pi])) pi++;
            // Find the full figma.xyz(...) expression — must handle nested parens
            const exprStart = pi;
            if (propsStr.slice(pi, pi + 6) !== 'figma.') { pi++; continue; }
            // find matching close paren
            const openParenIdx = propsStr.indexOf('(', pi);
            if (openParenIdx === -1) break;
            const closeParenIdx = findMatchingClose(propsStr, openParenIdx, '(', ')');
            if (closeParenIdx === -1) break;
            const rawCall = propsStr.slice(exprStart, closeParenIdx);
            pi = closeParenIdx;
            // skip trailing comma
            while (pi < propsStr.length && (propsStr[pi] === ',' || /\s/.test(propsStr[pi]))) pi++;

            const propDef = parseFigmaCall(reactProp, rawCall);
            if (propDef) props.push(propDef);
          }
        }
      }

      // — links —
      const links: LinkDef[] = [];
      const linksBlockStart = configStr.indexOf('links:');
      if (linksBlockStart !== -1) {
        const lArrStart = configStr.indexOf('[', linksBlockStart);
        const lArrEnd = findMatchingClose(configStr, lArrStart, '[', ']');
        if (lArrStart !== -1 && lArrEnd !== -1) {
          const lStr = configStr.slice(lArrStart + 1, lArrEnd - 1);
          const lObjRe = /\{[^}]*\}/g;
          let lm: RegExpExecArray | null;
          while ((lm = lObjRe.exec(lStr)) !== null) {
            const obj = lm[0];
            const nameM = obj.match(/name\s*:\s*(['"])(.*?)\1/);
            const urlM = obj.match(/url\s*:\s*(['"])(.*?)\1/);
            if (nameM && urlM) {
              const l = makeLinkDef();
              l.name = nameM[2];
              l.url = urlM[2];
              links.push(l);
            }
          }
        }
      }

      // — example —
      const example: ExampleConfig = makeExampleConfig();
      const exampleBlockStart = configStr.indexOf('example:');
      if (exampleBlockStart !== -1) {
        // Look for spread: {...props}
        const exprAfter = configStr.slice(exampleBlockStart);
        example.spreadFigmaProps = exprAfter.includes('{...props}');
      }

      const importPath = extractImportPath(source, name);

      defs.push({
        id: genId(),
        name,
        figmaUrl,
        importPath,
        props,
        example,
        variantScope,
        links,
      });
    } catch {
      // Skip malformed calls
    }
  }

  return defs;
}

// ─── React component file parser ─────────────────────────────────────────────

interface TSProp {
  name: string;
  typeStr: string;
  optional: boolean;
}

/**
 * Extract props from a TypeScript interface or type alias body string.
 * Handles `name: type`, `name?: type` with common primitives and unions.
 */
function parseTSProps(body: string): TSProp[] {
  const props: TSProp[] = [];
  // Split on semicolons or newlines, handle each line
  const lines = body.split(/[;\n]/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    // Match "propName?: TypeString" or "propName: TypeString"
    const m = line.match(/^(\w+)(\?)?:\s*(.+)$/);
    if (!m) continue;
    const name = m[1];
    const optional = !!m[2];
    const typeStr = m[3].trim().replace(/;$/, '');
    // Skip index signatures
    if (name.startsWith('[')) continue;
    props.push({ name, typeStr, optional });
  }
  return props;
}

/** Classify a TypeScript type string into a PropDef type + extra data. */
function classifyTSType(typeStr: string, depth = 0): { type: PropDef['type']; enumOptions?: EnumOption[] } | null {
  // Prevent infinite recursion
  if (depth > 10) return { type: 'string' };

  const t = typeStr.replace(/\s+/g, ' ').trim();

  // Skip handler / function props
  if (t.includes('=>') || t.startsWith('(') || t.startsWith('React.MouseEvent') || t.startsWith('MouseEvent')) {
    return null;
  }

  // ReactNode / JSX / children
  if (/ReactNode|JSX\.Element|React\.ReactElement|React\.ReactNode/.test(t)) {
    return { type: 'children' };
  }

  // ComponentType / ElementType → instance
  if (/ComponentType|ElementType|React\.ComponentType|React\.ElementType/.test(t)) {
    return { type: 'instance' };
  }

  // boolean
  if (t === 'boolean') return { type: 'boolean' };

  // number
  if (t === 'number') return { type: 'number' };

  // string (plain)
  if (t === 'string') return { type: 'string' };

  // String literal union → enum e.g. 'primary' | 'secondary'
  const unionParts = t.split('|').map((p) => p.trim());
  const allStringLiterals = unionParts.length > 1 && unionParts.every((p) => /^['"]/.test(p));
  if (allStringLiterals) {
    const enumOptions: EnumOption[] = unionParts.map((p) => {
      const react = unquote(p);
      // Capitalize first letter for the Figma side
      const figma = react.charAt(0).toUpperCase() + react.slice(1);
      return makeEnumOption({ figma, react, isCode: false });
    });
    return { type: 'enum', enumOptions };
  }

  // Mixed union with non-string-literal parts (e.g. string | undefined) → string
  const nonUndefinedParts = unionParts.filter((p) => p !== 'undefined' && p !== 'null');
  if (nonUndefinedParts.length === 1) {
    return classifyTSType(nonUndefinedParts[0], depth + 1);
  }

  // Default fallback for unrecognized types
  return { type: 'string' };
}

/**
 * Parse a React component file and return a starter ComponentDefinition.
 * Extracts props from interface/type, maps TS types to PropDef types.
 */
export function parseReactComponentFile(source: string, filename: string): ComponentDefinition {
  // Attempt to determine the component name from filename
  const fileBase = filename.replace(/\.[^.]+$/, '').replace(/\.figma$/, '');
  const nameParts = fileBase.split(/[/\\]/);
  let componentName = nameParts[nameParts.length - 1];
  // Capitalize first letter
  componentName = componentName.charAt(0).toUpperCase() + componentName.slice(1);

  // Try to find the primary exported props interface/type
  // Pattern: interface XxxProps { ... } or type XxxProps = { ... }
  let propsBody: string | null = null;
  let detectedName = componentName;

  const interfaceRe = /(?:export\s+)?interface\s+(\w*Props\w*)\s*(?:extends\s+[^{]*)?\{/g;
  let iMatch: RegExpExecArray | null;
  while ((iMatch = interfaceRe.exec(source)) !== null) {
    const braceStart = iMatch.index + iMatch[0].length - 1;
    const braceEnd = findMatchingClose(source, braceStart, '{', '}');
    if (braceEnd !== -1) {
      propsBody = source.slice(braceStart + 1, braceEnd - 1);
      const ifaceName = iMatch[1];
      // Derive component name: ButtonProps → Button
      const derived = ifaceName.replace(/Props$/, '').replace(/^I([A-Z])/, '$1');
      if (derived) detectedName = derived;
      break;
    }
  }

  if (!propsBody) {
    // Try type alias: type XxxProps = { ... }
    const typeRe = /(?:export\s+)?type\s+(\w*Props\w*)\s*=\s*\{/g;
    let tMatch: RegExpExecArray | null;
    while ((tMatch = typeRe.exec(source)) !== null) {
      const braceStart = tMatch.index + tMatch[0].length - 1;
      const braceEnd = findMatchingClose(source, braceStart, '{', '}');
      if (braceEnd !== -1) {
        propsBody = source.slice(braceStart + 1, braceEnd - 1);
        const typeName = tMatch[1];
        const derived = typeName.replace(/Props$/, '').replace(/^I([A-Z])/, '$1');
        if (derived) detectedName = derived;
        break;
      }
    }
  }

  // Also detect component name from function declarations / const declarations
  const fnNameMatch = source.match(/(?:export\s+(?:default\s+)?)?(?:function|const)\s+([A-Z]\w*)\s*[=(<(]/);
  if (fnNameMatch && !propsBody) detectedName = fnNameMatch[1];

  componentName = detectedName || componentName;

  // Build props
  const props: PropDef[] = [];
  if (propsBody) {
    const tsProps = parseTSProps(propsBody);
    for (const tsProp of tsProps) {
      // Skip 'children' named prop — usually maps to children type
      const classified = tsProp.name === 'children'
        ? { type: 'children' as const }
        : classifyTSType(tsProp.typeStr);
      if (!classified) continue; // skipped (handler etc.)

      const base = makePropDef(classified.type);
      const reactProp = tsProp.name;
      // Auto-capitalize the Figma prop name (Ink convention)
      const figmaProp = reactProp.charAt(0).toUpperCase() + reactProp.slice(1);

      if (classified.type === 'enum' && classified.enumOptions) {
        props.push({ ...base, reactProp, figmaProp, type: 'enum', enumOptions: classified.enumOptions });
      } else if (classified.type === 'boolean') {
        props.push({ ...base, reactProp, figmaProp, type: 'boolean', boolMode: 'simple', boolChildLayer: '', boolTrueValue: '', boolFalseValue: '' });
      } else if (classified.type === 'children') {
        props.push({ ...base, reactProp: 'children', figmaProp: '', type: 'children', childrenLayers: ['*'] });
      } else if (classified.type === 'instance') {
        props.push({ ...base, reactProp, figmaProp, type: 'instance' });
      } else if (classified.type === 'number') {
        props.push({ ...base, reactProp, figmaProp, type: 'number' });
      } else {
        props.push({ ...base, reactProp, figmaProp, type: 'string' });
      }
    }
  }

  // Determine import path — try finding the file's own imports for clues
  // Default to component name
  const importPath = `./${componentName}`;

  return {
    id: genId(),
    name: componentName,
    figmaUrl: '',
    importPath,
    props,
    example: makeExampleConfig(),
    variantScope: [],
    links: [],
  };
}

// ─── Parse warnings ───────────────────────────────────────────────────────────

export interface ParseWarning {
  type: 'missing_url' | 'no_props' | 'unknown_type' | 'parse_error' | 'prop_mismatch' | 'type_mismatch';
  message: string;
  severity?: 'error' | 'warning' | 'info';
}

export interface EnhancedParseResult {
  definition: ComponentDefinition;
  warnings: ParseWarning[];
  matchResults?: PropMatchResult[];
  figmaSchema?: FigmaComponentSchema;
  overallConfidence?: number;
}

export function getDefinitionWarnings(def: ComponentDefinition): ParseWarning[] {
  const warnings: ParseWarning[] = [];
  if (!def.figmaUrl) warnings.push({ type: 'missing_url', message: 'No Figma URL found — paste the Figma design link in Component Configuration.' });
  if (def.props.length === 0) warnings.push({ type: 'no_props', message: 'No props were detected. You can add them manually.' });
  return warnings;
}

// ─── Figma-Enhanced React Import ──────────────────────────────────────────────

/**
 * @deprecated Legacy function - kept for backward compatibility only.
 * Use parseReactComponentFileWithManualFigma for new implementations.
 *
 * Parse a React component file with Figma URL integration.
 * Fetches Figma component schema and intelligently matches props.
 *
 * Note: Requires Figma API token and makes network requests.
 */
export async function parseReactComponentFileWithFigma(
  source: string,
  filename: string,
  figmaUrl?: string
): Promise<EnhancedParseResult> {
  // First, parse the React component normally
  const basicDef = parseReactComponentFile(source, filename);

  // If no Figma URL provided, return basic result
  if (!figmaUrl || !figmaUrl.trim()) {
    return {
      definition: basicDef,
      warnings: getDefinitionWarnings(basicDef),
    };
  }

  // Fetch Figma component schema with detailed error handling
  const fetchResult = await fetchComponentPropertiesWithError(figmaUrl);
  const figmaSchema = fetchResult.schema;

  if (!figmaSchema) {
    const baseWarnings = getDefinitionWarnings({ ...basicDef, figmaUrl });
    const figmaWarning: ParseWarning = {
      type: 'parse_error',
      message: fetchResult.error?.message || 'Failed to fetch Figma component.',
      // Make it a warning (not error) if there's no token - this is expected for first-time users
      severity: fetchResult.error?.code === 'no_token' ? 'warning' : 'error',
    };

    return {
      definition: { ...basicDef, figmaUrl },
      warnings: [...baseWarnings, figmaWarning],
    };
  }

  // Extract React prop types for matching
  const propsBody = extractPropsBody(source);
  const reactProps = propsBody ? parseTSProps(propsBody) : [];

  // Match React props to Figma properties
  const matchingReport = matchPropsToFigma(
    reactProps.map(p => ({ name: p.name, type: p.typeStr })),
    figmaSchema
  );

  // Build enhanced props list using matching results
  const enhancedProps: PropDef[] = [];
  const warnings: ParseWarning[] = [];

  for (const match of matchingReport.matches) {
    const base = makePropDef('string');
    const reactProp = match.reactProp;

    // Use matched Figma prop if confidence is high enough
    const figmaProp = match.confidence >= 0.6 ? match.figmaProp :
                      (reactProp.charAt(0).toUpperCase() + reactProp.slice(1));

    // Determine prop type based on Figma type if available
    let propType: PropDef['type'] = 'string';
    let enumOptions: any[] | undefined;

    if (match.figmaType && match.typeMatch) {
      switch (match.figmaType) {
        case 'BOOLEAN':
          propType = 'boolean';
          break;
        case 'TEXT':
          propType = 'string';
          break;
        case 'INSTANCE_SWAP':
          propType = 'instance';
          break;
        case 'VARIANT':
          propType = 'enum';
          if (figmaProp && figmaSchema.properties[figmaProp]) {
            enumOptions = generateEnumOptionsFromVariant(figmaSchema.properties[figmaProp]);
          }
          break;
      }
    } else {
      // Fall back to TypeScript type inference
      const classified = classifyTSType(match.reactType);
      if (classified) {
        propType = classified.type;
        if (classified.type === 'enum' && classified.enumOptions) {
          enumOptions = classified.enumOptions;
        }
      }
    }

    // Build the PropDef
    if (propType === 'boolean') {
      enhancedProps.push({
        ...base,
        reactProp,
        figmaProp: figmaProp || '',
        type: 'boolean',
        boolMode: 'simple',
        boolChildLayer: '',
        boolTrueValue: '',
        boolFalseValue: ''
      });
    } else if (propType === 'enum') {
      enhancedProps.push({
        ...base,
        reactProp,
        figmaProp: figmaProp || '',
        type: 'enum',
        enumOptions: enumOptions || [makeEnumOption()]
      });
    } else if (propType === 'children') {
      enhancedProps.push({
        ...base,
        reactProp: 'children',
        figmaProp: '',
        type: 'children',
        childrenLayers: ['*']
      });
    } else if (propType === 'instance') {
      enhancedProps.push({
        ...base,
        reactProp,
        figmaProp: figmaProp || '',
        type: 'instance'
      });
    } else if (propType === 'number') {
      enhancedProps.push({
        ...base,
        reactProp,
        figmaProp: figmaProp || '',
        type: 'number'
      });
    } else {
      enhancedProps.push({
        ...base,
        reactProp,
        figmaProp: figmaProp || '',
        type: 'string'
      });
    }

    // Add warnings from matching
    if (match.warnings.length > 0) {
      warnings.push({
        type: match.typeMatch ? 'prop_mismatch' : 'type_mismatch',
        message: `${reactProp}: ${match.warnings.join(', ')}`,
        severity: match.confidence < 0.6 ? 'warning' : 'info'
      });
    }
  }

  // Add warnings for unmapped Figma props
  if (matchingReport.unmappedFigmaProps.length > 0) {
    warnings.push({
      type: 'prop_mismatch',
      message: `${matchingReport.unmappedFigmaProps.length} Figma properties not found in React: ${matchingReport.unmappedFigmaProps.map(p => p.name).join(', ')}`,
      severity: 'info'
    });
  }

  const enhancedDef: ComponentDefinition = {
    ...basicDef,
    figmaUrl,
    props: enhancedProps
  };

  return {
    definition: enhancedDef,
    warnings,
    matchResults: matchingReport.matches,
    figmaSchema,
    overallConfidence: matchingReport.overallConfidence
  };
}

/**
 * Helper to extract props body from source (DRY for enhanced parser).
 */
function extractPropsBody(source: string): string | null {
  // Try interface first
  const interfaceRe = /(?:export\s+)?interface\s+(\w*Props\w*)\s*(?:extends\s+[^{]*)?\{/g;
  let match: RegExpExecArray | null;
  while ((match = interfaceRe.exec(source)) !== null) {
    const braceStart = match.index + match[0].length - 1;
    const braceEnd = findMatchingClose(source, braceStart, '{', '}');
    if (braceEnd !== -1) {
      return source.slice(braceStart + 1, braceEnd - 1);
    }
  }

  // Try type alias
  const typeRe = /(?:export\s+)?type\s+(\w*Props\w*)\s*=\s*\{/g;
  while ((match = typeRe.exec(source)) !== null) {
    const braceStart = match.index + match[0].length - 1;
    const braceEnd = findMatchingClose(source, braceStart, '{', '}');
    if (braceEnd !== -1) {
      return source.slice(braceStart + 1, braceEnd - 1);
    }
  }

  return null;
}

/**
 * Parse a React component file with manually defined Figma properties.
 * Uses semantic pattern detection and intelligent estimation instead of API fetch.
 */
export async function parseReactComponentFileWithManualFigma(
  source: string,
  filename: string,
  manualFigmaProps: Array<{
    name: string;
    type: 'BOOLEAN' | 'TEXT' | 'VARIANT' | 'INSTANCE_SWAP';
    defaultValue?: string | boolean;
    variantOptions?: string[];
    description?: string;
  }>
): Promise<EnhancedParseResult> {
  // First, parse the React component normally
  const basicDef = parseReactComponentFile(source, filename);

  // If no manual Figma properties provided, return basic result
  if (!manualFigmaProps || manualFigmaProps.length === 0) {
    return {
      definition: basicDef,
      warnings: getDefinitionWarnings(basicDef),
    };
  }

  // Construct pseudo-FigmaComponentSchema from manual input
  const figmaSchema: FigmaComponentSchema = {
    id: 'manual-input',
    name: basicDef.name || 'Component',
    type: 'COMPONENT',
    properties: Object.fromEntries(
      manualFigmaProps.map(prop => [
        prop.name,
        {
          name: prop.name,
          type: prop.type,
          defaultValue: prop.defaultValue,
          variantOptions: prop.variantOptions,
        },
      ])
    ),
    variantGroupProperties: Object.fromEntries(
      manualFigmaProps
        .filter(p => p.type === 'VARIANT' && p.variantOptions)
        .map(p => [p.name, p.variantOptions!])
    ),
  };

  // Extract React prop types for matching with JSDoc comments
  const propsBody = extractPropsBody(source);
  const reactProps = propsBody ? parseTSPropsWithJSDoc(source, propsBody) : [];

  // Match React props to manual Figma properties with pattern detection
  const matchingReport = matchPropsToFigmaWithPatterns(
    reactProps.map(p => ({ name: p.name, type: p.typeStr, jsDoc: p.jsDoc })),
    figmaSchema
  );

  // Build enhanced props list using matching results
  const enhancedProps: PropDef[] = [];
  const warnings: ParseWarning[] = [];

  for (const match of matchingReport.matches) {
    let propDef: PropDef;

    // Skip calculated and handler props (incompatible with Figma)
    if (match.pattern?.isCalculated || match.pattern?.isHandler) {
      warnings.push({
        type: 'prop_mismatch',
        message: `${match.reactProp}: ${match.pattern.reason} - skipping Figma mapping`,
        severity: 'info',
      });
      continue;
    }

    if (match.figmaProp && match.figmaType && match.confidence >= 0.6) {
      // Good match found
      const figmaPropDef = figmaSchema.properties[match.figmaProp];
      const recommendedType = getRecommendedTypeForFigma(match.figmaType);
      const base = makePropDef('string');

      // Build PropDef based on type
      if (recommendedType === 'boolean') {
        propDef = {
          ...base,
          reactProp: match.reactProp,
          figmaProp: match.figmaProp,
          type: 'boolean',
          boolMode: 'simple' as BooleanMode,
          boolChildLayer: '',
          boolTrueValue: '',
          boolFalseValue: '',
        };
      } else if (recommendedType === 'enum') {
        propDef = {
          ...base,
          reactProp: match.reactProp,
          figmaProp: match.figmaProp,
          type: 'enum',
          enumOptions:
            match.figmaType === 'VARIANT' && figmaPropDef.variantOptions
              ? generateEnumOptionsFromVariant(figmaPropDef)
              : [makeEnumOption()],
        };
      } else if (recommendedType === 'instance') {
        propDef = {
          ...base,
          reactProp: match.reactProp,
          figmaProp: match.figmaProp,
          type: 'instance',
        };
      } else if (recommendedType === 'number') {
        propDef = {
          ...base,
          reactProp: match.reactProp,
          figmaProp: match.figmaProp,
          type: 'number',
        };
      } else {
        // Default to string
        propDef = {
          ...base,
          reactProp: match.reactProp,
          figmaProp: match.figmaProp,
          type: 'string',
        };
      }

      // Add warnings for low confidence or type mismatches
      if (match.confidence < 0.85) {
        warnings.push({
          type: 'prop_mismatch',
          message: `${match.reactProp}: Low confidence match (${Math.round(match.confidence * 100)}%)`,
          severity: 'warning',
        });
      }

      if (!match.typeMatch) {
        warnings.push({
          type: 'type_mismatch',
          message: `${match.reactProp}: Type mismatch - Figma ${match.figmaType} ↔ React ${match.reactType}`,
          severity: 'warning',
        });
      }

      if (match.pattern?.isOptional && !match.pattern.hasDefault) {
        warnings.push({
          type: 'prop_mismatch',
          message: `${match.reactProp}: Optional without default may need fallback handling`,
          severity: 'info',
        });
      }
    } else {
      // No good match - create basic prop without Figma mapping
      const base = makePropDef('string');
      propDef = {
        ...base,
        reactProp: match.reactProp,
        figmaProp: '',
        type: 'string',
      };

      warnings.push({
        type: 'prop_mismatch',
        message: `${match.reactProp}: No matching Figma property found`,
        severity: 'warning',
      });
    }

    enhancedProps.push(propDef);
  }

  // Warn about unmapped Figma props
  if (matchingReport.unmappedFigmaProps.length > 0) {
    warnings.push({
      type: 'prop_mismatch',
      message: `${matchingReport.unmappedFigmaProps.length} Figma properties not found in React: ${matchingReport.unmappedFigmaProps.map(p => p.name).join(', ')}`,
      severity: 'info',
    });
  }

  const enhancedDef: ComponentDefinition = {
    ...basicDef,
    props: enhancedProps,
  };

  return {
    definition: enhancedDef,
    warnings,
    matchResults: matchingReport.matches,
    figmaSchema,
    overallConfidence: matchingReport.overallConfidence,
  };
}

/**
 * Parse TypeScript props with JSDoc comments for semantic analysis.
 */
function parseTSPropsWithJSDoc(
  source: string,
  propsBody: string
): Array<{ name: string; typeStr: string; jsDoc?: string }> {
  const props: Array<{ name: string; typeStr: string; jsDoc?: string }> = [];
  const lines = propsBody.split('\n');
  let currentJSDoc = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Capture JSDoc comments
    if (line.startsWith('/**') || line.startsWith('/*')) {
      currentJSDoc = line;
      continue;
    }
    if (currentJSDoc && (line.startsWith('*') || line.includes('*/'))) {
      currentJSDoc += ' ' + line;
      if (line.includes('*/')) {
        // JSDoc complete, next line should be the prop
      } else {
        continue;
      }
    }

    // Parse prop definition
    const propMatch = line.match(/^([a-zA-Z_$][\w$]*)\??\s*:\s*(.+?)[;,]?$/);
    if (propMatch) {
      const [, name, typeStr] = propMatch;
      props.push({
        name: name.trim(),
        typeStr: typeStr.trim(),
        jsDoc: currentJSDoc || undefined,
      });
      currentJSDoc = '';
    }
  }

  return props;
}

/**
 * Get recommended PropDef type for a Figma property type.
 */
function getRecommendedTypeForFigma(figmaType: string): PropDef['type'] {
  switch (figmaType) {
    case 'BOOLEAN':
      return 'boolean';
    case 'TEXT':
      return 'string';
    case 'INSTANCE_SWAP':
      return 'instance';
    case 'VARIANT':
      return 'enum';
    default:
      return 'string';
  }
}

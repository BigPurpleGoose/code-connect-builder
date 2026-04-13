import type {
  ComponentDefinition,
  PropDef,
  ValidationMap,
  DefValidationErrors,
  PropValidationError,
} from '@/types/connection';
import { isValidIdentifier, isFigmaUrl } from './stringUtils';

/**
 * Validate a single prop definition. Returns a list of errors for that prop.
 */
export function validateProp(prop: PropDef, allProps: PropDef[]): PropValidationError[] {
  const errors: PropValidationError[] = [];

  // React prop name
  if (!prop.reactProp.trim()) {
    errors.push({ field: 'reactProp', message: 'React prop name is required.' });
  } else if (!isValidIdentifier(prop.reactProp.trim())) {
    errors.push({ field: 'reactProp', message: 'Must be a valid camelCase identifier (no spaces or special characters).' });
  } else {
    const dupes = allProps.filter(
      (p) => p.id !== prop.id && p.reactProp.trim() === prop.reactProp.trim()
    );
    if (dupes.length > 0) {
      errors.push({ field: 'reactProp', message: 'Duplicate prop name within this component.' });
    }
  }

  // Figma prop name
  if (!prop.figmaProp.trim() && prop.type !== 'children') {
    errors.push({ field: 'figmaProp', message: 'Figma property or layer name is required.' });
  } else if (prop.figmaProp.trim() && /^[a-z]/.test(prop.figmaProp.trim()) && prop.type !== 'children') {
    // Figma component property names almost always start uppercase (e.g. "Kind", "Has Icon").
    // A lowercase start is a strong signal of a user error.
    // Note: Children type uses layer names which can be any case (e.g. "callToAction"), so exclude from this check.
    errors.push({
      field: 'figmaProp',
      message: 'Figma property names usually start with an uppercase letter. Double-check this matches the exact name in Figma.',
      severity: 'warning',
    });
  }

  // Type-specific validation
  if (prop.type === 'boolean') {
    if (prop.boolMode === 'visibility' && !prop.boolChildLayer.trim()) {
      errors.push({ field: 'boolChildLayer', message: 'Layer name is required for Visibility mode.' });
    }

    // Validate complex boolean custom values
    if (prop.boolMode === 'complex') {
      const validateBoolValue = (val: string): boolean => {
        if (!val.trim()) return true; // empty is valid (will use default)
        const trimmed = val.trim();
        // Check for valid patterns:
        // - Literals: undefined, null, true, false, numbers
        if (/^(undefined|null|true|false|-?\d+(\.\d+)?)$/.test(trimmed)) return true;
        // - String literals: 'text' or "text"
        if (/^['"].*['"]$/.test(trimmed)) return true;
        // - JSX elements: <Component /> or <Component>...</Component>
        if (/^<[A-Z]\w*.*\/>$/.test(trimmed) || /^<[A-Z]\w*.*>.*<\/[A-Z]\w*>$/.test(trimmed)) return true;
        // - figma.* calls: figma.children(...), figma.instance(...), etc.
        if (/^figma\.(children|instance|string|boolean|enum|textContent|nestedProps)\s*\(/.test(trimmed)) return true;
        // - React fragments or other valid JSX
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) return true;
        return false;
      };

      if (prop.boolTrueValue && !validateBoolValue(prop.boolTrueValue)) {
        errors.push({
          field: 'boolTrueValue',
          message: 'Invalid syntax. Use literals (undefined, "string"), JSX (<Icon />), or figma.* calls (figma.instance(\'Prop\')).',
          severity: 'warning'
        });
      }

      if (prop.boolFalseValue && !validateBoolValue(prop.boolFalseValue)) {
        errors.push({
          field: 'boolFalseValue',
          message: 'Invalid syntax. Use literals (undefined, "string"), JSX (<Icon />), or figma.* calls (figma.instance(\'Prop\')).',
          severity: 'warning'
        });
      }
    }
  }

  if (prop.type === 'enum') {
    const hasEmptyRows = prop.enumOptions.some((o) => o.figma.trim() && !o.react.trim());
    if (hasEmptyRows) {
      errors.push({ field: 'enumOptions', message: 'All Figma options must have a corresponding React value.' });
    }
    if (prop.enumOptions.length === 0) {
      errors.push({ field: 'enumOptions', message: 'At least one enum option is required.' });
    }
  }

  if (prop.type === 'children') {
    const hasEmptyLayers = prop.childrenLayers.some((l) => !l.trim());
    if (prop.childrenLayers.length > 0 && hasEmptyLayers) {
      errors.push({ field: 'children', message: 'All layer name fields must be filled in.' });
    }

    // Validate wildcard exclusivity: '*' must be used alone
    const hasWildcard = prop.childrenLayers.some((l) => l.trim() === '*');
    if (hasWildcard && prop.childrenLayers.filter((l) => l.trim()).length > 1) {
      errors.push({
        field: 'children',
        message: 'Wildcard (*) must be used alone. Remove other layer names or remove the wildcard.'
      });
    }

    // Validate empty arrays
    const filledLayers = prop.childrenLayers.filter((l) => l.trim());
    if (filledLayers.length === 0) {
      errors.push({
        field: 'children',
        message: 'No layers specified. Add a layer name or use wildcard (*).',
        severity: 'warning'
      });
    }

    // Validate comma detection: commas indicate user error
    const hasComma = prop.childrenLayers.some((l) => l.includes(','));
    if (hasComma) {
      errors.push({
        field: 'children',
        message: "Layer name contains comma. Separate multiple layers like this: ['Layer1', 'Layer2'] instead of ['Layer1, Layer2']."
      });
    }
  }

  if (prop.type === 'nestedProps') {
    // Validate each nested prop definition
    prop.nestedProps.forEach((np, index) => {
      if (!np.reactProp.trim()) {
        errors.push({ field: 'nestedProps', message: `Nested prop #${index + 1}: React prop name is required.` });
      }
      if (!isValidIdentifier(np.reactProp.trim())) {
        errors.push({ field: 'nestedProps', message: `Nested prop #${index + 1}: React prop must be a valid identifier.` });
      }
      if (!np.figmaProp.trim() && np.type !== 'children') {
        errors.push({ field: 'nestedProps', message: `Nested prop #${index + 1}: Figma property is required.` });
      }
      if (np.type === 'boolean' && np.boolMode === 'visibility' && !np.boolChildLayer?.trim()) {
        errors.push({ field: 'nestedProps', message: `Nested prop #${index + 1}: Layer name is required for visibility mode.` });
      }
      if (np.type === 'enum') {
        if (!np.enumOptions || np.enumOptions.length === 0) {
          errors.push({ field: 'nestedProps', message: `Nested prop #${index + 1}: At least one enum option is required.` });
        } else {
          const hasEmptyRows = np.enumOptions.some((o) => o.figma.trim() && !o.react.trim());
          if (hasEmptyRows) {
            errors.push({ field: 'nestedProps', message: `Nested prop #${index + 1}: All Figma enum options must have React values.` });
          }
        }
      }
    });
  }

  return errors;
}

/**
 * Validate conditional branches in the example config.
 */
export function validateConditionalBranches(
  branches: ComponentDefinition['example']['conditionalBranches'],
  props: PropDef[]
): PropValidationError[] {
  const errors: PropValidationError[] = [];

  branches.forEach((branch, index) => {
    // Prop name must exist and be boolean or enum
    if (!branch.propName.trim()) {
      errors.push({
        field: 'conditionalBranch',
        message: `Conditional #${index + 1}: Prop name is required.`,
      });
    } else {
      const prop = props.find((p) => p.reactProp === branch.propName);
      if (!prop) {
        errors.push({
          field: 'conditionalBranch',
          message: `Conditional #${index + 1}: Prop "${branch.propName}" not found.`,
        });
      } else if (prop.type !== 'boolean' && prop.type !== 'enum') {
        errors.push({
          field: 'conditionalBranch',
          message: `Conditional #${index + 1}: Prop "${branch.propName}" must be boolean or enum type.`,
        });
      } else if (prop.type === 'enum') {
        // Validate enum condition value
        const validOptions = prop.enumOptions.map((o) => o.figma);
        if (!validOptions.includes(branch.condition)) {
          errors.push({
            field: 'conditionalBranch',
            message: `Conditional #${index + 1}: Condition "${branch.condition}" is not a valid enum value for "${branch.propName}".`,
            severity: 'warning',
          });
        }
      }
    }

    // Then render is required
    if (!branch.thenRender.trim()) {
      errors.push({
        field: 'conditionalBranch',
        message: `Conditional #${index + 1}: "Then render" JSX is required.`,
      });
    } else {
      // Basic JSX syntax validation
      const jsx = branch.thenRender.trim();
      if (!isValidJsxSyntax(jsx)) {
        errors.push({
          field: 'conditionalBranch',
          message: `Conditional #${index + 1}: Invalid JSX syntax in "Then render".`,
          severity: 'warning',
        });
      }
    }

    // Validate else render if present
    if (branch.elseRender && branch.elseRender.trim()) {
      const jsx = branch.elseRender.trim();
      if (!isValidJsxSyntax(jsx)) {
        errors.push({
          field: 'conditionalBranch',
          message: `Conditional #${index + 1}: Invalid JSX syntax in "Else render".`,
          severity: 'warning',
        });
      }
    }
  });

  return errors;
}

/**
 * Validate JSX prop values in the example config.
 */
export function validateJsxPropValues(
  jsxPropValues: ComponentDefinition['example']['jsxPropValues'],
  props: PropDef[]
): PropValidationError[] {
  const errors: PropValidationError[] = [];

  jsxPropValues.forEach((jsxProp, index) => {
    // Prop key is required
    if (!jsxProp.propKey.trim()) {
      errors.push({
        field: 'jsxPropValue',
        message: `JSX Prop #${index + 1}: Prop name is required.`,
      });
    }

    // Component name is required and should be valid identifier
    if (!jsxProp.componentName.trim()) {
      errors.push({
        field: 'jsxPropValue',
        message: `JSX Prop #${index + 1}: Component name is required.`,
      });
    } else if (!isValidComponentName(jsxProp.componentName.trim())) {
      errors.push({
        field: 'jsxPropValue',
        message: `JSX Prop #${index + 1}: Component name must be a valid identifier (e.g., TaskCard.Heading).`,
        severity: 'warning',
      });
    }

    // Validate component props
    jsxProp.componentProps.forEach((attr, attrIndex) => {
      if (!attr.key.trim()) {
        errors.push({
          field: 'jsxPropValue',
          message: `JSX Prop #${index + 1}, Attribute #${attrIndex + 1}: Key is required.`,
          severity: 'warning',
        });
      }

      if (!attr.value.trim()) {
        errors.push({
          field: 'jsxPropValue',
          message: `JSX Prop #${index + 1}, Attribute #${attrIndex + 1}: Value is required.`,
          severity: 'warning',
        });
      }

      // Validate nested prop references
      if (attr.valueType === 'nestedProp' && attr.value.trim()) {
        const value = attr.value.trim();
        if (!value.startsWith('props.')) {
          errors.push({
            field: 'jsxPropValue',
            message: `JSX Prop #${index + 1}, Attribute #${attrIndex + 1}: Nested prop reference should start with "props.".`,
            severity: 'warning',
          });
        } else {
          // Try to validate the path exists
          const path = value.substring(6); // Remove 'props.'
          const parts = path.split('.');
          if (parts.length >= 2) {
            const propName = parts[0];
            const nestedPropName = parts[1];
            const prop = props.find((p) => p.reactProp === propName);
            if (prop && prop.type === 'nestedProps') {
              const nestedProp = prop.nestedProps.find((np) => np.reactProp === nestedPropName);
              if (!nestedProp) {
                errors.push({
                  field: 'jsxPropValue',
                  message: `JSX Prop #${index + 1}, Attribute #${attrIndex + 1}: Nested prop "${nestedPropName}" not found in "${propName}".`,
                  severity: 'warning',
                });
              }
            }
          }
        }
      }
    });
  });

  return errors;
}

// Basic JSX syntax validation (check for matching tags)
function isValidJsxSyntax(jsx: string): boolean {
  // Very basic check - just ensure it looks like JSX
  const trimmed = jsx.trim();
  if (!trimmed) return false;

  // Allow simple expressions like {propName}
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return true;

  // Allow self-closing tags
  if (trimmed.startsWith('<') && trimmed.endsWith('/>')) return true;

  // Allow opening/closing tag pairs (very basic check)
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    // Extract tag name from opening tag
    const openMatch = trimmed.match(/^<([A-Za-z][A-Za-z0-9.]*)/);
    const closeMatch = trimmed.match(/<\/([A-Za-z][A-Za-z0-9.]*)>$/);
    if (openMatch && closeMatch) {
      return openMatch[1] === closeMatch[1];
    }
    return true; // Give benefit of doubt for complex JSX
  }

  return false;
}

// Validate component name (allows dots for compound components)
function isValidComponentName(name: string): boolean {
  if (!name) return false;
  // Must start with uppercase, can have dots for compound components
  return /^[A-Z][A-Za-z0-9]*(\.[A-Z][A-Za-z0-9]*)*$/.test(name);
}

/**
 * Validate the definition-level fields (name, figmaUrl, importPath).
 */
export function validateDefinition(def: ComponentDefinition): DefValidationErrors {
  const errors: DefValidationErrors = {};

  if (!def.name.trim()) {
    errors.name = 'Component name is required.';
  }

  if (!def.figmaUrl.trim()) {
    errors.figmaUrl = 'Figma URL or node ID is required.';
  } else if (!isFigmaUrl(def.figmaUrl.trim())) {
    errors.figmaUrl = 'Must be a valid Figma URL (https://www.figma.com/...) or node ID (e.g. 123:456).';
  }

  if (!def.importPath.trim()) {
    errors.importPath = 'Import path is required (e.g. ./components/Button).';
  }

  return errors;
}

/**
 * Build a full ValidationMap for all props in a definition.
 * Used by useValidation hook.
 */
export function buildValidationMap(def: ComponentDefinition): ValidationMap {
  const map: ValidationMap = {};

  // Validate props
  for (const prop of def.props) {
    const errs = validateProp(prop, def.props);
    if (errs.length > 0) map[prop.id] = errs;
  }

  // Validate conditional branches
  const conditionalErrors = validateConditionalBranches(
    def.example.conditionalBranches,
    def.props
  );
  if (conditionalErrors.length > 0) {
    map['__conditionalBranches__'] = conditionalErrors;
  }

  // Validate JSX prop values
  const jsxPropErrors = validateJsxPropValues(
    def.example.jsxPropValues,
    def.props
  );
  if (jsxPropErrors.length > 0) {
    map['__jsxPropValues__'] = jsxPropErrors;
  }

  return map;
}

/**
 * Returns true if a definition has no validation errors (def-level or prop-level).
 */
export function isDefinitionValid(def: ComponentDefinition): boolean {
  const defErrors = validateDefinition(def);
  if (Object.keys(defErrors).length > 0) return false;

  // Check prop validation errors
  for (const prop of def.props) {
    const errs = validateProp(prop, def.props);
    const hasBlockingErrors = errs.some((e) => !e.severity || e.severity === 'error');
    if (hasBlockingErrors) return false;
  }

  // Check conditional branch validation errors
  const conditionalErrors = validateConditionalBranches(
    def.example.conditionalBranches,
    def.props
  );
  const hasBlockingConditionalErrors = conditionalErrors.some(
    (e) => !e.severity || e.severity === 'error'
  );
  if (hasBlockingConditionalErrors) return false;

  // Check JSX prop value validation errors
  const jsxPropErrors = validateJsxPropValues(
    def.example.jsxPropValues,
    def.props
  );
  const hasBlockingJsxPropErrors = jsxPropErrors.some(
    (e) => !e.severity || e.severity === 'error'
  );
  if (hasBlockingJsxPropErrors) return false;

  return true;
}

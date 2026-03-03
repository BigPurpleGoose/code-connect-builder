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
  } else if (prop.figmaProp.trim() && /^[a-z]/.test(prop.figmaProp.trim())) {
    // Figma property names almost always start uppercase (e.g. "Kind", "Has Icon").
    // A lowercase start is a strong signal of a user error.
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
  }

  return errors;
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
  for (const prop of def.props) {
    const errs = validateProp(prop, def.props);
    if (errs.length > 0) map[prop.id] = errs;
  }
  return map;
}

/**
 * Returns true if a definition has no validation errors (def-level or prop-level).
 */
export function isDefinitionValid(def: ComponentDefinition): boolean {
  const defErrors = validateDefinition(def);
  if (Object.keys(defErrors).length > 0) return false;
  for (const prop of def.props) {
    const errs = validateProp(prop, def.props);
    const hasBlockingErrors = errs.some((e) => !e.severity || e.severity === 'error');
    if (hasBlockingErrors) return false;
  }
  return true;
}

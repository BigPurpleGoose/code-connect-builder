/**
 * Intelligent prop matching algorithm for mapping React props to Figma properties.
 * Uses exact matching, fuzzy matching, and type compatibility checks.
 */

import type { FigmaComponentSchema, FigmaPropertyDefinition } from './figmaApi';
import type { PropDef, EnumOption } from '@/types/connection';
import { makeEnumOption } from './defaults';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PropPattern {
  isCalculated: boolean;
  isHandler: boolean;
  isOptional: boolean;
  hasDefault: boolean;
  reason: string;
}

export interface PropSuggestion {
  figmaProp: string;
  figmaType: string;
  confidence: number;
  typeMatch: boolean;
  semanticCompatibility: 'compatible' | 'incompatible' | 'warning';
  reasoning: string;
}

export interface PropMatchResult {
  reactProp: string;
  reactType: string;
  figmaProp: string | null; // Best match (kept for backward compatibility)
  figmaType: string | null;
  confidence: number; // 0-1, where 1 is exact match
  typeMatch: boolean;
  warnings: string[];
  suggestions: string[];
  // New fields for manual workflow
  pattern?: PropPattern;
  rankedSuggestions?: PropSuggestion[];
}

export interface UnmappedFigmaProp {
  name: string;
  type: string;
  suggestion: string | null; // Suggested React prop name
}

export interface MatchingReport {
  matches: PropMatchResult[];
  unmappedFigmaProps: UnmappedFigmaProp[];
  unmappedReactProps: string[];
  overallConfidence: number;
}

// ─── String Similarity ────────────────────────────────────────────────────────

/**
 * Calculate Levenshtein distance between two strings (edit distance).
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score between two strings (0-1).
 */
function similarityScore(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Normalize a property name for comparison (lowercase, no special chars).
 */
function normalizePropName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ─── Semantic Pattern Detection ───────────────────────────────────────────────

/**
 * Detect semantic patterns in a React prop for intelligent matching.
 */
export function detectPropPattern(
  propName: string,
  propType: string,
  jsDocComment?: string
): PropPattern {
  const lowerName = propName.toLowerCase();
  const lowerType = propType.toLowerCase();
  const docText = (jsDocComment || '').toLowerCase();

  // Detect calculated/computed/derived props
  const isCalculated =
    docText.includes('calculated') ||
    docText.includes('computed') ||
    docText.includes('derived') ||
    docText.includes('auto') ||
    lowerName.includes('length') ||
    lowerName.includes('count') ||
    lowerName.includes('index') ||
    lowerName.includes('total');

  // Detect event handlers
  const isHandler =
    lowerName.startsWith('on') ||
    lowerName.startsWith('handle') ||
    lowerType.includes('function') ||
    lowerType.includes('=>');

  // Detect optional props (TypeScript ? suffix)
  const isOptional = propType.includes('?') || propType.includes('undefined');

  // Detect props with defaults (hint from JSDoc)
  const hasDefault =
    docText.includes('@default') ||
    docText.includes('default:') ||
    docText.includes('defaults to');

  // Generate reasoning
  let reason = '';
  if (isCalculated) {
    reason = 'Calculated property (auto-computed value)';
  } else if (isHandler) {
    reason = 'Event handler function';
  } else if (hasDefault && !isOptional) {
    reason = 'Has default value';
  } else if (isOptional) {
    reason = 'Optional property';
  } else {
    reason = 'Required property';
  }

  return {
    isCalculated,
    isHandler,
    isOptional,
    hasDefault,
    reason,
  };
}

/**
 * Check semantic compatibility between React prop pattern and Figma property.
 */
function checkSemanticCompatibility(
  pattern: PropPattern,
  figmaType: string
): { level: 'compatible' | 'incompatible' | 'warning'; reason: string } {
  // Calculated props cannot map to manual inputs
  if (pattern.isCalculated) {
    return {
      level: 'incompatible',
      reason: 'Calculated property cannot map to manual Figma input',
    };
  }

  // Event handlers cannot map to Figma properties
  if (pattern.isHandler) {
    return {
      level: 'incompatible',
      reason: 'Event handlers are logic-only, not visual properties',
    };
  }

  // Optional props with no default might cause issues
  if (pattern.isOptional && !pattern.hasDefault) {
    return {
      level: 'warning',
      reason: 'Optional property without default may need fallback handling',
    };
  }

  return {
    level: 'compatible',
    reason: 'Compatible mapping',
  };
}

// ─── Type Compatibility ───────────────────────────────────────────────────────

/**
 * Map of Figma property types to compatible React/TypeScript types.
 */
const TYPE_COMPATIBILITY_MATRIX: Record<string, string[]> = {
  BOOLEAN: ['boolean', 'bool'],
  TEXT: ['string', 'number', 'text'],
  INSTANCE_SWAP: ['componenttype', 'reactnode', 'element', 'component', 'instance'],
  VARIANT: ['enum', 'string', 'union'],
};

/**
 * Check if a React type is compatible with a Figma property type.
 */
function areTypesCompatible(figmaType: string, reactType: string): boolean {
  const normalizedReactType = normalizePropName(reactType);
  const compatibleTypes = TYPE_COMPATIBILITY_MATRIX[figmaType] || [];

  return compatibleTypes.some(ct => normalizedReactType.includes(ct));
}

/**
 * Get a recommended PropDef type for a Figma property type.
 */
function getRecommendedPropType(figmaType: string): PropDef['type'] {
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

// ─── Prop Matching ────────────────────────────────────────────────────────────

/**
 * Find the best matching Figma property for a React prop name.
 */
function findBestFigmaMatch(
  reactProp: string,
  figmaProps: Record<string, FigmaPropertyDefinition>
): { prop: string; confidence: number } | null {
  const normalizedReact = normalizePropName(reactProp);
  const candidates: Array<{ prop: string; score: number }> = [];

  for (const figmaPropName of Object.keys(figmaProps)) {
    const normalizedFigma = normalizePropName(figmaPropName);

    // Exact match (case-insensitive)
    if (normalizedReact === normalizedFigma) {
      return { prop: figmaPropName, confidence: 1.0 };
    }

    // Fuzzy match
    const score = similarityScore(normalizedReact, normalizedFigma);
    if (score >= 0.6) {
      candidates.push({ prop: figmaPropName, score });
    }
  }

  // Return best candidate if any
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    return { prop: candidates[0].prop, confidence: candidates[0].score };
  }

  return null;
}

/**
 * Generate ranked suggestions for matching a React prop to Figma properties.
 * Returns top 3 matches with confidence scores and semantic compatibility.
 */
export function generateRankedSuggestions(
  reactProp: string,
  reactType: string,
  pattern: PropPattern,
  figmaProps: Record<string, FigmaPropertyDefinition>,
  limit: number = 3
): PropSuggestion[] {
  const normalizedReact = normalizePropName(reactProp);
  const candidates: PropSuggestion[] = [];

  for (const [figmaPropName, figmaPropDef] of Object.entries(figmaProps)) {
    const normalizedFigma = normalizePropName(figmaPropName);

    // Calculate name similarity
    const nameSimilarity =
      normalizedReact === normalizedFigma
        ? 1.0
        : similarityScore(normalizedReact, normalizedFigma);

    // Only consider matches with decent similarity
    if (nameSimilarity < 0.5) continue;

    // Check type compatibility
    const typeMatch = areTypesCompatible(figmaPropDef.type, reactType);

    // Check semantic compatibility
    const semanticCheck = checkSemanticCompatibility(pattern, figmaPropDef.type);

    // Build reasoning
    let reasoning = `${Math.round(nameSimilarity * 100)}% name match`;
    if (typeMatch) {
      reasoning += ', types compatible';
    } else {
      reasoning += `, type mismatch (${figmaPropDef.type} ↔ ${reactType})`;
    }
    if (semanticCheck.level !== 'compatible') {
      reasoning += ` - ${semanticCheck.reason}`;
    }

    candidates.push({
      figmaProp: figmaPropName,
      figmaType: figmaPropDef.type,
      confidence: nameSimilarity,
      typeMatch,
      semanticCompatibility: semanticCheck.level,
      reasoning,
    });
  }

  // Sort by confidence, then by semantic compatibility, then by type match
  candidates.sort((a, b) => {
    // Incompatible items go to bottom
    if (a.semanticCompatibility === 'incompatible' && b.semanticCompatibility !== 'incompatible') return 1;
    if (b.semanticCompatibility === 'incompatible' && a.semanticCompatibility !== 'incompatible') return -1;

    // Then by confidence
    if (Math.abs(a.confidence - b.confidence) > 0.05) {
      return b.confidence - a.confidence;
    }

    // Then by type match
    if (a.typeMatch !== b.typeMatch) {
      return a.typeMatch ? -1 : 1;
    }

    return 0;
  });

  return candidates.slice(0, limit);
}

/**
 * Generate warnings for a prop match.
 */
function generateMatchWarnings(
  reactProp: string,
  reactType: string,
  figmaProp: string | null,
  figmaType: string | null,
  typeMatch: boolean,
  confidence: number
): string[] {
  const warnings: string[] = [];

  if (!figmaProp) {
    warnings.push('No matching Figma property found');
  } else if (confidence < 1.0) {
    warnings.push(`Fuzzy match (${Math.round(confidence * 100)}% confidence)`);
  }

  if (figmaProp && figmaType && !typeMatch) {
    warnings.push(`Type mismatch: Figma ${figmaType} ↔ React ${reactType}`);
  }

  return warnings;
}

/**
 * Generate suggestions for improving a prop match.
 */
function generateMatchSuggestions(
  reactProp: string,
  reactType: string,
  figmaProp: string | null,
  figmaType: string | null,
  typeMatch: boolean
): string[] {
  const suggestions: string[] = [];

  if (!figmaProp) {
    suggestions.push('Add this property to your Figma component or rename it in React');
  }

  if (figmaProp && figmaType && !typeMatch) {
    const recommendedType = getRecommendedPropType(figmaType);
    suggestions.push(`Consider using type "${recommendedType}" for better compatibility`);
  }

  return suggestions;
}

// ─── Main Matching Function ───────────────────────────────────────────────────

/**
 * Match React props to Figma properties and generate a comprehensive report.
 * Legacy version for backward compatibility (used with automatic Figma API workflow).
 */
export function matchPropsToFigma(
  reactProps: Array<{ name: string; type: string }>,
  figmaSchema: FigmaComponentSchema
): MatchingReport {
  const matches: PropMatchResult[] = [];
  const matchedFigmaProps = new Set<string>();

  // Process each React prop
  for (const reactProp of reactProps) {
    const match = findBestFigmaMatch(reactProp.name, figmaSchema.properties);
    const figmaProp = match?.prop || null;
    const figmaType = figmaProp ? figmaSchema.properties[figmaProp].type : null;
    const confidence = match?.confidence || 0;
    const typeMatch = figmaType ? areTypesCompatible(figmaType, reactProp.type) : false;

    if (figmaProp) {
      matchedFigmaProps.add(figmaProp);
    }

    const warnings = generateMatchWarnings(
      reactProp.name,
      reactProp.type,
      figmaProp,
      figmaType,
      typeMatch,
      confidence
    );

    const suggestions = generateMatchSuggestions(
      reactProp.name,
      reactProp.type,
      figmaProp,
      figmaType,
      typeMatch
    );

    matches.push({
      reactProp: reactProp.name,
      reactType: reactProp.type,
      figmaProp,
      figmaType,
      confidence,
      typeMatch,
      warnings,
      suggestions,
    });
  }

  // Find unmapped Figma props
  const unmappedFigmaProps: UnmappedFigmaProp[] = [];
  for (const [figmaPropName, figmaPropDef] of Object.entries(figmaSchema.properties)) {
    if (!matchedFigmaProps.has(figmaPropName)) {
      // Try to suggest a React prop name (camelCase version)
      const suggestion = figmaPropName.charAt(0).toLowerCase() + figmaPropName.slice(1);
      unmappedFigmaProps.push({
        name: figmaPropName,
        type: figmaPropDef.type,
        suggestion,
      });
    }
  }

  // Calculate overall confidence
  const totalConfidence = matches.reduce((sum, m) => sum + m.confidence, 0);
  const overallConfidence = matches.length > 0 ? totalConfidence / matches.length : 0;

  return {
    matches,
    unmappedFigmaProps,
    unmappedReactProps: matches.filter(m => !m.figmaProp).map(m => m.reactProp),
    overallConfidence,
  };
}

/**
 * Enhanced matching with semantic pattern detection and ranked suggestions.
 * Used for manual Figma property workflow with intelligent estimation.
 */
export function matchPropsToFigmaWithPatterns(
  reactProps: Array<{ name: string; type: string; jsDoc?: string }>,
  figmaSchema: FigmaComponentSchema
): MatchingReport {
  const matches: PropMatchResult[] = [];
  const matchedFigmaProps = new Set<string>();

  // Process each React prop with pattern detection
  for (const reactProp of reactProps) {
    // Detect semantic patterns
    const pattern = detectPropPattern(reactProp.name, reactProp.type, reactProp.jsDoc);

    // Generate ranked suggestions
    const rankedSuggestions = generateRankedSuggestions(
      reactProp.name,
      reactProp.type,
      pattern,
      figmaSchema.properties
    );

    // Best match for backward compatibility
    const bestSuggestion = rankedSuggestions.length > 0 ? rankedSuggestions[0] : null;
    const figmaProp = bestSuggestion?.figmaProp || null;
    const figmaType = bestSuggestion?.figmaType || null;
    const confidence = bestSuggestion?.confidence || 0;
    const typeMatch = bestSuggestion?.typeMatch || false;

    if (figmaProp) {
      matchedFigmaProps.add(figmaProp);
    }

    // Generate warnings based on pattern and suggestions
    const warnings: string[] = [];
    if (pattern.isCalculated || pattern.isHandler) {
      warnings.push(`🚫 ${pattern.reason} - Cannot map to manual Figma input`);
    } else if (!figmaProp) {
      warnings.push('No matching Figma property found');
    } else if (confidence < 1.0) {
      warnings.push(`Fuzzy match (${Math.round(confidence * 100)}% confidence)`);
    }

    if (bestSuggestion && bestSuggestion.semanticCompatibility === 'warning') {
      warnings.push(bestSuggestion.reasoning);
    }

    if (figmaProp && figmaType && !typeMatch) {
      warnings.push(`Type mismatch: Figma ${figmaType} ↔ React ${reactProp.type}`);
    }

    // Generate suggestions
    const suggestions: string[] = [];
    if (rankedSuggestions.length > 1) {
      suggestions.push(`${rankedSuggestions.length} possible matches - review ranked options`);
    }
    if (!figmaProp && !pattern.isCalculated && !pattern.isHandler) {
      suggestions.push('Add this property to your Figma component or rename it in React');
    }

    matches.push({
      reactProp: reactProp.name,
      reactType: reactProp.type,
      figmaProp,
      figmaType,
      confidence,
      typeMatch,
      warnings,
      suggestions,
      pattern,
      rankedSuggestions,
    });
  }

  // Find unmapped Figma props
  const unmappedFigmaProps: UnmappedFigmaProp[] = [];
  for (const [figmaPropName, figmaPropDef] of Object.entries(figmaSchema.properties)) {
    if (!matchedFigmaProps.has(figmaPropName)) {
      const suggestion = figmaPropName.charAt(0).toLowerCase() + figmaPropName.slice(1);
      unmappedFigmaProps.push({
        name: figmaPropName,
        type: figmaPropDef.type,
        suggestion,
      });
    }
  }

  // Calculate overall confidence (excluding incompatible props)
  const compatibleMatches = matches.filter(
    m => !m.pattern?.isCalculated && !m.pattern?.isHandler
  );
  const totalConfidence = compatibleMatches.reduce((sum, m) => sum + m.confidence, 0);
  const overallConfidence =
    compatibleMatches.length > 0 ? totalConfidence / compatibleMatches.length : 0;

  return {
    matches,
    unmappedFigmaProps,
    unmappedReactProps: matches.filter(m => !m.figmaProp).map(m => m.reactProp),
    overallConfidence,
  };
}

// ─── Enum Options Generator ───────────────────────────────────────────────────

/**
 * Generate EnumOptions from a Figma VARIANT property.
 */
export function generateEnumOptionsFromVariant(
  figmaProp: FigmaPropertyDefinition
): EnumOption[] {
  if (figmaProp.type !== 'VARIANT' || !figmaProp.variantOptions) {
    return [makeEnumOption()];
  }

  return figmaProp.variantOptions.map(option => {
    // Figma variant: "Primary" → React: "primary" (lowercase)
    const react = option.charAt(0).toLowerCase() + option.slice(1);
    return makeEnumOption({ figma: option, react, isCode: false });
  });
}

/**
 * Get a confidence level label for UI display.
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence === 1.0) return 'Exact match';
  if (confidence >= 0.85) return 'High confidence';
  if (confidence >= 0.7) return 'Medium confidence';
  if (confidence >= 0.6) return 'Low confidence';
  return 'No match';
}

/**
 * Get a color class for confidence level.
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence === 1.0) return 'text-emerald-600 dark:text-emerald-400';
  if (confidence >= 0.85) return 'text-blue-600 dark:text-blue-400';
  if (confidence >= 0.7) return 'text-amber-600 dark:text-amber-400';
  if (confidence >= 0.6) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

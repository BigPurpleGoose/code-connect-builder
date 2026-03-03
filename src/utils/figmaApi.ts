/**
 * Figma API utilities for fetching component schemas and properties.
 * Supports both authenticated (with token) and public API access.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FigmaUrlParts {
  fileKey: string;
  nodeId: string;
  isValid: boolean;
}

export interface FigmaPropertyDefinition {
  name: string;
  type: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT';
  defaultValue?: string | boolean;
  variantOptions?: string[];
  preferredValues?: Array<{ key: string; value: string }>;
}

export interface FigmaComponentSchema {
  id: string;
  name: string;
  type: string;
  properties: Record<string, FigmaPropertyDefinition>;
  variantGroupProperties?: Record<string, string[]>;
  description?: string;
}

export interface FigmaApiError {
  status: number;
  error: string;
  message?: string;
}

// ─── URL Parsing ──────────────────────────────────────────────────────────────

/**
 * Parse a Figma URL into file key and node ID.
 * Supports formats:
 *   - https://www.figma.com/design/FILE_KEY/...?node-id=123-456
 *   - https://www.figma.com/file/FILE_KEY/...?node-id=123%3A456
 *   - 123:456 (raw node ID for testing)
 */
export function parseFigmaUrl(url: string): FigmaUrlParts {
  const trimmed = url.trim();

  // Raw node ID format (e.g., "123:456")
  if (/^\d+:\d+$/.test(trimmed)) {
    return {
      fileKey: '',
      nodeId: trimmed,
      isValid: false, // valid format but missing file key
    };
  }

  // Full URL format
  const urlMatch = trimmed.match(
    /figma\.com\/(?:design|file)\/([a-zA-Z0-9]+)\/[^?]*\?[^#]*node-id=([0-9]+-[0-9]+|[0-9]+%3A[0-9]+)/
  );

  if (!urlMatch) {
    return { fileKey: '', nodeId: '', isValid: false };
  }

  const fileKey = urlMatch[1];
  let nodeId = urlMatch[2];

  // Normalize node ID: "123-456" or "123%3A456" → "123:456"
  nodeId = nodeId.replace(/-/g, ':').replace(/%3A/gi, ':');

  return {
    fileKey,
    nodeId,
    isValid: true,
  };
}

/**
 * Validate if a string looks like a Figma URL or node ID.
 */
export function isFigmaUrl(url: string): boolean {
  const parsed = parseFigmaUrl(url);
  return parsed.isValid || /^\d+:\d+$/.test(url.trim());
}

// ─── Token Management ─────────────────────────────────────────────────────────

const STORAGE_KEY = 'figma_api_token';

/**
 * Get the stored Figma API token from localStorage.
 */
export function getFigmaToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Store a Figma API token in localStorage.
 */
export function setFigmaToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch (e) {
    console.error('Failed to store Figma token:', e);
  }
}

/**
 * Remove the stored Figma API token.
 */
export function clearFigmaToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear Figma token:', e);
  }
}

// ─── API Fetching ─────────────────────────────────────────────────────────────

export interface FigmaFetchResult {
  schema: FigmaComponentSchema | null;
  error?: {
    code: 'invalid_url' | 'no_token' | 'api_error' | 'not_found';
    message: string;
    statusCode?: number;
  };
}

/**
 * Check if a Figma API token is available.
 */
export function hasToken(): boolean {
  return !!getFigmaToken();
}

/** * Fetch Figma component properties with detailed error reporting.
 * Returns a result object with either a schema or detailed error information.
 */
export async function fetchComponentPropertiesWithError(
  figmaUrl: string,
  token?: string
): Promise<FigmaFetchResult> {
  const parsed = parseFigmaUrl(figmaUrl);

  if (!parsed.isValid) {
    return {
      schema: null,
      error: {
        code: 'invalid_url',
        message: 'Invalid Figma URL format. Use: https://www.figma.com/design/FILE_KEY/...?node-id=123-456',
      },
    };
  }

  const apiToken = token || getFigmaToken();
  if (!apiToken) {
    return {
      schema: null,
      error: {
        code: 'no_token',
        message:
          'No Figma API token found. Generate a token at figma.com → Settings → Personal Access Tokens, then store it using setFigmaToken()',
      },
    };
  }

  try {
    const response = await fetch(
      `https://api.figma.com/v1/files/${parsed.fileKey}/nodes?ids=${encodeURIComponent(parsed.nodeId)}`,
      {
        headers: {
          'X-Figma-Token': apiToken,
        },
      }
    );

    if (!response.ok) {
      const statusCode = response.status;
      let message = 'Failed to fetch Figma component.';

      if (statusCode === 403) {
        message = 'Access denied. Check that your Figma API token has the correct permissions.';
      } else if (statusCode === 404) {
        message = 'Component not found. Verify the URL points to a valid Figma component.';
      } else {
        const errorData = await response.json().catch(() => ({}));
        message = (errorData as any).err || `API error: ${statusCode}`;
      }

      return {
        schema: null,
        error: {
          code: 'api_error',
          message,
          statusCode,
        },
      };
    }

    const data = await response.json();
    const nodeData = data.nodes?.[parsed.nodeId];

    if (!nodeData || !nodeData.document) {
      return {
        schema: null,
        error: {
          code: 'not_found',
          message: `Node ${parsed.nodeId} not found in Figma file.`,
        },
      };
    }

    const node = nodeData.document;

    // Parse component properties
    const properties: Record<string, FigmaPropertyDefinition> = {};

    // ComponentPropertyDefinitions (new component properties API)
    if (node.componentPropertyDefinitions) {
      for (const [key, def] of Object.entries(node.componentPropertyDefinitions)) {
        const propDef = def as any;
        properties[key] = {
          name: key,
          type: propDef.type,
          defaultValue: propDef.defaultValue,
          variantOptions: propDef.variantOptions,
          preferredValues: propDef.preferredValues,
        };
      }
    }

    // Variant properties (legacy variant API)
    const variantGroupProperties: Record<string, string[]> = {};
    if (node.componentPropertyDefinitions) {
      for (const [key, def] of Object.entries(node.componentPropertyDefinitions)) {
        const propDef = def as any;
        if (propDef.type === 'VARIANT' && propDef.variantOptions) {
          variantGroupProperties[key] = propDef.variantOptions;
        }
      }
    }

    return {
      schema: {
        id: node.id,
        name: node.name || 'Unnamed Component',
        type: node.type,
        properties,
        variantGroupProperties,
        description: node.description,
      },
    };
  } catch (error) {
    return {
      schema: null,
      error: {
        code: 'api_error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Fetch Figma component property definitions from the Figma API.
 * Returns the schema or null on error (simplified version).
 * For detailed error information, use fetchComponentPropertiesWithError().
 */
export async function fetchComponentProperties(
  figmaUrl: string,
  token?: string
): Promise<FigmaComponentSchema | null> {
  const result = await fetchComponentPropertiesWithError(figmaUrl, token);
  return result.schema;
}

/**
 * Extract all property names from a Figma component schema.
 */
export function getFigmaPropertyNames(schema: FigmaComponentSchema): string[] {
  return Object.keys(schema.properties);
}

/**
 * Get a human-readable type label for a Figma property type.
 */
export function getFigmaTypeLabel(type: string): string {
  switch (type) {
    case 'BOOLEAN':
      return 'Boolean';
    case 'TEXT':
      return 'Text';
    case 'INSTANCE_SWAP':
      return 'Instance Swap';
    case 'VARIANT':
      return 'Variant';
    default:
      return type;
  }
}

/**
 * Design Tokens - Central source of truth for spacing, sizing, and typography
 * Use these constants for consistent styling across the application
 */

export const SPACING = {
  xs: 4,   // 0.5 in Tailwind (4px)
  sm: 8,   // 2 (8px)
  md: 12,  // 3 (12px)
  lg: 16,  // 4 (16px)
  xl: 24,  // 6 (24px)
  '2xl': 32, // 8 (32px)
} as const;

export const COMPONENT_HEIGHT = {
  sm: 28,
  md: 32,
  lg: 36,
  header: 48,
} as const;

export const SIDEBAR_WIDTH = {
  collapsed: 0,
  mobile: 280,    // Slide-over on mobile
  desktop: 320,   // More spacious on desktop
} as const;

export const TYPOGRAPHY = {
  caption: 'text-caption',      // 10px
  bodySm: 'text-body-sm',       // 12px
  body: 'text-body',            // 13px (default)
  bodyMd: 'text-body-md',       // 14px
  heading: 'text-heading',      // 14px bold
} as const;

export const BREAKPOINTS = {
  mobile: 640,   // sm
  tablet: 768,   // md
  desktop: 1024, // lg
} as const;

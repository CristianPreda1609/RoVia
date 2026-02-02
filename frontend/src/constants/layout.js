/**
 * Layout Utilities and Spacing System
 * Ensures consistency in spacing, typography, and layouts
 */

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
};

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '999px',
};

export const fontSizes = {
  xs: '12px',
  sm: '13px',
  base: '14px',
  lg: '16px',
  xl: '18px',
  '2xl': '20px',
  '3xl': '24px',
  '4xl': '28px',
  '5xl': '32px',
};

export const fontWeights = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

/**
 * Common card style
 */
export const cardStyle = {
  background: 'var(--card-bg)',
  borderRadius: '12px',
  border: '1px solid var(--border)',
  padding: spacing.lg,
  transition: 'all 200ms ease',
};

/**
 * Section container style
 */
export const sectionStyle = {
  padding: `${spacing.xl} ${spacing.xl}`,
  minHeight: 'calc(100vh - 56px)',
  background: 'var(--bg)',
};

/**
 * Flexbox utilities
 */
export const flex = {
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  between: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
  },
  colCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  }
};

/**
 * Grid utilities
 */
export const grid = {
  twoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: spacing.lg,
  },
  threeCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: spacing.lg,
  },
  fourCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: spacing.lg,
  },
  autoFit: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: spacing.lg,
  }
};

/**
 * Typography styles
 */
export const typography = {
  h1: {
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    color: 'var(--text)',
    margin: 0,
    lineHeight: '1.2',
  },
  h2: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    color: 'var(--text)',
    margin: 0,
    lineHeight: '1.3',
  },
  h3: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    color: 'var(--text)',
    margin: 0,
    lineHeight: '1.4',
  },
  body: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    color: 'var(--text)',
    lineHeight: '1.5',
  },
  small: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    color: 'var(--muted)',
    lineHeight: '1.4',
  }
};

/**
 * Shadows
 */
export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.07)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
};

/**
 * Color System for RoVia
 * This file provides a centralized color palette for the entire application
 * ensuring consistency across light and dark modes
 */

export const LIGHT_MODE = {
  // Base colors
  bg: '#f5f7fa',
  bgSecondary: '#fafbfc',
  text: '#1a202c',
  textSecondary: '#4a5568',
  muted: '#718096',
  cardBg: '#ffffff',
  topbarBg: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#edf2f7',

  // Accent
  accent: '#3b82f6',
  accentHover: '#2563eb',
  accentLight: '#dbeafe',

  // Avatar & Brand
  avatarBg: '#3b82f6',

  // Regional Colors
  regions: {
    muntenia: '#f97316',
    transilvania: '#a855f7',
    moldova: '#0ea5e9',
    banat: '#22c55e',
    dobrogea: '#06b6d4',
    maramures: '#ef4444',
    neamt: '#3b82f6',
    alba: '#eab308',
  },

  // Semantic
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  info: '#3b82f6',
  infoLight: '#dbeafe',

  // Shadows
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  shadowMd: '0 4px 6px rgba(0, 0, 0, 0.07)',
  shadowLg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  shadowXl: '0 20px 25px rgba(0, 0, 0, 0.1)',
};

export const DARK_MODE = {
  // Base colors
  bg: '#0f172a',
  bgSecondary: '#1a1f3a',
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  muted: '#94a3b8',
  cardBg: '#1e293b',
  topbarBg: '#1a1f3a',
  border: '#334155',
  borderLight: '#475569',

  // Accent
  accent: '#60a5fa',
  accentHover: '#3b82f6',
  accentLight: '#1e40af',

  // Avatar & Brand
  avatarBg: '#3b82f6',

  // Regional Colors - More vibrant in dark
  regions: {
    muntenia: '#fb923c',
    transilvania: '#c084fc',
    moldova: '#38bdf8',
    banat: '#4ade80',
    dobrogea: '#22d3ee',
    maramures: '#f87171',
    neamt: '#60a5fa',
    alba: '#fbbf24',
  },

  // Semantic - Adjusted for dark
  success: '#10b981',
  successLight: '#064e3b',
  warning: '#f59e0b',
  warningLight: '#78350f',
  error: '#ef4444',
  errorLight: '#7f1d1d',
  info: '#60a5fa',
  infoLight: '#082f49',

  // Shadows
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  shadowMd: '0 4px 6px rgba(0, 0, 0, 0.4)',
  shadowLg: '0 10px 15px rgba(0, 0, 0, 0.5)',
  shadowXl: '0 20px 25px rgba(0, 0, 0, 0.6)',
};

/**
 * Get current theme colors based on isDark flag
 */
export const getColors = (isDark = false) => {
  return isDark ? DARK_MODE : LIGHT_MODE;
};

/**
 * Region metadata with icons and colors
 */
export const REGION_META = {
  Muntenia: {
    icon: '🏛️',
    color: (isDark) => (isDark ? DARK_MODE.regions.muntenia : LIGHT_MODE.regions.muntenia),
  },
  Transilvania: {
    icon: '🏔️',
    color: (isDark) => (isDark ? DARK_MODE.regions.transilvania : LIGHT_MODE.regions.transilvania),
  },
  Moldova: {
    icon: '🌄',
    color: (isDark) => (isDark ? DARK_MODE.regions.moldova : LIGHT_MODE.regions.moldova),
  },
  Banat: {
    icon: '🌿',
    color: (isDark) => (isDark ? DARK_MODE.regions.banat : LIGHT_MODE.regions.banat),
  },
  Dobrogea: {
    icon: '🌊',
    color: (isDark) => (isDark ? DARK_MODE.regions.dobrogea : LIGHT_MODE.regions.dobrogea),
  },
  Maramureș: {
    icon: '🪵',
    color: (isDark) => (isDark ? DARK_MODE.regions.maramures : LIGHT_MODE.regions.maramures),
  },
  Neamț: {
    icon: '⛰️',
    color: (isDark) => (isDark ? DARK_MODE.regions.neamt : LIGHT_MODE.regions.neamt),
  },
  Alba: {
    icon: '🏰',
    color: (isDark) => (isDark ? DARK_MODE.regions.alba : LIGHT_MODE.regions.alba),
  },
};

export const DEFAULT_REGION = {
  icon: '🗺️',
  color: (isDark) => (isDark ? DARK_MODE.accent : LIGHT_MODE.accent),
};

/**
 * Semantic color palette
 */
export const SEMANTIC_COLORS = {
  success: {
    light: LIGHT_MODE.success,
    lightBg: LIGHT_MODE.successLight,
    dark: DARK_MODE.success,
    darkBg: DARK_MODE.successLight,
  },
  warning: {
    light: LIGHT_MODE.warning,
    lightBg: LIGHT_MODE.warningLight,
    dark: DARK_MODE.warning,
    darkBg: DARK_MODE.warningLight,
  },
  error: {
    light: LIGHT_MODE.error,
    lightBg: LIGHT_MODE.errorLight,
    dark: DARK_MODE.error,
    darkBg: DARK_MODE.errorLight,
  },
  info: {
    light: LIGHT_MODE.info,
    lightBg: LIGHT_MODE.infoLight,
    dark: DARK_MODE.info,
    darkBg: DARK_MODE.infoLight,
  },
};

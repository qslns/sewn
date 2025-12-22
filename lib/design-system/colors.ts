// ===========================
// Sewn 디자인 시스템 - 컬러
// ===========================

export const colors = {
  // Primary
  black: '#1A1A1A',
  white: '#FFFFFF',

  // Neutral
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F3',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Accent (패션 브랜드 감성)
  accent: {
    camel: '#8B7355',
    beige: '#E8D4B8',
    sand: '#C4A77D',
    cream: '#FAF7F2',
  },

  // Semantic
  success: {
    light: '#DCFCE7',
    DEFAULT: '#2D5A27',
    dark: '#166534',
  },
  error: {
    light: '#FEE2E2',
    DEFAULT: '#8B2635',
    dark: '#991B1B',
  },
  warning: {
    light: '#FEF3C7',
    DEFAULT: '#92400E',
    dark: '#78350F',
  },
  info: {
    light: '#DBEAFE',
    DEFAULT: '#1E40AF',
    dark: '#1E3A8A',
  },
} as const

export type ColorKey = keyof typeof colors

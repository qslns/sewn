// ===========================
// Sewn 디자인 시스템 - 타이포그래피
// ===========================

export const typography = {
  fonts: {
    serif: '"Noto Serif KR", Georgia, serif',
    sans: '"Pretendard Variable", "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
  },

  sizes: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1.2' }],       // 48px
    '6xl': ['3.75rem', { lineHeight: '1.1' }],    // 60px
  },

  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
} as const

export type FontFamily = keyof typeof typography.fonts
export type FontSize = keyof typeof typography.sizes
export type FontWeight = keyof typeof typography.weights

/**
 * UI Theme configuration
 */
export const theme = {
  colors: {
    background: '#0B0F14',
    primary: '#64D2FF',
    accent: '#A78BFA',
    success: '#34D399',
    warning: '#F59E0B',
    error: '#EF4444',
    text: '#FFFFFF',
    textSecondary: '#94A3B8',
    card: '#1A1F2E',
    border: '#2D3748',
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    weights: {
      regular: '400',
      semibold: '600',
      bold: '800',
    },
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
  },
  shadows: {
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
  },
};


/**
 * NeuBridge Accessibility Constants
 * Clinically derived from DEMIGNED principles and WCAG 2.1 AAA
 * These values are MINIMUMS. Components may exceed them.
 */

export const A11Y = {
  // Touch targets (dp)
  minTouchTarget: 56,
  preferredTouchTarget: 64,
  sosTouchTarget: 56,
  touchSpacing: 16,
  
  // Typography (sp)
  fontSizeBody: 18,
  fontSizeBodyLarge: 20,
  fontSizeHeading: 24,
  fontSizeGameText: 28,
  fontSizeSOS: 24,
  fontSizeEmoji: 48,
  lineHeight: 1.5,
  letterSpacing: 0.5,
  
  // Spacing (dp)
  screenPadding: 24,
  cardPadding: 20,
  sectionGap: 24,
  
  // Animation (ms)
  transitionDuration: 400,
  transitionEasing: [0.25, 0.1, 0.25, 1] as const, // bezier
  fadeOutDuration: 300,
  successGlowDuration: 600,
  
  // Navigation
  maxTapsToFeature: 2,
  maxChoicesVisible: 4,
  
  // Contrast ratios (WCAG AAA)
  minContrastText: 7,
  minContrastInteractive: 4.5,
  
  // Stage-specific overrides
  stages: {
    early: {
      fontSizeBody: 18,
      maxChoices: 4,
      showFullNav: true,
    },
    middle: {
      fontSizeBody: 20,
      maxChoices: 3,
      showFullNav: false,
    },
    late: {
      fontSizeBody: 24,
      maxChoices: 1,
      showFullNav: false,
    },
  },
} as const;

/**
 * MindBridge Brand Colors
 * Warm, nature-inspired palette optimized for WCAG AAA contrast
 * on cream backgrounds. Never use red for negative states.
 */
export const COLORS = {
  // Primary
  navy: '#1B2A4A',       // Primary text, headers
  teal: '#2A9D8F',       // Interactive elements, positive feedback
  coral: '#E76F51',      // Emergency SOS only
  gold: '#E9C46A',       // Highlights, achievements, correct answers
  cream: '#F4F1DE',      // Primary background
  
  // Neutral
  gray: '#6B7280',       // Secondary text
  lightGray: '#E5E7EB',  // Borders, dividers
  white: '#FFFFFF',       // Cards, modals
  
  // Feedback (positive only)
  success: '#4ADE80',    // Gentle green for completion
  glow: '#FEF3C7',       // Warm glow for achievements
  
  // Stage-specific backgrounds
  earlyBg: '#F4F1DE',    // Standard cream
  middleBg: '#FFF8F0',   // Warmer, slightly more contrast
  lateBg: '#F0F4F8',     // Cool, calming blue-white
} as const;

export type ColorKey = keyof typeof COLORS;

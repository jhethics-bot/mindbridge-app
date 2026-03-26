/**
 * NeuBridge App Metadata
 * Centralized constants for about screens, app store listings, and legal text.
 */

export const APP_METADATA = {
  name: 'NeuBridge',
  tagline: 'Connecting Minds, Preserving Memories',
  version: '1.0.0-beta',
  description: 'Evidence-based cognitive care companion for Alzheimer\'s families',
  company: 'Hawkins Empire Ventures, LLC',
  website: 'https://mindbridge-landing.vercel.app',
  supportEmail: 'beta@neubridge.app',
  address: '7900 Sudley Road Suite 600, Manassas, VA 20109',

  stats: {
    screens: 34,
    cognitiveGames: 6,
    edgeFunctions: 6,
    supabaseTables: 74,
    seededContentRows: 640,
    mindFoodCategories: 15,
  },

  appStore: {
    subtitle: 'Cognitive Care for Alzheimer\'s',
    keywords: [
      'alzheimers', 'dementia', 'cognitive', 'caregiver', 'memory',
      'brain health', 'mind diet', 'companion pet', 'elderly care',
      'cognitive games', 'hydration tracker', 'caregiver support',
    ],
    category: 'Health & Fitness',
    secondaryCategory: 'Medical',
  },

  legal: {
    disclaimer: 'NeuBridge is not a medical device and is not intended to diagnose, treat, cure, or prevent any disease. Always consult your healthcare provider for medical advice.',
    privacyUrl: 'https://mindbridge-landing.vercel.app/privacy',
    termsUrl: 'https://mindbridge-landing.vercel.app/terms',
  },
} as const;

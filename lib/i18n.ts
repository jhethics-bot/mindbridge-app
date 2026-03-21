/**
 * NeuBridge Internationalization (i18n) Engine
 *
 * Loads localized strings from Supabase i18n_strings table.
 * Falls back to English if a key is missing in the current locale.
 * Supports dynamic locale switching stored in AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const LOCALE_KEY = 'mb_locale';
const STRINGS_KEY = 'mb_i18n_strings';

type StringMap = Record<string, string>;

let _locale = 'en';
let _strings: Record<string, StringMap> = { en: {} };
let _loaded = false;

/**
 * Built-in English strings as fallback (no DB needed for core UI).
 */
const ENGLISH_DEFAULTS: StringMap = {
  // Navigation
  'nav.home': 'Home',
  'nav.settings': 'Settings',
  'nav.back': 'Back',

  // Auth
  'auth.login': 'Sign In',
  'auth.signup': 'Create Account',
  'auth.logout': 'Sign Out',
  'auth.email': 'Email',
  'auth.password': 'Password',

  // Patient Home
  'home.greeting_morning': 'Good morning',
  'home.greeting_afternoon': 'Good afternoon',
  'home.greeting_evening': 'Good evening',
  'home.daily_activities': 'Today\'s Activities',
  'home.completed': 'completed',

  // Mood
  'mood.title': 'How are you feeling?',
  'mood.happy': 'Happy',
  'mood.okay': 'Okay',
  'mood.sad': 'Sad',
  'mood.confused': 'Confused',
  'mood.tired': 'Tired',

  // Games
  'games.memory_cards': 'Memory Cards',
  'games.word_find': 'Word Find',
  'games.face_name': 'Face-Name Match',
  'games.sorting': 'Sorting',
  'games.spelling': 'Spelling',
  'games.color_number': 'Color by Number',
  'games.play_again': 'Play Again',
  'games.go_home': 'Go Home',
  'games.wonderful': 'Wonderful!',
  'games.great_match': 'Great match!',

  // Activities
  'activity.breathing': 'Breathing Exercise',
  'activity.music': 'Music',
  'activity.photos': 'Photo Album',
  'activity.journal': 'My Stories',
  'activity.verse': 'Daily Verse',
  'activity.driving': 'Driving Check',

  // Caregiver
  'cg.dashboard': 'Caregiver Dashboard',
  'cg.observations': 'Observations',
  'cg.medications': 'Medications',
  'cg.appointments': 'Appointments',
  'cg.reports': 'Weekly Report',
  'cg.self_care': 'Self-Care',
  'cg.community': 'Community',

  // SOS
  'sos.title': 'I Need Help',
  'sos.emergency': 'Emergency',
  'sos.confused': 'I\'m Confused',
  'sos.calling_help': 'Calling for help...',

  // Common
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.done': 'Done',
  'common.loading': 'Loading...',
  'common.error': 'Something went wrong',
  'common.retry': 'Try Again',
};

/**
 * Built-in Spanish translations.
 */
const SPANISH_DEFAULTS: StringMap = {
  'nav.home': 'Inicio',
  'nav.settings': 'Ajustes',
  'nav.back': 'Atrás',

  'auth.login': 'Iniciar Sesión',
  'auth.signup': 'Crear Cuenta',
  'auth.logout': 'Cerrar Sesión',
  'auth.email': 'Correo electrónico',
  'auth.password': 'Contraseña',

  'home.greeting_morning': 'Buenos días',
  'home.greeting_afternoon': 'Buenas tardes',
  'home.greeting_evening': 'Buenas noches',
  'home.daily_activities': 'Actividades de Hoy',
  'home.completed': 'completadas',

  'mood.title': '¿Cómo te sientes?',
  'mood.happy': 'Feliz',
  'mood.okay': 'Bien',
  'mood.sad': 'Triste',
  'mood.confused': 'Confundido',
  'mood.tired': 'Cansado',

  'games.memory_cards': 'Tarjetas de Memoria',
  'games.word_find': 'Busca Palabras',
  'games.face_name': 'Caras y Nombres',
  'games.sorting': 'Clasificar',
  'games.spelling': 'Deletreo',
  'games.color_number': 'Colorear por Número',
  'games.play_again': 'Jugar de Nuevo',
  'games.go_home': 'Ir al Inicio',
  'games.wonderful': '¡Maravilloso!',
  'games.great_match': '¡Gran pareja!',

  'activity.breathing': 'Ejercicio de Respiración',
  'activity.music': 'Música',
  'activity.photos': 'Álbum de Fotos',
  'activity.journal': 'Mis Historias',
  'activity.verse': 'Versículo del Día',
  'activity.driving': 'Revisión de Conducción',

  'cg.dashboard': 'Panel del Cuidador',
  'cg.observations': 'Observaciones',
  'cg.medications': 'Medicamentos',
  'cg.appointments': 'Citas',
  'cg.reports': 'Informe Semanal',
  'cg.self_care': 'Autocuidado',
  'cg.community': 'Comunidad',

  'sos.title': 'Necesito Ayuda',
  'sos.emergency': 'Emergencia',
  'sos.confused': 'Estoy Confundido',
  'sos.calling_help': 'Pidiendo ayuda...',

  'common.save': 'Guardar',
  'common.cancel': 'Cancelar',
  'common.done': 'Listo',
  'common.loading': 'Cargando...',
  'common.error': 'Algo salió mal',
  'common.retry': 'Intentar de Nuevo',
};

/**
 * Initialize i18n — load saved locale and strings.
 */
export async function initI18n(): Promise<void> {
  // Load saved locale preference
  const saved = await AsyncStorage.getItem(LOCALE_KEY);
  if (saved) _locale = saved;

  // Set built-in defaults
  _strings = {
    en: { ...ENGLISH_DEFAULTS },
    es: { ...SPANISH_DEFAULTS },
  };

  // Try to load DB overrides
  try {
    const { data } = await supabase
      .from('i18n_strings')
      .select('string_key, locale, value');

    if (data) {
      for (const row of data) {
        if (!_strings[row.locale]) _strings[row.locale] = {};
        _strings[row.locale][row.string_key] = row.value;
      }
    }
  } catch {
    // Use built-in defaults if DB unreachable
  }

  _loaded = true;
}

/**
 * Get a translated string by key.
 * Falls back to English, then to the key itself.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  let str = _strings[_locale]?.[key]
    || _strings.en?.[key]
    || key;

  // Simple parameter interpolation: {{name}} -> value
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{{${k}}}`, String(v));
    }
  }

  return str;
}

/**
 * Get the current locale code.
 */
export function getLocale(): string {
  return _locale;
}

/**
 * Set the locale and persist it.
 */
export async function setLocale(locale: string): Promise<void> {
  _locale = locale;
  await AsyncStorage.setItem(LOCALE_KEY, locale);
}

/**
 * Get available locales from built-in list.
 */
export function getAvailableLocales(): { code: string; name: string; nativeName: string }[] {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
  ];
}

/**
 * Seed i18n_strings table with built-in defaults.
 * Call once during setup, not at runtime.
 */
export async function seedI18nStrings(): Promise<void> {
  const rows: { string_key: string; locale: string; value: string; context: string }[] = [];

  for (const [key, value] of Object.entries(ENGLISH_DEFAULTS)) {
    rows.push({ string_key: key, locale: 'en', value, context: 'app' });
  }
  for (const [key, value] of Object.entries(SPANISH_DEFAULTS)) {
    rows.push({ string_key: key, locale: 'es', value, context: 'app' });
  }

  await supabase.from('i18n_strings').upsert(rows, { onConflict: 'string_key,locale' });

  // Update completion percentage
  await supabase
    .from('supported_locales')
    .update({ completion_pct: 100, is_active: true })
    .eq('code', 'es');
}

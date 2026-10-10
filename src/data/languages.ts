export interface Language {
  /** Stable identifier persisted to storage (matches the previous navbar codes). */
  code: string;
  /** BCP-47 tag applied to the document's `lang` attribute. */
  locale: string;
  /** Language name written in its own script — Prime Video's primary label. */
  native: string;
  /** English label — kept as a secondary hint and used for search. */
  english: string;
  /** Right-to-left languages (Urdu, Hebrew, Arabic). */
  rtl?: boolean;
}

/**
 * Display-language catalog, listed in the exact order Prime Video uses in its
 * own picker: Latin-script languages first (A–Z), then every other script.
 * Each row shows the language in its native script only.
 */
export const LANGUAGES: Language[] = [
  { code: 'ID', locale: 'id', native: 'Bahasa Indonesia', english: 'Indonesian' },
  { code: 'MS', locale: 'ms', native: 'Bahasa Melayu', english: 'Malay' },
  { code: 'DA', locale: 'da', native: 'Dansk', english: 'Danish' },
  { code: 'DE', locale: 'de', native: 'Deutsch', english: 'German' },
  { code: 'EN', locale: 'en', native: 'English', english: 'English' },
  { code: 'ES', locale: 'es', native: 'Español', english: 'Spanish' },
  { code: 'ES-419', locale: 'es-419', native: 'Español Latinoamérica', english: 'Spanish (Latin America)' },
  { code: 'FR', locale: 'fr', native: 'Français', english: 'French' },
  { code: 'IT', locale: 'it', native: 'Italiano', english: 'Italian' },
  { code: 'HU', locale: 'hu', native: 'Magyar', english: 'Hungarian' },
  { code: 'NL', locale: 'nl', native: 'Nederlands', english: 'Dutch' },
  { code: 'NB', locale: 'nb', native: 'Norsk', english: 'Norwegian' },
  { code: 'PL', locale: 'pl', native: 'Polski', english: 'Polish' },
  { code: 'PT-BR', locale: 'pt-BR', native: 'Português (Brasil)', english: 'Portuguese (Brazil)' },
  { code: 'PT-PT', locale: 'pt-PT', native: 'Português (Portugal)', english: 'Portuguese (Portugal)' },
  { code: 'RO', locale: 'ro', native: 'Română', english: 'Romanian' },
  { code: 'FI', locale: 'fi', native: 'Suomi', english: 'Finnish' },
  { code: 'SV', locale: 'sv', native: 'Svenska', english: 'Swedish' },
  { code: 'TR', locale: 'tr', native: 'Türkçe', english: 'Turkish' },
  { code: 'FIL', locale: 'fil', native: 'Wikang Filipino', english: 'Filipino' },
  { code: 'CS', locale: 'cs', native: 'Čeština', english: 'Czech' },
  { code: 'EL', locale: 'el', native: 'Ελληνικά', english: 'Greek' },
  { code: 'RU', locale: 'ru', native: 'Русский', english: 'Russian' },
  { code: 'HE', locale: 'he', native: 'עברית', english: 'Hebrew', rtl: true },
  { code: 'AR', locale: 'ar', native: 'العربية', english: 'Arabic', rtl: true },
  { code: 'HI', locale: 'hi', native: 'हिन्दी', english: 'Hindi' },
  { code: 'TA', locale: 'ta', native: 'தமிழ்', english: 'Tamil' },
  { code: 'TE', locale: 'te', native: 'తెలుగు', english: 'Telugu' },
  { code: 'TH', locale: 'th', native: 'ไทย', english: 'Thai' },
  { code: 'JA', locale: 'ja', native: '日本語', english: 'Japanese' },
  { code: 'ZH-CN', locale: 'zh-CN', native: '简体中文', english: 'Chinese (Simplified)' },
  { code: 'ZH-TW', locale: 'zh-TW', native: '繁體中文', english: 'Chinese (Traditional)' },
  { code: 'KO', locale: 'ko', native: '한국어', english: 'Korean' },
];

export const DEFAULT_LANGUAGE_CODE = 'EN';

/** Resolves a code to its catalog entry, falling back to English. */
export const findLanguage = (code: string): Language =>
  LANGUAGES.find((lang) => lang.code === code) ?? LANGUAGES.find((lang) => lang.code === DEFAULT_LANGUAGE_CODE)!;


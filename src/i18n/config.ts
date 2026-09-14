export const LOCALES = ["en", "ar", "es", "fr", "de", "pt", "tr", "ja", "ko", "zh"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const RTL_LOCALES: Locale[] = ["ar"];

export function isRtl(locale: string): boolean {
  return RTL_LOCALES.includes(locale as Locale);
}

export const LOCALE_LABELS: Record<Locale, { native: string; english: string }> = {
  en: { native: "English", english: "English" },
  ar: { native: "العربية", english: "Arabic" },
  es: { native: "Español", english: "Spanish" },
  fr: { native: "Français", english: "French" },
  de: { native: "Deutsch", english: "German" },
  pt: { native: "Português", english: "Portuguese" },
  tr: { native: "Türkçe", english: "Turkish" },
  ja: { native: "日本語", english: "Japanese" },
  ko: { native: "한국어", english: "Korean" },
  zh: { native: "中文", english: "Chinese" },
};

export function isValidLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Cookie name used to persist the visitor's chosen locale between visits. */
export const LOCALE_COOKIE = "ZO7AL_LOCALE";

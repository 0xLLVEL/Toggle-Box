'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LANGUAGES, DEFAULT_LANGUAGE_CODE, findLanguage } from '@/data/languages';
import type { Language } from '@/data/languages';

interface LanguageContextType {
  languages: Language[];
  language: Language;
  code: string;
  setLanguage: (code: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'togglebox_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [code, setCode] = useState<string>(DEFAULT_LANGUAGE_CODE);

  // Restore a stored preference, otherwise infer one from the browser locale.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && LANGUAGES.some((lang) => lang.code === stored)) {
        setCode(stored);
        return;
      }

      const browserLocale = navigator.language?.toLowerCase() ?? '';
      if (browserLocale) {
        const exact = LANGUAGES.find((lang) => lang.locale.toLowerCase() === browserLocale);
        const base = browserLocale.split('-')[0];
        const partial = exact ?? LANGUAGES.find((lang) => lang.locale.toLowerCase() === base);
        if (partial) setCode(partial.code);
      }
    } catch {
      // Ignore storage / navigator errors and keep the default.
    }
  }, []);

  // Reflect the active language on <html lang> for assistive tech and crawlers.
  useEffect(() => {
    document.documentElement.lang = findLanguage(code).locale;
  }, [code]);

  const setLanguage = useCallback((next: string) => {
    if (!LANGUAGES.some((lang) => lang.code === next)) return;
    setCode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage errors.
    }
  }, []);

  return (
    <LanguageContext.Provider
      value={{ languages: LANGUAGES, language: findLanguage(code), code, setLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

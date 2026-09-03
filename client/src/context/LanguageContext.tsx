import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, TranslationKey } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getLangCookie = (): Language => {
  if (typeof document === 'undefined') return 'bn';
  const match = document.cookie.match(/(?:^|;\s*)app_lang=([^;]+)/);
  return match?.[1] === 'en' ? 'en' : 'bn';
};

const setLangCookie = (lang: Language) => {
  if (typeof document !== 'undefined') {
    document.cookie = `app_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => getLangCookie());

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setLangCookie(lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === 'bn' ? 'en' : 'bn';
    setLanguage(nextLang);
  };

  const t = (key: TranslationKey): string => {
    return (
      translations[language]?.[key] ||
      translations['en']?.[key] ||
      key
    );
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};


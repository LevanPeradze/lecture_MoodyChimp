import { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from './translations/en.json';
import kaTranslations from './translations/ka.json';
import deTranslations from './translations/de.json';

// Translation files mapping
const translations = {
  en: enTranslations,
  ka: kaTranslations,
  de: deTranslations
};

// Create context
const I18nContext = createContext();

// Custom hook to use i18n context
export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};

// I18n Provider component
export const I18nProvider = ({ children }) => {
  // Load preferences from localStorage or use defaults
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('preferredLanguage');
      return saved || 'en';
    }
    return 'en';
  });

  const [currency, setCurrency] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('preferredCurrency');
      return saved || 'USD';
    }
    return 'USD';
  });

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', language);
      localStorage.setItem('preferredCurrency', currency);
    }
  }, [language, currency]);

  // Translation function
  const t = (key, fallback = null) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        // Fallback to English if translation missing
        if (language !== 'en') {
          value = translations.en;
          for (const k2 of keys) {
            if (value && typeof value === 'object') {
              value = value[k2];
            } else {
              return fallback !== null ? fallback : key;
            }
          }
        } else {
          return fallback !== null ? fallback : key;
        }
      }
    }
    
    return value !== undefined ? value : (fallback !== null ? fallback : key);
  };

  // Get current locale code for date/number formatting
  const getLocale = () => {
    const localeMap = {
      'en': 'en-US',
      'ka': 'ka-GE',
      'de': 'de-DE'
    };
    return localeMap[language] || 'en-US';
  };

  const value = {
    language,
    currency,
    setLanguage,
    setCurrency,
    t,
    locale: getLocale()
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};


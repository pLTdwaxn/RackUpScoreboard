"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getAppDictionary,
  getCurrentLocale,
  setAppLocale,
  type AppDictionary,
  type AppLocale,
} from ".";

type I18nContextValue = {
  copy: AppDictionary;
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function useI18nFallback(): I18nContextValue {
  const [locale, setLocaleState] = useState(getCurrentLocale);

  const setLocale = useCallback((nextLocale: AppLocale) => {
    setAppLocale(nextLocale);
    setLocaleState(nextLocale);
  }, []);

  return useMemo(
    () => ({
      copy: getAppDictionary(locale),
      locale,
      setLocale,
    }),
    [locale, setLocale],
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const value = useI18nFallback();

  useEffect(() => {
    document.documentElement.lang = value.locale;
  }, [value.locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  const fallback = useI18nFallback();
  return context ?? fallback;
}

export function useAppLocale(): AppLocale {
  return useI18n().locale;
}

export function useAppDictionary(): AppDictionary {
  return useI18n().copy;
}

"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { languages, messages, type Locale } from "./messages";
const LanguageContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
}>({ locale: "es", setLocale: () => {} });
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("es");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lumbre-language");
      if (saved && Object.hasOwn(languages, saved)) setLocale(saved as Locale);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const changeLanguage = (next: Locale) => {
    setLocale(next);
    try {
      localStorage.setItem("lumbre-language", next);
    } catch {}
  };
  return (
    <LanguageContext.Provider value={{ locale, setLocale: changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
export function useLanguage() {
  const context = useContext(LanguageContext);
  return { ...context, t: messages[context.locale] };
}
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();
  return (
    <label className="language-switcher">
      <span aria-hidden="true">◎</span>
      <select
        aria-label={t.language}
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
      >
        {Object.entries(languages).map(([code, name]) => (
          <option value={code} key={code}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}

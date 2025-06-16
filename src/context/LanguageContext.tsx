"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type Language = "en" | "ko" | "ja" | "zh";

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
}>({ language: "en", setLanguage: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  // 초기 로드 시 저장된 언어 설정 불러오기
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage && ["en", "ko", "ja", "zh"].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  // 디버깅용 로그 추가
  console.log("Header - current language:", language);
  console.log("Header - setLanguage function:", setLanguage);

  // 언어 변경 시 저장
  const handleSetLanguage = (lang: Language) => {
    console.log("changed lan", lang);
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: handleSetLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);

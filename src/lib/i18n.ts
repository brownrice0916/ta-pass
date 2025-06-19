import en from "@/locales/en.json";
import ko from "@/locales/ko.json";
import ja from "@/locales/ja.json";
import zh from "@/locales/zh.json";

const translations: Record<string, Record<string, string>> = {
  en: en as Record<string, string>,
  ko: ko as Record<string, string>,
  ja: ja as Record<string, string>,
  zh: zh as Record<string, string>,
};

export function t(
  key: string,
  language: string,
  vars?: Record<string, string | number>
): string {
  const langData = translations[language] || translations["ko"];
  let text = langData?.[key] || key;

  if (vars) {
    Object.keys(vars).forEach((varKey) => {
      const regex = new RegExp(`{{\\s*${varKey}\\s*}}`, "g");
      text = text.replace(regex, String(vars[varKey]));
    });
  }

  return text;
}
async function autoTranslate(
  text: string,
  targetLang: string
): Promise<string> {
  // 추후: 실제 API 붙이기
  return `${text} (자동번역됨)`; // 일단 임시
}

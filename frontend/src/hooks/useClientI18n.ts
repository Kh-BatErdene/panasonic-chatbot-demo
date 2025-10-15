"use client";

import { useClientLocale } from "@/components/ClientLocaleProvider";
import { useLanguageStore } from "@/stores/languageStore";

export const useClientI18n = () => {
  const { messages, isLoading, locale } = useClientLocale();
  const {
    currentLanguage,
    setLanguage,
    toggleLanguage,
    isJapanese,
    isEnglish,
  } = useLanguageStore();

  const t = (key: string, params?: Record<string, string | number>): string => {
    if (isLoading) {
      return "...";
    }

    const keys = key.split(".");
    let value: unknown = messages;

    for (const k of keys) {
      if (value && typeof value === "object" && value !== null && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }

    if (typeof value !== "string") {
      return key;
    }

    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return value;
  };

  return {
    t,
    locale,
    currentLanguage,
    setLanguage,
    toggleLanguage,
    isJapanese,
    isEnglish,
    isLoading,
  };
};

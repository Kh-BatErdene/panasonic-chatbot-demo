"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useLanguageStore } from "@/stores/languageStore";
import jaMessages from "../../locales/ja.json";
import enMessages from "../../locales/en.json";

const LocaleContext = createContext<{
  messages: Record<string, unknown>;
  isLoading: boolean;
  locale: string;
}>({
  messages: {},
  isLoading: true,
  locale: "ja",
});

export const useClientLocale = () => useContext(LocaleContext);

export const ClientLocaleProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { currentLanguage } = useLanguageStore();
  const [messages, setMessages] = useState<Record<string, unknown>>(jaMessages);
  const [isLoading] = useState(false);
  const [locale, setLocale] = useState("ja");

  useEffect(() => {
    if (currentLanguage === "en") {
      setMessages(enMessages);
      setLocale("en");
    } else {
      setMessages(jaMessages);
      setLocale("ja");
    }
  }, [currentLanguage]);

  return (
    <LocaleContext.Provider value={{ messages, isLoading, locale }}>
      {children}
    </LocaleContext.Provider>
  );
};

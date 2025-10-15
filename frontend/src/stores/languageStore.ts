import { create } from "zustand";

const getInitialLocale = () => {
  if (typeof window === "undefined") {
    return "ja";
  }
  return localStorage.getItem("lang") || "ja";
};

export const useLanguageStore = create<{
  locale: string;
  setLocale: (locale: string) => void;
  currentLanguage: string;
  setLanguage: (language: string) => void;
  toggleLanguage: () => void;
  isJapanese: boolean;
  isEnglish: boolean;
  isClient: boolean;
}>()((set, get) => ({
  locale: "ja",
  currentLanguage: "ja",
  isClient: false,

  setLocale: (locale) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", locale);
      set({ locale, currentLanguage: locale });
    }
  },

  setLanguage: (language) => {
    get().setLocale(language);
  },

  toggleLanguage: () => {
    const current = get().currentLanguage;
    const newLanguage = current === "ja" ? "en" : "ja";
    get().setLocale(newLanguage);
  },

  get isJapanese() {
    return get().currentLanguage === "ja";
  },

  get isEnglish() {
    return get().currentLanguage === "en";
  },
}));

if (typeof window !== "undefined") {
  const initializeClientState = () => {
    const actualLocale = getInitialLocale();

    useLanguageStore.setState({
      locale: actualLocale,
      currentLanguage: actualLocale,
      isClient: true,
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeClientState);
  } else {
    initializeClientState();
  }
}

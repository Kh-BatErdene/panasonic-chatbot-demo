import { create } from "zustand";

interface LocaleState {
  locale: string;
  setLocale: (locale: string) => void;
}

const defaultLocale =
  typeof window !== "undefined" ? localStorage.getItem("lang") || "en" : "en";

export const useLocaleStore = create<LocaleState>()((set) => ({
  locale: defaultLocale,

  setLocale: (locale) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", locale);
    }
    set({ locale });
  },
}));

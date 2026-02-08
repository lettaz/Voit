import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import de from "./de.json";

const savedLanguage = localStorage.getItem("voit_language") || "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  lng: savedLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already handles XSS
  },
});

export default i18n;

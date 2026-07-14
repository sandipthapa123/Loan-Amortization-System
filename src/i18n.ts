import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "Dashboard": "Dashboard",
      "New Loan": "New Loan",
      "Amortization": "Amortization",
      "Reports": "Reports",
      "Settings": "Settings",
      "Total Principal Disbursed": "Total Principal Disbursed",
      "Total Payments Received": "Total Payments Received",
      "Active Loans": "Active Loans"
    }
  },
  ne: {
    translation: {
      "Dashboard": "ड्यासबोर्ड",
      "New Loan": "नयाँ ऋण",
      "Amortization": "ऋण चुक्ता तालिका",
      "Reports": "रिपोर्टहरू",
      "Settings": "सेटिङ्हरू",
      "Total Principal Disbursed": "कुल ऋण प्रवाह",
      "Total Payments Received": "कुल भुक्तानी प्राप्त",
      "Active Loans": "सक्रिय ऋणहरू"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, 
    }
  });

export default i18n;

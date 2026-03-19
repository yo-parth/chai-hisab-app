/**
 * i18n.tsx — lightweight translation layer for Hindi / Marathi.
 * No external library. Uses React Context for instant re-renders on switch.
 * Language persisted in localForage settings store (same plain store as
 * other settings — never encrypted, available before PIN unlock).
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import localForage from 'localforage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Language = 'hi' | 'mr';

const LANG_KEY = 'settings:language';

// Shared settings store instance (same DB / storeName as db.ts settings).
const langStore = localForage.createInstance({
  name: 'chai-khata',
  storeName: 'settings',
});

// ─── Translations ─────────────────────────────────────────────────────────────

const translations = {
  hi: {
    // App-wide
    appName: 'चाय खाता',
    tagline: 'सरल हिसाब किताब',
    loading: 'लोड हो रहा है...',
    cups: 'कप',

    // Bottom nav
    navHome: 'होम',
    navExport: 'एक्सपोर्ट',
    navSettings: 'सेटिंग्स',

    // Home — stats bar
    todaySold: 'आज बेचे',
    totalOwed: 'कुल बकाया',
    topDebtor: 'सबसे बकाया',
    today: 'आज',
    thisWeek: 'इस हफ्ते',
    now: 'अभी',

    // CustomerList
    noCustomers: 'कोई ग्राहक नहीं',
    noCustomersHint: 'नया ग्राहक जोड़ने के लिए नीचे बटन दबाएं',
    lastVisit: 'आखिरी विज़िट',
    totalCupsLabel: 'कुल कप',
    never: 'कभी नहीं',
    todayDate: 'आज',
    yesterday: 'कल',
    daysAgo: '{days} दिन पहले',

    // AddCustomerDialog
    addNewCustomer: 'नया ग्राहक जोड़ें',
    nameLabel: 'नाम *',
    namePlaceholder: 'ग्राहक का नाम',
    pricePerCupLabel: 'प्रति कप कीमत (₹)',
    whatsappLabel: 'व्हाट्सऐप नंबर (वैकल्पिक)',
    phonePlaceholder: '10 अंकों का नंबर',
    add: 'जोड़ें',
    adding: 'जोड़ रहे हैं...',
    cancel: 'रद्द करें',

    // Validation / toasts — AddCustomer
    pleaseEnterName: 'कृपया नाम दर्ज करें',
    phoneMustBe10: 'फ़ोन नंबर 10 अंकों का होना चाहिए',
    customerAdded: 'ग्राहक जोड़ा गया',
    somethingWrong: 'कुछ गलत हुआ',

    // CustomerDetail
    cupsOwed: '{cups} कप बाकी',
    totalBalance: 'कुल: ₹{amount} ({price}/कप)',
    addChai: 'चाय जोड़ें',
    paymentDone: 'भुगतान किया',
    whatsappReminder: 'WhatsApp रिमाइंडर',
    history: 'इतिहास',
    noTransactions: 'अभी तक कोई लेन-देन नहीं',
    chaiAdded: 'चाय जोड़ी गई',
    paymentRecorded: 'भुगतान दर्ज हुआ',
    undoAction: 'पूर्ववत करें ({seconds}s)',
    undone: 'पूर्ववत हो गया',
    checking: 'जाँच रहे हैं...',
    saleLabel: '+{qty} कप',
    paymentLabel: 'भुगतान: {qty} कप',
    customerNotFound: 'ग्राहक नहीं मिला',
    settlementNote: '{cups} कप का भुगतान',
    whatsappMsg: 'नमस्ते {name}, आपके {cups} कप चाय के ₹{amount} बाकी हैं। कृपया भुगतान करें। 🙏',
    partialPaymentBtn: 'आंशिक भुगतान',
    partialAmountPrompt: '₹ कितना मिला?',
    partialCupsDeducted: '= {cups} कप कटेंगे',
    partialSubmitBtn: 'जमा करें',
    partialPaidNote: '₹{amount} आंशिक भुगतान हुआ',
    partialBadge: 'आंशिक',
    partialHistoryLabel: 'आंशिक भुगतान — ₹{amount}',
    partialHistoryDeducted: '-{cups} कप',

    // Export
    exportTitle: 'एक्सपोर्ट',
    exportSubtitle: 'अपना डेटा CSV में डाउनलोड करें',
    csvFileTitle: 'CSV फाइल',
    csvDescription:
      'सभी ग्राहकों और लेन-देन का विवरण CSV फाइल में डाउनलोड करें। इसे Excel या Google Sheets में खोल सकते हैं।',
    download: 'डाउनलोड करें',
    preparing: 'तैयार हो रहा है...',
    csvContains: 'CSV फाइल में क्या होगा:',
    csvCustomerName: 'ग्राहक का नाम',
    csvCups: 'कप संख्या',
    csvType: 'प्रकार',
    csvNote: 'टिप्पणी',
    csvDate: 'तारीख और समय',
    fileDownloading: 'फाइल डाउनलोड हो रही है',
    exportFailed: 'एक्सपोर्ट नहीं हो सका',
    csvSale: 'बिक्री',
    csvPayment: 'भुगतान',

    // Settings
    settingsTitle: 'सेटिंग्स',
    settingsSubtitle: 'अपनी पसंद के अनुसार सेट करें',
    defaultSettingsSection: 'डिफ़ॉल्ट सेटिंग्स',
    priceHelp: 'नए ग्राहक के लिए यह कीमत इस्तेमाल होगी',
    securitySection: 'सुरक्षा',
    pinSecurity: 'PIN सुरक्षा',
    pinSecurityHelp: 'ऐप खोलते समय PIN मांगें',
    pin4digitsLabel: '4 अंकों का PIN',
    pinWarning: 'याद रखें: यह PIN भूल जाने पर रिकवर नहीं हो सकता',
    saveBtnIdle: 'सेव करें',
    saveBtnBusy: 'सेव हो रहा है...',
    settingsSaved: 'सेटिंग्स सेव हो गईं',
    settingsFailed: 'सेव नहीं हो सका',
    pinMustBe4: 'PIN 4 अंकों का होना चाहिए',
    dataBackupSection: 'डेटा बैकअप',
    backupHint: 'बैकअप आपके PIN से एन्क्रिप्ट होगा।',
    backupNeedsPin: 'बैकअप और पुनर्स्थापना के लिए PIN सुरक्षा सक्रिय होनी चाहिए।',
    takeBackup: 'बैकअप लें',
    preparingBackup: 'तैयार हो रहा है...',
    restoreBackup: 'बैकअप से पुनर्स्थापित करें',
    restoring: 'पुनर्स्थापित हो रहा है...',
    backupSuccess: 'बैकअप सफलतापूर्वक सहेजा गया',
    backupFailed: 'बैकअप विफल हुआ',
    restoreSuccess: 'डेटा सफलतापूर्वक पुनर्स्थापित हुआ',
    restoreFailed: 'पुनर्स्थापना विफल हुई — गलत PIN या दूषित फ़ाइल',
    languageSection: 'भाषा',
    hindiLabel: 'हिन्दी',
    marathiLabel: 'मराठी',
    appVersion: 'चाय खाता v1.0',
    appInfo: 'चाय विक्रेताओं के लिए सरल हिसाब',

    // PIN Lock
    enterPin: 'PIN दर्ज करें',
    pinSecureMsg: 'डेटा सुरक्षित है। देखने के लिए PIN डालें।',
    wrongPin: 'गलत PIN',
    openApp: 'खोलें',
  },

  mr: {
    // App-wide
    appName: 'चहा खाता',
    tagline: 'सरल हिशेब',
    loading: 'लोड होत आहे...',
    cups: 'कप',

    // Bottom nav
    navHome: 'होम',
    navExport: 'निर्यात',
    navSettings: 'सेटिंग्ज',

    // Home — stats bar
    todaySold: 'आज विकले',
    totalOwed: 'एकूण बाकी',
    topDebtor: 'सर्वाधिक बाकी',
    today: 'आज',
    thisWeek: 'या आठवड्यात',
    now: 'आत्ता',

    // CustomerList
    noCustomers: 'कोणताही ग्राहक नाही',
    noCustomersHint: 'नवीन ग्राहक जोडण्यासाठी खालील बटण दाबा',
    lastVisit: 'शेवटची भेट',
    totalCupsLabel: 'एकूण कप',
    never: 'कधीच नाही',
    todayDate: 'आज',
    yesterday: 'काल',
    daysAgo: '{days} दिवसांपूर्वी',

    // AddCustomerDialog
    addNewCustomer: 'नवीन ग्राहक जोडा',
    nameLabel: 'नाव *',
    namePlaceholder: 'ग्राहकाचे नाव',
    pricePerCupLabel: 'प्रति कप किंमत (₹)',
    whatsappLabel: 'व्हॉट्सअॅप नंबर (पर्यायी)',
    phonePlaceholder: '10 अंकी नंबर',
    add: 'जोडा',
    adding: 'जोडत आहे...',
    cancel: 'रद्द करा',

    // Validation / toasts — AddCustomer
    pleaseEnterName: 'कृपया नाव टाका',
    phoneMustBe10: 'फोन नंबर 10 अंकी असावा',
    customerAdded: 'ग्राहक जोडला',
    somethingWrong: 'काहीतरी चुकले',

    // CustomerDetail
    cupsOwed: '{cups} कप बाकी',
    totalBalance: 'एकूण: ₹{amount} ({price}/कप)',
    addChai: 'चहा जोडा',
    paymentDone: 'पेमेंट केले',
    whatsappReminder: 'WhatsApp आठवण',
    history: 'इतिहास',
    noTransactions: 'अद्याप कोणताही व्यवहार नाही',
    chaiAdded: 'चहा जोडला',
    paymentRecorded: 'पेमेंट नोंदवले',
    undoAction: 'पूर्वपद करा ({seconds}s)',
    undone: 'पूर्वपद झाले',
    checking: 'तपासत आहे...',
    saleLabel: '+{qty} कप',
    paymentLabel: 'पेमेंट: {qty} कप',
    customerNotFound: 'ग्राहक सापडला नाही',
    settlementNote: '{cups} कपचे पेमेंट',
    whatsappMsg:
      'नमस्कार {name}, तुमच्या {cups} कप चहाचे ₹{amount} बाकी आहेत। कृपया पेमेंट करा। 🙏',
    partialPaymentBtn: 'आंशिक पेमेंट',
    partialAmountPrompt: '₹ किती मिळाले?',
    partialCupsDeducted: '= {cups} कप वजा होतील',
    partialSubmitBtn: 'जमा करा',
    partialPaidNote: '₹{amount} आंशिक पेमेंट झाले',
    partialBadge: 'आंशिक',
    partialHistoryLabel: 'आंशिक पेमेंट — ₹{amount}',
    partialHistoryDeducted: '-{cups} कप',

    // Export
    exportTitle: 'निर्यात',
    exportSubtitle: 'तुमचा डेटा CSV मध्ये डाउनलोड करा',
    csvFileTitle: 'CSV फाइल',
    csvDescription:
      'सर्व ग्राहक आणि व्यवहारांचा तपशील CSV फाइलमध्ये डाउनलोड करा। Excel किंवा Google Sheets मध्ये उघडता येईल।',
    download: 'डाउनलोड करा',
    preparing: 'तयार होत आहे...',
    csvContains: 'CSV फाइलमध्ये काय असेल:',
    csvCustomerName: 'ग्राहकाचे नाव',
    csvCups: 'कप संख्या',
    csvType: 'प्रकार',
    csvNote: 'नोंद',
    csvDate: 'दिनांक',
    fileDownloading: 'फाइल डाउनलोड होत आहे',
    exportFailed: 'निर्यात अयशस्वी झाली',
    csvSale: 'विक्री',
    csvPayment: 'पेमेंट',

    // Settings
    settingsTitle: 'सेटिंग्ज',
    settingsSubtitle: 'तुमच्या पसंतीनुसार सेट करा',
    defaultSettingsSection: 'डीफॉल्ट सेटिंग्ज',
    priceHelp: 'नवीन ग्राहकासाठी ही किंमत वापरली जाईल',
    securitySection: 'सुरक्षा',
    pinSecurity: 'PIN सुरक्षा',
    pinSecurityHelp: 'अॅप उघडताना PIN विचारा',
    pin4digitsLabel: '4 अंकी PIN',
    pinWarning: 'लक्षात ठेवा: हा PIN विसरल्यास पुनर्प्राप्त करता येणार नाही',
    saveBtnIdle: 'सेव करा',
    saveBtnBusy: 'सेव होत आहे...',
    settingsSaved: 'सेटिंग्ज सेव झाल्या',
    settingsFailed: 'सेव अयशस्वी झाले',
    pinMustBe4: 'PIN 4 अंकी असावा',
    dataBackupSection: 'डेटा बॅकअप',
    backupHint: 'बॅकअप तुमच्या PIN ने एन्क्रिप्ट होईल।',
    backupNeedsPin: 'बॅकअप आणि पुनर्संचयनासाठी PIN सुरक्षा सक्रिय असणे आवश्यक आहे।',
    takeBackup: 'बॅकअप घ्या',
    preparingBackup: 'तयार होत आहे...',
    restoreBackup: 'बॅकअपमधून पुनर्संचयित करा',
    restoring: 'पुनर्संचयित होत आहे...',
    backupSuccess: 'बॅकअप यशस्वीरित्या जतन केला',
    backupFailed: 'बॅकअप अयशस्वी झाला',
    restoreSuccess: 'डेटा यशस्वीरित्या पुनर्संचयित झाला',
    restoreFailed: 'पुनर्संचयन अयशस्वी — चुकीचा PIN किंवा खराब फाइल',
    languageSection: 'भाषा',
    hindiLabel: 'हिंदी',
    marathiLabel: 'मराठी',
    appVersion: 'चहा खाता v1.0',
    appInfo: 'चहा विक्रेत्यांसाठी सरल हिशेब',

    // PIN Lock
    enterPin: 'PIN टाका',
    pinSecureMsg: 'डेटा सुरक्षित आहे। पाहण्यासाठी PIN टाका।',
    wrongPin: 'चुकीचा PIN',
    openApp: 'उघडा',
  },
} as const;

export type TranslationKey = keyof typeof translations.hi;

// ─── Context ──────────────────────────────────────────────────────────────────

interface I18nContextValue {
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
}

const I18nContext = createContext<I18nContextValue>({
  t: (key) => key,
  language: 'hi',
  setLanguage: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('hi');

  useEffect(() => {
    langStore.getItem<Language>(LANG_KEY).then((saved) => {
      if (saved === 'hi' || saved === 'mr') setLanguageState(saved);
    });
  }, []);

  const setLanguage = async (lang: Language) => {
    await langStore.setItem(LANG_KEY, lang);
    setLanguageState(lang);
  };

  const PARAM_RE = new RegExp('\\{(\\w+)\\}', 'g');

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const str: string = (translations[language] as Record<string, string>)[key]
      ?? (translations.hi as Record<string, string>)[key]
      ?? key;
    if (!params) return str;
    return str.replace(PARAM_RE, (_, k: string) => String(params[k] ?? ''));
  };

  return (
    <I18nContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTranslation() {
  return useContext(I18nContext);
}

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "ru" | "en";

export interface Translations {
  // Navigation
  navDashboard: string;
  navDashboardSub: string;
  navMonitoring: string;
  navMonitoringSub: string;
  navAnalytics: string;
  navAnalyticsSub: string;
  navAlerts: string;
  navAlertsSub: string;
  navProfile: string;
  navProfileSub: string;
  navSettings: string;
  navSettingsSub: string;
  navCrew: string;
  navCrewSub: string;
  navMental: string;
  navMentalSub: string;
  navAIAssistant: string;
  navAIAssistantSub: string;
  navProtocols: string;
  navProtocolsSub: string;
  navTimeline: string;
  navTimelineSub: string;
  navEvidence: string;
  navEvidenceSub: string;
  nav3DViewer: string;
  nav3DViewerSub: string;

  // Header / Common
  liveDemo: string;
  inRange: string;
  attention: string;
  critical: string;
  missionDay: string;
  ofDay: string;
  heartRate: string;
  oxygen: string;
  sleep: string;
  activity: string;
  coreTemp: string;
  radiation: string;

  // Auth
  signIn: string;
  signUp: string;
  signOut: string;
  email: string;
  password: string;
  fullName: string;
  callsign: string;
  role: string;
  quickDemoLogin: string;
  dontHaveAccount: string;
  alreadyHaveAccount: string;
  loginSuccess: string;
  registerSuccess: string;

  // Settings
  settingsTitle: string;
  settingsSubtitle: string;
  appearanceTitle: string;
  appearanceSubtitle: string;
  themeLight: string;
  themeLightSub: string;
  themeDark: string;
  themeDarkSub: string;
  languageLabel: string;
  languageSub: string;
  animationsLabel: string;
  animationsSub: string;
  syncTitle: string;
  syncSubtitle: string;
  linkStatus: string;
  busActive: string;
  offlineQueue: string;
  packets: string;
  sampleRate: string;
  syncNow: string;
  syncing: string;
  clearCache: string;
  alertsSectionTitle: string;
  alertsSectionSubtitle: string;
  alertTachycardia: string;
  alertTachycardiaSub: string;
  alertSpo2: string;
  alertSpo2Sub: string;
  alertSleepDeficit: string;
  alertSleepDeficitSub: string;
  alertRadiation: string;
  alertRadiationSub: string;
  settingSaved: string;

  // 3D Viewer
  viewerTitle: string;
  viewerSubtitle: string;
  sensorHolter: string;
  sensorSpo2: string;
  sensorCooling: string;
  sensorPressure: string;
  sensorPlss: string;
  sensorHelmet: string;
  plssStatusTitle: string;
  subsystemDiagnostics: string;
  cameraFocus: string;
  focusFull: string;
  focusChest: string;
  focusPlss: string;
  focusHelmet: string;
  viewMode: string;
  modeStandard: string;
  modeXray: string;
  modeThermal: string;
  calibrateSensors: string;
  emergencyFlush: string;
  coolingLoop: string;
}

const translationsRU: Translations = {
  navDashboard: "Dashboard",
  navDashboardSub: "Обзор",
  navMonitoring: "Monitoring",
  navMonitoringSub: "Мониторинг",
  navAnalytics: "Analytics",
  navAnalyticsSub: "Аналитика",
  navAlerts: "Alerts",
  navAlertsSub: "Оповещения",
  navProfile: "Profile",
  navProfileSub: "Профиль",
  navSettings: "Settings",
  navSettingsSub: "Настройки",
  navCrew: "Crew",
  navCrewSub: "Экипаж",
  navMental: "Mental",
  navMentalSub: "Психология",
  navAIAssistant: "AI Assistant",
  navAIAssistantSub: "ИИ Ассистент",
  navProtocols: "Protocols",
  navProtocolsSub: "Протоколы",
  navTimeline: "Timeline",
  navTimelineSub: "Таймлайн",
  navEvidence: "Evidence",
  navEvidenceSub: "Стандарты NASA",
  nav3DViewer: "3D Viewer",
  nav3DViewerSub: "Скафандр 3D",

  liveDemo: "Live · Демо",
  inRange: "В норме",
  attention: "Внимание",
  critical: "Критично",
  missionDay: "День",
  ofDay: "из",
  heartRate: "Пульс",
  oxygen: "Кислород",
  sleep: "Сон",
  activity: "Активность",
  coreTemp: "Температура тела",
  radiation: "Уровень радиации",

  signIn: "Войти",
  signUp: "Регистрация",
  signOut: "Выйти",
  email: "Электронная почта",
  password: "Пароль",
  fullName: "ФИО / Имя",
  callsign: "Позывной (например NOVA-01)",
  role: "Должность",
  quickDemoLogin: "Быстрый вход для демонстрации",
  dontHaveAccount: "Нет аккаунта? Зарегистрироваться",
  alreadyHaveAccount: "Уже есть аккаунт? Войти",
  loginSuccess: "Успешный вход в систему",
  registerSuccess: "Учётная запись успешно создана",

  settingsTitle: "Настройки платформы",
  settingsSubtitle: "Визуальная тема оформления, локализация, автономная репликация и оповещения",
  appearanceTitle: "Отображение и тема",
  appearanceSubtitle: "Выберите цветовую гамму интерфейса, оптимизированную под условия освещения",
  themeLight: "Apple Light",
  themeLightSub: "Дневной свет",
  themeDark: "Dark Space",
  themeDarkSub: "OLED энергосбережение",
  languageLabel: "Язык интерфейса",
  languageSub: "Локализация интерфейса и медицинской терминологии",
  animationsLabel: "Плавные анимации графиков",
  animationsSub: "Аппаратное ускорение рендеринга 60 FPS",
  syncTitle: "Автономная синхронизация",
  syncSubtitle: "Режим работы без постоянного подключения к наземному центру управления (ЦУП)",
  linkStatus: "Статус связи:",
  busActive: "Бортовая шина активна",
  offlineQueue: "Очередь оффлайн-запросов:",
  packets: "пакетов",
  sampleRate: "Частота опроса биосенсоров:",
  syncNow: "Синхронизировать сейчас",
  syncing: "Синхронизация...",
  clearCache: "Очистить кэш",
  alertsSectionTitle: "Уведомления и алерты биометрии",
  alertsSectionSubtitle: "Автоматические триггеры звукового и визуального оповещения в жилом модуле",
  alertTachycardia: "Превышение ЧСС (Тахикардия)",
  alertTachycardiaSub: "Звуковой сигнал при пульсе свыше порога в покое",
  alertSpo2: "Критическая десатурация SpO₂",
  alertSpo2Sub: "Активация при падении кислорода ниже 94%",
  alertSleepDeficit: "Дефицит фазы глубокого сна",
  alertSleepDeficitSub: "Оповещение врача экипажа при сокращении SWS",
  alertRadiation: "Радиационный шторм (SPE Warning)",
  alertRadiationSub: "Автоматический приказ занять радиационное убежище",
  settingSaved: "Настройка успешно сохранена",

  viewerTitle: "3D EVA Suit & Mission Console",
  viewerSubtitle: "Интерактивная анатомическая телеметрия скафандра и системы жизнеобеспечения PLSS",
  sensorHolter: "Кардиомонитор ECG",
  sensorSpo2: "Пульсоксиметрия SpO₂",
  sensorCooling: "Контур охлаждения LCVG",
  sensorPressure: "Давление скафандра (100% O₂)",
  sensorPlss: "Рюкзак PLSS (Жизнеобеспечение)",
  sensorHelmet: "Шлем & Проекционный дисплей HUD",
  plssStatusTitle: "Диагностика систем скафандра PLSS",
  subsystemDiagnostics: "Аппаратный мониторинг и контуры жизнеобеспечения",
  cameraFocus: "Фокус камеры:",
  focusFull: "Весь скафандр",
  focusChest: "Грудь (ЭКГ)",
  focusPlss: "Рюкзак PLSS",
  focusHelmet: "Шлем / Визор",
  viewMode: "Режим визуализации:",
  modeStandard: "Стандартный",
  modeXray: "Рентген / Сенсоры",
  modeThermal: "Тепловая карта",
  calibrateSensors: "Калибровать датчики",
  emergencyFlush: "Аварийная продувка O₂",
  coolingLoop: "Регулировка охлаждения",
};

const translationsEN: Translations = {
  navDashboard: "Dashboard",
  navDashboardSub: "Overview",
  navMonitoring: "Monitoring",
  navMonitoringSub: "Vitals",
  navAnalytics: "Analytics",
  navAnalyticsSub: "Trends",
  navAlerts: "Alerts",
  navAlertsSub: "Warnings",
  navProfile: "Profile",
  navProfileSub: "Astronaut",
  navSettings: "Settings",
  navSettingsSub: "Preferences",
  navCrew: "Crew",
  navCrewSub: "Astronauts",
  navMental: "Mental",
  navMentalSub: "Wellness",
  navAIAssistant: "AI Assistant",
  navAIAssistantSub: "Flight Surgeon",
  navProtocols: "Protocols",
  navProtocolsSub: "Procedures",
  navTimeline: "Timeline",
  navTimelineSub: "Mission Log",
  navEvidence: "Evidence",
  navEvidenceSub: "NASA STD-3001",
  nav3DViewer: "3D Viewer",
  nav3DViewerSub: "EVA Suit 3D",

  liveDemo: "Live · Demo",
  inRange: "Nominal",
  attention: "Caution",
  critical: "Critical",
  missionDay: "Day",
  ofDay: "of",
  heartRate: "Heart Rate",
  oxygen: "Oxygen",
  sleep: "Sleep",
  activity: "Activity",
  coreTemp: "Core Temp",
  radiation: "Radiation Level",

  signIn: "Sign In",
  signUp: "Register",
  signOut: "Sign Out",
  email: "Email Address",
  password: "Password",
  fullName: "Full Name",
  callsign: "Callsign (e.g. NOVA-01)",
  role: "Mission Role",
  quickDemoLogin: "Quick Demo Login",
  dontHaveAccount: "Don't have an account? Sign Up",
  alreadyHaveAccount: "Already have an account? Sign In",
  loginSuccess: "Signed in successfully",
  registerSuccess: "Account registered successfully",

  settingsTitle: "Platform Settings",
  settingsSubtitle: "Visual theme, language localization, offline sync and biometric threshold alerts",
  appearanceTitle: "Theme & Display",
  appearanceSubtitle: "Select interface color scheme optimized for lighting conditions",
  themeLight: "Apple Light",
  themeLightSub: "Daylight mode",
  themeDark: "Dark Space",
  themeDarkSub: "OLED power saver",
  languageLabel: "Interface Language",
  languageSub: "Localization for UI and clinical medical terminology",
  animationsLabel: "Smooth Chart Animations",
  animationsSub: "Hardware-accelerated 60 FPS rendering",
  syncTitle: "Autonomous Sync",
  syncSubtitle: "Operational mode without permanent link to Mission Control (MCC)",
  linkStatus: "Link Status:",
  busActive: "Onboard telemetry bus active",
  offlineQueue: "Offline Queue:",
  packets: "packets",
  sampleRate: "Sensor Polling Rate:",
  syncNow: "Sync Now",
  syncing: "Syncing...",
  clearCache: "Clear Local Cache",
  alertsSectionTitle: "Biometric Alerts & Triggers",
  alertsSectionSubtitle: "Automatic audio and visual triggers in habitat quarters",
  alertTachycardia: "High Heart Rate (Tachycardia)",
  alertTachycardiaSub: "Audio alarm when resting heart rate exceeds baseline limit",
  alertSpo2: "Critical SpO₂ Desaturation",
  alertSpo2Sub: "Triggered when blood oxygen falls below 94%",
  alertSleepDeficit: "Deep Sleep Deficit",
  alertSleepDeficitSub: "Alert flight surgeon upon slow-wave sleep reduction",
  alertRadiation: "Solar Particle Event (SPE Warning)",
  alertRadiationSub: "Automatic instruction to enter radiation storm shelter",
  settingSaved: "Setting updated successfully",

  viewerTitle: "3D EVA Suit & Mission Console",
  viewerSubtitle: "Interactive anatomical sensor telemetry and Primary Life Support System (PLSS)",
  sensorHolter: "ECG Cardiac Holter",
  sensorSpo2: "SpO₂ & Perfusion Monitor",
  sensorCooling: "LCVG Cooling Loop",
  sensorPressure: "Suit Pressure (100% O₂)",
  sensorPlss: "PLSS Life Support Backpack",
  sensorHelmet: "Helmet & Heads-Up Display (HUD)",
  plssStatusTitle: "PLSS Subsystem Health Diagnostics",
  subsystemDiagnostics: "Hardware telemetry, sublimator loops, and battery reserves",
  cameraFocus: "Camera Focus:",
  focusFull: "Full Suit",
  focusChest: "Chest (ECG)",
  focusPlss: "PLSS Backpack",
  focusHelmet: "Helmet / Visor",
  viewMode: "Visualization Mode:",
  modeStandard: "Standard EVA",
  modeXray: "X-Ray Sensors",
  modeThermal: "Thermal Heatmap",
  calibrateSensors: "Calibrate Sensors",
  emergencyFlush: "Emergency O₂ Flush",
  coolingLoop: "Adjust Cooling Loop",
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("cosmo_lang");
    return saved === "en" ? "en" : "ru";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("cosmo_lang", lang);
  };

  const t = language === "en" ? translationsEN : translationsRU;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

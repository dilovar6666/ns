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

const translationsRU: Translations = translationsEN;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language: Language = "en";
  const setLanguage = (_lang: Language) => {};
  const t = translationsEN;

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

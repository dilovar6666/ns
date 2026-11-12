import React, { useState } from "react";
import {
  Sun,
  Moon,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Globe,
  HardDrive,
  Wifi,
  Activity,
  Heart,
  Droplets,
  MoonStar,
  Radio,
  Sliders,
} from "lucide-react";
import { syncQueue, queueStatus } from "../offline";
import { useLanguage, type Language } from "../context/LanguageContext";

type ThemeMode = "light" | "dark";

type Props = {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
};

export function SettingsView({ theme, onThemeChange }: Props) {
  const { language, setLanguage, t } = useLanguage();

  const [syncing, setSyncing] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");

  // Persisted toggles in localStorage
  const [animations, setAnimations] = useState(() => {
    return localStorage.getItem("cosmo_anim") !== "false";
  });
  const [notifyHr, setNotifyHr] = useState(() => {
    return localStorage.getItem("cosmo_notify_hr") !== "false";
  });
  const [notifySpo2, setNotifySpo2] = useState(() => {
    return localStorage.getItem("cosmo_notify_spo2") !== "false";
  });
  const [notifySleep, setNotifySleep] = useState(() => {
    return localStorage.getItem("cosmo_notify_sleep") !== "false";
  });
  const [notifyRad, setNotifyRad] = useState(() => {
    return localStorage.getItem("cosmo_notify_rad") !== "false";
  });

  const showToast = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 3500);
  };

  const handleToggleAnim = (checked: boolean) => {
    setAnimations(checked);
    localStorage.setItem("cosmo_anim", String(checked));
    showToast(t.settingSaved);
  };

  const handleToggleHr = (checked: boolean) => {
    setNotifyHr(checked);
    localStorage.setItem("cosmo_notify_hr", String(checked));
    showToast(`${t.alertTachycardia}: ${checked ? "ON" : "OFF"}`);
  };

  const handleToggleSpo2 = (checked: boolean) => {
    setNotifySpo2(checked);
    localStorage.setItem("cosmo_notify_spo2", String(checked));
    showToast(`${t.alertSpo2}: ${checked ? "ON" : "OFF"}`);
  };

  const handleToggleSleep = (checked: boolean) => {
    setNotifySleep(checked);
    localStorage.setItem("cosmo_notify_sleep", String(checked));
    showToast(`${t.alertSleepDeficit}: ${checked ? "ON" : "OFF"}`);
  };

  const handleToggleRad = (checked: boolean) => {
    setNotifyRad(checked);
    localStorage.setItem("cosmo_notify_rad", String(checked));
    showToast(`${t.alertRadiation}: ${checked ? "ON" : "OFF"}`);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setStatusMsg("");
    try {
      await syncQueue();
      const status = await queueStatus();
      setOfflineCount(status.pending);
      showToast(language === "ru" ? "Синхронизация с бортовой шиной завершена успешно." : "Telemetry bus synchronization completed successfully.");
    } catch {
      showToast(language === "ru" ? "Автономный режим активен: данные сохранены локально." : "Autonomous mode active: data queued locally.");
    } finally {
      setSyncing(false);
    }
  };

  const handleClearCache = () => {
    localStorage.removeItem("cosmo_cache");
    showToast(language === "ru" ? "Локальный кэш телеметрии успешно очищен." : "Local telemetry cache cleared.");
  };

  return (
    <div className="wrapc">
      {/* Header */}
      <header className="tb">
        <div className="up">
          <p className="eyb">CosmoHealthX Flight Deck</p>
          <h1 className="lt disp">{t.settingsTitle}</h1>
          <p className="sub">{t.settingsSubtitle}</p>
        </div>
      </header>

      {statusMsg && (
        <div className="toast up" style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={16} /> {statusMsg}
        </div>
      )}

      {/* Two Column Grid */}
      <div className="sg2">
        {/* Left Column: Theme & Appearance */}
        <div className="sc up">
          <h2 className="h2" style={{ marginBottom: "8px" }}>
            {t.appearanceTitle}
          </h2>
          <p className="cap" style={{ marginBottom: "16px" }}>
            {t.appearanceSubtitle}
          </p>

          {/* Theme Pickers: ONLY Light and Dark */}
          <div className="theme-pickers" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* Apple Light Mode */}
            <div
              className={`theme-card ${theme === "light" ? "active" : ""}`}
              onClick={() => onThemeChange("light")}
            >
              <div className="theme-preview p-light" />
              <div style={{ fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Sun size={15} style={{ color: "#f59e0b" }} /> {t.themeLight}
              </div>
              <div className="cap" style={{ fontSize: "11px", marginTop: "2px" }}>
                {t.themeLightSub}
              </div>
            </div>

            {/* Dark Space Mode */}
            <div
              className={`theme-card ${theme === "dark" ? "active" : ""}`}
              onClick={() => onThemeChange("dark")}
            >
              <div className="theme-preview p-dark" />
              <div style={{ fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Moon size={15} style={{ color: "#38bdf8" }} /> {t.themeDark}
              </div>
              <div className="cap" style={{ fontSize: "11px", marginTop: "2px" }}>
                {t.themeDarkSub}
              </div>
            </div>
          </div>

          <div style={{ marginTop: "24px" }}>
            {/* Language Selector */}
            <div className="row">
              <div>
                <div className="lb" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Globe size={15} style={{ color: "var(--pr)" }} /> {t.languageLabel}
                </div>
                <div className="sub">{t.languageSub}</div>
              </div>
              <select
                className="inp"
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value as Language);
                  showToast(e.target.value === "ru" ? "Язык переключён на Русский" : "Language switched to English");
                }}
                style={{ fontWeight: 600, minWidth: "140px" }}
              >
                <option value="ru">Русский (RU)</option>
                <option value="en">English (US)</option>
              </select>
            </div>

            {/* Chart Animations Toggle */}
            <div className="row">
              <div>
                <div className="lb" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Sliders size={15} style={{ color: "var(--pr)" }} /> {t.animationsLabel}
                </div>
                <div className="sub">{t.animationsSub}</div>
              </div>
              <label className="sw">
                <input
                  type="checkbox"
                  checked={animations}
                  onChange={(e) => handleToggleAnim(e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Offline Sync & Telemetry Storage */}
        <div className="sc up">
          <h2 className="h2" style={{ marginBottom: "8px" }}>
            {t.syncTitle}
          </h2>
          <p className="cap" style={{ marginBottom: "16px" }}>
            {t.syncSubtitle}
          </p>

          <div className="kv">
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Wifi size={16} /> {t.linkStatus}
            </span>
            <span className="st ok">
              <i></i>{t.busActive}
            </span>
          </div>

          <div className="kv">
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <HardDrive size={16} /> {t.offlineQueue}
            </span>
            <span className="num" style={{ fontWeight: 600 }}>
              {offlineCount} {t.packets}
            </span>
          </div>

          <div className="kv">
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <RefreshCw size={16} /> {t.sampleRate}
            </span>
            <span className="num" style={{ fontWeight: 600 }}>
              1.0 Hz (1000 ms)
            </span>
          </div>

          <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              className="btn-primary"
              onClick={handleSyncNow}
              disabled={syncing}
              style={{ flex: 1, minWidth: "160px" }}
            >
              <RefreshCw size={16} className={syncing ? "spin" : ""} />{" "}
              {syncing ? t.syncing : t.syncNow}
            </button>
            <button
              className="btn-secondary"
              onClick={handleClearCache}
              style={{ flex: 1, minWidth: "140px" }}
            >
              <Trash2 size={16} /> {t.clearCache}
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="sc up" style={{ gridColumn: "1 / -1", marginTop: "10px" }}>
          <h2 className="h2" style={{ marginBottom: "8px" }}>
            {t.alertsSectionTitle}
          </h2>
          <p className="cap" style={{ marginBottom: "16px" }}>
            {t.alertsSectionSubtitle}
          </p>

          <div className="pref">
            <div>
              <div className="row">
                <div>
                  <div className="lb" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Heart size={15} style={{ color: "var(--hr)" }} /> {t.alertTachycardia}
                  </div>
                  <div className="sub">{t.alertTachycardiaSub}</div>
                </div>
                <label className="sw">
                  <input
                    type="checkbox"
                    checked={notifyHr}
                    onChange={(e) => handleToggleHr(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>

              <div className="row">
                <div>
                  <div className="lb" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Droplets size={15} style={{ color: "var(--o2)" }} /> {t.alertSpo2}
                  </div>
                  <div className="sub">{t.alertSpo2Sub}</div>
                </div>
                <label className="sw">
                  <input
                    type="checkbox"
                    checked={notifySpo2}
                    onChange={(e) => handleToggleSpo2(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>

            <div>
              <div className="row">
                <div>
                  <div className="lb" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <MoonStar size={15} style={{ color: "var(--sl)" }} /> {t.alertSleepDeficit}
                  </div>
                  <div className="sub">{t.alertSleepDeficitSub}</div>
                </div>
                <label className="sw">
                  <input
                    type="checkbox"
                    checked={notifySleep}
                    onChange={(e) => handleToggleSleep(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>

              <div className="row">
                <div>
                  <div className="lb" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Radio size={15} style={{ color: "var(--cr)" }} /> {t.alertRadiation}
                  </div>
                  <div className="sub">{t.alertRadiationSub}</div>
                </div>
                <label className="sw">
                  <input
                    type="checkbox"
                    checked={notifyRad}
                    onChange={(e) => handleToggleRad(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

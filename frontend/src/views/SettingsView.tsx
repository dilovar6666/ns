import React, { useState } from "react";
import {
  Settings,
  Sun,
  Moon,
  Compass,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Globe,
  Bell,
  HardDrive,
  Wifi,
} from "lucide-react";
import { syncQueue, queueStatus } from "../offline";

type ThemeMode = "light" | "dark" | "navy";

type Props = {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
};

export function SettingsView({ theme, onThemeChange }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [notifyHr, setNotifyHr] = useState(true);
  const [notifySpo2, setNotifySpo2] = useState(true);
  const [notifySleep, setNotifySleep] = useState(true);
  const [lang, setLang] = useState<"ru" | "en">("ru");

  const handleSyncNow = async () => {
    setSyncing(true);
    setStatusMsg("");
    try {
      await syncQueue();
      const status = await queueStatus();
      setOfflineCount(status.pending);
      setStatusMsg("Синхронизация с бортовым сервером завершена успешно.");
    } catch (e) {
      setStatusMsg("Ошибка синхронизации: автономный режим.");
    } finally {
      setSyncing(false);
      setTimeout(() => setStatusMsg(""), 3500);
    }
  };

  const handleClearCache = () => {
    localStorage.removeItem("cosmo_cache");
    setStatusMsg("Локальный кэш телеметрии очищен.");
    setTimeout(() => setStatusMsg(""), 3500);
  };

  return (
    <div className="wrapc">
      {/* Header */}
      <header className="tb">
        <div className="up">
          <p className="eyb">Конфигурация бортовой платформы</p>
          <h1 className="lt disp">Settings</h1>
          <p className="sub">
            Визуальная тема оформления, автономная репликация и параметры оповещений
          </p>
        </div>
      </header>

      {statusMsg && (
        <div className="toast up" style={{ marginTop: "16px" }}>
          <CheckCircle2 className="ico sm" /> {statusMsg}
        </div>
      )}

      {/* Two Column Grid */}
      <div className="sg2">
        {/* Left Column: Theme & Appearance */}
        <div className="sc up">
          <h2 className="h2" style={{ marginBottom: "8px" }}>
            Отображение и тема
          </h2>
          <p className="cap" style={{ marginBottom: "16px" }}>
            Выберите цветовую гамму интерфейса, оптимизированную под условия освещения
          </p>

          <div className="theme-pickers">
            {/* Light Mode */}
            <div
              className={`theme-card ${theme === "light" ? "active" : ""}`}
              onClick={() => onThemeChange("light")}
            >
              <div className="theme-preview p-light" />
              <div style={{ fontWeight: 600, fontSize: "14px" }}>Apple Light</div>
              <div className="cap" style={{ fontSize: "11px", marginTop: "2px" }}>
                Дневной свет
              </div>
            </div>

            {/* Dark Space Mode */}
            <div
              className={`theme-card ${theme === "dark" ? "active" : ""}`}
              onClick={() => onThemeChange("dark")}
            >
              <div className="theme-preview p-dark" />
              <div style={{ fontWeight: 600, fontSize: "14px" }}>Dark Space</div>
              <div className="cap" style={{ fontSize: "11px", marginTop: "2px" }}>
                OLED Энергосбережение
              </div>
            </div>

            {/* Deep Navy Mode */}
            <div
              className={`theme-card ${theme === "navy" ? "active" : ""}`}
              onClick={() => onThemeChange("navy")}
            >
              <div className="theme-preview p-navy" />
              <div style={{ fontWeight: 600, fontSize: "14px" }}>Deep Navy</div>
              <div className="cap" style={{ fontSize: "11px", marginTop: "2px" }}>
                Космический синий
              </div>
            </div>
          </div>

          <div style={{ marginTop: "24px" }}>
            <div className="row">
              <div>
                <div className="lb">Язык интерфейса</div>
                <div className="sub">Локализация медицинской терминологии</div>
              </div>
              <select
                className="inp"
                value={lang}
                onChange={(e) => setLang(e.target.value as "ru" | "en")}
                style={{ fontWeight: 600 }}
              >
                <option value="ru">Русский (RU)</option>
                <option value="en">English (US)</option>
              </select>
            </div>

            <div className="row">
              <div>
                <div className="lb">Плавные анимации графиков</div>
                <div className="sub">Аппаратное ускорение рендеринга 60 FPS</div>
              </div>
              <label className="sw">
                <input type="checkbox" defaultChecked />
                <span className="slider" />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Offline Sync & Telemetry Storage */}
        <div className="sc up">
          <h2 className="h2" style={{ marginBottom: "8px" }}>
            Автономная синхронизация
          </h2>
          <p className="cap" style={{ marginBottom: "16px" }}>
            Режим работы без постоянного подключения к наземному центру управления (ЦУП)
          </p>

          <div className="kv">
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Wifi className="ico sm" /> Статус связи:
            </span>
            <span className="st ok">
              <i></i>Бортовая шина активна
            </span>
          </div>

          <div className="kv">
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <HardDrive className="ico sm" /> Очередь оффлайн-запросов:
            </span>
            <span className="num" style={{ fontWeight: 600 }}>
              {offlineCount} пакетов
            </span>
          </div>

          <div className="kv">
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <RefreshCw className="ico sm" /> Частота опроса биосенсоров:
            </span>
            <span className="num" style={{ fontWeight: 600 }}>
              1.0 Гц (1000 мс)
            </span>
          </div>

          <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              className="btn-primary"
              onClick={handleSyncNow}
              disabled={syncing}
              style={{ flex: 1, minWidth: "160px" }}
            >
              <RefreshCw className={`ico sm ${syncing ? "spin" : ""}`} />{" "}
              {syncing ? "Синхронизация..." : "Синхронизировать сейчас"}
            </button>
            <button
              className="btn-secondary"
              onClick={handleClearCache}
              style={{ flex: 1, minWidth: "140px" }}
            >
              <Trash2 className="ico sm" /> Очистить кэш
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="sc up" style={{ gridColumn: "1 / -1", marginTop: "10px" }}>
          <h2 className="h2" style={{ marginBottom: "8px" }}>
            Уведомления и алерты биометрии
          </h2>
          <p className="cap" style={{ marginBottom: "16px" }}>
            Автоматические триггеры звукового и визуального оповещения в жилом модуле
          </p>

          <div className="pref">
            <div>
              <div className="row">
                <div>
                  <div className="lb">Превышение ЧСС (Тахикардия)</div>
                  <div className="sub">Звуковой сигнал при пульсе свыше порога в покое</div>
                </div>
                <label className="sw">
                  <input
                    type="checkbox"
                    checked={notifyHr}
                    onChange={(e) => setNotifyHr(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>

              <div className="row">
                <div>
                  <div className="lb">Критическая десатурация SpO₂</div>
                  <div className="sub">Активация при падении кислорода ниже 94%</div>
                </div>
                <label className="sw">
                  <input
                    type="checkbox"
                    checked={notifySpo2}
                    onChange={(e) => setNotifySpo2(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>

            <div>
              <div className="row">
                <div>
                  <div className="lb">Дефицит фазы глубокого сна</div>
                  <div className="sub">Оповещение врача экипажа при сокращении SWS</div>
                </div>
                <label className="sw">
                  <input
                    type="checkbox"
                    checked={notifySleep}
                    onChange={(e) => setNotifySleep(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>

              <div className="row">
                <div>
                  <div className="lb">Радиационный шторм (SPE Warning)</div>
                  <div className="sub">Автоматический приказ занять радиационное убежище</div>
                </div>
                <label className="sw">
                  <input type="checkbox" defaultChecked />
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

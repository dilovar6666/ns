import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import {
  Download,
  Share,
  CheckCircle2,
  X,
  ExternalLink,
  Smartphone,
  Laptop,
  Sparkles,
} from "lucide-react";

export function AppFooter() {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Generate real live QR Code matching current URL / origin
  useEffect(() => {
    const currentUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:5173";

    QRCode.toDataURL(currentUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: "#080f25",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code generation error:", err));

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if already in standalone mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    // Listen for PWA beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  };

  return (
    <footer className="sihat-footer">
      <div className="sihat-footer-inner">
        {/* Main 4-Column Grid */}
        <div className="sihat-footer-grid">
          {/* Column 1: Brand & Overview */}
          <div className="sihat-col-brand">
            <div className="sihat-brand-header">
              <img
                src="/icons/icon-192.png"
                alt="CosmoHealthX"
                className="sihat-brand-logo"
              />
              <span className="sihat-brand-title">COSMOHEALTHX</span>
            </div>
            <p className="sihat-brand-desc">
              CosmoHealthX — автономная телемедицинская платформа космической биометрии и клинического мониторинга экипажа в условиях микрогравитации. Стандарты NASA STD-3001, GeneLab омика, AI-ассистент на базе Google Gemini. Научный подход, открытая архитектура, без рекламы.
            </p>
            <div className="sihat-brand-badges">
              <span className="sihat-badge">NASA STD-3001</span>
              <span className="sihat-badge">Ku-Band Real-Time</span>
              <span className="sihat-badge">Gemini 3.5 AI</span>
            </div>
          </div>

          {/* Column 2: Возможности */}
          <div className="sihat-col-links">
            <h4 className="sihat-col-title">ВОЗМОЖНОСТИ</h4>
            <ul className="sihat-links-list">
              <li>
                <Link to="/monitoring">Телеметрия биосенсоров</Link>
              </li>
              <li>
                <Link to="/3d">3D-скафандр и PLSS</Link>
              </li>
              <li>
                <Link to="/ai">ИИ-ассистент врача</Link>
              </li>
              <li>
                <Link to="/analytics">Аналитика и тренды NASA</Link>
              </li>
              <li>
                <Link to="/mental">Ментальное здоровье (BHP)</Link>
              </li>
              <li>
                <Link to="/protocols">Медицинские протоколы</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Информация */}
          <div className="sihat-col-links">
            <h4 className="sihat-col-title">ИНФОРМАЦИЯ</h4>
            <ul className="sihat-links-list">
              <li>
                <Link to="/evidence">О миссии CHX-01</Link>
              </li>
              <li>
                <Link to="/timeline">Хронология полета & MET</Link>
              </li>
              <li>
                <Link to="/crew">Экипаж экспедиции</Link>
              </li>
              <li>
                <Link to="/alerts">Журнал инцидентов</Link>
              </li>
              <li>
                <Link to="/settings">Параметры и протоколы</Link>
              </li>
              <li>
                <span className="sihat-link-muted">Конфиденциальность</span>
              </li>
              <li>
                <span className="sihat-link-muted">Пользовательское соглашение</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Приложение & QR Code (как на Сихат) */}
          <div className="sihat-col-app">
            <h4 className="sihat-col-title">ПРИЛОЖЕНИЕ</h4>

            {/* Desktop QR code box */}
            <div className="sihat-qr-box">
              {qrDataUrl ? (
                <div className="sihat-qr-img-wrap">
                  <img
                    src={qrDataUrl}
                    alt="Сканировать QR-код"
                    className="sihat-qr-img"
                  />
                </div>
              ) : (
                <div className="sihat-qr-skeleton" />
              )}
              <div className="sihat-qr-caption">
                Наведите камеру смартфона на код для быстрого перехода:
              </div>
            </div>

            {/* PWA App Tile */}
            <div className="sihat-pwa-tile">
              <img
                src="/icons/icon-192.png"
                alt="App Icon"
                className="sihat-pwa-icon"
              />
              <div className="sihat-pwa-info">
                <span className="sihat-pwa-label">PWA WEB APP</span>
                <span className="sihat-pwa-desc">Быстрый запуск и работа офлайн</span>
              </div>
            </div>

            {/* Golden Action Button */}
            <button
              onClick={handleInstallClick}
              className="sihat-install-btn"
              type="button"
            >
              {isInstalled ? (
                <>
                  <CheckCircle2 size={18} />
                  <span>Уже установлено</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Установить как приложение</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Copyright Sub-Footer */}
        <div className="sihat-subfooter">
          <div className="sihat-copyright">
            © 2026 COSMOHEALTHX · NASA Space Apps Challenge
          </div>
          <div className="sihat-subtext">
            Открытая автономная платформа космической телемедицины. Без рекламы.
          </div>
        </div>
      </div>

      {/* PWA Install Modal Guide */}
      {showInstallModal && (
        <div className="sihat-modal-backdrop" onClick={() => setShowInstallModal(false)}>
          <div
            className="sihat-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sihat-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Sparkles size={20} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#fff" }}>
                  Установка CosmoHealthX PWA
                </h3>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="sihat-modal-close"
                aria-label="Закрыть"
              >
                <X size={18} />
              </button>
            </div>

            <div className="sihat-modal-body">
              {isIOS ? (
                <div>
                  <div className="sihat-guide-step">
                    <span className="sihat-step-num">1</span>
                    <span>
                      В браузере Safari нажмите на кнопку <strong>«Поделиться»</strong>{" "}
                      <Share size={15} style={{ display: "inline", verticalAlign: "middle" }} /> внизу экрана.
                    </span>
                  </div>
                  <div className="sihat-guide-step">
                    <span className="sihat-step-num">2</span>
                    <span>
                      Прокрутите меню вниз и выберите пункт <strong>«На экран «Домой»»</strong> (Add to Home Screen).
                    </span>
                  </div>
                  <div className="sihat-guide-step">
                    <span className="sihat-step-num">3</span>
                    <span>
                      Нажмите <strong>«Добавить»</strong> в правом верхнем углу.
                    </span>
                  </div>
                  <div className="sihat-guide-tip">
                    Иконка CosmoHealthX появится на рабочем столе вашего iPhone/iPad с полноэкранным запуском без рамок браузера.
                  </div>
                </div>
              ) : (
                <div>
                  <div className="sihat-guide-step">
                    <Laptop size={18} style={{ color: "var(--cy)", flexShrink: 0 }} />
                    <span>
                      <strong>На ПК (Chrome / Edge / Яндекс):</strong> нажмите на значок установки приложения{" "}
                      <Download size={14} style={{ display: "inline" }} /> справа в адресной строке браузера.
                    </span>
                  </div>
                  <div className="sihat-guide-step" style={{ marginTop: "12px" }}>
                    <Smartphone size={18} style={{ color: "var(--ac)", flexShrink: 0 }} />
                    <span>
                      <strong>На Android:</strong> нажмите меню браузера (три точки) и выберите <strong>«Установить приложение»</strong> или <strong>«Добавить на главный экран»</strong>.
                    </span>
                  </div>
                  <div className="sihat-guide-tip" style={{ marginTop: "14px" }}>
                    Приложение работает в автономном режиме даже при потере связи с ЦУП или интернета.
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="sihat-modal-ok-btn"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
export default AppFooter;

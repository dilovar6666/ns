import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import { Download, CheckCircle2 } from "lucide-react";

export function AppFooter() {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

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
    // 1. If native PWA browser prompt is available, trigger it immediately
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult?.outcome === "accepted") {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn("PWA prompt error:", err);
      }
    }

    // 2. Immediately download the application launcher package directly
    try {
      const a = document.createElement("a");
      a.href = "/downloads/CosmoHealthX-App.html";
      a.download = "CosmoHealthX-App.html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setIsInstalled(true);
    } catch (err) {
      console.error("Direct download error:", err);
    }
  };

  return (
    <footer className="sihat-footer">
      <div className="sihat-footer-inner">
        {/* Main Grid: 4 columns on desktop, structured dashboard cards on mobile */}
        <div className="sihat-footer-grid">
          {/* Column 1: Brand & Space Mission Card */}
          <div className="sihat-col-brand">
            <div className="sihat-brand-header">
              <img
                src="/icons/icon-192.png"
                alt="CosmoHealthX"
                className="sihat-brand-logo"
              />
              <div className="sihat-brand-meta">
                <span className="sihat-brand-title">COSMOHEALTHX</span>
                <span className="sihat-brand-telemetry">
                  <span className="sihat-live-dot" /> ACTIVE MISSION CHX-01
                </span>
              </div>
            </div>
            <p className="sihat-brand-desc">
              CosmoHealthX — Autonomous space telemedicine and clinical biometric monitoring platform for crewed missions in microgravity. Built to NASA STD-3001, GeneLab omics standards, and powered by Gemini AI. Evidence-based, open architecture, ad-free.
            </p>
            <div className="sihat-brand-badges">
              <span className="sihat-badge">NASA STD-3001</span>
              <span className="sihat-badge">Ku-Band 120ms</span>
              <span className="sihat-badge">Gemini 3.5 AI</span>
            </div>
          </div>

          {/* Grouped Links: 2 side-by-side columns on mobile, direct grid children on desktop */}
          <div className="sihat-links-group">
            {/* Column 2: Capabilities */}
            <div className="sihat-col-links">
              <h4 className="sihat-col-title">
                <span className="sihat-title-dot" /> CAPABILITIES
              </h4>
              <ul className="sihat-links-list">
                <li>
                  <Link to="/monitoring">
                    <span className="sihat-link-bullet">›</span> Biosensor Telemetry
                  </Link>
                </li>
                <li>
                  <Link to="/3d">
                    <span className="sihat-link-bullet">›</span> 3D EVA Suit & PLSS
                  </Link>
                </li>
                <li>
                  <Link to="/ai">
                    <span className="sihat-link-bullet">›</span> AI Clinical Assistant
                  </Link>
                </li>
                <li>
                  <Link to="/analytics">
                    <span className="sihat-link-bullet">›</span> NASA Analytics & Trends
                  </Link>
                </li>
                <li>
                  <Link to="/mental">
                    <span className="sihat-link-bullet">›</span> Behavioral Health (BHP)
                  </Link>
                </li>
                <li>
                  <Link to="/protocols">
                    <span className="sihat-link-bullet">›</span> Medical Protocols (SOP)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Information & Intel */}
            <div className="sihat-col-links">
              <h4 className="sihat-col-title">
                <span className="sihat-title-dot" /> MISSION INTEL
              </h4>
              <ul className="sihat-links-list">
                <li>
                  <Link to="/evidence">
                    <span className="sihat-link-bullet">›</span> About Mission CHX-01
                  </Link>
                </li>
                <li>
                  <Link to="/timeline">
                    <span className="sihat-link-bullet">›</span> Flight Timeline & MET
                  </Link>
                </li>
                <li>
                  <Link to="/crew">
                    <span className="sihat-link-bullet">›</span> Expedition Crew
                  </Link>
                </li>
                <li>
                  <Link to="/alerts">
                    <span className="sihat-link-bullet">›</span> Incident & Alerts
                  </Link>
                </li>
                <li>
                  <Link to="/settings">
                    <span className="sihat-link-bullet">›</span> Parameters & Config
                  </Link>
                </li>
                <li>
                  <span className="sihat-link-muted">Privacy Protocol</span>
                </li>
                <li>
                  <span className="sihat-link-muted">Terms of Service</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 4: App & QR Code */}
          <div className="sihat-col-app">
            <h4 className="sihat-col-title sihat-desktop-app-title">
              <span className="sihat-title-dot" /> APPLICATION
            </h4>

            {/* Desktop QR code box */}
            <div className="sihat-qr-box">
              {qrDataUrl ? (
                <div className="sihat-qr-img-wrap">
                  <img
                    src={qrDataUrl}
                    alt="Scan QR code"
                    className="sihat-qr-img"
                  />
                </div>
              ) : (
                <div className="sihat-qr-skeleton" />
              )}
              <div className="sihat-qr-caption">
                Scan with smartphone camera or install directly on this device:
              </div>
            </div>

            {/* Mobile PWA Card (high-tech aerospace container) */}
            <div className="sihat-mobile-pwa-card">
              <div className="sihat-pwa-tile">
                <img
                  src="/icons/icon-192.png"
                  alt="App Icon"
                  className="sihat-pwa-icon"
                />
                <div className="sihat-pwa-info">
                  <div className="sihat-pwa-topline">
                    <span className="sihat-pwa-label">PWA FLIGHT CLIENT</span>
                    <span className="sihat-pwa-badge">v2.4 READY</span>
                  </div>
                  <span className="sihat-pwa-desc">Instant launch · Offline telemetry cache</span>
                </div>
              </div>
              <button
                onClick={handleInstallClick}
                className={`sihat-install-btn ${isInstalled ? "is-installed" : ""}`}
                type="button"
              >
                {isInstalled ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Installed as Standalone App</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Install as Flight App</span>
                  </>
                )}
              </button>
              <div className="sihat-pwa-perks">
                <span>⚡ 120ms Ku-Band</span>
                <span>•</span>
                <span>NASA STD-3001</span>
                <span>•</span>
                <span>Standalone Ready</span>
              </div>
            </div>

            {/* Desktop Install Button */}
            <button
              onClick={handleInstallClick}
              className={`sihat-install-btn sihat-desktop-install-btn ${isInstalled ? "is-installed" : ""}`}
              type="button"
            >
              {isInstalled ? (
                <>
                  <CheckCircle2 size={18} />
                  <span>Installed as App</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Install as App</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Copyright & Telemetry Sub-Footer */}
        <div className="sihat-subfooter">
          <div className="sihat-flight-status-line">
            <span className="sihat-status-chip">MISSION CHX-01</span>
            <span className="sihat-status-chip">DAY 42 / 180</span>
            <span className="sihat-status-chip">ORBIT 408.4 KM</span>
            <span className="sihat-status-chip">KU-BAND NOMINAL</span>
          </div>
          <div className="sihat-subfooter-row">
            <div className="sihat-copyright">
              © 2026 COSMOHEALTHX · NASA Space Apps Challenge
            </div>
            <div className="sihat-subtext">
              Autonomous Space Telemedicine Platform · Evidence-based, Open Architecture & Ad-free
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

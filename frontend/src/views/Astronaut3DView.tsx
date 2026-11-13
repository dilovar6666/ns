import React, { Suspense, useState, useRef } from "react";
import AstronautScene from "../AstronautScene";
import {
  Heart,
  Droplets,
  Thermometer,
  Shield,
  Activity,
  Zap,
  Wind,
  BatteryCharging,
  Gauge,
  Crosshair,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  Layers,
  Flame,
} from "lucide-react";
import type { Astronaut, Metric } from "../api";
import { latest } from "../api";
import { useLanguage } from "../context/LanguageContext";

type Props = {
  astronaut?: Astronaut;
  metrics: Metric[];
};

type SensorZone = "chest" | "helmet" | "wrist" | "plss" | "lcvg" | "full";

export function Astronaut3DView({ astronaut, metrics }: Props) {
  const { t } = useLanguage();
  const latestList = latest(metrics);
  const hr = latestList.find((m) => m.key === "heart_rate")?.value ?? 72;
  const spo2 = latestList.find((m) => m.key === "spo2")?.value ?? 98;

  const [activeZone, setActiveZone] = useState<SensorZone>("full");
  const [viewMode, setViewMode] = useState<"standard" | "xray" | "thermal">("standard");
  const [coolingLevel, setCoolingLevel] = useState<"min" | "opt" | "max">("opt");
  const [calibrating, setCalibrating] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleCalibrate = () => {
    setCalibrating(true);
    setTimeout(() => {
      setCalibrating(false);
      triggerToast("All 5 PLSS biosensors calibrated nominal. Drift < 0.2%");
    }, 1800);
  };

  const handleCoolingChange = (lvl: "min" | "opt" | "max") => {
    setCoolingLevel(lvl);
    triggerToast(`LCVG Cooling Loop set to: ${lvl.toUpperCase()}`);
  };

  return (
    <div className="wrapc">
      {/* Header */}
      <header className="tb">
        <div className="up">
          <p className="eyb">NASA EMU / xEMU Biometric Diagnostics & Telemetry</p>
          <h1 className="lt disp">{t.viewerTitle}</h1>
          <p className="sub">{t.viewerSubtitle}</p>
        </div>
      </header>

      {toastMsg && (
        <div className="toast up" style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle size={16} /> {toastMsg}
        </div>
      )}

      {/* Main Grid: 3D Scene (left) + Telemetry Command Inspector (right) */}
      <div className="scene-3d-split">
        {/* Left: 3D Viewport with Sci-Fi Controls */}
        <div
          className="sc up"
          style={{
            position: "relative",
            padding: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            background: "radial-gradient(ellipse at center, rgba(14, 28, 48, 0.7) 0%, rgba(5, 10, 18, 0.98) 100%)",
            border: "1px solid var(--sep, rgba(255, 255, 255, 0.12))",
            borderRadius: "20px",
          }}
        >
          {/* Top Floating Controls Bar */}
          <div
            className="scene-3d-top-bar"
            style={{
              position: "absolute",
              top: "14px",
              left: "14px",
              right: "14px",
              zIndex: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              pointerEvents: "none",
            }}
          >
            {/* View Mode Pills */}
            <div
              className="scene-3d-mode-pills"
              style={{
                display: "inline-flex",
                background: "rgba(0, 0, 0, 0.75)",
                backdropFilter: "blur(10px)",
                padding: "4px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                pointerEvents: "auto",
                gap: "4px",
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode("standard")}
                style={{
                  background: viewMode === "standard" ? "var(--pr, #22d3ee)" : "transparent",
                  color: viewMode === "standard" ? "#fff" : "#94a3b8",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {t.modeStandard}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("xray")}
                style={{
                  background: viewMode === "xray" ? "#00e5ff" : "transparent",
                  color: viewMode === "xray" ? "#000" : "#94a3b8",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {t.modeXray}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("thermal")}
                style={{
                  background: viewMode === "thermal" ? "#f97316" : "transparent",
                  color: viewMode === "thermal" ? "#fff" : "#94a3b8",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {t.modeThermal}
              </button>
            </div>

            {/* Astronaut Tag */}
            <div
              className="scene-3d-astro-tag"
              style={{
                background: "rgba(0, 0, 0, 0.75)",
                backdropFilter: "blur(10px)",
                padding: "6px 14px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                fontSize: "11px",
                color: "#22d3ee",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                pointerEvents: "auto",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
              {astronaut?.name || "Alex Nova"} (EVA #1 · Active)
            </div>
          </div>

          {/* 3D Canvas Mount with Explicit Pixel Height */}
          <div
            className="scene-3d-canvas-box"
            style={{
              width: "100%",
              height: "480px",
              minHeight: "440px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Suspense
              fallback={
                <div
                  style={{
                    display: "grid",
                    placeItems: "center",
                    height: "100%",
                    color: "var(--t2)",
                    fontSize: "13px",
                  }}
                >
                  <RefreshCw className="spin" size={24} style={{ marginBottom: "8px", color: "var(--pr)" }} />
                  Loading 3D space suit model and sensor clusters...
                </div>
              }
            >
              <AstronautScene
                viewMode={viewMode}
                activeZone={activeZone}
                onSelectZone={setActiveZone}
                interactive={true}
              />
            </Suspense>
          </div>

          {/* Interactive Sensor Target Hotspots Strip (Bottom of 3D Canvas) */}
          <div
            className="scene-3d-hotspots-bar"
            style={{
              padding: "12px 14px",
              background: "rgba(0, 0, 0, 0.65)",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--t3)", textTransform: "uppercase" }}>
              {t.cameraFocus}
            </span>

            <button
              type="button"
              onClick={() => setActiveZone("full")}
              style={{
                background: activeZone === "full" ? "rgba(34, 211, 238, 0.25)" : "rgba(255, 255, 255, 0.05)",
                border: `1px solid ${activeZone === "full" ? "#22d3ee" : "rgba(255, 255, 255, 0.1)"}`,
                color: activeZone === "full" ? "#22d3ee" : "var(--t1)",
                borderRadius: "8px",
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
              }}
            >
              <Crosshair size={13} /> {t.focusFull || "Full Perspective"}
            </button>

            <button
              type="button"
              onClick={() => setActiveZone("chest")}
              style={{
                background: activeZone === "chest" ? "rgba(255, 45, 85, 0.2)" : "rgba(255, 255, 255, 0.05)",
                border: `1px solid ${activeZone === "chest" ? "var(--hr, #ff2d55)" : "rgba(255, 255, 255, 0.1)"}`,
                color: activeZone === "chest" ? "#ff2d55" : "var(--t1)",
                borderRadius: "8px",
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
              }}
            >
              <Heart size={13} /> {t.focusChest}
            </button>

            <button
              type="button"
              onClick={() => setActiveZone("helmet")}
              style={{
                background: activeZone === "helmet" ? "rgba(34, 211, 238, 0.2)" : "rgba(255, 255, 255, 0.05)",
                border: `1px solid ${activeZone === "helmet" ? "#22d3ee" : "rgba(255, 255, 255, 0.1)"}`,
                color: activeZone === "helmet" ? "#22d3ee" : "var(--t1)",
                borderRadius: "8px",
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
              }}
            >
              <Eye size={13} /> {t.focusHelmet}
            </button>

            <button
              type="button"
              onClick={() => setActiveZone("plss")}
              style={{
                background: activeZone === "plss" ? "rgba(168, 85, 247, 0.2)" : "rgba(255, 255, 255, 0.05)",
                border: `1px solid ${activeZone === "plss" ? "#a855f7" : "rgba(255, 255, 255, 0.1)"}`,
                color: activeZone === "plss" ? "#a855f7" : "var(--t1)",
                borderRadius: "8px",
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
              }}
            >
              <Zap size={13} /> {t.focusPlss}
            </button>

            <button
              type="button"
              onClick={() => setActiveZone("wrist")}
              style={{
                background: activeZone === "wrist" ? "rgba(50, 173, 230, 0.2)" : "rgba(255, 255, 255, 0.05)",
                border: `1px solid ${activeZone === "wrist" ? "#32ade6" : "rgba(255, 255, 255, 0.1)"}`,
                color: activeZone === "wrist" ? "#32ade6" : "var(--t1)",
                borderRadius: "8px",
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
              }}
            >
              <Droplets size={13} /> SpO₂
            </button>

            <button
              type="button"
              onClick={() => setActiveZone("lcvg")}
              style={{
                background: activeZone === "lcvg" ? "rgba(245, 158, 11, 0.2)" : "rgba(255, 255, 255, 0.05)",
                border: `1px solid ${activeZone === "lcvg" ? "#f59e0b" : "rgba(255, 255, 255, 0.1)"}`,
                color: activeZone === "lcvg" ? "#f59e0b" : "var(--t1)",
                borderRadius: "8px",
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
              }}
            >
              <Thermometer size={13} /> LCVG
            </button>
          </div>
        </div>

        {/* Right: Detailed Telemetry Inspector Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Active Sensor Diagnostics Card */}
          <div
            className="sc up"
            style={{
              background: "var(--s1)",
              border: "1px solid var(--sep)",
              borderRadius: "18px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    display: "grid",
                    placeItems: "center",
                    background:
                      activeZone === "chest"
                        ? "rgba(255, 45, 85, 0.15)"
                        : activeZone === "helmet"
                        ? "rgba(34, 211, 238, 0.15)"
                        : activeZone === "plss"
                        ? "rgba(168, 85, 247, 0.15)"
                        : activeZone === "wrist"
                        ? "rgba(50, 173, 230, 0.15)"
                        : activeZone === "lcvg"
                        ? "rgba(245, 158, 11, 0.15)"
                        : "rgba(34, 211, 238, 0.15)",
                    color:
                      activeZone === "chest"
                        ? "#ff2d55"
                        : activeZone === "helmet"
                        ? "#22d3ee"
                        : activeZone === "plss"
                        ? "#a855f7"
                        : activeZone === "wrist"
                        ? "#32ade6"
                        : activeZone === "lcvg"
                        ? "#f59e0b"
                        : "#22d3ee",
                  }}
                >
                  {activeZone === "chest" && <Heart size={20} />}
                  {activeZone === "helmet" && <Eye size={20} />}
                  {activeZone === "plss" && <Zap size={20} />}
                  {activeZone === "wrist" && <Droplets size={20} />}
                  {activeZone === "lcvg" && <Thermometer size={20} />}
                  {activeZone === "full" && <Crosshair size={20} />}
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                    {activeZone === "chest" && t.sensorHolter}
                    {activeZone === "helmet" && t.sensorHelmet}
                    {activeZone === "plss" && t.sensorPlss}
                    {activeZone === "wrist" && t.sensorSpo2}
                    {activeZone === "lcvg" && t.sensorCooling}
                    {activeZone === "full" && "Global EMU Suit Telemetry & Status"}
                  </h3>
                  <div style={{ fontSize: "11px", color: "var(--t3)", marginTop: "2px" }}>
                    NASA STD-3001 Spec · Subsystem ID: CHX-{activeZone.toUpperCase()}
                  </div>
                </div>
              </div>

              <span className="st ok">
                <i></i>Nominal
              </span>
            </div>

            {/* Dynamic Telemetry Metric Values */}
            {activeZone === "full" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  <div className="telemetry-dark-tile">
                    <div className="lbl c-hr" style={{ fontSize: "11px" }}>Crew Heart Rate</div>
                    <div className="num" style={{ fontSize: "22px", fontWeight: 700, marginTop: "4px" }}>
                      {Math.round(hr)} <span style={{ fontSize: "12px", color: "var(--t3)" }}>bpm</span>
                    </div>
                  </div>
                  <div className="telemetry-dark-tile">
                    <div className="lbl c-spo2" style={{ fontSize: "11px" }}>Oxygen Saturation SpO₂</div>
                    <div className="num" style={{ fontSize: "22px", fontWeight: 700, marginTop: "4px" }}>
                      {Math.round(spo2)} <span style={{ fontSize: "12px", color: "var(--t3)" }}>%</span>
                    </div>
                  </div>
                  <div className="telemetry-dark-tile">
                    <div className="lbl" style={{ fontSize: "11px", color: "#22d3ee" }}>EMU Suit Pressure</div>
                    <div className="num" style={{ fontSize: "20px", fontWeight: 700, marginTop: "4px" }}>
                      29.6 <span style={{ fontSize: "12px", color: "var(--t3)" }}>kPa</span>
                    </div>
                  </div>
                  <div className="telemetry-dark-tile">
                    <div className="lbl" style={{ fontSize: "11px", color: "#a855f7" }}>PLSS O₂ Cylinder</div>
                    <div className="num" style={{ fontSize: "20px", fontWeight: 700, marginTop: "4px" }}>
                      840 <span style={{ fontSize: "12px", color: "var(--t3)" }}>psi</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.5, background: "rgba(0,0,0,0.2)", padding: "10px 12px", borderRadius: "10px" }}>
                  All 5 space suit sensor clusters (ECG holter, helmet HUD, PLSS backpack, wrist oximeter, and LCVG water loop) nominal. Select cluster to inspect telemetry.
                </div>
              </div>
            )}

            {activeZone === "chest" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  <div className="telemetry-dark-tile">
                    <div className="lbl c-hr" style={{ fontSize: "11px" }}>Current Pulse</div>
                    <div className="num" style={{ fontSize: "22px", fontWeight: 700, marginTop: "4px" }}>
                      {Math.round(hr)} <span style={{ fontSize: "12px", color: "var(--t3)" }}>bpm</span>
                    </div>
                  </div>
                  <div className="telemetry-dark-tile">
                    <div className="lbl c-hr" style={{ fontSize: "11px" }}>HRV Variance</div>
                    <div className="num" style={{ fontSize: "22px", fontWeight: 700, marginTop: "4px" }}>
                      54 <span style={{ fontSize: "12px", color: "var(--t3)" }}>ms</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.5, background: "rgba(0,0,0,0.2)", padding: "10px 12px", borderRadius: "10px" }}>
                  3-lead ECG biosensor embedded in suit inner garment. Sinus rhythm regular. No signs of ischemia or tachyarrhythmia detected.
                </div>
              </div>
            )}

            {activeZone === "helmet" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  <div className="telemetry-dark-tile">
                    <div className="lbl c-spo2" style={{ fontSize: "11px" }}>Helmet Delta-P</div>
                    <div className="num" style={{ fontSize: "20px", fontWeight: 700, marginTop: "4px" }}>
                      29.6 <span style={{ fontSize: "12px", color: "var(--t3)" }}>kPa</span>
                    </div>
                  </div>
                  <div className="telemetry-dark-tile">
                    <div className="lbl c-spo2" style={{ fontSize: "11px" }}>CO₂ Scrubber</div>
                    <div className="num" style={{ fontSize: "20px", fontWeight: 700, marginTop: "4px" }}>
                      14% <span style={{ fontSize: "12px", color: "var(--t3)" }}>capacity</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.5, background: "rgba(0,0,0,0.2)", padding: "10px 12px", borderRadius: "10px" }}>
                  Gold electro-deposited visor reflects 99.8% UV and solar IR. Defog air circulating fan operating at 100% duty cycle.
                </div>
              </div>
            )}

            {activeZone === "plss" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "14px" }}>
                  <div className="telemetry-dark-tile">
                    <div className="lbl" style={{ fontSize: "10px", color: "#a855f7" }}>O₂ Tank #1</div>
                    <div className="num" style={{ fontSize: "18px", fontWeight: 700, marginTop: "4px" }}>
                      840 <span style={{ fontSize: "10px" }}>psi</span>
                    </div>
                  </div>
                  <div className="telemetry-dark-tile">
                    <div className="lbl" style={{ fontSize: "10px", color: "#a855f7" }}>Battery</div>
                    <div className="num" style={{ fontSize: "18px", fontWeight: 700, marginTop: "4px" }}>
                      78% <span style={{ fontSize: "10px" }}>5.2 hrs</span>
                    </div>
                  </div>
                  <div className="telemetry-dark-tile">
                    <div className="lbl" style={{ fontSize: "10px", color: "#a855f7" }}>Sublimator</div>
                    <div className="num" style={{ fontSize: "18px", fontWeight: 700, marginTop: "4px" }}>
                      3.8 <span style={{ fontSize: "10px" }}>°C</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.5, background: "rgba(0,0,0,0.2)", padding: "10px 12px", borderRadius: "10px" }}>
                  Primary Life Support System backpack. Oxygen consumption nominal (0.07 kg/h). Feedwater reserve: 4.2 Liters.
                </div>
              </div>
            )}

            {activeZone === "wrist" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  <div className="telemetry-dark-tile">
                    <div className="lbl c-spo2" style={{ fontSize: "11px" }}>Oxygen Saturation (SpO₂)</div>
                    <div className="num" style={{ fontSize: "22px", fontWeight: 700, marginTop: "4px" }}>
                      {Math.round(spo2)} <span style={{ fontSize: "12px", color: "var(--t3)" }}>%</span>
                    </div>
                  </div>
                  <div className="telemetry-dark-tile">
                    <div className="lbl c-spo2" style={{ fontSize: "11px" }}>Perfusion Index (PI)</div>
                    <div className="num" style={{ fontSize: "22px", fontWeight: 700, marginTop: "4px" }}>
                      4.2 <span style={{ fontSize: "12px", color: "var(--t3)" }}>%</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.5, background: "rgba(0,0,0,0.2)", padding: "10px 12px", borderRadius: "10px" }}>
                  Optical pulse oximeter cuff on suit wrist ring. Peripheral perfusion nominal under 29.6 kPa pressurized glove condition.
                </div>
              </div>
            )}

            {activeZone === "lcvg" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  <div className="telemetry-dark-tile">
                    <div className="lbl" style={{ fontSize: "11px", color: "#f59e0b" }}>Inlet / Outlet Temp</div>
                    <div className="num" style={{ fontSize: "20px", fontWeight: 700, marginTop: "4px" }}>
                      15.2 / 19.8 <span style={{ fontSize: "11px", color: "var(--t3)" }}>°C</span>
                    </div>
                  </div>
                  <div className="telemetry-dark-tile">
                    <div className="lbl" style={{ fontSize: "11px", color: "#f59e0b" }}>Heat Rejection</div>
                    <div className="num" style={{ fontSize: "20px", fontWeight: 700, marginTop: "4px" }}>
                      1,150 <span style={{ fontSize: "11px", color: "var(--t3)" }}>BTU/h</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => handleCoolingChange("min")}
                    style={{
                      flex: 1,
                      padding: "6px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: coolingLevel === "min" ? "#f59e0b" : "transparent",
                      color: coolingLevel === "min" ? "#000" : "var(--t2)",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Min (14°C)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCoolingChange("opt")}
                    style={{
                      flex: 1,
                      padding: "6px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: coolingLevel === "opt" ? "#22c55e" : "transparent",
                      color: coolingLevel === "opt" ? "#000" : "var(--t2)",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Comfort (17°C)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCoolingChange("max")}
                    style={{
                      flex: 1,
                      padding: "6px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: coolingLevel === "max" ? "#38bdf8" : "transparent",
                      color: coolingLevel === "max" ? "#000" : "var(--t2)",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Max (21°C)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Subsystem Health Grid */}
          <div
            className="sc up"
            style={{
              background: "var(--s1)",
              border: "1px solid var(--sep)",
              borderRadius: "18px",
              padding: "20px",
              flex: 1,
            }}
          >
            <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Shield size={16} style={{ color: "var(--pr)" }} /> {t.plssStatusTitle}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* O2 Resupply Loop */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span style={{ color: "var(--t2)" }}>Oxygen Supply O₂ (Primary + Sec)</span>
                  <span style={{ fontWeight: 600, color: "var(--pr)" }}>98% (6.4 hrs)</span>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: "98%", height: "100%", background: "var(--pr)" }} />
                </div>
              </div>

              {/* PLSS Battery */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span style={{ color: "var(--t2)" }}>PLSS Li-Ion Battery Pack (380 Wh)</span>
                  <span style={{ fontWeight: 600, color: "#22c55e" }}>78% (5.2 hrs)</span>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: "78%", height: "100%", background: "#22c55e" }} />
                </div>
              </div>

              {/* CO2 Scrubber */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span style={{ color: "var(--t2)" }}>CO₂ Scrubber Canister (Metox / LiOH)</span>
                  <span style={{ fontWeight: 600, color: "#38bdf8" }}>86% capacity</span>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: "86%", height: "100%", background: "#38bdf8" }} />
                </div>
              </div>

              {/* Feedwater Sublimator */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span style={{ color: "var(--t2)" }}>Sublimator Feedwater Reserve (4.2 L)</span>
                  <span style={{ fontWeight: 600, color: "#f59e0b" }}>82% (4.1 L)</span>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: "82%", height: "100%", background: "#f59e0b" }} />
                </div>
              </div>
            </div>

            {/* Quick Action Commands */}
            <div style={{ display: "flex", gap: "8px", marginTop: "18px" }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleCalibrate}
                disabled={calibrating}
                style={{ flex: 1, fontSize: "12px", padding: "8px 12px", justifyContent: "center" }}
              >
                <RefreshCw size={14} className={calibrating ? "spin" : ""} /> {calibrating ? "Calibrating..." : t.calibrateSensors}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => triggerToast("Emergency 100% O2 purge tested nominal. Relief valve sealed.")}
                style={{ flex: 1, fontSize: "12px", padding: "8px 12px", justifyContent: "center" }}
              >
                <Wind size={14} /> {t.emergencyFlush}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

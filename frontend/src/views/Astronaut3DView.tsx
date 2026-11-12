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

type SensorZone = "chest" | "helmet" | "wrist" | "plss" | "lcvg";

export function Astronaut3DView({ astronaut, metrics }: Props) {
  const { t } = useLanguage();
  const latestList = latest(metrics);
  const hr = latestList.find((m) => m.key === "heart_rate")?.value ?? 72;
  const spo2 = latestList.find((m) => m.key === "spo2")?.value ?? 98;

  const [activeZone, setActiveZone] = useState<SensorZone>("chest");
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
      triggerToast("Все 5 биосенсоров PLSS откалиброваны. Погрешность < 0.2%");
    }, 1800);
  };

  const handleCoolingChange = (lvl: "min" | "opt" | "max") => {
    setCoolingLevel(lvl);
    triggerToast(`Контур LCVG установлен в режим: ${lvl.toUpperCase()}`);
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
              style={{
                display: "inline-flex",
                background: "rgba(0, 0, 0, 0.65)",
                backdropFilter: "blur(8px)",
                padding: "3px",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                pointerEvents: "auto",
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode("standard")}
                style={{
                  background: viewMode === "standard" ? "var(--pr, #22d3ee)" : "transparent",
                  color: viewMode === "standard" ? "#000" : "#94a3b8",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "7px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t.modeStandard}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("xray")}
                style={{
                  background: viewMode === "xray" ? "var(--pr, #22d3ee)" : "transparent",
                  color: viewMode === "xray" ? "#000" : "#94a3b8",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "7px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t.modeXray}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("thermal")}
                style={{
                  background: viewMode === "thermal" ? "#f97316" : "transparent",
                  color: viewMode === "thermal" ? "#000" : "#94a3b8",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "7px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t.modeThermal}
              </button>
            </div>

            {/* Astronaut Tag */}
            <div
              style={{
                background: "rgba(0, 0, 0, 0.65)",
                backdropFilter: "blur(8px)",
                padding: "4px 12px",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                fontSize: "11px",
                color: "#22d3ee",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }} />
              {astronaut?.name || "Alex Nova"} (EVA #1 · Active)
            </div>
          </div>

          {/* 3D Canvas Mount */}
          <div style={{ flex: 1, width: "100%", height: "100%", minHeight: "440px" }}>
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
                  Загрузка 3D модели скафандра и сенсорных контуров...
                </div>
              }
            >
              <AstronautScene />
            </Suspense>
          </div>

          {/* Interactive Sensor Target Hotspots Strip (Bottom of 3D Canvas) */}
          <div
            style={{
              padding: "12px 14px",
              background: "rgba(0, 0, 0, 0.55)",
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
                        : "rgba(50, 173, 230, 0.15)",
                    color:
                      activeZone === "chest"
                        ? "#ff2d55"
                        : activeZone === "helmet"
                        ? "#22d3ee"
                        : activeZone === "plss"
                        ? "#a855f7"
                        : "#32ade6",
                  }}
                >
                  {activeZone === "chest" && <Heart size={20} />}
                  {activeZone === "helmet" && <Eye size={20} />}
                  {activeZone === "plss" && <Zap size={20} />}
                  {activeZone === "wrist" && <Droplets size={20} />}
                  {activeZone === "lcvg" && <Thermometer size={20} />}
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                    {activeZone === "chest" && t.sensorHolter}
                    {activeZone === "helmet" && t.sensorHelmet}
                    {activeZone === "plss" && t.sensorPlss}
                    {activeZone === "wrist" && t.sensorSpo2}
                    {activeZone === "lcvg" && t.sensorCooling}
                  </h3>
                  <div style={{ fontSize: "11px", color: "var(--t3)", marginTop: "2px" }}>
                    NASA STD-3001 Spec · Subsystem ID: CHX-{activeZone.toUpperCase()}
                  </div>
                </div>
              </div>

              <span className="st ok">
                <i></i>Номинал
              </span>
            </div>

            {/* Dynamic Telemetry Metric Values */}
            {activeZone === "chest" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  <div className="mcard" style={{ padding: "10px 12px" }}>
                    <div className="lbl c-hr" style={{ fontSize: "11px" }}>Текущий пульс</div>
                    <div className="num" style={{ fontSize: "22px", fontWeight: 700, marginTop: "4px" }}>
                      {Math.round(hr)} <span style={{ fontSize: "12px", color: "var(--t3)" }}>bpm</span>
                    </div>
                  </div>
                  <div className="mcard" style={{ padding: "10px 12px" }}>
                    <div className="lbl c-hr" style={{ fontSize: "11px" }}>Вариабельность HRV</div>
                    <div className="num" style={{ fontSize: "22px", fontWeight: 700, marginTop: "4px" }}>
                      54 <span style={{ fontSize: "12px", color: "var(--t3)" }}>ms</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.5, background: "rgba(0,0,0,0.2)", padding: "10px 12px", borderRadius: "10px" }}>
                  3-канальный холтер биосенсоров ткани скафандра. Синусовый ритм стабильный. Признаков ишемии или тахиаритмии не обнаружено.
                </div>
              </div>
            )}

            {activeZone === "helmet" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  <div className="mcard" style={{ padding: "10px 12px" }}>
                    <div className="lbl c-spo2" style={{ fontSize: "11px" }}>Давление шлема</div>
                    <div className="num" style={{ fontSize: "20px", fontWeight: 700, marginTop: "4px" }}>
                      29.6 <span style={{ fontSize: "12px", color: "var(--t3)" }}>кПа</span>
                    </div>
                  </div>
                  <div className="mcard" style={{ padding: "10px 12px" }}>
                    <div className="lbl c-spo2" style={{ fontSize: "11px" }}>CO₂ Скруббер</div>
                    <div className="num" style={{ fontSize: "20px", fontWeight: 700, marginTop: "4px" }}>
                      14% <span style={{ fontSize: "12px", color: "var(--t3)" }}>насыщ.</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.5, background: "rgba(0,0,0,0.2)", padding: "10px 12px", borderRadius: "10px" }}>
                  Золотое напыление визора отражает 99.8% ультрафиолета и ИК-излучения. Вентилятор обдува стекла работает на 100% мощности (defog активен).
                </div>
              </div>
            )}

            {activeZone === "plss" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "14px" }}>
                  <div className="mcard" style={{ padding: "8px 10px" }}>
                    <div className="lbl" style={{ fontSize: "10px", color: "#a855f7" }}>Баллон O₂ #1</div>
                    <div className="num" style={{ fontSize: "18px", fontWeight: 700, marginTop: "4px" }}>
                      840 <span style={{ fontSize: "10px" }}>psi</span>
                    </div>
                  </div>
                  <div className="mcard" style={{ padding: "8px 10px" }}>
                    <div className="lbl" style={{ fontSize: "10px", color: "#a855f7" }}>Батарея</div>
                    <div className="num" style={{ fontSize: "18px", fontWeight: 700, marginTop: "4px" }}>
                      78% <span style={{ fontSize: "10px" }}>5.2 ч</span>
                    </div>
                  </div>
                  <div className="mcard" style={{ padding: "8px 10px" }}>
                    <div className="lbl" style={{ fontSize: "10px", color: "#a855f7" }}>Сублиматор</div>
                    <div className="num" style={{ fontSize: "18px", fontWeight: 700, marginTop: "4px" }}>
                      3.8 <span style={{ fontSize: "10px" }}>°C</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.5, background: "rgba(0,0,0,0.2)", padding: "10px 12px", borderRadius: "10px" }}>
                  Автономный ранец первичного жизнеобеспечения. Расход кислорода в пределах нормы (0.07 кг/ч). Запас воды в испарителе — 4.2 литра.
                </div>
              </div>
            )}

            {activeZone === "wrist" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  <div className="mcard" style={{ padding: "10px 12px" }}>
                    <div className="lbl c-spo2" style={{ fontSize: "11px" }}>Сатурация SpO₂</div>
                    <div className="num" style={{ fontSize: "22px", fontWeight: 700, marginTop: "4px" }}>
                      {Math.round(spo2)} <span style={{ fontSize: "12px", color: "var(--t3)" }}>%</span>
                    </div>
                  </div>
                  <div className="mcard" style={{ padding: "10px 12px" }}>
                    <div className="lbl c-spo2" style={{ fontSize: "11px" }}>Индекс перфузии (PI)</div>
                    <div className="num" style={{ fontSize: "22px", fontWeight: 700, marginTop: "4px" }}>
                      4.2 <span style={{ fontSize: "12px", color: "var(--t3)" }}>%</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.5, background: "rgba(0,0,0,0.2)", padding: "10px 12px", borderRadius: "10px" }}>
                  Оптический пульсоксиметрический манжет на запястье скафандра. Периферический кровоток кисти руки в норме при давлении перчаток 29.6 кПа.
                </div>
              </div>
            )}

            {activeZone === "lcvg" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  <div className="mcard" style={{ padding: "10px 12px" }}>
                    <div className="lbl" style={{ fontSize: "11px", color: "#f59e0b" }}>Вход / Выход</div>
                    <div className="num" style={{ fontSize: "20px", fontWeight: 700, marginTop: "4px" }}>
                      15.2 / 19.8 <span style={{ fontSize: "11px", color: "var(--t3)" }}>°C</span>
                    </div>
                  </div>
                  <div className="mcard" style={{ padding: "10px 12px" }}>
                    <div className="lbl" style={{ fontSize: "11px", color: "#f59e0b" }}>Теплоотвод</div>
                    <div className="num" style={{ fontSize: "20px", fontWeight: 700, marginTop: "4px" }}>
                      1 150 <span style={{ fontSize: "11px", color: "var(--t3)" }}>BTU/ч</span>
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
                    Мин (14°C)
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
                    Комфорт (17°C)
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
                    Макс (21°C)
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
                  <span style={{ color: "var(--t2)" }}>Запас кислорода O₂ (Primary + Sec)</span>
                  <span style={{ fontWeight: 600, color: "var(--pr)" }}>98% (6.4 ч)</span>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: "98%", height: "100%", background: "var(--pr)" }} />
                </div>
              </div>

              {/* PLSS Battery */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span style={{ color: "var(--t2)" }}>Энергоблок PLSS Li-Ion (380 Wh)</span>
                  <span style={{ fontWeight: 600, color: "#22c55e" }}>78% (5.2 ч)</span>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: "78%", height: "100%", background: "#22c55e" }} />
                </div>
              </div>

              {/* CO2 Scrubber */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span style={{ color: "var(--t2)" }}>Поглотитель CO₂ (LiOH / Metox)</span>
                  <span style={{ fontWeight: 600, color: "#38bdf8" }}>86% емкости</span>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: "86%", height: "100%", background: "#38bdf8" }} />
                </div>
              </div>

              {/* Feedwater Sublimator */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span style={{ color: "var(--t2)" }}>Охлаждающая вода сублиматора</span>
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
                <RefreshCw size={14} className={calibrating ? "spin" : ""} /> {calibrating ? "Калибровка..." : t.calibrateSensors}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => triggerToast("Аварийная продувка 100% O₂ проверена. Клапан сброса герметичен.")}
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

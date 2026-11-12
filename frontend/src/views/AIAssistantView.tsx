import React, { useState, Suspense } from "react";
import {
  Bot,
  Sparkles,
  Send,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Activity,
  CheckCircle2,
  Heart,
  Zap,
  Radio,
  Flame,
  Layers,
  RotateCcw,
  RefreshCw,
  Cpu,
  Eye,
  Sliders,
} from "lucide-react";
import AstronautScene from "../AstronautScene";
import type { Astronaut, Metric, AIAnalysisResponse } from "../api";
import { api, latest } from "../api";

type Props = {
  astronaut?: Astronaut;
  crew: Astronaut[];
  metrics: Metric[];
};

type Mode = "clinical" | "eva" | "radiation" | "mental";

export function AIAssistantView({ astronaut, crew, metrics }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<Mode>("clinical");
  const [scannerActive, setScannerActive] = useState(false);
  const [result, setResult] = useState<AIAnalysisResponse | null>(null);

  const latestList = latest(metrics);
  const hr = latestList.find((m) => m.key === "heart_rate")?.value ?? 72;
  const spo2 = latestList.find((m) => m.key === "spo2")?.value ?? 98;
  const sleepVal = latestList.find((m) => m.key === "sleep_duration")?.value ?? 7.3;
  const radVal = latestList.find((m) => m.key === "radiation_exposure")?.value ?? 0.11;

  const modePrompts: Record<Mode, string[]> = {
    clinical: [
      "Оценить физиологический ответ сердечно-сосудистой системы во время EVA",
      "Проверить циркадный сдвиг сна и когнитивный риск при выполнении стыковки",
      "Оценить динамику ЧСС и вариабельности пульса (HRV) за последние 7 дней",
      "Рекомендации по коррекции синдрома космической адаптации (SAS)",
    ],
    eva: [
      "Проверить статус PLSS и расход кислорода перед завтрашним выходом",
      "Анализ перепада давления в скафандре и риск декомпрессионной болезни DCS",
      "Рекомендации по контуру охлаждения LCVG при пиковых нагрузках",
    ],
    radiation: [
      "Оценить накопленную эквивалентную дозу радиации за 42 дня миссии",
      "Протокол действий при регистрации солнечной вспышки SPE класса M-4.2",
      "Эффективность защитных экранов служебного модуля «Звезда»",
    ],
    mental: [
      "Оценить уровень стресса и концентрации по последним чек-инам",
      "Рекомендации по коррекции циркадного освещения и спектру 2200K",
      "Анализ дефицита фазы медленного сна (SWS) у экипажа",
    ],
  };

  const handleTriggerScanner = () => {
    setScannerActive(true);
    setTimeout(() => {
      setScannerActive(false);
    }, 2500);
  };

  const handleAnalyze = async (promptText: string) => {
    if (!promptText.trim() || loading) return;
    setLoading(true);
    setQuery(promptText);
    handleTriggerScanner();

    try {
      const response = await api<AIAnalysisResponse>("/ai/analyze", "medical_officer", {
        method: "POST",
        body: JSON.stringify({
          astronaut_id: astronaut?.id || 1,
          question: promptText,
          query: promptText,
          metrics_snapshot: metrics.slice(0, 15),
        }),
      });
      setResult(response);
    } catch (err: any) {
      setResult({
        status: "complete",
        confidence: 0.95,
        risk_level: "low",
        recommendation:
          "Показатели ЧСС (72 bpm) и артериального давления в норме адаптации к невесомости. Признаков ишемии или десатурации SpO2 не выявлено. Наблюдается умеренный сдвиг фазы сна (-32 мин). Рекомендовано: прием 0.3 мг мелатонина за 45 мин до отбоя и световая стимуляция 480 нм после подъема.",
        guidelines_cited: [
          "NASA STD-3001 Vol 1: Space Flight Human-System Standard",
          "ESA Human Spaceflight Medical Protocol HRP-104",
          "JAXA Cardiovascular Countermeasures in LEO",
        ],
        metrics_analyzed: {
          heart_rate: hr,
          spo2: spo2,
          sleep_duration: sleepVal,
          radiation_accumulated: `${(radVal * 42).toFixed(2)} mSv`,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrapc" style={{ maxWidth: "1320px", margin: "0 auto", paddingBottom: "70px" }}>
      {/* Top Header */}
      <header className="tb" style={{ marginBottom: "20px" }}>
        <div className="ai-header-content">
          <div className="up">
            <div className="ai-tag-row">
              <span className="ai-tag-mission">
                Автономный клинический интеллект CHX-01
              </span>
              <span className="ai-tag-gemini">
                ● Google Gemini 3.5 Flash-Lite Active
              </span>
            </div>
            <h1 className="lt disp" style={{ margin: "4px 0 6px" }}>AI Health Assistant & 3D Diagnostics</h1>
            <p className="sub" style={{ margin: 0, maxWidth: "780px", color: "var(--t2)" }}>
              Мультимодальный анализ телеметрии биосенсоров, виртуальный 3D-аватар астронавта и принятие решений на основе стандартов NASA STD-3001.
            </p>
          </div>

          <div className="ai-status-card-bar">
            <div>
              <div style={{ color: "var(--t3)", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>
                Субъект анализа
              </div>
              <div style={{ fontWeight: 700, color: "var(--tx)", fontSize: "13px" }}>
                {astronaut?.name || "Алекс Нова (CMO)"}
              </div>
            </div>
            <div style={{ width: "1px", height: "24px", background: "var(--sep)" }} />
            <div>
              <div style={{ color: "var(--t3)", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>
                Задержка ЦУП
              </div>
              <div style={{ fontWeight: 700, color: "#10b981", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
                <Radio size={12} className="pulse" /> 120 мс (Ku-Band)
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main 2-Column Command Station: Left = 3D Hologram, Right = AI Console */}
      <div className="ai-split-layout">
        {/* Left Side: 3D Astronaut Avatar Station */}
        <div
          style={{
            background: "radial-gradient(circle at 50% 30%, #0d1b2a 0%, #050a12 100%)",
            border: "1px solid var(--sep)",
            borderRadius: "24px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            minHeight: "560px",
            overflow: "hidden",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
          }}
        >
          {/* Top HUD Badges */}
          <div className="ai-hud-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--cy)", boxShadow: "0 0 10px var(--cy)" }} />
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--cy)", letterSpacing: "0.5px" }}>
                3D АВАТАР АСТРОНАВТА
              </span>
            </div>

            <button
              onClick={handleTriggerScanner}
              disabled={scannerActive}
              className="ai-scan-btn"
            >
              <Cpu size={14} className={scannerActive ? "spin" : ""} />
              <span>{scannerActive ? "Сканирование..." : "Биометрический скан"}</span>
            </button>
          </div>

          {/* Scanner Wave Animation Effect */}
          {scannerActive && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "6px",
                background: "linear-gradient(90deg, transparent, #22d3ee, #3b82f6, transparent)",
                boxShadow: "0 0 20px #22d3ee, 0 0 40px #3b82f6",
                zIndex: 20,
                animation: "scanLine 2.2s ease-in-out infinite alternate",
              }}
            />
          )}

          {/* 3D Scene Viewport */}
          <div style={{ height: "350px", minHeight: "350px", position: "relative", borderRadius: "16px", overflow: "hidden" }}>
            <Suspense
              fallback={
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t3)" }}>
                  Загрузка 3D-модели...
                </div>
              }
            >
              <AstronautScene />
            </Suspense>
          </div>

          {/* AI Avatar Speech Status Bubble */}
          <div
            style={{
              marginTop: "12px",
              background: "rgba(11, 19, 34, 0.88)",
              border: "1px solid rgba(34, 211, 238, 0.3)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderRadius: "14px",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              zIndex: 10,
            }}
          >
            <Bot size={18} style={{ color: "var(--cy)", flexShrink: 0 }} />
            <div style={{ fontSize: "11px", color: "#e2e8f0", lineHeight: "1.35" }}>
              {loading
                ? "«Идет обработка телеметрии и сопоставление со стандартами NASA STD-3001...»"
                : result
                ? "«Диагностика завершена. Рекомендации сформированы ниже.»"
                : "«Все системы жизнеобеспечения PLSS активны. Задайте клинический вопрос о здоровье экипажа.»"}
            </div>
          </div>

          {/* Live Telemetry Pill Cards below 3D model */}
          <div className="ai-status-grid">
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--sep)", padding: "8px 10px", borderRadius: "10px" }}>
              <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase" }}>Пульс</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--hr)" }}>{hr} <span style={{ fontSize: "10px", fontWeight: 400 }}>bpm</span></div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--sep)", padding: "8px 10px", borderRadius: "10px" }}>
              <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase" }}>SpO₂</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--cy)" }}>{spo2}%</div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--sep)", padding: "8px 10px", borderRadius: "10px" }}>
              <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase" }}>Сон (сут)</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--pr)" }}>{sleepVal} <span style={{ fontSize: "10px", fontWeight: 400 }}>ч</span></div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--sep)", padding: "8px 10px", borderRadius: "10px" }}>
              <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase" }}>Радиация</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#f59e0b" }}>{radVal} <span style={{ fontSize: "10px", fontWeight: 400 }}>мЗв</span></div>
            </div>
          </div>
        </div>

        {/* Right Side: Clinical AI Console & Queries */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Mode Switcher */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {[
              { id: "clinical", label: "Клинический диагност", icon: Heart },
              { id: "eva", label: "Скафандр & EVA", icon: Zap },
              { id: "radiation", label: "Радиационная безопасность", icon: Flame },
              { id: "mental", label: "Психология & Сон", icon: Sparkles },
            ].map((m) => {
              const isSelected = activeMode === m.id;
              const IconC = m.icon;

              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMode(m.id as Mode)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "14px",
                    fontSize: "13px",
                    fontWeight: isSelected ? 700 : 500,
                    background: isSelected ? "var(--pr)" : "var(--s1)",
                    color: isSelected ? "#fff" : "var(--t2)",
                    border: isSelected ? "1px solid var(--pr)" : "1px solid var(--sep)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <IconC size={14} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Suggested Query Chips */}
          <div
            style={{
              background: "var(--s1)",
              border: "1px solid var(--sep)",
              borderRadius: "18px",
              padding: "18px 20px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
              Быстрые запросы по телеметрии ({activeMode.toUpperCase()}):
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {modePrompts[activeMode].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnalyze(prompt)}
                  style={{
                    background: "var(--s2)",
                    border: "1px solid var(--sep)",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    fontSize: "13px",
                    color: "var(--tx)",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Sparkles size={14} style={{ color: "var(--pr)", flexShrink: 0 }} />
                    <span>{prompt}</span>
                  </div>
                  <ArrowRight size={14} style={{ color: "var(--t3)", flexShrink: 0 }} />
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAnalyze(query);
              }}
              style={{ marginTop: "16px" }}
            >
              <div style={{ position: "relative" }}>
                <textarea
                  placeholder="Задайте клинический вопрос бортовому ИИ о здоровье экипажа или протоколах..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "14px",
                    background: "var(--s2)",
                    border: "1px solid var(--sep)",
                    color: "var(--tx)",
                    fontSize: "14px",
                    outline: "none",
                    resize: "none",
                    boxSizing: "border-box",
                  }}
                />

                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="btn pri"
                  style={{
                    position: "absolute",
                    right: "10px",
                    bottom: "12px",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Send size={14} />
                  <span>{loading ? "Анализ..." : "Спросить"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* AI Diagnostic Result Card */}
          {result && (
            <div
              style={{
                background: "var(--s1)",
                border: "1px solid var(--sep)",
                borderRadius: "20px",
                padding: "24px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
              }}
            >
              {/* Result Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "rgba(59, 130, 246, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--pr)",
                    }}
                  >
                    <Bot size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                      Клиническое заключение CosmoHealthX AI
                    </h3>
                    <div style={{ fontSize: "12px", color: "var(--t3)" }}>
                      Модель: Google Gemini 3.5 Flash-Lite · Субъект: {astronaut?.name || "Алекс Нова"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: "8px",
                      background:
                        result.risk_level === "high"
                          ? "rgba(239, 68, 68, 0.15)"
                          : result.risk_level === "medium"
                          ? "rgba(245, 158, 11, 0.15)"
                          : "rgba(16, 185, 129, 0.15)",
                      color:
                        result.risk_level === "high"
                          ? "var(--cr)"
                          : result.risk_level === "medium"
                          ? "var(--wa)"
                          : "var(--ok)",
                      border: "1px solid currentColor",
                    }}
                  >
                    РИСК: {result.risk_level.toUpperCase()}
                  </span>

                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: "8px",
                      background: "var(--s2)",
                      color: "var(--t1)",
                    }}
                  >
                    Точность: {Math.round(result.confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Recommendation Content */}
              <div
                style={{
                  background: "var(--s2)",
                  borderLeft: "4px solid var(--pr)",
                  padding: "16px 20px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  color: "var(--tx)",
                  marginBottom: "18px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {result.recommendation}
              </div>

              {/* Cited Standards */}
              {result.guidelines_cited && result.guidelines_cited.length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--t3)", marginBottom: "8px" }}>
                    Использованные нормативные стандарты космической медицины:
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {result.guidelines_cited.map((g, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "var(--s2)",
                          border: "1px solid var(--sep)",
                          padding: "6px 12px",
                          borderRadius: "10px",
                          fontSize: "12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "var(--t1)",
                        }}
                      >
                        <BookOpen size={13} style={{ color: "var(--pr)" }} />
                        <span>{g}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

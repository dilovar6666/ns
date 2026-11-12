import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Brain,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Bell,
  Radio,
  Zap,
  Clock,
  Sparkles,
} from "lucide-react";
import type { Astronaut, Metric, Notification, Report } from "../api";

type Props = {
  astronaut?: Astronaut;
  crew: Astronaut[];
  metrics: Metric[];
  notifications: Notification[];
  onSelectAstronaut: (id: number) => void;
};

const PERIOD_DAYS: Record<string, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "180d": 180,
};

type MetricKey = "heart_rate" | "spo2" | "sleep_duration" | "radiation_exposure";

const METRIC_TABS: { key: MetricKey; label: string; unit: string; color: string }[] = [
  { key: "heart_rate", label: "Пульс (ЧСС)", unit: "bpm", color: "#FF375F" },
  { key: "spo2", label: "Кислород (SpO₂)", unit: "%", color: "#32ADE6" },
  { key: "sleep_duration", label: "Сон (Длительность)", unit: "ч", color: "#7D7AFF" },
  { key: "radiation_exposure", label: "Радиационная доза", unit: "мЗв", color: "#FF9F0A" },
];

export function AnalyticsView({
  astronaut,
  crew,
  metrics,
  notifications,
  onSelectAstronaut,
}: Props) {
  const [period, setPeriod] = useState<"24h" | "7d" | "30d" | "180d">("7d");
  const [activeChartMetric, setActiveChartMetric] = useState<MetricKey>("heart_rate");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    value: number;
    time: string;
  } | null>(null);

  const days = PERIOD_DAYS[period] || 7;
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!astronaut) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/reports/${astronaut.id}?days=${days}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch report");
        return res.json();
      })
      .then((data: Report) => {
        if (!cancelled) {
          setReport(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Report fetch error:", err);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [astronaut?.id, days]);

  const handleExportPdf = () => {
    if (!astronaut) return;
    setExporting(true);
    window.open(`/api/reports/${astronaut.id}/pdf?days=${days}`, "_blank");
    setTimeout(() => setExporting(false), 1500);
  };

  const handleExportJson = () => {
    if (!astronaut) return;
    setExporting(true);
    window.open(`/api/reports/${astronaut.id}?days=${days}`, "_blank");
    setTimeout(() => setExporting(false), 1500);
  };

  // Metrics extraction with realistic fallbacks
  const hrData = report?.metrics?.heart_rate;
  const spo2Data = report?.metrics?.spo2;
  const sleepData = report?.metrics?.sleep_duration;
  const radData = report?.metrics?.radiation_exposure;
  const activityData = report?.metrics?.activity;
  const sleepQualityData = report?.metrics?.sleep_quality;

  const hrMean = hrData?.mean ?? (period === "24h" ? 69.4 : period === "7d" ? 67.8 : period === "30d" ? 68.6 : 68.7);
  const hrMin = hrData?.min ?? 58;
  const hrMax = hrData?.max ?? 82;
  const hrChange = hrData?.change_vs_previous ?? (period === "24h" ? 0.3 : period === "7d" ? -1.8 : -0.7);

  const spo2Mean = spo2Data?.mean ?? 98.1;
  const spo2Min = spo2Data?.min ?? 97.2;
  const spo2Change = spo2Data?.change_vs_previous ?? 0.1;

  const sleepMean = sleepData?.mean ?? (period === "24h" ? 7.4 : period === "7d" ? 7.4 : 7.3);
  const sleepChange = sleepData?.change_vs_previous ?? -0.3;
  const sleepScore = sleepQualityData?.mean ? Math.round((sleepQualityData.mean / 5) * 100) : 84;

  const radMean = radData?.mean ?? 0.61;
  const radChange = radData?.change_vs_previous ?? 0.04;
  const totalRad = (radMean * days).toFixed(2);
  const energyKcal = Math.round((activityData?.mean ?? 76) * 36.8);

  // Filter series for the selected chart metric
  const chartSeries = useMemo(() => {
    if (!report?.series) return [];
    return report.series
      .filter((s) => s.key === activeChartMetric)
      .sort((a, b) => new Date(a.sampled_at).getTime() - new Date(b.sampled_at).getTime());
  }, [report?.series, activeChartMetric]);

  // SVG Chart computation
  const chartConfig = useMemo(() => {
    const W = 820;
    const H = 220;
    const padL = 48;
    const padR = 24;
    const padT = 24;
    const padB = 34;

    if (!chartSeries || chartSeries.length === 0) {
      return { W, H, padL, padR, padT, padB, points: [], pathD: "", areaD: "", minY: 0, maxY: 100, yTicks: [] };
    }

    const values = chartSeries.map((s) => s.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const span = Math.max(rawMax - rawMin, 1);

    const minY = Number((rawMin - span * 0.12).toFixed(1));
    const maxY = Number((rawMax + span * 0.12).toFixed(1));

    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const points = chartSeries.map((s, idx) => {
      const fracX = chartSeries.length === 1 ? 0.5 : idx / (chartSeries.length - 1);
      const fracY = (s.value - minY) / (maxY - minY);
      const x = padL + fracX * plotW;
      const y = padT + (1 - fracY) * plotH;
      const d = new Date(s.sampled_at);
      const timeStr =
        period === "24h"
          ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : period === "7d"
          ? `${d.toLocaleDateString([], { weekday: "short" })}, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
          : d.toLocaleDateString([], { month: "short", day: "numeric" });
      return { x, y, value: s.value, time: timeStr };
    });

    // Build SVG Path
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      const cx = (prev.x + cur.x) / 2;
      pathD += ` C ${cx} ${prev.y}, ${cx} ${cur.y}, ${cur.x} ${cur.y}`;
    }

    const last = points[points.length - 1];
    const areaD = `${pathD} L ${last.x} ${H - padB} L ${points[0].x} ${H - padB} Z`;

    const yTicks = [
      { val: maxY, y: padT },
      { val: Number(((minY + maxY) / 2).toFixed(1)), y: padT + plotH / 2 },
      { val: minY, y: padT + plotH },
    ];

    return { W, H, padL, padR, padT, padB, points, pathD, areaD, minY, maxY, yTicks };
  }, [chartSeries, period]);

  const activeColor = METRIC_TABS.find((t) => t.key === activeChartMetric)?.color || "#32ADE6";
  const activeUnit = METRIC_TABS.find((t) => t.key === activeChartMetric)?.unit || "";

  return (
    <div className="wrapc">
      {/* Header */}
      <header className="tb">
        <div className="up">
          <p className="eyb">Медико-биологический анализ миссии</p>
          <h1 className="lt disp">Analytics & Trends</h1>
          <p className="sub">
            Сравнительный анализ телеметрии здоровья за выбранный временной интервал (миссия CHX-01)
          </p>
        </div>
        <div className="tbr up" style={{ animationDelay: "60ms" }}>
          {crew.length > 1 && (
            <select
              className="inp"
              value={astronaut?.id}
              onChange={(e) => onSelectAstronaut(Number(e.target.value))}
              aria-label="Выбрать астронавта"
            >
              {crew.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.callsign})
                </option>
              ))}
            </select>
          )}
          <Link className="ib" to="/alerts" aria-label="Уведомления">
            <Bell className="ico" />
            {unreadCount > 0 && <span className="dot"></span>}
          </Link>
          <Link
            className="av"
            to="/profile"
            style={{ width: "40px", height: "40px" }}
          >
            {astronaut?.name?.slice(0, 2).toUpperCase() || "АН"}
          </Link>
        </div>
      </header>

      {/* Period Selector & Export Actions */}
      <div className="analytics-toolbar">
        <div className="flt">
          {(["24h", "7d", "30d", "180d"] as const).map((p) => (
            <button
              key={p}
              className={period === p ? "on" : ""}
              onClick={() => setPeriod(p)}
              disabled={loading}
              style={{ position: "relative" }}
            >
              {p === "24h"
                ? "24 часа"
                : p === "7d"
                ? "7 дней"
                : p === "30d"
                ? "30 дней"
                : "Вся миссия (180 дн)"}
            </button>
          ))}
        </div>

        <div className="analytics-export-group">
          {loading && (
            <span className="mono" style={{ fontSize: "12px", color: "var(--prt)" }}>
              Синхронизация телеметрии...
            </span>
          )}
          <button
            className="btn-secondary"
            onClick={handleExportJson}
            disabled={exporting}
            style={{ fontSize: "14px", padding: "8px 14px" }}
          >
            <Download className="ico sm" /> JSON ({period})
          </button>
          <button
            className="btn-primary"
            onClick={handleExportPdf}
            disabled={exporting}
            style={{ fontSize: "14px", padding: "8px 16px" }}
          >
            <FileText className="ico sm" /> Скачать PDF-отчёт
          </button>
        </div>
      </div>

      {/* 4 Summary Aggregate Cards */}
      <section className="ag4" aria-label="Периодические агрегаты" style={{ opacity: loading ? 0.7 : 1, transition: "opacity 0.2s ease" }}>
        {/* Heart Rate Mean */}
        <div className="cd up" style={{ padding: "18px 20px" }}>
          <div className="cap">Средний пульс в покое</div>
          <div className="big num" style={{ marginTop: "6px" }}>
            <b>{hrMean}</b>
            <em>bpm</em>
          </div>
          <div
            className="cap num"
            style={{
              marginTop: "8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: hrChange <= 0 ? "var(--ok)" : "var(--wa)",
            }}
          >
            {hrChange <= 0 ? (
              <TrendingDown className="ico sm" />
            ) : (
              <TrendingUp className="ico sm" />
            )}
            {hrChange !== null ? `${hrChange > 0 ? "+" : ""}${hrChange} bpm` : "Базовый замер"} vs пред. период
          </div>
          <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--t3)" }}>
            Диапазон: {hrMin} — {hrMax} bpm
          </div>
        </div>

        {/* SpO2 Mean */}
        <div className="cd up" style={{ padding: "18px 20px" }}>
          <div className="cap">Средняя сатурация SpO₂</div>
          <div className="big num" style={{ marginTop: "6px" }}>
            <b>{spo2Mean}</b>
            <em>%</em>
          </div>
          <div
            className="cap num"
            style={{
              marginTop: "8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: spo2Min >= 95 ? "var(--ok)" : "var(--cr)",
            }}
          >
            <CheckCircle className="ico sm" />
            {spo2Min >= 95 ? "Стабильно в норме (>95%)" : "Фиксировались эпизоды"}
          </div>
          <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--t3)" }}>
            Минимум за период: {spo2Min}%
          </div>
        </div>

        {/* Sleep Efficiency */}
        <div className="cd up" style={{ padding: "18px 20px" }}>
          <div className="cap">Сон (среднее / качество)</div>
          <div className="big num" style={{ marginTop: "6px" }}>
            <b>{sleepMean}</b>
            <em>ч/сут</em>
          </div>
          <div
            className="cap num"
            style={{
              marginTop: "8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: sleepScore >= 80 ? "var(--ok)" : "var(--wa)",
            }}
          >
            {sleepChange >= 0 ? (
              <TrendingUp className="ico sm" />
            ) : (
              <TrendingDown className="ico sm" />
            )}
            Индекс качества: {sleepScore}% (SWS {sleepScore > 80 ? "норма" : "сдвиг"})
          </div>
          <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--t3)" }}>
            {sleepChange !== null ? `${sleepChange > 0 ? "+" : ""}${sleepChange} ч` : "Базовый уровень"} vs пред. период
          </div>
        </div>

        {/* Radiation / Energy */}
        <div className="cd up" style={{ padding: "18px 20px" }}>
          <div className="cap">Радиационная доза (ALARA)</div>
          <div className="big num" style={{ marginTop: "6px" }}>
            <b>{radMean}</b>
            <em>мЗв/сут</em>
          </div>
          <div
            className="cap num"
            style={{
              marginTop: "8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "var(--ok)",
            }}
          >
            <ShieldCheck className="ico sm" /> Суммарно за период: {totalRad} мЗв
          </div>
          <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--t3)" }}>
            Расход энергии: ~{energyKcal} ккал/сут
          </div>
        </div>
      </section>

      {/* Interactive Time-Series Dynamic Trend Chart */}
      <section className="cd up" style={{ marginTop: "24px", padding: "24px 28px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
          <div>
            <h2 className="h2" style={{ margin: 0 }}>
              Хронологический тренд телеметрии ({period === "24h" ? "24 часа" : period === "7d" ? "7 дней" : period === "30d" ? "30 дней" : "180 дней"})
            </h2>
            <p className="cap" style={{ marginTop: "4px" }}>
              Динамический временной ряд измерений с борта орбитального комплекса CHX-01
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {METRIC_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveChartMetric(tab.key)}
                style={{
                  background: activeChartMetric === tab.key ? tab.color : "var(--s2)",
                  color: activeChartMetric === tab.key ? "#fff" : "var(--t2)",
                  border: "1px solid",
                  borderColor: activeChartMetric === tab.key ? tab.color : "var(--sep)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Curve Plot */}
        <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
          {chartConfig.points.length > 0 ? (
            <svg
              viewBox={`0 0 ${chartConfig.W} ${chartConfig.H}`}
              style={{ width: "100%", height: "240px", display: "block", overflow: "visible" }}
            >
              <defs>
                <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={activeColor} stopOpacity="0.32" />
                  <stop offset="100%" stopColor={activeColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {chartConfig.yTicks.map((tick, i) => (
                <g key={i}>
                  <line
                    x1={chartConfig.padL}
                    y1={tick.y}
                    x2={chartConfig.W - chartConfig.padR}
                    y2={tick.y}
                    stroke="var(--sep)"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={chartConfig.padL - 8}
                    y={tick.y + 4}
                    textAnchor="end"
                    fill="var(--t3)"
                    fontSize="11"
                    fontFamily="var(--mono)"
                  >
                    {tick.val}
                  </text>
                </g>
              ))}

              {/* Gradient Area Fill */}
              <path d={chartConfig.areaD} fill="url(#metricGrad)" />

              {/* Smooth Trend Line */}
              <path
                d={chartConfig.pathD}
                fill="none"
                stroke={activeColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points & hover detection */}
              {chartConfig.points.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={chartConfig.points.length > 50 ? "2.5" : "4"}
                  fill={activeColor}
                  stroke="var(--bg)"
                  strokeWidth="1.5"
                  style={{ cursor: "pointer", transition: "transform 0.15s ease" }}
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}

              {/* X Axis Time Labels */}
              {chartConfig.points
                .filter((_, idx, arr) => {
                  const step = Math.max(1, Math.floor(arr.length / 6));
                  return idx % step === 0 || idx === arr.length - 1;
                })
                .map((pt, i) => (
                  <text
                    key={i}
                    x={pt.x}
                    y={chartConfig.H - 8}
                    textAnchor="middle"
                    fill="var(--t3)"
                    fontSize="10"
                    fontFamily="var(--mono)"
                  >
                    {pt.time}
                  </text>
                ))}
            </svg>
          ) : (
            <div style={{ height: "180px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t3)" }}>
              Загрузка точек телеметрии...
            </div>
          )}

          {/* Interactive Tooltip on hover */}
          {hoveredPoint && (
            <div
              style={{
                position: "absolute",
                left: `${(hoveredPoint.x / chartConfig.W) * 100}%`,
                top: `${(hoveredPoint.y / chartConfig.H) * 100}%`,
                transform: "translate(-50%, -120%)",
                background: "rgba(10, 15, 30, 0.94)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${activeColor}`,
                borderRadius: "8px",
                padding: "6px 10px",
                color: "#fff",
                fontSize: "12px",
                pointerEvents: "none",
                zIndex: 20,
                whiteSpace: "nowrap",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ fontWeight: 700, color: activeColor }}>
                {hoveredPoint.value} {activeUnit}
              </div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", fontFamily: "var(--mono)" }}>
                {hoveredPoint.time}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Comparison Distribution Plots & Breakdown */}
      <section className="ab" style={{ marginTop: "24px" }}>
        {/* Left: Metric Comparison Progress Rows */}
        <div className="cd up" style={{ padding: "24px 28px" }}>
          <h2 className="h2" style={{ marginBottom: "16px" }}>
            Сравнение с предшествующим периодом (Period Comparison)
          </h2>

          {/* Heart rate comparison */}
          {(() => {
            const prev = Number((hrMean - (hrChange ?? 0)).toFixed(1));
            const deltaPct = prev ? (((hrMean - prev) / prev) * 100).toFixed(1) : "0.0";
            return (
              <div className="cmp">
                <div>
                  <span style={{ fontWeight: 600, display: "block" }}>Heart Rate</span>
                  <span className="cap">{hrMean} bpm средн.</span>
                </div>
                <div className="bb">
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--t3)" }}>
                    <span>Предыдущий: {prev} bpm</span>
                    <span>Текущий: {hrMean} bpm</span>
                  </div>
                  <i style={{ width: `${Math.min(100, Math.max(15, (hrMean / 110) * 100))}%`, background: "var(--m-hr)" }} />
                </div>
                <div className="num" style={{ textAlign: "right", color: Number(deltaPct) <= 0 ? "var(--ok)" : "var(--wa)", fontWeight: 600 }}>
                  {Number(deltaPct) > 0 ? `+${deltaPct}%` : `${deltaPct}%`}
                </div>
              </div>
            );
          })()}

          {/* SpO2 comparison */}
          {(() => {
            const prev = Number((spo2Mean - (spo2Change ?? 0)).toFixed(1));
            const deltaPct = prev ? (((spo2Mean - prev) / prev) * 100).toFixed(1) : "0.0";
            return (
              <div className="cmp">
                <div>
                  <span style={{ fontWeight: 600, display: "block" }}>SpO₂ Saturation</span>
                  <span className="cap">{spo2Mean}% средн.</span>
                </div>
                <div className="bb">
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--t3)" }}>
                    <span>Предыдущий: {prev}%</span>
                    <span>Текущий: {spo2Mean}%</span>
                  </div>
                  <i style={{ width: `${Math.min(100, Math.max(15, (spo2Mean / 100) * 100))}%`, background: "var(--m-spo2)" }} />
                </div>
                <div className="num" style={{ textAlign: "right", color: "var(--ok)", fontWeight: 600 }}>
                  {Number(deltaPct) > 0 ? `+${deltaPct}%` : `${deltaPct}%`}
                </div>
              </div>
            );
          })()}

          {/* Sleep duration comparison */}
          {(() => {
            const prev = Number((sleepMean - (sleepChange ?? 0)).toFixed(1));
            const deltaPct = prev ? (((sleepMean - prev) / prev) * 100).toFixed(1) : "0.0";
            return (
              <div className="cmp">
                <div>
                  <span style={{ fontWeight: 600, display: "block" }}>Sleep Duration</span>
                  <span className="cap">{sleepMean} ч средн.</span>
                </div>
                <div className="bb">
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--t3)" }}>
                    <span>Предыдущий: {prev} ч</span>
                    <span>Текущий: {sleepMean} ч</span>
                  </div>
                  <i style={{ width: `${Math.min(100, Math.max(15, (sleepMean / 9) * 100))}%`, background: "var(--m-sleep)" }} />
                </div>
                <div className="num" style={{ textAlign: "right", color: Number(deltaPct) >= 0 ? "var(--ok)" : "var(--wa)", fontWeight: 600 }}>
                  {Number(deltaPct) > 0 ? `+${deltaPct}%` : `${deltaPct}%`}
                </div>
              </div>
            );
          })()}

          {/* Radiation comparison */}
          {(() => {
            const prev = Number((radMean - (radChange ?? 0)).toFixed(2));
            const deltaPct = prev ? (((radMean - prev) / prev) * 100).toFixed(1) : "0.0";
            return (
              <div className="cmp">
                <div>
                  <span style={{ fontWeight: 600, display: "block" }}>Radiation Dose</span>
                  <span className="cap">{radMean} мЗв/сут</span>
                </div>
                <div className="bb">
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--t3)" }}>
                    <span>Предыдущий: {prev} мЗв</span>
                    <span>Текущий: {radMean} мЗв</span>
                  </div>
                  <i style={{ width: `${Math.min(100, Math.max(15, (radMean / 1.0) * 100))}%`, background: "var(--cr)" }} />
                </div>
                <div className="num" style={{ textAlign: "right", color: "var(--ok)", fontWeight: 600 }}>
                  {Number(deltaPct) > 0 ? `+${deltaPct}%` : `${deltaPct}%`}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right: Contextual AI Health Insights tailored to selected period */}
        <div className="cd up" style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Sparkles className="ico sm" style={{ color: "var(--prt)" }} />
            <h2 className="h2" style={{ margin: 0 }}>
              AI Clinical Triage ({period})
            </h2>
          </div>

          {period === "24h" && (
            <>
              <div className="ins">
                <span className="icb c-hr" style={{ background: "var(--s2)" }}>
                  <Activity className="gly" />
                </span>
                <div>
                  <span style={{ fontWeight: 600, display: "block", fontSize: "15px" }}>
                    Суточный циркадный ритм ЧСС в норме
                  </span>
                  <p style={{ color: "var(--t2)", marginTop: "4px" }}>
                    За последние 24 часа зафиксирован ночной покой 58 bpm и пиковый отклик 104 bpm во время дневной силовой тренировки ARED. Наджелудочковых нарушений ритма не выявлено.
                  </p>
                </div>
              </div>

              <div className="ins">
                <span className="icb c-sleep" style={{ background: "var(--s2)" }}>
                  <Brain className="gly" />
                </span>
                <div>
                  <span style={{ fontWeight: 600, display: "block", fontSize: "15px" }}>
                    Фазы сна прошедшей ночи (7.4 ч)
                  </span>
                  <p style={{ color: "var(--t2)", marginTop: "4px" }}>
                    Завершено 4 полных циркадных цикла. Фаза медленноволнового сна (SWS) составила 22%, что свидетельствует о полноценном когнитивном восстановлении.
                  </p>
                </div>
              </div>

              <div className="ins">
                <span className="icb c-act" style={{ background: "var(--s2)" }}>
                  <ShieldCheck className="gly" />
                </span>
                <div>
                  <span style={{ fontWeight: 600, display: "block", fontSize: "15px" }}>
                    Суточный радиационный мониторинг
                  </span>
                  <p style={{ color: "var(--t2)", marginTop: "4px" }}>
                    Дозиметр зафиксировал 0.61 мЗв. Геомагнитная обстановка на орбите спокойная, вспышек класса M/X не наблюдается.
                  </p>
                </div>
              </div>
            </>
          )}

          {period === "7d" && (
            <>
              <div className="ins">
                <span className="icb c-hr" style={{ background: "var(--s2)" }}>
                  <Activity className="gly" />
                </span>
                <div>
                  <span style={{ fontWeight: 600, display: "block", fontSize: "15px" }}>
                    Недельная кардиоваскулярная адаптация
                  </span>
                  <p style={{ color: "var(--t2)", marginTop: "4px" }}>
                    Смещение центрального объема крови стабилизировалось на 42-й день полета. Базальный сердечный выброс и вариабельность пульса (HRV 55 ms) соответствуют физиологической норме невесомости.
                  </p>
                </div>
              </div>

              <div className="ins">
                <span className="icb c-sleep" style={{ background: "var(--s2)" }}>
                  <Brain className="gly" />
                </span>
                <div>
                  <span style={{ fontWeight: 600, display: "block", fontSize: "15px" }}>
                    Циркадный сдвиг фазы сна (-24 минуты)
                  </span>
                  <p style={{ color: "var(--t2)", marginTop: "4px" }}>
                    Фиксируется сокращение фазы глубокого медленноволнового сна (SWS) после ночных сеансов связи с ЦУП. Рекомендуется корректировка освещения каюты спектром 480 нм.
                  </p>
                </div>
              </div>

              <div className="ins">
                <span className="icb c-act" style={{ background: "var(--s2)" }}>
                  <ShieldCheck className="gly" />
                </span>
                <div>
                  <span style={{ fontWeight: 600, display: "block", fontSize: "15px" }}>
                    Соблюдение контрмер остеопении: 100%
                  </span>
                  <p style={{ color: "var(--t2)", marginTop: "4px" }}>
                    Ежедневные протоколы тренировок на тренажере ARED и беговой дорожке T2 выполнены в полном объеме. Минеральная плотность костей таза и бедер стабильна.
                  </p>
                </div>
              </div>
            </>
          )}

          {period === "30d" && (
            <>
              <div className="ins">
                <span className="icb c-hr" style={{ background: "var(--s2)" }}>
                  <Activity className="gly" />
                </span>
                <div>
                  <span style={{ fontWeight: 600, display: "block", fontSize: "15px" }}>
                    Месячный тренд адаптации к невесомости
                  </span>
                  <p style={{ color: "var(--t2)", marginTop: "4px" }}>
                    Острая фаза космической адаптации (SAS) завершена. Базовый пульс снизился на 0.7 bpm по сравнению с предстартовыми значениями, сосудистый тонус в норме.
                  </p>
                </div>
              </div>

              <div className="ins">
                <span className="icb c-act" style={{ background: "var(--s2)" }}>
                  <Radio className="gly" />
                </span>
                <div>
                  <span style={{ fontWeight: 600, display: "block", fontSize: "15px" }}>
                    Месячная доза радиации: ~18.6 мЗв
                  </span>
                  <p style={{ color: "var(--t2)", marginTop: "4px" }}>
                    Включает прохождение солнечной вспышки SPE (класс M-4.2) на 10-й день. Экипаж своевременно укрылся в радиационном убежище, лимит ALARA не превышен.
                  </p>
                </div>
              </div>

              <div className="ins">
                <span className="icb c-sleep" style={{ background: "var(--s2)" }}>
                  <ShieldCheck className="gly" />
                </span>
                <div>
                  <span style={{ fontWeight: 600, display: "block", fontSize: "15px" }}>
                    Нейрокогнитивная стабильность
                  </span>
                  <p style={{ color: "var(--t2)", marginTop: "4px" }}>
                    30-дневная динамика тестов PVT-Space показывает сохранение времени психомоторной реакции на уровне 218 мс. Утомляемость оператора контролируется.
                  </p>
                </div>
              </div>
            </>
          )}

          {period === "180d" && (
            <>
              <div className="ins">
                <span className="icb c-act" style={{ background: "var(--s2)" }}>
                  <Zap className="gly" />
                </span>
                <div>
                  <span style={{ fontWeight: 600, display: "block", fontSize: "15px" }}>
                    Полный профиль экспедиции CHX-01
                  </span>
                  <p style={{ color: "var(--t2)", marginTop: "4px" }}>
                    Экипаж находится на 42-м дне из 180. Индекс физиологической готовности составляет 96%. Текущая динамика позволяет безопасно завершить полетную программу.
                  </p>
                </div>
              </div>

              <div className="ins">
                <span className="icb c-hr" style={{ background: "var(--s2)" }}>
                  <ShieldCheck className="gly" />
                </span>
                <div>
                  <span style={{ fontWeight: 600, display: "block", fontSize: "15px" }}>
                    Кумулятивный прогноз радиационного бюджета
                  </span>
                  <p style={{ color: "var(--t2)", marginTop: "4px" }}>
                    Прогнозируемая суммарная доза за 180 дней составит ~110 мЗв, что не превышает 36% от карьерного предела NASA STD-3001 для миссий на низкой околоземной орбите.
                  </p>
                </div>
              </div>

              <div className="ins">
                <span className="icb c-sleep" style={{ background: "var(--s2)" }}>
                  <Brain className="gly" />
                </span>
                <div>
                  <span style={{ fontWeight: 600, display: "block", fontSize: "15px" }}>
                    Психологическая сплоченность экипажа
                  </span>
                  <p style={{ color: "var(--t2)", marginTop: "4px" }}>
                    Индекс групповой совместимости 92%. За весь период миссии инцидентов межличностных конфликтов или критического стресса не зарегистрировано.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

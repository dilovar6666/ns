import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Droplets,
  Moon,
  Footprints,
  ChevronRight,
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  Activity,
  Flame,
  Radio,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { Astronaut, Metric, Notification, Report } from "../api";
import { latest } from "../api";
import { useLanguage } from "../context/LanguageContext";

type Props = {
  astronaut?: Astronaut;
  crew: Astronaut[];
  metrics: Metric[];
  notifications: Notification[];
  onSelectAstronaut: (id: number) => void;
  onMarkNotificationRead: (id: number) => void;
};

export function DashboardView({
  astronaut,
  crew,
  metrics,
  notifications,
  onSelectAstronaut,
  onMarkNotificationRead,
}: Props) {
  const { t, language } = useLanguage();
  const [selectedMetricKey, setSelectedMetricKey] = useState<string>("heart_rate");
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("24h");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    value: number;
    time: string;
  } | null>(null);

  const days = period === "24h" ? 1 : period === "7d" ? 7 : 30;

  // Fetch report data dynamically when astronaut or period changes
  useEffect(() => {
    if (!astronaut?.id) return;
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
        console.error("Dashboard report fetch error:", err);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [astronaut?.id, days]);

  // Telemetry extraction
  const latestList = useMemo(() => latest(metrics), [metrics]);
  const hrLatest = latestList.find((m) => m.key === "heart_rate")?.value ?? 72;
  const spo2Latest = latestList.find((m) => m.key === "spo2")?.value ?? 98;
  const sleepLatest = latestList.find((m) => m.key === "sleep_duration")?.value ?? 7.1;
  const stepsLatest = latestList.find((m) => m.key === "activity")?.value ?? 78;
  const tempLatest = latestList.find((m) => m.key === "core_temp")?.value ?? 36.6;

  // Report statistics for selected period
  const hrStat = report?.metrics?.heart_rate;
  const spo2Stat = report?.metrics?.spo2;
  const sleepStat = report?.metrics?.sleep_duration;
  const actStat = report?.metrics?.activity;

  // Period values: for 24h show latest/current, for 7d and 30d show period mean
  const hrVal = period === "24h" ? Math.round(hrLatest) : hrStat?.mean ? Number(hrStat.mean.toFixed(1)) : 68.2;
  const spo2Val = period === "24h" ? Math.round(spo2Latest) : spo2Stat?.mean ? Number(spo2Stat.mean.toFixed(1)) : 98.1;
  const sleepVal = period === "24h" ? sleepLatest : sleepStat?.mean ? Number(sleepStat.mean.toFixed(1)) : 7.2;
  const actVal = period === "24h" ? Math.round(stepsLatest * 105) : actStat?.mean ? Math.round(actStat.mean * 105) : 8190;

  // Unread alerts count
  const unreadCount = notifications.filter((n) => !n.read).length;
  const recentAlerts = notifications.slice(0, 3);

  // Dynamic sparkline data extraction from series
  const sparklineData = useMemo(() => {
    const getValues = (key: string, defaultVals: number[]) => {
      if (!report?.series) return defaultVals;
      const pts = report.series.filter((s) => s.key === key);
      if (pts.length < 5) return defaultVals;
      const step = Math.max(1, Math.floor(pts.length / 7));
      const sampled = [];
      for (let i = 0; i < pts.length; i += step) {
        sampled.push(pts[i].value);
        if (sampled.length === 7) break;
      }
      return sampled;
    };

    return {
      heart_rate: getValues("heart_rate", [64, 68, 72, 69, 74, 71, 72]),
      spo2: getValues("spo2", [98, 98, 97.5, 98.5, 98, 98.2, 98]),
      sleep_duration: getValues("sleep_duration", [6.8, 7.2, 7.5, 6.9, 7.1, 7.4, 7.1]),
      activity: getValues("activity", [70, 85, 92, 65, 88, 79, 82]),
    };
  }, [report?.series]);

  const getMetricColor = (key: string) => {
    switch (key) {
      case "heart_rate": return "var(--hr)";
      case "spo2": return "var(--o2)";
      case "sleep_duration": return "var(--sl)";
      case "activity": return "var(--ac)";
      default: return "var(--pr)";
    }
  };

  // Detailed information for active metric
  const metricDetails: Record<
    string,
    {
      name: string;
      unit: string;
      nominalText: string;
      value: string | number;
      minVal: number;
      maxVal: number;
      change: number | null;
      normBand: [number, number];
    }
  > = {
    heart_rate: {
      name: language === "ru" ? "Пульс (ЧСС)" : "Heart Rate",
      unit: "bpm",
      nominalText: language === "ru" ? "Норма: 60-100 bpm" : "Nominal: 60-100 bpm",
      value: hrVal,
      minVal: hrStat?.min ? Math.round(hrStat.min) : 58,
      maxVal: hrStat?.max ? Math.round(hrStat.max) : 78,
      change: hrStat?.change_vs_previous ?? 0.3,
      normBand: [60, 100],
    },
    spo2: {
      name: language === "ru" ? "Кислород (SpO₂)" : "Oxygen Saturation",
      unit: "%",
      nominalText: language === "ru" ? "Норма: 95-100%" : "Nominal: 95-100%",
      value: spo2Val,
      minVal: spo2Stat?.min ? Number(spo2Stat.min.toFixed(1)) : 97.2,
      maxVal: spo2Stat?.max ? Number(spo2Stat.max.toFixed(1)) : 99.4,
      change: spo2Stat?.change_vs_previous ?? 0.1,
      normBand: [95, 100],
    },
    sleep_duration: {
      name: language === "ru" ? "Длительность сна" : "Sleep Duration",
      unit: language === "ru" ? "ч" : "h",
      nominalText: language === "ru" ? "Цель: 7.0-9.0 ч/сут" : "Goal: 7.0-9.0 h/day",
      value: sleepVal,
      minVal: sleepStat?.min ? Number(sleepStat.min.toFixed(1)) : 6.2,
      maxVal: sleepStat?.max ? Number(sleepStat.max.toFixed(1)) : 8.4,
      change: sleepStat?.change_vs_previous ?? -0.3,
      normBand: [7.0, 9.0],
    },
    activity: {
      name: language === "ru" ? "Физическая активность" : "Physical Activity",
      unit: language === "ru" ? "шагов" : "steps",
      nominalText: language === "ru" ? "Цель: 10 000 шагов" : "Goal: 10,000 steps",
      value: Math.round(actVal).toLocaleString(),
      minVal: actStat?.min ? Math.round(actStat.min * 105) : 5200,
      maxVal: actStat?.max ? Math.round(actStat.max * 105) : 11500,
      change: actStat?.change_vs_previous ? Math.round(actStat.change_vs_previous * 105) : 320,
      normBand: [6000, 12000],
    },
  };

  const activeInfo = metricDetails[selectedMetricKey] || metricDetails.heart_rate;

  // Filter series for the active metric
  const chartSeries = useMemo(() => {
    if (!report?.series) return [];
    return report.series
      .filter((s) => s.key === selectedMetricKey)
      .map((s) => ({
        ...s,
        // Scale activity to steps if selected
        displayValue: selectedMetricKey === "activity" ? Math.round(s.value * 105) : s.value,
      }))
      .sort((a, b) => new Date(a.sampled_at).getTime() - new Date(b.sampled_at).getTime());
  }, [report?.series, selectedMetricKey]);

  // Compute SVG plot dimensions and coordinates
  const chartConfig = useMemo(() => {
    const W = 620;
    const H = 220;
    const padL = 44;
    const padR = 24;
    const padT = 24;
    const padB = 36;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    if (!chartSeries || chartSeries.length === 0) {
      // Fallback sinusoidal curve
      const fallbackPoints = [];
      const count = period === "24h" ? 24 : period === "7d" ? 14 : 30;
      for (let i = 0; i < count; i++) {
        const fracX = i / (count - 1);
        const x = padL + fracX * plotW;
        const val =
          selectedMetricKey === "heart_rate"
            ? 68 + Math.sin(i * 0.5) * 6
            : selectedMetricKey === "spo2"
            ? 98.2 + Math.sin(i * 0.4) * 0.8
            : selectedMetricKey === "sleep_duration"
            ? 7.2 + Math.sin(i * 0.6) * 0.6
            : 8200 + Math.sin(i * 0.5) * 1500;
        fallbackPoints.push({ x, y: padT + (0.5 + Math.sin(i * 0.5) * 0.3) * plotH, value: val, time: `t-${i}` });
      }

      let pathD = `M ${fallbackPoints[0].x} ${fallbackPoints[0].y}`;
      for (let i = 1; i < fallbackPoints.length; i++) {
        const prev = fallbackPoints[i - 1];
        const cur = fallbackPoints[i];
        const cx = (prev.x + cur.x) / 2;
        pathD += ` C ${cx} ${prev.y}, ${cx} ${cur.y}, ${cur.x} ${cur.y}`;
      }
      const areaD = `${pathD} L ${fallbackPoints[fallbackPoints.length - 1].x} ${H - padB} L ${fallbackPoints[0].x} ${H - padB} Z`;

      return { W, H, padL, padR, padT, padB, plotW, plotH, points: fallbackPoints, pathD, areaD, minY: 60, maxY: 100, xLabels: [] };
    }

    const values = chartSeries.map((s) => s.displayValue);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const span = Math.max(rawMax - rawMin, 1);

    const minY = Number((rawMin - span * 0.15).toFixed(1));
    const maxY = Number((rawMax + span * 0.15).toFixed(1));

    const points = chartSeries.map((s, idx) => {
      const fracX = chartSeries.length === 1 ? 0.5 : idx / (chartSeries.length - 1);
      const fracY = Math.max(0, Math.min(1, (s.displayValue - minY) / (maxY - minY)));
      const x = padL + fracX * plotW;
      const y = padT + (1 - fracY) * plotH;
      const d = new Date(s.sampled_at);
      const timeStr =
        period === "24h"
          ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : period === "7d"
          ? `${d.toLocaleDateString([], { weekday: "short" })}, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
          : d.toLocaleDateString([], { month: "short", day: "numeric" });
      return { x, y, value: s.displayValue, time: timeStr };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      const cx = (prev.x + cur.x) / 2;
      pathD += ` C ${cx} ${prev.y}, ${cx} ${cur.y}, ${cur.x} ${cur.y}`;
    }

    const last = points[points.length - 1];
    const areaD = `${pathD} L ${last.x} ${H - padB} L ${points[0].x} ${H - padB} Z`;

    // Generate 4-5 X-axis label points (or 3 on narrow screens to prevent overlap)
    const isMobile = typeof window !== "undefined" && window.innerWidth < 520;
    const maxLabels = isMobile ? 3 : 5;
    const step = Math.max(1, Math.floor((points.length - 1) / (maxLabels - 1)));
    const xLabels = [];
    for (let i = 0; i < points.length; i += step) {
      xLabels.push(points[i]);
      if (xLabels.length >= maxLabels) break;
    }
    if (xLabels[xLabels.length - 1] !== last) {
      xLabels[xLabels.length - 1] = last;
    }

    return { W, H, padL, padR, padT, padB, plotW, plotH, points, pathD, areaD, minY, maxY, xLabels };
  }, [chartSeries, period, selectedMetricKey]);

  // Overall Status dynamic calculation
  const statusItems = useMemo(() => {
    const hrOk = hrLatest >= 60 && hrLatest <= 100;
    const spo2Ok = spo2Latest >= 95;
    const actOk = stepsLatest >= 60;
    const sleepOk = sleepLatest >= 7.0;
    const tempOk = tempLatest >= 36.4 && tempLatest <= 37.4;

    const items = [
      {
        name: "Heart Rate",
        status: hrOk ? (language === "ru" ? "В норме" : "Nominal") : language === "ru" ? "Вне нормы" : "Out of range",
        ok: hrOk,
        level: hrOk ? "ok" : "wa",
      },
      {
        name: "Oxygen Saturation",
        status: spo2Ok ? (language === "ru" ? "В норме" : "Nominal") : language === "ru" ? "Гипоксия" : "Hypoxia warning",
        ok: spo2Ok,
        level: spo2Ok ? "ok" : "cr",
      },
      {
        name: "Physical Activity",
        status: actOk ? (language === "ru" ? "В норме" : "Nominal") : language === "ru" ? "Ниже нормы" : "Below target",
        ok: actOk,
        level: actOk ? "ok" : "wa",
      },
      {
        name: "Sleep Architecture",
        status: sleepOk ? (language === "ru" ? "В норме" : "Nominal") : language === "ru" ? "Требует внимания" : "Attention required",
        ok: sleepOk,
        level: sleepOk ? "ok" : "wa",
      },
      {
        name: "Core Temperature",
        status: `${tempLatest.toFixed(1)} °C`,
        ok: tempOk,
        level: "ok",
      },
    ];

    const inRange = items.filter((i) => i.ok).length;
    return { items, inRange };
  }, [hrLatest, spo2Latest, stepsLatest, sleepLatest, tempLatest, language]);

  return (
    <div className="wrapc">
      {/* Top Header */}
      <header className="tb tbx">
        <div className="up">
          <p className="eyb">Демо-миссия CHX-01 · День 42 из 180</p>
          <h1 className="lt disp">
            Здравствуйте, {astronaut?.name || "Алекс"}
          </h1>
          <p className="sub">
            <span className="live"></span>
            {statusItems.inRange} из 5 биомаркеров в целевом диапазоне
            {statusItems.inRange < 5 ? (sleepLatest < 7.0 ? ", сон требует внимания" : ", требуется наблюдение") : ", все показатели в норме"}
          </p>
        </div>
        <div className="tbr up" style={{ animationDelay: "60ms" }}>
          {/* Crew Switcher */}
          {crew.length > 1 && (
            <select
              className="inp"
              value={astronaut?.id}
              onChange={(e) => onSelectAstronaut(Number(e.target.value))}
              aria-label="Выбрать астронавта"
              style={{ fontWeight: 600 }}
            >
              {crew.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.callsign})
                </option>
              ))}
            </select>
          )}
          <Link
            className="ib"
            to="/alerts"
            aria-label={`Уведомления: ${unreadCount} непрочитанных`}
          >
            <Bell className="ico" />
            {unreadCount > 0 && <span className="dot"></span>}
          </Link>
          <Link
            className="av"
            to="/profile"
            aria-label={`Профиль: ${astronaut?.name || "Алекс Нова"}`}
            style={{ width: "40px", height: "40px" }}
          >
            {astronaut?.name?.slice(0, 2).toUpperCase() || "АН"}
          </Link>
        </div>
      </header>

      <p className="cap" style={{ margin: "-8px 0 12px" }}>
        Нажмите на показатель, чтобы открыть его детальный график и аналитику
      </p>

      {/* 4 Metric Cards */}
      <section className="mrow" aria-label="Ключевые показатели">
        {/* Heart Rate */}
        <button
          className={`mc up ${selectedMetricKey === "heart_rate" ? "on" : ""}`}
          style={{ "--c": "var(--hr)" } as React.CSSProperties}
          onClick={() => setSelectedMetricKey("heart_rate")}
          aria-pressed={selectedMetricKey === "heart_rate"}
        >
          <span className="mh">
            <span className="lbl c-hr">
              <svg className="gly" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 20.6 4.5 13.3a4.9 4.9 0 0 1 0-7.1 5 5 0 0 1 7.1 0l.4.4.4-.4a5 5 0 0 1 7.1 0 4.9 4.9 0 0 1 0 7.1Z" />
              </svg>
              Heart Rate
            </span>
            <span className="cap num">
              {period === "24h" ? "14:32" : period === "7d" ? "7 дней" : "30 дней"}
            </span>
          </span>
          <span className="mb">
            <span className="mv num">
              <b>{Math.round(hrVal)}</b>
              <em>bpm</em>
            </span>
            <span className="spk" aria-hidden="true">
              {sparklineData.heart_rate.map((val, i) => {
                const max = Math.max(...sparklineData.heart_rate, 85);
                const min = Math.min(...sparklineData.heart_rate, 55);
                const hPct = Math.max(25, Math.min(100, ((val - min) / (max - min || 1)) * 100));
                return (
                  <i
                    key={i}
                    className="gr"
                    style={{
                      height: `${hPct}%`,
                      opacity: 0.4 + i * 0.1,
                      background: "var(--m-hr)",
                    }}
                  />
                );
              })}
            </span>
          </span>
        </button>

        {/* Oxygen Saturation */}
        <button
          className={`mc up ${selectedMetricKey === "spo2" ? "on" : ""}`}
          style={{ "--c": "var(--o2)" } as React.CSSProperties}
          onClick={() => setSelectedMetricKey("spo2")}
          aria-pressed={selectedMetricKey === "spo2"}
        >
          <span className="mh">
            <span className="lbl c-spo2">
              <svg className="gly" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.6s6.7 7.1 6.7 12.1a6.7 6.7 0 0 1-13.4 0C5.3 9.7 12 2.6 12 2.6Z" />
              </svg>
              Oxygen Saturation
            </span>
            <span className="cap num">
              {period === "24h" ? "14:30" : period === "7d" ? "7 дней" : "30 дней"}
            </span>
          </span>
          <span className="mb">
            <span className="mv num">
              <b>{typeof spo2Val === "number" ? spo2Val.toFixed(period === "24h" ? 0 : 1) : spo2Val}</b>
              <em>%</em>
            </span>
            <span className="spk" aria-hidden="true">
              {sparklineData.spo2.map((val, i) => {
                const max = Math.max(...sparklineData.spo2, 99.5);
                const min = Math.min(...sparklineData.spo2, 96.5);
                const hPct = Math.max(30, Math.min(100, ((val - min) / (max - min || 1)) * 100));
                return (
                  <i
                    key={i}
                    className="gr"
                    style={{
                      height: `${hPct}%`,
                      opacity: 0.4 + i * 0.1,
                      background: "var(--m-spo2)",
                    }}
                  />
                );
              })}
            </span>
          </span>
        </button>

        {/* Sleep */}
        <button
          className={`mc up ${selectedMetricKey === "sleep_duration" ? "on" : ""}`}
          style={{ "--c": "var(--sl)" } as React.CSSProperties}
          onClick={() => setSelectedMetricKey("sleep_duration")}
          aria-pressed={selectedMetricKey === "sleep_duration"}
        >
          <span className="mh">
            <span className="lbl c-sleep">
              <svg className="gly" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.7 14.5A8.7 8.7 0 1 1 9.5 3.3a7.1 7.1 0 0 0 11.2 11.2Z" />
              </svg>
              Sleep
            </span>
            <span className={`st ${sleepVal < 7.0 ? "wa" : "ok"}`} style={{ fontSize: "12px" }}>
              <i></i>
              {sleepVal < 7.0 ? "Внимание" : "В норме"}
            </span>
          </span>
          <span className="mb">
            <span className="mv num">
              <b>{typeof sleepVal === "number" ? sleepVal.toFixed(1) : sleepVal}</b>
              <em>ч</em>
            </span>
            <span className="spk" aria-hidden="true">
              {sparklineData.sleep_duration.map((val, i) => {
                const max = Math.max(...sparklineData.sleep_duration, 8.5);
                const min = Math.min(...sparklineData.sleep_duration, 5.5);
                const hPct = Math.max(25, Math.min(100, ((val - min) / (max - min || 1)) * 100));
                return (
                  <i
                    key={i}
                    className="gr"
                    style={{
                      height: `${hPct}%`,
                      opacity: 0.4 + i * 0.1,
                      background: "var(--m-sleep)",
                    }}
                  />
                );
              })}
            </span>
          </span>
        </button>

        {/* Physical Activity */}
        <button
          className={`mc up ${selectedMetricKey === "activity" ? "on" : ""}`}
          style={{ "--c": "var(--ac)" } as React.CSSProperties}
          onClick={() => setSelectedMetricKey("activity")}
          aria-pressed={selectedMetricKey === "activity"}
        >
          <span className="mh">
            <span className="lbl c-act">
              <svg className="gly" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.3 2.8c2 0 3 1.9 3 4.4 0 2.2-.9 3.7-1 5.3l-4.6.5C5.4 11 5 9.4 5 7.6c0-2.7 1.3-4.8 3.3-4.8Z" />
                <path d="M5.9 14.2l4.4-.5.1 1.9a2.2 2.2 0 0 1-4.3.6Z" />
                <path d="M15.7 6.6c2 0 3.3 2.1 3.3 4.8 0 1.8-.4 3.4-.7 5.2l-4.6-.5c-.1-1.6-1-3.1-1-5.3 0-2.5 1-4.2 3-4.2Z" />
                <path d="M18.1 17.9l-4.4-.5-.1 1.9a2.2 2.2 0 0 0 4.3.6Z" />
              </svg>
              Physical Activity
            </span>
            <span className="cap num">
              {period === "24h" ? "14:00" : period === "7d" ? "7 дней" : "30 дней"}
            </span>
          </span>
          <span className="mb">
            <span className="mv num">
              <b>{Math.round(actVal).toLocaleString()}</b>
              <em>шагов</em>
            </span>
            <span className="spk" aria-hidden="true">
              {sparklineData.activity.map((val, i) => {
                const max = Math.max(...sparklineData.activity, 110);
                const min = Math.min(...sparklineData.activity, 50);
                const hPct = Math.max(25, Math.min(100, ((val - min) / (max - min || 1)) * 100));
                return (
                  <i
                    key={i}
                    className="gr"
                    style={{
                      height: `${hPct}%`,
                      opacity: 0.4 + i * 0.1,
                      background: "var(--m-act)",
                    }}
                  />
                );
              })}
            </span>
          </span>
        </button>
      </section>

      {/* Middle Grid (Chart + Overall Status) */}
      <section className="g2">
        {/* Dynamic Metric Graph Card */}
        <div
          className="cd up"
          style={{ padding: "20px 22px 20px", animationDelay: "200ms" }}
          aria-label="Health Overview"
        >
          <div className="ch">
            <span
              className="lbl"
              style={{
                color: getMetricColor(selectedMetricKey),
                fontWeight: 700,
                fontSize: "15px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: getMetricColor(selectedMetricKey),
                  display: "inline-block",
                }}
              />
              {activeInfo.name}
            </span>
            <div className="flt">
              {(["24h", "7d", "30d"] as const).map((p) => (
                <button
                  key={p}
                  className={period === p ? "on" : ""}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "12px",
              margin: "18px 0 22px",
            }}
          >
            <div>
              <div className="cap" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>
                  {period === "24h"
                    ? (language === "ru" ? "Текущее значение (24 часа)" : "Current reading (24h)")
                    : period === "7d"
                    ? (language === "ru" ? "Среднее за 7 дней" : "7-day average")
                    : (language === "ru" ? "Среднее за 30 дней" : "30-day average")}
                </span>
                {activeInfo.change !== null && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "2px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: activeInfo.change >= 0 ? "var(--ok)" : "var(--wa)",
                    }}
                  >
                    {activeInfo.change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {activeInfo.change > 0 ? `+${activeInfo.change}` : activeInfo.change} {activeInfo.unit}
                  </span>
                )}
              </div>
              <div className="big num" style={{ marginTop: "2px" }}>
                <b>{activeInfo.value}</b>
                <em>{activeInfo.unit}</em>
              </div>
              <div className="cap num" style={{ marginTop: "4px", color: "var(--t3)", fontSize: "12px" }}>
                {activeInfo.nominalText} · Мин: <b>{activeInfo.minVal}</b> / Макс: <b>{activeInfo.maxVal}</b> {activeInfo.unit}
              </div>
            </div>
            <Link
              className="btn-primary"
              to="/monitoring"
              style={{ fontSize: "14px", padding: "8px 16px" }}
            >
              Подробнее в мониторинге <ChevronRight className="ico sm" />
            </Link>
          </div>

          {/* SVG Telemetry Chart */}
          <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
            <div
              className="plot"
              style={{
                width: "100%",
                height: "220px",
                position: "relative",
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {/* Target Physiological Band */}
              <div
                className="band"
                style={{
                  top: "22%",
                  bottom: "22%",
                  background: "rgba(52, 199, 89, 0.05)",
                  borderTop: "1px dashed rgba(52, 199, 89, 0.35)",
                  borderBottom: "1px dashed rgba(52, 199, 89, 0.35)",
                }}
              />
              {[0, 25, 50, 75, 100].map((pct) => (
                <div
                  key={pct}
                  className="gl"
                  style={{ top: `${pct}%`, position: "absolute", left: 0, right: 0 }}
                />
              ))}

              {/* Data curve / points */}
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${chartConfig.W} ${chartConfig.H}`}
                preserveAspectRatio="none"
                style={{ position: "absolute", inset: 0, overflow: "visible" }}
              >
                <defs>
                  <linearGradient id="plotGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={getMetricColor(selectedMetricKey)} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={getMetricColor(selectedMetricKey)} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Area under curve */}
                {chartConfig.areaD && (
                  <path
                    d={chartConfig.areaD}
                    fill="url(#plotGrad)"
                    style={{ transition: "d 0.35s ease" }}
                  />
                )}

                {/* Spline Curve */}
                {chartConfig.pathD && (
                  <path
                    d={chartConfig.pathD}
                    fill="none"
                    stroke={getMetricColor(selectedMetricKey)}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transition: "d 0.35s ease" }}
                  />
                )}

                {/* Data Points */}
                {chartConfig.points.map((pt, i) => (
                  <g key={i}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={i === chartConfig.points.length - 1 ? 5 : 3.5}
                      fill={getMetricColor(selectedMetricKey)}
                      stroke="#111"
                      strokeWidth="1.5"
                      style={{ cursor: "pointer", transition: "all 0.25s ease" }}
                      onMouseEnter={() => setHoveredPoint(pt)}
                    />
                  </g>
                ))}

                {/* Pulsing indicator at latest point */}
                {chartConfig.points.length > 0 && (
                  <circle
                    cx={chartConfig.points[chartConfig.points.length - 1].x}
                    cy={chartConfig.points[chartConfig.points.length - 1].y}
                    r="8"
                    fill="none"
                    stroke={getMetricColor(selectedMetricKey)}
                    strokeWidth="1.5"
                    opacity="0.6"
                    className="pulse-ring"
                  />
                )}
              </svg>

              {/* Tooltip on hover */}
              {hoveredPoint && (
                <div
                  style={{
                    position: "absolute",
                    left: `${(hoveredPoint.x / chartConfig.W) * 100}%`,
                    top: `${hoveredPoint.y - 12}px`,
                    transform: "translate(-50%, -100%)",
                    background: "rgba(18, 22, 28, 0.94)",
                    border: `1px solid ${getMetricColor(selectedMetricKey)}`,
                    borderRadius: "8px",
                    padding: "6px 10px",
                    fontSize: "12px",
                    pointerEvents: "none",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.5)",
                    zIndex: 10,
                    whiteSpace: "nowrap",
                  }}
                >
                  <div style={{ color: "var(--t3)", fontSize: "11px" }}>{hoveredPoint.time}</div>
                  <div style={{ fontWeight: 700, color: "var(--t1)", marginTop: "2px" }}>
                    {typeof hoveredPoint.value === "number" ? hoveredPoint.value.toFixed(1) : hoveredPoint.value} {activeInfo.unit}
                  </div>
                </div>
              )}
            </div>

            {/* X-axis time marks */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0 44px 0 44px",
                fontSize: "11px",
                color: "var(--t3)",
                fontWeight: 600,
                marginTop: "4px",
              }}
            >
              {chartConfig.xLabels.map((lbl, idx) => (
                <span key={idx}>{lbl.time}</span>
              ))}
            </div>
          </div>

          <div
            className="lgd"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px 20px",
              marginTop: "16px",
              fontSize: "13px",
              color: "var(--t2)",
            }}
          >
            <span>
              <i
                style={{
                  width: "16px",
                  display: "inline-block",
                  borderTop: "1.5px dashed rgba(52, 199, 89, 0.6)",
                  marginRight: "6px",
                }}
              />
              Целевой физиологический диапазон
            </span>
            <span>
              <i
                style={{
                  width: "16px",
                  display: "inline-block",
                  borderTop: "1.5px dashed var(--wa)",
                  marginRight: "6px",
                }}
              />
              Порог предупреждения
            </span>
            <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--t3)" }}>
              {loading ? "Синхронизация..." : `Точек телеметрии: ${chartConfig.points.length}`}
            </span>
          </div>
        </div>

        {/* Overall Status Card */}
        <div
          className="cd up"
          style={{
            padding: "20px 22px 14px",
            display: "flex",
            flexDirection: "column",
            animationDelay: "260ms",
          }}
          aria-label="Overall Status"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="h2" style={{ margin: 0 }}>Overall Status</h2>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "6px",
                background: statusItems.inRange >= 4 ? "rgba(52, 199, 89, 0.15)" : "rgba(255, 159, 10, 0.15)",
                color: statusItems.inRange >= 4 ? "var(--ok)" : "var(--wa)",
              }}
            >
              {statusItems.inRange >= 4 ? "НОРМА" : "ВНИМАНИЕ"}
            </span>
          </div>

          {/* Radial Donut Gauge */}
          <div style={{ display: "flex", justifyContent: "center", margin: "14px 0 8px" }}>
            <svg
              className="ring"
              width="180"
              height="180"
              viewBox="0 0 180 180"
              role="img"
              aria-label={`${statusItems.inRange} из 5 показателей в пределах нормы`}
            >
              <circle
                cx="90"
                cy="90"
                r="70"
                fill="none"
                style={{ stroke: "var(--s2)" }}
                strokeWidth="14"
              />
              <circle
                className="rg"
                cx="90"
                cy="90"
                r="70"
                fill="none"
                style={{
                  stroke: statusItems.inRange >= 4 ? "var(--ok)" : statusItems.inRange >= 3 ? "var(--wa)" : "var(--cr)",
                  transition: "stroke-dasharray 0.5s ease, stroke 0.3s ease",
                }}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${(statusItems.inRange / 5) * 439.8} 439.8`}
                transform="rotate(-90 90 90)"
              />
              <text
                x="90"
                y="96"
                textAnchor="middle"
                className="num"
                style={{ fontSize: "44px", fontWeight: 700, fill: "var(--t1)" }}
              >
                {statusItems.inRange}
                <tspan style={{ fill: "var(--t3)", fontSize: "24px" }}>/5</tspan>
              </text>
              <text
                x="90"
                y="120"
                textAnchor="middle"
                style={{ fontSize: "13px", fontWeight: 600, fill: "var(--t3)" }}
              >
                в диапазоне
              </text>
            </svg>
          </div>

          {/* 5 Biomarkers Breakdown */}
          <div style={{ marginTop: "4px" }}>
            {statusItems.items.map((item, idx) => (
              <div
                key={idx}
                className="li flat"
                style={{
                  padding: "10px 0",
                  borderBottom: idx < statusItems.items.length - 1 ? "1px solid var(--sep)" : "none",
                }}
              >
                <span style={{ flex: 1, fontSize: "14px", fontWeight: 500 }}>{item.name}</span>
                <span className={`st ${item.level}`} style={{ fontSize: "12px" }}>
                  <i></i>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Grid: Recent Activity & Recent Alerts */}
      <section className="dashboard-bottom-grid rvl">
        {/* Recent Activity */}
        <div
          className="cd up dashboard-card-constrained"
          style={{ padding: "20px 22px 14px", animationDelay: "320ms" }}
          aria-label="Recent Activity"
        >
          <div className="ch" style={{ marginBottom: "8px", width: "100%", justifyContent: "space-between" }}>
            <h2 className="h2" style={{ margin: 0 }}>Recent Activity</h2>
            <Link className="btn bt" to="/monitoring">
              Вся история
            </Link>
          </div>

          <div className="dashboard-item-row">
            <span className="icb c-hr" style={{ background: "var(--s2)", flexShrink: 0 }}>
              <Heart className="gly" />
            </span>
            <span style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>
              <span style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--t1)" }}>
                Heart Rate Telemetry
              </span>
              <span className="cap" style={{ display: "block", marginTop: "1px", fontSize: "12px", color: "var(--t3)" }}>
                Синхронизировано с биосенсора
              </span>
            </span>
            <span style={{ textAlign: "right", whiteSpace: "nowrap", flexShrink: 0 }}>
              <b className="num" style={{ display: "block", fontSize: "15px", fontWeight: 700, color: "var(--t1)" }}>
                {Math.round(hrLatest)} bpm
              </b>
              <span className="cap num" style={{ fontSize: "11px", color: "var(--t3)" }}>Сегодня, 14:32</span>
            </span>
          </div>

          <div className="dashboard-item-row">
            <span className="icb c-spo2" style={{ background: "var(--s2)", flexShrink: 0 }}>
              <Droplets className="gly" />
            </span>
            <span style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>
              <span style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--t1)" }}>
                SpO₂ Saturation
              </span>
              <span className="cap" style={{ display: "block", marginTop: "1px", fontSize: "12px", color: "var(--t3)" }}>
                Носимый пульсоксиметр
              </span>
            </span>
            <span style={{ textAlign: "right", whiteSpace: "nowrap", flexShrink: 0 }}>
              <b className="num" style={{ display: "block", fontSize: "15px", fontWeight: 700, color: "var(--t1)" }}>
                {Math.round(spo2Latest)} %
              </b>
              <span className="cap num" style={{ fontSize: "11px", color: "var(--t3)" }}>Сегодня, 14:30</span>
            </span>
          </div>

          <div className="dashboard-item-row">
            <span className="icb c-act" style={{ background: "var(--s2)", flexShrink: 0 }}>
              <Footprints className="gly" />
            </span>
            <span style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>
              <span style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--t1)" }}>
                EVA Treadmill Session
              </span>
              <span className="cap" style={{ display: "block", marginTop: "1px", fontSize: "12px", color: "var(--t3)" }}>
                Протокол сохранения костной ткани
              </span>
            </span>
            <span style={{ textAlign: "right", whiteSpace: "nowrap", flexShrink: 0 }}>
              <b className="num" style={{ display: "block", fontSize: "15px", fontWeight: 700, color: "var(--t1)" }}>
                45 мин
              </b>
              <span className="cap num" style={{ fontSize: "11px", color: "var(--t3)" }}>Сегодня, 11:15</span>
            </span>
          </div>
        </div>

        {/* Recent Alerts */}
        <div
          className="cd up dashboard-card-constrained"
          style={{ padding: "20px 22px 14px", animationDelay: "380ms" }}
          aria-label="Recent Alerts"
        >
          <div className="ch" style={{ marginBottom: "8px", width: "100%", justifyContent: "space-between" }}>
            <h2 className="h2" style={{ margin: 0 }}>Recent Alerts</h2>
            <Link className="btn bt" to="/alerts">
              Все ({notifications.length})
            </Link>
          </div>

          {recentAlerts.length === 0 ? (
            <div className="cap" style={{ padding: "20px 0", textAlign: "center" }}>
              Нет активных предупреждений
            </div>
          ) : (
            recentAlerts.map((n) => (
              <div
                key={n.id}
                className="dashboard-item-row"
                style={{ opacity: n.read ? 0.65 : 1 }}
              >
                <span
                  className={`icb ${n.level === "critical" ? "cr" : n.level === "warning" ? "wa" : "ok"}`}
                  style={{ background: "var(--s2)", flexShrink: 0 }}
                >
                  {n.level === "critical" ? (
                    <AlertTriangle className="gly" style={{ color: "var(--cr)" }} />
                  ) : n.level === "warning" ? (
                    <AlertTriangle className="gly" style={{ color: "var(--wa)" }} />
                  ) : (
                    <Info className="gly" style={{ color: "var(--pr)" }} />
                  )}
                </span>
                <span style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: n.level === "critical" ? "var(--cr)" : "var(--t1)",
                    }}
                  >
                    {n.title}
                  </span>
                  <span
                    className="cap"
                    style={{
                      display: "block",
                      marginTop: "2px",
                      fontSize: "12px",
                      lineHeight: "1.35",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      color: "var(--t3)",
                    }}
                  >
                    {n.detail}
                  </span>
                </span>
                {!n.read && (
                  <button
                    className="btn bt"
                    onClick={() => onMarkNotificationRead(n.id)}
                    style={{ fontSize: "12px", padding: "4px 8px", flexShrink: 0 }}
                  >
                    Прочитано
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Scientific Disclaimer Footer Note with comfortable clearance above bottom nav */}
      <footer style={{ marginTop: "32px", marginBottom: "40px", paddingBottom: "16px" }}>
        <p className="cap" style={{ textAlign: "center", margin: 0, fontSize: "11px", lineHeight: "1.5", color: "var(--t3)" }}>
          Демонстрационные исследовательские данные — не являются медицинским диагнозом. Концептуальный прототип CosmoHealthX для NASA Space Apps Challenge 2026.
        </p>
      </footer>
    </div>
  );
}

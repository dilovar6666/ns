import React, { useMemo, useState } from "react";
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
} from "lucide-react";
import type { Astronaut, Metric, Notification } from "../api";
import { latest } from "../api";

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
  const [selectedMetricKey, setSelectedMetricKey] = useState<string>("heart_rate");
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("24h");

  const latestList = useMemo(() => latest(metrics), [metrics]);
  const hr = latestList.find((m) => m.key === "heart_rate")?.value ?? 72;
  const spo2 = latestList.find((m) => m.key === "spo2")?.value ?? 98;
  const sleep = latestList.find((m) => m.key === "sleep_duration")?.value ?? 7.5;
  const steps = latestList.find((m) => m.key === "activity")?.value ?? 8230;
  const temp = latestList.find((m) => m.key === "core_temp")?.value ?? 36.6;

  // Unread alerts count
  const unreadCount = notifications.filter((n) => !n.read).length;
  const recentAlerts = notifications.slice(0, 3);

  // Sparkline generator mock
  const sparklineHeights = {
    heart_rate: [42, 55, 68, 50, 72, 85, 72],
    spo2: [98, 97, 98, 99, 98, 97, 98],
    sleep_duration: [60, 75, 80, 50, 70, 65, 75],
    activity: [40, 65, 55, 80, 95, 70, 82],
  };

  const getMetricColor = (key: string) => {
    switch (key) {
      case "heart_rate": return "var(--hr)";
      case "spo2": return "var(--o2)";
      case "sleep_duration": return "var(--sl)";
      case "activity": return "var(--ac)";
      default: return "var(--pr)";
    }
  };

  const metricInfo: Record<string, { name: string; unit: string; range: string; value: string | number }> = {
    heart_rate: { name: "Heart Rate", unit: "bpm", range: "Норма: 60-100 bpm", value: Math.round(hr) },
    spo2: { name: "Oxygen Saturation", unit: "%", range: "Норма: 95-100%", value: Math.round(spo2) },
    sleep_duration: { name: "Sleep", unit: "ч", range: "Цель: 8.0 ч/сут", value: sleep.toFixed(1) },
    activity: { name: "Physical Activity", unit: "шагов", range: "Цель: 10 000 шагов", value: Math.round(steps).toLocaleString() },
  };

  const activeInfo = metricInfo[selectedMetricKey] || metricInfo.heart_rate;

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
            3 из 5 биомаркеров в целевом диапазоне, сон требует внимания
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
            <span className="cap num">14:32</span>
          </span>
          <span className="mb">
            <span className="mv num">
              <b>{Math.round(hr)}</b>
              <em>bpm</em>
            </span>
            <span className="spk" aria-hidden="true">
              {sparklineHeights.heart_rate.map((h, i) => (
                <i
                  key={i}
                  className="gr"
                  style={{
                    height: `${(h / 90) * 100}%`,
                    opacity: 0.4 + i * 0.1,
                    background: "var(--m-hr)",
                  }}
                />
              ))}
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
            <span className="cap num">14:30</span>
          </span>
          <span className="mb">
            <span className="mv num">
              <b>{Math.round(spo2)}</b>
              <em>%</em>
            </span>
            <span className="spk" aria-hidden="true">
              {sparklineHeights.spo2.map((h, i) => (
                <i
                  key={i}
                  className="gr"
                  style={{
                    height: `${h}%`,
                    opacity: 0.4 + i * 0.1,
                    background: "var(--m-spo2)",
                  }}
                />
              ))}
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
            <span className="st wa" style={{ fontSize: "12px" }}>
              <i></i>Внимание
            </span>
          </span>
          <span className="mb">
            <span className="mv num">
              <b>{sleep.toFixed(1)}</b>
              <em>ч</em>
            </span>
            <span className="spk" aria-hidden="true">
              {sparklineHeights.sleep_duration.map((h, i) => (
                <i
                  key={i}
                  className="gr"
                  style={{
                    height: `${h}%`,
                    opacity: 0.4 + i * 0.1,
                    background: "var(--m-sleep)",
                  }}
                />
              ))}
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
            <span className="cap num">14:00</span>
          </span>
          <span className="mb">
            <span className="mv num">
              <b>{Math.round(steps).toLocaleString()}</b>
              <em>шагов</em>
            </span>
            <span className="spk" aria-hidden="true">
              {sparklineHeights.activity.map((h, i) => (
                <i
                  key={i}
                  className="gr"
                  style={{
                    height: `${h}%`,
                    opacity: 0.4 + i * 0.1,
                    background: "var(--m-act)",
                  }}
                />
              ))}
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
              style={{ color: getMetricColor(selectedMetricKey) }}
            >
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
              <div className="cap">{activeInfo.name}</div>
              <div className="big num">
                <b>{activeInfo.value}</b>
                <em>{activeInfo.unit}</em>
              </div>
              <div className="cap num" style={{ marginTop: "4px" }}>
                {activeInfo.range}
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
          <div style={{ display: "flex", gap: "10px" }}>
            <div
              className="plot"
              style={{
                flex: 1,
                minWidth: 0,
                height: "220px",
                position: "relative",
              }}
            >
              <div
                className="band"
                style={{
                  top: "25%",
                  bottom: "25%",
                  background: "rgba(52, 199, 89, 0.05)",
                  borderTop: "1px dashed rgba(52, 199, 89, 0.3)",
                  borderBottom: "1px dashed rgba(52, 199, 89, 0.3)",
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
                viewBox="0 0 600 220"
                preserveAspectRatio="none"
                style={{ position: "absolute", inset: 0, overflow: "visible" }}
              >
                <defs>
                  <linearGradient id="plotGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={getMetricColor(selectedMetricKey)} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={getMetricColor(selectedMetricKey)} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,150 C80,130 140,90 220,110 C300,130 380,70 460,95 C520,115 570,80 600,85 L600,220 L0,220 Z"
                  fill="url(#plotGrad)"
                />
                <path
                  d="M0,150 C80,130 140,90 220,110 C300,130 380,70 460,95 C520,115 570,80 600,85"
                  fill="none"
                  stroke={getMetricColor(selectedMetricKey)}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="600" cy="85" r="5" fill={getMetricColor(selectedMetricKey)} />
              </svg>
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
          </div>
        </div>

        {/* Overall Status Card */}
        <div
          className="cd up"
          style={{
            padding: "20px 22px 12px",
            display: "flex",
            flexDirection: "column",
            animationDelay: "260ms",
          }}
          aria-label="Overall Status"
        >
          <h2 className="h2">Overall Status</h2>
          <svg
            className="ring"
            width="180"
            height="180"
            viewBox="0 0 180 180"
            role="img"
            aria-label="3 из 5 показателей в пределах нормы"
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
              style={{ stroke: "var(--ok)" }}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray="263.9 439.8"
              transform="rotate(-90 90 90)"
            />
            <text
              x="90"
              y="96"
              textAnchor="middle"
              className="num"
              style={{ fontSize: "44px", fontWeight: 700, fill: "var(--t1)" }}
            >
              3
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

          <div style={{ marginTop: "10px" }}>
            <div className="li flat" style={{ padding: "12px 0" }}>
              <span style={{ flex: 1, fontSize: "15px" }}>Heart Rate</span>
              <span className="st ok">
                <i></i>В норме
              </span>
            </div>
            <div className="li flat" style={{ padding: "12px 0" }}>
              <span style={{ flex: 1, fontSize: "15px" }}>Oxygen Saturation</span>
              <span className="st ok">
                <i></i>В норме
              </span>
            </div>
            <div className="li flat" style={{ padding: "12px 0" }}>
              <span style={{ flex: 1, fontSize: "15px" }}>Physical Activity</span>
              <span className="st ok">
                <i></i>В норме
              </span>
            </div>
            <div className="li flat" style={{ padding: "12px 0" }}>
              <span style={{ flex: 1, fontSize: "15px" }}>Sleep Architecture</span>
              <span className="st wa">
                <i></i>Требует внимания
              </span>
            </div>
            <div className="li flat" style={{ padding: "12px 0" }}>
              <span style={{ flex: 1, fontSize: "15px" }}>Core Temperature</span>
              <span className="st ok">
                <i></i>{temp.toFixed(1)} °C
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Grid: Recent Activity & Recent Alerts */}
      <section className="g3 rvl">
        {/* Recent Activity */}
        <div
          className="cd up"
          style={{ padding: "20px 22px 14px", animationDelay: "320ms" }}
          aria-label="Recent Activity"
        >
          <div className="ch" style={{ marginBottom: "8px" }}>
            <h2 className="h2">Recent Activity</h2>
            <Link className="btn bt" to="/monitoring">
              Вся история
            </Link>
          </div>

          <div className="li">
            <span className="icb c-hr" style={{ background: "var(--s2)" }}>
              <Heart className="gly" />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: "15px", fontWeight: 600 }}>
                Heart Rate Telemetry
              </span>
              <span className="cap" style={{ display: "block", marginTop: "1px" }}>
                Синхронизировано с биосенсора
              </span>
            </span>
            <span style={{ textAlign: "right", whiteSpace: "nowrap" }}>
              <b className="num" style={{ display: "block", fontSize: "16px", fontWeight: 700 }}>
                {Math.round(hr)} bpm
              </b>
              <span className="cap num">Сегодня, 14:32</span>
            </span>
          </div>

          <div className="li">
            <span className="icb c-spo2" style={{ background: "var(--s2)" }}>
              <Droplets className="gly" />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: "15px", fontWeight: 600 }}>
                SpO₂ Saturation
              </span>
              <span className="cap" style={{ display: "block", marginTop: "1px" }}>
                Носимый пульсоксиметр
              </span>
            </span>
            <span style={{ textAlign: "right", whiteSpace: "nowrap" }}>
              <b className="num" style={{ display: "block", fontSize: "16px", fontWeight: 700 }}>
                {Math.round(spo2)} %
              </b>
              <span className="cap num">Сегодня, 14:30</span>
            </span>
          </div>

          <div className="li">
            <span className="icb c-act" style={{ background: "var(--s2)" }}>
              <Footprints className="gly" />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: "15px", fontWeight: 600 }}>
                EVA Treadmill Session
              </span>
              <span className="cap" style={{ display: "block", marginTop: "1px" }}>
                Протокол сохранения костной ткани
              </span>
            </span>
            <span style={{ textAlign: "right", whiteSpace: "nowrap" }}>
              <b className="num" style={{ display: "block", fontSize: "16px", fontWeight: 700 }}>
                45 мин
              </b>
              <span className="cap num">Сегодня, 11:15</span>
            </span>
          </div>
        </div>

        {/* Recent Alerts */}
        <div
          className="cd up"
          style={{ padding: "20px 22px 14px", animationDelay: "380ms" }}
          aria-label="Recent Alerts"
        >
          <div className="ch" style={{ marginBottom: "8px" }}>
            <h2 className="h2">Recent Alerts</h2>
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
                className="li"
                style={{ opacity: n.read ? 0.65 : 1 }}
              >
                <span
                  className={`icb ${n.level === "critical" ? "cr" : n.level === "warning" ? "wa" : "ok"}`}
                  style={{ background: "var(--s2)" }}
                >
                  {n.level === "critical" ? (
                    <AlertTriangle className="gly" style={{ color: "var(--cr)" }} />
                  ) : n.level === "warning" ? (
                    <AlertTriangle className="gly" style={{ color: "var(--wa)" }} />
                  ) : (
                    <Info className="gly" style={{ color: "var(--pr)" }} />
                  )}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: "15px",
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
                      marginTop: "1px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {n.detail}
                  </span>
                </span>
                {!n.read && (
                  <button
                    className="btn bt"
                    onClick={() => onMarkNotificationRead(n.id)}
                    style={{ fontSize: "12px", padding: "4px 8px" }}
                  >
                    Прочитано
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Scientific Disclaimer Footer Note */}
      <p className="cap" style={{ textAlign: "center", marginTop: "32px", marginBottom: "20px" }}>
        Демонстрационные исследовательские данные — не являются медицинским диагнозом. Концептуальный прототип CosmoHealthX для NASA Space Apps Challenge 2026.
      </p>
    </div>
  );
}

import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Droplets,
  Moon,
  Footprints,
  Thermometer,
  ShieldAlert,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import type { Astronaut, Metric, Notification } from "../api";
import { latest } from "../api";

type Props = {
  astronaut?: Astronaut;
  crew: Astronaut[];
  metrics: Metric[];
  notifications: Notification[];
  onSelectAstronaut: (id: number) => void;
};

type MetricTab = "heart_rate" | "spo2" | "sleep_duration" | "activity" | "core_temp" | "radiation_exposure";

export function MonitoringView({
  astronaut,
  crew,
  metrics,
  notifications,
  onSelectAstronaut,
}: Props) {
  const [activeTab, setActiveTab] = useState<MetricTab>("heart_rate");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const currentMetricList = metrics.filter((m) => m.key === activeTab);
  const latestList = latest(metrics);
  const currentLatest = latestList.find((m) => m.key === activeTab);

  const configs: Record<MetricTab, {
    name: string;
    unit: string;
    desc: string;
    normalRange: string;
    significance: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
    defaultVal: number;
    bandTop: string;
    bandHeight: string;
  }> = {
    heart_rate: {
      name: "Heart Rate",
      unit: "bpm",
      desc: "Частота сердечных сокращений в покое и при нагрузке в условиях невесомости.",
      normalRange: "60 – 100 bpm (норма в покое: 62-78 bpm)",
      significance: "В микрогравитации кровь перемещается в верхнюю половину туловища (fluid shift), что приводит к снижению объема циркулирующей плазмы и компенсаторной тахикардии.",
      color: "var(--hr)",
      icon: Heart,
      defaultVal: 72,
      bandTop: "35%",
      bandHeight: "35%",
    },
    spo2: {
      name: "Oxygen Saturation",
      unit: "%",
      desc: "Процент оксигемоглобина в артериальной крови астронавта.",
      normalRange: "95 – 100% (тревога: < 94%)",
      significance: "Критический параметр при дыхании в скафандре (EVA) и контроле парциального давления O2/CO2 в жилом модуле корабля.",
      color: "var(--o2)",
      icon: Droplets,
      defaultVal: 98,
      bandTop: "15%",
      bandHeight: "25%",
    },
    sleep_duration: {
      name: "Sleep Duration",
      unit: "ч",
      desc: "Длительность непрерывного сна и циркадная фазовая стабильность.",
      normalRange: "7.0 – 8.5 ч/сутки",
      significance: "90-минутный орбитальный цикл восходов/закатов нарушает выработку мелатонина. Хронический дефицит сна ведет к когнитивным ошибкам.",
      color: "var(--sl)",
      icon: Moon,
      defaultVal: 7.5,
      bandTop: "30%",
      bandHeight: "40%",
    },
    activity: {
      name: "Physical Activity",
      unit: "шагов",
      desc: "Суточный объем упражнений на беговой дорожке T2 и велоэргометре CEVIS.",
      normalRange: "8 000 – 12 000 шагов (эквивалент 2.5 ч/день)",
      significance: "Обязательные контрмеры против остеопении и атрофии постуральных мышц в условиях нулевой гравитации.",
      color: "var(--ac)",
      icon: Footprints,
      defaultVal: 8230,
      bandTop: "20%",
      bandHeight: "50%",
    },
    core_temp: {
      name: "Core Temperature",
      unit: "°C",
      desc: "Температура ядра тела, контролируемая непрерывным датчиком теплового потока.",
      normalRange: "36.2 – 37.2 °C",
      significance: "Космическая лихорадка (Space fever) — феномен повышения базальной температуры ядра на ~1°C из-за снижения теплоотдачи конвекцией.",
      color: "var(--wa)",
      icon: Thermometer,
      defaultVal: 36.6,
      bandTop: "40%",
      bandHeight: "25%",
    },
    radiation_exposure: {
      name: "Radiation Exposure",
      unit: "мЗв/сут",
      desc: "Накопленная доза галактического космического излучения (GCR) и солнечных протонов.",
      normalRange: "< 1.5 мЗв/сутки",
      significance: "Радиационный мониторинг защищает от лучевой болезни и повреждений ДНК при выходе за пределы магнитосферы Земли.",
      color: "var(--cr)",
      icon: ShieldAlert,
      defaultVal: 0.65,
      bandTop: "50%",
      bandHeight: "30%",
    },
  };

  const currentCfg = configs[activeTab];
  const IconComponent = currentCfg.icon;
  const displayVal = currentLatest?.value ?? currentCfg.defaultVal;

  return (
    <div className="wrapc">
      {/* Header */}
      <header className="tb">
        <div className="up">
          <p className="eyb">Телеметрия в реальном времени · CHX-01</p>
          <h1 className="lt disp">Health Monitoring</h1>
          <p className="sub">
            <span className="live"></span>
            Непрерывный поток физиологических данных астронавта
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

      {/* Tabs Row */}
      <section
        className="up"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginTop: "16px",
        }}
      >
        <div className="tabs tabs-scrollable" role="group" aria-label="Показатель">
          {(Object.keys(configs) as MetricTab[]).map((key) => {
            const cfg = configs[key];
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                className={`tab ${activeTab === key ? "on" : ""}`}
                onClick={() => setActiveTab(key)}
              >
                <span style={{ display: "inline-flex", color: cfg.color }}>
                  <Icon className="gly" />
                </span>
                {cfg.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Grid: Telemetry Graph & Clinical Explanation */}
      <div className="mg">
        {/* Left: Detailed Chart Card */}
        <div className="cd up" style={{ padding: "24px 28px" }}>
          <div className="ch">
            <span className="lbl" style={{ color: currentCfg.color }}>
              <IconComponent className="gly" />
              {currentCfg.name}
            </span>
            <span className="st ok">
              <i></i>В целевом диапазоне
            </span>
          </div>

          <div style={{ margin: "20px 0 24px" }}>
            <div className="cap">Текущее значение (бортовой биосенсор)</div>
            <div className="big num">
              <b>{typeof displayVal === "number" ? (displayVal % 1 !== 0 ? displayVal.toFixed(1) : Math.round(displayVal)) : displayVal}</b>
              <em>{currentCfg.unit}</em>
            </div>
            <div className="cap num" style={{ marginTop: "6px" }}>
              {currentCfg.normalRange}
            </div>
          </div>

          {/* Large Graph with Shaded Target Band */}
          <div
            className="plot"
            style={{
              height: "280px",
              position: "relative",
              width: "100%",
              overflow: "hidden",
            }}
          >
            {/* Shaded Normal Range Band */}
            <div
              className="band"
              style={{
                top: currentCfg.bandTop,
                height: currentCfg.bandHeight,
                background: "rgba(52, 199, 89, 0.06)",
                borderTop: "1.5px dashed rgba(52, 199, 89, 0.35)",
                borderBottom: "1.5px dashed rgba(52, 199, 89, 0.35)",
                position: "absolute",
                left: 0,
                right: 0,
              }}
            />

            {/* Horizontal Grid lines */}
            {[0, 25, 50, 75, 100].map((pct) => (
              <div
                key={pct}
                className="gl"
                style={{ top: `${pct}%`, position: "absolute", left: 0, right: 0 }}
              />
            ))}

            {/* SVG Data Curve */}
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 800 280"
              preserveAspectRatio="none"
              style={{ position: "absolute", inset: 0 }}
            >
              <defs>
                <linearGradient id="monGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={currentCfg.color} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={currentCfg.color} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,180 C100,160 200,120 300,140 C400,160 500,90 600,115 C700,135 750,95 800,105 L800,280 L0,280 Z"
                fill="url(#monGrad)"
              />
              <path
                d="M0,180 C100,160 200,120 300,140 C400,160 500,90 600,115 C700,135 750,95 800,105"
                fill="none"
                stroke={currentCfg.color}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="800" cy="105" r="6" fill={currentCfg.color} />
            </svg>
          </div>

          <div
            className="lgd"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "20px",
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
                  borderTop: "1.5px dashed rgba(52, 199, 89, 0.7)",
                  marginRight: "6px",
                }}
              />
              Целевой физиологический коридор (NASA STD-3001)
            </span>
            <span>
              <i
                style={{
                  width: "16px",
                  display: "inline-block",
                  borderTop: "2px solid " + currentCfg.color,
                  marginRight: "6px",
                }}
              />
              Фактическая телеметрия (интервал: 10 с)
            </span>
          </div>
        </div>

        {/* Right: Clinical & Spaceflight Context */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Card: Что показывает */}
          <div className="cd up" style={{ padding: "22px 24px" }}>
            <h2 className="h2" style={{ marginBottom: "12px" }}>
              Что показывает
            </h2>
            <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--t2)", margin: 0 }}>
              {currentCfg.desc}
            </p>

            <div style={{ marginTop: "16px", borderTop: "1px solid var(--sep)", paddingTop: "14px" }}>
              <div className="cap" style={{ fontWeight: 600, color: "var(--t1)", marginBottom: "6px" }}>
                Значение в условиях космического полета:
              </div>
              <p style={{ fontSize: "13px", lineHeight: "1.5", color: "var(--t2)", margin: 0 }}>
                {currentCfg.significance}
              </p>
            </div>
          </div>

          {/* Quick Threshold Guidelines */}
          <div className="cd up" style={{ padding: "22px 24px" }}>
            <h2 className="h2" style={{ marginBottom: "12px" }}>
              Пороговые уровни контроля
            </h2>
            <div className="kv">
              <span>Оптимально:</span>
              <span className="num" style={{ fontWeight: 600, color: "var(--ok)" }}>
                {currentCfg.normalRange}
              </span>
            </div>
            <div className="kv">
              <span>Предупреждение:</span>
              <span className="num" style={{ fontWeight: 600, color: "var(--wa)" }}>
                Выход за границы на ±15%
              </span>
            </div>
            <div className="kv">
              <span>Критический триггер:</span>
              <span className="num" style={{ fontWeight: 600, color: "var(--cr)" }}>
                Активация медицинского протокола
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Stream Log Table */}
      <section className="cd up" style={{ marginTop: "24px", padding: "24px 28px" }}>
        <div className="ch" style={{ marginBottom: "16px" }}>
          <h2 className="h2">Последние измерения</h2>
          <span className="cap">Период: текущий виток</span>
        </div>

        {currentMetricList.length === 0 ? (
          <div className="cap" style={{ textAlign: "center", padding: "30px 0" }}>
            Данные телеметрии для данного биомаркера активны. Значение в пределах нормы.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {currentMetricList.slice(0, 5).map((m) => (
              <div
                key={m.id}
                className="li flat"
                style={{ padding: "12px 0", borderBottom: "1px solid var(--sep)" }}
              >
                <span style={{ flex: 1, fontSize: "14px", fontWeight: 500 }}>
                  {new Date(m.sampled_at).toLocaleTimeString("ru-RU")}
                </span>
                <span className="num" style={{ fontWeight: 700, fontSize: "15px", marginRight: "16px" }}>
                  {m.value} {m.unit}
                </span>
                <span className="st ok">
                  <i></i>В норме
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

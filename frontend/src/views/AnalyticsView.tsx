import React, { useState } from "react";
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
  Bell,
} from "lucide-react";
import type { Astronaut, Metric, Notification } from "../api";

type Props = {
  astronaut?: Astronaut;
  crew: Astronaut[];
  metrics: Metric[];
  notifications: Notification[];
  onSelectAstronaut: (id: number) => void;
};

export function AnalyticsView({
  astronaut,
  crew,
  metrics,
  notifications,
  onSelectAstronaut,
}: Props) {
  const [period, setPeriod] = useState<"24h" | "7d" | "30d" | "180d">("7d");
  const [exporting, setExporting] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleExportPdf = () => {
    if (!astronaut) return;
    setExporting(true);
    // Direct link to backend PDF report endpoint
    window.open(`/api/reports/${astronaut.id}/pdf`, "_blank");
    setTimeout(() => setExporting(false), 1500);
  };

  const handleExportJson = () => {
    if (!astronaut) return;
    setExporting(true);
    window.open(`/api/reports/${astronaut.id}`, "_blank");
    setTimeout(() => setExporting(false), 1500);
  };

  return (
    <div className="wrapc">
      {/* Header */}
      <header className="tb">
        <div className="up">
          <p className="eyb">Медико-биологический анализ миссии</p>
          <h1 className="lt disp">Analytics & Trends</h1>
          <p className="sub">
            Сравнительный анализ телеметрии здоровья за выбранный временной интервал
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
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          marginTop: "16px",
        }}
      >
        <div className="flt">
          {(["24h", "7d", "30d", "180d"] as const).map((p) => (
            <button
              key={p}
              className={period === p ? "on" : ""}
              onClick={() => setPeriod(p)}
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

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="btn-secondary"
            onClick={handleExportJson}
            disabled={exporting}
            style={{ fontSize: "14px", padding: "8px 14px" }}
          >
            <Download className="ico sm" /> JSON Данные
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
      <section className="ag4" aria-label="Периодические агрегаты">
        {/* Heart Rate Mean */}
        <div className="cd up" style={{ padding: "18px 20px" }}>
          <div className="cap">Средний пульс в покое</div>
          <div className="big num" style={{ marginTop: "6px" }}>
            <b>71</b>
            <em>bpm</em>
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
            <TrendingDown className="ico sm" /> -2 bpm по сравнению с пред. периодом
          </div>
        </div>

        {/* SpO2 Mean */}
        <div className="cd up" style={{ padding: "18px 20px" }}>
          <div className="cap">Средняя сатурация SpO₂</div>
          <div className="big num" style={{ marginTop: "6px" }}>
            <b>98.4</b>
            <em>%</em>
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
            <CheckCircle className="ico sm" /> Стабильно в норме
          </div>
        </div>

        {/* Sleep Efficiency */}
        <div className="cd up" style={{ padding: "18px 20px" }}>
          <div className="cap">Эффективность сна</div>
          <div className="big num" style={{ marginTop: "6px" }}>
            <b>84</b>
            <em>%</em>
          </div>
          <div
            className="cap num"
            style={{
              marginTop: "8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "var(--wa)",
            }}
          >
            <TrendingDown className="ico sm" /> -6% (сокращение REM-фазы)
          </div>
        </div>

        {/* Energy Output */}
        <div className="cd up" style={{ padding: "18px 20px" }}>
          <div className="cap">Расход энергии (тренировки)</div>
          <div className="big num" style={{ marginTop: "6px" }}>
            <b>2&nbsp;850</b>
            <em>ккал/сут</em>
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
            <TrendingUp className="ico sm" /> 102% от целевого плана NASA
          </div>
        </div>
      </section>

      {/* Comparison Distribution Plots & Breakdown */}
      <section className="ab" style={{ marginTop: "24px" }}>
        {/* Left: Metric Comparison Progress Rows */}
        <div className="cd up" style={{ padding: "24px 28px" }}>
          <h2 className="h2" style={{ marginBottom: "16px" }}>
            Сравнение периодов (Period Comparison)
          </h2>

          {/* Heart rate comparison */}
          <div className="cmp">
            <div>
              <span style={{ fontWeight: 600, display: "block" }}>Heart Rate</span>
              <span className="cap">71 bpm средн.</span>
            </div>
            <div className="bb">
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--t3)" }}>
                <span>Предыдущий: 73 bpm</span>
                <span>Текущий: 71 bpm</span>
              </div>
              <i style={{ width: "72%", background: "var(--m-hr)" }} />
            </div>
            <div className="num" style={{ textAlign: "right", color: "var(--ok)", fontWeight: 600 }}>
              -2.7%
            </div>
          </div>

          {/* SpO2 comparison */}
          <div className="cmp">
            <div>
              <span style={{ fontWeight: 600, display: "block" }}>SpO₂ Saturation</span>
              <span className="cap">98.4% средн.</span>
            </div>
            <div className="bb">
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--t3)" }}>
                <span>Предыдущий: 98.2%</span>
                <span>Текущий: 98.4%</span>
              </div>
              <i style={{ width: "98%", background: "var(--m-spo2)" }} />
            </div>
            <div className="num" style={{ textAlign: "right", color: "var(--ok)", fontWeight: 600 }}>
              +0.2%
            </div>
          </div>

          {/* Sleep duration comparison */}
          <div className="cmp">
            <div>
              <span style={{ fontWeight: 600, display: "block" }}>Sleep Duration</span>
              <span className="cap">7.2 ч средн.</span>
            </div>
            <div className="bb">
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--t3)" }}>
                <span>Предыдущий: 7.8 ч</span>
                <span>Текущий: 7.2 ч</span>
              </div>
              <i style={{ width: "68%", background: "var(--m-sleep)" }} />
            </div>
            <div className="num" style={{ textAlign: "right", color: "var(--wa)", fontWeight: 600 }}>
              -7.7%
            </div>
          </div>

          {/* Radiation comparison */}
          <div className="cmp">
            <div>
              <span style={{ fontWeight: 600, display: "block" }}>Radiation Dose</span>
              <span className="cap">0.62 мЗв/сут</span>
            </div>
            <div className="bb">
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--t3)" }}>
                <span>Предыдущий: 0.58</span>
                <span>Текущий: 0.62</span>
              </div>
              <i style={{ width: "42%", background: "var(--cr)" }} />
            </div>
            <div className="num" style={{ textAlign: "right", color: "var(--cr)", fontWeight: 600 }}>
              +6.9%
            </div>
          </div>
        </div>

        {/* Right: AI Health Insights */}
        <div className="cd up" style={{ padding: "24px 28px" }}>
          <h2 className="h2" style={{ marginBottom: "16px" }}>
            Health Insights & AI Triage
          </h2>

          <div className="ins">
            <span className="icb c-hr" style={{ background: "var(--s2)" }}>
              <Activity className="gly" />
            </span>
            <div>
              <span style={{ fontWeight: 600, display: "block", fontSize: "15px" }}>
                Кардиоваскулярная адаптация в норме
              </span>
              <p style={{ color: "var(--t2)", marginTop: "4px" }}>
                Смещение центрального объема крови стабилизировалось на 42-й день полета. Базальный сердечный выброс соответствует физиологической норме невесомости.
              </p>
            </div>
          </div>

          <div className="ins">
            <span className="icb c-sleep" style={{ background: "var(--s2)" }}>
              <Brain className="gly" />
            </span>
            <div>
              <span style={{ fontWeight: 600, display: "block", fontSize: "15px" }}>
                Циркадный сдвиг фазы сна (-38 минут)
              </span>
              <p style={{ color: "var(--t2)", marginTop: "4px" }}>
                Фиксируется сокращение фазы глубокого медленноволнового сна (SWS) после ночных сеансов связи с ЦУП. Рекомендуется корректировка освещения спектром 480 нм.
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
                Ежедневные протоколы тренировок на сопротивление ARED выполняются в полном объеме. Минеральная плотность костной ткани стабильна.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

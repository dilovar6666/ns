import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Droplets,
  Moon,
  Footprints,
  Calendar,
  Save,
  CheckCircle,
  Settings,
  LayoutDashboard,
  Award,
  Activity,
} from "lucide-react";
import type { Astronaut, Metric } from "../api";
import { latest } from "../api";
import { AstronautProfileCanvas } from "../components/AstronautProfileCanvas";

type Props = {
  astronaut?: Astronaut;
  crew: Astronaut[];
  metrics: Metric[];
  onSelectAstronaut: (id: number) => void;
};

export function ProfileView({
  astronaut,
  crew,
  metrics,
  onSelectAstronaut,
}: Props) {
  const [savedToast, setSavedToast] = useState(false);
  const [hrThreshold, setHrThreshold] = useState("105");
  const [spo2Threshold, setSpo2Threshold] = useState("94");
  const [sleepTarget, setSleepTarget] = useState("8.0");

  const latestList = latest(metrics);
  const currentHr = latestList.find((m) => m.key === "heart_rate")?.value ?? 72;
  const currentSpo2 = latestList.find((m) => m.key === "spo2")?.value ?? 98;
  const currentSleep = latestList.find((m) => m.key === "sleep_duration")?.value ?? 7.5;
  const currentActivity = latestList.find((m) => m.key === "activity")?.value ?? 8230;

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const astronautName = astronaut?.name || "Алекс Нова";
  const initials = astronautName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="wrapc" style={{ maxWidth: "1240px", margin: "0 auto", paddingBottom: "70px" }}>
      {/* Top Breadcrumb & Page Header */}
      <header style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "var(--t3)", marginBottom: "4px" }}>
              СРЕДА, 11 НОЯБРЯ
            </div>
            <h1 className="disp" style={{ fontSize: "34px", fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.03em" }}>
              Astronaut Profile
            </h1>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--t2)" }}>
              • Профиль, миссия и предпочтения. Демо-данные
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {crew.length > 1 && (
              <select
                className="inp"
                value={astronaut?.id}
                onChange={(e) => onSelectAstronaut(Number(e.target.value))}
                aria-label="Выбрать астронавта"
                style={{
                  fontWeight: 600,
                  fontSize: "13px",
                  background: "var(--s1)",
                  color: "var(--tx)",
                  border: "1px solid var(--sep)",
                  borderRadius: "12px",
                  padding: "8px 14px",
                }}
              >
                {crew.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.callsign})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </header>

      {/* Seamless Hero Row: Info on Left, 3D Helmet on Right (NO outer card, NO frame/box) */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          alignItems: "center",
          gap: "24px",
          marginBottom: "36px",
          position: "relative",
        }}
      >
        {/* Left: Astronaut Profile Information */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
            {/* Round Initials Avatar Badge */}
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: 700,
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>

            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: "var(--t3)", marginBottom: "4px" }}>
                ASTRONAUT PROFILE
              </div>
              <h2 style={{ margin: 0, fontSize: "34px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                {astronautName}
              </h2>
              <div style={{ fontSize: "14px", color: "var(--t2)", marginTop: "4px" }}>
                {astronaut?.specialty || "Бортинженер, экипаж демо-миссии CHX-01"}
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "26px" }}>
            <span
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.85)",
              }}
            >
              ID: CHX-01-AN-0{astronaut?.id || 7}
            </span>

            <span
              style={{
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#34D399",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34D399" }} />
              Миссия активна
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            <Link
              to="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "11px 24px",
                borderRadius: "999px",
                background: "#FFFFFF",
                color: "#000000",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              }}
            >
              <LayoutDashboard size={16} />
              <span>Открыть Dashboard</span>
            </Link>

            <Link
              to="/settings"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "11px 22px",
                borderRadius: "999px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Settings size={16} />
              <span>Настройки</span>
            </Link>
          </div>
        </div>

        {/* Right: 3D Helmet ONLY - Completely seamless, NO box, NO card border */}
        <div
          style={{
            height: "360px",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            overflow: "visible",
          }}
        >
          <AstronautProfileCanvas />
        </div>
      </section>

      {savedToast && (
        <div
          className="up"
          style={{
            marginBottom: "20px",
            padding: "14px 18px",
            borderRadius: "14px",
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid #10b981",
            color: "#10b981",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: 600,
            fontSize: "13px",
          }}
        >
          <CheckCircle size={18} />
          <span>Персонализированные пороги оповещения успешно сохранены в медицинскую карту.</span>
        </div>
      )}

      {/* Main Two-Column Grid: Mission Info & Monitoring Overview (exactly matching design) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "28px" }}>
        {/* Mission Information Card */}
        <div
          style={{
            background: "var(--s1)",
            border: "1px solid var(--sep)",
            borderRadius: "20px",
            padding: "24px 28px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={18} style={{ color: "var(--pr)" }} />
              <span>Mission Information</span>
            </h2>
            <span style={{ fontSize: "11px", color: "var(--t3)" }}>Обновлено сегодня, 14:32</span>
          </div>

          {/* Big Progress */}
          <div style={{ background: "var(--s2)", padding: "16px 20px", borderRadius: "14px", border: "1px solid var(--sep)", marginBottom: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "24px", fontWeight: 900, color: "var(--tx)" }}>
                День 42 <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--t3)" }}>из 180</span>
              </span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--pr)" }}>
                23%
              </span>
            </div>
            <div style={{ width: "100%", height: "6px", background: "var(--s1)", borderRadius: "6px", overflow: "hidden", marginTop: "10px" }}>
              <div style={{ width: "23.3%", height: "100%", background: "var(--pr)" }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid var(--sep)" }}>
              <span style={{ color: "var(--t3)" }}>Название миссии</span>
              <span style={{ fontWeight: 600 }}>CHX-01, демонстрационная</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid var(--sep)" }}>
              <span style={{ color: "var(--t3)" }}>Продолжительность</span>
              <span style={{ fontWeight: 600 }}>180 дней</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid var(--sep)" }}>
              <span style={{ color: "var(--t3)" }}>Начало и окончание</span>
              <span style={{ fontWeight: 600 }}>1 окт 2026 — 29 мар 2027</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--t3)" }}>Статус</span>
              <span style={{ fontWeight: 700, color: "#10b981", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />
                Активна
              </span>
            </div>
          </div>
        </div>

        {/* Monitoring Overview Card */}
        <div
          style={{
            background: "var(--s1)",
            border: "1px solid var(--sep)",
            borderRadius: "20px",
            padding: "24px 28px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                <Activity size={18} style={{ color: "var(--cy)" }} />
                <span>Monitoring Overview</span>
              </h2>
              <Link to="/analytics" style={{ fontSize: "12px", color: "var(--pr)", textDecoration: "none", fontWeight: 600 }}>
                Analytics &gt;
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Heart Rate */}
              <Link to="/monitoring" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "var(--s2)", borderRadius: "12px", border: "1px solid var(--sep)", textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Heart size={16} color="var(--hr)" />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>Heart Rate</div>
                    <div style={{ fontSize: "11px", color: "var(--t3)" }}>{currentHr} bpm</div>
                  </div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#10b981" }}>● В диапазоне &gt;</span>
              </Link>

              {/* SpO2 */}
              <Link to="/monitoring" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "var(--s2)", borderRadius: "12px", border: "1px solid var(--sep)", textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Droplets size={16} color="var(--cy)" />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>Oxygen Saturation</div>
                    <div style={{ fontSize: "11px", color: "var(--t3)" }}>{currentSpo2}%</div>
                  </div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#10b981" }}>● В диапазоне &gt;</span>
              </Link>

              {/* Sleep */}
              <Link to="/monitoring" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "var(--s2)", borderRadius: "12px", border: "1px solid var(--sep)", textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Moon size={16} color="#8b5cf6" />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>Sleep</div>
                    <div style={{ fontSize: "11px", color: "var(--t3)" }}>7 ч 30 мин</div>
                  </div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#f59e0b" }}>Требует внимания &gt;</span>
              </Link>

              {/* Physical Activity */}
              <Link to="/monitoring" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "var(--s2)", borderRadius: "12px", border: "1px solid var(--sep)", textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Footprints size={16} color="var(--pr)" />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>Physical Activity</div>
                    <div style={{ fontSize: "11px", color: "var(--t3)" }}>8 230 шагов</div>
                  </div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#10b981" }}>● В диапазоне &gt;</span>
              </Link>
            </div>
          </div>

          <Link
            to="/alerts"
            style={{
              marginTop: "16px",
              padding: "10px 14px",
              borderRadius: "12px",
              background: "var(--s2)",
              border: "1px solid var(--sep)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              textDecoration: "none",
              color: "var(--tx)",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <span>Уведомления</span>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.2)", color: "#ef4444", fontWeight: 700 }}>
              2
            </span>
          </Link>
        </div>
      </div>

      {/* Monitoring Baseline & Personalized Alert Thresholds */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Baseline Card */}
        <div
          style={{
            background: "var(--s1)",
            border: "1px solid var(--sep)",
            borderRadius: "20px",
            padding: "24px 28px",
          }}
        >
          <h2 style={{ margin: "0 0 16px", fontSize: "17px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
            <Award size={18} style={{ color: "var(--pr)" }} />
            <span>Monitoring Baseline (ЦПК)</span>
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--s2)", borderRadius: "12px", border: "1px solid var(--sep)" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>ЧСС в покое (Базовый уровень)</div>
                <div style={{ fontSize: "11px", color: "var(--t3)" }}>Предполетный замер в клиностазе</div>
              </div>
              <span style={{ fontSize: "15px", fontWeight: 700 }}>64 bpm</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--s2)", borderRadius: "12px", border: "1px solid var(--sep)" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>Базальная сатурация SpO₂</div>
                <div style={{ fontSize: "11px", color: "var(--t3)" }}>Среднесуточный уровень в нормоксии</div>
              </div>
              <span style={{ fontSize: "15px", fontWeight: 700 }}>98.2 %</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--s2)", borderRadius: "12px", border: "1px solid var(--sep)" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>VO₂ Max (Аэробная выносливость)</div>
                <div style={{ fontSize: "11px", color: "var(--t3)" }}>Тест на эргометре CEVIS</div>
              </div>
              <span style={{ fontSize: "15px", fontWeight: 700 }}>52.4 мл/кг/мин</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--s2)", borderRadius: "12px", border: "1px solid var(--sep)" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>Переносимость перегрузок +Gz</div>
                <div style={{ fontSize: "11px", color: "var(--t3)" }}>Центрифуга ЦФ-18</div>
              </div>
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#10b981" }}>+7.5 Gz (30 сек)</span>
            </div>
          </div>
        </div>

        {/* Personalized Threshold Preferences */}
        <div
          style={{
            background: "var(--s1)",
            border: "1px solid var(--sep)",
            borderRadius: "20px",
            padding: "24px 28px",
          }}
        >
          <h2 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700 }}>
            Индивидуальные пороговые настройки
          </h2>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--t3)" }}>
            Параметры срабатывания предупредительных триггеров биомониторинга
          </p>

          <form onSubmit={handleSavePreferences} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--s2)", borderRadius: "12px", border: "1px solid var(--sep)" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>Порог тахикардии в покое</div>
                <div style={{ fontSize: "11px", color: "var(--t3)" }}>Оповещение при ЧСС свыше порога</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="number"
                  value={hrThreshold}
                  onChange={(e) => setHrThreshold(e.target.value)}
                  style={{
                    width: "70px",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    background: "var(--s1)",
                    border: "1px solid var(--sep)",
                    color: "var(--tx)",
                    fontSize: "13px",
                    fontWeight: 700,
                    textAlign: "center",
                    outline: "none",
                  }}
                />
                <span style={{ fontSize: "12px", color: "var(--t3)" }}>bpm</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--s2)", borderRadius: "12px", border: "1px solid var(--sep)" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>Порог гипоксии (SpO₂)</div>
                <div style={{ fontSize: "11px", color: "var(--t3)" }}>Критический триггер для дыхательного контура</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="number"
                  value={spo2Threshold}
                  onChange={(e) => setSpo2Threshold(e.target.value)}
                  style={{
                    width: "70px",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    background: "var(--s1)",
                    border: "1px solid var(--sep)",
                    color: "var(--tx)",
                    fontSize: "13px",
                    fontWeight: 700,
                    textAlign: "center",
                    outline: "none",
                  }}
                />
                <span style={{ fontSize: "12px", color: "var(--t3)" }}>%</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--s2)", borderRadius: "12px", border: "1px solid var(--sep)" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>Целевая длительность сна</div>
                <div style={{ fontSize: "11px", color: "var(--t3)" }}>Минимум для предотвращения когнитивного спада</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="text"
                  value={sleepTarget}
                  onChange={(e) => setSleepTarget(e.target.value)}
                  style={{
                    width: "70px",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    background: "var(--s1)",
                    border: "1px solid var(--sep)",
                    color: "var(--tx)",
                    fontSize: "13px",
                    fontWeight: 700,
                    textAlign: "center",
                    outline: "none",
                  }}
                />
                <span style={{ fontSize: "12px", color: "var(--t3)" }}>ч</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--s2)", borderRadius: "12px", border: "1px solid var(--sep)" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>Группа крови и резус-фактор</div>
                <div style={{ fontSize: "11px", color: "var(--t3)" }}>Для экстренного переливания в полете</div>
              </div>
              <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--tx)" }}>A(II) Rh+</span>
            </div>

            <button
              type="submit"
              className="btn pri"
              style={{ padding: "12px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, marginTop: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <Save size={16} />
              <span>Сохранить персональные параметры</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

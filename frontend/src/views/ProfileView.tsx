import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Heart,
  Droplets,
  Moon,
  Footprints,
  Shield,
  Activity,
  Award,
  Calendar,
  Save,
  CheckCircle,
} from "lucide-react";
import type { Astronaut, Metric } from "../api";

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

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <div className="wrapc">
      {/* Top Header */}
      <header className="tb">
        <div className="up">
          <p className="eyb">Личное дело астронавта</p>
          <h1 className="lt disp">Astronaut Profile</h1>
          <p className="sub">
            Медицинский статус, физиологический профиль и персонализированные пороги
          </p>
        </div>
        <div className="tbr up" style={{ animationDelay: "60ms" }}>
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
        </div>
      </header>

      {/* Hero Header Card with Astronaut Photo */}
      <div className="ph up" style={{ marginTop: "16px" }}>
        <div className="ph-in">
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span
              style={{
                background: "rgba(65, 105, 255, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {astronaut?.specialty || "Бортинженер-исследователь"}
            </span>
            <span
              style={{
                background: "rgba(52, 199, 89, 0.3)",
                border: "1px solid rgba(52, 199, 89, 0.4)",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#34C759",
              }}
            >
              ● Активен (Годен к полету)
            </span>
          </div>

          <h1 className="lt disp" style={{ fontSize: "36px", margin: "8px 0 4px", color: "#fff" }}>
            {astronaut?.name || "Алекс Нова"}
          </h1>
          <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.75)", fontSize: "15px" }}>
            Позывной: <b>"{astronaut?.callsign || "NOVA-1"}"</b> · ID: CHX-01-A0{astronaut?.id || 1}
          </p>
        </div>
      </div>

      {savedToast && (
        <div className="toast up" style={{ marginTop: "16px" }}>
          <CheckCircle className="ico sm" /> Персонализированные пороги успешно сохранены в медицинскую карту
        </div>
      )}

      {/* Main Two-Column Grid */}
      <div className="pg">
        {/* Mission Information */}
        <div className="cd up" style={{ padding: "24px 28px" }}>
          <h2 className="h2" style={{ marginBottom: "16px" }}>
            Mission Information
          </h2>

          <div className="kv">
            <span>Экспедиция:</span>
            <span style={{ fontWeight: 600 }}>CHX-01 (Mars Habitat Precursor)</span>
          </div>
          <div className="kv">
            <span>Время в полете (MET):</span>
            <span className="num" style={{ fontWeight: 600 }}>
              День 42 из 180 (23.3%)
            </span>
          </div>
          <div className="kv">
            <span>Выходы в открытый космос (EVA):</span>
            <span className="num" style={{ fontWeight: 600 }}>
              2 выхода (общая длительность: 13ч 40м)
            </span>
          </div>
          <div className="kv">
            <span>Накопленная радиационная доза:</span>
            <span className="num" style={{ fontWeight: 600, color: "var(--ok)" }}>
              26.04 мЗв (в пределах лимита)
            </span>
          </div>
          <div className="kv">
            <span>Бортовая роль:</span>
            <span style={{ fontWeight: 600 }}>
              {astronaut?.specialty || "Системы жизнеобеспечения и EVA"}
            </span>
          </div>
          <div className="kv">
            <span>Медицинский статус NASA STD-3001:</span>
            <span className="st ok">
              <i></i>Class I Flight Certification
            </span>
          </div>
        </div>

        {/* Monitoring Overview & Baseline Biometrics */}
        <div className="cd up" style={{ padding: "24px 28px" }}>
          <h2 className="h2" style={{ marginBottom: "16px" }}>
            Monitoring Baseline
          </h2>

          <div className="mo">
            <span className="icb c-hr" style={{ background: "var(--s2)" }}>
              <Heart className="gly" />
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: "14px", fontWeight: 600 }}>
                ЧСС в покое (Базовый уровень)
              </span>
              <span className="cap">Предполетный замер в ЦПК</span>
            </span>
            <span className="num" style={{ fontWeight: 700, fontSize: "16px" }}>
              64 bpm
            </span>
          </div>

          <div className="mo" style={{ marginTop: "10px" }}>
            <span className="icb c-spo2" style={{ background: "var(--s2)" }}>
              <Droplets className="gly" />
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: "14px", fontWeight: 600 }}>
                Базальная сатурация SpO₂
              </span>
              <span className="cap">Среднесуточный уровень в нормоксии</span>
            </span>
            <span className="num" style={{ fontWeight: 700, fontSize: "16px" }}>
              98.2 %
            </span>
          </div>

          <div className="mo" style={{ marginTop: "10px" }}>
            <span className="icb c-act" style={{ background: "var(--s2)" }}>
              <Activity className="gly" />
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: "14px", fontWeight: 600 }}>
                VO₂ Max (Аэробная выносливость)
              </span>
              <span className="cap">Тест на велоэргометре CEVIS</span>
            </span>
            <span className="num" style={{ fontWeight: 700, fontSize: "16px" }}>
              52.4 мл/кг/мин
            </span>
          </div>

          <div className="mo" style={{ marginTop: "10px" }}>
            <span className="icb c-sleep" style={{ background: "var(--s2)" }}>
              <Shield className="gly" />
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: "14px", fontWeight: 600 }}>
                Переносимость перегрузок +Gz
              </span>
              <span className="cap">Центрифуга ЦФ-18</span>
            </span>
            <span className="num" style={{ fontWeight: 700, fontSize: "16px" }}>
              +7.5 Gz (30 сек)
            </span>
          </div>
        </div>
      </div>

      {/* Personalized Health Preferences & Alert Thresholds */}
      <section className="cd up" style={{ marginTop: "24px", padding: "26px 28px" }}>
        <h2 className="h2" style={{ marginBottom: "8px" }}>
          Индивидуальные пороговые настройки оповещения
        </h2>
        <p className="cap" style={{ marginBottom: "18px" }}>
          Настройка чувствительности алгоритмов раннего предупреждения CosmoHealthX для данного астронавта
        </p>

        <form onSubmit={handleSavePreferences} className="pref">
          <div>
            <div className="row">
              <div>
                <div className="lb">Порог тахикардии в покое</div>
                <div className="sub">Оповещение при превышении ЧСС в покое</div>
              </div>
              <input
                className="inp num"
                type="number"
                value={hrThreshold}
                onChange={(e) => setHrThreshold(e.target.value)}
                style={{ width: "90px" }}
              />
            </div>

            <div className="row">
              <div>
                <div className="lb">Порог гипоксии (SpO₂)</div>
                <div className="sub">Критический триггер для дыхательного контура</div>
              </div>
              <input
                className="inp num"
                type="number"
                value={spo2Threshold}
                onChange={(e) => setSpo2Threshold(e.target.value)}
                style={{ width: "90px" }}
              />
            </div>
          </div>

          <div>
            <div className="row">
              <div>
                <div className="lb">Целевая длительность сна</div>
                <div className="sub">Минимум для предотвращения когнитивного спада</div>
              </div>
              <input
                className="inp num"
                type="text"
                value={sleepTarget}
                onChange={(e) => setSleepTarget(e.target.value)}
                style={{ width: "90px" }}
              />
            </div>

            <div className="row" style={{ borderBottom: "none" }}>
              <div>
                <div className="lb">Группа крови и резус-фактор</div>
                <div className="sub">Для экстренного переливания в полете</div>
              </div>
              <span className="num" style={{ fontWeight: 700, fontSize: "15px" }}>
                A(II) Rh+
              </span>
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1", marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn-primary">
              <Save className="ico sm" /> Сохранить персональные параметры
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

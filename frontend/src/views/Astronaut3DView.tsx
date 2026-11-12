import React, { Suspense } from "react";
import AstronautScene from "../AstronautScene";
import {
  Heart,
  Droplets,
  Thermometer,
  Shield,
  Compass,
  Radio,
} from "lucide-react";
import type { Astronaut, Metric } from "../api";
import { latest } from "../api";

type Props = {
  astronaut?: Astronaut;
  metrics: Metric[];
};

export function Astronaut3DView({ astronaut, metrics }: Props) {
  const latestList = latest(metrics);
  const hr = latestList.find((m) => m.key === "heart_rate")?.value ?? 72;
  const spo2 = latestList.find((m) => m.key === "spo2")?.value ?? 98;

  return (
    <div className="wrapc">
      {/* Header */}
      <header className="tb">
        <div className="up">
          <p className="eyb">Интерактивная 3D-модель скафандра и биосенсоров</p>
          <h1 className="lt disp">3D EVA Suit & Biometrics Viewer</h1>
          <p className="sub">
            Анатомическая локализация датчиков и статус систем жизнеобеспечения (PLSS)
          </p>
        </div>
      </header>

      {/* 3D Scene Container with HUD overlays */}
      <div className="scene-3d-wrap up">
        <div className="hud-overlay">
          <div className="hud-tag">
            <Heart className="ico sm" style={{ color: "var(--hr)" }} />
            <span>
              Кардиомонитор: <b>{Math.round(hr)} bpm</b>
            </span>
          </div>

          <div className="hud-tag">
            <Droplets className="ico sm" style={{ color: "var(--o2)" }} />
            <span>
              Кислородный резерв (O₂): <b>{Math.round(spo2)}% · 4.8 ч</b>
            </span>
          </div>

          <div className="hud-tag">
            <Thermometer className="ico sm" style={{ color: "var(--wa)" }} />
            <span>
              Контур охлаждения LCVG: <b>21.4 °C</b>
            </span>
          </div>

          <div className="hud-tag">
            <Shield className="ico sm" style={{ color: "var(--ok)" }} />
            <span>
              Давление в скафандре: <b>29.6 кПа (100% O₂)</b>
            </span>
          </div>
        </div>

        <div style={{ width: "100%", height: "100%" }}>
          <Suspense
            fallback={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#fff",
                }}
              >
                Загрузка 3D-модели скафандра...
              </div>
            }
          >
            <AstronautScene />
          </Suspense>
        </div>
      </div>

      <p className="cap" style={{ textAlign: "center", marginTop: "14px" }}>
        Используйте левую кнопку мыши для вращения модели скафандра, колесико для масштабирования, правую кнопку для панорамирования.
      </p>
    </div>
  );
}

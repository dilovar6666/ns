import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Rocket,
  Activity,
  Heart,
  Orbit,
  FlaskConical,
  Clock,
  Compass,
} from "lucide-react";
import type { Event } from "../api";
import { api } from "../api";

export function TimelineView() {
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["timeline"],
    queryFn: () => api<Event[]>("/timeline"),
  });

  const getEventIcon = (kind: string) => {
    switch (kind?.toLowerCase()) {
      case "eva": return <Rocket className="gly" style={{ color: "var(--pr)" }} />;
      case "medical": return <Heart className="gly" style={{ color: "var(--hr)" }} />;
      case "scientific": return <FlaskConical className="gly" style={{ color: "var(--ac)" }} />;
      case "orbit": return <Orbit className="gly" style={{ color: "var(--cy)" }} />;
      default: return <Compass className="gly" style={{ color: "var(--pr)" }} />;
    }
  };

  return (
    <div className="wrapc">
      {/* Header */}
      <header className="tb">
        <div className="up">
          <p className="eyb">Хронологический журнал событий экспедиции</p>
          <h1 className="lt disp">Mission Timeline</h1>
          <p className="sub">
            Ключевые вехи, выходы в открытый космос и медицинские инциденты миссии CHX-01
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="cap" style={{ textAlign: "center", padding: "60px 0" }}>
          Загрузка хронологии миссии...
        </div>
      ) : events.length === 0 ? (
        <div className="cd empty" style={{ marginTop: "24px" }}>
          <h2 className="h2">Событий пока нет</h2>
          <p className="cap">Бортовой журнал ожидает новых записей телеметрии.</p>
        </div>
      ) : (
        <div className="timeline-list">
          {events.map((ev) => (
            <div key={ev.id} className="timeline-node up">
              <div className="timeline-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        background: "var(--s2)",
                        borderRadius: "8px",
                        padding: "4px 8px",
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "var(--pr)",
                      }}
                    >
                      {ev.kind}
                    </span>
                    <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                      {ev.title}
                    </h2>
                  </div>

                  <span className="cap num" style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock className="ico sm" />
                    {new Date(ev.occurred_at).toLocaleString("ru-RU", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--t2)", lineHeight: "1.5" }}>
                  {ev.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

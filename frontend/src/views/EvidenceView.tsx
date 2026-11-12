import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ExternalLink,
  ShieldCheck,
  Award,
  FileCheck,
} from "lucide-react";
import type { Evidence } from "../api";
import { api } from "../api";

export function EvidenceView() {
  const { data: evidence = [], isLoading } = useQuery<Evidence[]>({
    queryKey: ["evidence"],
    queryFn: () => api<Evidence[]>("/evidence"),
  });

  return (
    <div className="wrapc">
      {/* Header */}
      <header className="tb">
        <div className="up">
          <p className="eyb">Научно-методическая база CosmoHealthX</p>
          <h1 className="lt disp">Scientific Evidence & Standards</h1>
          <p className="sub">
            Международные стандарты космической медицины, клинические испытания и нормативы NASA/ESA
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="cap" style={{ textAlign: "center", padding: "60px 0" }}>
          Загрузка научных источников...
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "20px",
            marginTop: "24px",
          }}
        >
          {evidence.map((item, idx) => (
            <div
              key={idx}
              className="cd up"
              style={{
                padding: "24px 26px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    background: "rgba(65, 105, 255, 0.12)",
                    color: "var(--pr)",
                    borderRadius: "8px",
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {item.organization}
                </span>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn bt"
                    style={{ fontSize: "12px", padding: "4px 8px" }}
                  >
                    <ExternalLink className="ico sm" /> Источник
                  </a>
                )}
              </div>

              <h2 style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 700 }}>
                {item.title}
              </h2>

              <p style={{ margin: 0, fontSize: "14px", color: "var(--t2)", lineHeight: "1.6" }}>
                {item.description}
              </p>

              <div style={{ marginTop: "auto", borderTop: "1px solid var(--sep)", paddingTop: "10px" }}>
                <span className="cap" style={{ fontWeight: 600 }}>
                  Применение в платформе:
                </span>
                <span style={{ display: "block", fontSize: "13px", color: "var(--t1)", marginTop: "2px" }}>
                  {item.used_for}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

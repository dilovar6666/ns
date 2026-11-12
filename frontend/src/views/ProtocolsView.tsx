import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList,
  CheckSquare,
  Square,
  AlertTriangle,
  Play,
  CheckCircle2,
  ExternalLink,
  Clock,
  Shield,
  FileCheck,
} from "lucide-react";
import type { Astronaut, Protocol, ProtocolExecution } from "../api";
import { api } from "../api";

type Props = {
  astronaut?: Astronaut;
};

export function ProtocolsView({ astronaut }: Props) {
  const queryClient = useQueryClient();
  const [selectedProtocolId, setSelectedProtocolId] = useState<number | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [toastMsg, setToastMsg] = useState("");

  const { data: protocols = [], isLoading } = useQuery<Protocol[]>({
    queryKey: ["protocols"],
    queryFn: () => api<Protocol[]>("/protocols"),
  });

  const activeProtocol =
    protocols.find((p) => p.id === selectedProtocolId) || protocols[0];

  const { data: executions = [] } = useQuery<ProtocolExecution[]>({
    queryKey: ["executions", activeProtocol?.id],
    queryFn: () =>
      activeProtocol ? api<ProtocolExecution[]>(`/protocols/${activeProtocol.id}/executions`) : [],
    enabled: !!activeProtocol,
  });

  const executeMutation = useMutation({
    mutationFn: () => {
      if (!activeProtocol) throw new Error("No protocol");
      return api(`/protocols/${activeProtocol.id}/executions`, "medical_officer", {
        method: "POST",
        body: JSON.stringify({
          executed_by: astronaut?.name || "Алекс Нова (CMO)",
          notes: "Выполнены все шаги клинического протокола. Показатели стабилизированы.",
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executions", activeProtocol?.id] });
      setToastMsg(`Протокол «${activeProtocol?.title}» успешно выполнен и занесен в бортовой журнал.`);
      setTimeout(() => setToastMsg(""), 3500);
    },
    onError: (err: any) => {
      setToastMsg(`Ошибка: ${err.message || "Сбой фиксации выполнения"}`);
      setTimeout(() => setToastMsg(""), 3500);
    },
  });

  const toggleStep = (stepId: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  return (
    <div className="wrapc">
      {/* Header */}
      <header className="tb">
        <div className="up">
          <p className="eyb">Стандартные операционные процедуры (SOP)</p>
          <h1 className="lt disp">Medical Emergency Protocols</h1>
          <p className="sub">
            Пошаговые алгоритмы действий экипажа при острых физиологических состояниях
          </p>
        </div>
      </header>

      {toastMsg && (
        <div className="toast up" style={{ marginTop: "16px" }}>
          <CheckCircle2 className="ico sm" /> {toastMsg}
        </div>
      )}

      {/* Main Grid: Protocols list & Step Checklist */}
      <div className="mg" style={{ marginTop: "20px" }}>
        {/* Left: Protocol Navigation List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {protocols.map((p) => {
            const isSelected = p.id === activeProtocol?.id;
            return (
              <div
                key={p.id}
                className="cd up"
                onClick={() => {
                  setSelectedProtocolId(p.id);
                  setCheckedSteps({});
                }}
                style={{
                  padding: "18px 22px",
                  cursor: "pointer",
                  borderColor: isSelected ? "var(--pr)" : "var(--sep)",
                  boxShadow: isSelected ? "0 0 0 1px var(--pr)" : "none",
                  transition: "all .15s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                    {p.title}
                  </h2>
                  <span className="cap">{p.steps?.length || 4} шагов</span>
                </div>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--t2)", lineHeight: "1.5" }}>
                  {p.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right: Step-by-Step Interactive Checklist */}
        {activeProtocol && (
          <div className="cd up" style={{ padding: "26px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
              <div>
                <h2 className="h2" style={{ marginBottom: "6px" }}>
                  {activeProtocol.title}
                </h2>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--t2)" }}>
                  {activeProtocol.description}
                </p>
              </div>

              {activeProtocol.source_url && (
                <a
                  className="btn-secondary"
                  href={activeProtocol.source_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: "12px", padding: "6px 10px", flexShrink: 0 }}
                >
                  <ExternalLink className="ico sm" /> Стандарт NASA
                </a>
              )}
            </div>

            <div style={{ borderTop: "1px solid var(--sep)", margin: "20px 0 16px" }} />

            <div className="cap" style={{ fontWeight: 700, marginBottom: "12px" }}>
              Пошаговый чек-лист выполнения:
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {activeProtocol.steps?.map((st) => {
                const isChecked = !!checkedSteps[st.id];
                return (
                  <div
                    key={st.id}
                    className={`step-row ${isChecked ? "completed" : ""}`}
                    onClick={() => toggleStep(st.id)}
                  >
                    <div className="step-num">{st.position}</div>
                    <div style={{ flex: 1, fontSize: "14px", lineHeight: "1.5" }}>
                      {st.text}
                    </div>
                    {isChecked ? (
                      <CheckSquare className="ico sm" style={{ color: "var(--ok)", flexShrink: 0 }} />
                    ) : (
                      <Square className="ico sm" style={{ color: "var(--t3)", flexShrink: 0 }} />
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="cap">
                Завершено шагов: {Object.values(checkedSteps).filter(Boolean).length} из{" "}
                {activeProtocol.steps?.length || 0}
              </span>

              <button
                className="btn-primary"
                onClick={() => executeMutation.mutate()}
                disabled={executeMutation.isPending}
              >
                <FileCheck className="ico sm" />
                {executeMutation.isPending ? "Фиксация..." : "Зафиксировать выполнение в журнал"}
              </button>
            </div>

            {/* Past Executions History */}
            {executions.length > 0 && (
              <div style={{ marginTop: "28px", borderTop: "1px solid var(--sep)", paddingTop: "18px" }}>
                <div className="cap" style={{ fontWeight: 700, marginBottom: "10px" }}>
                  История активаций протокола:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {executions.map((ex) => (
                    <div
                      key={ex.id}
                      className="kv"
                      style={{ fontSize: "13px", padding: "8px 0" }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Clock className="ico sm" />
                        {new Date(ex.executed_at).toLocaleString("ru-RU")}
                      </span>
                      <span style={{ fontWeight: 600 }}>{ex.executed_by}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

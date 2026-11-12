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
  Heart,
  Radio,
  Activity,
  Flame,
  Zap,
  RotateCcw,
  Stethoscope,
  Sparkles,
  Info,
} from "lucide-react";
import type { Astronaut, Protocol, ProtocolExecution } from "../api";
import { api } from "../api";

type Props = {
  astronaut?: Astronaut;
};

// Protocol metadata enhancements (urgency level, code, category, equipment)
function getProtocolMeta(title: string) {
  const t = title.toLowerCase();

  if (t.includes("тахикард") || t.includes("med-01")) {
    return {
      code: "SOP-MED-01",
      category: "cardio",
      urgency: "CRITICAL",
      urgencyColor: "#ef4444",
      urgencyBg: "rgba(239, 68, 68, 0.15)",
      equipment: ["Скафандр EMU/Orlan", "Контур LCVG", "Анализатор i-STAT", "Метопролол 25 мг"],
      icon: Heart,
    };
  }
  if (t.includes("радиацион") || t.includes("rad-02") || t.includes("spe")) {
    return {
      code: "SOP-RAD-02",
      category: "radiation",
      urgency: "CRITICAL",
      urgencyColor: "#f59e0b",
      urgencyBg: "rgba(245, 158, 11, 0.15)",
      equipment: ["Дозиметр TEPC", "Водяной экран 400 л", "Антиоксиданты (Амифостин)", "LiF TLD датчики"],
      icon: Flame,
    };
  }
  if (t.includes("декомпресси") || t.includes("dcs-03")) {
    return {
      code: "SOP-DCS-03",
      category: "dcs",
      urgency: "CRITICAL",
      urgencyColor: "#ef4444",
      urgencyBg: "rgba(239, 68, 68, 0.15)",
      equipment: ["Гипербарическая маска 100% O2", "УЗИ Butterfly iQ+", "Физраствор 0.9% NaCl 500 мл"],
      icon: AlertTriangle,
    };
  }
  if (t.includes("болезнь движения") || t.includes("sas-04")) {
    return {
      code: "SOP-SAS-04",
      category: "neuro",
      urgency: "MEDIUM",
      urgencyColor: "#06b6d4",
      urgencyBg: "rgba(6, 182, 212, 0.15)",
      equipment: ["Компрессионный пояс", "Прометазин 25 мг в/м", "Электролиты CosmoHydrate ORS", "HRV монитор"],
      icon: Activity,
    };
  }
  if (t.includes("сна") || t.includes("slp-05")) {
    return {
      code: "SOP-SLP-05",
      category: "sleep",
      urgency: "LOW",
      urgencyColor: "#8b5cf6",
      urgencyBg: "rgba(139, 92, 246, 0.15)",
      equipment: ["Светопанели 2200K", "Мелатонин 3 мг", "ANC шумоподавление", "Аудиосессия 0.5-4 Гц"],
      icon: Zap,
    };
  }
  if (t.includes("аммиак") || t.includes("tox-06")) {
    return {
      code: "SOP-TOX-06",
      category: "tox",
      urgency: "CRITICAL",
      urgencyColor: "#ef4444",
      urgencyBg: "rgba(239, 68, 68, 0.15)",
      equipment: ["Маски PBBA (автономный O2)", "Скрубберы CDRA", "Спектрометр MCA", "Глазной солевой душ"],
      icon: Shield,
    };
  }
  return {
    code: "SOP-GEN-00",
    category: "general",
    urgency: "MEDIUM",
    urgencyColor: "#94a3b8",
    urgencyBg: "rgba(148, 163, 184, 0.15)",
    equipment: ["Бортовая аптечка CHX-01", "Пульсоксиметр", "Связь с ЦУП"],
    icon: Stethoscope,
  };
}

export function ProtocolsView({ astronaut }: Props) {
  const queryClient = useQueryClient();
  const [selectedProtocolId, setSelectedProtocolId] = useState<number | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "ok" | "err" } | null>(null);

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
      const completedStepIds = Object.entries(checkedSteps)
        .filter(([_, isChecked]) => isChecked)
        .map(([id]) => Number(id));

      return api(`/protocols/${activeProtocol.id}/executions`, "medical_officer", {
        method: "POST",
        body: JSON.stringify({
          astronaut_id: astronaut?.id || 1,
          completed_steps: completedStepIds.length > 0 ? completedStepIds : (activeProtocol.steps?.map((s) => s.id) || []),
          executed_by: astronaut?.name || "Д-р Майя Чен (Chief Medical Officer)",
          notes: "Все шаги стандартной операционной процедуры (SOP) выполнены и подтверждены телеметрией.",
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executions", activeProtocol?.id] });
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
      setToastMsg({
        text: `Протокол «${activeProtocol?.title}» успешно выполнен и занесен в бортовой журнал миссии.`,
        type: "ok",
      });
      setTimeout(() => setToastMsg(null), 4000);
    },
    onError: (err: any) => {
      setToastMsg({
        text: `Ошибка: ${err.message || "Сбой фиксации выполнения"}`,
        type: "err",
      });
      setTimeout(() => setToastMsg(null), 4000);
    },
  });

  const toggleStep = (stepId: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const selectAllSteps = () => {
    if (!activeProtocol?.steps) return;
    const allChecked: Record<number, boolean> = {};
    activeProtocol.steps.forEach((s) => {
      allChecked[s.id] = true;
    });
    setCheckedSteps(allChecked);
  };

  const resetSteps = () => {
    setCheckedSteps({});
  };

  // Filter protocols by category
  const filteredProtocols = protocols.filter((p) => {
    if (activeCategory === "all") return true;
    const meta = getProtocolMeta(p.title);
    return meta.category === activeCategory;
  });

  const currentMeta = activeProtocol ? getProtocolMeta(activeProtocol.title) : null;
  const totalSteps = activeProtocol?.steps?.length || 0;
  const completedCount = Object.values(checkedSteps).filter(Boolean).length;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return (
    <div className="wrapc" style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "60px" }}>
      {/* Top Header */}
      <header className="tb" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div className="up">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--pr)" }}>
                Стандартные операционные процедуры (SOP) · NASA STD-3001
              </span>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontWeight: 600 }}>
                ● Авторизованная клиническая база
              </span>
            </div>
            <h1 className="lt disp" style={{ margin: "0 0 6px" }}>Medical Emergency Protocols</h1>
            <p className="sub" style={{ margin: 0, maxWidth: "780px", color: "var(--t2)" }}>
              Пошаговые алгоритмы действий экипажа при острых физиологических состояниях, радиационных событиях SPE, декомпрессионной болезни и токсической контаминации.
            </p>
          </div>

          {/* Quick Readiness Card */}
          <div
            style={{
              background: "var(--s1)",
              border: "1px solid var(--sep)",
              borderRadius: "14px",
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              fontSize: "12px",
            }}
          >
            <div>
              <div style={{ color: "var(--t3)", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>
                Аптечка CHX-01
              </div>
              <div style={{ fontWeight: 700, color: "#10b981" }}>Готовность 100%</div>
            </div>
            <div style={{ width: "1px", height: "24px", background: "var(--sep)" }} />
            <div>
              <div style={{ color: "var(--t3)", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>
                Телеконсилиум ЦУП
              </div>
              <div style={{ fontWeight: 700, color: "var(--cy)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Radio size={12} className="pulse" /> Ku-Band Live
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className="up"
          style={{
            marginBottom: "20px",
            padding: "14px 18px",
            borderRadius: "14px",
            background: toastMsg.type === "ok" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${toastMsg.type === "ok" ? "#10b981" : "#ef4444"}`,
            color: toastMsg.type === "ok" ? "#10b981" : "#ef4444",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: 600,
            fontSize: "13px",
          }}
        >
          {toastMsg.type === "ok" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Category Tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
        {[
          { id: "all", label: "Все протоколы", count: protocols.length },
          { id: "cardio", label: "Кардиология & EVA", count: protocols.filter((p) => getProtocolMeta(p.title).category === "cardio").length },
          { id: "radiation", label: "Радиация & SPE", count: protocols.filter((p) => getProtocolMeta(p.title).category === "radiation").length },
          { id: "dcs", label: "Декомпрессия (DCS)", count: protocols.filter((p) => getProtocolMeta(p.title).category === "dcs").length },
          { id: "neuro", label: "Адаптация & SAS", count: protocols.filter((p) => getProtocolMeta(p.title).category === "neuro").length },
          { id: "sleep", label: "Сон & Циркадный цикл", count: protocols.filter((p) => getProtocolMeta(p.title).category === "sleep").length },
          { id: "tox", label: "Токсикология (NH3)", count: protocols.filter((p) => getProtocolMeta(p.title).category === "tox").length },
        ].map((tab) => {
          const isSelected = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              style={{
                padding: "8px 14px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: isSelected ? 700 : 500,
                background: isSelected ? "var(--pr)" : "var(--s1)",
                color: isSelected ? "#fff" : "var(--t2)",
                border: isSelected ? "1px solid var(--pr)" : "1px solid var(--sep)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  background: isSelected ? "rgba(255,255,255,0.25)" : "var(--s2)",
                  color: isSelected ? "#fff" : "var(--t3)",
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main 2-Column Interface: Protocols List (Left) & Active Checklist (Right) */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(340px, 440px) 1fr", gap: "24px", alignItems: "start" }}>
        {/* Left Column: Protocol Cards List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {isLoading ? (
            <div className="cd" style={{ textAlign: "center", padding: "40px 20px" }}>
              <Activity className="spin" size={24} style={{ color: "var(--pr)", margin: "0 auto 8px" }} />
              <p className="cap">Загрузка клинических алгоритмов...</p>
            </div>
          ) : filteredProtocols.length === 0 ? (
            <div className="cd empty" style={{ padding: "30px 20px", textAlign: "center" }}>
              <p className="cap">В выбранной категории нет доступных протоколов.</p>
            </div>
          ) : (
            filteredProtocols.map((p) => {
              const meta = getProtocolMeta(p.title);
              const isSelected = p.id === activeProtocol?.id;
              const IconComp = meta.icon;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProtocolId(p.id);
                    setCheckedSteps({});
                  }}
                  style={{
                    background: isSelected ? "var(--s1)" : "var(--s1)",
                    border: isSelected ? "2px solid var(--pr)" : "1px solid var(--sep)",
                    borderRadius: "16px",
                    padding: "18px 20px",
                    cursor: "pointer",
                    boxShadow: isSelected ? "0 8px 24px rgba(59, 130, 246, 0.15)" : "0 2px 8px rgba(0,0,0,0.06)",
                    transition: "all 0.15s ease",
                    position: "relative",
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: meta.urgencyBg,
                          color: meta.urgencyColor,
                          border: `1px solid ${meta.urgencyColor}44`,
                        }}
                      >
                        {meta.urgency}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--t3)" }}>
                        {meta.code}
                      </span>
                    </div>

                    <span style={{ fontSize: "11px", color: "var(--t3)", fontWeight: 600 }}>
                      {p.steps?.length || 0} этапов
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "var(--tx)", lineHeight: "1.4" }}>
                    {p.title}
                  </h3>

                  {/* Description preview */}
                  <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--t2)", lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {p.description}
                  </p>

                  {/* Required Equipment Pills */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {meta.equipment.slice(0, 3).map((eq, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "11px",
                          padding: "2px 7px",
                          borderRadius: "6px",
                          background: "var(--s2)",
                          color: "var(--t3)",
                          border: "1px solid var(--sep)",
                        }}
                      >
                        {eq}
                      </span>
                    ))}
                    {meta.equipment.length > 3 && (
                      <span style={{ fontSize: "11px", color: "var(--t3)", alignSelf: "center" }}>
                        +{meta.equipment.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Step-by-Step Interactive Checklist & Action Center */}
        {activeProtocol && currentMeta ? (
          <div
            style={{
              background: "var(--s1)",
              border: "1px solid var(--sep)",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            }}
          >
            {/* Active Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: "8px",
                      background: currentMeta.urgencyBg,
                      color: currentMeta.urgencyColor,
                      border: `1px solid ${currentMeta.urgencyColor}44`,
                    }}
                  >
                    ПРИОРИТЕТ: {currentMeta.urgency}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--pr)" }}>
                    {currentMeta.code}
                  </span>
                </div>

                <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 800, color: "var(--tx)", lineHeight: "1.3" }}>
                  {activeProtocol.title}
                </h2>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--t2)", lineHeight: "1.6" }}>
                  {activeProtocol.description}
                </p>
              </div>

              {activeProtocol.source_url && (
                <a
                  href={activeProtocol.source_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    background: "var(--s2)",
                    border: "1px solid var(--sep)",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--pr)",
                    textDecoration: "none",
                    flexShrink: 0,
                  }}
                >
                  <ExternalLink size={14} />
                  <span>NASA STD-3001</span>
                </a>
              )}
            </div>

            {/* Equipment Required Box */}
            <div
              style={{
                background: "var(--s2)",
                border: "1px solid var(--sep)",
                borderRadius: "14px",
                padding: "14px 18px",
                marginBottom: "24px",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--t3)", marginBottom: "8px" }}>
                Необходимое клиническое оснащение и препараты:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {currentMeta.equipment.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "8px",
                      background: "var(--s1)",
                      border: "1px solid var(--sep)",
                      color: "var(--tx)",
                    }}
                  >
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Progress Bar & Quick Step Toggles */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--tx)" }}>
                  Пошаговое выполнение: {completedCount} из {totalSteps} шагов
                </span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--pr)" }}>
                  ({progressPercent}%)
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={selectAllSteps}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "12px",
                    color: "var(--pr)",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Отметить все
                </button>
                <span style={{ color: "var(--sep)" }}>·</span>
                <button
                  type="button"
                  onClick={resetSteps}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "12px",
                    color: "var(--t3)",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Сбросить
                </button>
              </div>
            </div>

            {/* Progress Track */}
            <div style={{ width: "100%", height: "6px", background: "var(--s2)", borderRadius: "6px", overflow: "hidden", marginBottom: "20px" }}>
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background: progressPercent === 100 ? "#10b981" : "var(--pr)",
                  transition: "width 0.25s ease",
                }}
              />
            </div>

            {/* Step-by-Step List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
              {activeProtocol.steps?.map((step) => {
                const isChecked = !!checkedSteps[step.id];

                return (
                  <div
                    key={step.id}
                    onClick={() => toggleStep(step.id)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "14px",
                      padding: "14px 16px",
                      borderRadius: "14px",
                      background: isChecked ? "rgba(16, 185, 129, 0.08)" : "var(--s2)",
                      border: isChecked ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid var(--sep)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {/* Number Badge */}
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: isChecked ? "#10b981" : "var(--s1)",
                        color: isChecked ? "#fff" : "var(--t2)",
                        border: "1px solid var(--sep)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {step.position}
                    </div>

                    {/* Step Narrative */}
                    <div style={{ flex: 1, fontSize: "14px", color: isChecked ? "var(--tx)" : "var(--t1)", lineHeight: "1.5" }}>
                      {step.text}
                    </div>

                    {/* Checkbox Icon */}
                    <div style={{ flexShrink: 0, marginTop: "2px" }}>
                      {isChecked ? (
                        <CheckSquare size={20} color="#10b981" />
                      ) : (
                        <Square size={20} color="var(--t3)" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px", paddingTop: "20px", borderTop: "1px solid var(--sep)" }}>
              <div style={{ fontSize: "12px", color: "var(--t3)" }}>
                Исполнитель: <strong style={{ color: "var(--tx)" }}>{astronaut?.name || "Д-р Майя Чен (Chief Medical Officer)"}</strong>
              </div>

              <button
                type="button"
                onClick={() => executeMutation.mutate()}
                disabled={executeMutation.isPending}
                className="btn pri"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 22px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                <FileCheck size={18} />
                <span>
                  {executeMutation.isPending ? "Фиксация в ЦУП..." : "Зафиксировать выполнение в журнал"}
                </span>
              </button>
            </div>

            {/* Past Executions History */}
            {executions.length > 0 && (
              <div style={{ marginTop: "32px", borderTop: "1px solid var(--sep)", paddingTop: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <Clock size={16} style={{ color: "var(--pr)" }} />
                  <span style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Журнал выполненных активаций протокола:
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {executions.map((ex) => (
                    <div
                      key={ex.id}
                      style={{
                        background: "var(--s2)",
                        border: "1px solid var(--sep)",
                        borderRadius: "12px",
                        padding: "12px 16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "13px",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--tx)" }}>
                          {ex.executed_by || "Экипаж CHX-01"}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--t3)", marginTop: "2px" }}>
                          {ex.notes || "Все шаги алгоритма выполнены. Показатели стабилизированы."}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontWeight: 700 }}>
                          УСПЕШНО
                        </span>
                        <div style={{ fontSize: "11px", color: "var(--t3)", marginTop: "4px" }}>
                          {new Date(ex.executed_at).toLocaleString("ru-RU", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

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
  ArrowLeft,
  ChevronRight,
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
  const [mobileTab, setMobileTab] = useState<"list" | "active">("list");
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
    <div className="wrapc protocols-wrap">
      {/* Top Header */}
      <header className="protocols-header-box" style={{ marginTop: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ flex: "1 1 300px" }}>
            {/* Top Badges */}
            <div className="protocols-top-badge-row">
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--pr)" }}>
                SOP · NASA STD-3001
              </span>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontWeight: 700 }}>
                ● Авторизовано ЦУП
              </span>
            </div>

            <h1 className="protocols-title">Medical Emergency Protocols</h1>

            <p className="protocols-desc">
              Пошаговые алгоритмы действий экипажа при острой патологии, вспышках радиации SPE и аварийных сценариях.
            </p>
          </div>

          {/* Quick Readiness Card */}
          <div className="protocols-readiness-strip">
            <div>
              <div style={{ color: "var(--t3)", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>
                Аптечка CHX-01
              </div>
              <div style={{ fontWeight: 700, color: "#10b981", fontSize: "13px" }}>Готовность 100%</div>
            </div>
            <div style={{ width: "1px", height: "24px", background: "var(--sep)" }} />
            <div>
              <div style={{ color: "var(--t3)", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>
                Телеконсилиум ЦУП
              </div>
              <div style={{ fontWeight: 700, color: "var(--cy)", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
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
            marginBottom: "16px",
            padding: "12px 16px",
            borderRadius: "14px",
            background: toastMsg.type === "ok" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${toastMsg.type === "ok" ? "#10b981" : "#ef4444"}`,
            color: toastMsg.type === "ok" ? "#10b981" : "#ef4444",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: 600,
            fontSize: "13px",
            animation: "fadeIn 0.2s ease",
          }}
        >
          {toastMsg.type === "ok" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Category Tabs: Smooth Horizontal Scrollable Bar on all screens */}
      <div className="protocols-categories-scroll">
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
              className="protocol-category-pill"
              style={{
                fontWeight: isSelected ? 700 : 500,
                background: isSelected ? "var(--pr)" : "var(--s1)",
                color: isSelected ? "#fff" : "var(--t2)",
                border: isSelected ? "1px solid var(--pr)" : "1px solid var(--sep)",
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  background: isSelected ? "rgba(255,255,255,0.25)" : "var(--s2)",
                  color: isSelected ? "#fff" : "var(--t3)",
                  fontWeight: 700,
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Segmented Control (Tabs between list and active checklist on mobile screens) */}
      <div className="protocols-mobile-tabs">
        <button
          type="button"
          className={`protocols-mob-tab ${mobileTab === "list" ? "active" : ""}`}
          onClick={() => setMobileTab("list")}
        >
          <ClipboardList size={14} />
          <span>Все протоколы ({filteredProtocols.length})</span>
        </button>
        <button
          type="button"
          className={`protocols-mob-tab ${mobileTab === "active" ? "active" : ""}`}
          onClick={() => setMobileTab("active")}
        >
          <Zap size={14} />
          <span>Чек-лист: {currentMeta?.code || "SOP"}</span>
        </button>
      </div>

      {/* Main 2-Column Interface: Protocols List (Left) & Active Checklist (Right) */}
      <div className="protocols-split">
        {/* Left Column: Protocol Cards List */}
        <div
          className={`protocols-list-col ${mobileTab === "active" ? "protocols-hide-on-mobile" : ""}`}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
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

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProtocolId(p.id);
                    setCheckedSteps({});
                    setMobileTab("active");
                  }}
                  style={{
                    background: isSelected ? "var(--s1)" : "var(--s1)",
                    border: isSelected ? "2px solid var(--pr)" : "1px solid var(--sep)",
                    borderRadius: "16px",
                    padding: "16px 18px",
                    cursor: "pointer",
                    boxShadow: isSelected ? "0 6px 20px rgba(59, 130, 246, 0.18)" : "0 2px 8px rgba(0,0,0,0.06)",
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
                          padding: "2px 8px",
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
                  <p style={{ margin: "0 0 10px", fontSize: "12px", color: "var(--t2)", lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {p.description}
                  </p>

                  {/* Required Equipment Pills */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                    {meta.equipment.slice(0, 3).map((eq, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: "6px",
                          background: "var(--s2)",
                          color: "var(--t3)",
                          border: "1px solid var(--sep)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {eq}
                      </span>
                    ))}
                    {meta.equipment.length > 3 && (
                      <span style={{ fontSize: "10px", color: "var(--t3)", alignSelf: "center" }}>
                        +{meta.equipment.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Action Link Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed var(--sep)", paddingTop: "8px", fontSize: "12px" }}>
                    <span style={{ color: "var(--pr)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                      Открыть алгоритм SOP <ChevronRight size={14} />
                    </span>
                    {isSelected && (
                      <span style={{ fontSize: "10px", color: "#10b981", fontWeight: 700 }}>
                        ● Активен
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
            className={`protocols-active-col ${mobileTab === "list" ? "protocols-hide-on-mobile" : ""}`}
            style={{
              background: "var(--s1)",
              border: "1px solid var(--sep)",
              borderRadius: "20px",
              padding: "22px 24px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            }}
          >
            {/* Mobile Return to List Button */}
            <button
              type="button"
              onClick={() => setMobileTab("list")}
              className="protocols-mobile-tabs"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "8px",
                background: "var(--s2)",
                border: "1px solid var(--sep)",
                color: "var(--pr)",
                fontSize: "12px",
                fontWeight: 700,
                marginBottom: "14px",
                cursor: "pointer",
                width: "fit-content",
              }}
            >
              <ArrowLeft size={14} />
              <span>← Назад ко всем протоколам</span>
            </button>

            {/* Active Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px", marginBottom: "16px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "240px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      padding: "3px 8px",
                      borderRadius: "6px",
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

                <h2 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 800, color: "var(--tx)", lineHeight: "1.3" }}>
                  {activeProtocol.title}
                </h2>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--t2)", lineHeight: "1.5" }}>
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
                    padding: "6px 10px",
                    borderRadius: "8px",
                    background: "var(--s2)",
                    border: "1px solid var(--sep)",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--pr)",
                    textDecoration: "none",
                    flexShrink: 0,
                  }}
                >
                  <ExternalLink size={13} />
                  <span>NASA STD-3001</span>
                </a>
              )}
            </div>

            {/* Equipment Required Box */}
            <div
              style={{
                background: "var(--s2)",
                border: "1px solid var(--sep)",
                borderRadius: "12px",
                padding: "12px 14px",
                marginBottom: "20px",
              }}
            >
              <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--t3)", marginBottom: "6px" }}>
                Необходимое клиническое оснащение и препараты:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {currentMeta.equipment.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: "6px",
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--tx)" }}>
                  Выполнение: {completedCount} из {totalSteps} шагов
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
            <div style={{ width: "100%", height: "6px", background: "var(--s2)", borderRadius: "6px", overflow: "hidden", marginBottom: "18px" }}>
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
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "22px" }}>
              {activeProtocol.steps?.map((step) => {
                const isChecked = !!checkedSteps[step.id];

                return (
                  <div
                    key={step.id}
                    onClick={() => toggleStep(step.id)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: isChecked ? "rgba(16, 185, 129, 0.08)" : "var(--s2)",
                      border: isChecked ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid var(--sep)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {/* Number Badge */}
                    <div
                      style={{
                        width: "26px",
                        height: "26px",
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
                    <div style={{ flex: 1, fontSize: "13px", color: isChecked ? "var(--tx)" : "var(--t1)", lineHeight: "1.5" }}>
                      {step.text}
                    </div>

                    {/* Checkbox Icon */}
                    <div style={{ flexShrink: 0, marginTop: "2px" }}>
                      {isChecked ? (
                        <CheckSquare size={18} color="#10b981" />
                      ) : (
                        <Square size={18} color="var(--t3)" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", paddingTop: "16px", borderTop: "1px solid var(--sep)" }}>
              <div style={{ fontSize: "12px", color: "var(--t3)" }}>
                Исполнитель: <strong style={{ color: "var(--tx)" }}>{astronaut?.name || "Д-р Майя Чен (CMO)"}</strong>
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
                  padding: "10px 18px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                <FileCheck size={16} />
                <span>
                  {executeMutation.isPending ? "Фиксация в ЦУП..." : "Зафиксировать выполнение в журнал"}
                </span>
              </button>
            </div>

            {/* Past Executions History */}
            {executions.length > 0 && (
              <div style={{ marginTop: "24px", borderTop: "1px solid var(--sep)", paddingTop: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <Clock size={15} style={{ color: "var(--pr)" }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Журнал выполненных активаций:
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {executions.map((ex) => (
                    <div
                      key={ex.id}
                      style={{
                        background: "var(--s2)",
                        border: "1px solid var(--sep)",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "12px",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--tx)" }}>
                          {ex.executed_by || "Экипаж CHX-01"}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--t3)", marginTop: "2px" }}>
                          {ex.notes || "Все шаги алгоритма выполнены. Показатели стабилизированы."}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "6px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontWeight: 700 }}>
                          УСПЕШНО
                        </span>
                        <div style={{ fontSize: "10px", color: "var(--t3)", marginTop: "2px" }}>
                          {new Date(ex.executed_at).toLocaleString("ru-RU", {
                            dateStyle: "short",
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

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Rocket,
  Heart,
  Orbit,
  FlaskConical,
  Clock,
  Compass,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Activity,
  Radio,
  ExternalLink,
  X,
  Sparkles,
  Info,
} from "lucide-react";
import type { Event } from "../api";
import { api } from "../api";

// Mapping image illustrations to timeline events based on kind or keywords
function getEventIllustration(ev: Event): { src: string; caption: string } | null {
  const k = ev.kind?.toLowerCase() || "";
  const t = ev.title?.toLowerCase() || "";
  const d = ev.detail?.toLowerCase() || "";

  if (k === "eva" || t.includes("eva") || d.includes("spacewalk") || d.includes("выход")) {
    return {
      src: "/cosmo-assets/ba923833-5f1d-4dae-9dd6-d6952c8dcfcb.jpg",
      caption: "Выход в открытый космос (EVA) за бортом орбитального комплекса",
    };
  }
  if (k === "alarm" || t.includes("spe") || t.includes("solar") || d.includes("радиаци") || d.includes("shelter")) {
    return {
      src: "/cosmo-assets/208b3c2d-afa7-4c68-923d-eab64f784c93.jpg",
      caption: "Солнечная активность класса M-4.2 — датчики радиационного фона",
    };
  }
  if (t.includes("sleep") || t.includes("psychological") || d.includes("circadian") || d.includes("сон")) {
    return {
      src: "/cosmo-assets/11a03e3e-a153-4315-9904-1f351cd36f3c.jpg",
      caption: "Модуль обзора Купола — циркадный биоритм и анализ сна",
    };
  }
  if (k === "science" || t.includes("genelab") || d.includes("biospecimen") || d.includes("glovebox")) {
    return {
      src: "/cosmo-assets/35fb7de0-00f0-49aa-962c-d1d2eb3441df.jpg",
      caption: "Биолаборатория Glovebox и криохранилище MELFI (-80°C)",
    };
  }
  if (k === "orbit" || t.includes("docking") || d.includes("стыковк")) {
    return {
      src: "/cosmo-assets/fbbcacc7-e14e-4b50-adea-e8433a3fa66e.jpg",
      caption: "Автоматическое сближение и захват стыковочного узла",
    };
  }
  if (t.includes("launch") || t.includes("старт") || d.includes("falcon")) {
    return {
      src: "/cosmo-assets/0d365bce-f1ee-4b68-99e2-98eaed0bf5cc.jpg",
      caption: "Старт ракеты-носителя со стартовой площадки LC-39A",
    };
  }
  if (k === "medical" || t.includes("orthostatic") || t.includes("scan")) {
    return {
      src: "/cosmo-assets/0018b717-a6c5-46e2-80da-e25263a42a90.jpg",
      caption: "Ультразвуковой и кардиологический осмотр в невесомости",
    };
  }
  return null;
}

// Telemetry notes and crew metadata per kind
function getTelemetryCallout(ev: Event): { text: string; crew: string } {
  const k = ev.kind?.toLowerCase() || "";
  const t = ev.title?.toLowerCase() || "";

  if (k === "eva") {
    return {
      text: "PLSS телеметрия: пик ЧСС 138 bpm · О2 расход: 1.15 л/мин · Давление: 29.6 кПа",
      crew: "Алекс Нова (EV1), Ибрагим Рахман (EV2)",
    };
  }
  if (k === "alarm") {
    return {
      text: "Дозиметрия: пик дозы 4.8 мЗв/ч · Укрытие в модуле с защитным водяным экраном",
      crew: "Весь экипаж миссии CHX-01",
    };
  }
  if (k === "medical") {
    if (t.includes("sleep")) {
      return {
        text: "Актиграфия: дефицит глубокого сна SWS 14% · Спектр освещения смещен в теплый диапазон",
        crew: "Алекс Нова, контроль: Д-р Майя Чен",
      };
    }
    return {
      text: "Гемодинамика: сдвиг жидкости в цефалическом направлении в норме · Синдром SANS не выявлен",
      crew: "Д-р Майя Чен",
    };
  }
  if (k === "science") {
    return {
      text: "GeneLab ID: GL-884 · 32 пробы венозной крови заморожены при -80°C",
      crew: "Ибрагим Рахман, Майя Чен",
    };
  }
  if (k === "orbit") {
    return {
      text: "Навигация: Δv = 1.4 м/с · Герметичность шлюза 101.3 кПа подтверждена",
      crew: "Алекс Нова (Командир)",
    };
  }
  if (k === "mission") {
    return {
      text: "Траектория выведения: Апогей 408 км · Наклонение 51.6° · Перегрузка: max 3.4g",
      crew: "Экипаж CHX-01",
    };
  }
  return {
    text: "Телеметрия биосенсоров передана в ЦУП без аномалий",
    crew: "Бортовой ИИ / Автономный модуль",
  };
}

export function TimelineView() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDetail, setNewEventDetail] = useState("");
  const [newEventKind, setNewEventKind] = useState("eva");

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["timeline"],
    queryFn: () => api<Event[]>("/timeline"),
  });

  const createEventMutation = useMutation({
    mutationFn: async (payload: { title: string; detail: string; kind: string }) => {
      return api<Event>("/timeline", "astronaut", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
      setIsModalOpen(false);
      setNewEventTitle("");
      setNewEventDetail("");
      setNewEventKind("eva");
    },
  });

  const getEventBadge = (kind: string) => {
    switch (kind?.toLowerCase()) {
      case "eva":
        return { label: "EVA · Выход", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)", icon: Rocket };
      case "medical":
        return { label: "Медицина", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", icon: Heart };
      case "alarm":
        return { label: "Алерт / Радиация", color: "#ef4444", bg: "rgba(239, 68, 68, 0.18)", icon: AlertTriangle };
      case "science":
        return { label: "Эксперимент", color: "#a855f7", bg: "rgba(168, 85, 247, 0.15)", icon: FlaskConical };
      case "orbit":
        return { label: "Орбита", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.15)", icon: Orbit };
      case "mission":
        return { label: "Миссия", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", icon: Compass };
      default:
        return { label: "Событие", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.15)", icon: Activity };
    }
  };

  const filteredEvents = events.filter((ev) => {
    const matchesFilter =
      activeFilter === "all" ||
      ev.kind?.toLowerCase() === activeFilter.toLowerCase() ||
      (activeFilter === "orbit" && ev.kind?.toLowerCase() === "mission");

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      ev.title.toLowerCase().includes(query) ||
      ev.detail.toLowerCase().includes(query) ||
      ev.kind?.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDetail.trim()) return;
    createEventMutation.mutate({
      title: newEventTitle.trim(),
      detail: newEventDetail.trim(),
      kind: newEventKind,
    });
  };

  return (
    <div className="wrapc" style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "60px" }}>
      {/* Top Header */}
      <header className="tb" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div className="up">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--pr)" }}>
                Бортовой журнал и хронология полета
              </span>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontWeight: 600 }}>
                ● Активная телеметрия
              </span>
            </div>
            <h1 className="lt disp" style={{ margin: "0 0 6px" }}>Mission Timeline & Flight Log</h1>
            <p className="sub" style={{ margin: 0, maxWidth: "720px", color: "var(--t2)" }}>
              Хронология ключевых этапов экспедиции CHX-01, выходы в открытый космос (EVA), радиационные события SPE и динамика клинического состояния экипажа.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn pri"
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "12px", fontSize: "14px", fontWeight: 600 }}
          >
            <Plus size={16} />
            <span>Добавить событие</span>
          </button>
        </div>
      </header>

      {/* Orbit Telemetry & Mission Roadmap Card */}
      <section
        style={{
          background: "var(--s1)",
          border: "1px solid var(--sep)",
          borderRadius: "20px",
          padding: "24px",
          marginBottom: "28px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "var(--s2)", padding: "14px 18px", borderRadius: "14px", border: "1px solid var(--sep)" }}>
            <div style={{ fontSize: "11px", color: "var(--t2)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
              Текущая орбита
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--pr)", marginTop: "4px" }}>
              408.4 <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--t2)" }}>км LEO</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--t3)", marginTop: "2px" }}>
              Апогей 415 км · Перигей 402 км
            </div>
          </div>

          <div style={{ background: "var(--s2)", padding: "14px 18px", borderRadius: "14px", border: "1px solid var(--sep)" }}>
            <div style={{ fontSize: "11px", color: "var(--t2)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
              Орбитальная скорость
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--cy)", marginTop: "4px" }}>
              7.66 <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--t2)" }}>км/с</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--t3)", marginTop: "2px" }}>
              27 576 км/ч · Виток #672
            </div>
          </div>

          <div style={{ background: "var(--s2)", padding: "14px 18px", borderRadius: "14px", border: "1px solid var(--sep)" }}>
            <div style={{ fontSize: "11px", color: "var(--t2)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
              Прогресс миссии (MET)
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--tx)", marginTop: "4px" }}>
              День 42 <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--t2)" }}>из 180</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--t3)", marginTop: "2px" }}>
              23.3% запланированной программы
            </div>
          </div>

          <div style={{ background: "var(--s2)", padding: "14px 18px", borderRadius: "14px", border: "1px solid var(--sep)" }}>
            <div style={{ fontSize: "11px", color: "var(--t2)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
              Канал связи ЦУП
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#10b981", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Radio size={20} className="pulse" /> Ku-Band Live
            </div>
            <div style={{ fontSize: "12px", color: "var(--t3)", marginTop: "2px" }}>
              Задержка: 120 мс · Пакеты: 0 потерь
            </div>
          </div>
        </div>

        {/* 5-Phase Mission Visual Tracker */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--t1)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Фазы экспедиции CHX-01
            </span>
            <span style={{ fontSize: "12px", color: "var(--t2)" }}>
              Текущая фаза: <strong>Фаза III — Научные эксперименты и целевые EVA</strong>
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
            {/* Phase 1 */}
            <div style={{ background: "var(--s2)", padding: "12px 14px", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 700 }}>ФАЗА 1 (ДЕНЬ 1)</span>
                <CheckCircle2 size={14} color="#10b981" />
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700, margin: "4px 0 2px" }}>Старт и выведение</div>
              <div style={{ fontSize: "11px", color: "var(--t3)" }}>LC-39A · Орбита 408 км</div>
            </div>

            {/* Phase 2 */}
            <div style={{ background: "var(--s2)", padding: "12px 14px", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 700 }}>ФАЗА 2 (ДНИ 2–14)</span>
                <CheckCircle2 size={14} color="#10b981" />
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700, margin: "4px 0 2px" }}>Стыковка и адаптация</div>
              <div style={{ fontSize: "11px", color: "var(--t3)" }}>Герметизация шлюзов</div>
            </div>

            {/* Phase 3 - Current */}
            <div style={{ background: "rgba(59, 130, 246, 0.12)", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--pr)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", color: "var(--pr)", fontWeight: 800 }}>ФАЗА 3 (ДНИ 15–60) · СЕЙЧАС</span>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--pr)", boxShadow: "0 0 8px var(--pr)" }} />
              </div>
              <div style={{ fontSize: "13px", fontWeight: 800, margin: "4px 0 2px", color: "var(--pr)" }}>Наука и серия EVA</div>
              <div style={{ fontSize: "11px", color: "var(--t2)" }}>EVA-1 завершен · EVA-2 подготовка</div>
            </div>

            {/* Phase 4 */}
            <div style={{ background: "var(--s2)", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--sep)", opacity: 0.65 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", color: "var(--t3)", fontWeight: 600 }}>ФАЗА 4 (ДНИ 61–150)</span>
                <Clock size={14} color="var(--t3)" />
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600, margin: "4px 0 2px" }}>Длительная невесомость</div>
              <div style={{ fontSize: "11px", color: "var(--t3)" }}>Омика GeneLab & Кости</div>
            </div>

            {/* Phase 5 */}
            <div style={{ background: "var(--s2)", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--sep)", opacity: 0.65 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", color: "var(--t3)", fontWeight: 600 }}>ФАЗА 5 (ДНИ 151–180)</span>
                <Clock size={14} color="var(--t3)" />
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600, margin: "4px 0 2px" }}>Расстыковка & Посадка</div>
              <div style={{ fontSize: "11px", color: "var(--t3)" }}>Реабилитационный протокол</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        {/* Category Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {[
            { id: "all", label: "Все события", count: events.length },
            { id: "eva", label: "EVA & Скафандры", count: events.filter((e) => e.kind === "eva").length },
            { id: "medical", label: "Медицина & Сон", count: events.filter((e) => e.kind === "medical" || e.kind === "checkin").length },
            { id: "alarm", label: "Алерты & SPE", count: events.filter((e) => e.kind === "alarm").length },
            { id: "science", label: "Эксперименты", count: events.filter((e) => e.kind === "science").length },
            { id: "orbit", label: "Орбита & Полет", count: events.filter((e) => e.kind === "orbit" || e.kind === "mission").length },
          ].map((cat) => {
            const isSelected = activeFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
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
                <span>{cat.label}</span>
                <span
                  style={{
                    fontSize: "11px",
                    padding: "2px 6px",
                    borderRadius: "10px",
                    background: isSelected ? "rgba(255,255,255,0.25)" : "var(--s2)",
                    color: isSelected ? "#fff" : "var(--t3)",
                  }}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", minWidth: "260px" }}>
          <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--t3)" }} />
          <input
            type="text"
            placeholder="Поиск по событиям или записям..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              borderRadius: "12px",
              background: "var(--s1)",
              border: "1px solid var(--sep)",
              color: "var(--tx)",
              fontSize: "13px",
              outline: "none",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--t3)" }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Timeline Stream */}
      {isLoading ? (
        <div className="cd" style={{ textAlign: "center", padding: "80px 20px" }}>
          <Activity className="spin" size={32} style={{ color: "var(--pr)", margin: "0 auto 12px" }} />
          <p className="sub">Загрузка хронологии полета и данных телеметрии...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="cd empty" style={{ textAlign: "center", padding: "60px 20px" }}>
          <Compass size={40} style={{ color: "var(--t3)", margin: "0 auto 12px" }} />
          <h2 className="h2" style={{ margin: "0 0 6px" }}>События не найдены</h2>
          <p className="cap" style={{ maxWidth: "420px", margin: "0 auto" }}>
            По заданному фильтру или поисковому запросу ничего не обнаружено. Сбросьте фильтры или добавьте новую запись.
          </p>
          <button
            onClick={() => { setActiveFilter("all"); setSearchQuery(""); }}
            className="btn sec"
            style={{ marginTop: "16px" }}
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div style={{ position: "relative", paddingLeft: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Vertical Timeline Axis */}
          <div
            style={{
              position: "absolute",
              top: "16px",
              bottom: "16px",
              left: "11px",
              width: "2px",
              background: "linear-gradient(to bottom, var(--pr), var(--cy), var(--sep))",
              opacity: 0.6,
            }}
          />

          {filteredEvents.map((ev, index) => {
            const badge = getEventBadge(ev.kind);
            const IconComp = badge.icon;
            const photo = getEventIllustration(ev);
            const telemetry = getTelemetryCallout(ev);

            // Calculate formatted date and MET day estimation
            const eventDate = new Date(ev.occurred_at);
            const formattedDate = eventDate.toLocaleString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div key={ev.id || index} style={{ position: "relative" }}>
                {/* Glowing Node Dot */}
                <div
                  style={{
                    position: "absolute",
                    left: "-32px",
                    top: "20px",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "var(--bg)",
                    border: `2px solid ${badge.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 0 12px ${badge.color}`,
                    zIndex: 2,
                  }}
                >
                  <IconComp size={12} color={badge.color} />
                </div>

                {/* Event Card */}
                <div
                  className="timeline-card"
                  style={{
                    background: "var(--s1)",
                    border: "1px solid var(--sep)",
                    borderRadius: "18px",
                    padding: "20px 24px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    transition: "transform 0.15s ease, border-color 0.15s ease",
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          borderRadius: "8px",
                          padding: "4px 10px",
                          fontSize: "11px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          border: `1px solid ${badge.color}33`,
                        }}
                      >
                        {badge.label}
                      </span>

                      <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--tx)" }}>
                        {ev.title}
                      </h3>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--t3)", background: "var(--s2)", padding: "4px 10px", borderRadius: "10px" }}>
                      <Clock size={13} />
                      <span style={{ fontWeight: 600 }}>{formattedDate}</span>
                    </div>
                  </div>

                  {/* Main Event Narrative */}
                  <p style={{ margin: "0 0 16px", fontSize: "14px", color: "var(--t2)", lineHeight: "1.6" }}>
                    {ev.detail}
                  </p>

                  {/* Event Illustration Thumbnail if available */}
                  {photo && (
                    <div
                      style={{
                        marginBottom: "16px",
                        borderRadius: "14px",
                        overflow: "hidden",
                        border: "1px solid var(--sep)",
                        background: "#000",
                        position: "relative",
                      }}
                    >
                      <img
                        src={photo.src}
                        alt={photo.caption}
                        style={{
                          width: "100%",
                          maxHeight: "260px",
                          objectFit: "cover",
                          display: "block",
                          opacity: 0.92,
                          transition: "opacity 0.2s ease",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
                          padding: "16px 16px 10px",
                          color: "#fff",
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{photo.caption}</span>
                        <span style={{ fontSize: "11px", opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Бортовая фотофиксация
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Telemetry and Crew Pill Footer */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px",
                      paddingTop: "12px",
                      borderTop: "1px solid var(--sep)",
                      fontSize: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--t2)" }}>
                      <Activity size={14} style={{ color: badge.color }} />
                      <span style={{ fontWeight: 500 }}>{telemetry.text}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--t3)" }}>
                      <span style={{ fontWeight: 600 }}>Экипаж:</span>
                      <span style={{ color: "var(--tx)", fontWeight: 500 }}>{telemetry.crew}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add New Event to Log */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--s1)",
              border: "1px solid var(--sep)",
              borderRadius: "20px",
              padding: "28px",
              width: "100%",
              maxWidth: "540px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Rocket size={20} style={{ color: "var(--pr)" }} />
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Запись в бортовой журнал</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t2)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--t2)", marginBottom: "6px" }}>
                  Категория события
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  {[
                    { id: "eva", label: "EVA · Выход" },
                    { id: "medical", label: "Медицина" },
                    { id: "alarm", label: "Алерт / SPE" },
                    { id: "science", label: "Эксперимент" },
                    { id: "orbit", label: "Орбита" },
                    { id: "mission", label: "Миссия" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewEventKind(cat.id)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: newEventKind === cat.id ? "var(--pr)" : "var(--s2)",
                        color: newEventKind === cat.id ? "#fff" : "var(--t2)",
                        border: "1px solid var(--sep)",
                        cursor: "pointer",
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--t2)", marginBottom: "6px" }}>
                  Заголовок записи
                </label>
                <input
                  type="text"
                  placeholder="Например: Завершена калибровка ультразвукового датчика"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    background: "var(--s2)",
                    border: "1px solid var(--sep)",
                    color: "var(--tx)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--t2)", marginBottom: "6px" }}>
                  Подробное описание и клинические отметки
                </label>
                <textarea
                  rows={4}
                  placeholder="Опишите ход операции, показания биосенсоров экипажа или возникшие нештатные ситуации..."
                  value={newEventDetail}
                  onChange={(e) => setNewEventDetail(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    background: "var(--s2)",
                    border: "1px solid var(--sep)",
                    color: "var(--tx)",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn sec"
                  style={{ padding: "10px 16px", borderRadius: "10px" }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createEventMutation.isPending}
                  className="btn pri"
                  style={{ padding: "10px 20px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  {createEventMutation.isPending ? "Сохранение..." : "Опубликовать в журнал"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

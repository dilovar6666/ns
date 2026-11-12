import React, { useState } from "react";
import {
  BookOpen,
  ExternalLink,
  Shield,
  Activity,
  Zap,
  Moon,
  AlertTriangle,
  Award,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Radiation,
  Brain,
  Globe2,
  Heart,
  Droplets,
  Thermometer,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface StandardItem {
  id: string;
  category: "nasa" | "hazard" | "database" | "protocol";
  title: string;
  subtitle: string;
  organization: string;
  image?: string;
  badge: string;
  description: string;
  clinicalImpact: string;
  platformApplication: string;
  url?: string;
}

export function EvidenceView() {
  const { language } = useLanguage();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const isRu = language === "ru";

  const standards: StandardItem[] = [
    {
      id: "nasa-std-3001-vol1",
      category: "nasa",
      title: isRu ? "NASA STD-3001 Volume 1: Crew Health" : "NASA STD-3001 Volume 1: Crew Health",
      subtitle: isRu ? "Клинические стандарты здоровья и предполетной подготовки" : "Clinical Crew Health and Preflight Physical Standards",
      organization: "NASA Office of Chief Health & Medical Officer",
      image: "/cosmo-assets/ba923833-5f1d-4dae-9dd6-d6952c8dcfcb.jpg",
      badge: "Mandatory Standard",
      description: isRu
        ? "Фундаментальный норматив NASA, определяющий допустимые отклонения биометрических параметров, профилактику сердечно-сосудистой декондиции и протоколы экстренной медицинской помощи на борту."
        : "The definitive NASA standard establishing allowable biometric physiological deviations, cardiovascular deconditioning prevention, and emergency medical protocols.",
      clinicalImpact: isRu
        ? "Устанавливает пороги покоя ЧСС (50–100 bpm), минимальную сатурацию SpO₂ (≥ 95%), и допустимые дозы радиационной нагрузки."
        : "Defines resting heart rate bounds (50–100 bpm), minimum SpO₂ (≥ 95%), and cumulative ionizing radiation exposure limits.",
      platformApplication: isRu
        ? "Используется в алгоритмах детекции тахикардии, гипоксии и автоматической триажной классификации в Dashboard и Alerts."
        : "Directly powers tachyarrhythmia alarms, desaturation tripwires, and automated triage scoring in Dashboard and Alerts.",
      url: "https://www.nasa.gov/hhp/standards",
    },
    {
      id: "nasa-std-3001-vol2",
      category: "nasa",
      title: isRu ? "NASA STD-3001 Volume 2: Human Factors" : "NASA STD-3001 Volume 2: Human Factors & Habitability",
      subtitle: isRu ? "Обитаемость, параметры атмосферы жилого модуля и скафандра" : "Habitability, Atmospheric Limits, and EVA Suit Parameters",
      organization: "NASA Johnson Space Center",
      image: "/cosmo-assets/0d365bce-f1ee-4b68-99e2-98eaed0bf5cc.jpg",
      badge: "Engineering Standard",
      description: isRu
        ? "Регламентирует состав воздушной смеси (парциальное давление O₂ и CO₂), акустический комфорт, температурные режимы LCVG и эргономику пользовательских интерфейсов медицинских систем."
        : "Regulates respiratory air mixture (partial pressures of O₂ and CO₂), acoustic limits, LCVG thermal loops, and medical user interface ergonomics.",
      clinicalImpact: isRu
        ? "Ограничение концентрации CO₂ (< 3.0 мм рт. ст.) для предотвращения головных болей у экипажа и синдрома нейроокулярного изменения (SANS)."
        : "Restricts ambient CO₂ (< 3.0 mmHg) to mitigate hypercapnic cephalalgia and Spaceflight-Associated Neuro-ocular Syndrome (SANS).",
      platformApplication: isRu
        ? "Телеметрия скафандра в 3D Viewer и мониторинг кислородно-азотной смеси в жилых модулях станции."
        : "Powers the 3D Viewer suit partial pressure gauges and habitat air-quality monitoring rules.",
      url: "https://www.nasa.gov/hhp/standards",
    },
    {
      id: "hazard-radiation",
      category: "hazard",
      title: isRu ? "Фактор риска: Космическая радиация (GCR / SPE)" : "Hazard Factor: Space Radiation (GCR & SPE)",
      subtitle: isRu ? "Галактические космические лучи и солнечные протонные события" : "Galactic Cosmic Rays and Solar Particle Event Protocols",
      organization: "NASA Space Radiation Program Element (SRPE)",
      image: "/cosmo-assets/208b3c2d-afa7-4c68-923d-eab64f784c93.jpg",
      badge: "Critical Hazard",
      description: isRu
        ? "За пределами низкой околоземной орбиты экипаж лишается защиты геомагнитного щита. Ионизирующее HZE-излучение вызывает повреждения ДНК, катаракту и острый лучевой синдром при вспышках на Солнце."
        : "Beyond low Earth orbit, crews lose geomagnetic shielding. High-energy heavy ion (HZE) radiation causes double-strand DNA breaks and acute radiation risks during solar events.",
      clinicalImpact: isRu
        ? "Предельная доза для миссий: не более 600 мЗв за карьеру. При фиксации SPE дозиметром экипаж обязан укрыться в радиационном убежище."
        : "Career permissible exposure limit capped at 600 mSv. Solar flare detections mandate immediate storm-shelter ingress.",
      platformApplication: isRu
        ? "Автоматический алерт SPE Warning с триггером протокола немедленной изоляции жилого отсека."
        : "Automated SPE Warning alert and habitat storm-shelter protocol checklist dispatch.",
      url: "https://www.nasa.gov/hrp",
    },
    {
      id: "hazard-isolation",
      category: "hazard",
      title: isRu ? "Фактор риска: Изоляция и сон в микрогравитации" : "Hazard Factor: Isolation, Confinement & Circadian Rhythm",
      subtitle: isRu ? "Психологическая устойчивость и 16 восходов Солнца в сутки" : "Psychological Resilience and 16 Sunrises per Day",
      organization: "NASA Behavioral Health & Performance (BHP)",
      image: "/cosmo-assets/11a03e3e-a153-4315-9904-1f351cd36f3c.jpg",
      badge: "Behavioral Health",
      description: isRu
        ? "Постоянный шум вентиляторов СЖО и 90-минутные витки вокруг Земли подавляют выработку мелатонина. Хронический дефицит фазы глубокого сна (SWS) снижает скорость реакции и когнитивный фокус."
        : "Constant ECLSS acoustics and 90-minute orbital cycles disrupt endogenous melatonin synthesis, inducing slow-wave sleep deprivation and cognitive fatigue.",
      clinicalImpact: isRu
        ? "Минимум 8.0 часов запланированного сна; мониторинг десинхроноза и уровня субъективного стресса."
        : "Minimum 8.0 hours planned rest; surveillance for circadian desynchrony and subjective isolation distress.",
      platformApplication: isRu
        ? "Раздел Mental Health, ежедневный чек-ин по 5 шкалам, отслеживание фаз сна и ИИ-анализ выгорания."
        : "Powers Mental Health view, 5-factor daily psychometric check-ins, sleep architecture tracking, and AI burnout mitigation.",
      url: "https://www.nasa.gov/hrp",
    },
    {
      id: "hrp-research",
      category: "database",
      title: isRu ? "NASA Human Research Program (HRP)" : "NASA Human Research Program (HRP)",
      subtitle: isRu ? "Комплексная программа медико-биологических исследований в космосе" : "Human Health and Performance Exploration Roadmap",
      organization: "NASA Human Exploration Operations",
      image: "/cosmo-assets/85e36523-c37d-43ad-8702-7c8e5495aeff.jpg",
      badge: "Clinical Evidence",
      description: isRu
        ? "Централизованная исследовательская база NASA, объединяющая данные близнецового исследования (Twin Study), полеты на МКС и имитационные изоляционные миссии HERA и SIRIUS."
        : "Flagship NASA initiative integrating findings from the NASA Twins Study, ISS expeditions, and ground isolation analogs (HERA / SIRIUS).",
      clinicalImpact: isRu
        ? "Доказана обратимость теломерных изменений и важность ежедневных 2.5 часов тренировок на тренажере ARED."
        : "Validated telomere length plasticity post-flight and proven 2.5 hr/day resistive exercise countermeasure efficacy (ARED).",
      platformApplication: isRu
        ? "Нормирование физической нагрузки (8 000+ шагов / калорийность) в Dashboard и Analytics."
        : "Informs daily energy expenditure targets (8,000+ step equivalents) and target ranges across Dashboard and Analytics.",
      url: "https://www.nasa.gov/hrp/",
    },
    {
      id: "osdr-genelab",
      category: "database",
      title: isRu ? "NASA Open Science Data Repository & GeneLab" : "NASA Open Science Data Repository & GeneLab",
      subtitle: isRu ? "Открытый репозиторий омиксных данных и биообразцов" : "Multi-Omics Space Biology Open Repository",
      organization: "NASA Ames Research Center",
      image: "/cosmo-assets/fbbcacc7-e14e-4b50-adea-e8433a3fa66e.jpg",
      badge: "Open Data",
      description: isRu
        ? "Крупнейший в мире открытый каталог транскриптомных, протеомных и физиологических данных организмов, подвергшихся космическому полету и гипергравитации."
        : "World's largest open catalog of transcriptomic, proteomic, and physiological telemetry from spaceflight payloads.",
      clinicalImpact: isRu
        ? "Сравнение биомаркеров крови и микроРНК для раннего выявления клеточного стресса и митохондриальной дисфункции."
        : "Reference baseline for circulating cell-free DNA, microRNA profiles, and mitochondrial dysfunction in microgravity.",
      platformApplication: isRu
        ? "Справочная библиотека для модуля клинического ИИ-ассистента (/api/ai/analyze)."
        : "Serves as reference knowledge base for the Clinical AI Assistant engine.",
      url: "https://osdr.nasa.gov/",
    },
  ];

  const filteredStandards = standards.filter((item) => {
    const matchesFilter = filter === "all" || item.category === filter;
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.organization.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="wrapc">
      {/* Header */}
      <header className="tb">
        <div className="up">
          <p className="eyb">
            {isRu ? "Научно-методическая база и нормативы NASA / ESA" : "Scientific Evidence & Flight Standards"}
          </p>
          <h1 className="lt disp">
            {isRu ? "Научные стандарты космической медицины" : "Scientific Evidence & Standards"}
          </h1>
          <p className="sub">
            {isRu
              ? "Клинические протоколы, нормативы NASA STD-3001, классификация факторов риска RIDGE и медицинские базы данных"
              : "Clinical protocols, NASA STD-3001 baselines, RIDGE hazard frameworks, and multi-omics space repositories"}
          </p>
        </div>
      </header>

      {/* Hero Infographic Banner */}
      <div
        className="sc up"
        style={{
          marginTop: "16px",
          position: "relative",
          overflow: "hidden",
          borderRadius: "20px",
          padding: "32px",
          background: "linear-gradient(135deg, rgba(16, 27, 48, 0.95) 0%, rgba(8, 14, 26, 0.98) 100%)",
          border: "1px solid var(--sep)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ maxWidth: "720px", position: "relative", zIndex: 2 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(34, 211, 238, 0.12)",
              color: "var(--pr, #22d3ee)",
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "14px",
              border: "1px solid rgba(34, 211, 238, 0.25)",
            }}
          >
            <Shield size={14} /> NASA Human Research Roadmap (HRR)
          </div>
          <h2 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
            {isRu
              ? "Человек — самая хрупкая система космической миссии"
              : "Human Physiology: The Most Vulnerable Flight System"}
          </h2>
          <p style={{ fontSize: "14px", color: "var(--t2)", lineHeight: 1.65, margin: 0 }}>
            {isRu
              ? "В условиях невесомости и радиационного фона организм астронавта испытывает непрерывные адаптационные сдвиги: от перераспределения жидкости к верхней половине туловища до потери плотности костей со скоростью 1–1.5% в месяц. CosmoHealthX применяет строгие медицинские стандарты NASA STD-3001 для непрерывного анализа биосигналов и раннего предупреждения патологий."
              : "In microgravity and deep-space radiation, human physiology undergoes profound adaptations: cephalad fluid redistribution, 1–1.5% monthly bone demineralization, and neuromuscular deconditioning. CosmoHealthX embeds strict NASA STD-3001 standards to interpret continuous biometrics and deploy preventive countermeasures."}
          </p>
        </div>

        {/* Ambient Glow */}
        <div
          style={{
            position: "absolute",
            right: "-40px",
            top: "-40px",
            width: "360px",
            height: "360px",
            background: "radial-gradient(circle, rgba(34, 211, 238, 0.18) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* RIDGE 5 Spaceflight Hazards Framework Strip */}
      <div style={{ marginTop: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>
          {isRu ? "5 ключевых факторов риска NASA (RIDGE Framework)" : "NASA's 5 Human Spaceflight Hazards (RIDGE)"}
        </h2>
        <p style={{ fontSize: "13px", color: "var(--t2)", marginBottom: "16px" }}>
          {isRu
            ? "Международная классификация рисков для здоровья экипажа при полетах за пределы околоземной орбиты"
            : "The standard hazards framework defined by NASA Human Research Program for deep-space exploration"}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          {/* 1. Radiation */}
          <div className="cd up" style={{ padding: "16px", borderRadius: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f87171", marginBottom: "8px" }}>
              <Radiation size={18} />
              <strong style={{ fontSize: "14px" }}>R · Radiation</strong>
            </div>
            <p style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.5, margin: 0 }}>
              {isRu
                ? "Галактические лучи (GCR) и солнечные протоны (SPE). Повреждение ДНК, лучевая болезнь."
                : "Deep space GCR and solar flares. DNA ionization, cataract, and acute radiation sickness."}
            </p>
          </div>

          {/* 2. Isolation */}
          <div className="cd up" style={{ padding: "16px", borderRadius: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#818cf8", marginBottom: "8px" }}>
              <Brain size={18} />
              <strong style={{ fontSize: "14px" }}>I · Isolation</strong>
            </div>
            <p style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.5, margin: 0 }}>
              {isRu
                ? "Замкнутое пространство, сенсорная депривация, дефицит глубокого сна (SWS), стресс экипажа."
                : "Confinement, circadian phase shift, slow-wave sleep deficit, cognitive interpersonal tension."}
            </p>
          </div>

          {/* 3. Distance */}
          <div className="cd up" style={{ padding: "16px", borderRadius: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#38bdf8", marginBottom: "8px" }}>
              <Globe2 size={18} />
              <strong style={{ fontSize: "14px" }}>D · Distance</strong>
            </div>
            <p style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.5, margin: 0 }}>
              {isRu
                ? "Задержка радиосвязи до 22 минут. Невозможность срочной эвакуации на Землю; автономная медицина."
                : "Comms latency up to 22 min. Zero emergency medevac options; requires onboard medical autonomy."}
            </p>
          </div>

          {/* 4. Gravity */}
          <div className="cd up" style={{ padding: "16px", borderRadius: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#4ade80", marginBottom: "8px" }}>
              <Activity size={18} />
              <strong style={{ fontSize: "14px" }}>G · Gravity Fields</strong>
            </div>
            <p style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.5, margin: 0 }}>
              {isRu
                ? "Атрофия мышц и костей (1.5%/мес), космическая болезнь движения (SMS), ортостатическая нестабильность."
                : "Microgravity deconditioning, 1.5%/mo bone loss, space motion sickness, orthostatic intolerance."}
            </p>
          </div>

          {/* 5. Environment */}
          <div className="cd up" style={{ padding: "16px", borderRadius: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f59e0b", marginBottom: "8px" }}>
              <Zap size={18} />
              <strong style={{ fontSize: "14px" }}>E · Environment</strong>
            </div>
            <p style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.5, margin: 0 }}>
              {isRu
                ? "Параметры СЖО: CO₂ < 3 mmHg, герметичность, температура скафандра LCVG, токсичные газы."
                : "ECLSS life support: hypercapnia risk, acoustic fatigue, suit thermal loop regulation."}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginTop: "32px",
          marginBottom: "18px",
        }}
      >
        {/* Category Pills */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setFilter("all")}
            style={{
              background: filter === "all" ? "var(--pr, #22d3ee)" : "var(--s1)",
              color: filter === "all" ? "#000" : "var(--t1)",
              border: "1px solid var(--sep)",
              borderRadius: "999px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isRu ? "Все стандарты (6)" : "All Standards (6)"}
          </button>
          <button
            type="button"
            onClick={() => setFilter("nasa")}
            style={{
              background: filter === "nasa" ? "var(--pr, #22d3ee)" : "var(--s1)",
              color: filter === "nasa" ? "#000" : "var(--t1)",
              border: "1px solid var(--sep)",
              borderRadius: "999px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            NASA STD-3001
          </button>
          <button
            type="button"
            onClick={() => setFilter("hazard")}
            style={{
              background: filter === "hazard" ? "var(--pr, #22d3ee)" : "var(--s1)",
              color: filter === "hazard" ? "#000" : "var(--t1)",
              border: "1px solid var(--sep)",
              borderRadius: "999px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isRu ? "Факторы риска" : "Hazards (RIDGE)"}
          </button>
          <button
            type="button"
            onClick={() => setFilter("database")}
            style={{
              background: filter === "database" ? "var(--pr, #22d3ee)" : "var(--s1)",
              color: filter === "database" ? "#000" : "var(--t1)",
              border: "1px solid var(--sep)",
              borderRadius: "999px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isRu ? "Базы данных и HRP" : "Databases & HRP"}
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", minWidth: "240px" }}>
          <Search size={15} style={{ position: "absolute", left: "12px", top: "11px", color: "var(--t3)" }} />
          <input
            type="text"
            placeholder={isRu ? "Поиск по стандартам..." : "Search standards..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="inp"
            style={{ width: "100%", paddingLeft: "36px", height: "36px", fontSize: "13px" }}
          />
        </div>
      </div>

      {/* Grid of Rich Evidence Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {filteredStandards.map((item) => (
          <div
            key={item.id}
            className="cd up"
            style={{
              borderRadius: "18px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: "var(--s1)",
              border: "1px solid var(--sep)",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            {/* Visual Image Header */}
            {item.image && (
              <div style={{ height: "180px", position: "relative", overflow: "hidden" }}>
                <img
                  src={item.image}
                  alt={item.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "brightness(0.9)",
                    transition: "transform 0.3s ease",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, var(--s1) 0%, transparent 60%)",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: "14px",
                    left: "14px",
                    background: "rgba(0, 0, 0, 0.7)",
                    backdropFilter: "blur(6px)",
                    color: "var(--pr, #22d3ee)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {item.badge}
                </span>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      position: "absolute",
                      top: "14px",
                      right: "14px",
                      background: "rgba(0, 0, 0, 0.7)",
                      backdropFilter: "blur(6px)",
                      color: "#fff",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <ExternalLink size={12} /> {isRu ? "Источник" : "Source"}
                  </a>
                )}
              </div>
            )}

            {/* Content Body */}
            <div style={{ padding: "18px 20px 22px", display: "flex", flexDirection: "column", flex: 1, gap: "10px" }}>
              <div style={{ fontSize: "11px", color: "var(--t3)", fontWeight: 600, textTransform: "uppercase" }}>
                {item.organization}
              </div>

              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, lineHeight: 1.3 }}>
                {item.title}
              </h3>

              <div style={{ fontSize: "12px", color: "var(--pr)", fontWeight: 600 }}>
                {item.subtitle}
              </div>

              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--t2)", lineHeight: 1.6 }}>
                {item.description}
              </p>

              {/* Clinical Impact Callout */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderLeft: "3px solid var(--pr)",
                  padding: "10px 12px",
                  borderRadius: "0 8px 8px 0",
                  fontSize: "12px",
                  color: "var(--t1)",
                  lineHeight: 1.5,
                  marginTop: "6px",
                }}
              >
                <strong>{isRu ? "Медицинский норматив: " : "Clinical Guideline: "}</strong>
                {item.clinicalImpact}
              </div>

              {/* Platform Integration Footer */}
              <div style={{ marginTop: "auto", borderTop: "1px solid var(--sep)", paddingTop: "12px" }}>
                <span style={{ fontSize: "11px", color: "var(--t3)", fontWeight: 700, textTransform: "uppercase" }}>
                  {isRu ? "Применение в CosmoHealthX:" : "CosmoHealthX Implementation:"}
                </span>
                <span style={{ display: "block", fontSize: "13px", color: "var(--t1)", marginTop: "3px", fontWeight: 500 }}>
                  {item.platformApplication}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Clinical Telemetry Standard Reference Table */}
      <div
        className="sc up"
        style={{
          marginTop: "36px",
          background: "var(--s1)",
          border: "1px solid var(--sep)",
          borderRadius: "20px",
          padding: "26px",
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 6px" }}>
          {isRu ? "Сводная таблица клинических нормативов NASA STD-3001" : "NASA STD-3001 Telemetry Reference Thresholds"}
        </h2>
        <p style={{ fontSize: "13px", color: "var(--t2)", margin: "0 0 20px" }}>
          {isRu
            ? "Нормативные диапазоны биометрических показателей, используемые в алгоритмах триажа CosmoHealthX"
            : "Biometric operational ranges and tripwires implemented in CosmoHealthX clinical triage engine"}
        </p>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--sep)", color: "var(--t3)" }}>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>{isRu ? "Биомаркер" : "Biomarker"}</th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>{isRu ? "Покой (Норма)" : "Nominal Rest"}</th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>{isRu ? "EVA / Нагрузка" : "EVA / Exercise"}</th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>{isRu ? "Внимание (Warning)" : "Warning Limit"}</th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>{isRu ? "Критично (Alarm)" : "Critical Limit"}</th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>{isRu ? "Стандарт" : "Spec"}</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--sep)" }}>
                <td style={{ padding: "12px 14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Heart size={15} style={{ color: "var(--hr)" }} /> {isRu ? "Пульс (ЧСС)" : "Heart Rate"}
                </td>
                <td style={{ padding: "12px 14px" }}>60 – 85 bpm</td>
                <td style={{ padding: "12px 14px" }}>100 – 150 bpm</td>
                <td style={{ padding: "12px 14px", color: "var(--wa)" }}>&gt; 100 bpm в покое</td>
                <td style={{ padding: "12px 14px", color: "var(--cr)", fontWeight: 700 }}>&gt; 165 bpm / &lt; 45 bpm</td>
                <td style={{ padding: "12px 14px", color: "var(--t3)" }}>NASA-STD-3001 Vol 1 §4.2</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--sep)" }}>
                <td style={{ padding: "12px 14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Droplets size={15} style={{ color: "var(--o2)" }} /> {isRu ? "Кислород (SpO₂)" : "Blood Oxygen"}
                </td>
                <td style={{ padding: "12px 14px" }}>96 – 100%</td>
                <td style={{ padding: "12px 14px" }}>95 – 100%</td>
                <td style={{ padding: "12px 14px", color: "var(--wa)" }}>92 – 94%</td>
                <td style={{ padding: "12px 14px", color: "var(--cr)", fontWeight: 700 }}>&lt; 92% (Десатурация)</td>
                <td style={{ padding: "12px 14px", color: "var(--t3)" }}>NASA-STD-3001 Vol 2 §6.1</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--sep)" }}>
                <td style={{ padding: "12px 14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Moon size={15} style={{ color: "var(--sl)" }} /> {isRu ? "Сон (SWS фаза)" : "Sleep Duration"}
                </td>
                <td style={{ padding: "12px 14px" }}>7.5 – 8.5 ч/сут</td>
                <td style={{ padding: "12px 14px" }}>≥ 7.0 ч/сут</td>
                <td style={{ padding: "12px 14px", color: "var(--wa)" }}>&lt; 6.0 ч/сут</td>
                <td style={{ padding: "12px 14px", color: "var(--cr)", fontWeight: 700 }}>&lt; 5.0 ч (Дефицит &gt; 3 сут)</td>
                <td style={{ padding: "12px 14px", color: "var(--t3)" }}>NASA BHP Fatigue Countermeasures</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--sep)" }}>
                <td style={{ padding: "12px 14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Thermometer size={15} style={{ color: "var(--wa)" }} /> {isRu ? "Температура тела" : "Core Body Temp"}
                </td>
                <td style={{ padding: "12px 14px" }}>36.5 – 37.2 °C</td>
                <td style={{ padding: "12px 14px" }}>37.0 – 38.0 °C</td>
                <td style={{ padding: "12px 14px", color: "var(--wa)" }}>&gt; 37.8 °C в покое</td>
                <td style={{ padding: "12px 14px", color: "var(--cr)", fontWeight: 700 }}>&gt; 38.8 °C (Гипертермия)</td>
                <td style={{ padding: "12px 14px", color: "var(--t3)" }}>NASA-STD-3001 Vol 1 §4.3</td>
              </tr>
              <tr>
                <td style={{ padding: "12px 14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Radiation size={15} style={{ color: "var(--cr)" }} /> {isRu ? "Мощность дозы SPE" : "Radiation Dose Rate"}
                </td>
                <td style={{ padding: "12px 14px" }}>0.3 – 0.7 мЗв/сут</td>
                <td style={{ padding: "12px 14px" }}>&lt; 1.0 мЗв/сут</td>
                <td style={{ padding: "12px 14px", color: "var(--wa)" }}>&gt; 1.5 мЗв/сут</td>
                <td style={{ padding: "12px 14px", color: "var(--cr)", fontWeight: 700 }}>&gt; 10 мЗв/ч (SPE шторм)</td>
                <td style={{ padding: "12px 14px", color: "var(--t3)" }}>NASA SRPE / ALARA Principle</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

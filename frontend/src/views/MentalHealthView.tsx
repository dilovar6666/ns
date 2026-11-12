import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  Smile,
  Frown,
  Meh,
  Sparkles,
  HeartHandshake,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  Send,
  Timer,
  Gauge,
  Zap,
  Moon,
  Play,
  RotateCcw,
  FileText,
  Award,
  TrendingUp,
  UserCheck,
  Activity,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Shield,
  Clock,
  Radio,
  Sliders,
} from "lucide-react";
import type { Astronaut, Checkin } from "../api";
import { api } from "../api";

type Props = {
  astronaut?: Astronaut;
  crew: Astronaut[];
  onSelectAstronaut: (id: number) => void;
};

type TestType = "dass" | "tlx" | "sleep" | "pvt";

// Test Definitions with validated space medicine methodologies
const TEST_BATTERIES = [
  {
    id: "dass" as TestType,
    title: "NASA BHP / DASS-21: Психоэмоциональный скрининг",
    subtitle: "Шкала депрессии, тревожности и изоляционного стресса",
    description: "Золотой стандарт оценки эмоционального баланса экипажа в условиях длительной сенсорной депривации и замкнутого объема (NASA Behavioral Health).",
    duration: "4–5 мин",
    itemsCount: 10,
    badge: "РЕКОМЕНДУЕМЫЙ СТАНДАРТ",
    badgeColor: "#3b82f6",
    badgeBg: "rgba(59, 130, 246, 0.15)",
    icon: Brain,
  },
  {
    id: "tlx" as TestType,
    title: "NASA-TLX: Индекс операционной нагрузки",
    subtitle: "Task Load Index (Ментальное давление и стресс при задачах)",
    description: "Многомерная оценка ментальной, физической и временной нагрузки при проведении критических операций (выходы EVA, стыковки, эксперименты).",
    duration: "3 мин",
    itemsCount: 6,
    badge: "ОПЕРАЦИОННАЯ ГОТОВНОСТЬ",
    badgeColor: "#10b981",
    badgeBg: "rgba(16, 185, 129, 0.15)",
    icon: Gauge,
  },
  {
    id: "sleep" as TestType,
    title: "NASA Sleep & Circadian Fatigue Scale",
    subtitle: "Оценка фаз сна, циркадного ритма и дневной сонливости",
    description: "Анализ дефицита глубокого медленноволнового сна (SWS), влияния фонового шума модулей станции и нарушений суточного светового ритма.",
    duration: "3–4 мин",
    itemsCount: 8,
    badge: "ЦИРКАДНЫЙ МОНИТОРИНГ",
    badgeColor: "#8b5cf6",
    badgeBg: "rgba(139, 92, 246, 0.15)",
    icon: Moon,
  },
  {
    id: "pvt" as TestType,
    title: "PVT-Space: Тест психомоторной бдительности",
    subtitle: "Интерактивный замер времени реакции и микропровалов внимания",
    description: "Ежедневный объективный тест реакции (Reaction Time Task). Выполняется космонавтами на орбитальных лэптопах для допуска к критическим маневрам.",
    duration: "2 мин",
    itemsCount: 5,
    badge: "ОБЪЕКТИВНЫЙ ТЕСТ",
    badgeColor: "#f59e0b",
    badgeBg: "rgba(245, 158, 11, 0.15)",
    icon: Zap,
  },
];

// Questions for DASS-21 Space Adaptation
const DASS_QUESTIONS = [
  "Мне было трудно расслабиться и снять мышечное напряжение после завершения рабочей смены.",
  "Я замечал внезапное учащение сердцебиения или сухость во рту в отсутствие физической нагрузки.",
  "Я испытывал трудности с переключением внимания между разными задачами полетного плана.",
  "Я ощущал внезапную нервозность, беспричинное внутреннее беспокойство или ощущение тревоги.",
  "Я чувствовал снижение интереса к происходящему вокруг или усталость от монотонности станции.",
  "Меня раздражали малейшие задержки связи с ЦУП или мелкие бытовые неудобства в модуле.",
  "Я замечал мышечный тремор или скованность в пальцах при выполнении тонких манипуляций.",
  "Мне казалось, что я трачу слишком много нервной энергии на удержание рабочей концентрации.",
  "Я ощущал эмоциональную подавленность или снижение мотивации к выполнению научной программы.",
  "Я чувствовал, что нахожусь в состоянии постоянной тревожной боеготовности и не могу отключиться.",
];

const DASS_OPTIONS = [
  { score: 0, label: "Никогда", desc: "Совершенно не относится ко мне" },
  { score: 1, label: "Иногда", desc: "Проявлялось в слабой степени" },
  { score: 2, label: "Часто", desc: "Проявлялось заметно и регулярно" },
  { score: 3, label: "Почти постоянно", desc: "Очень выраженное состояние" },
];

// Questions for NASA-TLX
const TLX_DIMENSIONS = [
  {
    id: "mental",
    title: "Ментальная нагрузка (Mental Demand)",
    prompt: "Насколько сложным, напряженным и требующим умственной концентрации было выполнение полетных задач за прошедшие сутки?",
    low: "Низкая / Легкие задачи",
    high: "Крайне высокая / Предел концентрации",
  },
  {
    id: "physical",
    title: "Физическая нагрузка (Physical Demand)",
    prompt: "Сколько физических усилий требовалось (фиксация в невесомости, тренировки на ARED/T2, работа в скафандре)?",
    low: "Минимальная / Легкие движения",
    high: "Тяжелая физическая работа",
  },
  {
    id: "temporal",
    title: "Временное давление (Temporal Demand)",
    prompt: "Насколько жестким было давление тайминга и расписания ЦУП? Чувствовали ли вы нехватку времени?",
    low: "Размеренный темп",
    high: "Острая нехватка времени",
  },
  {
    id: "performance",
    title: "Субъективная успешность (Performance)",
    prompt: "Насколько вы удовлетворены качеством выполненных задач и точностью выполнения операций?",
    low: "Множество ошибок / Неудовлетворен",
    high: "Идеальное выполнение без сбоев",
  },
  {
    id: "effort",
    title: "Затраченные усилия (Effort)",
    prompt: "Насколько тяжело вам пришлось работать физически и психически для достижения требуемого уровня?",
    low: "Минимум усилий",
    high: "Предельная мобилизация сил",
  },
  {
    id: "frustration",
    title: "Уровень фрустрации (Frustration)",
    prompt: "Чувствовали ли вы раздражение, стресс, тревогу или недовольство собой во время работы?",
    low: "Спокойствие и уверенность",
    high: "Сильное раздражение и стресс",
  },
];

// Sleep Questionnaire
const SLEEP_QUESTIONS = [
  {
    q: "Сколько времени вам потребовалось, чтобы заснуть после отбоя по расписанию?",
    options: [
      { score: 3, text: "Менее 15 минут (Отличный показатель засыпания)" },
      { score: 2, text: "15–30 минут (В пределах физиологической нормы)" },
      { score: 1, text: "30–60 минут (Умеренная задержка засыпания)" },
      { score: 0, text: "Более 60 минут (Выраженный латентный период сна)" },
    ],
  },
  {
    q: "Беспокоил ли вас фоновый шум систем жизнеобеспечения станции (шум вентиляторов > 50 dBA)?",
    options: [
      { score: 3, text: "Совершенно не беспокоил / Использовал шумоподавление ANC" },
      { score: 2, text: "Шум слышен, но сну не мешал" },
      { score: 1, text: "Шум вызывал периодические микропробуждения" },
      { score: 0, text: "Постоянно просыпался из-за шума и вибрации модуля" },
    ],
  },
  {
    q: "Ощущали ли вы зрительные фосфены («космические вспышки» от заряженных частиц) при закрытых глазах?",
    options: [
      { score: 3, text: "Нет, вспышек не наблюдал" },
      { score: 2, text: "Редкие слабые вспышки (1–2 раза за засыпание)" },
      { score: 1, text: "Умеренная частота (3–5 вспышек), легкое раздражение" },
      { score: 0, text: "Частые яркие световые вспышки, мешающие засыпанию" },
    ],
  },
  {
    q: "Чувствуете ли вы себя отдохнувшим и восстановившимся после подъема?",
    options: [
      { score: 3, text: "Полностью отдохнувшим, бодрость 100%" },
      { score: 2, text: "Умеренная свежесть, готов к работе" },
      { score: 1, text: "Чувство тяжести в голове и вялости первые 30 мин" },
      { score: 0, text: "Хроническая усталость, ощущение глубокого недосыпа" },
    ],
  },
  {
    q: "Возникали ли спонтанные ночные пробуждения или ощущение дезориентации в каюте?",
    options: [
      { score: 3, text: "Спал непрерывно всю ночь" },
      { score: 2, text: "1 пробуждение с быстрым повторным засыпанием" },
      { score: 1, text: "2–3 пробуждения, потеря ориентации «верх/низ»" },
      { score: 0, text: "Частые пробуждения, бессонница" },
    ],
  },
];

export function MentalHealthView({
  astronaut,
  crew,
  onSelectAstronaut,
}: Props) {
  const queryClient = useQueryClient();

  // Mode: "overview" (Dashboard) | "test" (Full-Screen Test Room)
  const [activeTab, setActiveTab] = useState<"overview" | "test">("overview");

  // Selected Test
  const [selectedTest, setSelectedTest] = useState<TestType>("dass");
  const [testStage, setTestStage] = useState<"select" | "in_progress" | "result">("select");

  // DASS Answers (question index -> option score 0-3)
  const [dassAnswers, setDassAnswers] = useState<Record<number, number>>({});
  const [dassCurrentStep, setDassCurrentStep] = useState(0);

  // TLX Values (dimension id -> 0-100)
  const [tlxValues, setTlxValues] = useState<Record<string, number>>({
    mental: 45,
    physical: 40,
    temporal: 50,
    performance: 85,
    effort: 55,
    frustration: 20,
  });

  // Sleep Answers (question index -> score 0-3)
  const [sleepAnswers, setSleepAnswers] = useState<Record<number, number>>({});
  const [sleepCurrentStep, setSleepCurrentStep] = useState(0);

  // PVT Interactive Test State
  const [pvtRound, setPvtRound] = useState(0);
  const [pvtState, setPvtState] = useState<"waiting" | "ready" | "flash" | "done">("waiting");
  const [pvtTimes, setPvtTimes] = useState<number[]>([]);
  const [pvtCurrentMs, setPvtCurrentMs] = useState(0);
  const [pvtFalseStarts, setPvtFalseStarts] = useState(0);
  const pvtTimerRef = useRef<any>(null);
  const pvtStartTimestamp = useRef<number>(0);

  // Completed Test Final Diagnostic Data
  const [finalReport, setFinalReport] = useState<{
    testTitle: string;
    overallScore: number;
    scoreLevel: string;
    levelColor: string;
    stressVal: number;
    moodVal: number;
    focusVal: number;
    isolationVal: number;
    sleepVal: number;
    summary: string;
    recommendations: string[];
  } | null>(null);

  const [toastMsg, setToastMsg] = useState("");

  const { data: checkins = [], isLoading } = useQuery<Checkin[]>({
    queryKey: ["checkins", astronaut?.id],
    queryFn: () => (astronaut ? api(`/astronauts/${astronaut.id}/checkins`) : []),
    enabled: !!astronaut,
  });

  const checkinMutation = useMutation({
    mutationFn: (newEntry: {
      mood: number;
      focus: number;
      stress: number;
      isolation: number;
      sleep: number;
      comment: string;
    }) => {
      const astroId = astronaut?.id || 1;
      return api(`/astronauts/${astroId}/checkins`, "astronaut", {
        method: "POST",
        body: JSON.stringify(newEntry),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkins", astronaut?.id] });
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
      setToastMsg("Результаты клинического теста успешно занесены в медицинскую карту экипажа.");
      setTimeout(() => setToastMsg(""), 4500);
      setActiveTab("overview");
      setTestStage("select");
    },
    onError: (err: any) => {
      setToastMsg(`Ошибка сохранения: ${err.message || "Сбой связи с сервером"}`);
      setTimeout(() => setToastMsg(""), 4500);
    },
  });

  // Calculate Averages from Past Check-ins
  const latestCheckin = checkins[0];
  const avgMood = checkins.length
    ? (checkins.reduce((s, c) => s + c.mood, 0) / checkins.length).toFixed(1)
    : "4.2";
  const avgStress = checkins.length
    ? (checkins.reduce((s, c) => s + c.stress, 0) / checkins.length).toFixed(1)
    : "2.1";

  // Start selected test
  const handleStartTest = (type: TestType) => {
    setSelectedTest(type);
    setTestStage("in_progress");

    if (type === "dass") {
      setDassAnswers({});
      setDassCurrentStep(0);
    } else if (type === "tlx") {
      // keep current values or reset
    } else if (type === "sleep") {
      setSleepAnswers({});
      setSleepCurrentStep(0);
    } else if (type === "pvt") {
      setPvtRound(0);
      setPvtTimes([]);
      setPvtFalseStarts(0);
      setPvtState("waiting");
    }
  };

  // PVT Reaction Logic
  useEffect(() => {
    if (selectedTest === "pvt" && testStage === "in_progress" && pvtState === "ready") {
      const delay = Math.floor(Math.random() * 2500) + 1800; // 1.8s - 4.3s random delay
      const timeout = setTimeout(() => {
        pvtStartTimestamp.current = Date.now();
        setPvtState("flash");
        pvtTimerRef.current = setInterval(() => {
          setPvtCurrentMs(Date.now() - pvtStartTimestamp.current);
        }, 16);
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [pvtState, selectedTest, testStage]);

  const handlePvtClick = () => {
    if (pvtState === "ready") {
      // False start!
      setPvtFalseStarts((prev) => prev + 1);
      setPvtState("waiting");
      setToastMsg("Фальстарт! Нажимайте кнопку только при появлении зеленого сигнала.");
      setTimeout(() => setToastMsg(""), 2000);
      return;
    }

    if (pvtState === "flash") {
      clearInterval(pvtTimerRef.current);
      const reactionTime = Date.now() - pvtStartTimestamp.current;
      const newTimes = [...pvtTimes, reactionTime];
      setPvtTimes(newTimes);

      if (newTimes.length >= 5) {
        // PVT Finished!
        setPvtState("done");
        calculatePvtResults(newTimes);
      } else {
        setPvtRound((prev) => prev + 1);
        setPvtState("waiting");
      }
    }
  };

  const calculatePvtResults = (times: number[]) => {
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const lapses = times.filter((t) => t > 500).length;

    let scoreLevel = "ВЫСОКАЯ БДИНОСТЬ";
    let levelColor = "#10b981";
    let focusScore = 5;

    if (avg < 240) {
      scoreLevel = "ОТЛИЧНАЯ РЕАКЦИЯ (ВЫСШИЙ КЛАСС)";
      levelColor = "#10b981";
      focusScore = 5;
    } else if (avg < 310) {
      scoreLevel = "НОРМАЛЬНАЯ РАБОЧАЯ БДИНОСТЬ";
      levelColor = "#3b82f6";
      focusScore = 4;
    } else if (avg < 390) {
      scoreLevel = "УМЕРЕННОЕ ЗАМЕДЛЕНИЕ РЕАКЦИИ";
      levelColor = "#f59e0b";
      focusScore = 3;
    } else {
      scoreLevel = "КОГНИТИВНОЕ УТОМЛЕНИЕ (ОПЕРАЦИИ ОГРАНИЧЕНЫ)";
      levelColor = "#ef4444";
      focusScore = 2;
    }

    setFinalReport({
      testTitle: "PVT-Space: Тест психомоторной бдительности",
      overallScore: Math.max(40, Math.min(100, Math.round(100 - (avg - 200) * 0.25))),
      scoreLevel,
      levelColor,
      stressVal: lapses > 0 ? 3 : 2,
      moodVal: 4,
      focusVal: focusScore,
      isolationVal: 2,
      sleepVal: avg < 300 ? 4 : 3,
      summary: `Среднее время сенсомоторной реакции составило ${avg} мс (норматив NASA: < 280 мс). Зафиксировано пропусков внимания (>500 мс): ${lapses}. Фальстартов: ${pvtFalseStarts}.`,
      recommendations: [
        avg < 300
          ? "Когнитивная готовность к внекорабельной деятельности (EVA) и стыковочным операциям подтверждена."
          : "Рекомендована 20-минутная когнитивная разгрузка перед началом пре-бризинга скафандров.",
        "Поддержание гидратации (минимум 300 мл электролитного раствора перед сменой).",
        "Контроль циркадного освещения в рабочем модуле станции.",
      ],
    });
    setTestStage("result");
  };

  // Finish DASS Test
  const finishDassTest = () => {
    let totalScore = 0;
    Object.values(dassAnswers).forEach((val) => {
      totalScore += val;
    });

    // Normalize: max score is 30. Lower is better.
    const pct = Math.round(((30 - totalScore) / 30) * 100);
    let scoreLevel = "ОПТИМАЛЬНОЕ ПСИХОЭМОЦИОНАЛЬНОЕ СОСТОЯНИЕ";
    let levelColor = "#10b981";
    let stressScore = 1;
    let moodScore = 5;

    if (totalScore <= 6) {
      scoreLevel = "СТАБИЛЬНАЯ АДАПТАЦИЯ (НОРМА NASA)";
      levelColor = "#10b981";
      stressScore = 1;
      moodScore = 5;
    } else if (totalScore <= 12) {
      scoreLevel = "УМЕРЕННЫЙ ФАКТОР НАПРЯЖЕНИЯ";
      levelColor = "#3b82f6";
      stressScore = 2;
      moodScore = 4;
    } else if (totalScore <= 20) {
      scoreLevel = "ПОВЫШЕННЫЙ СТРЕСС И СЕНСОРНАЯ ДЕПРИВАЦИЯ";
      levelColor = "#f59e0b";
      stressScore = 3;
      moodScore = 3;
    } else {
      scoreLevel = "ВЫРАЖЕННАЯ АСТЕНИЯ / ТРЕВОЖНОСТЬ";
      levelColor = "#ef4444";
      stressScore = 4;
      moodScore = 2;
    }

    setFinalReport({
      testTitle: "NASA BHP / DASS-21: Психоэмоциональный скрининг",
      overallScore: pct,
      scoreLevel,
      levelColor,
      stressVal: stressScore,
      moodVal: moodScore,
      focusVal: 4,
      isolationVal: 2,
      sleepVal: 4,
      summary: `Суммарный индекс психоэмоционального напряжения составил ${totalScore} из 30 баллов. Уровень тревожности и симптомы изоляционного стресса находятся в допустимом коридоре NASA STD-3001.`,
      recommendations: [
        "Сеанс светотерапии синим спектром (480 нм) длительностью 30 минут для поддержания тонуса.",
        "VR-релаксация с природными земными звуковыми биомами в вечернее время.",
        "Плановый сеанс закрытой видеоконференции с семьей (PFC) по выделенному Ku-каналу.",
      ],
    });
    setTestStage("result");
  };

  // Finish NASA-TLX
  const finishTlxTest = () => {
    const rawAvg = Math.round(
      (tlxValues.mental + tlxValues.physical + tlxValues.temporal + (100 - tlxValues.performance) + tlxValues.effort + tlxValues.frustration) / 6
    );
    const workloadScore = 100 - rawAvg;

    let scoreLevel = "ОПТИМАЛЬНАЯ РАБОЧАЯ НАГРУЗКА";
    let levelColor = "#10b981";

    if (rawAvg < 40) {
      scoreLevel = "КОМФОРТНЫЙ ОПЕРАЦИОННЫЙ РЕЖИМ";
      levelColor = "#10b981";
    } else if (rawAvg < 65) {
      scoreLevel = "УМЕРЕННАЯ ОПЕРАЦИОННАЯ НАГРУЗКА";
      levelColor = "#3b82f6";
    } else if (rawAvg < 80) {
      scoreLevel = "ВЫСОКОЕ ОПЕРАЦИОННОЕ ДАВЛЕНИЕ";
      levelColor = "#f59e0b";
    } else {
      scoreLevel = "КРИТИЧЕСКИЙ УРОВЕНЬ ПЕРЕГРУЗКИ (РИСК ОШИБОК)";
      levelColor = "#ef4444";
    }

    setFinalReport({
      testTitle: "NASA-TLX: Индекс операционной нагрузки",
      overallScore: workloadScore,
      scoreLevel,
      levelColor,
      stressVal: rawAvg > 65 ? 3 : 2,
      moodVal: 4,
      focusVal: tlxValues.performance > 75 ? 5 : 4,
      isolationVal: 2,
      sleepVal: 4,
      summary: `Интегральный индекс нагрузки NASA-TLX составил ${rawAvg}/100. Наибольший вклад внесли факторы «${tlxValues.mental > 60 ? "Ментальная концентрация" : "Временное давление"}» и «Затраченные усилия». Субъективная успешность выполнения оценена в ${tlxValues.performance}%.`,
      recommendations: [
        "Коррекция темпа полетного плана: перерыв 15 минут между блоками научной аппаратуры.",
        "Снижение вербальной нагрузки по голосовому контуру связи с ЦУП.",
        "Выполнение дыхательной гимнастики с биологической обратной связью по HRV.",
      ],
    });
    setTestStage("result");
  };

  // Finish Sleep Test
  const finishSleepTest = () => {
    let scoreSum = 0;
    Object.values(sleepAnswers).forEach((s) => (scoreSum += s));
    const maxScore = SLEEP_QUESTIONS.length * 3;
    const pct = Math.round((scoreSum / maxScore) * 100);

    let scoreLevel = "ОТЛИЧНОЕ ВОССТАНОВЛЕНИЕ И КАЧЕСТВО СНА";
    let levelColor = "#10b981";

    if (pct >= 80) {
      scoreLevel = "ГЛУБОКИЙ СОН БЕЗ ДЕСИНХРОНОЗА";
      levelColor = "#10b981";
    } else if (pct >= 60) {
      scoreLevel = "УМЕРЕННЫЙ СДВИГ ФАЗЫ СНА";
      levelColor = "#3b82f6";
    } else {
      scoreLevel = "ДЕФИЦИТ МЕДЛЕННОВОЛНОВОГО СНА (SWS)";
      levelColor = "#f59e0b";
    }

    setFinalReport({
      testTitle: "NASA Sleep & Circadian Fatigue Scale",
      overallScore: pct,
      scoreLevel,
      levelColor,
      stressVal: 2,
      moodVal: 4,
      focusVal: 4,
      isolationVal: 2,
      sleepVal: pct >= 80 ? 5 : pct >= 60 ? 4 : 3,
      summary: `Качество сна оценено в ${pct}% от идеального профиля. Уровень ночных световых помех и фонового шума в пределах нормы. Риск операционного утомления низкий.`,
      recommendations: [
        "Переключение светодиодных панелей каюты на режим 2200K за 1 час до отбоя.",
        "Прием 0.3 мг мелатонина при необходимости синхронизации цикла.",
        "Использование берушей с активным шумоподавлением (ANC) в спальном отсеке.",
      ],
    });
    setTestStage("result");
  };

  // Save report to Backend API
  const handleSaveReportToMedicalRecord = () => {
    if (!finalReport) return;
    checkinMutation.mutate({
      mood: finalReport.moodVal,
      focus: finalReport.focusVal,
      stress: finalReport.stressVal,
      isolation: finalReport.isolationVal,
      sleep: finalReport.sleepVal,
      comment: `[${finalReport.testTitle}]: Итоговый балл ${finalReport.overallScore}/100 (${finalReport.scoreLevel}). ${finalReport.summary}`,
    });
  };

  return (
    <div className="wrapc" style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "70px" }}>
      {/* Top Header */}
      <header className="tb" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div className="up">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--pr)" }}>
                NASA Behavioral Health and Performance (BHP) Protocol
              </span>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontWeight: 600 }}>
                ● Психологическая стабилизация
              </span>
            </div>
            <h1 className="lt disp" style={{ margin: "0 0 6px" }}>Mental Health & Cognitive Testing</h1>
            <p className="sub" style={{ margin: 0, maxWidth: "780px", color: "var(--t2)" }}>
              Многофакторный нейрокогнитивный мониторинг экипажа, валидированные тесты NASA-TLX и DASS-21, объективная оценка сенсомоторной реакции и психологические контрмеры.
            </p>
          </div>

          {/* Navigation Pill Switcher */}
          <div style={{ display: "flex", gap: "8px", background: "var(--s1)", padding: "4px", borderRadius: "14px", border: "1px solid var(--sep)" }}>
            <button
              onClick={() => { setActiveTab("overview"); setTestStage("select"); }}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: activeTab === "overview" ? 700 : 500,
                background: activeTab === "overview" ? "var(--pr)" : "transparent",
                color: activeTab === "overview" ? "#fff" : "var(--t2)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Обзор и статистика
            </button>
            <button
              onClick={() => { setActiveTab("test"); setTestStage("select"); }}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: activeTab === "test" ? 700 : 500,
                background: activeTab === "test" ? "var(--pr)" : "transparent",
                color: activeTab === "test" ? "#fff" : "var(--t2)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
            >
              <Sparkles size={14} />
              <span>Центр тестирования (4 теста)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Alert */}
      {toastMsg && (
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
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* VIEW MODE 1: OVERVIEW DASHBOARD */}
      {activeTab === "overview" && (
        <>
          {/* 4 Score Cards */}
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "var(--s1)", border: "1px solid var(--sep)", padding: "20px 22px", borderRadius: "18px" }}>
              <div style={{ fontSize: "12px", color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                Эмоциональный баланс
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--tx)", marginTop: "6px" }}>
                {avgMood} <span style={{ fontSize: "15px", color: "var(--t3)", fontWeight: 500 }}>/ 5.0</span>
              </div>
              <div style={{ fontSize: "12px", color: "#10b981", marginTop: "4px", fontWeight: 600 }}>
                ● Стабильно позитивное состояние
              </div>
            </div>

            <div style={{ background: "var(--s1)", border: "1px solid var(--sep)", padding: "20px 22px", borderRadius: "18px" }}>
              <div style={{ fontSize: "12px", color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                Индекс стрессовой нагрузки
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#3b82f6", marginTop: "6px" }}>
                {avgStress} <span style={{ fontSize: "15px", color: "var(--t3)", fontWeight: 500 }}>/ 5.0</span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--t3)", marginTop: "4px" }}>
                Коридор ALARA соблюден
              </div>
            </div>

            <div style={{ background: "var(--s1)", border: "1px solid var(--sep)", padding: "20px 22px", borderRadius: "18px" }}>
              <div style={{ fontSize: "12px", color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                Когнитивная концентрация
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--cy)", marginTop: "6px" }}>
                {latestCheckin ? latestCheckin.focus : 4.0} <span style={{ fontSize: "15px", color: "var(--t3)", fontWeight: 500 }}>/ 5.0</span>
              </div>
              <div style={{ fontSize: "12px", color: "#10b981", marginTop: "4px", fontWeight: 600 }}>
                ● Готовность к критическим маневрам
              </div>
            </div>

            <div style={{ background: "var(--s1)", border: "1px solid var(--sep)", padding: "20px 22px", borderRadius: "18px" }}>
              <div style={{ fontSize: "12px", color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                Сплоченность экипажа
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#10b981", marginTop: "6px" }}>
                94 <span style={{ fontSize: "15px", color: "var(--t3)", fontWeight: 500 }}>%</span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--t3)", marginTop: "4px" }}>
                Высокий уровень взаимовыручки
              </div>
            </div>
          </section>

          {/* Banner to launch testing suite */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)",
              border: "1px solid rgba(59, 130, 246, 0.35)",
              borderRadius: "20px",
              padding: "24px 28px",
              marginBottom: "28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--pr)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                Плановое нейропсихологическое обследование (Mission Day 42)
              </div>
              <h2 style={{ margin: "0 0 6px", fontSize: "19px", fontWeight: 800 }}>
                Пройти расширенную батарею тестов NASA
              </h2>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--t2)", maxWidth: "680px" }}>
                Выберите один из 4 научно валидированных протоколов: скрининг стресса DASS-21, шкалу операционной нагрузки NASA-TLX, тест циркадного сна или сенсомоторную реакцию PVT.
              </p>
            </div>

            <button
              onClick={() => { setActiveTab("test"); setTestStage("select"); }}
              className="btn pri"
              style={{
                padding: "12px 24px",
                borderRadius: "14px",
                fontSize: "14px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 20px rgba(59, 130, 246, 0.4)",
              }}
            >
              <Play size={16} />
              <span>Перейти к тестированию</span>
            </button>
          </div>

          {/* Two Column Grid: History and Countermeasures */}
          <div className="responsive-split-2col">
            {/* Past Check-ins Log */}
            <div style={{ background: "var(--s1)", border: "1px solid var(--sep)", borderRadius: "20px", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                  Журнал клинических оценок и чек-инов
                </h3>
                <span style={{ fontSize: "12px", color: "var(--t3)" }}>Всего записей: {checkins.length}</span>
              </div>

              {isLoading ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--t3)" }}>
                  Загрузка истории...
                </div>
              ) : checkins.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--t3)" }}>
                  Записей пока нет. Пройдите тестирование выше для первой фиксации.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {checkins.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        background: "var(--s2)",
                        border: "1px solid var(--sep)",
                        borderRadius: "14px",
                        padding: "14px 16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                            Настроение: {entry.mood}/5
                          </span>
                          <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "rgba(59, 130, 246, 0.15)", color: "var(--pr)" }}>
                            Стресс: {entry.stress}/5
                          </span>
                          <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}>
                            Фокус: {entry.focus}/5
                          </span>
                        </div>
                        <span style={{ fontSize: "11px", color: "var(--t3)" }}>
                          {new Date(entry.created_at).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {entry.comment && (
                        <p style={{ margin: 0, fontSize: "13px", color: "var(--tx)", lineHeight: "1.5" }}>
                          {entry.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Psychological Countermeasures */}
            <div style={{ background: "var(--s1)", border: "1px solid var(--sep)", borderRadius: "20px", padding: "24px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700 }}>
                Психологические контрмеры (NASA Behavioral Health)
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", gap: "12px", background: "var(--s2)", padding: "14px 16px", borderRadius: "14px", border: "1px solid var(--sep)" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pr)", flexShrink: 0 }}>
                    <Brain size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px" }}>Световая терапия синим спектром (480 нм)</div>
                    <div style={{ fontSize: "12px", color: "var(--t2)", marginTop: "4px", lineHeight: "1.5" }}>
                      30 минут фотостимуляции после пробуждения для синхронизации супрахиазматического ядра и подавления утренней сонливости.
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", background: "var(--s2)", padding: "14px 16px", borderRadius: "14px", border: "1px solid var(--sep)" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", flexShrink: 0 }}>
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px" }}>VR-релаксация с земными биомами</div>
                    <div style={{ fontSize: "12px", color: "var(--t2)", marginTop: "4px", lineHeight: "1.5" }}>
                      Виртуальное погружение в хвойный лес и шум прибоя снижает уровень кортизола и сенсорную депривацию в невесомости.
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", background: "var(--s2)", padding: "14px 16px", borderRadius: "14px", border: "1px solid var(--sep)" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b", flexShrink: 0 }}>
                    <HeartHandshake size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px" }}>Сеанс связи с семьей (Private Family Conference)</div>
                    <div style={{ fontSize: "12px", color: "var(--t2)", marginTop: "4px", lineHeight: "1.5" }}>
                      Запланировано на субботу, виток 682, выделенный широкополосный канал Ku-диапазона.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* VIEW MODE 2: FULL-SCREEN TESTING ROOM */}
      {activeTab === "test" && (
        <div style={{ background: "var(--s1)", border: "1px solid var(--sep)", borderRadius: "24px", padding: "32px", boxShadow: "0 12px 40px rgba(0,0,0,0.15)" }}>
          {/* STAGE 1: TEST BATTERY SELECTION */}
          {testStage === "select" && (
            <div>
              <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 32px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--pr)", letterSpacing: "1px" }}>
                  Клинический тестовый модуль станции CHX-01
                </span>
                <h2 style={{ fontSize: "26px", fontWeight: 800, margin: "6px 0 10px" }}>
                  Выберите диагностическую батарею тестов
                </h2>
                <p style={{ fontSize: "14px", color: "var(--t2)", lineHeight: "1.6", margin: 0 }}>
                  Каждый тест разработан на основе официальных методологий космических агентств (NASA, ESA, ИМБП РАН) для выявления скрытого утомления, десинхроноза и когнитивных рисков.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                {TEST_BATTERIES.map((tb) => {
                  const IconComponent = tb.icon;
                  return (
                    <div
                      key={tb.id}
                      style={{
                        background: "var(--s2)",
                        border: "1px solid var(--sep)",
                        borderRadius: "18px",
                        padding: "24px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        transition: "transform 0.15s ease, border-color 0.15s ease",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 800,
                              padding: "3px 8px",
                              borderRadius: "6px",
                              background: tb.badgeBg,
                              color: tb.badgeColor,
                              border: `1px solid ${tb.badgeColor}33`,
                            }}
                          >
                            {tb.badge}
                          </span>
                          <span style={{ fontSize: "12px", color: "var(--t3)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Clock size={13} /> {tb.duration}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                          <div
                            style={{
                              width: "42px",
                              height: "42px",
                              borderRadius: "12px",
                              background: tb.badgeBg,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: tb.badgeColor,
                              flexShrink: 0,
                            }}
                          >
                            <IconComponent size={22} />
                          </div>
                          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, lineHeight: "1.3" }}>
                            {tb.title}
                          </h3>
                        </div>

                        <p style={{ margin: "0 0 18px", fontSize: "13px", color: "var(--t2)", lineHeight: "1.6" }}>
                          {tb.description}
                        </p>
                      </div>

                      <button
                        onClick={() => handleStartTest(tb.id)}
                        className="btn pri"
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "12px",
                          fontSize: "14px",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <Play size={16} />
                        <span>Начать тест ({tb.itemsCount} {tb.id === "pvt" ? "раундов" : "пунктов"})</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STAGE 2: IN PROGRESS TEST RUNNER */}
          {testStage === "in_progress" && (
            <div>
              {/* Top Progress Navigation */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                <button
                  onClick={() => setTestStage("select")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--t2)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Выбрать другой тест</span>
                </button>

                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--pr)" }}>
                  {selectedTest === "dass" && `Вопрос ${dassCurrentStep + 1} из ${DASS_QUESTIONS.length}`}
                  {selectedTest === "tlx" && `Шкала операционной нагрузки NASA-TLX`}
                  {selectedTest === "sleep" && `Вопрос ${sleepCurrentStep + 1} из ${SLEEP_QUESTIONS.length}`}
                  {selectedTest === "pvt" && `Раунд ${pvtRound + 1} из 5 · Тест реакции`}
                </div>
              </div>

              {/* VARIATION 1: DASS-21 RUNNER */}
              {selectedTest === "dass" && (
                <div style={{ maxWidth: "720px", margin: "0 auto" }}>
                  {/* Progress bar */}
                  <div style={{ width: "100%", height: "6px", background: "var(--s2)", borderRadius: "6px", overflow: "hidden", marginBottom: "28px" }}>
                    <div
                      style={{
                        width: `${((dassCurrentStep + 1) / DASS_QUESTIONS.length) * 100}%`,
                        height: "100%",
                        background: "var(--pr)",
                        transition: "width 0.25s ease",
                      }}
                    />
                  </div>

                  <div style={{ minHeight: "180px", marginBottom: "28px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--t3)", letterSpacing: "1px" }}>
                      Оцените состояние за последние 48 часов:
                    </span>
                    <h3 style={{ fontSize: "20px", fontWeight: 700, color: "var(--tx)", lineHeight: "1.5", marginTop: "8px" }}>
                      «{DASS_QUESTIONS[dassCurrentStep]}»
                    </h3>
                  </div>

                  {/* Options */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", marginBottom: "32px" }}>
                    {DASS_OPTIONS.map((opt) => {
                      const isSelected = dassAnswers[dassCurrentStep] === opt.score;
                      return (
                        <div
                          key={opt.score}
                          onClick={() => {
                            setDassAnswers((prev) => ({ ...prev, [dassCurrentStep]: opt.score }));
                          }}
                          style={{
                            padding: "16px 20px",
                            borderRadius: "14px",
                            background: isSelected ? "rgba(59, 130, 246, 0.15)" : "var(--s2)",
                            border: isSelected ? "2px solid var(--pr)" : "1px solid var(--sep)",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "15px", fontWeight: 700, color: isSelected ? "var(--pr)" : "var(--tx)" }}>
                              {opt.label}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--t2)", marginTop: "2px" }}>
                              {opt.desc}
                            </div>
                          </div>
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              border: isSelected ? "6px solid var(--pr)" : "2px solid var(--sep)",
                              background: "var(--bg)",
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Step Buttons */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button
                      type="button"
                      disabled={dassCurrentStep === 0}
                      onClick={() => setDassCurrentStep((prev) => prev - 1)}
                      className="btn sec"
                      style={{ padding: "10px 18px", borderRadius: "10px" }}
                    >
                      Назад
                    </button>

                    {dassCurrentStep < DASS_QUESTIONS.length - 1 ? (
                      <button
                        type="button"
                        disabled={dassAnswers[dassCurrentStep] === undefined}
                        onClick={() => setDassCurrentStep((prev) => prev + 1)}
                        className="btn pri"
                        style={{ padding: "10px 24px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        <span>Далее</span>
                        <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={dassAnswers[dassCurrentStep] === undefined}
                        onClick={finishDassTest}
                        className="btn pri"
                        style={{ padding: "10px 24px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        <CheckCircle2 size={16} />
                        <span>Сформировать заключение</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* VARIATION 2: NASA-TLX RUNNER */}
              {selectedTest === "tlx" && (
                <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                  <div style={{ marginBottom: "28px", textAlign: "center" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 6px" }}>
                      Многомерная шкала операционной нагрузки NASA-TLX
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--t2)", margin: 0 }}>
                      Отрегулируйте ползунки в соответствии с фактической тяжестью выполненных операций.
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "22px", marginBottom: "32px" }}>
                    {TLX_DIMENSIONS.map((dim) => (
                      <div key={dim.id} style={{ background: "var(--s2)", padding: "18px 22px", borderRadius: "16px", border: "1px solid var(--sep)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--tx)" }}>
                            {dim.title}
                          </span>
                          <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--pr)" }}>
                            {tlxValues[dim.id]}%
                          </span>
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--t2)", margin: "0 0 14px", lineHeight: "1.5" }}>
                          {dim.prompt}
                        </p>

                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={tlxValues[dim.id]}
                          onChange={(e) => setTlxValues((prev) => ({ ...prev, [dim.id]: Number(e.target.value) }))}
                          style={{ width: "100%", accentColor: "var(--pr)", height: "6px" }}
                        />

                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--t3)", marginTop: "6px" }}>
                          <span>{dim.low}</span>
                          <span>{dim.high}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={finishTlxTest}
                    className="btn pri"
                    style={{ width: "100%", padding: "14px", borderRadius: "14px", fontSize: "15px", fontWeight: 700 }}
                  >
                    Завершить и рассчитать индекс NASA-TLX
                  </button>
                </div>
              )}

              {/* VARIATION 3: SLEEP RUNNER */}
              {selectedTest === "sleep" && (
                <div style={{ maxWidth: "720px", margin: "0 auto" }}>
                  <div style={{ width: "100%", height: "6px", background: "var(--s2)", borderRadius: "6px", overflow: "hidden", marginBottom: "28px" }}>
                    <div
                      style={{
                        width: `${((sleepCurrentStep + 1) / SLEEP_QUESTIONS.length) * 100}%`,
                        height: "100%",
                        background: "#8b5cf6",
                        transition: "width 0.25s ease",
                      }}
                    />
                  </div>

                  <div style={{ minHeight: "140px", marginBottom: "24px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--t3)", letterSpacing: "1px" }}>
                      Анализ сна и циркадного цикла:
                    </span>
                    <h3 style={{ fontSize: "19px", fontWeight: 700, color: "var(--tx)", lineHeight: "1.5", marginTop: "8px" }}>
                      {SLEEP_QUESTIONS[sleepCurrentStep].q}
                    </h3>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", marginBottom: "32px" }}>
                    {SLEEP_QUESTIONS[sleepCurrentStep].options.map((opt, idx) => {
                      const isSelected = sleepAnswers[sleepCurrentStep] === opt.score;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSleepAnswers((prev) => ({ ...prev, [sleepCurrentStep]: opt.score }))}
                          style={{
                            padding: "16px 20px",
                            borderRadius: "14px",
                            background: isSelected ? "rgba(139, 92, 246, 0.15)" : "var(--s2)",
                            border: isSelected ? "2px solid #8b5cf6" : "1px solid var(--sep)",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontSize: "14px", fontWeight: 600, color: isSelected ? "#8b5cf6" : "var(--tx)" }}>
                            {opt.text}
                          </span>
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              border: isSelected ? "6px solid #8b5cf6" : "2px solid var(--sep)",
                              background: "var(--bg)",
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button
                      type="button"
                      disabled={sleepCurrentStep === 0}
                      onClick={() => setSleepCurrentStep((prev) => prev - 1)}
                      className="btn sec"
                      style={{ padding: "10px 18px", borderRadius: "10px" }}
                    >
                      Назад
                    </button>

                    {sleepCurrentStep < SLEEP_QUESTIONS.length - 1 ? (
                      <button
                        type="button"
                        disabled={sleepAnswers[sleepCurrentStep] === undefined}
                        onClick={() => setSleepCurrentStep((prev) => prev + 1)}
                        className="btn pri"
                        style={{ padding: "10px 24px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        <span>Далее</span>
                        <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={sleepAnswers[sleepCurrentStep] === undefined}
                        onClick={finishSleepTest}
                        className="btn pri"
                        style={{ padding: "10px 24px", borderRadius: "10px" }}
                      >
                        Сформировать отчет
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* VARIATION 4: PVT-SPACE INTERACTIVE TEST */}
              {selectedTest === "pvt" && (
                <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
                  <div style={{ marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 6px" }}>
                      PVT-Space: Сенсомоторная бдительность (Раунд {pvtRound + 1} из 5)
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--t2)", margin: 0 }}>
                      Инструкция: Нажмите «ПРИГОТОВИТЬСЯ». Как только экран загорится ЗЕЛЕНЫМ и побежит счетчик мс — кликните по экрану максимально быстро!
                    </p>
                  </div>

                  {/* Reaction Interactive Box */}
                  <div
                    onClick={handlePvtClick}
                    style={{
                      height: "280px",
                      borderRadius: "20px",
                      background:
                        pvtState === "flash"
                          ? "#10b981"
                          : pvtState === "ready"
                          ? "#ef4444"
                          : "var(--s2)",
                      border: "2px solid var(--sep)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      userSelect: "none",
                      boxShadow: pvtState === "flash" ? "0 0 40px #10b981" : "none",
                      transition: "background 0.1s ease",
                      marginBottom: "24px",
                    }}
                  >
                    {pvtState === "waiting" && (
                      <div>
                        <Zap size={40} style={{ color: "var(--pr)", marginBottom: "12px" }} />
                        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--tx)" }}>
                          Нажмите кнопку «НАЧАТЬ РАУНД» ниже
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--t3)", marginTop: "4px" }}>
                          Будьте внимательны: не нажимайте до появления зеленого сигнала
                        </div>
                      </div>
                    )}

                    {pvtState === "ready" && (
                      <div>
                        <div style={{ fontSize: "28px", fontWeight: 900, color: "#fff", letterSpacing: "2px" }}>
                          ЖДИТЕ СИГНАЛА...
                        </div>
                        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", marginTop: "6px" }}>
                          (Не нажимайте раньше времени)
                        </div>
                      </div>
                    )}

                    {pvtState === "flash" && (
                      <div>
                        <div style={{ fontSize: "52px", fontWeight: 900, color: "#000", fontFamily: "monospace" }}>
                          {pvtCurrentMs} <span style={{ fontSize: "24px" }}>мс</span>
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: 800, color: "#000", marginTop: "4px" }}>
                          НАЖИМАЙТЕ СЕЙЧАС!
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PVT Action Button */}
                  {pvtState === "waiting" && (
                    <button
                      type="button"
                      onClick={() => setPvtState("ready")}
                      className="btn pri"
                      style={{ padding: "14px 32px", borderRadius: "14px", fontSize: "15px", fontWeight: 700 }}
                    >
                      Начать раунд {pvtRound + 1}
                    </button>
                  )}

                  {/* Past round times */}
                  {pvtTimes.length > 0 && (
                    <div style={{ marginTop: "24px", display: "flex", justifyContent: "center", gap: "10px" }}>
                      {pvtTimes.map((t, i) => (
                        <span key={i} style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "8px", background: "var(--s2)", border: "1px solid var(--sep)" }}>
                          Р{i + 1}: <strong>{t} мс</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STAGE 3: COMPREHENSIVE CLINICAL REPORT */}
          {testStage === "result" && finalReport && (
            <div style={{ maxWidth: "760px", margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "20px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
                  <CheckCircle2 size={14} /> ТЕСТИРОВАНИЕ ЗАВЕРШЕНО УСПЕШНО
                </div>
                <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 6px" }}>
                  {finalReport.testTitle}
                </h2>
                <div style={{ fontSize: "13px", color: "var(--t3)" }}>
                  Субъект: {astronaut?.name || "Алекс Нова (CMO)"} · Дата: {new Date().toLocaleDateString("ru-RU")}
                </div>
              </div>

              {/* Overall Score Banner */}
              <div
                style={{
                  background: "var(--s2)",
                  border: `2px solid ${finalReport.levelColor}`,
                  borderRadius: "20px",
                  padding: "24px",
                  textAlign: "center",
                  marginBottom: "24px",
                  boxShadow: `0 8px 30px ${finalReport.levelColor}22`,
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 800, color: finalReport.levelColor, textTransform: "uppercase", letterSpacing: "1px" }}>
                  {finalReport.scoreLevel}
                </div>
                <div style={{ fontSize: "56px", fontWeight: 900, color: "var(--tx)", margin: "4px 0" }}>
                  {finalReport.overallScore} <span style={{ fontSize: "20px", color: "var(--t3)", fontWeight: 500 }}>/ 100</span>
                </div>
                <p style={{ margin: "8px 0 0", fontSize: "14px", color: "var(--t1)", lineHeight: "1.6", maxWidth: "600px", marginLeft: "auto", marginRight: "auto" }}>
                  {finalReport.summary}
                </p>
              </div>

              {/* Subscale Meters */}
              <div style={{ background: "var(--s2)", border: "1px solid var(--sep)", borderRadius: "18px", padding: "20px", marginBottom: "24px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--t3)", marginBottom: "14px" }}>
                  Диагностические профили по шкале NASA:
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                  <div style={{ background: "var(--s1)", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--sep)" }}>
                    <div style={{ fontSize: "11px", color: "var(--t3)" }}>Эмоциональный тонус</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#10b981", marginTop: "2px" }}>
                      {finalReport.moodVal}/5.0
                    </div>
                  </div>

                  <div style={{ background: "var(--s1)", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--sep)" }}>
                    <div style={{ fontSize: "11px", color: "var(--t3)" }}>Стрессовое напряжение</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--pr)", marginTop: "2px" }}>
                      {finalReport.stressVal}/5.0
                    </div>
                  </div>

                  <div style={{ background: "var(--s1)", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--sep)" }}>
                    <div style={{ fontSize: "11px", color: "var(--t3)" }}>Когнитивный фокус</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--cy)", marginTop: "2px" }}>
                      {finalReport.focusVal}/5.0
                    </div>
                  </div>

                  <div style={{ background: "var(--s1)", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--sep)" }}>
                    <div style={{ fontSize: "11px", color: "var(--t3)" }}>Качество сна</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#8b5cf6", marginTop: "2px" }}>
                      {finalReport.sleepVal}/5.0
                    </div>
                  </div>
                </div>
              </div>

              {/* Personalized Countermeasures */}
              <div style={{ background: "var(--s2)", border: "1px solid var(--sep)", borderRadius: "18px", padding: "20px", marginBottom: "28px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--t3)", marginBottom: "12px" }}>
                  Индивидуальные контрмеры бортового врача:
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {finalReport.recommendations.map((rec, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "var(--tx)", lineHeight: "1.5" }}>
                      <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setTestStage("select")}
                  className="btn sec"
                  style={{ padding: "12px 20px", borderRadius: "12px", fontSize: "14px" }}
                >
                  Пройти другой тест
                </button>

                <button
                  type="button"
                  onClick={handleSaveReportToMedicalRecord}
                  disabled={checkinMutation.isPending}
                  className="btn pri"
                  style={{
                    padding: "12px 28px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 20px rgba(59, 130, 246, 0.4)",
                  }}
                >
                  <Send size={16} />
                  <span>
                    {checkinMutation.isPending ? "Сохранение в карту..." : "Зафиксировать в медицинской карте миссии"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

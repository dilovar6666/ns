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
    title: "NASA BHP / DASS-21: Psychoemotional Screening",
    subtitle: "Depression, Anxiety & Confinement Stress Scale",
    description: " (NASA Behavioral Health).",
    duration: "4–5 min",
    itemsCount: 10,
    badge: "NASA BHP STANDARD",
    badgeColor: "#3b82f6",
    badgeBg: "rgba(59, 130, 246, 0.15)",
    icon: Brain,
  },
  {
    id: "tlx" as TestType,
    title: "NASA-TLX: Task Load & Cognitive Workload Index",
    subtitle: "Task Load Index ()",
    description: "of EVA, ).",
    duration: "3 min",
    itemsCount: 6,
    badge: "",
    badgeColor: "#10b981",
    badgeBg: "rgba(16, 185, 129, 0.15)",
    icon: Gauge,
  },
  {
    id: "sleep" as TestType,
    title: "NASA Sleep & Circadian Fatigue Scale",
    subtitle: "",
    description: "of  (SWS), .",
    duration: "3–4 min",
    itemsCount: 8,
    badge: "",
    badgeColor: "#8b5cf6",
    badgeBg: "rgba(139, 92, 246, 0.15)",
    icon: Moon,
  },
  {
    id: "pvt" as TestType,
    title: "PVT-Space: ",
    subtitle: "",
    description: " (Reaction Time Task). .",
    duration: "2 min",
    itemsCount: 5,
    badge: "OBJECTIVE TEST",
    badgeColor: "#f59e0b",
    badgeBg: "rgba(245, 158, 11, 0.15)",
    icon: Zap,
  },
];

// Questions for DASS-21 Space Adaptation
const DASS_QUESTIONS = [
  "ofyears.",
];

const DASS_OPTIONS = [
  { score: 0, label: "Never", desc: "" },
  { score: 1, label: "Sometimes", desc: "" },
  { score: 2, label: "Often", desc: "" },
  { score: 3, label: "", desc: "" },
];

// Questions for NASA-TLX
const TLX_DIMENSIONS = [
  {
    id: "mental",
    title: " (Mental Demand)",
    prompt: "msyears?",
    low: "Low / ",
    high: "",
  },
  {
    id: "physical",
    title: "Physical Exertion (Physical Demand)",
    prompt: "of ARED/T2, )?",
    low: "",
    high: "of",
  },
  {
    id: "temporal",
    title: " (Temporal Demand)",
    prompt: "min?",
    low: "",
    high: "",
  },
  {
    id: "performance",
    title: "Subject (Performance)",
    prompt: "years?",
    low: "years",
    high: "",
  },
  {
    id: "effort",
    title: " (Effort)",
    prompt: "of?",
    low: "Minimum ",
    high: "of",
  },
  {
    id: "frustration",
    title: " (Frustration)",
    prompt: "?",
    low: "",
    high: "",
  },
];

// Sleep Questionnaire
const SLEEP_QUESTIONS = [
  {
    q: "?",
    options: [
      { score: 3, text: " 15 min)" },
      { score: 2, text: "15–30 minof)" },
      { score: 1, text: "30–60 min (Moderate )" },
      { score: 0, text: " 60 min)" },
    ],
  },
  {
    q: "of > 50 dBA)?",
    options: [
      { score: 3, text: " ANC" },
      { score: 2, text: "" },
      { score: 1, text: "" },
      { score: 0, text: " of-" },
    ],
  },
  {
    q: "?",
    options: [
      { score: 3, text: "" },
      { score: 2, text: " (1–2 )" },
      { score: 1, text: "Moderate  (3–5 " },
      { score: 0, text: "" },
    ],
  },
  {
    q: "ms?",
    options: [
      { score: 3, text: " 100%" },
      { score: 2, text: "Moderate " },
      { score: 1, text: " 30 min" },
      { score: 0, text: "" },
    ],
  },
  {
    q: "?",
    options: [
      { score: 3, text: "" },
      { score: 2, text: "1 " },
      { score: 1, text: "2–3 of»" },
      { score: 0, text: "" },
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
      setToastMsg("for crew.");
      setTimeout(() => setToastMsg(""), 4500);
      setActiveTab("overview");
      setTestStage("select");
    },
    onError: (err: any) => {
      setToastMsg(`: ${err.message || ""}`);
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
      setToastMsg("False Start! .");
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

    let scoreLevel = "";
    let levelColor = "#10b981";
    let focusScore = 5;

    if (avg < 240) {
      scoreLevel = ")";
      levelColor = "#10b981";
      focusScore = 5;
    } else if (avg < 310) {
      scoreLevel = "";
      levelColor = "#3b82f6";
      focusScore = 4;
    } else if (avg < 390) {
      scoreLevel = "";
      levelColor = "#f59e0b";
      focusScore = 3;
    } else {
      scoreLevel = ")";
      levelColor = "#ef4444";
      focusScore = 2;
    }

    setFinalReport({
      testTitle: "PVT-Space: Psychomotor Vigilance Assessment",
      overallScore: Math.max(40, Math.min(100, Math.round(100 - (avg - 200) * 0.25))),
      scoreLevel: avg < 250 ? "Optimal Reaction (NASA Standard)" : avg < 320 ? "Nominal Attention" : "Fatigue Lapses Detected",
      levelColor,
      stressVal: lapses > 0 ? 3 : 2,
      moodVal: 4,
      focusVal: focusScore,
      isolationVal: 2,
      sleepVal: avg < 300 ? 4 : 3,
      summary: `Mean reaction time: ${avg} ms (NASA Benchmark: < 280 ms). Lapses (>500 ms): ${lapses}. False starts: ${pvtFalseStarts}.`,
      recommendations: [
        avg < 300
          ? "Psychomotor reaction nominal for critical operations (EVA / Docking)."
          : "Attention lapses detected. 20-minute sensory rest protocol recommended.",
        "Maintain circadian sleep hygiene and blue-spectrum phototherapy.",
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

    const pct = Math.round(((30 - totalScore) / 30) * 100);
    let scoreLevel = "Nominal Resilience (NASA Baseline)";
    let levelColor = "#10b981";
    let stressScore = 1;
    let moodScore = 5;

    if (totalScore <= 6) {
      scoreLevel = "Optimal Resilience (NASA Baseline)";
      levelColor = "#10b981";
      stressScore = 1;
      moodScore = 5;
    } else if (totalScore <= 12) {
      scoreLevel = "Mild Tension (Within Bounds)";
      levelColor = "#3b82f6";
      stressScore = 2;
      moodScore = 4;
    } else if (totalScore <= 20) {
      scoreLevel = "Moderate Stress Strain";
      levelColor = "#f59e0b";
      stressScore = 3;
      moodScore = 3;
    } else {
      scoreLevel = "High Stress Burden";
      levelColor = "#ef4444";
      stressScore = 4;
      moodScore = 2;
    }

    setFinalReport({
      testTitle: "NASA BHP / DASS-21: Psychoemotional Screening",
      overallScore: pct,
      scoreLevel,
      levelColor,
      stressVal: stressScore,
      moodVal: moodScore,
      focusVal: 4,
      isolationVal: 2,
      sleepVal: 4,
      summary: `Total score: ${totalScore} of 30. Patient within nominal bounds of NASA STD-3001.`,
      recommendations: [
        "Continue daily 30-min habitat relaxation protocols.",
        "Schedule Private Family Conference (PFC) via Ku-Band channel.",
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

    let scoreLevel = "Low Workload (Optimal)";
    let levelColor = "#10b981";

    if (rawAvg < 40) {
      scoreLevel = "Low Workload (Optimal)";
      levelColor = "#10b981";
    } else if (rawAvg < 65) {
      scoreLevel = "Moderate Workload";
      levelColor = "#3b82f6";
    } else if (rawAvg < 80) {
      scoreLevel = "High Workload";
      levelColor = "#f59e0b";
    } else {
      scoreLevel = "Critical Overload (Risk of Error)";
      levelColor = "#ef4444";
    }

    setFinalReport({
      testTitle: "NASA-TLX: Task Load Index",
      overallScore: workloadScore,
      scoreLevel,
      levelColor,
      stressVal: rawAvg > 65 ? 3 : 2,
      moodVal: 4,
      focusVal: tlxValues.performance > 75 ? 5 : 4,
      isolationVal: 2,
      sleepVal: 4,
      summary: `NASA-TLX overall workload index: ${rawAvg}/100. Perceived performance self-rating: ${tlxValues.performance}%.`,
      recommendations: [
        "15-minute bioacoustic habitat rest session before next operational task.",
        "Post-workout hydration and HRV recovery tracking.",
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

    let scoreLevel = "Optimal Restorative Sleep";
    let levelColor = "#10b981";

    if (pct >= 80) {
      scoreLevel = "Optimal Restorative Sleep";
      levelColor = "#10b981";
    } else if (pct >= 60) {
      scoreLevel = "Nominal Sleep Architecture";
      levelColor = "#3b82f6";
    } else {
      scoreLevel = "Circadian Phase Delay (SWS Deficit)";
      levelColor = "#f59e0b";
    }

    setFinalReport({
      testTitle: "Circadian Rhythm & Sleep Quality Index",
      overallScore: pct,
      scoreLevel,
      levelColor,
      stressVal: pct < 60 ? 3 : 2,
      moodVal: pct < 60 ? 3 : 4,
      focusVal: pct < 60 ? 3 : 4,
      isolationVal: 2,
      sleepVal: pct >= 80 ? 5 : pct >= 60 ? 4 : 2,
      summary: `Sleep recovery score: ${pct}%. Nocturnal circadian rhythm evaluation completed.`,
      recommendations: [
        pct < 60
          ? "Shift circadian LED lighting to warm 2200K spectrum 1 hour prior to sleep."
          : "Maintain established sleep hygiene schedule.",
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
      comment: `[${finalReport.testTitle}]:  ${finalReport.overallScore}/100 (${finalReport.scoreLevel}). ${finalReport.summary}`,
    });
  };

  return (
    <div className="wrapc" style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "70px" }}>
      {/* Top Header */}
      <header className="tb" style={{ marginBottom: "20px" }}>
        <div className="mental-header-content">
          <div className="up">
            <div className="mental-tag-row">
              <span className="mental-tag-mission">
                NASA Behavioral Health and Performance (BHP) Protocol
              </span>
              <span className="mental-tag-badge">
                ● of
              </span>
            </div>
            <h1 className="lt disp" style={{ margin: "0 0 6px" }}>Mental Health & Cognitive Testing</h1>
            <p className="sub" style={{ margin: 0, maxWidth: "780px", color: "var(--t2)" }}>
               NASA-TLX  DASS-21, .
            </p>
          </div>

          {/* Navigation Pill Switcher */}
          <div className="mental-nav-pills">
            <button
              onClick={() => { setActiveTab("overview"); setTestStage("select"); }}
              className="mental-nav-btn"
              style={{
                fontWeight: activeTab === "overview" ? 700 : 500,
                background: activeTab === "overview" ? "var(--pr)" : "transparent",
                color: activeTab === "overview" ? "#fff" : "var(--t2)",
              }}
            >
              <span></span>
            </button>
            <button
              onClick={() => { setActiveTab("test"); setTestStage("select"); }}
              className="mental-nav-btn"
              style={{
                fontWeight: activeTab === "test" ? 700 : 500,
                background: activeTab === "test" ? "var(--pr)" : "transparent",
                color: activeTab === "test" ? "#fff" : "var(--t2)",
              }}
            >
              <Sparkles size={14} style={{ flexShrink: 0 }} />
              <span className="mental-btn-text-full">)</span>
              <span className="mental-btn-text-mobile"> (4)</span>
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
                
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--tx)", marginTop: "6px" }}>
                {avgMood} <span style={{ fontSize: "15px", color: "var(--t3)", fontWeight: 500 }}>/ 5.0</span>
              </div>
              <div style={{ fontSize: "12px", color: "#10b981", marginTop: "4px", fontWeight: 600 }}>
                ● 
              </div>
            </div>

            <div style={{ background: "var(--s1)", border: "1px solid var(--sep)", padding: "20px 22px", borderRadius: "18px" }}>
              <div style={{ fontSize: "12px", color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#3b82f6", marginTop: "6px" }}>
                {avgStress} <span style={{ fontSize: "15px", color: "var(--t3)", fontWeight: 500 }}>/ 5.0</span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--t3)", marginTop: "4px" }}>
                 ALARA 
              </div>
            </div>

            <div style={{ background: "var(--s1)", border: "1px solid var(--sep)", padding: "20px 22px", borderRadius: "18px" }}>
              <div style={{ fontSize: "12px", color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--cy)", marginTop: "6px" }}>
                {latestCheckin ? latestCheckin.focus : 4.0} <span style={{ fontSize: "15px", color: "var(--t3)", fontWeight: 500 }}>/ 5.0</span>
              </div>
              <div style={{ fontSize: "12px", color: "#10b981", marginTop: "4px", fontWeight: 600 }}>
                ● 
              </div>
            </div>

            <div style={{ background: "var(--s1)", border: "1px solid var(--sep)", padding: "20px 22px", borderRadius: "18px" }}>
              <div style={{ fontSize: "12px", color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#10b981", marginTop: "6px" }}>
                94 <span style={{ fontSize: "15px", color: "var(--t3)", fontWeight: 500 }}>%</span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--t3)", marginTop: "4px" }}>
                High Cohesion & Interpersonal Support
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
                Scheduled Neurobehavioral Evaluation (Mission Day 42)
              </div>
              <h2 style={{ margin: "0 0 6px", fontSize: "19px", fontWeight: 800 }}>
                Launch Comprehensive NASA Behavioral Health Battery
              </h2>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--t2)", maxWidth: "680px" }}>
                Select one of 4 scientifically validated protocols: DASS-21 stress screening, NASA-TLX task load, PVT alertness, or circadian assessment. NASA-TLX,  PVT.
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
              <span>Proceed to Assessment</span>
            </button>
          </div>

          {/* Two Column Grid: History and Countermeasures */}
          <div className="responsive-split-2col">
            {/* Past Check-ins Log */}
            <div style={{ background: "var(--s1)", border: "1px solid var(--sep)", borderRadius: "20px", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                  Clinical Assessment & Check-In Log
                </h3>
                <span style={{ fontSize: "12px", color: "var(--t3)" }}>Total Log Entries: {checkins.length}</span>
              </div>

              {isLoading ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--t3)" }}>
                  Loading assessment history...
                </div>
              ) : checkins.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--t3)" }}>
                  No logs recorded yet. Complete an assessment above to log the first record.
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
                            Mood: {entry.mood}/5
                          </span>
                          <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "rgba(59, 130, 246, 0.15)", color: "var(--pr)" }}>
                            Cognitive Stress: {entry.stress}/5
                          </span>
                          <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}>
                            Focus: {entry.focus}/5
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
                Psychological Countermeasures (NASA BHP Framework)
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", gap: "12px", background: "var(--s2)", padding: "14px 16px", borderRadius: "14px", border: "1px solid var(--sep)" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pr)", flexShrink: 0 }}>
                    <Brain size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px" }}>Targeted Blue-Enriched Phototherapy (480 nm)</div>
                    <div style={{ fontSize: "12px", color: "var(--t2)", marginTop: "4px", lineHeight: "1.5" }}>
                      30 minutes of light stimulation post-wake to synchronize suprachiasmatic nucleus and suppress melatonin. .
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", background: "var(--s2)", padding: "14px 16px", borderRadius: "14px", border: "1px solid var(--sep)" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", flexShrink: 0 }}>
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px" }}>VR Habitat Relaxation with Earth Biomes</div>
                    <div style={{ fontSize: "12px", color: "var(--t2)", marginTop: "4px", lineHeight: "1.5" }}>
                      Immersive sensory audio-visual biomes reduce cortisol levels and alleviate isolation monotony. .
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", background: "var(--s2)", padding: "14px 16px", borderRadius: "14px", border: "1px solid var(--sep)" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b", flexShrink: 0 }}>
                    <HeartHandshake size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px" }}>Private Family Conference (PFC Session)</div>
                    <div style={{ fontSize: "12px", color: "var(--t2)", marginTop: "4px", lineHeight: "1.5" }}>
                      Scheduled for Saturday, orbit 682, via dedicated encrypted Ku-Band downlink.
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
                  CHX-01 Clinical Neurocognitive Test Hub
                </span>
                <h2 style={{ fontSize: "26px", fontWeight: 800, margin: "6px 0 10px" }}>
                  Select Diagnostic Assessment Battery
                </h2>
                <p style={{ fontSize: "14px", color: "var(--t2)", lineHeight: "1.6", margin: 0 }}>
                  Each battery is engineered per space medicine standards validated by NASA Human Research Program. .
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
                        <span>Launch Battery ({tb.itemsCount} {tb.id === "pvt" ? "rounds" : "items"})</span>
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
                  <span>Select Different Battery</span>
                </button>

                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--pr)" }}>
                  {selectedTest === "dass" && `Question ${dassCurrentStep + 1} of ${DASS_QUESTIONS.length}`}
                  {selectedTest === "tlx" && `NASA-TLX Operational Workload Scale`}
                  {selectedTest === "sleep" && `Question ${sleepCurrentStep + 1} of ${SLEEP_QUESTIONS.length}`}
                  {selectedTest === "pvt" && ` ${pvtRound + 1} of 5 · PVT Reaction Test`}
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
                      Evaluate your state over the past 48 hours:
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
                      ← Back
                    </button>

                    {dassCurrentStep < DASS_QUESTIONS.length - 1 ? (
                      <button
                        type="button"
                        disabled={dassAnswers[dassCurrentStep] === undefined}
                        onClick={() => setDassCurrentStep((prev) => prev + 1)}
                        className="btn pri"
                        style={{ padding: "10px 24px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        <span>Next →</span>
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
                        <span>Generate Clinical Assessment</span>
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
                      Multi-Dimensional Task Load Index (NASA-TLX)
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--t2)", margin: 0 }}>
                      Adjust sliders according to perceived operational demands and physical exertion.
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
                    Calculate NASA-TLX Workload Score
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
                      Sleep Architecture & Circadian Analysis:
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
                      ← Back
                    </button>

                    {sleepCurrentStep < SLEEP_QUESTIONS.length - 1 ? (
                      <button
                        type="button"
                        disabled={sleepAnswers[sleepCurrentStep] === undefined}
                        onClick={() => setSleepCurrentStep((prev) => prev + 1)}
                        className="btn pri"
                        style={{ padding: "10px 24px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        <span>Next →</span>
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
                        Generate Report
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
                      PVT-Space: Psychomotor Vigilance & Attention ( {pvtRound + 1} of 5)
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--t2)", margin: 0 }}>
                      Instructions: Click "GET READY". When the screen turns GREEN and the millisecond counter starts, click immediately!!
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
                          Click "START ROUND" below
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--t3)", marginTop: "4px" }}>
                          Caution: Do not click before the green signal appears
                        </div>
                      </div>
                    )}

                    {pvtState === "ready" && (
                      <div>
                        <div style={{ fontSize: "28px", fontWeight: 900, color: "#fff", letterSpacing: "2px" }}>
                          WAIT FOR SIGNAL...
                        </div>
                        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", marginTop: "6px" }}>
                          (Do not click prematurely)
                        </div>
                      </div>
                    )}

                    {pvtState === "flash" && (
                      <div>
                        <div style={{ fontSize: "52px", fontWeight: 900, color: "#000", fontFamily: "monospace" }}>
                          {pvtCurrentMs} <span style={{ fontSize: "24px" }}>ms</span>
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: 800, color: "#000", marginTop: "4px" }}>
                          CLICK NOW!
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
                      Start Round {pvtRound + 1}
                    </button>
                  )}

                  {/* Past round times */}
                  {pvtTimes.length > 0 && (
                    <div style={{ marginTop: "24px", display: "flex", justifyContent: "center", gap: "10px" }}>
                      {pvtTimes.map((t, i) => (
                        <span key={i} style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "8px", background: "var(--s2)", border: "1px solid var(--sep)" }}>
                          {i + 1}: <strong>{t} ms</strong>
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
                  <CheckCircle2 size={14} /> ASSESSMENT COMPLETED NOMINAL
                </div>
                <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 6px" }}>
                  {finalReport.testTitle}
                </h2>
                <div style={{ fontSize: "13px", color: "var(--t3)" }}>
                  Subject: {astronaut?.name || "Alex Nova (CMO)"} · Date: {new Date().toLocaleDateString("en-US")}
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
                  NASA Clinical Score Breakdown:
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                  <div style={{ background: "var(--s1)", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--sep)" }}>
                    <div style={{ fontSize: "11px", color: "var(--t3)" }}>Affective Tone</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#10b981", marginTop: "2px" }}>
                      {finalReport.moodVal}/5.0
                    </div>
                  </div>

                  <div style={{ background: "var(--s1)", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--sep)" }}>
                    <div style={{ fontSize: "11px", color: "var(--t3)" }}>Cognitive Stress Burden</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--pr)", marginTop: "2px" }}>
                      {finalReport.stressVal}/5.0
                    </div>
                  </div>

                  <div style={{ background: "var(--s1)", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--sep)" }}>
                    <div style={{ fontSize: "11px", color: "var(--t3)" }}>Attentional Focus</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--cy)", marginTop: "2px" }}>
                      {finalReport.focusVal}/5.0
                    </div>
                  </div>

                  <div style={{ background: "var(--s1)", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--sep)" }}>
                    <div style={{ fontSize: "11px", color: "var(--t3)" }}>Sleep Architecture</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#8b5cf6", marginTop: "2px" }}>
                      {finalReport.sleepVal}/5.0
                    </div>
                  </div>
                </div>
              </div>

              {/* Personalized Countermeasures */}
              <div style={{ background: "var(--s2)", border: "1px solid var(--sep)", borderRadius: "18px", padding: "20px", marginBottom: "28px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--t3)", marginBottom: "12px" }}>
                  Flight Surgeon Personalized Countermeasures:
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
                  Take Another Assessment
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
                    {checkinMutation.isPending ? "Saving to Medical Record..." : "Commit Assessment to Mission Medical Dossier"}
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

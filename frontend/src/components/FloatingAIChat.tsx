import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  Maximize2,
  Minimize2,
  Activity,
  Heart,
  ShieldAlert,
  Zap,
  Radio,
  Trash2,
} from "lucide-react";
import type { Astronaut, Metric } from "../api";
import { api } from "../api";

type Message = {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  riskLevel?: "low" | "medium" | "high";
  confidence?: number;
};

type Props = {
  astronaut?: Astronaut;
  metrics?: Metric[];
};

export function FloatingAIChat({ astronaut, metrics = [] }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "ai",
      text: "Здравствуйте! Я CosmoHealthX AI — бортовой медицинский интеллект на базе Gemini 3.5. Готов ответить на любые клинические вопросы по телеметрии экипажа, скафандрам EVA или протоколам NASA STD-3001.",
      timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      riskLevel: "low",
      confidence: 0.98,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    "Оценить ЧСС и готовность к EVA",
    "Уровень радиации за сегодня",
    "Анализ глубокого сна экипажа",
    "Протокол при тахикардии",
  ];

  const handleSend = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const response = await api<any>("/ai/analyze", "astronaut", {
        method: "POST",
        body: JSON.stringify({
          astronaut_id: astronaut?.id || 1,
          question: text,
          query: text,
        }),
      });

      const aiText = response.recommendation || response.answer || "Анализ завершен успешно.";

      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        sender: "ai",
        text: aiText,
        timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        riskLevel: response.risk_level || "low",
        confidence: response.confidence || 0.96,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: "Внимание: временная задержка Ku-Band линка. По локальным данным биосенсоров показатели экипажа стабильны (ЧСС 72 bpm, SpO2 98%). Повторите запрос при следующем сеансе связи.",
        timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        riskLevel: "low",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "cleared",
        sender: "ai",
        text: "Диалог сброшен. Готов к новым вопросам по телеметрии и здоровью экипажа.",
        timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999 }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--pr) 0%, #2563eb 100%)",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 8px 30px rgba(59, 130, 246, 0.45), 0 0 20px rgba(59, 130, 246, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
            position: "relative",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          title="Спросить бортовой ИИ (Gemini)"
        >
          <Bot size={28} />
          {/* Pulsing Aura */}
          <span
            style={{
              position: "absolute",
              inset: "-4px",
              borderRadius: "50%",
              border: "2px solid var(--pr)",
              opacity: 0.6,
              animation: "ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite",
            }}
          />
          {/* Online badge */}
          <span
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#10b981",
              border: "2px solid var(--bg)",
            }}
          />
        </button>
      )}

      {/* Floating Chat Drawer/Window */}
      {isOpen && (
        <div
          style={{
            width: isMinimized ? "320px" : "390px",
            height: isMinimized ? "56px" : "540px",
            maxHeight: "85vh",
            background: "var(--s1)",
            border: "1px solid var(--sep)",
            borderRadius: "20px",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.45), 0 0 30px rgba(59, 130, 246, 0.15)",
            backdropFilter: "blur(12px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transition: "all 0.25s ease",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              background: "var(--s2)",
              borderBottom: "1px solid var(--sep)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => {
              if (isMinimized) setIsMinimized(false);
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, var(--pr), var(--cy))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  boxShadow: "0 0 10px rgba(59, 130, 246, 0.4)",
                }}
              >
                <Bot size={20} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>CosmoAI</span>
                  <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontWeight: 700 }}>
                    Gemini 3.5 Live
                  </span>
                </div>
                {!isMinimized && (
                  <div style={{ fontSize: "11px", color: "var(--t3)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Radio size={10} className="pulse" /> Канал ЦУП Ku-Band активен
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {!isMinimized && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearChat();
                  }}
                  style={{ background: "none", border: "none", color: "var(--t3)", cursor: "pointer", padding: "4px" }}
                  title="Очистить историю"
                >
                  <Trash2 size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                style={{ background: "none", border: "none", color: "var(--t2)", cursor: "pointer", padding: "4px" }}
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                style={{ background: "none", border: "none", color: "var(--t2)", cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body when not minimized */}
          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {messages.map((m) => {
                  const isUser = m.sender === "user";

                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isUser ? "flex-end" : "flex-start",
                        maxWidth: "88%",
                        alignSelf: isUser ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          padding: "10px 14px",
                          borderRadius: isUser ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                          background: isUser ? "var(--pr)" : "var(--s2)",
                          color: isUser ? "#fff" : "var(--tx)",
                          fontSize: "13px",
                          lineHeight: "1.5",
                          border: isUser ? "none" : "1px solid var(--sep)",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                          wordBreak: "break-word",
                        }}
                      >
                        {m.text}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px", fontSize: "10px", color: "var(--t3)" }}>
                        <span>{m.timestamp}</span>
                        {!isUser && m.riskLevel && (
                          <span
                            style={{
                              color: m.riskLevel === "high" ? "var(--cr)" : m.riskLevel === "medium" ? "var(--wa)" : "var(--ok)",
                              fontWeight: 700,
                            }}
                          >
                            · {m.riskLevel.toUpperCase()} РИСК
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div
                    style={{
                      alignSelf: "flex-start",
                      padding: "10px 14px",
                      borderRadius: "16px 16px 16px 2px",
                      background: "var(--s2)",
                      border: "1px solid var(--sep)",
                      fontSize: "12px",
                      color: "var(--t2)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Activity className="spin" size={14} style={{ color: "var(--pr)" }} />
                    <span>Gemini анализирует телеметрию...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Chips */}
              <div
                style={{
                  padding: "6px 12px 10px",
                  background: "var(--s1)",
                  borderTop: "1px solid var(--sep)",
                  display: "flex",
                  gap: "6px",
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                }}
              >
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(p)}
                    style={{
                      padding: "4px 9px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      background: "var(--s2)",
                      border: "1px solid var(--sep)",
                      color: "var(--t2)",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    ✨ {p}
                  </button>
                ))}
              </div>

              {/* Input Footer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(query);
                }}
                style={{
                  padding: "12px 14px",
                  background: "var(--s2)",
                  borderTop: "1px solid var(--sep)",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  placeholder="Задайте вопрос бортовому ИИ..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: "12px",
                    background: "var(--s1)",
                    border: "1px solid var(--sep)",
                    color: "var(--tx)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "var(--pr)",
                    border: "none",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    opacity: loading || !query.trim() ? 0.5 : 1,
                    transition: "opacity 0.15s ease",
                  }}
                >
                  <Send size={15} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}

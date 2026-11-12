import React, { useState } from "react";
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
} from "lucide-react";
import type { Astronaut, Checkin } from "../api";
import { api } from "../api";

type Props = {
  astronaut?: Astronaut;
  crew: Astronaut[];
  onSelectAstronaut: (id: number) => void;
};

export function MentalHealthView({
  astronaut,
  crew,
  onSelectAstronaut,
}: Props) {
  const queryClient = useQueryClient();
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [mood, setMood] = useState(4);
  const [focus, setFocus] = useState(4);
  const [stress, setStress] = useState(2);
  const [isolation, setIsolation] = useState(2);
  const [sleep, setSleep] = useState(4);
  const [comment, setComment] = useState("");
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
      if (!astronaut) throw new Error("No astronaut selected");
      return api(`/astronauts/${astronaut.id}/checkins`, "astronaut", {
        method: "POST",
        body: JSON.stringify(newEntry),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkins", astronaut?.id] });
      setShowCheckinModal(false);
      setComment("");
      setToastMsg("Психологический чек-ин успешно зарегистрирован в бортовой журнал.");
      setTimeout(() => setToastMsg(""), 3500);
    },
    onError: (err: any) => {
      setToastMsg(`Ошибка: ${err.message || "Не удалось сохранить чек-ин"}`);
      setTimeout(() => setToastMsg(""), 3500);
    },
  });

  const handleSubmitCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    checkinMutation.mutate({ mood, focus, stress, isolation, sleep, comment });
  };

  const latestCheckin = checkins[0];
  const avgMood = checkins.length
    ? (checkins.reduce((s, c) => s + c.mood, 0) / checkins.length).toFixed(1)
    : "4.2";
  const avgStress = checkins.length
    ? (checkins.reduce((s, c) => s + c.stress, 0) / checkins.length).toFixed(1)
    : "2.1";

  return (
    <div className="wrapc">
      {/* Header */}
      <header className="tb">
        <div className="up">
          <p className="eyb">Психологическая поддержка и нейрокогнитивный мониторинг</p>
          <h1 className="lt disp">Mental Health & Well-being</h1>
          <p className="sub">
            Оценка стресса, изоляции, когнитивной нагрузки и командной сплоченности
          </p>
        </div>
        <div className="tbr up" style={{ animationDelay: "60ms" }}>
          <button
            className="btn-primary"
            onClick={() => setShowCheckinModal(true)}
            style={{ fontSize: "14px" }}
          >
            <PlusCircle className="ico sm" /> Заполнить чек-ин дня
          </button>
        </div>
      </header>

      {toastMsg && (
        <div className="toast up" style={{ marginTop: "16px" }}>
          <CheckCircle2 className="ico sm" /> {toastMsg}
        </div>
      )}

      {/* 4 Score Cards */}
      <section className="ag4" style={{ marginTop: "20px" }}>
        {/* Mood Index */}
        <div className="cd up" style={{ padding: "20px 22px" }}>
          <div className="cap">Средний эмоциональный фон</div>
          <div className="big num" style={{ marginTop: "6px" }}>
            <b>{avgMood}</b>
            <em>/ 5.0</em>
          </div>
          <div className="cap num" style={{ marginTop: "6px", color: "var(--ok)" }}>
            ● Стабильно позитивное состояние
          </div>
        </div>

        {/* Stress Index */}
        <div className="cd up" style={{ padding: "20px 22px" }}>
          <div className="cap">Индекс психоэмоционального стресса</div>
          <div className="big num" style={{ marginTop: "6px" }}>
            <b>{avgStress}</b>
            <em>/ 5.0</em>
          </div>
          <div className="cap num" style={{ marginTop: "6px", color: "var(--ok)" }}>
            ● Низкий уровень напряжения
          </div>
        </div>

        {/* Cognitive Load */}
        <div className="cd up" style={{ padding: "20px 22px" }}>
          <div className="cap">Когнитивная концентрация</div>
          <div className="big num" style={{ marginTop: "6px" }}>
            <b>{latestCheckin ? latestCheckin.focus : 4.0}</b>
            <em>/ 5.0</em>
          </div>
          <div className="cap num" style={{ marginTop: "6px", color: "var(--ok)" }}>
            ● Готовность к критическим операциям
          </div>
        </div>

        {/* Team Cohesion */}
        <div className="cd up" style={{ padding: "20px 22px" }}>
          <div className="cap">Индекс сплоченности экипажа</div>
          <div className="big num" style={{ marginTop: "6px" }}>
            <b>92</b>
            <em>%</em>
          </div>
          <div className="cap num" style={{ marginTop: "6px", color: "var(--ok)" }}>
            ● Высокий уровень взаимного доверия
          </div>
        </div>
      </section>

      {/* Two Column Grid */}
      <section className="ab" style={{ marginTop: "24px" }}>
        {/* Past Check-ins Timeline */}
        <div className="cd up" style={{ padding: "24px 28px" }}>
          <div className="ch" style={{ marginBottom: "16px" }}>
            <h2 className="h2">Журнал субъективной оценки</h2>
            <span className="cap">Записей: {checkins.length}</span>
          </div>

          {isLoading ? (
            <div className="cap" style={{ textAlign: "center", padding: "30px 0" }}>
              Загрузка чек-инов...
            </div>
          ) : checkins.length === 0 ? (
            <div className="cap" style={{ textAlign: "center", padding: "30px 0" }}>
              Нет записей. Нажмите «Заполнить чек-ин дня», чтобы добавить первую запись.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {checkins.map((entry) => (
                <div
                  key={entry.id}
                  className="li flat"
                  style={{
                    padding: "14px 16px",
                    background: "var(--s2)",
                    borderRadius: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span className="st ok">
                        <i></i>Настроение: {entry.mood}/5
                      </span>
                      <span className="st wa" style={{ fontSize: "12px" }}>
                        Стресс: {entry.stress}/5
                      </span>
                    </div>
                    <span className="cap num">
                      {new Date(entry.created_at).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {entry.comment && (
                    <p style={{ margin: 0, fontSize: "14px", color: "var(--t1)", fontStyle: "italic" }}>
                      "{entry.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Psychological Countermeasures */}
        <div className="cd up" style={{ padding: "24px 28px" }}>
          <h2 className="h2" style={{ marginBottom: "16px" }}>
            Психологические контрмеры (NASA Behavioral Health)
          </h2>

          <div className="ins">
            <span className="icb c-sleep" style={{ background: "var(--s2)" }}>
              <Brain className="gly" />
            </span>
            <div>
              <span style={{ fontWeight: 600, display: "block", fontSize: "15px" }}>
                Световая терапия синим спектром (480 нм)
              </span>
              <p style={{ color: "var(--t2)", marginTop: "4px" }}>
                30 минут фотостимуляции после пробуждения для синхронизации супрахиазматического ядра и подавления утренней сонливости.
              </p>
            </div>
          </div>

          <div className="ins">
            <span className="icb c-act" style={{ background: "var(--s2)" }}>
              <Sparkles className="gly" />
            </span>
            <div>
              <span style={{ fontWeight: 600, display: "block", fontSize: "15px" }}>
                VR-релаксация с земными природными биомами
              </span>
              <p style={{ color: "var(--t2)", marginTop: "4px" }}>
                Виртуальное погружение в хвойный лес и шум океана снижает уровень кортизола и сенсорную депривацию в изоляции.
              </p>
            </div>
          </div>

          <div className="ins">
            <span className="icb c-hr" style={{ background: "var(--s2)" }}>
              <HeartHandshake className="gly" />
            </span>
            <div>
              <span style={{ fontWeight: 600, display: "block", fontSize: "15px" }}>
                Сеанс связи с семьей (Private Family Conference)
              </span>
              <p style={{ color: "var(--t2)", marginTop: "4px" }}>
                Запланировано на субботу, виток 682, выделенный широкополосный канал Ku-диапазона.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Checkin Modal */}
      {showCheckinModal && (
        <div className="modal-backdrop" onClick={() => setShowCheckinModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2 className="modal-title">Ежедневный психологический чек-ин</h2>
              <button
                className="modal-close"
                onClick={() => setShowCheckinModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCheckin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Mood 1-5 */}
              <div className="form-group">
                <label>Эмоциональное состояние (Настроение: {mood}/5)</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`btn-secondary ${mood === val ? "btn-primary" : ""}`}
                      onClick={() => setMood(val)}
                      style={{ flex: 1, padding: "8px 0", fontSize: "14px" }}
                    >
                      {val === 1 ? "1 😞" : val === 2 ? "2 🙁" : val === 3 ? "3 😐" : val === 4 ? "4 🙂" : "5 😊"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stress 1-5 */}
              <div className="form-group">
                <label>Уровень стресса (1 - Мин, 5 - Макс): {stress}</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={stress}
                  onChange={(e) => setStress(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--wa)" }}
                />
              </div>

              {/* Focus 1-5 */}
              <div className="form-group">
                <label>Концентрация и ясность мышления: {focus}/5</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={focus}
                  onChange={(e) => setFocus(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--pr)" }}
                />
              </div>

              {/* Isolation perception */}
              <div className="form-group">
                <label>Ощущение сенсорной изоляции: {isolation}/5</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={isolation}
                  onChange={(e) => setIsolation(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--sl)" }}
                />
              </div>

              {/* Notes */}
              <div className="form-group">
                <label>Заметки астронавта (опционально)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Опишите самочувствие, качество сна или необычные ощущения..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCheckinModal(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={checkinMutation.isPending}
                >
                  <Send className="ico sm" />
                  {checkinMutation.isPending ? "Сохранение..." : "Записать в бортовой журнал"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

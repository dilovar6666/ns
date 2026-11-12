import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserPlus,
  Shield,
  Heart,
  Droplets,
  Activity,
  CheckCircle,
  X,
  ChevronRight,
  Flame,
} from "lucide-react";
import type { Astronaut } from "../api";
import { api } from "../api";

type Props = {
  astronaut?: Astronaut;
  crew: Astronaut[];
  onSelectAstronaut: (id: number) => void;
  onRefreshCrew: () => void;
};

export function CrewView({
  astronaut,
  crew,
  onSelectAstronaut,
  onRefreshCrew,
}: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [callsign, setCallsign] = useState("");
  const [specialty, setSpecialty] = useState("Бортинженер-исследователь");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !callsign.trim()) {
      setErrorMsg("Пожалуйста, заполните имя и позывной астронавта.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      await api<Astronaut>("/astronauts", "medical_officer", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          callsign: callsign.trim().toUpperCase(),
          specialty: specialty.trim(),
          mission_id: astronaut?.mission_id || 1,
          active: true,
        }),
      });
      setShowAddModal(false);
      setName("");
      setCallsign("");
      onRefreshCrew();
    } catch (err: any) {
      setErrorMsg(err.message || "Ошибка при добавлении астронавта.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wrapc">
      {/* Header */}
      <header className="tb">
        <div className="up">
          <p className="eyb">Личный состав экспедиции CHX-01</p>
          <h1 className="lt disp">Crew Health Overview</h1>
          <p className="sub">
            Мониторинг физиологической готовности и статуса каждого члена экипажа
          </p>
        </div>
        <div className="tbr up" style={{ animationDelay: "60ms" }}>
          <button
            className="btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ fontSize: "14px" }}
          >
            <UserPlus className="ico sm" /> Добавить астронавта
          </button>
        </div>
      </header>

      {/* Crew Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "20px",
          marginTop: "24px",
        }}
      >
        {crew.map((member) => {
          const isSelected = member.id === astronaut?.id;
          return (
            <div
              key={member.id}
              className="cd up"
              style={{
                padding: "24px 26px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                borderColor: isSelected ? "var(--pr)" : "var(--sep)",
                boxShadow: isSelected ? "0 0 0 1px var(--pr)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  className="av"
                  style={{
                    width: "52px",
                    height: "52px",
                    fontSize: "18px",
                    background: isSelected ? "var(--pr)" : "var(--s2)",
                    color: isSelected ? "#fff" : "var(--t1)",
                  }}
                >
                  {member.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "17px",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {member.name}
                    </h2>
                    {isSelected && (
                      <span
                        style={{
                          background: "var(--pr)",
                          color: "#fff",
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "10px",
                        }}
                      >
                        ВЫБРАН
                      </span>
                    )}
                  </div>
                  <span className="cap" style={{ display: "block", marginTop: "2px" }}>
                    Позывной: <b>{member.callsign}</b> · ID #{member.id}
                  </span>
                </div>
              </div>

              <div className="kv" style={{ padding: "8px 0" }}>
                <span>Специализация:</span>
                <span style={{ fontWeight: 600 }}>{member.specialty}</span>
              </div>

              <div className="kv" style={{ padding: "8px 0" }}>
                <span>Статус допуска:</span>
                <span className="st ok">
                  <i></i>Class I Flight Active
                </span>
              </div>

              <div className="kv" style={{ padding: "8px 0" }}>
                <span>Индекс здоровья:</span>
                <span className="num" style={{ fontWeight: 700, color: "var(--ok)" }}>
                  94 / 100
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                <button
                  className={isSelected ? "btn-secondary" : "btn-primary"}
                  onClick={() => onSelectAstronaut(member.id)}
                  style={{ flex: 1, fontSize: "13px", padding: "8px 12px" }}
                >
                  {isSelected ? "Текущий субъект" : "Выбрать для мониторинга"}
                </button>
                <Link
                  className="btn-secondary"
                  to="/profile"
                  onClick={() => onSelectAstronaut(member.id)}
                  style={{ fontSize: "13px", padding: "8px 12px" }}
                >
                  Профиль
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Astronaut Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2 className="modal-title">Регистрация нового члена экипажа</h2>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                <X className="ico sm" />
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  background: "rgba(255, 59, 48, 0.12)",
                  color: "var(--cr)",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label>Полное имя астронавта</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="напр. Елена Соколова"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Позывной (Callsign)</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="напр. FALCON-2"
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Специализация в полете</label>
                <select
                  className="form-control"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                >
                  <option value="Командир экипажа">Командир экипажа</option>
                  <option value="Бортинженер-исследователь">Бортинженер-исследователь</option>
                  <option value="Врач экипажа (Crew Medical Officer)">Врач экипажа (Crew Medical Officer)</option>
                  <option value="Специалист по научным экспериментам">Специалист по научным экспериментам</option>
                  <option value="Пилот спускаемого аппарата">Пилот спускаемого аппарата</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? "Сохранение..." : "Зарегистрировать в миссии"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

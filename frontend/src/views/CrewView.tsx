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
  Lock,
  Unlock,
  AlertTriangle,
  UserCheck,
  Stethoscope,
  Sparkles,
} from "lucide-react";
import type { Astronaut } from "../api";
import { api } from "../api";
import { useAuth, ROLE_PRESETS } from "../context/AuthContext";

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
  const { user, isFlightSurgeon, isCommander, isAstronaut, switchRolePreset } = useAuth();

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
    <div className="wrapc" style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "60px" }}>
      {/* Top Header */}
      <header className="tb" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div className="up">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--pr)" }}>
                Личный состав экспедиции CHX-01 · Управление допуском
              </span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  background: isFlightSurgeon ? "rgba(16, 185, 129, 0.15)" : isCommander ? "rgba(59, 130, 246, 0.15)" : "rgba(245, 158, 11, 0.15)",
                  color: isFlightSurgeon ? "#10b981" : isCommander ? "var(--pr)" : "#f59e0b",
                  fontWeight: 700,
                }}
              >
                ● Роль: {user?.role || "Flight Surgeon"}
              </span>
            </div>
            <h1 className="lt disp" style={{ margin: "0 0 6px" }}>Crew Health Overview</h1>
            <p className="sub" style={{ margin: 0, maxWidth: "780px", color: "var(--t2)" }}>
              {isFlightSurgeon
                ? "Клинический контроль физиологической готовности и статуса каждого члена экипажа (полный доступ врача ЦУП)."
                : isCommander
                ? "Оперативная сводка статуса боеготовности экипажа миссии CHX-01 (режим командира экспедиции)."
                : "Персональный доступ космонавта. Данные сослуживцев защищены протоколом врачебной тайны NASA STD-3001."}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Quick Role Preset Switcher */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--s1)", padding: "4px 8px", borderRadius: "12px", border: "1px solid var(--sep)" }}>
              <span style={{ fontSize: "11px", color: "var(--t3)", fontWeight: 600 }}>Роль:</span>
              <select
                value={user?.roleType || "flight_surgeon"}
                onChange={(e) => switchRolePreset(e.target.value as any)}
                style={{
                  background: "var(--s2)",
                  color: "var(--tx)",
                  border: "1px solid var(--sep)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "4px 8px",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="flight_surgeon">👨‍⚕️ Врач миссии (CMO)</option>
                <option value="commander">🛸 Командир (Commander)</option>
                <option value="astronaut">🚀 Космонавт (Crew)</option>
              </select>
            </div>

            {/* Add Astronaut Button (Allowed only for Flight Surgeon) */}
            {isFlightSurgeon && (
              <button
                className="btn pri"
                onClick={() => setShowAddModal(true)}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 700 }}
              >
                <UserPlus size={16} />
                <span>Добавить астронавта</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Role Notice Banner */}
      {isAstronaut && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            borderRadius: "16px",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b", flexShrink: 0 }}>
              <Lock size={18} />
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--tx)" }}>
                Разделение ролей: Режим космонавта (Personal Privacy Protocol)
              </div>
              <div style={{ fontSize: "12px", color: "var(--t2)", marginTop: "2px" }}>
                В соответствии со стандартами медицинской тайны NASA STD-3001, подробные физиологические карты сослуживцев скрыты. Вы видите только свою карту.
              </div>
            </div>
          </div>

          <button
            onClick={() => switchRolePreset("flight_surgeon")}
            style={{
              padding: "8px 14px",
              borderRadius: "10px",
              background: "var(--pr)",
              color: "#fff",
              border: "none",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Unlock size={14} />
            <span>Переключить на Врача миссии</span>
          </button>
        </div>
      )}

      {/* Crew Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "20px",
        }}
      >
        {crew.map((member) => {
          const isSelected = member.id === astronaut?.id;
          const isOwnCard = user?.astronautId ? member.id === user.astronautId : member.id === 1;

          // If current user is astronaut and this is NOT their own card -> show confidential medical privacy shield
          if (isAstronaut && !isOwnCard) {
            return (
              <div
                key={member.id}
                style={{
                  background: "var(--s1)",
                  border: "1px dashed var(--sep)",
                  borderRadius: "18px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  opacity: 0.75,
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "var(--s2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--t3)",
                    marginBottom: "12px",
                  }}
                >
                  <Lock size={20} />
                </div>
                <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700 }}>
                  {member.name}
                </h3>
                <div style={{ fontSize: "12px", color: "var(--t3)", marginBottom: "12px" }}>
                  Позывной: {member.callsign} · {member.specialty}
                </div>
                <div style={{ fontSize: "11px", color: "var(--t2)", maxWidth: "260px", lineHeight: "1.5" }}>
                  🔒 Медицинская карта защищена врачебной тайной. Доступно только для Врача ЦУП (Flight Surgeon).
                </div>
              </div>
            );
          }

          return (
            <div
              key={member.id}
              style={{
                background: "var(--s1)",
                border: isSelected ? "2px solid var(--pr)" : "1px solid var(--sep)",
                borderRadius: "18px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                boxShadow: isSelected ? "0 8px 25px rgba(59, 130, 246, 0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "14px",
                    fontSize: "18px",
                    fontWeight: 800,
                    background: isSelected ? "var(--pr)" : "var(--s2)",
                    color: isSelected ? "#fff" : "var(--t1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid var(--sep)",
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
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: "8px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        АКТИВЕН
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--t3)", display: "block", marginTop: "2px" }}>
                    Позывной: <b>{member.callsign}</b> · ID #{member.id}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--sep)", borderBottom: "1px solid var(--sep)", padding: "10px 0", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--t3)" }}>Специализация:</span>
                  <span style={{ fontWeight: 600 }}>{member.specialty}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--t3)" }}>Статус допуска:</span>
                  <span style={{ color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                    ● Class I Flight Active
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--t3)" }}>Индекс здоровья:</span>
                  <span style={{ color: "var(--ok)", fontWeight: 800 }}>
                    94 / 100
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                {/* Subject selection allowed for Flight Surgeon and Commander */}
                {(isFlightSurgeon || isCommander) && (
                  <button
                    className={isSelected ? "btn sec" : "btn pri"}
                    onClick={() => onSelectAstronaut(member.id)}
                    style={{ flex: 1, fontSize: "13px", padding: "8px 12px", borderRadius: "10px" }}
                  >
                    {isSelected ? "Текущий субъект" : "Выбрать для мониторинга"}
                  </button>
                )}
                <Link
                  className="btn sec"
                  to="/profile"
                  onClick={() => onSelectAstronaut(member.id)}
                  style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "10px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  Профиль
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Astronaut Modal (Flight Surgeon only) */}
      {showAddModal && isFlightSurgeon && (
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
          onClick={() => setShowAddModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--s1)",
              border: "1px solid var(--sep)",
              borderRadius: "20px",
              padding: "28px",
              width: "100%",
              maxWidth: "520px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Stethoscope size={20} style={{ color: "var(--pr)" }} />
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Регистрация члена экипажа (ЦУП)</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", color: "var(--t2)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "var(--cr)",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "16px",
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--t2)", marginBottom: "6px" }}>
                  Полное имя астронавта
                </label>
                <input
                  type="text"
                  placeholder="напр. Елена Соколова"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  Позывной (Callsign)
                </label>
                <input
                  type="text"
                  placeholder="напр. FALCON-2"
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value)}
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
                  Специализация в полете
                </label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
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
                >
                  <option value="Командир экипажа">Командир экипажа</option>
                  <option value="Бортинженер-исследователь">Бортинженер-исследователь</option>
                  <option value="Врач экипажа (Crew Medical Officer)">Врач экипажа (Crew Medical Officer)</option>
                  <option value="Специалист по научным экспериментам">Специалист по научным экспериментам</option>
                  <option value="Пилот спускаемого аппарата">Пилот спускаемого аппарата</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="button"
                  className="btn sec"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "10px 16px", borderRadius: "10px" }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn pri"
                  disabled={saving}
                  style={{ padding: "10px 20px", borderRadius: "10px" }}
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

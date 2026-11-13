import React, { useState, useRef } from "react";
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
  AlertTriangle,
  UserCheck,
  Stethoscope,
  Sparkles,
  Edit2,
  Trash2,
  Camera,
  Upload,
  UserX,
  AlertOctagon,
} from "lucide-react";
import type { Astronaut } from "../api";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

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
  const { user, isFlightSurgeon, isCommander, isAstronaut } = useAuth();

  // Add Astronaut Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [callsign, setCallsign] = useState("");
  const [specialty, setSpecialty] = useState("Бортинженер-исследователь");
  const [age, setAge] = useState(34);
  const [bloodType, setBloodType] = useState("O+");
  const [restingHr, setRestingHr] = useState(65);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Edit Astronaut Modal (Admin / CMO / Commander)
  const [editingAstronaut, setEditingAstronaut] = useState<Astronaut | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    callsign: "",
    specialty: "",
    age: 34,
    blood_type: "O+",
    resting_hr: 65,
    max_hr: 175,
    emergency_contact: "",
    notes: "",
    avatar_url: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete / Discharge Confirmation Modal
  const [deletingAstronaut, setDeletingAstronaut] = useState<Astronaut | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success Toast
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  // Avatar file upload reader
  const handleImageUpload = (file: File, callback: (base64: string) => void) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Размер изображения не должен превышать 2 МБ");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        callback(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !callsign.trim()) {
      setErrorMsg("Пожалуйста, заполните имя и позывной астронавта.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      await api<Astronaut>("/astronauts", isFlightSurgeon ? "flight_surgeon" : "commander", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          callsign: callsign.trim().toUpperCase(),
          specialty: specialty.trim(),
          mission_id: astronaut?.mission_id || 1,
          active: true,
          age: Number(age) || 34,
          blood_type: bloodType,
          resting_hr: Number(restingHr) || 65,
          avatar_url: avatarUrl || null,
        }),
      });
      setShowAddModal(false);
      setName("");
      setCallsign("");
      setAvatarUrl("");
      onRefreshCrew();
      showToast(`Астронавт ${name.trim()} успешно зачислен в состав миссии CHX-01.`);
    } catch (err: any) {
      setErrorMsg(err.message || "Ошибка при добавлении астронавта.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (member: Astronaut) => {
    setEditingAstronaut(member);
    setEditForm({
      name: member.name || "",
      callsign: member.callsign || "",
      specialty: member.specialty || "",
      age: member.age || 34,
      blood_type: member.blood_type || "O+",
      resting_hr: member.resting_hr || 65,
      max_hr: member.max_hr || 175,
      emergency_contact: member.emergency_contact || "",
      notes: member.notes || "",
      avatar_url: member.avatar_url || "",
    });
    setEditError("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAstronaut) return;
    setSavingEdit(true);
    setEditError("");
    try {
      await api<Astronaut>(`/astronauts/${editingAstronaut.id}`, isFlightSurgeon ? "flight_surgeon" : "commander", {
        method: "PUT",
        body: JSON.stringify({
          name: editForm.name.trim(),
          callsign: editForm.callsign.trim().toUpperCase(),
          specialty: editForm.specialty.trim(),
          mission_id: editingAstronaut.mission_id || 1,
          active: editingAstronaut.active,
          age: Number(editForm.age) || 34,
          blood_type: editForm.blood_type,
          resting_hr: Number(editForm.resting_hr) || 65,
          max_hr: Number(editForm.max_hr) || 175,
          emergency_contact: editForm.emergency_contact.trim(),
          notes: editForm.notes.trim(),
          avatar_url: editForm.avatar_url || null,
        }),
      });
      setEditingAstronaut(null);
      onRefreshCrew();
      showToast(`Данные астронавта ${editForm.name} успешно обновлены в ЦУП.`);
    } catch (err: any) {
      setEditError(err.message || "Ошибка при обновлении данных.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingAstronaut) return;
    setIsDeleting(true);
    try {
      await api(`/astronauts/${deletingAstronaut.id}`, isFlightSurgeon ? "flight_surgeon" : "commander", {
        method: "DELETE",
      });
      showToast(`Член экипажа ${deletingAstronaut.name} отстранен от выполнения космической миссии.`);
      setDeletingAstronaut(null);
      onRefreshCrew();
    } catch (err: any) {
      alert(err.message || "Ошибка при отстранении члена экипажа");
    } finally {
      setIsDeleting(false);
    }
  };

  const isAdmin = isFlightSurgeon || isCommander;

  return (
    <div className="wrapc" style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "60px" }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            zIndex: 9999,
            background: "#10b981",
            color: "#ffffff",
            padding: "14px 22px",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
            fontWeight: 700,
            boxShadow: "0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(16, 185, 129, 0.4)",
            animation: "fadeIn 0.25s ease",
          }}
        >
          <CheckCircle size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

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
                  padding: "3px 10px",
                  borderRadius: "12px",
                  background: isFlightSurgeon
                    ? "rgba(16, 185, 129, 0.15)"
                    : isCommander
                    ? "rgba(59, 130, 246, 0.15)"
                    : "rgba(245, 158, 11, 0.15)",
                  color: isFlightSurgeon ? "#10b981" : isCommander ? "var(--pr)" : "#f59e0b",
                  border: isFlightSurgeon
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : isCommander
                    ? "1px solid rgba(59, 130, 246, 0.3)"
                    : "1px solid rgba(245, 158, 11, 0.3)",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Shield size={12} />
                <span>
                  {isFlightSurgeon
                    ? "Врач миссии (CMO) · Полный административный доступ"
                    : isCommander
                    ? "Командир миссии · Оперативный контроль"
                    : "Космонавт · Личный защищенный терминал"}
                </span>
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
            {/* Add Astronaut Button (Allowed only for Flight Surgeon / Admin) */}
            {isAdmin && (
              <button
                className="btn pri"
                onClick={() => setShowAddModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 16px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: 700,
                  boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
                }}
              >
                <UserPlus size={16} />
                <span>Добавить астронавта</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Role Notice Banner for Astronauts */}
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
                В соответствии со стандартами медицинской тайны NASA STD-3001, подробные клинические карты сослуживцев скрыты. Вы можете редактировать и просматривать только свой профиль.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crew Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
          gap: "20px",
        }}
      >
        {crew.map((member) => {
          const isSelected = member.id === astronaut?.id;
          const isOwnCard = user?.astronautId
            ? member.id === user.astronautId
            : member.callsign === user?.callsign || member.id === 1;

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
                  minHeight: "280px",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "var(--s2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--t3)",
                    marginBottom: "12px",
                  }}
                >
                  <Lock size={22} />
                </div>
                <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700 }}>
                  {member.name}
                </h3>
                <div style={{ fontSize: "12px", color: "var(--t3)", marginBottom: "12px" }}>
                  Позывной: {member.callsign} · {member.specialty}
                </div>
                <div style={{ fontSize: "11px", color: "var(--t2)", maxWidth: "260px", lineHeight: "1.5" }}>
                  🔒 Медицинская карта защищена протоколом NASA STD-3001. Полный доступ разрешен только Врачу ЦУП (Flight Surgeon).
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
                padding: "22px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                boxShadow: isSelected ? "0 8px 25px rgba(59, 130, 246, 0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
                position: "relative",
              }}
            >
              {/* Member Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.name}
                    style={{
                      width: "54px",
                      height: "54px",
                      borderRadius: "14px",
                      objectFit: "cover",
                      border: "2px solid var(--sep)",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "54px",
                      height: "54px",
                      borderRadius: "14px",
                      fontSize: "18px",
                      fontWeight: 800,
                      background: isSelected ? "var(--pr)" : "var(--s2)",
                      color: isSelected ? "#fff" : "var(--t1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid var(--sep)",
                      flexShrink: 0,
                    }}
                  >
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "16px",
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

              {/* Bio summary table */}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px", borderTop: "1px solid var(--sep)", borderBottom: "1px solid var(--sep)", padding: "10px 0", fontSize: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--t3)" }}>Специализация:</span>
                  <span style={{ fontWeight: 600, maxWidth: "180px", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {member.specialty}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--t3)" }}>Возраст / Группа:</span>
                  <span style={{ fontWeight: 600 }}>
                    {member.age || 34} лет · {member.blood_type || "O+"}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--t3)" }}>Базовый пульс:</span>
                  <span style={{ fontWeight: 700, color: "var(--tx)" }}>
                    {member.resting_hr || 65} bpm (макс {member.max_hr || 175})
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--t3)" }}>Статус допуска:</span>
                  <span style={{ color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                    ● Class I Flight Active
                  </span>
                </div>
              </div>

              {/* Primary Actions: Monitor & Profile */}
              <div style={{ display: "flex", gap: "8px" }}>
                {(isAdmin || isOwnCard) && (
                  <button
                    className={isSelected ? "btn sec" : "btn pri"}
                    onClick={() => onSelectAstronaut(member.id)}
                    style={{ flex: 1, fontSize: "12px", padding: "8px 10px", borderRadius: "10px" }}
                  >
                    {isSelected ? "Текущий" : "Мониторинг"}
                  </button>
                )}
                <Link
                  className="btn sec"
                  to="/profile"
                  onClick={() => onSelectAstronaut(member.id)}
                  style={{
                    fontSize: "12px",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Профиль
                </Link>
              </div>

              {/* Admin CRUD Actions: Edit & Delete (strictly for Flight Surgeon or Commander) */}
              {isAdmin && (
                <div style={{ display: "flex", gap: "8px", borderTop: "1px dashed var(--sep)", paddingTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(member)}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "6px 10px",
                      borderRadius: "8px",
                      background: "rgba(59, 130, 246, 0.1)",
                      border: "1px solid rgba(59, 130, 246, 0.25)",
                      color: "var(--pr)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Edit2 size={13} />
                    <span>Изменить</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingAstronaut(member)}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "6px 10px",
                      borderRadius: "8px",
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      color: "#ef4444",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Отстранить</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Astronaut Modal (Admin / CMO / Commander) */}
      {editingAstronaut && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setEditingAstronaut(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--s1)",
              border: "1px solid var(--sep)",
              borderRadius: "20px",
              padding: "26px",
              width: "100%",
              maxWidth: "540px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Edit2 size={20} style={{ color: "var(--pr)" }} />
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                  Редактирование профиля: {editingAstronaut.name}
                </h2>
              </div>
              <button
                onClick={() => setEditingAstronaut(null)}
                style={{ background: "none", border: "none", color: "var(--t2)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {editError && (
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
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Avatar Preview & Upload */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", background: "var(--s2)", padding: "12px", borderRadius: "14px", border: "1px solid var(--sep)" }}>
                {editForm.avatar_url ? (
                  <img
                    src={editForm.avatar_url}
                    alt="Аватар"
                    style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--pr)" }}
                  />
                ) : (
                  <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "var(--s1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t3)", border: "1px dashed var(--sep)" }}>
                    <Camera size={24} />
                  </div>
                )}
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Фотография / Аватарка</div>
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      background: "var(--s1)",
                      border: "1px solid var(--sep)",
                      color: "var(--tx)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Upload size={13} />
                    <span>Загрузить фото</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file, (base64) => setEditForm((prev) => ({ ...prev, avatar_url: base64 })));
                        }
                      }}
                    />
                  </label>
                  {editForm.avatar_url && (
                    <button
                      type="button"
                      onClick={() => setEditForm((prev) => ({ ...prev, avatar_url: "" }))}
                      style={{ marginLeft: "8px", background: "none", border: "none", color: "#ef4444", fontSize: "11px", cursor: "pointer" }}
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </div>

              {/* Name & Callsign */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--t2)", marginBottom: "4px" }}>
                    ФИО астронавта
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", background: "var(--s2)", border: "1px solid var(--sep)", color: "var(--tx)", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--t2)", marginBottom: "4px" }}>
                    Позывной (Callsign)
                  </label>
                  <input
                    type="text"
                    value={editForm.callsign}
                    onChange={(e) => setEditForm({ ...editForm, callsign: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", background: "var(--s2)", border: "1px solid var(--sep)", color: "var(--tx)", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Specialty */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--t2)", marginBottom: "4px" }}>
                  Специализация и должность
                </label>
                <input
                  type="text"
                  value={editForm.specialty}
                  onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", background: "var(--s2)", border: "1px solid var(--sep)", color: "var(--tx)", fontSize: "13px" }}
                />
              </div>

              {/* Age, Blood Type, Resting HR */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--t2)", marginBottom: "4px" }}>
                    Возраст
                  </label>
                  <input
                    type="number"
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", background: "var(--s2)", border: "1px solid var(--sep)", color: "var(--tx)", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--t2)", marginBottom: "4px" }}>
                    Группа крови
                  </label>
                  <select
                    value={editForm.blood_type}
                    onChange={(e) => setEditForm({ ...editForm, blood_type: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", background: "var(--s2)", border: "1px solid var(--sep)", color: "var(--tx)", fontSize: "13px" }}
                  >
                    <option value="O+">O (I) Rh+</option>
                    <option value="O-">O (I) Rh-</option>
                    <option value="A+">A (II) Rh+</option>
                    <option value="A-">A (II) Rh-</option>
                    <option value="B+">B (III) Rh+</option>
                    <option value="B-">B (III) Rh-</option>
                    <option value="AB+">AB (IV) Rh+</option>
                    <option value="AB-">AB (IV) Rh-</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--t2)", marginBottom: "4px" }}>
                    Базовый пульс
                  </label>
                  <input
                    type="number"
                    value={editForm.resting_hr}
                    onChange={(e) => setEditForm({ ...editForm, resting_hr: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", background: "var(--s2)", border: "1px solid var(--sep)", color: "var(--tx)", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--t2)", marginBottom: "4px" }}>
                  Контактное лицо на Земле (Emergency Contact)
                </label>
                <input
                  type="text"
                  placeholder="напр. Координационный центр ЦУП: +1 (281) 483-0111"
                  value={editForm.emergency_contact}
                  onChange={(e) => setEditForm({ ...editForm, emergency_contact: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", background: "var(--s2)", border: "1px solid var(--sep)", color: "var(--tx)", fontSize: "13px" }}
                />
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--t2)", marginBottom: "4px" }}>
                  Клинические отметки и протоколы врача
                </label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Физиологические особенности, допуск к внекорабельной деятельности (EVA), режим тренировок..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", background: "var(--s2)", border: "1px solid var(--sep)", color: "var(--tx)", fontSize: "13px", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button
                  type="button"
                  className="btn sec"
                  onClick={() => setEditingAstronaut(null)}
                  style={{ padding: "8px 16px", borderRadius: "10px" }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn pri"
                  disabled={savingEdit}
                  style={{ padding: "8px 22px", borderRadius: "10px" }}
                >
                  {savingEdit ? "Сохранение..." : "Сохранить изменения"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Discharge Confirmation Modal */}
      {deletingAstronaut && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setDeletingAstronaut(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--s1)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              borderRadius: "20px",
              padding: "26px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.15)",
                color: "#ef4444",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <UserX size={28} />
            </div>

            <h2 style={{ margin: "0 0 8px", fontSize: "19px", fontWeight: 700 }}>
              Отстранить члена экипажа?
            </h2>

            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--t2)", lineHeight: "1.5" }}>
              Вы действительно хотите отстранить <b>{deletingAstronaut.name}</b> ({deletingAstronaut.callsign}) от участия в миссии CHX-01? Запись будет переведена в архив медицинского штаба.
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                className="btn sec"
                onClick={() => setDeletingAstronaut(null)}
                style={{ padding: "10px 18px", borderRadius: "10px" }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  padding: "10px 22px",
                  borderRadius: "10px",
                  background: "#ef4444",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {isDeleting ? "Отстранение..." : "Подтвердить отстранение"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Astronaut Modal (Flight Surgeon only) */}
      {showAddModal && isAdmin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
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

            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Photo Upload */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "var(--s2)", padding: "10px 14px", borderRadius: "12px", border: "1px solid var(--sep)" }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Аватар" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--pr)" }} />
                ) : (
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--s1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t3)" }}>
                    <Camera size={20} />
                  </div>
                )}
                <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px", background: "var(--s1)", border: "1px solid var(--sep)", color: "var(--tx)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                  <Upload size={13} />
                  <span>Загрузить фото/аватар</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, (base64) => setAvatarUrl(base64));
                    }}
                  />
                </label>
              </div>

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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--t2)", marginBottom: "6px" }}>
                    Возраст
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", background: "var(--s2)", border: "1px solid var(--sep)", color: "var(--tx)", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--t2)", marginBottom: "6px" }}>
                    Базовый пульс (ЧСС)
                  </label>
                  <input
                    type="number"
                    value={restingHr}
                    onChange={(e) => setRestingHr(Number(e.target.value))}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", background: "var(--s2)", border: "1px solid var(--sep)", color: "var(--tx)", fontSize: "14px" }}
                  />
                </div>
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

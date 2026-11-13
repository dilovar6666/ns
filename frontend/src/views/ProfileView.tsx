import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Droplets,
  Moon,
  Footprints,
  Calendar,
  Save,
  CheckCircle,
  Settings,
  LayoutDashboard,
  Award,
  Activity,
  Edit2,
  Camera,
  Upload,
  X,
  Shield,
  Phone,
  FileText,
  UserCheck,
} from "lucide-react";
import type { Astronaut, Metric } from "../api";
import { api, latest } from "../api";
import { useAuth } from "../context/AuthContext";
import { AstronautProfileCanvas } from "../components/AstronautProfileCanvas";

type Props = {
  astronaut?: Astronaut;
  crew: Astronaut[];
  metrics: Metric[];
  onSelectAstronaut: (id: number) => void;
  onRefreshCrew?: () => void;
};

export function ProfileView({
  astronaut,
  crew,
  metrics,
  onSelectAstronaut,
  onRefreshCrew,
}: Props) {
  const { user, isFlightSurgeon, isCommander, isAstronaut, updateCurrentUser } = useAuth();

  const [savedToast, setSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [hrThreshold, setHrThreshold] = useState("105");
  const [spo2Threshold, setSpo2Threshold] = useState("94");
  const [sleepTarget, setSleepTarget] = useState("8.0");

  // Edit Profile Modal
  const [showEditModal, setShowEditModal] = useState(false);
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

  const latestList = latest(metrics);
  const currentHr = latestList.find((m) => m.key === "heart_rate")?.value ?? 72;
  const currentSpo2 = latestList.find((m) => m.key === "spo2")?.value ?? 98;
  const currentSleep = latestList.find((m) => m.key === "sleep_duration")?.value ?? 7.5;
  const currentActivity = latestList.find((m) => m.key === "activity")?.value ?? 8230;

  const astronautName = astronaut?.name || user?.full_name || "Алекс Нова";
  const avatarUrl = astronaut?.avatar_url || user?.avatar_url || null;
  const initials = astronautName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isOwnProfile = user?.astronautId
    ? astronaut?.id === user.astronautId
    : astronaut?.callsign === user?.callsign || astronaut?.id === 1;

  const canEdit = isFlightSurgeon || isCommander || isOwnProfile;

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      setToastMessage("");
    }, 3500);
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    showNotification("Персонализированные пороги оповещения успешно сохранены в медицинскую карту.");
  };

  const handleImageFileChange = (file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Размер изображения не должен превышать 2 МБ");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target?.result && astronaut) {
        const base64 = e.target.result as string;
        try {
          await api(`/astronauts/${astronaut.id}/avatar`, isFlightSurgeon ? "flight_surgeon" : "astronaut", {
            method: "POST",
            body: JSON.stringify({ avatar_url: base64 }),
          });
          updateCurrentUser({ avatar_url: base64 });
          showNotification("Аватарка успешно обновлена!");
          if (onRefreshCrew) onRefreshCrew();
        } catch (err: any) {
          alert(err.message || "Ошибка при загрузке аватара");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEditModal = () => {
    if (!astronaut) return;
    setEditForm({
      name: astronaut.name || "",
      callsign: astronaut.callsign || "",
      specialty: astronaut.specialty || "",
      age: astronaut.age || 34,
      blood_type: astronaut.blood_type || "O+",
      resting_hr: astronaut.resting_hr || 65,
      max_hr: astronaut.max_hr || 175,
      emergency_contact: astronaut.emergency_contact || "",
      notes: astronaut.notes || "",
      avatar_url: astronaut.avatar_url || "",
    });
    setEditError("");
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!astronaut) return;
    setSavingEdit(true);
    setEditError("");
    try {
      await api<Astronaut>(`/astronauts/${astronaut.id}`, isFlightSurgeon ? "flight_surgeon" : "astronaut", {
        method: "PUT",
        body: JSON.stringify({
          name: editForm.name.trim(),
          callsign: editForm.callsign.trim().toUpperCase(),
          specialty: editForm.specialty.trim(),
          mission_id: astronaut.mission_id || 1,
          active: astronaut.active,
          age: Number(editForm.age) || 34,
          blood_type: editForm.blood_type,
          resting_hr: Number(editForm.resting_hr) || 65,
          max_hr: Number(editForm.max_hr) || 175,
          emergency_contact: editForm.emergency_contact.trim(),
          notes: editForm.notes.trim(),
          avatar_url: editForm.avatar_url || null,
        }),
      });

      if (isOwnProfile) {
        updateCurrentUser({
          full_name: editForm.name.trim(),
          callsign: editForm.callsign.trim().toUpperCase(),
          avatar_url: editForm.avatar_url || undefined,
        });
      }

      setShowEditModal(false);
      showNotification("Данные профиля и медицинская карта успешно обновлены!");
      if (onRefreshCrew) onRefreshCrew();
    } catch (err: any) {
      setEditError(err.message || "Ошибка при сохранении профиля");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="wrapc" style={{ maxWidth: "1240px", margin: "0 auto", paddingBottom: "70px" }}>
      {/* Top Breadcrumb & Page Header */}
      <header style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "var(--t3)", marginBottom: "4px" }}>
              КОСМИЧЕСКАЯ ЭКСПЕДИЦИЯ CHX-01
            </div>
            <h1 className="disp" style={{ fontSize: "34px", fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.03em" }}>
              Astronaut Profile & Telemetry Card
            </h1>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--t2)" }}>
              Медицинский паспорт, биометрический допуск и индивидуальные настройки NASA STD-3001
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {crew.length > 1 && (
              <select
                className="inp"
                value={astronaut?.id}
                onChange={(e) => onSelectAstronaut(Number(e.target.value))}
                aria-label="Выбрать астронавта"
                style={{
                  fontWeight: 600,
                  fontSize: "13px",
                  background: "var(--s1)",
                  color: "var(--tx)",
                  border: "1px solid var(--sep)",
                  borderRadius: "12px",
                  padding: "8px 14px",
                }}
              >
                {crew.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.callsign})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </header>

      {/* Seamless Hero Row: Info on Left, 3D Helmet on Right */}
      <section
        className="profile-helmet-grid"
        style={{
          marginBottom: "36px",
          position: "relative",
        }}
      >
        {/* Left: Astronaut Profile Information */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
            {/* Round Avatar with Photo Upload overlay */}
            <div style={{ position: "relative" }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={astronautName}
                  style={{
                    width: "78px",
                    height: "78px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid rgba(255, 255, 255, 0.25)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "78px",
                    height: "78px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#FFFFFF",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
              )}

              {/* Camera Upload Button Overlay */}
              {canEdit && (
                <label
                  title="Изменить фотографию профиля"
                  style={{
                    position: "absolute",
                    bottom: "-2px",
                    right: "-2px",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "var(--pr)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                    border: "2px solid #000000",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <Camera size={14} />
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFileChange(file);
                    }}
                  />
                </label>
              )}
            </div>

            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: "var(--t3)", marginBottom: "4px" }}>
                ASTRONAUT PROFILE · {astronaut?.callsign || "CHX-01"}
              </div>
              <h2 style={{ margin: 0, fontSize: "32px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                {astronautName}
              </h2>
              <div style={{ fontSize: "14px", color: "var(--t2)", marginTop: "4px" }}>
                {astronaut?.specialty || "Бортинженер, экипаж миссии CHX-01"}
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "26px" }}>
            <span
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.85)",
              }}
            >
              Позывной: {astronaut?.callsign || "APOLLO-01"} · ID #{astronaut?.id || 1}
            </span>

            <span
              style={{
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#34D399",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34D399" }} />
              Class I Flight Active
            </span>

            <span
              style={{
                background: "rgba(59, 130, 246, 0.15)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--pr)",
              }}
            >
              {astronaut?.age || 34} лет · {astronaut?.blood_type || "O+"}
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {canEdit && (
              <button
                type="button"
                onClick={handleOpenEditModal}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "11px 22px",
                  borderRadius: "999px",
                  background: "var(--pr)",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(59, 130, 246, 0.35)",
                }}
              >
                <Edit2 size={16} />
                <span>Редактировать данные</span>
              </button>
            )}

            <Link
              to="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "11px 24px",
                borderRadius: "999px",
                background: "#FFFFFF",
                color: "#000000",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              }}
            >
              <LayoutDashboard size={16} />
              <span>Открыть Dashboard</span>
            </Link>

            <Link
              to="/settings"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "11px 22px",
                borderRadius: "999px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Settings size={16} />
              <span>Настройки</span>
            </Link>
          </div>
        </div>

        {/* Right: 3D Helmet */}
        <div
          className="profile-canvas-col"
          style={{
            height: "360px",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            overflow: "visible",
          }}
        >
          <AstronautProfileCanvas />
        </div>
      </section>

      {savedToast && (
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
            animation: "fadeIn 0.2s ease",
          }}
        >
          <CheckCircle size={18} />
          <span>{toastMessage || "Данные успешно обновлены."}</span>
        </div>
      )}

      {/* Main Two-Column Grid: Mission Info & Monitoring Overview */}
      <div className="responsive-split-2col" style={{ marginBottom: "28px" }}>
        {/* Mission Information Card */}
        <div
          style={{
            background: "var(--s1)",
            border: "1px solid var(--sep)",
            borderRadius: "20px",
            padding: "24px 28px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={18} style={{ color: "var(--pr)" }} />
              <span>Mission Information</span>
            </h2>
            <span style={{ fontSize: "11px", color: "var(--t3)" }}>Обновлено сегодня, 14:32</span>
          </div>

          {/* Big Progress */}
          <div style={{ background: "var(--s2)", padding: "16px 20px", borderRadius: "14px", border: "1px solid var(--sep)", marginBottom: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "24px", fontWeight: 900, color: "var(--tx)" }}>
                День 42 <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--t3)" }}>из 180</span>
              </span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--pr)" }}>
                23%
              </span>
            </div>
            <div style={{ width: "100%", height: "6px", background: "var(--s1)", borderRadius: "6px", overflow: "hidden", marginTop: "10px" }}>
              <div style={{ width: "23.3%", height: "100%", background: "var(--pr)" }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid var(--sep)" }}>
              <span style={{ color: "var(--t3)" }}>Название миссии</span>
              <span style={{ fontWeight: 600 }}>CHX-01, орбитальная</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid var(--sep)" }}>
              <span style={{ color: "var(--t3)" }}>Продолжительность</span>
              <span style={{ fontWeight: 600 }}>180 дней</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid var(--sep)" }}>
              <span style={{ color: "var(--t3)" }}>Начало и окончание</span>
              <span style={{ fontWeight: 600 }}>1 окт 2026 — 29 мар 2027</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--t3)" }}>Статус миссии</span>
              <span style={{ fontWeight: 700, color: "#10b981", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />
                Активна
              </span>
            </div>
          </div>
        </div>

        {/* Biometrics & Medical Passport Card */}
        <div
          style={{
            background: "var(--s1)",
            border: "1px solid var(--sep)",
            borderRadius: "20px",
            padding: "24px 28px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                <Shield size={18} style={{ color: "var(--ok)" }} />
                <span>Медицинский паспорт и допуск NASA STD</span>
              </h2>
              {canEdit && (
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  style={{ background: "none", border: "none", color: "var(--pr)", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Edit2 size={13} />
                  <span>Изменить</span>
                </button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
              <div style={{ background: "var(--s2)", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--sep)" }}>
                <div style={{ fontSize: "11px", color: "var(--t3)", marginBottom: "2px" }}>Группа крови & Rh</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--tx)" }}>{astronaut?.blood_type || "O (I) Rh+"}</div>
              </div>
              <div style={{ background: "var(--s2)", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--sep)" }}>
                <div style={{ fontSize: "11px", color: "var(--t3)", marginBottom: "2px" }}>Возраст / Лет</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--tx)" }}>{astronaut?.age || 34} года</div>
              </div>
              <div style={{ background: "var(--s2)", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--sep)" }}>
                <div style={{ fontSize: "11px", color: "var(--t3)", marginBottom: "2px" }}>Базовый пульс покоя</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--pr)" }}>{astronaut?.resting_hr || 65} bpm</div>
              </div>
              <div style={{ background: "var(--s2)", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--sep)" }}>
                <div style={{ fontSize: "11px", color: "var(--t3)", marginBottom: "2px" }}>Максимальная ЧСС</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#f59e0b" }}>{astronaut?.max_hr || 175} bpm</div>
              </div>
            </div>

            <div style={{ fontSize: "12px", color: "var(--t2)", background: "rgba(0,0,0,0.15)", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--sep)" }}>
              <div style={{ fontWeight: 700, color: "var(--t1)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <FileText size={14} style={{ color: "var(--cy)" }} />
                <span>Клинические отметки ЦУП:</span>
              </div>
              <div>
                {astronaut?.notes || "Допуск к внекорабельной деятельности (EVA) подтвержден. Показатели сердечно-сосудистой адаптации стабильны."}
              </div>
              {astronaut?.emergency_contact && (
                <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed var(--sep)", display: "flex", alignItems: "center", gap: "6px", color: "var(--t3)" }}>
                  <Phone size={13} />
                  <span>Экстренный контакт: <b style={{ color: "var(--tx)" }}>{astronaut.emergency_contact}</b></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
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
          onClick={() => setShowEditModal(false)}
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
                  Редактировать данные профиля: {astronautName}
                </h2>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
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
              {/* Photo Upload */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "var(--s2)", padding: "12px", borderRadius: "14px", border: "1px solid var(--sep)" }}>
                {editForm.avatar_url ? (
                  <img
                    src={editForm.avatar_url}
                    alt="Аватарка"
                    style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--pr)" }}
                  />
                ) : (
                  <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--s1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t3)", border: "1px dashed var(--sep)" }}>
                    <Camera size={22} />
                  </div>
                )}
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Фотография профиля</div>
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
                    <span>Загрузить новый снимок</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            alert("Файл слишком велик (макс 2 МБ)");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              setEditForm((prev) => ({ ...prev, avatar_url: ev.target!.result as string }));
                            }
                          };
                          reader.readAsDataURL(file);
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
                      Очистить
                    </button>
                  )}
                </div>
              </div>

              {/* Name & Callsign */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--t2)", marginBottom: "4px" }}>
                    Имя и фамилия
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
                  Специализация и назначение
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
                  Экстренный контакт (Земля / Координационный центр)
                </label>
                <input
                  type="text"
                  placeholder="+1 (281) 483-0111 / Координатор полета"
                  value={editForm.emergency_contact}
                  onChange={(e) => setEditForm({ ...editForm, emergency_contact: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", background: "var(--s2)", border: "1px solid var(--sep)", color: "var(--tx)", fontSize: "13px" }}
                />
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--t2)", marginBottom: "4px" }}>
                  Клинические отметки и протоколы
                </label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Особенности адаптации к невесомости, протоколы физических тренировок..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", background: "var(--s2)", border: "1px solid var(--sep)", color: "var(--tx)", fontSize: "13px", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button
                  type="button"
                  className="btn sec"
                  onClick={() => setShowEditModal(false)}
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
                  {savingEdit ? "Сохранение..." : "Сохранить профиль"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

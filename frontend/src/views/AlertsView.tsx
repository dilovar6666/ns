import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  Check,
  ShieldAlert,
  Clock,
  User,
} from "lucide-react";
import type { Astronaut, Notification } from "../api";

type Props = {
  astronaut?: Astronaut;
  notifications: Notification[];
  onMarkNotificationRead: (id: number) => void;
};

export function AlertsView({
  astronaut,
  notifications,
  onMarkNotificationRead,
}: Props) {
  const [filter, setFilter] = useState<"all" | "unread" | "warning" | "critical">("all");
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(
    notifications[0]?.id ?? null
  );

  const filtered = notifications.filter((item) => {
    if (filter === "all") return true;
    if (filter === "unread") return !item.read;
    return item.level === filter;
  });

  const selectedAlert =
    notifications.find((n) => n.id === selectedAlertId) || notifications[0];

  const handleMarkAllRead = () => {
    notifications.forEach((n) => {
      if (!n.read) onMarkNotificationRead(n.id);
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="wrapc">
      {/* Header */}
      <header className="tb">
        <div className="up">
          <p className="eyb">Mission Operational Anomaly Notification Center</p>
          <h1 className="lt disp">Alerts & Notifications</h1>
          <p className="sub">
            Automated physiological anomaly detection and clinical contingency logging
          </p>
        </div>
        <div className="tbr up" style={{ animationDelay: "60ms" }}>
          {unreadCount > 0 && (
            <button
              className="btn-secondary"
              onClick={handleMarkAllRead}
              style={{ fontSize: "13px", padding: "8px 14px" }}
            >
              <Check className="ico sm" /> Mark All as Read
            </button>
          )}
          <Link
            className="av"
            to="/profile"
            style={{ width: "40px", height: "40px" }}
          >
            {astronaut?.name?.slice(0, 2).toUpperCase() || "AN"}
          </Link>
        </div>
      </header>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginTop: "16px",
          flexWrap: "wrap",
        }}
      >
        <div className="flt">
          <button
            className={filter === "all" ? "on" : ""}
            onClick={() => setFilter("all")}
          >
            All ({notifications.length})
          </button>
          <button
            className={filter === "unread" ? "on" : ""}
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={filter === "warning" ? "on" : ""}
            onClick={() => setFilter("warning")}
          >
            Warnings ({notifications.filter((n) => n.level === "warning").length})
          </button>
          <button
            className={filter === "critical" ? "on" : ""}
            onClick={() => setFilter("critical")}
          >
            Critical ({notifications.filter((n) => n.level === "critical").length})
          </button>
        </div>
      </div>

      {/* Alerts Layout Grid */}
      <div className="ag">
        {/* Left: Alerts List */}
        <div className="grp">
          {filtered.length === 0 ? (
            <div className="cd empty">
              <CheckCircle2
                className="ico"
                style={{ width: "48px", height: "48px", color: "var(--ok)", marginBottom: "12px" }}
              />
              <h2 className="h2">No active warnings</h2>
              <p className="cap" style={{ marginTop: "4px" }}>
                All crew biometric telemetry is currently within nominal safety envelopes.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`it ${!item.read ? "unr" : ""} ${item.level === "critical" ? "cr" : item.level === "warning" ? "wa" : "in"}`}
                onClick={() => setSelectedAlertId(item.id)}
                style={{
                  outline: selectedAlert?.id === item.id ? "2px solid var(--pr)" : "none",
                }}
              >
                <span
                  className={`icb ${item.level === "critical" ? "cr" : item.level === "warning" ? "wa" : "in"}`}
                  style={{ background: "var(--s2)", marginTop: "2px" }}
                >
                  {item.level === "critical" ? (
                    <AlertTriangle className="gly" style={{ color: "var(--cr)" }} />
                  ) : item.level === "warning" ? (
                    <AlertTriangle className="gly" style={{ color: "var(--wa)" }} />
                  ) : (
                    <Info className="gly" style={{ color: "var(--pr)" }} />
                  )}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "15px",
                        color: item.level === "critical" ? "var(--cr)" : "var(--t1)",
                      }}
                    >
                      {item.title}
                    </span>
                    <span className="cap num" style={{ fontSize: "12px" }}>
                      {new Date(item.created_at).toLocaleTimeString("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      color: "var(--t2)",
                    }}
                  >
                    {item.detail}
                  </p>
                </div>

                {!item.read && (
                  <button
                    className="btn bt"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkNotificationRead(item.id);
                    }}
                    style={{ fontSize: "12px", padding: "6px 12px", alignSelf: "center" }}
                  >
                    Read
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Right: Selected Alert Detail Sidebar */}
        {selectedAlert && (
          <aside className="cd up" style={{ padding: "24px 24px", height: "fit-content" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                background:
                  selectedAlert.level === "critical"
                    ? "rgba(255, 59, 48, 0.12)"
                    : selectedAlert.level === "warning"
                    ? "rgba(255, 149, 0, 0.12)"
                    : "rgba(65, 105, 255, 0.12)",
                color:
                  selectedAlert.level === "critical"
                    ? "var(--cr)"
                    : selectedAlert.level === "warning"
                    ? "var(--wa)"
                    : "var(--pr)",
                marginBottom: "14px",
              }}
            >
              Severity: {selectedAlert.level.toUpperCase()}
            </div>

            <h2 className="h2" style={{ fontSize: "18px", marginBottom: "10px" }}>
              {selectedAlert.title}
            </h2>

            <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--t2)", marginBottom: "20px" }}>
              {selectedAlert.detail}
            </p>

            <div className="kv">
              <span>Review Status:</span>
              <span style={{ fontWeight: 600, color: selectedAlert.read ? "var(--ok)" : "var(--wa)" }}>
                {selectedAlert.read ? "Acknowledged" : "Pending Acknowledgment"}
              </span>
            </div>

            <div className="kv">
              <span>Timestamp:</span>
              <span className="num" style={{ fontWeight: 600 }}>
                {new Date(selectedAlert.created_at).toLocaleString("ru-RU")}
              </span>
            </div>

            <div className="kv">
              <span>Associated Crew Member:</span>
              <span style={{ fontWeight: 600 }}>
                {astronaut?.name || "Expedition CHX-01 Crew"}
              </span>
            </div>

            <div className="kv">
              <span>Recommended Clinical Action:</span>
              <span style={{ fontWeight: 600, color: "var(--pr)" }}>
                Verify Protocol EVA-04
              </span>
            </div>

            {!selectedAlert.read && (
              <button
                className="btn-primary"
                onClick={() => onMarkNotificationRead(selectedAlert.id)}
                style={{ width: "100%", marginTop: "20px", fontSize: "14px" }}
              >
                <Check className="ico sm" /> Acknowledge
              </button>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

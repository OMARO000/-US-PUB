"use client"

/**
 * /notifications — [u] surfaces updates as chat bubbles
 * Static notifications rendered as [u] messages.
 * Categories: matches, connections, messages, insights,
 *             journal prompts, policy changes, updates.
 */

import { useState, useEffect } from "react"

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface Notification {
  id: string
  category: "match" | "connection" | "message" | "insight" | "journal" | "policy" | "update"
  content: string
  timestamp: string
  read: boolean
}

const CATEGORY_LABELS: Record<Notification["category"], string> = {
  match: "[match]",
  connection: "[connection]",
  message: "[message]",
  insight: "[insight]",
  journal: "[journal]",
  policy: "[policy]",
  update: "[update]",
}

const CATEGORY_COLORS: Record<Notification["category"], string> = {
  match: "var(--amber)",
  connection: "var(--amber)",
  message: "var(--amber)",
  insight: "rgba(100,140,200,0.8)",
  journal: "rgba(130,100,200,0.8)",
  policy: "var(--muted)",
  update: "var(--muted)",
}

function NotificationBubble({ notif }: { notif: Notification }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      alignSelf: "flex-start",
      maxWidth: "80%",
      animation: "fadeInUp 0.3s ease forwards",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "2px",
      }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: CATEGORY_COLORS[notif.category],
          letterSpacing: "0.06em",
        }}>
          {CATEGORY_LABELS[notif.category]}
        </span>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "var(--dim)",
          opacity: 0.5,
        }}>
          {notif.timestamp}
        </span>
      </div>
      <div style={{
        padding: "12px 16px",
        borderRadius: "20px 20px 20px 6px",
        background: "var(--bg2)",
        border: `1px solid ${notif.read ? "var(--border)" : CATEGORY_COLORS[notif.category]}`,
        fontFamily: "var(--font-mono)",
        fontSize: "13.5px",
        fontWeight: 300,
        lineHeight: 1.7,
        color: "var(--text)",
        opacity: notif.read ? 0.6 : 1,
        transition: "opacity 0.2s, border-color 0.2s",
      }}>
        {notif.content}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      paddingTop: "20vh",
      gap: "12px",
    }}>
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: "13px",
        color: "var(--muted)",
        textAlign: "center",
        lineHeight: 1.7,
        maxWidth: "280px",
      }}>
        nothing yet. [u] will surface updates here as they happen.
      </span>
    </div>
  )
}

export default function NotificationsPage({ embedded }: { embedded?: boolean } = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = typeof window !== "undefined"
      ? localStorage.getItem("us_uid") ?? null
      : null
    if (!userId) { setLoading(false); return }

    fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.notifications) {
          setNotifications(data.notifications.map((n: Notification & { createdAt: string | number }) => ({
            ...n,
            timestamp: formatTimeAgo(new Date(n.createdAt).toISOString()),
          })))
          // mark all as read after 1.5s
          setTimeout(() => {
            fetch("/api/notifications", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId }),
            })
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
          }, 1500)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{
      flex: 1,
      width: "100%",
      maxWidth: "640px",
      margin: "0 auto",
      padding: embedded ? "24px 20px 40px" : "40px 20px",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{
        display: "flex",
        alignItems: "baseline",
        gap: "10px",
        marginBottom: "24px",
      }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          color: "var(--text)",
          letterSpacing: "0.04em",
        }}>
          [notifications]
        </span>
        {!loading && notifications.filter((n) => !n.read).length > 0 && (
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--amber)",
            letterSpacing: "0.03em",
          }}>
            {notifications.filter((n) => !n.read).length} new
          </span>
        )}
      </div>

      {/* HAI Standard notice */}
      <div style={{
        border: "1px solid rgba(139,69,19,0.25)",
        borderRadius: "8px",
        padding: "16px 20px",
        marginBottom: "16px",
        background: "rgba(139,69,19,0.06)",
      }}>
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "#8B4513",
          letterSpacing: "0.1em",
          marginBottom: "8px",
        }}>
          [HAI STANDARD]
        </p>
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--text)",
          lineHeight: 1.65,
          marginBottom: "12px",
        }}>
          [us] is built to the HAI Standard — AI held accountable to human values.
        </p>
        <a
          href="https://haiproject.xyz"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "#8B4513",
            textDecoration: "none",
            letterSpacing: "0.06em",
          }}
        >
          [learn more →]
        </a>
      </div>

      {loading && (
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--muted)",
          paddingTop: "10vh",
          textAlign: "center",
          animation: "pulse 1.5s ease-in-out infinite",
        }}>
          [loading...]
        </div>
      )}

      {!loading && notifications.length === 0 && <EmptyState />}

      {!loading && notifications.length > 0 && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}>
          {notifications.map((notif) => (
            <NotificationBubble key={notif.id} notif={notif} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

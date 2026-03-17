"use client"

/**
 * /insights — pattern recognition + match-as-mirror coaching
 *
 * Free users: 3–5 basic observations from portrait signals
 * Paid users: full pattern recognition, framework visibility, match-as-mirror analysis
 *
 * [you] narrates on entry.
 * Sections: Your patterns | What your matches reflect | Framework visibility (paid)
 */

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar/Sidebar"
import YouNarrationBanner from "@/components/navigation/YouNarrationBanner"
import { useYouNarration } from "@/lib/navigation/useYouNarration"

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface MirrorObservation {
  label: string
  content: string
}

interface Framework {
  name: string
  score: number
  note: string
  isPaid: boolean
}

interface Insights {
  freePatterns: string[]
  paidPatterns: string[]
  mirrorObservations: MirrorObservation[]
  frameworks: Framework[]
}

// ─────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: "10px",
      fontFamily: "var(--font-mono)",
      color: "var(--amber)",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      marginBottom: "12px",
      opacity: 0.8,
    }}>
      {children}
    </div>
  )
}

function PatternCard({ text, isPaid = false }: { text: string; isPaid?: boolean }) {
  return (
    <div style={{
      padding: "14px 16px",
      borderRadius: "10px",
      background: "var(--bg2)",
      border: "1px solid var(--border)",
      fontSize: "13px",
      fontFamily: "var(--font-mono)",
      color: isPaid ? "var(--text)" : "var(--muted)",
      fontWeight: 300,
      lineHeight: 1.7,
      position: "relative",
      opacity: isPaid ? 0.5 : 1,
    }}>
      {text}
      {isPaid && (
        <span style={{
          position: "absolute",
          top: "10px",
          right: "12px",
          fontSize: "9px",
          fontFamily: "var(--font-mono)",
          color: "var(--amber)",
          opacity: 0.6,
          letterSpacing: "0.05em",
        }}>
          [paid]
        </span>
      )}
    </div>
  )
}

function MirrorCard({ label, content }: { label: string; content: string }) {
  return (
    <div style={{
      padding: "16px",
      borderRadius: "10px",
      background: "var(--bg2)",
      border: "1px solid var(--border)",
    }}>
      <div style={{
        fontSize: "10px",
        fontFamily: "var(--font-mono)",
        color: "var(--rose)",
        letterSpacing: "0.08em",
        marginBottom: "8px",
        opacity: 0.8,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: "13px",
        fontFamily: "var(--font-mono)",
        color: "var(--text)",
        fontWeight: 300,
        lineHeight: 1.7,
      }}>
        {content}
      </div>
    </div>
  )
}

function FrameworkBar({ name, score, note, isPaid = false }: {
  name: string
  score: number
  note: string
  isPaid?: boolean
}) {
  return (
    <div style={{
      opacity: isPaid ? 0.45 : 1,
      position: "relative",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "6px",
      }}>
        <span style={{
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
          color: "var(--muted)",
          letterSpacing: "0.05em",
        }}>
          [{name}]
        </span>
        {isPaid && (
          <span style={{
            fontSize: "9px",
            fontFamily: "var(--font-mono)",
            color: "var(--amber)",
            opacity: 0.7,
            letterSpacing: "0.05em",
          }}>
            [paid]
          </span>
        )}
      </div>
      <div style={{
        height: "3px",
        background: "var(--bg3)",
        borderRadius: "2px",
        marginBottom: "6px",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${score}%`,
          background: isPaid ? "var(--rose)" : "var(--amber)",
          borderRadius: "2px",
          transition: "width 0.6s ease",
        }} />
      </div>
      <div style={{
        fontSize: "11px",
        fontFamily: "var(--font-mono)",
        color: "var(--dim)",
        fontWeight: 300,
        lineHeight: 1.5,
      }}>
        {note}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "80px 20px",
    }}>
      <div style={{
        fontSize: "12px",
        fontFamily: "var(--font-mono)",
        color: "var(--dim)",
        fontWeight: 300,
      }}>
        [loading your insights...]
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
      padding: "80px 20px",
      gap: "20px",
      textAlign: "center",
    }}>
      <div style={{
        fontSize: "13px",
        fontFamily: "var(--font-mono)",
        color: "var(--muted)",
        fontWeight: 300,
        lineHeight: 1.7,
        maxWidth: "340px",
      }}>
        no insights yet.
      </div>
      <div style={{
        fontSize: "12px",
        fontFamily: "var(--font-mono)",
        color: "var(--dim)",
        fontWeight: 300,
        lineHeight: 1.7,
        maxWidth: "340px",
      }}>
        complete your intake conversation and [you] will start noticing patterns.
      </div>
      <a
        href="/conversation"
        style={{
          display: "inline-block",
          marginTop: "8px",
          height: "44px",
          lineHeight: "44px",
          padding: "0 24px",
          borderRadius: "10px",
          background: "var(--amber)",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--bg)",
          textDecoration: "none",
          letterSpacing: "0.03em",
        }}
      >
        [go to conversation]
      </a>
    </div>
  )
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function InsightsPage() {
  const pathname = usePathname()
  const narration = useYouNarration(pathname)
  const [insights, setInsights] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = typeof window !== "undefined"
      ? localStorage.getItem("us_uid")
      : null
    if (!userId) { setLoading(false); return }

    fetch(`/api/insights?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        setInsights(data.insights ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "var(--bg)" }}>
      <Sidebar />
      <main style={{
        marginLeft: "220px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
      }}>
        <YouNarrationBanner narration={narration} />

        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px 40px",
          maxWidth: "680px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "40px",
        }}>
          {loading ? (
            <LoadingState />
          ) : !insights ? (
            <EmptyState />
          ) : (
            <>
              {/* Your patterns */}
              <section>
                <SectionLabel>[your patterns]</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {insights.freePatterns.map((p, i) => (
                    <PatternCard key={i} text={p} />
                  ))}
                  {insights.paidPatterns.map((p, i) => (
                    <PatternCard key={i} text={p} isPaid />
                  ))}
                </div>
              </section>

              {/* Match as mirror */}
              {insights.mirrorObservations.length > 0 && (
                <section>
                  <SectionLabel>[what your matches reflect]</SectionLabel>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {insights.mirrorObservations.map((m, i) => (
                      <MirrorCard key={i} label={m.label} content={m.content} />
                    ))}
                  </div>
                </section>
              )}

              {/* Framework visibility */}
              <section>
                <SectionLabel>[how [you] sees you]</SectionLabel>
                <div style={{
                  padding: "20px",
                  borderRadius: "12px",
                  background: "var(--bg2)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}>
                  {insights.frameworks.map((f) => (
                    <FrameworkBar
                      key={f.name}
                      name={f.name}
                      score={f.score}
                      note={f.note}
                      isPaid={f.isPaid}
                    />
                  ))}
                </div>
                <div style={{
                  marginTop: "12px",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--dim)",
                  lineHeight: 1.6,
                }}>
                  [paid] layers are visible to subscribers. these signals are observed, not declared — [you] notices them across your behavior. you can correct them in [profile].
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

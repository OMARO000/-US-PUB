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

import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar/Sidebar"
import YouNarrationBanner from "@/components/navigation/YouNarrationBanner"
import { useYouNarration } from "@/lib/navigation/useYouNarration"

// ─────────────────────────────────────────────
// PLACEHOLDER DATA
// Replace with real data from portrait + match engine when built
// ─────────────────────────────────────────────

const FREE_PATTERNS = [
  "you tend to lead with honesty before warmth — people feel oriented around you quickly.",
  "in your connections, you give more than you ask for. you notice this but rarely name it.",
  "you're drawn to people who are building something — direction matters to you more than arrival.",
]

const PAID_PATTERNS = [
  "across three conversations, you've pulled back when things got quiet — not avoidance, more like waiting to be re-invited.",
  "you describe what you offer in relationships before you describe what you need. the gap between those two things is worth sitting with.",
  "your communication is most open in voice, not text. you say more when you can hear yourself saying it.",
]

const MIRROR_OBSERVATIONS = [
  {
    label: "what your matches reflect",
    content: "the people you've resonated with most are in motion — not settled, not arriving. that tells us something about where you are too.",
  },
  {
    label: "a pattern worth naming",
    content: "you're drawn to directness in others. people who say the hard thing without apology. [you] notices you do this too, but less often than you'd like.",
  },
]

const FRAMEWORKS = [
  { name: "values", score: 92, note: "strongest signal in your portrait — you know what you stand for." },
  { name: "narrative", score: 84, note: "high aspiration language. you're in motion." },
  { name: "relational", score: 71, note: "depth-seeker. you give before you ask." },
  { name: "communication", score: 68, note: "voice-first. more open when speaking than writing." },
  { name: "conflict style", score: 55, note: "paid — you engage rather than avoid, but repair is slower than entry." },
  { name: "energy exchange", score: 61, note: "paid — high-give. the gap between what you offer and what you receive is visible." },
]

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
      opacity: isPaid ? 0.5 : 1, // paid locked state
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

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function InsightsPage() {
  const pathname = usePathname()
  const narration = useYouNarration(pathname)

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
          display: "flex",
          flexDirection: "column",
          gap: "40px",
        }}>

          {/* Your patterns */}
          <section>
            <SectionLabel>[your patterns]</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {FREE_PATTERNS.map((p, i) => (
                <PatternCard key={i} text={p} />
              ))}
              {PAID_PATTERNS.map((p, i) => (
                <PatternCard key={i} text={p} isPaid />
              ))}
            </div>
          </section>

          {/* Match as mirror */}
          <section>
            <SectionLabel>[what your matches reflect]</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {MIRROR_OBSERVATIONS.map((m, i) => (
                <MirrorCard key={i} label={m.label} content={m.content} />
              ))}
            </div>
          </section>

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
              {FRAMEWORKS.map((f) => (
                <FrameworkBar
                  key={f.name}
                  name={f.name}
                  score={f.score}
                  note={f.note}
                  isPaid={f.name === "conflict style" || f.name === "energy exchange"}
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

        </div>
      </main>
    </div>
  )
}

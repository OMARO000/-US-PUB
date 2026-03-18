"use client"

/**
 * /about — philosophy, mission, FAQs
 *
 * Not a static page. [you] delivers everything conversationally.
 * Three sections: philosophy, mission, FAQs.
 * FAQs expand on tap — [you]'s voice throughout.
 * [you] narrates on entry.
 */

import { useState } from "react"
import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar/Sidebar"
import YouNarrationBanner from "@/components/navigation/YouNarrationBanner"
import { useYouNarration } from "@/lib/navigation/useYouNarration"

// ─────────────────────────────────────────────
// CONTENT
// All written in [you]'s voice.
// ─────────────────────────────────────────────

const PHILOSOPHY = `most people don't fail at connection because they can't find someone.

they fail because they don't understand themselves well enough to recognize resonance when it appears. because they have no language for what they actually need. because when things get hard — and they always do — they have no support, no perspective, no way to understand what's happening.

[us] exists to change that.

not by optimizing for volume. not by gamifying attention. not by reducing people to profiles and swiping them past each other like products on a shelf.

by going slower. going deeper. and building something that actually lasts.`

const MISSION = `one real connection is worth more than a hundred shallow ones.

[us] is built around three stages of connection:

before — understand yourself. intake, self-portrait, knowing what you actually need and what actually resonates in you.

during — find real resonance. matching on signal, not surface. seven layers of frameworks, weighted by connection type. free for everyone. always.

after — navigate with support. pattern recognition, coaching, pre-meet preparation, post-connect debriefs. for people who want to go deeper.

the ultimate goal of [us] is not a product metric. it is a more connected world. built one real connection at a time.`

const FAQS: { question: string; answer: string }[] = [
  {
    question: "is this a dating app?",
    answer: "no. [us] supports romantic connection, but also platonic and professional. and eventually, community. it doesn't privilege one type of connection over another. it just creates the conditions for real connection to happen — and then gets out of the way.",
  },
  {
    question: "what does [you] actually do?",
    answer: "[you] is the presence at the center of [us]. not a chatbot, not a therapist, not an assistant. a mirror. and a reminder.\n\nduring intake, [you] listens without judgment and reflects back what it observes — not what it assumes. over time, [you] notices patterns across your connections and surfaces them with care. in coaching, [you] helps you prepare, debrief, and understand what's happening.\n\n[you] is not trying to become the connection. it's trying to make connection between humans possible.",
  },
  {
    question: "how does matching work?",
    answer: "the match engine scores compatibility across seven layers: values, narrative, personality, relational style, communication style, cognitive patterns, and cosmological frameworks. each layer is weighted differently depending on whether you're looking for romantic, platonic, or professional connection.\n\nyou never see a score. you see resonance signals — specific observations about where two people align. the score is only used for ranking.\n\npaid users get four additional layers and can activate a 'go deeper' mode that may surface different matches.",
  },
  {
    question: "what's the portrait?",
    answer: "at the end of your intake conversation, [you] generates a portrait — a written reflection of what emerged across your conversation, plus a visual image chosen from a curated library based on your signal profile.\n\nthe portrait is yours. you can confirm it, correct it, or add to it. you can mint it as an NFT on Solana — a permanent record of who you were at this moment. it's the foundation everything else in [us] is built on.",
  },
  {
    question: "who can see my data?",
    answer: "[us] maintains two portraits of every user: declared and observed.\n\nthe declared profile is what you tell [you]. it belongs to you — you can see it, correct it, and export it at any time.\n\nthe observed profile is what [you] notices across your behavior. it informs the match engine. for paid users, it becomes visible as pattern recognition — things you might want to know about yourself, offered with care.\n\nno third-party data brokers. no social scraping. no passive device tracking. no advertising. ever.",
  },
  {
    question: "what's the difference between free and paid?",
    answer: "matching is always free. your portrait is always free. the core experience is always free.\n\npaid unlocks the connection intelligence layer: pattern recognition across your connections, deeper coaching with [you], pre-meet preparation, post-connect debriefs, four additional match engine layers, and framework visibility — seeing exactly how [you] understands you and why you were matched with someone.\n\nhaving an NFT from the [us] portrait collection also unlocks paid features.",
  },
  {
    question: "how do I delete my account?",
    answer: "go to [profile] → scroll to the bottom → [delete account]. it's permanent and immediate. all your data is removed.\n\nbefore you do — you can export everything first. your portrait, declared profile, and journal entries are all exportable as JSON. your data belongs to you.",
  },
  {
    question: "what is OMARO?",
    answer: "OMARO PBC is a public benefit corporation — the parent entity behind [us]. PBC means the company is legally structured to pursue a public benefit alongside profit.\n\n[us] is a product of One Plus LLC, a wholly-owned subsidiary of OMARO PBC. the long-term vision includes OMARO Human Connection Institute — a nonprofit research arm dedicated to understanding what actually makes human connection work. the platform funds the research. the research belongs to everyone.",
  },
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
      marginBottom: "16px",
      opacity: 0.8,
    }}>
      {children}
    </div>
  )
}

function YouVoiceBlock({ text }: { text: string }) {
  return (
    <div style={{
      padding: "20px",
      borderRadius: "12px",
      background: "var(--bg2)",
      border: "1px solid var(--border)",
    }}>
      {text.split("\n\n").map((para, i) => (
        <p key={i} style={{
          fontSize: "13px",
          fontFamily: "var(--font-mono)",
          color: "var(--text)",
          fontWeight: 300,
          lineHeight: 1.8,
          margin: 0,
          marginBottom: i < text.split("\n\n").length - 1 ? "16px" : 0,
        }}>
          {para}
        </p>
      ))}
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      borderRadius: "10px",
      background: "var(--bg2)",
      border: `1px solid ${open ? "var(--amber)" : "var(--border)"}`,
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: "100%",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          gap: "12px",
          minHeight: "44px",
        }}
      >
        <span style={{
          fontSize: "13px",
          fontFamily: "var(--font-mono)",
          color: open ? "var(--amber)" : "var(--text)",
          fontWeight: 300,
          lineHeight: 1.5,
          transition: "color 0.2s",
        }}>
          {question}
        </span>
        <span style={{
          fontSize: "12px",
          fontFamily: "var(--font-mono)",
          color: "var(--dim)",
          flexShrink: 0,
          transition: "transform 0.2s",
          display: "inline-block",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
        }}>
          +
        </span>
      </button>

      {open && (
        <div style={{
          padding: "0 16px 16px",
          borderTop: "1px solid var(--border)",
          paddingTop: "14px",
        }}>
          {answer.split("\n\n").map((para, i) => (
            <p key={i} style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              color: "var(--muted)",
              fontWeight: 300,
              lineHeight: 1.8,
              margin: 0,
              marginBottom: i < answer.split("\n\n").length - 1 ? "12px" : 0,
            }}>
              {para}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function AboutPage({ embedded }: { embedded?: boolean } = {}) {
  const pathname = usePathname()
  const narration = useYouNarration(pathname)

  return (
    <div style={{ display: "flex", minHeight: embedded ? undefined : "100dvh", background: "var(--bg)" }}>
      {!embedded && <Sidebar />}
      <main style={{
        marginLeft: embedded ? 0 : "var(--sidebar-width)",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: embedded ? undefined : "100dvh",
      }}>
        <YouNarrationBanner narration={narration} />

        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px 40px",
          maxWidth: "1100px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "40px",
        }}>

          {/* Philosophy */}
          <section>
            <SectionLabel>[why [us] exists]</SectionLabel>
            <YouVoiceBlock text={PHILOSOPHY} />
          </section>

          {/* Mission */}
          <section>
            <SectionLabel>[what we're building]</SectionLabel>
            <YouVoiceBlock text={MISSION} />
          </section>

          {/* FAQs */}
          <section>
            <SectionLabel>[you might be wondering]</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {FAQS.map((faq) => (
                <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </section>

          {/* Footer */}
          <div style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--dim)",
            lineHeight: 1.7,
            paddingBottom: "40px",
          }}>
            [us] is a product of One Plus LLC, a subsidiary of OMARO PBC. sovereign by design.
          </div>

        </div>
      </main>
    </div>
  )
}

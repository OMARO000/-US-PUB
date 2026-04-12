"use client"

/**
 * /about — hybrid chat delivery with voice
 *
 * [them] delivers philosophy → mission → FAQs as typed bubbles.
 * After delivery completes, input bar + AmbientOrb appear for follow-up.
 * Re-delivers fresh on every mount (tab switch resets via key={activeThread}).
 */

import { useState, useEffect, useRef, useCallback } from "react"
import UView from "@/components/UView"

// ─────────────────────────────────────────────
// CONTENT
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
    question: "what does [u] actually do?",
    answer: "[u] is the presence at the center of [us]. not a chatbot, not a therapist. not an assistant. a mirror. and a reminder.\n\nduring intake, [u] listens without judgment and reflects back what it observes — not what it assumes. over time, [u] notices patterns across your connections and surfaces them with care.\n\n[u] is not trying to become the connection. it's trying to make connection between humans possible.",
  },
  {
    question: "how does matching work?",
    answer: "the match engine scores compatibility across seven layers: values, narrative, personality, relational style, communication style, cognitive patterns, and cosmological frameworks. each layer is weighted differently depending on whether you're looking for romantic, platonic, or professional connection.\n\nyou never see a score. you see resonance signals — specific observations about where two people align.\n\npaid users get four additional layers and can activate [go deeper] mode.",
  },
  {
    question: "what's the portrait?",
    answer: "at the end of your intake conversation, [them] generates a portrait — a written reflection of what emerged, plus a visual image chosen from a curated library based on your signal profile.\n\nthe portrait is yours. you can confirm it, correct it, or add to it. you can mint it as an NFT on Solana — a permanent record of who you were at this moment.",
  },
  {
    question: "who can see my data?",
    answer: "[us] maintains two portraits of every user: declared and observed.\n\nthe declared profile is what you tell [them]. it belongs to you — you can see it, correct it, and export it at any time.\n\nno third-party data brokers. no social scraping. no passive device tracking. no advertising. ever.",
  },
  {
    question: "what's the difference between free and paid?",
    answer: "matching is always free. your portrait is always free. the core experience is always free.\n\npaid unlocks the connection intelligence layer: pattern recognition, deeper coaching, pre-meet preparation, post-connect debriefs, four additional match engine layers, and framework visibility.",
  },
  {
    question: "how do I delete my account?",
    answer: "go to [profile] → scroll to the bottom → [delete account]. permanent and immediate. all your data is removed.\n\nbefore you do — you can export everything first. your portrait, declared profile, and journal entries are all exportable as JSON.",
  },
  {
    question: "what is OMARO?",
    answer: "OMARO PBC is a public benefit corporation — the parent entity behind [us]. PBC means the company is legally structured to pursue a public benefit alongside profit.\n\n[us] is a product of One Plus LLC, a wholly-owned subsidiary of OMARO PBC. the long-term vision includes OMARO Human Connection Institute — a nonprofit research arm dedicated to understanding what actually makes human connection work.",
  },
]

// ─────────────────────────────────────────────
// TYPING HOOK
// ─────────────────────────────────────────────

function useTypingText(text: string, active: boolean, speed = 12) {
  const [displayed, setDisplayed] = useState("")
  const [done, setDone] = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    if (!active || !text) return
    indexRef.current = 0
    setDisplayed("")
    setDone(false)
    const interval = setInterval(() => {
      if (indexRef.current >= text.length) {
        setDone(true)
        clearInterval(interval)
        return
      }
      setDisplayed(text.slice(0, indexRef.current + 1))
      indexRef.current += 1
    }, speed)
    return () => clearInterval(interval)
  }, [text, active, speed])

  return { displayed, done }
}

// ─────────────────────────────────────────────
// BUBBLE
// ─────────────────────────────────────────────

function ThemBubble({
  text,
  active,
  onDone,
  speed = 12,
  skipped = false,
}: {
  text: string
  active: boolean
  onDone: () => void
  speed?: number
  skipped?: boolean
}) {
  const { displayed, done } = useTypingText(text, active && !skipped, speed)

  useEffect(() => {
    if (done) onDone()
  }, [done, onDone])

  if (!skipped && !active && !displayed) return null

  return (
    <div style={{
      maxWidth: "85%",
      alignSelf: "flex-start",
      padding: "11px 15px",
      borderRadius: "15px 15px 15px 4px",
      background: "var(--bg2)",
      border: "1px solid var(--border)",
      fontSize: "13.5px",
      fontWeight: 300,
      lineHeight: 1.75,
      color: "var(--text)",
      fontFamily: "var(--font-mono)",
      whiteSpace: "pre-wrap",
    }}>
      {skipped ? text : displayed}
      {!skipped && !done && active && (
        <span style={{
          display: "inline-block",
          width: "7px",
          height: "14px",
          background: "var(--amber)",
          marginLeft: "2px",
          opacity: 0.7,
          animation: "blink 0.8s step-end infinite",
          verticalAlign: "text-bottom",
        }} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// FAQ BUBBLE
// ─────────────────────────────────────────────

function FAQBubble({ faq, visible }: { faq: typeof FAQS[0]; visible: boolean }) {
  const [open, setOpen] = useState(false)

  if (!visible) return null

  return (
    <div
      style={{
        borderRadius: "10px",
        background: "var(--bg2)",
        border: `1px solid ${open ? "var(--amber)" : "var(--border)"}`,
        overflow: "hidden",
        transition: "border-color 0.2s",
        animation: "fadeInUp 0.3s ease forwards",
      }}
    >
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          width: "100%",
          padding: "12px 14px",
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
          fontSize: "12px",
          fontFamily: "var(--font-mono)",
          color: open ? "var(--amber)" : "var(--text)",
          fontWeight: 300,
          lineHeight: 1.5,
          transition: "color 0.2s",
        }}>
          {faq.question}
        </span>
        <span style={{
          fontSize: "12px",
          fontFamily: "var(--font-mono)",
          color: "var(--dim)",
          flexShrink: 0,
          display: "inline-block",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
        }}>
          +
        </span>
      </button>
      {open && (
        <div style={{
          padding: "0 14px 14px",
          borderTop: "1px solid var(--border)",
          paddingTop: "12px",
        }}>
          {faq.answer.split("\n\n").map((para, i) => (
            <p key={i} style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--muted)",
              fontWeight: 300,
              lineHeight: 1.8,
              margin: 0,
              marginBottom: i < faq.answer.split("\n\n").length - 1 ? "10px" : 0,
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
// DELIVERY STAGES
// 0 = philosophy typing
// 1 = mission typing
// 2 = [u] explanation typing
// 3 = faq intro typing
// 4 = faqs visible + input unlocked
// ─────────────────────────────────────────────

const U_EXPLANATION = `[u] is a presence at the center of [us].

not a chatbot. not a therapist. not an assistant.

you can only build community through self-awareness — and that's what [u] is here for. it listens without judgment, reflects back what it observes, and helps you understand yourself well enough to find real connection.

Conversing with [u] starts with you. It proceeds with [us].

[u] is not trying to become the connection. it's trying to make connection between humans possible.

it starts with [u]. it proceeds with [us].`

const FAQ_INTRO = "you might be wondering..."

export default function AboutPage({ embedded }: { embedded?: boolean } = {}) {
  const [stage, setStage] = useState(0)
  const [skipped, setSkipped] = useState(false)
  const [messages, setMessages] = useState<{ role: "them" | "user"; content: string }[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [stage, messages])

  // ── speak response ──────────────────────────
  const speakResponse = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true)
      const res = await fetch("/api/intake/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(url)
      }
      audio.onerror = () => setIsSpeaking(false)
      await audio.play()
    } catch {
      setIsSpeaking(false)
    }
  }, [])

  // ── send to about ───────────────────────────
  const sendToAbout = useCallback(async (text: string) => {
    if (!text || isThinking) return
    setMessages((prev) => [...prev, { role: "user", content: text }])
    setIsThinking(true)

    try {
      const history = messages.map((m) => ({
        role: m.role === "them" ? "assistant" : "user" as "user" | "assistant",
        content: m.content,
      }))

      const res = await fetch("/api/threads/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: "about",
          threadType: "about",
          userId: typeof window !== "undefined" ? (localStorage.getItem("us_uid") ?? "anon") : "anon",
          message: text,
          history,
        }),
      })

      if (!res.ok || !res.body) throw new Error("chat failed")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ""

      setMessages((prev) => [...prev, { role: "them", content: "" }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "))
        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6))
            if (json.chunk) {
              fullResponse += json.chunk
              setMessages((prev) => {
                const last = [...prev]
                last[last.length - 1] = { role: "them", content: fullResponse }
                return last
              })
            }
          } catch { }
        }
      }

      if (fullResponse) {
        await speakResponse(fullResponse)
      }
    } catch {
      setMessages((prev) => [...prev, { role: "them", content: "something went wrong. try again." }])
    } finally {
      setIsThinking(false)
    }
  }, [isThinking, messages, speakResponse])

  // ── recording ──────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      audioChunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const form = new FormData()
        form.append("audio", blob, "voice.webm")
        try {
          const res = await fetch("/api/intake/transcribe", { method: "POST", body: form })
          if (!res.ok) return
          const { text } = await res.json()
          if (text?.trim()) sendToAbout(text.trim())
        } catch { }
      }
      mr.start()
      mediaRecorderRef.current = mr
      setIsRecording(true)
    } catch { }
  }, [sendToAbout])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  const handleOrbTap = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else if (!isThinking && !isSpeaking) {
      startRecording()
    }
  }, [isRecording, isThinking, isSpeaking, startRecording, stopRecording])

  const handleOrbRelease = useCallback(() => {
    if (isRecording) stopRecording()
  }, [isRecording, stopRecording])

  // ── stage callbacks ─────────────────────────
  const onPhilosophyDone    = useCallback(() => { setTimeout(() => setStage(1), 600) }, [])
  const onMissionDone       = useCallback(() => { setTimeout(() => setStage(2), 600) }, [])
  const onUExplanationDone  = useCallback(() => { setTimeout(() => setStage(3), 600) }, [])
  const onFaqIntroDone      = useCallback(() => { setTimeout(() => setStage(4), 400) }, [])


  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseDown={handleOrbTap}
      onMouseUp={handleOrbRelease}
      onMouseLeave={handleOrbRelease}
      onTouchStart={(e) => { e.preventDefault(); handleOrbTap() }}
      onTouchEnd={handleOrbRelease}
    >

      {/* Skip button — absolute top-right, only during delivery */}
      {stage < 4 && (
        <button
          onClick={() => { setSkipped(true); setStage(4) }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "16px",
            right: "20px",
            zIndex: 20,
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.06em",
            padding: "6px 10px",
            minHeight: "44px",
            color: "var(--muted)",
          }}
        >
          [skip →]
        </button>
      )}

      {/* message stream */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px 24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        scrollbarWidth: "none",
      }}>

        {/* philosophy */}
        <ThemBubble
          text={PHILOSOPHY}
          active={stage === 0}
          onDone={onPhilosophyDone}
          speed={10}
          skipped={skipped}
        />

        {/* mission */}
        {(stage >= 1 || skipped) && (
          <ThemBubble
            text={MISSION}
            active={stage === 1}
            onDone={onMissionDone}
            speed={10}
            skipped={skipped}
          />
        )}

        {/* [u] explanation */}
        {(stage >= 2 || skipped) && (
          <ThemBubble
            text={U_EXPLANATION}
            active={stage === 2}
            onDone={onUExplanationDone}
            speed={10}
            skipped={skipped}
          />
        )}

        {/* faq intro */}
        {(stage >= 3 || skipped) && (
          <ThemBubble
            text={FAQ_INTRO}
            active={stage === 3}
            onDone={onFaqIntroDone}
            speed={18}
            skipped={skipped}
          />
        )}

        {/* stage 4 — two-column: faqs + orb */}
        {stage >= 4 && (
          <div style={{
            display: "flex",
            gap: "24px",
            alignItems: "flex-start",
            width: "100%",
          }}>
            {/* faqs */}
            <div style={{
              flex: "0 0 58%",
              display: "flex",
              flexDirection: "column",
              gap: "7px",
            }}>
              {FAQS.map((faq) => (
                <FAQBubble key={faq.question} faq={faq} visible={stage >= 4} />
              ))}

              {/* footer */}
              {stage >= 4 && messages.length === 0 && (
                <div style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--dim)",
                  lineHeight: 1.7,
                  opacity: 0.5,
                  marginTop: "8px",
                }}>
                  [us] | ONE PLUS LLC | Governed by OMARO Public Benefit Corporation.
                </div>
              )}
            </div>

            {/* UView — right column */}
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              position: "sticky", top: "0",
              overflow: "hidden",
            }}>
              <UView
                tab="about"
                paddingTop="0"
                scale={1.5}
                onSendText={sendToAbout}
                onHoldStart={startRecording}
                onHoldEnd={stopRecording}
                isListening={isRecording}
              />
            </div>
          </div>
        )}

        {/* follow-up messages */}
        {messages.map((msg, i) => (
          <div key={i} style={{
            maxWidth: "75%",
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            padding: "11px 15px",
            borderRadius: msg.role === "them" ? "15px 15px 15px 4px" : "15px 15px 4px 15px",
            background: msg.role === "them" ? "var(--bg2)" : "var(--bg3)",
            border: `1px solid ${msg.role === "them" ? "var(--border)" : "var(--border2)"}`,
            fontSize: "13.5px",
            fontWeight: 300,
            lineHeight: 1.65,
            color: "var(--text)",
            fontFamily: "var(--font-mono)",
            whiteSpace: "pre-wrap",
          }}>
            {msg.content}
            {msg.role === "them" && isThinking && i === messages.length - 1 && !msg.content && (
              <span style={{
                display: "inline-block", width: "7px", height: "14px",
                background: "var(--amber)", opacity: 0.7,
                animation: "blink 0.8s step-end infinite",
                verticalAlign: "text-bottom", marginLeft: "2px",
              }} />
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>


      <style>{`
        @keyframes blink { 0%, 100% { opacity: 0.7; } 50% { opacity: 0; } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes abtpulse { 0%,100%{opacity:0.12} 50%{opacity:0.8} }
        .abt-dot-1 { animation: abtpulse 1.6s ease-in-out infinite 0s; }
        .abt-dot-2 { animation: abtpulse 1.6s ease-in-out infinite 0.22s; }
        .abt-dot-3 { animation: abtpulse 1.6s ease-in-out infinite 0.44s; }
      `}</style>
    </div>
  )
}

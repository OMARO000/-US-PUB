"use client"

/**
 * /onboarding — 4-step account creation flow
 *
 * Welcome → Cookies(1) → Theme(2) → Voice(3) → Tier(4) → /conversation
 */

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type Screen = "welcome" | "cookies" | "theme" | "voice" | "tier"

interface Theme {
  id: string
  label: string
  bg: string
  bg2: string
  text: string
  amber: string
  rose: string
}

interface Voice {
  voice_id: string
  name: string
  labels?: Record<string, string>
  preview_url?: string
}

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────

const THEMES: Theme[] = [
  { id: "light",    label: "[light]",    bg: "#F5F2EE", bg2: "#EDEAE5", text: "rgba(28,24,20,0.88)",   amber: "#A67C3A", rose: "#A85860" },
  { id: "charcoal", label: "[charcoal]", bg: "#1C1C1E", bg2: "#242426", text: "rgba(255,255,255,0.88)", amber: "#C4974A", rose: "#C4848A" },
]

const TIERS = [
  { id: "open",      label: "[open]",      price: "free",    desc: "core conversation, matching, portrait",                             comingSoon: false },
  { id: "shared",    label: "[shared]",    price: "$10/mo",  desc: "pattern recognition, deeper coaching, 4 additional match layers",   comingSoon: true },
  { id: "sovereign", label: "[sovereign]", price: "$20/mo",  desc: "full intelligence layer, framework visibility, priority support",    comingSoon: true },
]

const SCREEN_STEP: Partial<Record<Screen, number>> = {
  cookies: 1, theme: 2, voice: 3, tier: 4,
}

const PREV_SCREEN: Partial<Record<Screen, Screen>> = {
  theme: "cookies", voice: "theme", tier: "voice",
}

// ─────────────────────────────────────────────
// STEP INDICATOR
// ─────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center" }}>
      {[1, 2, 3, 4].map((n) => (
        <span key={n} style={{
          fontFamily: "IBM Plex Mono, monospace",
          fontSize: "10px",
          color: n <= step ? "#C4974A" : "rgba(255,255,255,0.25)",
        }}>
          {n <= step ? "●" : "○"}
        </span>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// SCREEN 1 — WELCOME
// ─────────────────────────────────────────────

function WelcomeScreen({ onNext, onLogin }: { onNext: () => void; onLogin: () => void }) {
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100dvh",
      padding: "40px 32px",
      gap: "56px",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.8s ease",
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        maxWidth: "560px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "72px", fontFamily: "var(--font-sans)", color: "var(--amber)", fontWeight: 300, letterSpacing: "-1px", lineHeight: 1 }}>
          [us]
        </div>
        <div style={{ fontSize: "22px", fontFamily: "var(--font-mono)", color: "var(--text)", fontWeight: 300, lineHeight: 1.9 }}>
          connection is hard.
        </div>
        <div style={{ fontSize: "18px", fontFamily: "var(--font-mono)", color: "var(--muted)", fontWeight: 300, lineHeight: 1.9 }}>
          not because the right people don't exist —<br />
          but because most of us don't know ourselves<br />
          well enough to recognize them.
        </div>
        <div style={{ fontSize: "18px", fontFamily: "var(--font-mono)", color: "var(--text)", fontWeight: 300, lineHeight: 1.9, marginTop: "8px" }}>
          [us] is built to change that.
        </div>
        <div style={{ fontSize: "14px", fontFamily: "var(--font-mono)", color: "var(--muted)", fontWeight: 300, lineHeight: 1.7, opacity: 0.6, marginTop: "8px" }}>
          no profile to fill out.<br />
          no performance required.<br />
          just a conversation.
        </div>
      </div>

      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        maxWidth: "280px",
      }}>
        <button
          onClick={() => router.push("/conversation")}
          aria-label="try it out"
          style={{
            width: "100%", height: "64px", borderRadius: "16px",
            background: "var(--amber)", border: "none",
            fontFamily: "var(--font-mono)", fontSize: "16px",
            color: "var(--bg)", cursor: "pointer", letterSpacing: "0.05em", fontWeight: 400,
          }}
        >
          [try it out]
        </button>
        <button
          onClick={() => router.push("/login")}
          aria-label="log in"
          style={{
            width: "100%", height: "64px", borderRadius: "16px",
            background: "var(--amber)", border: "none",
            fontFamily: "var(--font-mono)", fontSize: "16px",
            color: "var(--bg)", cursor: "pointer", letterSpacing: "0.05em", fontWeight: 400,
          }}
        >
          [log in]
        </button>
        <button
          onClick={onNext}
          aria-label="create account"
          style={{
            width: "100%", height: "64px", borderRadius: "16px",
            background: "transparent",
            border: "1px solid rgba(196,151,74,0.4)",
            fontFamily: "var(--font-mono)", fontSize: "16px",
            color: "#C4974A", cursor: "pointer", letterSpacing: "0.05em", fontWeight: 400,
          }}
        >
          [create account]
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 1 — COOKIE CONSENT
// ─────────────────────────────────────────────

function CookiesScreen({ onAccept }: { onAccept: () => void }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100dvh",
      padding: "40px 32px",
      gap: "48px",
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        maxWidth: "520px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--amber)", letterSpacing: "0.08em", opacity: 0.8 }}>
          [before we begin]
        </div>
        <div style={{ fontSize: "18px", fontFamily: "var(--font-mono)", color: "var(--text)", fontWeight: 300, lineHeight: 1.85 }}>
          [us] uses essential cookies to function. nothing more.
        </div>
        <div style={{ fontSize: "14px", fontFamily: "var(--font-mono)", color: "var(--muted)", fontWeight: 300, lineHeight: 1.8 }}>
          we don't track you across the web.<br />
          we don't serve ads.<br />
          we don't sell your data to anyone, ever.<br /><br />
          cookies here are used only to keep your session alive
          and remember your preferences — theme, voice, and whether
          you've been here before.<br /><br />
          that's it. sovereign by design.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "360px", marginTop: "8px" }}>
          <button
            onClick={() => {
              localStorage.setItem("us_cookies_accepted", "true")
              onAccept()
            }}
            style={{
              height: "64px", borderRadius: "16px", background: "var(--amber)",
              border: "none", fontFamily: "var(--font-mono)", fontSize: "16px",
              color: "var(--bg)", cursor: "pointer", letterSpacing: "0.05em", fontWeight: 400,
            }}
          >
            [i understand]
          </button>
          <a
            href="/privacy"
            style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--muted)", textDecoration: "none", letterSpacing: "0.04em", opacity: 0.6, textAlign: "center" }}
          >
            [read our full privacy policy →]
          </a>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 2 — THEME PICKER
// ─────────────────────────────────────────────

function ThemeScreen({
  selectedTheme,
  onSelect,
  onNext,
}: {
  selectedTheme: string
  onSelect: (id: string) => void
  onNext: () => void
}) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100dvh",
      padding: "40px 32px",
      gap: "52px",
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", textAlign: "center" }}>
        <div style={{ fontSize: "18px", fontFamily: "var(--font-mono)", color: "var(--amber)", letterSpacing: "0.08em", opacity: 0.8 }}>
          [choose your environment]
        </div>
        <div style={{ fontSize: "15px", fontFamily: "var(--font-mono)", color: "var(--muted)", fontWeight: 300 }}>
          you can change this anytime in [settings]
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "480px" }}>
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onSelect(theme.id)}
            aria-label={`select ${theme.label} theme`}
            aria-pressed={selectedTheme === theme.id}
            style={{
              display: "flex", alignItems: "center", gap: "16px",
              padding: "18px 20px", borderRadius: "16px", background: theme.bg2,
              border: `1.5px solid ${selectedTheme === theme.id ? theme.amber : "rgba(255,255,255,0.08)"}`,
              cursor: "pointer", transition: "border-color 0.15s",
            }}
          >
            <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
              <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: theme.bg }} />
              <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: theme.amber }} />
              <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: theme.rose }} />
            </div>
            <span style={{ fontSize: "15px", fontFamily: "var(--font-mono)", color: selectedTheme === theme.id ? theme.amber : theme.text, letterSpacing: "0.03em" }}>
              {theme.label}
            </span>
            {selectedTheme === theme.id && (
              <span style={{ marginLeft: "auto", fontSize: "12px", fontFamily: "var(--font-mono)", color: theme.amber, opacity: 0.8 }}>
                [selected]
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={onNext}
        aria-label="continue to voice selection"
        style={{
          height: "64px", padding: "0 52px", borderRadius: "16px", background: "var(--amber)",
          border: "none", fontFamily: "var(--font-mono)", fontSize: "16px",
          color: "var(--bg)", cursor: "pointer", letterSpacing: "0.05em",
        }}
      >
        [continue]
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 3 — VOICE PICKER
// ─────────────────────────────────────────────

function VoiceScreen({
  selectedVoice,
  onSelect,
  onComplete,
}: {
  selectedVoice: string
  onSelect: (id: string) => void
  onComplete: () => void
}) {
  const [voices, setVoices] = useState<Voice[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.onended = () => setPlaying(null)
    return () => audioRef.current?.pause()
  }, [])

  useEffect(() => {
    fetch("/api/voices")
      .then((r) => r.json())
      .then((data) => { setVoices(data.voices ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = voices.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  )

  const playPreview = async (voice: Voice) => {
    if (!voice.preview_url || !audioRef.current) return
    if (playing === voice.voice_id) {
      audioRef.current.pause()
      setPlaying(null)
      return
    }
    audioRef.current.src = voice.preview_url
    await audioRef.current.play()
    setPlaying(voice.voice_id)
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      minHeight: "100dvh", padding: "40px 32px 32px", gap: "32px",
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", textAlign: "center" }}>
        <div style={{ fontSize: "18px", fontFamily: "var(--font-mono)", color: "var(--amber)", letterSpacing: "0.08em", opacity: 0.8 }}>
          [choose [u]'s voice]
        </div>
        <div style={{ fontSize: "15px", fontFamily: "var(--font-mono)", color: "var(--muted)", fontWeight: 300 }}>
          this is how [u] will speak to you
        </div>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="[search voices...]"
        aria-label="search voices"
        style={{
          width: "100%", maxWidth: "480px", padding: "13px 18px",
          borderRadius: "13px", background: "var(--bg2)",
          border: "1px solid var(--border)", outline: "none",
          fontFamily: "var(--font-mono)", fontSize: "15px",
          color: "var(--text)", fontWeight: 300,
        }}
      />

      <div style={{
        width: "100%", maxWidth: "480px", flex: 1, overflowY: "auto",
        display: "flex", flexDirection: "column", gap: "10px",
        maxHeight: "calc(100dvh - 320px)",
      }}>
        {loading && (
          <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--dim)", textAlign: "center", padding: "20px" }}>
            [loading voices...]
          </div>
        )}
        {!loading && filtered.map((voice) => (
          <div
            key={voice.voice_id}
            onClick={() => onSelect(voice.voice_id)}
            style={{
              display: "flex", alignItems: "center", gap: "16px",
              padding: "16px 18px", borderRadius: "13px", background: "var(--bg2)",
              border: `1px solid ${selectedVoice === voice.voice_id ? "var(--amber)" : "var(--border)"}`,
              cursor: "pointer", transition: "border-color 0.15s",
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); playPreview(voice) }}
              aria-label={`preview ${voice.name}`}
              style={{
                width: "40px", height: "40px", borderRadius: "10px",
                background: playing === voice.voice_id ? "var(--amber)" : "var(--bg3)",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                color: playing === voice.voice_id ? "var(--bg)" : "var(--muted)",
                fontSize: "13px", fontFamily: "var(--font-mono)",
              }}
            >
              {playing === voice.voice_id ? "■" : "▶"}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: "15px", fontFamily: "var(--font-mono)",
                color: selectedVoice === voice.voice_id ? "var(--amber)" : "var(--text)",
                fontWeight: selectedVoice === voice.voice_id ? 400 : 300,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {voice.name}
              </div>
              {voice.labels?.accent && (
                <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--dim)", marginTop: "2px" }}>
                  {voice.labels.accent}
                </div>
              )}
            </div>
            {selectedVoice === voice.voice_id && (
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--amber)", opacity: 0.8, flexShrink: 0 }}>
                [selected]
              </span>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onComplete}
        aria-label="continue to tier selection"
        style={{
          width: "100%", maxWidth: "480px", height: "64px", borderRadius: "16px",
          background: "var(--amber)", border: "none", fontFamily: "var(--font-mono)",
          fontSize: "16px", color: "var(--bg)", cursor: "pointer",
          letterSpacing: "0.05em", flexShrink: 0,
        }}
      >
        [continue]
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 4 — TIER
// ─────────────────────────────────────────────

function TierScreen({
  selectedTier,
  onSelect,
  onComplete,
}: {
  selectedTier: string
  onSelect: (id: string) => void
  onComplete: () => void
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "100dvh", padding: "40px 32px", gap: "52px",
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", textAlign: "center" }}>
        <div style={{ fontSize: "18px", fontFamily: "var(--font-mono)", color: "var(--amber)", letterSpacing: "0.08em", opacity: 0.8 }}>
          [choose your tier]
        </div>
        <div style={{ fontSize: "15px", fontFamily: "var(--font-mono)", color: "var(--muted)", fontWeight: 300 }}>
          you can upgrade anytime
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "480px" }}>
        {TIERS.map((tier) => (
          <button
            key={tier.id}
            onClick={() => !tier.comingSoon && onSelect(tier.id)}
            disabled={tier.comingSoon}
            aria-label={`select ${tier.label} tier`}
            aria-pressed={selectedTier === tier.id}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 20px", borderRadius: "16px", background: "var(--bg2)",
              border: `1.5px solid ${selectedTier === tier.id ? "#C4974A" : "rgba(255,255,255,0.08)"}`,
              cursor: tier.comingSoon ? "default" : "pointer",
              opacity: tier.comingSoon ? 0.5 : 1,
              transition: "border-color 0.15s",
              textAlign: "left",
            }}
          >
            <div>
              <div style={{ fontSize: "15px", fontFamily: "var(--font-mono)", color: selectedTier === tier.id ? "#C4974A" : "var(--text)", letterSpacing: "0.03em" }}>
                {tier.label}
              </div>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--dim)", marginTop: "4px", fontWeight: 300 }}>
                {tier.desc}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0, marginLeft: "16px" }}>
              <span style={{ fontSize: "14px", fontFamily: "var(--font-mono)", color: "var(--muted)", fontWeight: 300 }}>
                {tier.price}
              </span>
              {tier.comingSoon && (
                <span style={{ fontSize: "9px", fontFamily: "var(--font-mono)", color: "#C4974A", opacity: 0.6, letterSpacing: "0.06em" }}>
                  [coming soon]
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onComplete}
        aria-label="create my account"
        style={{
          height: "64px", padding: "0 52px", borderRadius: "16px", background: "#C4974A",
          border: "none", fontFamily: "var(--font-mono)", fontSize: "16px",
          color: "var(--bg)", cursor: "pointer", letterSpacing: "0.05em",
        }}
      >
        [create my account]
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>("welcome")
  const [selectedTheme, setSelectedTheme] = useState("charcoal")
  const [selectedVoice, setSelectedVoice] = useState(
    process.env.NEXT_PUBLIC_DEFAULT_VOICE_ID ?? "UgBBYS2sOqTuMpoF3BR0"
  )
  const [selectedTier, setSelectedTier] = useState("open")

  useEffect(() => {
    if (typeof window === "undefined") return
    if (localStorage.getItem("us_onboarded") === "true") router.replace("/conversation")
    const savedTheme = localStorage.getItem("us-theme")
    if (savedTheme) setSelectedTheme(savedTheme)
  }, [router])

  const handleThemeSelect = (id: string) => {
    setSelectedTheme(id)
    if (typeof window !== "undefined") {
      localStorage.setItem("us-theme", id)
      document.documentElement.setAttribute("data-theme", id)
    }
  }

  const handleCreateAccount = async () => {
    const accountNumber = "US-" + Math.random().toString(36).substring(2, 10).toUpperCase()
    document.cookie = `us_account=${accountNumber}; max-age=31536000; path=/`
    document.cookie = `us_theme=${selectedTheme}; max-age=31536000; path=/`
    document.cookie = `us_voice=${selectedVoice}; max-age=31536000; path=/`
    document.cookie = `us_tier=${selectedTier}; max-age=31536000; path=/`

    if (typeof window !== "undefined") {
      localStorage.setItem("us_onboarded", "true")
      localStorage.setItem("us-theme", selectedTheme)
      localStorage.setItem("us_voice_id", selectedVoice)
      localStorage.setItem("us_account_number", accountNumber)
      localStorage.setItem("us_tier", selectedTier)

      try {
        await fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: localStorage.getItem("us_uid"),
            themeId: selectedTheme,
            voiceId: selectedVoice,
          }),
        })
      } catch { }
    }

    router.push("/conversation")
  }

  const handleLogin = () => {
    if (typeof window !== "undefined") localStorage.setItem("us_onboarded", "true")
    router.push("/conversation")
  }

  const currentStep = SCREEN_STEP[screen]

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", position: "relative" }}>
      {/* Step indicator + back button */}
      {currentStep && (
        <div style={{
          position: "absolute", top: "20px", left: 0, right: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 10,
        }}>
          {currentStep > 1 && (
            <button
              onClick={() => setScreen(PREV_SCREEN[screen]!)}
              style={{
                position: "absolute", left: "24px",
                background: "transparent", border: "none",
                fontFamily: "IBM Plex Mono, monospace", fontSize: "12px",
                color: "rgba(255,255,255,0.4)", cursor: "pointer", letterSpacing: "0.04em",
              }}
            >
              ← [back]
            </button>
          )}
          <StepIndicator step={currentStep} />
        </div>
      )}

      {screen === "welcome" && (
        <WelcomeScreen onNext={() => setScreen("cookies")} onLogin={handleLogin} />
      )}
      {screen === "cookies" && (
        <CookiesScreen onAccept={() => setScreen("theme")} />
      )}
      {screen === "theme" && (
        <ThemeScreen
          selectedTheme={selectedTheme}
          onSelect={handleThemeSelect}
          onNext={() => setScreen("voice")}
        />
      )}
      {screen === "voice" && (
        <VoiceScreen
          selectedVoice={selectedVoice}
          onSelect={setSelectedVoice}
          onComplete={() => setScreen("tier")}
        />
      )}
      {screen === "tier" && (
        <TierScreen
          selectedTier={selectedTier}
          onSelect={setSelectedTier}
          onComplete={handleCreateAccount}
        />
      )}
    </div>
  )
}

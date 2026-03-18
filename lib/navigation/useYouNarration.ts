"use client"

/**
 * useYouNarration
 *
 * Triggers a [u] narration whenever the user navigates to a new section.
 * Each route has a set of narration prompts — [u] picks one and streams it.
 * The narration is contextual: it references what [u] knows about the user.
 *
 * Used in each page's layout — fires on mount, not on every render.
 */

import { useState, useEffect, useCallback, useRef } from "react"

export interface NarrationState {
  message: string | null
  isStreaming: boolean
  dismiss: () => void
}

// ─────────────────────────────────────────────
// ROUTE NARRATION PROMPTS
// Each route has a system prompt that tells [u] what to say.
// [u] should be brief — 1–3 sentences max.
// Reference what's actually there, not generic descriptions.
// ─────────────────────────────────────────────

const ROUTE_PROMPTS: Record<string, string> = {
  "/conversation": `
The user has navigated to their conversation.
Greet them briefly and naturally — like picking up where you left off.
If there are messages waiting, acknowledge that. If it's fresh, invite them in.
1–2 sentences. No performance.
  `.trim(),

  "/connections": `
The user has navigated to their connections.
Tell them what's here — who they've been matched with, anything new or waiting.
If nothing is here yet, be honest about that and invite them to complete their portrait first.
1–2 sentences. Direct.
  `.trim(),

  "/insights": `
The user has navigated to their insights.
This is where patterns live — things [u] has noticed across their connections and conversation.
Orient them briefly: what's visible here, and what it's for.
1–2 sentences. Thoughtful, not clinical.
  `.trim(),

  "/journal": `
The user has navigated to their journal.
This is their private space. [u] can see it only with their consent.
Welcome them quietly. Don't overstay.
1 sentence. Warm, brief.
  `.trim(),

  "/profile": `
The user has navigated to their profile.
This is their portrait — what [u] has observed and what they've declared.
Tell them what they can do here: see their portrait, correct it, understand the frameworks behind it.
1–2 sentences.
  `.trim(),

  "/settings": `
The user has navigated to settings.
Brief acknowledgment. Tell them what they can adjust here.
1 sentence. Functional, not warm — this is a utility space.
  `.trim(),

  "/about": `
The user has navigated to the about page.
Tell them what's here — the philosophy behind [us], what you are, and answers to things people often wonder about.
Invite them to explore. Keep it brief.
1–2 sentences.
  `.trim(),
}

const IDENTITY_PREFIX = `
You are [u] — a presence within [us], a human connection platform.
You are warm, low, unhurried. You are not an assistant. You are a mirror.
You speak in short, natural sentences. No bullet points. No lists. No headers.
Bracket language when referencing UI: [conversation], [insights], [journal], etc.
Keep your response to 1–3 sentences maximum.
`.trim()

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

export function useYouNarration(route: string): NarrationState {
  const [message, setMessage] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const sessionIdRef = useRef<string | null>(null)
  const firedRef = useRef<string | null>(null)

  const dismiss = useCallback(() => {
    setMessage(null)
    setIsStreaming(false)
  }, [])

  const narrate = useCallback(async (route: string) => {
    const prompt = ROUTE_PROMPTS[route]
    if (!prompt) return

    setIsStreaming(true)
    setMessage("")

    try {
      const res = await fetch("/api/intake/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current ?? "narration",
          message: prompt,
          inputMode: "text",
          narrationMode: true,
          systemOverride: `${IDENTITY_PREFIX}\n\n${prompt}`,
        }),
      })

      if (!res.ok || !res.body) {
        setIsStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split("\n").filter((l) => l.startsWith("data: "))

        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6))
            if (json.chunk) {
              full += json.chunk
              setMessage(full)
            }
            if (json.done) break
          } catch {
            // skip malformed
          }
        }
      }

      setIsStreaming(false)
    } catch {
      setIsStreaming(false)
      setMessage(null)
    }
  }, [])

  useEffect(() => {
    // get session id from localStorage
    if (typeof window !== "undefined") {
      const uid = localStorage.getItem("us_uid")
      sessionIdRef.current = uid
    }

    // only fire once per route mount
    if (firedRef.current === route) return
    firedRef.current = route

    // small delay so page renders first
    const timer = setTimeout(() => narrate(route), 400)
    return () => clearTimeout(timer)
  }, [route, narrate])

  return { message, isStreaming, dismiss }
}

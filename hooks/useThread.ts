"use client"

/**
 * useThread
 *
 * Manages state for a single [you] thread.
 * Each thread is a persistent conversation with [you] scoped to a topic.
 *
 * - New thread: [you] opens with a short prompt
 * - Returning thread: silent, shows history
 * - Messages persist to DB via /api/threads
 *
 * NOTE: viewMode ([chat]/[page]) is intentionally removed from this hook.
 * It is managed exclusively in ConversationPage to avoid localStorage race
 * conditions. viewMode always defaults to "chat" unless user explicitly toggles.
 */

import { useState, useEffect, useCallback, useRef } from "react"
import type { ThreadType } from "@/lib/threads/threadPrompts"
import { getThreadConfig } from "@/lib/threads/threadPrompts"

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface ThreadMessage {
  id: string
  role: "you" | "user"
  content: string
  createdAt: Date
  metadata?: Record<string, string> // for MATCH_CARD, SETTING_UPDATE etc
}

export interface UseThreadReturn {
  messages: ThreadMessage[]
  isStreaming: boolean
  isNew: boolean
  sendMessage: (text: string) => Promise<void>
  threadId: string | null
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function parseSpecialCommands(content: string): {
  cleanContent: string
  metadata: Record<string, string>
} {
  const metadata: Record<string, string> = {}
  let cleanContent = content

  // MATCH_CARD:{matchId}
  const matchCard = content.match(/MATCH_CARD:([^\s]+)/)
  if (matchCard) {
    metadata.matchCard = matchCard[1]
    cleanContent = cleanContent.replace(/MATCH_CARD:[^\s]+/, "").trim()
  }

  // SETTING_UPDATE:{key}:{value}
  const settingUpdate = content.match(/SETTING_UPDATE:([^:]+):([^\s]+)/)
  if (settingUpdate) {
    metadata.settingKey = settingUpdate[1]
    metadata.settingValue = settingUpdate[2]
    cleanContent = cleanContent.replace(/SETTING_UPDATE:[^:]+:[^\s]+/, "").trim()
  }

  return { cleanContent, metadata }
}

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

export function useThread(
  threadType: ThreadType,
  userId: string | null
): UseThreadReturn {
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [threadId, setThreadId] = useState<string | null>(null)
  const initialized = useRef(false)

  const config = getThreadConfig(threadType)

  // ── initialize thread ──
  useEffect(() => {
    if (!userId || initialized.current) return
    initialized.current = true

    const initThread = async () => {
      try {
        const res = await fetch(`/api/threads?userId=${encodeURIComponent(userId)}&type=${threadType}`)
        const data = await res.json()

        if (data.thread && data.messages?.length > 0) {
          // returning thread — silent
          setThreadId(data.thread.id)
          setMessages(data.messages.map((m: {
            id: string
            role: string
            content: string
            createdAt: string
            metadata?: Record<string, string>
          }) => ({
            id: m.id,
            role: m.role as "you" | "user",
            content: m.content,
            createdAt: new Date(m.createdAt),
            metadata: m.metadata,
          })))
          setIsNew(false)
        } else {
          // new thread — [you] opens with prompt
          setThreadId(data.thread?.id ?? null)
          setIsNew(true)

          if (config.openingPrompt && threadType !== "conversation") {
            const openingMsg: ThreadMessage = {
              id: `opening-${Date.now()}`,
              role: "you",
              content: config.openingPrompt,
              createdAt: new Date(),
            }
            setMessages([openingMsg])

            // persist opening message
            if (data.thread?.id) {
              await fetch("/api/threads/message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  threadId: data.thread.id,
                  role: "you",
                  content: config.openingPrompt,
                }),
              }).catch(() => {})
            }
          }
        }
      } catch {
        setIsNew(true)
      }
    }

    initThread()
  }, [userId, threadType, config.openingPrompt])

  // ── send message ──
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !userId) return

    const userMsg: ThreadMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setIsStreaming(true)

    // persist user message
    if (threadId) {
      await fetch("/api/threads/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          role: "user",
          content: text.trim(),
        }),
      }).catch(() => {})
    }

    try {
      const res = await fetch("/api/threads/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          threadType,
          userId,
          message: text.trim(),
          history: messages.slice(-10).map((m) => ({
            role: m.role === "you" ? "assistant" : "user",
            content: m.content,
          })),
        }),
      })

      if (!res.ok || !res.body) {
        setIsStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ""
      const msgId = `you-${Date.now()}`

      setMessages((prev) => [...prev, {
        id: msgId,
        role: "you",
        content: "",
        createdAt: new Date(),
      }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "))

        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6))
            if (json.chunk) {
              full += json.chunk
              setMessages((prev) => prev.map((m) =>
                m.id === msgId ? { ...m, content: full } : m
              ))
            }
          } catch { /* skip */ }
        }
      }

      // parse special commands from full response
      const { cleanContent, metadata } = parseSpecialCommands(full)

      setMessages((prev) => prev.map((m) =>
        m.id === msgId ? { ...m, content: cleanContent, metadata } : m
      ))

      // persist [you] response
      if (threadId) {
        await fetch("/api/threads/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            threadId,
            role: "you",
            content: cleanContent,
            metadata,
          }),
        }).catch(() => {})
      }

      setIsStreaming(false)
    } catch {
      setIsStreaming(false)
    }
  }, [userId, threadId, threadType, messages])

  return {
    messages,
    isStreaming,
    isNew,
    sendMessage,
    threadId,
  }
}

"use client"
/**
 * useIntake — client-side intake conversation hook
 *
 * Manages:
 * - Session initialization (POST /api/intake/session)
 * - Sending messages (POST /api/intake/chat, SSE stream)
 * - STT: recording → /api/intake/transcribe → transcript
 * - TTS: [them] response → /api/intake/speak → audio playback
 * - Block state + advancement signals
 * - Rephrase requests
 * - Session completion
 */
import { useState, useRef, useCallback, useEffect } from "react"

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
export type InputMode = "voice" | "text"
export type SessionStatus = "idle" | "initializing" | "active" | "completed" | "error"
export type OrbState = "idle" | "recording" | "thinking" | "speaking"

export interface Message {
  id: string
  role: "them" | "user"
  content: string
  inputMode?: InputMode
}

export interface UseIntakeReturn {
  // state
  status: SessionStatus
  orbState: OrbState
  messages: Message[]
  currentBlock: number
  arrivalStatement: string | null
  isRecording: boolean
  isThinking: boolean
  isSpeaking: boolean
  rephrases: [string, string, string] | null
  sessionComplete: boolean
  error: string | null
  // actions
  startRecording: () => void
  stopRecording: () => void
  sendText: (text: string) => void
  requestRephrase: () => void
  selectRephrase: (text: string) => void
  acceptBlock4: () => void
  init: (userId: string) => void
}

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────
export function useIntake(): UseIntakeReturn {
  const [status, setStatus] = useState<SessionStatus>("idle")
  const [orbState, setOrbState] = useState<OrbState>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [currentBlock, setCurrentBlock] = useState(1)
  const [arrivalStatement, setArrivalStatement] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [rephrases, setRephrases] = useState<[string, string, string] | null>(null)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sessionIdRef = useRef<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const block4AcceptedRef = useRef(false)

  // ── audio element setup ──
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.onended = () => {
      setIsSpeaking(false)
      setOrbState("idle")
    }
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  // ── initialize session ──
  const init = useCallback(async (userId: string) => {
    setStatus("initializing")
    setOrbState("idle")
    try {
      const res = await fetch("/api/intake/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) throw new Error("session init failed")
      const data = await res.json()
      sessionIdRef.current = data.sessionId
      setArrivalStatement(data.arrivalStatement)
      setCurrentBlock(data.currentBlock)
      setStatus("active")
      // speak arrival statement
      await speakText(data.arrivalStatement)
      addMessage({ role: "them", content: data.arrivalStatement })
    } catch (err) {
      console.error("[us] init error:", err)
      setError("something went wrong. please try again.")
      setStatus("error")
    }
  }, [])

  // ── add message to local state ──
  const addMessage = useCallback((msg: Omit<Message, "id">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `${Date.now()}-${Math.random()}` },
    ])
  }, [])

  // ── speak text via ElevenLabs ──
  const speakText = useCallback(async (text: string) => {
    if (!audioRef.current) return
    setIsSpeaking(true)
    setOrbState("speaking")
    try {
      const res = await fetch("/api/intake/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) {
        setIsSpeaking(false)
        setOrbState("idle")
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      audioRef.current.src = url
      await audioRef.current.play()
    } catch {
      setIsSpeaking(false)
      setOrbState("idle")
    }
  }, [])

  // ── send message to [them] ──
  const sendMessage = useCallback(
    async (
      text: string,
      inputMode: InputMode,
      audioDurationMs?: number,
      block4Accept?: boolean
    ) => {
      if (!sessionIdRef.current || status !== "active") return
      addMessage({ role: "user", content: text, inputMode })
      setIsThinking(true)
      setOrbState("thinking")
      setRephrases(null)

      let fullResponse = ""
      try {
        const res = await fetch("/api/intake/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            message: text,
            inputMode,
            audioDurationMs,
            block4Accept,
          }),
        })
        if (!res.ok || !res.body) throw new Error("chat request failed")

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        const msgId = `them-${Date.now()}`

        // add empty [them] message to stream into
        setMessages((prev) => [
          ...prev,
          { id: msgId, role: "them", content: "" },
        ])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const text = decoder.decode(value)
          const lines = text.split("\n").filter((l) => l.startsWith("data: "))
          for (const line of lines) {
            try {
              const json = JSON.parse(line.slice(6))
              if (json.chunk) {
                fullResponse += json.chunk
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === msgId ? { ...m, content: fullResponse } : m
                  )
                )
              }
              if (json.blockComplete) {
                setCurrentBlock(json.nextBlock)
              }
              if (json.sessionComplete) {
                setSessionComplete(true)
                setStatus("completed")
              }
            } catch {
              // malformed chunk — skip
            }
          }
        }

        setIsThinking(false)
        // speak the full response
        if (fullResponse && status !== "completed") {
          await speakText(fullResponse)
        } else {
          setOrbState("idle")
        }
      } catch (err) {
        console.error("[us] sendMessage error:", err)
        setIsThinking(false)
        setOrbState("idle")
      }
    },
    [status, addMessage, speakText]
  )

  // ── start recording ──
  const startRecording = useCallback(async () => {
    if (isRecording) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
      audioChunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        stream.getTracks().forEach((t) => t.stop())
        await transcribeAndSend(blob)
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setOrbState("recording")
    } catch {
      setError("microphone access denied.")
    }
  }, [isRecording])

  // ── stop recording ──
  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) return
    mediaRecorderRef.current.stop()
    setIsRecording(false)
    setOrbState("thinking")
  }, [isRecording])

  // ── transcribe audio + send ──
  const transcribeAndSend = useCallback(
    async (blob: Blob) => {
      try {
        const res = await fetch("/api/intake/transcribe", {
          method: "POST",
          headers: { "Content-Type": "audio/webm" },
          body: blob,
        })
        if (!res.ok) throw new Error("transcription failed")
        const data = await res.json()
        if (data.empty || !data.transcript) {
          setOrbState("idle")
          return
        }
        await sendMessage(data.transcript, "voice", data.durationMs ?? undefined)
      } catch {
        setOrbState("idle")
      }
    },
    [sendMessage]
  )

  // ── send text message ──
  const sendText = useCallback(
    (text: string) => {
      if (!text.trim()) return
      sendMessage(text.trim(), "text")
    },
    [sendMessage]
  )

  // ── request rephrase ──
  const requestRephrase = useCallback(async () => {
    if (!sessionIdRef.current) return
    try {
      const res = await fetch("/api/intake/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          message: "[rephrase]",
          inputMode: "text",
          rephrase: true,
        }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.rephrases) setRephrases(data.rephrases)
    } catch {
      // silent
    }
  }, [])

  // ── select rephrase option ──
  const selectRephrase = useCallback(
    (text: string) => {
      setRephrases(null)
      // replace last [them] message with rephrase
      setMessages((prev) => {
        const lastThemIdx = [...prev].reverse().findIndex((m) => m.role === "them")
        if (lastThemIdx === -1) return prev
        const realIdx = prev.length - 1 - lastThemIdx
        return prev.map((m, i) =>
          i === realIdx ? { ...m, content: text } : m
        )
      })
      speakText(text)
    },
    [speakText]
  )

  // ── accept block 4 ──
  const acceptBlock4 = useCallback(() => {
    block4AcceptedRef.current = true
    sendMessage("yes", "text", undefined, true)
  }, [sendMessage])

  return {
    status,
    orbState,
    messages,
    currentBlock,
    arrivalStatement,
    isRecording,
    isThinking,
    isSpeaking,
    rephrases,
    sessionComplete,
    error,
    startRecording,
    stopRecording,
    sendText,
    requestRephrase,
    selectRephrase,
    acceptBlock4,
    init,
  }
}

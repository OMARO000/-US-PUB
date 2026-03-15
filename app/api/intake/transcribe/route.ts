/**
 * POST /api/intake/transcribe
 *
 * Receives raw audio blob from the client (WebM/Opus from MediaRecorder).
 * Sends to Deepgram Nova-3 for transcription.
 * Returns transcript + duration metadata.
 *
 * No input time limit — Deepgram handles long recordings gracefully.
 * Chosen over AssemblyAI for: real-time streaming, lower latency,
 * Nova-3 accuracy on casual/emotional speech.
 */
import { NextRequest, NextResponse } from "next/server"

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY
const DEEPGRAM_URL =
  "https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&language=en"

export async function POST(req: NextRequest) {
  if (!DEEPGRAM_API_KEY) {
    return NextResponse.json({ error: "STT not configured" }, { status: 503 })
  }

  let audioBuffer: ArrayBuffer
  try {
    audioBuffer = await req.arrayBuffer()
  } catch {
    return NextResponse.json({ error: "invalid audio data" }, { status: 400 })
  }

  if (!audioBuffer || audioBuffer.byteLength === 0) {
    return NextResponse.json({ error: "empty audio" }, { status: 400 })
  }

  try {
    const response = await fetch(DEEPGRAM_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        "Content-Type": "audio/webm",
      },
      body: audioBuffer,
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("[us] Deepgram error:", err)
      return NextResponse.json({ error: "transcription failed" }, { status: 502 })
    }

    const data = await response.json()
    const transcript =
      data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ""
    const durationMs = data?.metadata?.duration
      ? Math.round(data.metadata.duration * 1000)
      : null

    if (!transcript) {
      return NextResponse.json({ transcript: "", durationMs, empty: true })
    }

    return NextResponse.json({ transcript, durationMs, empty: false })
  } catch (err) {
    console.error("[us] transcribe route error:", err)
    return NextResponse.json({ error: "transcription failed" }, { status: 500 })
  }
}

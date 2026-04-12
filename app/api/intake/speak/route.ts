/**
 * POST /api/intake/speak
 *
 * Receives [them] response text.
 * Sends to ElevenLabs v3 with Sage voice settings.
 * Streams audio back to client.
 *
 * Sage: warm, low, genderless. Amber #A0522D.
 * ElevenLabs v3 supports non-verbal tags — used for [them] tone cues.
 *
 * Non-verbal examples (injected by [them] engine when appropriate):
 *   <breath> — soft pause before something tender
 *   <sigh> — quiet acknowledgment
 *   <laugh type="gentle"> — warmth, not humor
 */
import { NextRequest, NextResponse } from "next/server"

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const SAGE_VOICE_ID = process.env.ELEVENLABS_VOICE_ID // Sage custom voice ID

export async function POST(req: NextRequest) {
  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: "TTS not configured" }, { status: 503 })
  }

  let body: { text: string; voiceId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 })
  }

  const { text, voiceId } = body
  const resolvedVoiceId = voiceId ?? SAGE_VOICE_ID

  if (!resolvedVoiceId) {
    return NextResponse.json({ error: "TTS not configured" }, { status: 503 })
  }
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "text required" }, { status: 400 })
  }

  // strip bracket UI language before sending to TTS
  // [rephrase], [done], [hold to speak] etc. should not be spoken
  const cleanText = text.replace(/\[[^\]]+\]/g, "").trim()
  if (!cleanText) {
    return NextResponse.json({ error: "no speakable content" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}/stream`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_v3",
          voice_settings: {
            stability: 0.55,        // warm but not flat
            similarity_boost: 0.85, // stay close to Sage's character
            style: 0.3,             // subtle expressiveness
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      console.error("[us] ElevenLabs error:", err)
      return NextResponse.json({ error: "TTS failed" }, { status: 502 })
    }

    // stream audio directly back to client
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[us] speak route error:", err)
    return NextResponse.json({ error: "TTS failed" }, { status: 500 })
  }
}

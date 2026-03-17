/**
 * GET /api/voices
 *
 * Fetches the full ElevenLabs voice library.
 * Used by the onboarding voice picker.
 * Cached for 1 hour — voice library doesn't change often.
 */

import { NextResponse } from "next/server"

export const revalidate = 3600 // cache for 1 hour

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!apiKey) {
    return NextResponse.json({ voices: [] }, { status: 200 })
  }

  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": apiKey,
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      return NextResponse.json({ voices: [] })
    }

    const data = await res.json()

    // return only the fields the UI needs
    const voices = (data.voices ?? []).map((v: {
      voice_id: string
      name: string
      labels?: Record<string, string>
      preview_url?: string
    }) => ({
      voice_id: v.voice_id,
      name: v.name,
      labels: v.labels ?? {},
      preview_url: v.preview_url ?? null,
    }))

    return NextResponse.json({ voices })
  } catch {
    return NextResponse.json({ voices: [] })
  }
}

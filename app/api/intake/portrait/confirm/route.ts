/**
 * POST /api/intake/portrait/confirm
 *
 * Called after user confirms or corrects their Block 8 portrait.
 * Updates the portrait record with user response.
 * Marks portrait as ready for matching.
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { intakePortraits } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: NextRequest) {
  let body: {
    sessionId: string
    confirmed: boolean
    correction: string | null
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 })
  }

  const { sessionId, confirmed, correction } = body

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 })
  }

  try {
    const now = new Date()

    await db
      .update(intakePortraits)
      .set({
        userConfirmed: confirmed,
        userCorrections: correction ?? null,
        readyForMatching: confirmed,
        updatedAt: now,
      })
      .where(eq(intakePortraits.sessionId, sessionId))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[us] portrait confirm error:", err)
    return NextResponse.json({ error: "failed to confirm portrait" }, { status: 500 })
  }
}

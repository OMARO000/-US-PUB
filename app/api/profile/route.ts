/**
 * GET /api/profile?userId=...
 *
 * Returns the user's most recent confirmed portrait from intake_portraits.
 * "Confirmed" means userConfirmed = true or readyForMatching = true.
 * Falls back to the most recent portrait if neither condition is met.
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { intakePortraits } from "@/lib/db/schema"
import { eq, desc, or } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }

  try {
    // prefer confirmed/ready portrait, fall back to most recent
    const allPortraits = await db
      .select()
      .from(intakePortraits)
      .where(eq(intakePortraits.userId, userId))
      .orderBy(desc(intakePortraits.createdAt))
      .limit(5)

    if (!allPortraits.length) {
      return NextResponse.json({ portrait: null })
    }

    const portrait =
      allPortraits.find((p) => p.userConfirmed || p.readyForMatching) ??
      allPortraits[0]

    const parse = (json: string | null): string[] => {
      try { return JSON.parse(json ?? "[]") } catch { return [] }
    }

    return NextResponse.json({
      portrait: {
        id: portrait.id,
        portraitText: portrait.portraitText,
        metaphorText: portrait.metaphorText,
        archetype: portrait.archetype ?? "composite",
        imageKey: portrait.archetype ? `${portrait.archetype}_01` : null,
        connectionType: portrait.connectionType,
        valuesSignals: parse(portrait.valuesSignals),
        narrativeSignals: parse(portrait.narrativeSignals),
        relationalSignals: parse(portrait.relationalSignals),
        communicationSignals: parse(portrait.communicationSignals),
        frictionSignals: parse(portrait.frictionSignals),
        userCorrections: portrait.userCorrections,
        createdAt: portrait.createdAt,
      },
    })
  } catch (err) {
    console.error("[us] profile GET error:", err)
    return NextResponse.json({ error: "failed to fetch profile" }, { status: 500 })
  }
}

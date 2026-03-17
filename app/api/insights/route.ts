/**
 * GET /api/insights?userId=...
 *
 * Returns pattern insights derived from portrait signals + match scores.
 *
 * freePatterns    — top 3 observations from values/narrative/relational signals
 * paidPatterns    — observations from communication/friction signals
 * mirrorObservations — derived from top resonanceSignals across all matches
 * frameworks      — per-layer signal richness scores (0–100) + notes
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { intakePortraits, matchScores } from "@/lib/db/schema"
import { eq, desc, ne } from "drizzle-orm"

function parseSignals(json: string | null): string[] {
  try { return JSON.parse(json ?? "[]") } catch { return [] }
}

/**
 * Signal richness score — length/density of signal array → 0–100
 */
function signalScore(signals: string[]): number {
  if (!signals.length) return 0
  const totalChars = signals.join("").length
  // scale: 200 chars = 100 score
  return Math.min(Math.round((totalChars / 200) * 100), 100)
}

/**
 * Build a free-form pattern observation from a signal array
 */
function patternFromSignals(layer: string, signals: string[]): string | null {
  if (!signals.length) return null
  const top = signals[0]

  const prefixes: Record<string, string> = {
    values: "you tend to lead with",
    narrative: "across your conversation,",
    relational: "in connection, you",
    communication: "your communication pattern shows",
    friction: "when things get hard,",
  }
  const prefix = prefixes[layer] ?? "notable:"
  return `${prefix} ${top.toLowerCase()}`
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }

  try {
    // ── fetch portrait ──
    const portraits = await db
      .select()
      .from(intakePortraits)
      .where(eq(intakePortraits.userId, userId))
      .orderBy(desc(intakePortraits.createdAt))
      .limit(3)

    if (!portraits.length) {
      return NextResponse.json({ insights: null })
    }

    const portrait =
      portraits.find((p) => p.userConfirmed || p.readyForMatching) ??
      portraits[0]

    const valuesSignals = parseSignals(portrait.valuesSignals)
    const narrativeSignals = parseSignals(portrait.narrativeSignals)
    const relationalSignals = parseSignals(portrait.relationalSignals)
    const communicationSignals = parseSignals(portrait.communicationSignals)
    const frictionSignals = parseSignals(portrait.frictionSignals)

    // ── free patterns ──
    const freePatterns: string[] = [
      patternFromSignals("values", valuesSignals),
      patternFromSignals("narrative", narrativeSignals),
      patternFromSignals("relational", relationalSignals),
    ].filter(Boolean) as string[]

    // ── paid patterns ──
    const paidPatterns: string[] = [
      patternFromSignals("communication", communicationSignals),
      patternFromSignals("friction", frictionSignals),
    ].filter(Boolean) as string[]

    // ── mirror observations from match scores ──
    const matches = await db
      .select()
      .from(matchScores)
      .where(eq(matchScores.userIdA, userId))
      .orderBy(desc(matchScores.totalScore))
      .limit(10)

    const allResonanceSignals: string[] = []
    for (const m of matches) {
      const signals = parseSignals(m.resonanceSignals)
      allResonanceSignals.push(...signals)
    }

    // deduplicate and take top 3 for mirror observations
    const uniqueSignals = [...new Set(allResonanceSignals)].slice(0, 6)
    const mirrorObservations = uniqueSignals.length > 0
      ? [
          {
            label: "what your matches reflect",
            content: uniqueSignals[0],
          },
          uniqueSignals[1] && {
            label: "a pattern worth naming",
            content: uniqueSignals[1],
          },
        ].filter(Boolean) as { label: string; content: string }[]
      : []

    // ── framework scores ──
    const frameworks = [
      {
        name: "values",
        score: signalScore(valuesSignals),
        note: valuesSignals[0] ?? "no signal data yet.",
        isPaid: false,
      },
      {
        name: "narrative",
        score: signalScore(narrativeSignals),
        note: narrativeSignals[0] ?? "no signal data yet.",
        isPaid: false,
      },
      {
        name: "relational",
        score: signalScore(relationalSignals),
        note: relationalSignals[0] ?? "no signal data yet.",
        isPaid: false,
      },
      {
        name: "communication",
        score: signalScore(communicationSignals),
        note: communicationSignals[0] ?? "no signal data yet.",
        isPaid: false,
      },
      {
        name: "conflict style",
        score: signalScore(frictionSignals),
        note: frictionSignals[0] ?? "observed during block 4.",
        isPaid: true,
      },
      {
        name: "energy exchange",
        score: Math.round((signalScore(relationalSignals) + signalScore(valuesSignals)) / 2),
        note: "observed across your relational and values signals.",
        isPaid: true,
      },
    ]

    return NextResponse.json({
      insights: {
        freePatterns,
        paidPatterns,
        mirrorObservations,
        frameworks,
      },
    })
  } catch (err) {
    console.error("[us] insights GET error:", err)
    return NextResponse.json({ error: "failed to fetch insights" }, { status: 500 })
  }
}

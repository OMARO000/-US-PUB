/**
 * GET /api/matches?userId=...&connectionType=...&goDeeper=false
 * POST /api/matches — record connect or not_a_fit action
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { intakePortraits, matchScores } from "@/lib/db/schema"
import { eq, and, ne, desc } from "drizzle-orm"
import { rankMatches } from "@/lib/match/matchEngine"
import { v4 as uuid } from "uuid"
import type { ConnectionType } from "@/lib/match/matchEngine"
import { createNotification } from "@/lib/notifications/create"

const CACHE_TTL_MS = 24 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")
  const connectionType = (req.nextUrl.searchParams.get("connectionType") ?? "open") as ConnectionType
  const goDeeper = req.nextUrl.searchParams.get("goDeeper") === "true"

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  try {
    const [userPortrait] = await db
      .select()
      .from(intakePortraits)
      .where(and(eq(intakePortraits.userId, userId), eq(intakePortraits.readyForMatching, true)))
      .orderBy(desc(intakePortraits.createdAt))
      .limit(1)

    if (!userPortrait) return NextResponse.json({ matches: [], fromCache: false, noPortrait: true })

    const cutoff = new Date(Date.now() - CACHE_TTL_MS)
    const cached = await db
      .select()
      .from(matchScores)
      .where(and(eq(matchScores.userIdA, userId), eq(matchScores.connectionType, connectionType), ne(matchScores.status, "not_a_fit")))
      .orderBy(desc(matchScores.totalScore))

    const freshCached = cached.filter((r) => new Date(r.scoredAt) > cutoff)

    if (freshCached.length > 0) {
      return NextResponse.json({
        matches: sortWithIntentFirst(freshCached).map(serializeMatchRow),
        fromCache: true,
      })
    }

    const candidates = await db
      .select()
      .from(intakePortraits)
      .where(and(ne(intakePortraits.userId, userId), eq(intakePortraits.readyForMatching, true)))

    if (candidates.length === 0) return NextResponse.json({ matches: [], fromCache: false })

    const results = rankMatches(userPortrait, candidates, connectionType, goDeeper)

    for (const row of cached) {
      await db.delete(matchScores).where(eq(matchScores.id, row.id))
    }

    const now = new Date()
    const rows = results.map((r) => ({
      id: uuid(),
      userIdA: userId,
      userIdB: r.targetUserId,
      connectionType,
      totalScore: r.totalScore,
      layerScores: JSON.stringify(r.layers),
      resonanceSignals: JSON.stringify(r.resonanceSignals),
      mutualSignals: JSON.stringify(r.mutualSignals),
      archetypeA: r.archetypeA,
      archetypeB: r.archetypeB,
      goDeeper,
      intentSignal: false,
      status: "pending" as const,
      outcomeRecorded: false,
      scoredAt: now,
      updatedAt: now,
    }))

    if (rows.length > 0) {
      await db.insert(matchScores).values(rows)
      await createNotification(
        userId,
        "match",
        `[u] found ${rows.length} new resonance signal${rows.length !== 1 ? "s" : ""}. check your [connections].`
      )
    }

    return NextResponse.json({
      matches: rows.map((r) => ({
        id: r.id,
        targetUserId: r.userIdB,
        connectionType: r.connectionType,
        totalScore: r.totalScore,
        resonanceSignals: JSON.parse(r.resonanceSignals),
        mutualSignals: JSON.parse(r.mutualSignals),
        archetypeA: r.archetypeA,
        archetypeB: r.archetypeB,
        intentSignal: r.intentSignal,
        status: r.status,
        scoredAt: r.scoredAt,
      })),
      fromCache: false,
    })
  } catch (err) {
    console.error("[us] matches GET error:", err)
    return NextResponse.json({ error: "failed to fetch matches" }, { status: 500 })
  }
}

function sortWithIntentFirst(rows: typeof matchScores.$inferSelect[]) {
  return [...rows].sort((a, b) => {
    if (a.intentSignal && !b.intentSignal) return -1
    if (!a.intentSignal && b.intentSignal) return 1
    return b.totalScore - a.totalScore
  })
}

function serializeMatchRow(r: typeof matchScores.$inferSelect) {
  return {
    id: r.id,
    targetUserId: r.userIdB,
    connectionType: r.connectionType,
    totalScore: r.totalScore,
    resonanceSignals: (() => { try { return JSON.parse(r.resonanceSignals) } catch { return [] } })(),
    mutualSignals: (() => { try { return JSON.parse(r.mutualSignals) } catch { return [] } })(),
    archetypeA: r.archetypeA,
    archetypeB: r.archetypeB,
    intentSignal: r.intentSignal,
    status: r.status,
    scoredAt: r.scoredAt,
  }
}

export async function POST(req: NextRequest) {
  let body: { matchId: string; action: "connected" | "not_a_fit" }
  try { body = await req.json() } catch { return NextResponse.json({ error: "invalid request" }, { status: 400 }) }

  const { matchId, action } = body
  if (!matchId || !["connected", "not_a_fit"].includes(action)) {
    return NextResponse.json({ error: "matchId and valid action required" }, { status: 400 })
  }

  try {
    await db.update(matchScores).set({ status: action, updatedAt: new Date() }).where(eq(matchScores.id, matchId))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[us] matches POST error:", err)
    return NextResponse.json({ error: "failed to update match" }, { status: 500 })
  }
}

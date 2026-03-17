/**
 * GET /api/matches?userId=...&connectionType=...&goDeeper=false
 *
 * Returns scored matches for a user.
 * Checks match_scores table first — returns cached if fresh.
 * Re-scores if portrait has been updated since last score.
 *
 * POST /api/matches/action
 * Records connect or not_a_fit action on a match.
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { intakePortraits, matchScores } from "@/lib/db/schema"
import { eq, and, ne, desc } from "drizzle-orm"
import { rankMatches } from "@/lib/match/matchEngine"
import { v4 as uuid } from "uuid"
import type { ConnectionType } from "@/lib/match/matchEngine"

// ─────────────────────────────────────────────
// GET — fetch matches
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")
  const connectionType = (req.nextUrl.searchParams.get("connectionType") ?? "open") as ConnectionType
  const goDeeper = req.nextUrl.searchParams.get("goDeeper") === "true"

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }

  try {
    // ── get user's portrait ──
    const [userPortrait] = await db
      .select()
      .from(intakePortraits)
      .where(
        and(
          eq(intakePortraits.userId, userId),
          eq(intakePortraits.readyForMatching, true)
        )
      )
      .orderBy(desc(intakePortraits.createdAt))
      .limit(1)

    if (!userPortrait) {
      return NextResponse.json({
        matches: [],
        reason: "portrait_not_ready",
      })
    }

    // ── check for cached scores ──
    const cached = await db
      .select()
      .from(matchScores)
      .where(
        and(
          eq(matchScores.userIdA, userId),
          eq(matchScores.connectionType, connectionType),
          eq(matchScores.goDeeper, goDeeper),
          ne(matchScores.status, "not_a_fit")
        )
      )
      .orderBy(desc(matchScores.totalScore))

    // use cache if fresh (scored within 24h and portrait hasn't changed)
    const cacheAge = cached.length > 0
      ? Date.now() - new Date(cached[0].scoredAt).getTime()
      : Infinity
    const cacheValid = cacheAge < 86400000 // 24 hours

    if (cacheValid && cached.length > 0) {
      const matches = cached.map((m) => ({
        id: m.id,
        targetUserId: m.userIdB,
        connectionType: m.connectionType,
        resonanceSignals: JSON.parse(m.resonanceSignals),
        mutualSignals: JSON.parse(m.mutualSignals),
        archetypeA: m.archetypeA,
        archetypeB: m.archetypeB,
        status: m.status,
        goDeeper: m.goDeeper,
        scoredAt: m.scoredAt,
      }))

      return NextResponse.json({ matches, fromCache: true })
    }

    // ── score fresh matches ──
    const allPortraits = await db
      .select()
      .from(intakePortraits)
      .where(
        and(
          ne(intakePortraits.userId, userId),
          eq(intakePortraits.readyForMatching, true)
        )
      )

    if (!allPortraits.length) {
      return NextResponse.json({ matches: [], reason: "no_candidates" })
    }

    const results = rankMatches(userPortrait, allPortraits, connectionType, goDeeper)

    // ── persist scores ──
    const now = new Date()
    const matchRows = results.map((r) => ({
      id: uuid(),
      userIdA: userId,
      userIdB: r.targetUserId,
      connectionType,
      totalScore: r.totalScore,
      layerScores: JSON.stringify(
        Object.fromEntries(r.layers.map((l) => [l.layer, l.weightedScore]))
      ),
      resonanceSignals: JSON.stringify(r.resonanceSignals),
      mutualSignals: JSON.stringify(r.mutualSignals),
      archetypeA: r.archetypeA,
      archetypeB: r.archetypeB,
      goDeeper,
      status: "pending" as const,
      scoredAt: now,
      updatedAt: now,
    }))

    // upsert — delete old scores and insert fresh
    if (matchRows.length > 0) {
      // delete stale scores for this user+type+goDeeper combination
      await db
        .delete(matchScores)
        .where(
          and(
            eq(matchScores.userIdA, userId),
            eq(matchScores.connectionType, connectionType),
            eq(matchScores.goDeeper, goDeeper)
          )
        )

      await db.insert(matchScores).values(matchRows)
    }

    const matches = results.map((r, i) => ({
      id: matchRows[i].id,
      targetUserId: r.targetUserId,
      connectionType: r.connectionType,
      resonanceSignals: r.resonanceSignals,
      mutualSignals: r.mutualSignals,
      archetypeA: r.archetypeA,
      archetypeB: r.archetypeB,
      status: "pending",
      goDeeper: r.goDeeper,
      scoredAt: now,
    }))

    return NextResponse.json({ matches, fromCache: false })
  } catch (err) {
    console.error("[us] matches error:", err)
    return NextResponse.json({ error: "failed to fetch matches" }, { status: 500 })
  }
}

// ─────────────────────────────────────────────
// POST /api/matches — connect or not_a_fit
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: {
    matchId: string
    action: "connected" | "not_a_fit"
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 })
  }

  const { matchId, action } = body

  if (!matchId || !action) {
    return NextResponse.json({ error: "matchId and action required" }, { status: 400 })
  }

  try {
    await db
      .update(matchScores)
      .set({ status: action, updatedAt: new Date() })
      .where(eq(matchScores.id, matchId))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[us] match action error:", err)
    return NextResponse.json({ error: "failed to update match" }, { status: 500 })
  }
}

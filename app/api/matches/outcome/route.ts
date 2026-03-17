/**
 * POST /api/matches/outcome
 *
 * Body: { conversationId, userId, outcome, rating?, notes? }
 *
 * 1. Validates the conversation exists and userId is a participant.
 * 2. Creates a match_outcomes row.
 * 3. If outcome is "met" or "didnt_meet", updates conversations.status to "ended".
 * 4. Marks the match_scores row(s) for this pair as outcomeRecorded = true.
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { conversations, matchOutcomes, matchScores } from "@/lib/db/schema"
import { eq, and, or } from "drizzle-orm"
import { v4 as uuid } from "uuid"

type Outcome = "met" | "didnt_meet" | "ongoing"

export async function POST(req: NextRequest) {
  let body: {
    conversationId: string
    userId: string
    outcome: Outcome
    rating?: number
    notes?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 })
  }

  const { conversationId, userId, outcome, rating, notes } = body

  if (!conversationId || !userId || !outcome) {
    return NextResponse.json(
      { error: "conversationId, userId, and outcome are required" },
      { status: 400 }
    )
  }

  const validOutcomes: Outcome[] = ["met", "didnt_meet", "ongoing"]
  if (!validOutcomes.includes(outcome)) {
    return NextResponse.json({ error: "invalid outcome value" }, { status: 400 })
  }

  if (rating !== undefined && (rating < 1 || rating > 5 || !Number.isInteger(rating))) {
    return NextResponse.json({ error: "rating must be an integer 1–5" }, { status: 400 })
  }

  try {
    // ── verify conversation exists and user is a participant ──
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1)

    if (!conversation) {
      return NextResponse.json({ error: "conversation not found" }, { status: 404 })
    }

    const { userIdA, userIdB } = conversation
    if (userId !== userIdA && userId !== userIdB) {
      return NextResponse.json({ error: "user is not a participant" }, { status: 403 })
    }

    const now = new Date()

    // ── create outcome row ──
    await db.insert(matchOutcomes).values({
      id: uuid(),
      conversationId,
      userId,
      outcome,
      rating: rating ?? null,
      notes: notes ?? null,
      createdAt: now,
    })

    // ── end conversation if outcome is terminal ──
    if (outcome === "met" || outcome === "didnt_meet") {
      await db
        .update(conversations)
        .set({ status: "ended", updatedAt: now })
        .where(eq(conversations.id, conversationId))
    }

    // ── mark match_scores rows as outcomeRecorded ──
    await db
      .update(matchScores)
      .set({ outcomeRecorded: true, updatedAt: now })
      .where(
        or(
          and(eq(matchScores.userIdA, userIdA), eq(matchScores.userIdB, userIdB)),
          and(eq(matchScores.userIdA, userIdB), eq(matchScores.userIdB, userIdA))
        )
      )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[us] matches/outcome error:", err)
    return NextResponse.json({ error: "failed to record outcome" }, { status: 500 })
  }
}

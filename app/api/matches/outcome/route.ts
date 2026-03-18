/**
 * POST /api/matches/outcome
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { conversations, matchOutcomes, matchScores } from "@/lib/db/schema"
import { eq, and, or } from "drizzle-orm"
import { v4 as uuid } from "uuid"

type Outcome = "met" | "didnt_meet" | "ongoing"

export async function POST(req: NextRequest) {
  let body: { conversationId: string; userId: string; outcome: Outcome; rating?: number; notes?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "invalid request" }, { status: 400 }) }

  const { conversationId, userId, outcome, rating, notes } = body

  if (!conversationId || !userId) {
    return NextResponse.json({ error: "conversationId and userId required" }, { status: 400 })
  }
  if (!["met", "didnt_meet", "ongoing"].includes(outcome)) {
    return NextResponse.json({ error: "invalid outcome" }, { status: 400 })
  }
  if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return NextResponse.json({ error: "rating must be integer 1–5" }, { status: 400 })
  }

  try {
    const now = new Date()

    // 1. verify conversation exists and userId is a participant
    const [convo] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1)

    if (!convo) return NextResponse.json({ error: "conversation not found" }, { status: 404 })
    if (convo.userIdA !== userId && convo.userIdB !== userId) {
      return NextResponse.json({ error: "not a participant" }, { status: 403 })
    }

    // 2. insert match_outcomes row
    await db.insert(matchOutcomes).values({
      id: uuid(),
      conversationId,
      userId,
      outcome,
      rating: rating ?? null,
      notes: notes ?? null,
      createdAt: now,
    })

    // 3. if met or didnt_meet → end the conversation
    if (outcome === "met" || outcome === "didnt_meet") {
      await db
        .update(conversations)
        .set({ status: "ended", updatedAt: now })
        .where(eq(conversations.id, conversationId))
    }

    // 4. mark match_scores.outcomeRecorded = true for both directions
    const { userIdA, userIdB } = convo
    await db
      .update(matchScores)
      .set({ outcomeRecorded: true, updatedAt: now })
      .where(and(eq(matchScores.userIdA, userIdA), eq(matchScores.userIdB, userIdB)))

    await db
      .update(matchScores)
      .set({ outcomeRecorded: true, updatedAt: now })
      .where(and(eq(matchScores.userIdA, userIdB), eq(matchScores.userIdB, userIdA)))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[us] outcome error:", err)
    return NextResponse.json({ error: "failed to record outcome" }, { status: 500 })
  }
}

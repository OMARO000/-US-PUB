import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { threads, threadMessages } from "@/lib/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { v4 as uuid } from "uuid"

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")
  const type = req.nextUrl.searchParams.get("type")

  if (!userId || !type) {
    return NextResponse.json({ error: "userId and type required" }, { status: 400 })
  }

  try {
    const now = new Date()

    // find or create thread
    const existing = await db
      .select()
      .from(threads)
      .where(and(eq(threads.userId, userId), eq(threads.threadType, type)))
      .limit(1)

    let thread = existing[0]

    if (!thread) {
      const id = uuid()
      await db.insert(threads).values({
        id,
        userId,
        threadType: type,
        createdAt: now,
        lastActiveAt: now,
      })
      thread = { id, userId, threadType: type, createdAt: now, lastActiveAt: now }
    }

    const messages = await db
      .select()
      .from(threadMessages)
      .where(eq(threadMessages.threadId, thread.id))
      .orderBy(asc(threadMessages.createdAt))

    return NextResponse.json({ thread, messages })
  } catch (err) {
    console.error("[us] threads GET error:", err)
    return NextResponse.json({ error: "failed to get thread" }, { status: 500 })
  }
}

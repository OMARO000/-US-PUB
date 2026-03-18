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

  // find existing thread
  let [thread] = await db
    .select()
    .from(threads)
    .where(and(eq(threads.userId, userId), eq(threads.threadType, type)))
    .limit(1)

  // create if not exists
  if (!thread) {
    const now = new Date()
    const [created] = await db
      .insert(threads)
      .values({
        id: uuid(),
        userId,
        threadType: type,
        createdAt: now,
        lastActiveAt: now,
      })
      .returning()
    thread = created
  }

  // fetch messages
  const messages = await db
    .select()
    .from(threadMessages)
    .where(eq(threadMessages.threadId, thread.id))
    .orderBy(asc(threadMessages.createdAt))

  return NextResponse.json({ thread, messages })
}

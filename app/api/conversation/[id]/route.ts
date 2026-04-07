/**
 * GET /api/conversation/[id] — fetch messages for a matched conversation
 * POST /api/conversation/[id] — send a message
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { conversations, threadMessages, threads } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { v4 as uuid } from "uuid"

// reuse thread_messages table with conversationId as threadId
// role: "a" or "b" mapped from userId

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const conversationId = (await params).id
  const userId = req.nextUrl.searchParams.get("userId")

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  try {
    const [convo] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1)

    if (!convo) return NextResponse.json({ error: "not found" }, { status: 404 })
    if (convo.userIdA !== userId && convo.userIdB !== userId) {
      return NextResponse.json({ error: "not a participant" }, { status: 403 })
    }

    const messages = await db
      .select()
      .from(threadMessages)
      .where(eq(threadMessages.threadId, conversationId))
      .orderBy(asc(threadMessages.createdAt))

    return NextResponse.json({
      conversationId,
      firstPrompt: convo.firstPrompt,
      status: convo.status,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,           // "a" or "b"
        content: m.content,
        createdAt: m.createdAt,
        isMe: (m.role as string) === (convo.userIdA === userId ? "a" : "b"),
      })),
    })
  } catch (err) {
    console.error("[us] conversation GET error:", err)
    return NextResponse.json({ error: "failed to fetch conversation" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const conversationId = (await params).id
  let body: { userId: string; content: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 })
  }

  const { userId, content } = body
  if (!userId || !content?.trim()) {
    return NextResponse.json({ error: "userId and content required" }, { status: 400 })
  }

  try {
    const [convo] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1)

    if (!convo) return NextResponse.json({ error: "not found" }, { status: 404 })
    if (convo.userIdA !== userId && convo.userIdB !== userId) {
      return NextResponse.json({ error: "not a participant" }, { status: 403 })
    }
    if (convo.status === "ended") {
      return NextResponse.json({ error: "conversation ended" }, { status: 409 })
    }

    const role = convo.userIdA === userId ? "user" : "you"
    const now = new Date()

    const msgId = uuid()
    await db.insert(threadMessages).values({
      id: msgId,
      threadId: conversationId,
      role,
      content: content.trim(),
      metadata: null,
      createdAt: now,
    })

    await db
      .update(conversations)
      .set({ updatedAt: now })
      .where(eq(conversations.id, conversationId))

    return NextResponse.json({ ok: true, messageId: msgId })
  } catch (err) {
    console.error("[us] conversation POST error:", err)
    return NextResponse.json({ error: "failed to send message" }, { status: 500 })
  }
}

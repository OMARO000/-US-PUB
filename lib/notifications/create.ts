import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { v4 as uuid } from "uuid"

type NotificationCategory = "match" | "connection" | "message" | "insight" | "journal" | "policy" | "update"

export async function createNotification(
  userId: string,
  category: NotificationCategory,
  content: string,
  relatedId?: string
) {
  try {
    await db.insert(notifications).values({
      id: uuid(),
      userId,
      category,
      content,
      read: false,
      relatedId: relatedId ?? null,
      createdAt: new Date(),
    })
  } catch (err) {
    console.error("[us] createNotification error:", err)
  }
}

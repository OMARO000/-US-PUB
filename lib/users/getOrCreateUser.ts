/**
 * getOrCreateUser — server-side
 *
 * Takes a userId (from localStorage us_uid).
 * Checks if a row exists in the users table.
 * Creates one if not.
 * Returns the user row.
 */

import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"

type User = InferSelectModel<typeof users>

function generateAccountNumber(): string {
  const group = () => Math.floor(1000 + Math.random() * 9000).toString()
  return `${group()} ${group()} ${group()} ${group()}`
}

export async function getOrCreateUser(
  userId: string,
  opts?: { themeId?: string; voiceId?: string }
): Promise<User> {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (existing) return existing

  const now = new Date()
  const newUser: typeof users.$inferInsert = {
    id: userId,
    accountNumber: generateAccountNumber(),
    createdAt: now,
    lastActiveAt: now,
    themeId: opts?.themeId ?? "charcoal",
    voiceId: opts?.voiceId ?? process.env.ELEVENLABS_VOICE_ID ?? null,
    isPaid: false,
  }

  await db.insert(users).values(newUser)

  return newUser as User
}

/**
 * generateFirstPrompt(conversationId)
 */

import Anthropic from "@anthropic-ai/sdk"
import { db } from "@/lib/db"
import { conversations, intakePortraits, matchScores } from "@/lib/db/schema"
import { eq, and, asc } from "drizzle-orm"

const anthropic = new Anthropic()

const FALLBACK = "[something worth exploring just came into view.]"

export async function generateFirstPrompt(conversationId: string): Promise<string> {
  try {
    const [convo] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1)
    if (!convo) return FALLBACK

    const { userIdA, userIdB } = convo

    const [portraitA] = await db
      .select()
      .from(intakePortraits)
      .where(eq(intakePortraits.userId, userIdA))
      .orderBy(asc(intakePortraits.createdAt))
      .limit(1)

    const [portraitB] = await db
      .select()
      .from(intakePortraits)
      .where(eq(intakePortraits.userId, userIdB))
      .orderBy(asc(intakePortraits.createdAt))
      .limit(1)

    if (!portraitA || !portraitB) return FALLBACK

    const [matchRow] = await db
      .select()
      .from(matchScores)
      .where(and(eq(matchScores.userIdA, userIdA), eq(matchScores.userIdB, userIdB)))
      .limit(1)

    const resonanceSignals: string[] = matchRow?.resonanceSignals
      ? (() => { try { return JSON.parse(matchRow.resonanceSignals) } catch { return [] } })()
      : []

    const topSignal = resonanceSignals[0] ?? null

    const context = [
      topSignal ? `top resonance signal: ${topSignal}` : "",
      `person a: ${portraitA.portraitText.slice(0, 300)}`,
      `person b: ${portraitB.portraitText.slice(0, 300)}`,
    ].filter(Boolean).join("\n\n")

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 120,
      system: `You write opening prompts for two people who just matched on [us], a human connection platform.

Rules:
- 1–2 sentences only
- Surfaces one resonance signal naturally — don't explain it, just open it
- Invitation, not statement — they should want to respond
- Lowercase bracket language: [like this] for any interface references
- No "do you" questions
- Warm, unhurried, genderless tone
- Do not mention the platform name or that they matched
- Feels like something worth leaning into, not a chat opener`,
      messages: [{ role: "user", content: `write an opening prompt for this pair.\n\n${context}` }],
    })

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim()

    if (!text) return FALLBACK

    await db
      .update(conversations)
      .set({ firstPrompt: text })
      .where(eq(conversations.id, conversationId))

    return text
  } catch (err) {
    console.error("[us] generateFirstPrompt error:", err)
    return FALLBACK
  }
}

/**
 * generateFirstPrompt(conversationId)
 *
 * 1. Fetches the conversation row
 * 2. Fetches both users' portraits
 * 3. Fetches their match score row
 * 4. Calls Claude Sonnet to write an opening prompt
 * 5. Updates conversations.firstPrompt
 * 6. Returns the prompt text
 */

import Anthropic from "@anthropic-ai/sdk"
import { db } from "@/lib/db"
import { conversations, intakePortraits, matchScores } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

const anthropic = new Anthropic()

function parseSignals(json: string | null): string[] {
  try { return JSON.parse(json ?? "[]") } catch { return [] }
}

export async function generateFirstPrompt(conversationId: string): Promise<string> {
  // ── fetch conversation ──
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1)

  if (!conversation) throw new Error(`conversation not found: ${conversationId}`)

  const { userIdA, userIdB } = conversation

  // ── fetch both portraits ──
  const [portraitA] = await db
    .select()
    .from(intakePortraits)
    .where(eq(intakePortraits.userId, userIdA))
    .orderBy(intakePortraits.createdAt)
    .limit(1)

  const [portraitB] = await db
    .select()
    .from(intakePortraits)
    .where(eq(intakePortraits.userId, userIdB))
    .orderBy(intakePortraits.createdAt)
    .limit(1)

  // ── fetch match score row ──
  const [matchScore] = await db
    .select()
    .from(matchScores)
    .where(
      and(
        eq(matchScores.userIdA, userIdA),
        eq(matchScores.userIdB, userIdB)
      )
    )
    .limit(1)

  // ── build context for prompt ──
  const resonanceSignals = parseSignals(matchScore?.resonanceSignals ?? null)
  const topSignal = resonanceSignals[0] ?? null

  const portraitAText = portraitA?.portraitText ?? ""
  const portraitBText = portraitB?.portraitText ?? ""

  const userMessage = [
    topSignal
      ? `shared resonance signal: "${topSignal}"`
      : "no resonance signal available",
    portraitAText
      ? `person A portrait: ${portraitAText.slice(0, 300)}`
      : "",
    portraitBText
      ? `person B portrait: ${portraitBText.slice(0, 300)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n")

  // ── call Claude Sonnet ──
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 120,
    system:
      "you are [you], a presence that holds space for real connection. " +
      "generate a single opening prompt (1–2 sentences) for two people who just matched. " +
      "surface one specific resonance signal from their match. " +
      "frame it as an invitation, not a statement. " +
      "warm and unhurried. use bracket language like [you] does — lowercase, minimal punctuation. " +
      "no assumptions about what they'll talk about. no questions that begin with 'do you'.",
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  })

  const text =
    response.content[0]?.type === "text"
      ? response.content[0].text.trim()
      : "[something worth exploring just came into view.]"

  // ── persist to conversations row ──
  await db
    .update(conversations)
    .set({ firstPrompt: text, updatedAt: new Date() })
    .where(eq(conversations.id, conversationId))

  return text
}

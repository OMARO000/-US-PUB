/**
 * [us] portrait engine — Block 8
 *
 * Scores the user's intake signals against 7 archetypes.
 * Selects a dominant archetype (or COMPOSITE if balanced).
 * Generates a written portrait + visual metaphor via Claude API.
 * Returns image selection key for the artwork library.
 *
 * Called after Block 8 intake completion.
 */

import Anthropic from "@anthropic-ai/sdk"
import type { SessionMessage } from "@/lib/intake/session"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─────────────────────────────────────────────
// ARCHETYPES
// ─────────────────────────────────────────────

export type Archetype =
  | "rooted"
  | "horizon"
  | "intimate"
  | "current"
  | "liminal"
  | "celestial"
  | "composite"

export interface ArchetypeScore {
  archetype: Archetype
  score: number
}

export interface PortraitResult {
  archetype: Archetype
  secondaryArchetype: Archetype | null
  portraitText: string
  metaphorText: string        // the visual bridge — ties written portrait to image
  imageKey: string            // e.g. "horizon_02" — maps to artwork library
  fullText: string            // portraitText + metaphorText combined for TTS
}

// ─────────────────────────────────────────────
// SIGNAL EXTRACTION
// Extracts raw signals from session messages for scoring
// ─────────────────────────────────────────────

interface ExtractedSignals {
  // values
  valuesStrength: number          // 0–1: how clearly values were expressed
  stabilityLanguage: number       // 0–1: "I know what I stand for", "I protect..."
  lowUrgency: number              // 0–1: unhurried, settled language

  // narrative
  narrativeStrength: number       // 0–1: aspiration, direction, becoming
  aspirationLanguage: number      // 0–1: "I'm building", "I want to..."
  urgencyLanguage: number         // 0–1: "I'm ready", "I need to..."

  // relational
  relationalStrength: number      // 0–1: depth of relational expression
  attachmentWarmth: number        // 0–1: warmth in how they describe connection
  caretakerLanguage: number       // 0–1: "I tend to give", "I take care of..."

  // communication
  communicationDirectness: number // 0–1: direct vs indirect communication style
  block4Engagement: number        // 0–1: did they accept and engage with Block 4
  repairLanguage: number          // 0–1: language about repair, resolution

  // OCEAN
  oceanOpenness: number           // 0–1: openness to experience signals
  ambiguityComfort: number        // 0–1: comfort with uncertainty
  multiConnectionType: number     // 0–1: open to multiple connection types

  // astrological
  astrologicalWeight: number      // 0–1: how much they engaged with cosmological layer
  contemplativeLanguage: number   // 0–1: reflective, meaning-seeking language
}

function extractSignals(messages: SessionMessage[]): ExtractedSignals {
  const userMessages = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.toLowerCase())
    .join(" ")

  const wordCount = userMessages.split(" ").length

  // helper: count keyword matches normalized to message length
  const density = (keywords: string[]): number => {
    const matches = keywords.filter((k) => userMessages.includes(k)).length
    return Math.min(matches / Math.max(wordCount / 50, 1), 1)
  }

  const block4Accepted = messages.some(
    (m) => m.role === "user" && m.blockId === 4 && m.content.length > 10
  )

  const multiType = userMessages.includes("open") ||
    (userMessages.includes("romantic") && userMessages.includes("platonic"))

  return {
    valuesStrength: density(["matter", "protect", "believe", "stand for", "important", "values", "principle"]),
    stabilityLanguage: density(["settled", "grounded", "know who", "clear about", "certain", "foundation"]),
    lowUrgency: density(["patient", "not in a rush", "taking my time", "slowly", "when it happens"]),

    narrativeStrength: density(["becoming", "building", "working toward", "growing", "changing", "figuring out"]),
    aspirationLanguage: density(["want to", "hope to", "trying to", "goal", "dream", "vision", "someday"]),
    urgencyLanguage: density(["ready", "need", "now", "soon", "waiting too long", "time is"]),

    relationalStrength: density(["connection", "depth", "close", "intimate", "bond", "mean something"]),
    attachmentWarmth: density(["love", "care", "warmth", "feel safe", "trust", "comfort", "home"]),
    caretakerLanguage: density(["i give", "take care", "support", "always there", "check in", "look after"]),

    communicationDirectness: density(["direct", "honest", "straight", "say what i mean", "upfront", "clear"]),
    block4Engagement: block4Accepted ? 1 : 0,
    repairLanguage: density(["repair", "apologize", "work through", "resolve", "fix", "come back"]),

    oceanOpenness: density(["curious", "explore", "open to", "new", "different", "perspective", "possibility"]),
    ambiguityComfort: density(["not sure", "both", "depends", "complicated", "nuanced", "either"]),
    multiConnectionType: multiType ? 1 : 0,

    astrologicalWeight: density(["sign", "moon", "venus", "chart", "astrology", "vedic", "chinese zodiac"]),
    contemplativeLanguage: density(["meaning", "purpose", "why", "universe", "bigger than", "connected to"]),
  }
}

// ─────────────────────────────────────────────
// ARCHETYPE SCORING
// ─────────────────────────────────────────────

function scoreArchetypes(signals: ExtractedSignals): ArchetypeScore[] {
  const scores: Record<Archetype, number> = {
    rooted:
      signals.valuesStrength * 0.4 +
      signals.stabilityLanguage * 0.3 +
      signals.lowUrgency * 0.3,

    horizon:
      signals.narrativeStrength * 0.4 +
      signals.aspirationLanguage * 0.35 +
      signals.urgencyLanguage * 0.25,

    intimate:
      signals.relationalStrength * 0.4 +
      signals.attachmentWarmth * 0.35 +
      signals.caretakerLanguage * 0.25,

    current:
      signals.communicationDirectness * 0.3 +
      signals.block4Engagement * 0.35 +
      signals.repairLanguage * 0.35,

    liminal:
      signals.oceanOpenness * 0.35 +
      signals.ambiguityComfort * 0.35 +
      signals.multiConnectionType * 0.3,

    celestial:
      signals.astrologicalWeight * 0.4 +
      signals.contemplativeLanguage * 0.35 +
      signals.lowUrgency * 0.25,

    composite: 0, // calculated below
  }

  // calculate composite score: triggered if no archetype dominates
  const nonCompositeScores = Object.entries(scores)
    .filter(([k]) => k !== "composite")
    .map(([, v]) => v)
  const mean = nonCompositeScores.reduce((a, b) => a + b, 0) / nonCompositeScores.length
  const max = Math.max(...nonCompositeScores)
  scores.composite = max - mean < 0.15 ? 0.8 : 0 // high score if no clear dominant

  return Object.entries(scores)
    .map(([archetype, score]) => ({ archetype: archetype as Archetype, score }))
    .sort((a, b) => b.score - a.score)
}

// ─────────────────────────────────────────────
// DOMINANT ARCHETYPE SELECTION
// ─────────────────────────────────────────────

function selectArchetype(scores: ArchetypeScore[]): {
  dominant: Archetype
  secondary: Archetype | null
} {
  const top = scores[0]
  const second = scores[1]
  const mean = scores.reduce((a, b) => a + b.score, 0) / scores.length

  // composite if explicitly triggered or no clear dominant
  if (top.archetype === "composite" || top.score - mean < 0.15) {
    return { dominant: "composite", secondary: null }
  }

  // blended if top two are within 10% of each other
  const isBlended = second && Math.abs(top.score - second.score) < 0.1

  return {
    dominant: top.archetype,
    secondary: isBlended && second.archetype !== "composite" ? second.archetype : null,
  }
}

// ─────────────────────────────────────────────
// IMAGE KEY SELECTION
// Maps archetype to image key in artwork library
// Library naming convention: {archetype}_{01-07}
// Semi-random within archetype, no repeat for returning users
// ─────────────────────────────────────────────

const ARCHETYPE_IMAGE_COUNTS: Record<Archetype, number> = {
  rooted: 5,
  horizon: 6,
  intimate: 5,
  current: 5,
  liminal: 6,
  celestial: 4,
  composite: 5,
}

function selectImageKey(
  archetype: Archetype,
  previousImageKey?: string
): string {
  const count = ARCHETYPE_IMAGE_COUNTS[archetype]
  const available = Array.from({ length: count }, (_, i) =>
    `${archetype}_${String(i + 1).padStart(2, "0")}`
  ).filter((key) => key !== previousImageKey)

  return available[Math.floor(Math.random() * available.length)]
}

// ─────────────────────────────────────────────
// PORTRAIT + METAPHOR GENERATION
// Claude generates the written portrait and visual metaphor
// ─────────────────────────────────────────────

const PORTRAIT_SYSTEM = `\
You are [you] — a presence within [us], a human connection platform.
You are writing a portrait of the person based on what emerged in their intake conversation.

THE PORTRAIT:
- Written in second person ("you")
- 4–6 sentences
- Reflects what you observed — not what you assumed
- Names what stood out: values, direction, how they connect, what they protect
- Feels like being seen, not being analyzed
- No labels, no diagnoses, no personality types
- Ends with an open door — something that invites them to confirm, correct, or add

THE METAPHOR:
After the portrait, write a single bridge sentence (1–2 sentences max) that connects the written portrait to a visual image.
The metaphor should:
- Reference a specific image archetype naturally (e.g. "a coastline just before dawn", "still water that holds everything without moving")
- Not explain the connection — just open it
- Feel like the last line of a poem, not a description
- Begin with: "we chose an image for you:"

FORMAT your response as:
PORTRAIT: [the portrait text]
METAPHOR: [the metaphor bridge text]

Nothing else. No preamble. No explanation.`

async function generatePortraitText(
  messages: SessionMessage[],
  archetype: Archetype,
  secondaryArchetype: Archetype | null
): Promise<{ portraitText: string; metaphorText: string }> {
  const conversationSummary = messages
    .filter((m) => m.role === "user")
    .map((m, i) => `[${i + 1}] ${m.content}`)
    .join("\n")

  const archetypeContext = secondaryArchetype
    ? `dominant archetype: ${archetype}, secondary: ${secondaryArchetype}`
    : `dominant archetype: ${archetype}`

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 600,
    system: PORTRAIT_SYSTEM,
    messages: [
      {
        role: "user",
        content: `${archetypeContext}\n\nconversation:\n${conversationSummary}\n\nwrite the portrait and metaphor.`,
      },
    ],
  })

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim()

  // parse PORTRAIT and METAPHOR sections
  const portraitMatch = text.match(/PORTRAIT:\s*([\s\S]*?)(?=METAPHOR:|$)/i)
  const metaphorMatch = text.match(/METAPHOR:\s*([\s\S]*?)$/i)

  const portraitText = portraitMatch?.[1]?.trim() ?? text
  const metaphorText = metaphorMatch?.[1]?.trim() ?? ""

  return { portraitText, metaphorText }
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────

export async function generatePortrait(
  messages: SessionMessage[],
  previousImageKey?: string
): Promise<PortraitResult> {
  const signals = extractSignals(messages)
  const scores = scoreArchetypes(signals)
  const { dominant, secondary } = selectArchetype(scores)
  const imageKey = selectImageKey(dominant, previousImageKey)

  const { portraitText, metaphorText } = await generatePortraitText(
    messages,
    dominant,
    secondary
  )

  const fullText = metaphorText
    ? `${portraitText}\n\n${metaphorText}`
    : portraitText

  return {
    archetype: dominant,
    secondaryArchetype: secondary,
    portraitText,
    metaphorText,
    imageKey,
    fullText,
  }
}

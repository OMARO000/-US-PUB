/**
 * [us] match engine — full 7-layer scoring
 *
 * Scores compatibility between two users across all 7 free layers.
 * Paid users get 4 additional layers when "go deeper" is active.
 *
 * Never returns a score to the user — only resonance signals.
 * Internal scores are used for ranking only.
 *
 * Weight distributions per connection type are locked in US_MATCH_ENGINE.md.
 */

import type { InferSelectModel } from "drizzle-orm"
import type { intakePortraits } from "@/lib/db/schema"

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type ConnectionType = "romantic" | "platonic" | "professional" | "open"
export type Portrait = InferSelectModel<typeof intakePortraits>

export interface SignalVector {
  // parsed from portrait JSON columns
  values: string[]
  narrative: string[]
  relational: string[]
  communication: string[]
  friction: string[]        // from block 4 — may be empty

  // derived from portrait fields
  archetype: string
  connectionType: ConnectionType
  userId: string
}

export interface LayerScore {
  layer: string
  score: number             // 0–1
  weight: number            // 0–1 (from weight table)
  weightedScore: number     // score * weight
  resonanceSignals: string[] // human-readable observations
}

export interface MatchResult {
  userId: string
  targetUserId: string
  connectionType: ConnectionType
  totalScore: number        // 0–1, internal only — never shown to user
  layers: LayerScore[]
  resonanceSignals: string[] // top signals to show user (3 free, 8 paid)
  mutualSignals: string[]   // what both users share — shown to both
  archetypeA: string
  archetypeB: string
  goDeeper: boolean         // whether paid layers were used
}

// ─────────────────────────────────────────────
// WEIGHT TABLES
// Locked in US_MATCH_ENGINE.md
// ─────────────────────────────────────────────

const FREE_WEIGHTS: Record<string, Record<ConnectionType, number>> = {
  values:        { romantic: 0.25, platonic: 0.25, professional: 0.30, open: 0.25 },
  narrative:     { romantic: 0.20, platonic: 0.15, professional: 0.20, open: 0.18 },
  personality:   { romantic: 0.15, platonic: 0.20, professional: 0.15, open: 0.17 },
  relational:    { romantic: 0.20, platonic: 0.15, professional: 0.10, open: 0.17 },
  communication: { romantic: 0.10, platonic: 0.15, professional: 0.15, open: 0.13 },
  mbti:          { romantic: 0.05, platonic: 0.05, professional: 0.05, open: 0.05 },
  astrological:  { romantic: 0.05, platonic: 0.05, professional: 0.05, open: 0.05 },
}

const PAID_WEIGHTS: Record<string, Record<ConnectionType, number>> = {
  values:        { romantic: 0.20, platonic: 0.20, professional: 0.29, open: 0.20 },
  narrative:     { romantic: 0.16, platonic: 0.12, professional: 0.16, open: 0.15 },
  personality:   { romantic: 0.12, platonic: 0.16, professional: 0.12, open: 0.13 },
  relational:    { romantic: 0.16, platonic: 0.12, professional: 0.08, open: 0.13 },
  communication: { romantic: 0.08, platonic: 0.12, professional: 0.12, open: 0.10 },
  mbti:          { romantic: 0.03, platonic: 0.04, professional: 0.04, open: 0.04 },
  astrological:  { romantic: 0.01, platonic: 0.04, professional: 0.04, open: 0.03 },
  conflict:      { romantic: 0.08, platonic: 0.05, professional: 0.03, open: 0.06 },
  lifeStage:     { romantic: 0.06, platonic: 0.05, professional: 0.05, open: 0.05 },
  energyExchange:{ romantic: 0.06, platonic: 0.05, professional: 0.03, open: 0.05 },
  mediumPref:    { romantic: 0.04, platonic: 0.05, professional: 0.04, open: 0.04 },
}

// ─────────────────────────────────────────────
// SIGNAL PARSING
// Extracts typed signal vectors from portrait JSON columns
// ─────────────────────────────────────────────

export function parseSignalVector(portrait: Portrait): SignalVector {
  const parse = (json: string): string[] => {
    try { return JSON.parse(json) } catch { return [] }
  }

  return {
    values: parse(portrait.valuesSignals),
    narrative: parse(portrait.narrativeSignals),
    relational: parse(portrait.relationalSignals),
    communication: parse(portrait.communicationSignals),
    friction: parse(portrait.frictionSignals),
    archetype: portrait.archetype ?? "composite",
    connectionType: (portrait.connectionType ?? "open") as ConnectionType,
    userId: portrait.userId,
  }
}

// ─────────────────────────────────────────────
// LAYER SCORING FUNCTIONS
// Each returns a score 0–1 and resonance signals
// ─────────────────────────────────────────────

/**
 * Jaccard similarity between two string arrays
 * Normalized to 0–1
 */
function jaccardSimilarity(a: string[], b: string[]): number {
  if (!a.length && !b.length) return 0.5
  if (!a.length || !b.length) return 0.1

  const setA = new Set(a.map((s) => s.toLowerCase().trim()))
  const setB = new Set(b.map((s) => s.toLowerCase().trim()))

  const intersection = [...setA].filter((x) => setB.has(x)).length
  const union = new Set([...setA, ...setB]).size

  return union === 0 ? 0 : intersection / union
}

/**
 * Keyword overlap score — counts shared meaningful terms
 */
function keywordOverlap(a: string[], b: string[]): number {
  const wordsA = a.join(" ").toLowerCase().split(/\s+/).filter((w) => w.length > 4)
  const wordsB = b.join(" ").toLowerCase().split(/\s+/).filter((w) => w.length > 4)

  if (!wordsA.length || !wordsB.length) return 0.2

  const setA = new Set(wordsA)
  const setB = new Set(wordsB)
  const shared = [...setA].filter((w) => setB.has(w)).length

  return Math.min(shared / Math.max(setA.size, setB.size), 1)
}

function scoreValues(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  const similarity = keywordOverlap(a.values, b.values)
  const signals: string[] = []

  if (similarity > 0.6) {
    signals.push("values alignment is unusually high — what you protect, they protect too")
  } else if (similarity > 0.35) {
    signals.push("overlapping values — different expressions of similar priorities")
  } else if (similarity > 0.15) {
    signals.push("values are adjacent — close enough to understand each other, different enough to interest")
  }

  return { score: similarity, signals }
}

function scoreNarrative(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  const overlap = keywordOverlap(a.narrative, b.narrative)
  const signals: string[] = []

  // narrative: directional alignment matters more than identical content
  const score = overlap * 0.6 + 0.4 // base of 0.4 — parallel directions have value even without overlap

  if (overlap > 0.5) {
    signals.push("you're both building toward something similar — directions aligned")
  } else if (overlap > 0.2) {
    signals.push("different trajectories — complementary directions rather than the same one")
  } else {
    signals.push("moving in different directions — could expand each other's horizon")
  }

  return { score, signals }
}

function scorePersonality(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  // personality inferred from communication + relational signal tone
  const combined_a = [...a.communication, ...a.relational]
  const combined_b = [...b.communication, ...b.relational]
  const overlap = keywordOverlap(combined_a, combined_b)
  const signals: string[] = []

  // mixed model — some similarity, some complementarity
  const score = overlap * 0.5 + (1 - overlap) * 0.3 + 0.2

  if (overlap > 0.5) {
    signals.push("similar energy — you'd recognize each other quickly")
  } else if (overlap > 0.2) {
    signals.push("complementary personalities — different approaches, compatible rhythms")
  }

  return { score, signals }
}

function scoreRelational(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  const overlap = keywordOverlap(a.relational, b.relational)
  const signals: string[] = []

  // relational: complementarity weighted more than similarity
  // high-give + high-receive is a resonance signal
  const aGiver = a.relational.join(" ").toLowerCase().includes("give") ||
    a.relational.join(" ").toLowerCase().includes("care")
  const bReceiver = b.relational.join(" ").toLowerCase().includes("need") ||
    b.relational.join(" ").toLowerCase().includes("looking")

  let score = overlap * 0.4 + 0.3

  if (aGiver && bReceiver) {
    score = Math.min(score + 0.3, 1)
    signals.push("energy exchange dynamic: high-give meets someone who receives well")
  } else if (overlap > 0.4) {
    signals.push("similar relational depth — both go beneath the surface")
  } else {
    signals.push("different relational styles — one leads, the other holds space differently")
  }

  return { score, signals }
}

function scoreCommunication(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  const overlap = keywordOverlap(a.communication, b.communication)
  const signals: string[] = []

  // communication: similarity preferred, extreme mismatch flagged
  const aText = a.communication.join(" ").toLowerCase()
  const bText = b.communication.join(" ").toLowerCase()

  const aDirect = aText.includes("direct") || aText.includes("honest") || aText.includes("straight")
  const bDirect = bText.includes("direct") || bText.includes("honest") || bText.includes("straight")

  let score = overlap * 0.6 + 0.2

  if (aDirect && bDirect) {
    score = Math.min(score + 0.2, 1)
    signals.push("similar communication directness — both say the hard thing without waiting for permission")
  } else if (aDirect !== bDirect) {
    score = Math.max(score - 0.1, 0)
    signals.push("different communication styles — direct meets indirect. interesting friction possible")
  } else {
    signals.push("communication styles are compatible — similar register")
  }

  return { score, signals }
}

function scoreMBTI(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  // MBTI inferred from combined signal tone
  // Simplified — full MBTI function analysis requires richer intake data
  const combined_a = [...a.values, ...a.narrative].join(" ").toLowerCase()
  const combined_b = [...b.values, ...b.narrative].join(" ").toLowerCase()

  const aIntuitive = combined_a.includes("pattern") || combined_a.includes("future") || combined_a.includes("meaning")
  const bIntuitive = combined_b.includes("pattern") || combined_b.includes("future") || combined_b.includes("meaning")

  const score = aIntuitive === bIntuitive ? 0.7 : 0.5
  return { score, signals: [] } // MBTI layer doesn't surface user-visible signals
}

function scoreAstrological(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  // Astrological: declared only — both must have engaged with it
  // Without birth data in schema yet, score conservatively
  return { score: 0.5, signals: [] }
}

// ─────────────────────────────────────────────
// PAID LAYER SCORING
// ─────────────────────────────────────────────

function scoreConflict(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  const aFriction = a.friction.join(" ").toLowerCase()
  const bFriction = b.friction.join(" ").toLowerCase()

  const aEngages = aFriction.includes("direct") || aFriction.includes("talk") || aFriction.length > 20
  const bEngages = bFriction.includes("direct") || bFriction.includes("talk") || bFriction.length > 20

  const signals: string[] = []
  let score = 0.5

  if (aEngages && bEngages) {
    score = 0.8
    signals.push("conflict style is complementary — both engage, both repair")
  } else if (aEngages !== bEngages) {
    score = 0.55
    signals.push("different conflict styles — one engages, the other steadies. can work if the gap is named")
  }

  return { score, signals }
}

function scoreLifeStage(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  const aNarrative = a.narrative.join(" ").toLowerCase()
  const bNarrative = b.narrative.join(" ").toLowerCase()

  const aReady = aNarrative.includes("ready") || aNarrative.includes("now")
  const bReady = bNarrative.includes("ready") || bNarrative.includes("now")
  const aExploring = aNarrative.includes("figuring") || aNarrative.includes("exploring")
  const bExploring = bNarrative.includes("figuring") || bNarrative.includes("exploring")

  const signals: string[] = []
  let score = 0.5

  if (aReady && bReady) {
    score = 0.85
    signals.push("timing alignment — both ready, not just available")
  } else if (aExploring && bExploring) {
    score = 0.75
    signals.push("both still figuring it out — that's honest common ground")
  } else if (aReady !== bReady) {
    score = 0.35
    signals.push("timing mismatch — one is ready, the other is still arriving")
  }

  return { score, signals }
}

function scoreEnergyExchange(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  const aText = [...a.relational, ...a.values].join(" ").toLowerCase()
  const bText = [...b.relational, ...b.values].join(" ").toLowerCase()

  const aGiver = aText.includes("give") || aText.includes("support") || aText.includes("care for")
  const bGiver = bText.includes("give") || bText.includes("support") || bText.includes("care for")

  const signals: string[] = []
  let score = 0.5

  if (aGiver && !bGiver) {
    score = 0.8
    signals.push("energy exchange dynamic: high-give meets someone who receives well and returns differently")
  } else if (aGiver && bGiver) {
    score = 0.55
    signals.push("both tend to give — worth watching that neither runs dry")
  }

  return { score, signals }
}

function scoreMediumPreference(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  // medium preference inferred from communication signals
  const aText = a.communication.join(" ").toLowerCase()
  const bText = b.communication.join(" ").toLowerCase()

  const aVoice = aText.includes("voice") || aText.includes("speak") || aText.includes("say")
  const bVoice = bText.includes("voice") || bText.includes("speak") || bText.includes("say")

  const score = aVoice === bVoice ? 0.75 : 0.45
  return { score, signals: [] }
}

// ─────────────────────────────────────────────
// RESONANCE SIGNAL GENERATION
// Picks the most meaningful signals to surface to the user
// ─────────────────────────────────────────────

function generateMutualSignals(a: SignalVector, b: SignalVector): string[] {
  const mutual: string[] = []

  const aArchetype = a.archetype
  const bArchetype = b.archetype

  if (aArchetype === bArchetype) {
    mutual.push(`both ${aArchetype} — similar way of moving through the world`)
  }

  const sharedValues = a.values.filter((v) =>
    b.values.some((bv) => bv.toLowerCase().includes(v.toLowerCase().slice(0, 6)))
  )
  if (sharedValues.length > 0) {
    mutual.push(`both lead with ${sharedValues[0]}`)
  }

  const aVoice = a.communication.join(" ").toLowerCase().includes("voice")
  const bVoice = b.communication.join(" ").toLowerCase().includes("voice")
  if (aVoice && bVoice) {
    mutual.push("both chose voice over text during intake")
  }

  return mutual.slice(0, 3)
}

// ─────────────────────────────────────────────
// MAIN SCORING FUNCTION
// ─────────────────────────────────────────────

export function scoreMatch(
  portraitA: Portrait,
  portraitB: Portrait,
  connectionType: ConnectionType,
  goDeeper: boolean = false
): MatchResult {
  const a = parseSignalVector(portraitA)
  const b = parseSignalVector(portraitB)

  const weights = goDeeper ? PAID_WEIGHTS : FREE_WEIGHTS

  // score all free layers
  const layerResults = [
    { layer: "values", ...scoreValues(a, b) },
    { layer: "narrative", ...scoreNarrative(a, b) },
    { layer: "personality", ...scorePersonality(a, b) },
    { layer: "relational", ...scoreRelational(a, b) },
    { layer: "communication", ...scoreCommunication(a, b) },
    { layer: "mbti", ...scoreMBTI(a, b) },
    { layer: "astrological", ...scoreAstrological(a, b) },
  ]

  // paid layers
  if (goDeeper) {
    layerResults.push(
      { layer: "conflict", ...scoreConflict(a, b) },
      { layer: "lifeStage", ...scoreLifeStage(a, b) },
      { layer: "energyExchange", ...scoreEnergyExchange(a, b) },
      { layer: "mediumPref", ...scoreMediumPreference(a, b) },
    )
  }

  // build layer score objects
  const layers: LayerScore[] = layerResults.map(({ layer, score, signals }) => {
    const weight = weights[layer]?.[connectionType] ?? 0.05
    return {
      layer,
      score,
      weight,
      weightedScore: score * weight,
      resonanceSignals: signals,
    }
  })

  // total score
  const totalScore = layers.reduce((sum, l) => sum + l.weightedScore, 0)

  // collect all resonance signals, sorted by weighted score
  const allSignals = layers
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .flatMap((l) => l.resonanceSignals)
    .filter(Boolean)

  const mutualSignals = generateMutualSignals(a, b)

  return {
    userId: a.userId,
    targetUserId: b.userId,
    connectionType,
    totalScore,
    layers,
    resonanceSignals: allSignals,
    mutualSignals,
    archetypeA: a.archetype,
    archetypeB: b.archetype,
    goDeeper,
  }
}

// ─────────────────────────────────────────────
// BATCH SCORING
// Scores a user against all available portraits
// Returns ranked results
// ─────────────────────────────────────────────

export function rankMatches(
  userPortrait: Portrait,
  candidates: Portrait[],
  connectionType: ConnectionType,
  goDeeper: boolean = false
): MatchResult[] {
  return candidates
    .filter((c) => c.userId !== userPortrait.userId)
    .filter((c) => c.readyForMatching)
    .map((c) => scoreMatch(userPortrait, c, connectionType, goDeeper))
    .sort((a, b) => b.totalScore - a.totalScore)
}

/**
 * [us] match engine — full 7-layer scoring (free) + 4-layer (paid)
 */

import type { InferSelectModel } from "drizzle-orm"
import type { intakePortraits } from "@/lib/db/schema"

export type ConnectionType = "romantic" | "platonic" | "professional" | "open"
export type Portrait = InferSelectModel<typeof intakePortraits>

export interface SignalVector {
  values: string[]
  narrative: string[]
  relational: string[]
  communication: string[]
  friction: string[]
  archetype: string
  connectionType: ConnectionType
  userId: string
}

export interface LayerScore {
  layer: string
  score: number
  weight: number
  weightedScore: number
  resonanceSignals: string[]
}

export interface MatchResult {
  userId: string
  targetUserId: string
  connectionType: ConnectionType
  totalScore: number
  layers: LayerScore[]
  resonanceSignals: string[]
  mutualSignals: string[]
  archetypeA: string
  archetypeB: string
  goDeeper: boolean
}

const FREE_WEIGHTS: Record<ConnectionType, Record<string, number>> = {
  romantic:     { values: 0.22, narrative: 0.18, personality: 0.16, relational: 0.20, communication: 0.14, mbti: 0.06, astrological: 0.04 },
  platonic:     { values: 0.25, narrative: 0.20, personality: 0.18, relational: 0.16, communication: 0.12, mbti: 0.06, astrological: 0.03 },
  professional: { values: 0.28, narrative: 0.22, personality: 0.14, relational: 0.12, communication: 0.18, mbti: 0.05, astrological: 0.01 },
  open:         { values: 0.24, narrative: 0.19, personality: 0.16, relational: 0.18, communication: 0.13, mbti: 0.06, astrological: 0.04 },
}

const PAID_WEIGHTS: Record<ConnectionType, Record<string, number>> = {
  romantic:     { conflict: 0.12, lifeStage: 0.10, energyExchange: 0.10, mediumPreference: 0.08 },
  platonic:     { conflict: 0.10, lifeStage: 0.08, energyExchange: 0.12, mediumPreference: 0.10 },
  professional: { conflict: 0.08, lifeStage: 0.12, energyExchange: 0.08, mediumPreference: 0.12 },
  open:         { conflict: 0.10, lifeStage: 0.10, energyExchange: 0.10, mediumPreference: 0.10 },
}

export function parseSignalVector(portrait: Portrait): SignalVector {
  const safe = (raw: string | null | undefined): string[] => {
    if (!raw) return []
    try { return JSON.parse(raw) as string[] } catch { return [] }
  }
  return {
    values: safe(portrait.valuesSignals),
    narrative: safe(portrait.narrativeSignals),
    relational: safe(portrait.relationalSignals),
    communication: safe(portrait.communicationSignals),
    friction: safe(portrait.frictionSignals),
    archetype: portrait.archetype ?? "composite",
    connectionType: (portrait.connectionType ?? "open") as ConnectionType,
    userId: portrait.userId,
  }
}

function jaccardSimilarity(a: string[], b: string[]): number {
  if (!a.length && !b.length) return 0.5
  if (!a.length || !b.length) return 0.1
  const setA = new Set(a.map((s) => s.toLowerCase()))
  const setB = new Set(b.map((s) => s.toLowerCase()))
  const intersection = [...setA].filter((x) => setB.has(x)).length
  const union = new Set([...setA, ...setB]).size
  return intersection / union
}

function keywordOverlap(a: string[], b: string[]): { score: number; shared: string[] } {
  if (!a.length || !b.length) return { score: 0.3, shared: [] }
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim()
  const wordsA = new Set(a.flatMap((s) => normalize(s).split(/\s+/)).filter((w) => w.length > 3))
  const wordsB = new Set(b.flatMap((s) => normalize(s).split(/\s+/)).filter((w) => w.length > 3))
  const shared = [...wordsA].filter((w) => wordsB.has(w))
  const score = shared.length / Math.max(Math.min(wordsA.size, wordsB.size), 1)
  return { score: Math.min(score, 1), shared }
}

function complementarity(a: string[], b: string[]): number {
  const giverA = a.some((s) => /give|support|care|nurture|there for/i.test(s))
  const giverB = b.some((s) => /give|support|care|nurture|there for/i.test(s))
  const receiverA = a.some((s) => /need|receive|looking for|want someone/i.test(s))
  const receiverB = b.some((s) => /need|receive|looking for|want someone/i.test(s))
  if ((giverA && receiverB) || (giverB && receiverA)) return 0.85
  if (giverA && giverB) return 0.70
  return 0.50
}

function scoreValues(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  const { score, shared } = keywordOverlap(a.values, b.values)
  return { score: Math.max(score, 0.2), signals: shared.slice(0, 3).map((w) => `shared value: ${w}`) }
}

function scoreNarrative(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  const { score: overlap, shared } = keywordOverlap(a.narrative, b.narrative)
  return { score: Math.min(0.4 + overlap * 0.6, 1), signals: shared.slice(0, 2).map((w) => `aligned direction: ${w}`) }
}

function scorePersonality(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  const commScore = jaccardSimilarity(a.communication, b.communication)
  const relScore = complementarity(a.relational, b.relational)
  const signals: string[] = []
  if (commScore > 0.5) signals.push("compatible communication styles")
  if (relScore > 0.7) signals.push("complementary relational energy")
  return { score: commScore * 0.4 + relScore * 0.6, signals }
}

function scoreRelational(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  const comp = complementarity(a.relational, b.relational)
  const overlap = jaccardSimilarity(a.relational, b.relational)
  const signals: string[] = []
  if (comp > 0.8) signals.push("give/receive balance")
  if (overlap > 0.4) signals.push("shared relational language")
  return { score: comp * 0.6 + overlap * 0.4, signals }
}

function scoreCommunication(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  const directA = a.communication.some((s) => /direct|straight|upfront|honest/i.test(s))
  const directB = b.communication.some((s) => /direct|straight|upfront|honest/i.test(s))
  const indirectA = a.communication.some((s) => /indirect|careful|gentle|subtle/i.test(s))
  const indirectB = b.communication.some((s) => /indirect|careful|gentle|subtle/i.test(s))
  const match = (directA && directB) || (indirectA && indirectB)
  const mismatch = (directA && indirectB) || (directB && indirectA)
  return { score: match ? 0.85 : mismatch ? 0.45 : 0.65, signals: match ? ["matching communication directness"] : [] }
}

function scoreMBTI(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  const intuitiveA = [...a.values, ...a.narrative].some((s) => /meaning|purpose|possibility|pattern|why/i.test(s))
  const intuitiveB = [...b.values, ...b.narrative].some((s) => /meaning|purpose|possibility|pattern|why/i.test(s))
  return { score: intuitiveA === intuitiveB ? 0.70 : 0.55, signals: [] }
}

function scoreAstrological(_a: SignalVector, _b: SignalVector): { score: number; signals: string[] } {
  return { score: 0.5, signals: [] }
}

function scoreConflict(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  const engagedA = a.friction.length > 0
  const engagedB = b.friction.length > 0
  if (engagedA && engagedB) {
    const { score } = keywordOverlap(a.friction, b.friction)
    return { score: 0.6 + score * 0.4, signals: score > 0.3 ? ["shared approach to repair"] : [] }
  }
  return { score: !engagedA && !engagedB ? 0.55 : 0.45, signals: [] }
}

function scoreLifeStage(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  const readyA = a.narrative.some((s) => /ready|now|soon|waiting/i.test(s))
  const readyB = b.narrative.some((s) => /ready|now|soon|waiting/i.test(s))
  const exploringA = a.narrative.some((s) => /figuring|becoming|exploring|open/i.test(s))
  const exploringB = b.narrative.some((s) => /figuring|becoming|exploring|open/i.test(s))
  const aligned = (readyA && readyB) || (exploringA && exploringB)
  return { score: aligned ? 0.80 : 0.50, signals: aligned ? ["aligned life stage"] : [] }
}

function scoreEnergyExchange(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  const giveA = [...a.values, ...a.relational].some((s) => /give|support|there for|show up/i.test(s))
  const giveB = [...b.values, ...b.relational].some((s) => /give|support|there for|show up/i.test(s))
  return { score: giveA && giveB ? 0.75 : !giveA && !giveB ? 0.55 : 0.70, signals: giveA && giveB ? ["mutual investment orientation"] : [] }
}

function scoreMediumPreference(a: SignalVector, b: SignalVector): { score: number; signals: string[] } {
  const voiceA = a.communication.some((s) => /voice|speak|say|talk/i.test(s))
  const voiceB = b.communication.some((s) => /voice|speak|say|talk/i.test(s))
  return { score: voiceA === voiceB ? 0.75 : 0.55, signals: [] }
}

function generateMutualSignals(a: SignalVector, b: SignalVector, archetypeA: string, archetypeB: string): string[] {
  const signals: string[] = []
  if (archetypeA === archetypeB) signals.push(`both ${archetypeA}`)
  const { shared } = keywordOverlap(a.values, b.values)
  if (shared.length > 0) signals.push(`both value: ${shared[0]}`)
  const voiceA = a.communication.some((s) => /voice|speak/i.test(s))
  const voiceB = b.communication.some((s) => /voice|speak/i.test(s))
  if (voiceA && voiceB) signals.push("both chose voice")
  return signals.slice(0, 3)
}

const ARCHETYPE_AFFINITY: Record<string, string[]> = {
  rooted:    ["intimate", "current", "rooted"],
  horizon:   ["liminal", "horizon", "composite"],
  intimate:  ["rooted", "celestial", "intimate"],
  current:   ["rooted", "current", "composite"],
  liminal:   ["horizon", "celestial", "liminal"],
  celestial: ["intimate", "liminal", "celestial"],
  composite: ["composite", "horizon", "current"],
}

function archetypeBonus(a: string, b: string): number {
  const affinityA = ARCHETYPE_AFFINITY[a] ?? []
  const affinityB = ARCHETYPE_AFFINITY[b] ?? []
  if (affinityA.includes(b) && affinityB.includes(a)) return 0.05
  if (affinityA.includes(b) || affinityB.includes(a)) return 0.025
  return 0
}

export function scoreMatch(
  portraitA: Portrait,
  portraitB: Portrait,
  connectionType: ConnectionType,
  goDeeper: boolean
): MatchResult {
  const a = parseSignalVector(portraitA)
  const b = parseSignalVector(portraitB)

  const freeWeights = FREE_WEIGHTS[connectionType]
  const paidWeights = PAID_WEIGHTS[connectionType]

  const freeLayers = [
    { key: "values",        fn: () => scoreValues(a, b) },
    { key: "narrative",     fn: () => scoreNarrative(a, b) },
    { key: "personality",   fn: () => scorePersonality(a, b) },
    { key: "relational",    fn: () => scoreRelational(a, b) },
    { key: "communication", fn: () => scoreCommunication(a, b) },
    { key: "mbti",          fn: () => scoreMBTI(a, b) },
    { key: "astrological",  fn: () => scoreAstrological(a, b) },
  ]

  const paidLayers = [
    { key: "conflict",         fn: () => scoreConflict(a, b) },
    { key: "lifeStage",        fn: () => scoreLifeStage(a, b) },
    { key: "energyExchange",   fn: () => scoreEnergyExchange(a, b) },
    { key: "mediumPreference", fn: () => scoreMediumPreference(a, b) },
  ]

  const activeLayers = goDeeper ? [...freeLayers, ...paidLayers] : freeLayers
  const activeWeights = goDeeper ? { ...freeWeights, ...paidWeights } : freeWeights

  const weightSum = Object.values(activeWeights).reduce((a, b) => a + b, 0)
  const normalizedWeights: Record<string, number> = {}
  for (const [k, v] of Object.entries(activeWeights)) normalizedWeights[k] = v / weightSum

  const layers: LayerScore[] = []
  let totalScore = 0
  const allResonanceSignals: string[] = []

  for (const { key, fn } of activeLayers) {
    const weight = normalizedWeights[key] ?? 0
    const { score, signals } = fn()
    const weightedScore = score * weight
    totalScore += weightedScore
    allResonanceSignals.push(...signals)
    layers.push({ layer: key, score, weight, weightedScore, resonanceSignals: signals })
  }

  totalScore = Math.min(totalScore + archetypeBonus(a.archetype, b.archetype), 1)

  return {
    userId: portraitA.userId,
    targetUserId: portraitB.userId,
    connectionType,
    totalScore,
    layers,
    resonanceSignals: allResonanceSignals.slice(0, 5),
    mutualSignals: generateMutualSignals(a, b, a.archetype, b.archetype),
    archetypeA: a.archetype,
    archetypeB: b.archetype,
    goDeeper,
  }
}

export function rankMatches(
  userPortrait: Portrait,
  candidates: Portrait[],
  connectionType: ConnectionType,
  goDeeper: boolean
): MatchResult[] {
  return candidates
    .filter((c) => c.userId !== userPortrait.userId)
    .map((c) => scoreMatch(userPortrait, c, connectionType, goDeeper))
    .sort((a, b) => b.totalScore - a.totalScore)
}

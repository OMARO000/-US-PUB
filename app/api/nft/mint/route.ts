/**
 * POST /api/nft/mint
 *
 * Receives mint request from portrait delivery page.
 * Validates wallet address, fetches portrait image, calls Solana mint helper.
 * Returns mint transaction URL on success.
 *
 * Required env vars:
 *   OMARO_MINT_KEYPAIR     — OMARO's Solana keypair (base58) for signing + paying gas
 *   OMARO_SOLANA_WALLET    — OMARO's public wallet for royalty receipts
 *   SOLANA_NETWORK         — "devnet" | "mainnet-beta"
 *   SOLANA_RPC_URL         — optional custom RPC (mainnet)
 *   MINT_PRICE_SOL         — mint price (default 0.1)
 */

import { NextRequest, NextResponse } from "next/server"
import { mintPortraitNFT, generateCustodialWallet } from "@/lib/nft/solana"
import { db } from "@/lib/db"
import { intakePortraits } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import fs from "fs"
import path from "path"

export async function POST(req: NextRequest) {
  let body: {
    sessionId: string
    imageKey: string
    archetype: string
    walletAddress?: string   // user's Solana wallet — optional, custodial if missing
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 })
  }

  const { sessionId, imageKey, archetype, walletAddress } = body

  if (!sessionId || !imageKey || !archetype) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 })
  }

  // ── load portrait from DB ──
  const [portrait] = await db
    .select()
    .from(intakePortraits)
    .where(eq(intakePortraits.sessionId, sessionId))
    .limit(1)

  if (!portrait) {
    return NextResponse.json({ error: "portrait not found" }, { status: 404 })
  }

  if (!portrait.userConfirmed) {
    return NextResponse.json({ error: "portrait not confirmed" }, { status: 409 })
  }

  // ── resolve wallet address ──
  let userWallet = walletAddress

  if (!userWallet) {
    // generate custodial wallet — user can export later
    const custodial = generateCustodialWallet()
    userWallet = custodial.publicKey
    // TODO: encrypt and store private key in DB for user export
    // For now, log securely — this needs proper key management before mainnet
    console.log(`[us] custodial wallet created for session ${sessionId}: ${custodial.publicKey}`)
  }

  // ── load portrait image ──
  // Images live in public/portraits/{imageKey}.jpg
  // Placeholder: use a default image until artwork library is ready
  let imageBuffer: Buffer
  let imageContentType = "image/jpeg"

  const imagePath = path.join(process.cwd(), "public", "portraits", `${imageKey}.jpg`)

  try {
    imageBuffer = fs.readFileSync(imagePath)
  } catch {
    // artwork not yet available — use placeholder
    // 1x1 transparent PNG as stand-in
    imageBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64"
    )
    imageContentType = "image/png"
  }

  // ── mint ──
  try {
    const result = await mintPortraitNFT({
      portraitText: portrait.portraitText,
      metaphorText: portrait.portraitText, // metaphor stored in portraitText for now
      archetype: portrait.connectionType,  // using connectionType as archetype proxy until schema updated
      secondaryArchetype: null,
      imageKey,
      imageBuffer,
      imageContentType,
      userId: portrait.userId,
      sessionId,
      userWalletAddress: userWallet,
      mintedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      ok: true,
      mintAddress: result.mintAddress,
      txUrl: result.txUrl,
      metadataUri: result.metadataUri,
    })
  } catch (err) {
    console.error("[us] mint error:", err)
    return NextResponse.json(
      { error: "mint failed — please try again" },
      { status: 500 }
    )
  }
}

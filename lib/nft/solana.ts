/**
 * [us] NFT minting — Solana + Metaplex
 *
 * Mints a portrait NFT on Solana mainnet (or devnet for testing).
 * Uses Metaplex JS SDK for NFT creation.
 * Portrait image uploaded to IPFS via Pinata before minting.
 *
 * Mint price: 0.1–0.2 SOL (set in MINT_PRICE_SOL env var)
 * Royalties: 5% (500 basis points)
 * OMARO treasury receives mint revenue.
 *
 * Setup:
 *   npm install @metaplex-foundation/js @solana/web3.js
 */

import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
} from "@metaplex-foundation/js"
import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js"
import bs58 from "bs58"

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

const SOLANA_NETWORK = (process.env.SOLANA_NETWORK ?? "devnet") as
  | "devnet"
  | "mainnet-beta"

const OMARO_TREASURY = process.env.OMARO_SOLANA_WALLET ?? ""  // OMARO's public wallet address
const MINT_PRICE_SOL = parseFloat(process.env.MINT_PRICE_SOL ?? "0.1")
const SELLER_FEE_BASIS_POINTS = 500  // 5% royalties on secondary sales

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface MintPortraitInput {
  portraitText: string
  metaphorText: string
  archetype: string
  secondaryArchetype: string | null
  imageKey: string
  imageBuffer: Buffer      // the portrait image file
  imageContentType: string // "image/jpeg" or "image/png"
  userId: string           // anonymized
  sessionId: string
  userWalletAddress: string // the user's Solana wallet — they receive the NFT
  mintedAt: string         // ISO timestamp
}

export interface MintPortraitResult {
  mintAddress: string
  txSignature: string
  txUrl: string
  metadataUri: string
}

// ─────────────────────────────────────────────
// METAPLEX CLIENT
// ─────────────────────────────────────────────

function getMetaplex(): Metaplex {
  // OMARO's minting keypair — pays gas, signs the mint
  // Stored as base58-encoded private key in env
  const privateKeyBase58 = process.env.OMARO_MINT_KEYPAIR
  if (!privateKeyBase58) throw new Error("[us] OMARO_MINT_KEYPAIR not set")

  const keypair = Keypair.fromSecretKey(bs58.decode(privateKeyBase58))
  const connection = new Connection(
    SOLANA_NETWORK === "mainnet-beta"
      ? (process.env.SOLANA_RPC_URL ?? clusterApiUrl("mainnet-beta"))
      : clusterApiUrl("devnet")
  )

  return Metaplex.make(connection)
    .use(keypairIdentity(keypair))
    .use(
      bundlrStorage({
        address:
          SOLANA_NETWORK === "mainnet-beta"
            ? "https://node1.bundlr.network"
            : "https://devnet.bundlr.network",
        providerUrl:
          SOLANA_NETWORK === "mainnet-beta"
            ? (process.env.SOLANA_RPC_URL ?? clusterApiUrl("mainnet-beta"))
            : clusterApiUrl("devnet"),
        timeout: 60000,
      })
    )
}

// ─────────────────────────────────────────────
// NFT METADATA BUILDER
// ─────────────────────────────────────────────

function buildMetadata(input: MintPortraitInput, imageUri: string) {
  return {
    name: `[us] portrait — ${input.archetype}`,
    symbol: "US",
    description: input.portraitText,
    image: imageUri,
    attributes: [
      { trait_type: "archetype", value: input.archetype },
      ...(input.secondaryArchetype
        ? [{ trait_type: "secondary_archetype", value: input.secondaryArchetype }]
        : []),
      { trait_type: "portrait_metaphor", value: input.metaphorText },
      { trait_type: "platform", value: "[us] by OMARO PBC" },
      { trait_type: "minted_at", value: input.mintedAt },
    ],
    properties: {
      files: [{ uri: imageUri, type: input.imageContentType }],
      category: "image",
      creators: [
        {
          address: OMARO_TREASURY,
          share: 100,
        },
      ],
    },
    seller_fee_basis_points: SELLER_FEE_BASIS_POINTS,
  }
}

// ─────────────────────────────────────────────
// MAIN MINT FUNCTION
// ─────────────────────────────────────────────

export async function mintPortraitNFT(
  input: MintPortraitInput
): Promise<MintPortraitResult> {
  const metaplex = getMetaplex()

  // 1. upload image to Arweave via Bundlr
  const imageFile = toMetaplexFile(input.imageBuffer, `${input.imageKey}.jpg`, {
    contentType: input.imageContentType,
  })
  const imageUri = await metaplex.storage().upload(imageFile)

  // 2. upload metadata JSON
  const metadata = buildMetadata(input, imageUri)
  const { uri: metadataUri } = await metaplex.nfts().uploadMetadata(metadata)

  // 3. mint NFT to user's wallet
  const { nft, response } = await metaplex.nfts().create({
    uri: metadataUri,
    name: metadata.name,
    symbol: metadata.symbol,
    sellerFeeBasisPoints: SELLER_FEE_BASIS_POINTS,
    tokenOwner: new PublicKey(input.userWalletAddress),
    creators: OMARO_TREASURY
      ? [
          {
            address: new PublicKey(OMARO_TREASURY),
            share: 100,
          },
        ]
      : undefined,
    isMutable: false,   // portrait is permanent
  })

  const explorer =
    SOLANA_NETWORK === "mainnet-beta"
      ? `https://explorer.solana.com/tx/${response.signature}`
      : `https://explorer.solana.com/tx/${response.signature}?cluster=devnet`

  return {
    mintAddress: nft.address.toString(),
    txSignature: response.signature,
    txUrl: explorer,
    metadataUri,
  }
}

// ─────────────────────────────────────────────
// CUSTODIAL WALLET CREATION
// For users who don't have a Solana wallet yet
// Creates a keypair, stores encrypted in DB, gives user export instructions
// ─────────────────────────────────────────────

export function generateCustodialWallet(): {
  publicKey: string
  privateKeyBase58: string
} {
  const keypair = Keypair.generate()
  return {
    publicKey: keypair.publicKey.toString(),
    privateKeyBase58: bs58.encode(keypair.secretKey),
  }
}

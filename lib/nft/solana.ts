/**
 * [us] NFT minting — Solana + Metaplex UMI
 *
 * Mints a portrait NFT on Solana mainnet (or devnet for testing).
 * Uses Metaplex UMI + mpl-token-metadata for NFT creation.
 * Portrait image uploaded to Arweave via Irys before minting.
 *
 * Mint price: 0.1–0.2 SOL (set in MINT_PRICE_SOL env var)
 * Royalties: 5% (500 basis points)
 * OMARO treasury receives mint revenue.
 *
 * Setup:
 *   npm install @metaplex-foundation/umi @metaplex-foundation/umi-bundle-defaults \
 *     @metaplex-foundation/mpl-token-metadata @metaplex-foundation/umi-uploader-irys \
 *     @solana/web3.js bs58
 */

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata"
import {
  createGenericFile,
  createSignerFromKeypair,
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey as umiPublicKey,
} from "@metaplex-foundation/umi"
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters"
import { Keypair } from "@solana/web3.js"
import bs58 from "bs58"

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

const SOLANA_NETWORK = (process.env.SOLANA_NETWORK ?? "devnet") as
  | "devnet"
  | "mainnet-beta"

const OMARO_TREASURY = process.env.OMARO_SOLANA_WALLET ?? ""
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
// UMI CLIENT
// ─────────────────────────────────────────────

function getUmi() {
  const privateKeyBase58 = process.env.OMARO_MINT_KEYPAIR
  if (!privateKeyBase58) throw new Error("[us] OMARO_MINT_KEYPAIR not set")

  const web3Keypair = Keypair.fromSecretKey(bs58.decode(privateKeyBase58))

  const endpoint =
    SOLANA_NETWORK === "mainnet-beta"
      ? (process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com")
      : "https://api.devnet.solana.com"

  const umi = createUmi(endpoint)
    .use(mplTokenMetadata())
    .use(
      irysUploader({
        address:
          SOLANA_NETWORK === "mainnet-beta"
            ? "https://node1.irys.xyz"
            : "https://devnet.irys.xyz",
        providerUrl: endpoint,
        timeout: 60000,
      })
    )

  const umiKeypair = fromWeb3JsKeypair(web3Keypair)
  const signer = createSignerFromKeypair(umi, umiKeypair)
  umi.use(keypairIdentity(signer))

  return umi
}

// ─────────────────────────────────────────────
// NFT METADATA BUILDER
// ─────────────────────────────────────────────

function buildMetadataJson(input: MintPortraitInput, imageUri: string) {
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
      creators: OMARO_TREASURY
        ? [{ address: OMARO_TREASURY, share: 100 }]
        : [],
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
  const umi = getUmi()

  // 1. upload image to Arweave via Irys
  const imageFile = createGenericFile(
    new Uint8Array(input.imageBuffer),
    `${input.imageKey}.jpg`,
    { contentType: input.imageContentType }
  )
  const [imageUri] = await umi.uploader.upload([imageFile])

  // 2. upload metadata JSON
  const metadataJson = buildMetadataJson(input, imageUri)
  const metadataUri = await umi.uploader.uploadJson(metadataJson)

  // 3. mint NFT to user's wallet
  const mintSigner = generateSigner(umi)

  const creators = OMARO_TREASURY
    ? [{ address: umiPublicKey(OMARO_TREASURY), share: 100, verified: false }]
    : undefined

  const { signature } = await createNft(umi, {
    mint: mintSigner,
    name: metadataJson.name,
    symbol: metadataJson.symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(SELLER_FEE_BASIS_POINTS / 100, 2),
    tokenOwner: umiPublicKey(input.userWalletAddress),
    creators,
    isMutable: false,
  }).sendAndConfirm(umi)

  const txSignature = bs58.encode(signature)
  const explorer =
    SOLANA_NETWORK === "mainnet-beta"
      ? `https://explorer.solana.com/tx/${txSignature}`
      : `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`

  return {
    mintAddress: mintSigner.publicKey.toString(),
    txSignature,
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

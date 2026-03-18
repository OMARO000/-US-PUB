"use client"

/**
 * /privacy — Privacy Policy
 *
 * Substantive stub. Real structure, real content.
 * Needs attorney review before launch.
 * Reflects [us] sovereignty-by-design data principles.
 */

import Sidebar from "@/components/sidebar/Sidebar"

const LAST_UPDATED = "March 2026"
const EFFECTIVE_DATE = "March 2026"

const SECTIONS = [
  {
    title: "1. our commitment",
    content: `[us] is built on a principle we call sovereignty by design. your data belongs to you. we collect only what is necessary to operate the platform, we are transparent about what we collect and why, and we give you control over your data at all times.

we do not sell your data. we do not share your data with advertisers. we do not use third-party data brokers. we do not passively track your device or behavior outside of [us].

this policy explains what we collect, how we use it, and what rights you have.`,
  },
  {
    title: "2. who this policy applies to",
    content: `This policy applies to all users of [us], operated by One Plus LLC, a subsidiary of OMARO PBC.

Contact: hello@omaro-pbc.org
Privacy inquiries: legal@omaro-pbc.org`,
  },
  {
    title: "3. what we collect",
    content: `We maintain two types of data about you:

DECLARED DATA — what you tell us directly
This includes: your responses during intake, portrait corrections and additions, journal entries, connection type preferences, theme and voice preferences, and any explicit profile information you provide. Declared data belongs entirely to you. You can view, edit, export, and delete it at any time.

OBSERVED DATA — what [you] notices across your behavior
This includes: how you communicate during conversations (voice vs text, message length, response patterns), signals derived from your intake responses (used to build your match profile), and patterns observed across your connections over time. Observed data is used by the match engine and, for paid users, surfaced as pattern recognition insights.

TECHNICAL DATA — standard operational data
This includes: your anonymous account identifier, session data, device type, and error logs. We do not collect your IP address for profiling purposes. We do not use cookies for tracking.

We do NOT collect:
— Your real name, email address, or phone number (unless you provide them voluntarily)
— Location data
— Social media profiles or connections
— Any data from third-party sources`,
  },
  {
    title: "4. how we use your data",
    content: `We use your data for the following purposes:

OPERATING THE PLATFORM — providing the intake conversation, generating your portrait, running the match engine, and delivering coaching features.

IMPROVING MATCHING — with your explicit consent, anonymized and aggregated signal data from your observed profile contributes to improving the match engine over time. You can withdraw this consent at any time in [settings].

RESEARCH (FUTURE) — anonymized, aggregated data may be used by OMARO Human Connection Institute for academic research into human connection. This research is conducted only with appropriate consent and ethical oversight.

We do not use your data for advertising, behavioral profiling for third parties, or any purpose not described in this policy.`,
  },
  {
    title: "5. the two-profile system",
    content: `[us] maintains two distinct profiles for every user:

YOUR DECLARED PROFILE — visible to you at all times in [profile]. You can correct, add to, and export this profile. It includes what you explicitly told [you] during intake and any corrections you've made since.

YOUR OBSERVED PROFILE — used internally by the match engine. For paid users, this becomes visible as pattern recognition insights in [insights]. We never present observed data as definitive labels — we surface observations, not verdicts. You can correct observed signals in [profile].

The gap between your declared and observed profile is never shown to you directly — it is used only to improve the accuracy of your matches.`,
  },
  {
    title: "6. data sharing",
    content: `We share your data only in the following limited circumstances:

SERVICE PROVIDERS — we use the following third-party services to operate the platform:
— Anthropic (Claude API) — for AI conversation and portrait generation
— ElevenLabs — for voice synthesis
— Deepgram — for speech-to-text transcription
— Stripe — for payment processing (paid tier only)
— Hetzner — for server infrastructure
— Pinata/IPFS — for NFT metadata storage

Each of these providers is bound by data processing agreements and may not use your data for their own purposes.

LEGAL REQUIREMENTS — we may disclose data if required by law, court order, or to protect the safety of users or the public.

BUSINESS TRANSFERS — in the event of a merger, acquisition, or sale of assets, user data may be transferred. We will notify users before any such transfer and provide the option to delete their account.

We do not share your data with any other third parties.`,
  },
  {
    title: "7. NFTs and blockchain data",
    content: `If you choose to mint your portrait as an NFT, the following data will be written to the Solana blockchain and will be publicly visible and permanently stored:

— Your portrait image
— Your written portrait text
— Your portrait archetype
— The timestamp of minting
— The platform identifier "[us] by OMARO PBC"

Your anonymous user ID is included in NFT metadata in hashed form only. No personally identifying information is included.

Once minted, blockchain data cannot be deleted or altered. Please consider this carefully before minting.`,
  },
  {
    title: "8. data retention",
    content: `We retain your data for as long as your account is active.

If you delete your account, all your data is permanently deleted from our systems within 30 days, except:
— Data that has been minted to the blockchain (which cannot be deleted)
— Anonymized, aggregated research data that has already been included in research datasets (which does not identify you)
— Data we are required to retain by law

Journal entries: retained until you delete them or your account.
Match scores: retained for 12 months after last activity.
Conversation logs: retained for 24 months to support pattern recognition features.`,
  },
  {
    title: "9. your rights",
    content: `You have the following rights regarding your data:

ACCESS — you can view your declared profile at any time in [profile].

CORRECTION — you can correct your declared profile at any time. You can flag inaccuracies in your observed profile in [profile].

EXPORT — you can export all your data (portrait, declared profile, journal entries) from [profile] → [export] at any time.

DELETION — you can delete your account and all associated data from [profile] → [delete account]. Deletion is permanent and immediate.

CONSENT WITHDRAWAL — you can withdraw consent for your data to be used in match engine improvement at any time in [settings].

For additional data rights requests, contact legal@omaro-pbc.org. We will respond within 30 days.`,
  },
  {
    title: "10. children's privacy",
    content: `[us] is not intended for users under 18 years of age. We do not knowingly collect data from minors. If we become aware that a user is under 18, we will delete their account and associated data immediately.

If you believe a minor has created an account, please contact legal@omaro-pbc.org.`,
  },
  {
    title: "11. security",
    content: `We implement reasonable technical and organizational measures to protect your data, including:

— Encrypted data storage
— Anonymous account system (no email or real name required)
— Encrypted custodial wallet keys (where applicable)
— Access controls limiting who can access user data internally
— Regular security reviews

No system is completely secure. We cannot guarantee absolute security. In the event of a data breach that affects your personal information, we will notify you as required by applicable law.`,
  },
  {
    title: "12. international users",
    content: `[us] is operated from the United States. If you are accessing [us] from outside the United States, your data will be transferred to and processed in the United States.

If you are located in the European Economic Area, United Kingdom, or other regions with data protection laws, you may have additional rights. We are working to ensure compliance with applicable international data protection requirements. Contact legal@omaro-pbc.org for inquiries.`,
  },
  {
    title: "13. changes to this policy",
    content: `We may update this policy from time to time. We will notify you of material changes by posting a notice within the platform at least 14 days before the effective date.

Your continued use of [us] after the effective date of an updated policy constitutes your acceptance.`,
  },
  {
    title: "14. contact",
    content: `For privacy inquiries, data requests, or concerns:

Email: legal@omaro-pbc.org
Website: omaro-pbc.org

One Plus LLC / OMARO PBC
Sovereign by design.`,
  },
]

export default function PrivacyPage() {
  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "var(--bg)" }}>
      <Sidebar />
      <main style={{
        marginLeft: "var(--sidebar-width)",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        width: "calc(100vw - var(--sidebar-width))",
      }}>
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "48px 40px 80px",
          maxWidth: "860px",
          width: "100%",
          margin: "0 auto",
        }}>

          {/* Header */}
          <div style={{ marginBottom: "48px" }}>
            <div style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              color: "var(--amber)",
              letterSpacing: "0.1em",
              marginBottom: "12px",
              opacity: 0.8,
            }}>
              [privacy policy]
            </div>
            <h1 style={{
              fontSize: "28px",
              fontFamily: "var(--font-sans)",
              color: "var(--text)",
              fontWeight: 300,
              letterSpacing: "-0.5px",
              margin: 0,
              marginBottom: "12px",
            }}>
              privacy policy
            </h1>
            <div style={{
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              color: "var(--dim)",
              fontWeight: 300,
            }}>
              last updated: {LAST_UPDATED} · effective: {EFFECTIVE_DATE}
            </div>
            <div style={{
              marginTop: "20px",
              padding: "16px",
              borderRadius: "10px",
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              color: "var(--muted)",
              fontWeight: 300,
              lineHeight: 1.7,
            }}>
              your data belongs to you. this policy explains what we collect, how we use it, and how you stay in control. sovereignty by design is not a marketing phrase — it is how [us] is built.
            </div>
          </div>

          {/* Sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <div style={{
                  fontSize: "13px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--amber)",
                  letterSpacing: "0.05em",
                  marginBottom: "12px",
                  opacity: 0.9,
                }}>
                  {section.title}
                </div>
                <div style={{
                  fontSize: "14px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text)",
                  fontWeight: 300,
                  lineHeight: 1.8,
                  whiteSpace: "pre-line",
                }}>
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: "60px",
            paddingTop: "24px",
            borderTop: "1px solid var(--border)",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--dim)",
            lineHeight: 1.7,
          }}>
            [us] is a product of One Plus LLC, a subsidiary of OMARO PBC. sovereign by design.
          </div>

        </div>
      </main>
    </div>
  )
}

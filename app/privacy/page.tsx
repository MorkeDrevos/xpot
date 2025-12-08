// app/privacy/page.tsx
import React from 'react';
import { XpotPageShell } from '@/components/XpotPageShell';

export const metadata = {
  title: 'Privacy Policy | XPOT',
};

const LAST_UPDATED = '27 November 2025';

export default function PrivacyPage() {
  return (
    <XpotPageShell>
      <main className="mx-auto max-w-3xl">
        {/* Header block */}
        <header className="mb-6 rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950 px-6 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.7)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
            XPOT Protocol
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-50 sm:text-3xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Last updated:{' '}
            <span className="font-medium text-slate-200">
              {LAST_UPDATED}
            </span>
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            This Privacy Policy explains how <strong>XPOT</strong> (“XPOT”,
            “we”, “us”, “our”) collects, uses and protects information when
            you use xpot.bet and related services (the “Service”). By using
            XPOT, you agree to the collection and use of information in
            accordance with this Policy.
          </p>
        </header>

        {/* Content card */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/95 px-6 py-7 text-sm leading-relaxed text-slate-300 shadow-[0_24px_80px_rgba(15,23,42,0.9)]">
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-slate-50">
                1. Information we collect
              </h2>

              <h3 className="mt-3 text-[13px] font-semibold text-slate-100">
                a) Information from your X account
              </h3>
              <p className="mt-1">
                When you log in with X, we may receive:
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>Your X user ID and handle (@username)</li>
                <li>Display name and profile image</li>
                <li>Basic profile information provided by X’s API</li>
                <li>
                  Any other data that X’s API returns under the permissions
                  you grant (such as read-level access)
                </li>
              </ul>
              <p className="mt-1">
                We do not receive your X password.
              </p>

              <h3 className="mt-4 text-[13px] font-semibold text-slate-100">
                b) On-chain and wallet information
              </h3>
              <p className="mt-1">
                When you connect a wallet or when we analyze a draw, we may
                process:
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>Public wallet addresses</li>
                <li>Token balances relevant to a draw</li>
                <li>On-chain transactions made to or from those addresses</li>
              </ul>
              <p className="mt-1">
                This data is public on the blockchain, but we process and
                display it in XPOT (for example, to show eligibility,
                entries, or winners).
              </p>

              <h3 className="mt-4 text-[13px] font-semibold text-slate-100">
                c) Usage and technical data
              </h3>
              <p className="mt-1">We may automatically collect:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>
                  Log data (IP address, browser type, device information,
                  pages visited)
                </li>
                <li>Timestamps and basic interaction events</li>
                <li>
                  Cookies or similar technologies to remember your session
                  and preferences
                </li>
              </ul>
              <p className="mt-1">
                We use this to keep the Service secure and improve the
                experience.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-50">
                2. How we use your information
              </h2>
              <p className="mt-1">We use the information we collect to:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>Authenticate you via X and maintain your session</li>
                <li>
                  Determine eligibility and ticket entries for XPOT prize
                  draws
                </li>
                <li>
                  Display draw results and provide transparency (for example,
                  linking winning tickets to X handles or wallet addresses)
                </li>
                <li>
                  Monitor the Service for abuse, bots, or suspicious activity
                </li>
                <li>Improve, maintain, and debug the Service</li>
                <li>
                  Communicate with you about updates, issues, or important
                  changes
                </li>
              </ul>
              <p className="mt-1">
                We may also use aggregated, anonymized data for analytics and
                reporting that cannot reasonably identify you.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-50">
                3. Legal bases
              </h2>
              <p className="mt-1">
                Where required by law, we process your personal data based on:
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>
                  Your consent (for example, when you connect your X account)
                </li>
                <li>
                  Our legitimate interest in operating and improving XPOT,
                  ensuring transparency of draws, and preventing abuse
                </li>
                <li>Compliance with legal obligations, where applicable</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-50">
                4. Cookies and similar technologies
              </h2>
              <p className="mt-1">
                XPOT may use cookies and local storage to keep you logged in,
                remember preferences, and collect basic usage analytics.
              </p>
              <p className="mt-1">
                You can usually control cookies through your browser
                settings, but disabling them may affect how the Service
                works.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-50">
                5. Sharing of information
              </h2>
              <p className="mt-1">We may share information:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>
                  With service providers who help us operate XPOT (hosting,
                  analytics, and infrastructure), under appropriate
                  confidentiality obligations
                </li>
                <li>When required by law, regulation, or legal process</li>
                <li>
                  To investigate or respond to suspected fraud, security
                  issues, or abuse
                </li>
                <li>
                  In connection with a merger, acquisition, or other business
                  transfer, in which case we will seek to ensure similar
                  protections for your data
                </li>
              </ul>
              <p className="mt-1">
                We do not sell your personal data to third parties. Because
                blockchain data is public by design, some information (wallet
                addresses, transactions, token balances) is inherently visible
                to anyone on the network.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-50">
                6. Data retention
              </h2>
              <p className="mt-1">
                We retain personal data only as long as necessary for the
                purposes described in this Policy, unless a longer retention
                period is required or permitted by law.
              </p>
              <p className="mt-1">
                Blockchain data itself is not controlled or deletable by XPOT.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-50">
                7. Your rights
              </h2>
              <p className="mt-1">
                Depending on your jurisdiction, you may have certain rights
                over your personal data, such as:
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>Access to the information we hold about you</li>
                <li>Correction of inaccurate information</li>
                <li>Deletion of certain data</li>
                <li>Restriction or objection to some processing</li>
                <li>Portability of data in a structured, machine-readable format</li>
              </ul>
              <p className="mt-1">
                To exercise these rights, contact us using the details below.
                We may need to verify your identity before responding.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-50">
                8. Security
              </h2>
              <p className="mt-1">
                We use reasonable technical and organizational measures to
                protect the information we process. However, no system is
                completely secure, and we cannot guarantee absolute security.
              </p>
              <p className="mt-1">
                You are responsible for keeping your wallet credentials and
                any private keys safe. XPOT will never ask you for your
                private key or seed phrase.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-50">
                9. Children
              </h2>
              <p className="mt-1">
                XPOT is not intended for use by children under 18. We do not
                knowingly collect personal data from children under 18. If you
                believe a child has used XPOT, please contact us so we can
                delete any relevant information.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-50">
                10. Changes to this Policy
              </h2>
              <p className="mt-1">
                We may update this Privacy Policy from time to time. When we
                do, we will update the “Last updated” date at the top. Your
                continued use of XPOT after changes take effect means you
                accept the revised Policy.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-50">
                11. Contact
              </h2>
              <p className="mt-1">
                If you have questions or requests relating to this Privacy
                Policy, you can contact us at:{' '}
                <a
                  href="mailto:privacy@xpot.bet"
                  className="font-medium text-emerald-300 hover:text-emerald-200"
                >
                  privacy@xpot.bet
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
    </XpotPageShell>
  );
}

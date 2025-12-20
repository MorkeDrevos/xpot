// app/privacy/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import XpotPageShell from '@/components/XpotPageShell';
import { Lock, ShieldCheck, Globe, Mail, ExternalLink, ScrollText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | XPOT',
};

const LAST_UPDATED = '27 November 2025';

export default function PrivacyPage() {
  return (
    <XpotPageShell
      title="Privacy Policy"
      subtitle={`How XPOT collects, uses and protects information. Last updated: ${LAST_UPDATED}.`}
      topBarProps={{
        pillText: 'LEGAL',
        sloganRight: 'Privacy first, proof always',
      }}
      pageTag="hub"
    >
      {/* HERO / TRUST STRIP */}
      <section className="mt-6">
        <div className="xpot-panel">
          <div
            className="pointer-events-none absolute -inset-64 opacity-80 blur-3xl"
            style={{
              background:
                'radial-gradient(circle at 14% 18%, rgba(56,189,248,0.16), transparent 55%),' +
                'radial-gradient(circle at 56% 16%, rgba(99,102,241,0.12), transparent 62%),' +
                'radial-gradient(circle at 86% 20%, rgba(236,72,153,0.12), transparent 62%),' +
                'radial-gradient(circle at 70% 92%, rgba(214,176,79,0.06), transparent 60%)',
            }}
          />
          <div className="relative z-10 grid gap-4 p-6 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-6">
            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">XPOT</p>
              <h1 className="text-balance text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl">
                Privacy Policy
              </h1>
              <p className="text-sm leading-relaxed text-slate-300">
                This Privacy Policy explains how <span className="font-semibold text-slate-100">XPOT</span> (“XPOT”,
                “we”, “us”, “our”) collects, uses and protects information when you use xpot.bet and related services
                (the “Service”).
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  We never ask for seed phrases
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-slate-300">
                  <Globe className="h-4 w-4 text-sky-300" />
                  On-chain data is public
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-slate-300">
                  <Lock className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
                  Operate with minimisation
                </span>
              </div>
            </div>

            {/* QUICK LINKS / TOC */}
            <div className="xpot-card px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Quick nav</p>
                <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  <ScrollText className="h-4 w-4 text-slate-500" />
                  Legal
                </span>
              </div>

              <div className="mt-3 grid gap-2 text-sm">
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#info-we-collect">
                  1. Information we collect
                </a>
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#how-we-use">
                  2. How we use your information
                </a>
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#legal-bases">
                  3. Legal bases
                </a>
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#cookies">
                  4. Cookies and similar technologies
                </a>
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#sharing">
                  5. Sharing of information
                </a>
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#retention">
                  6. Data retention
                </a>
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#your-rights">
                  7. Your rights
                </a>
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#security">
                  8. Security
                </a>
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#children">
                  9. Children
                </a>
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#changes">
                  10. Changes to this Policy
                </a>
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#contact">
                  11. Contact
                </a>
              </div>

              <div className="mt-4 xpot-divider" />

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  href="/terms"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-slate-200 hover:bg-white/[0.06]"
                >
                  Terms
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>

                <a
                  href="mailto:privacy@xpot.bet"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-slate-200 hover:bg-white/[0.06]"
                >
                  Contact
                  <Mail className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LEGAL BODY */}
      <section className="mt-6">
        <div className="xpot-panel">
          <div className="relative z-10 p-6 sm:p-7 lg:p-8">
            <div className="prose prose-invert max-w-none prose-headings:scroll-mt-28 prose-headings:text-slate-50 prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-slate-100 prose-a:text-slate-100 prose-a:no-underline hover:prose-a:underline prose-hr:border-white/10">
              <p className="text-slate-300">
                By using XPOT, you agree to the collection and use of information in accordance with this Policy.
              </p>

              <hr className="my-7" />

              <h2 id="info-we-collect">1. Information we collect</h2>

              <h3 id="info-x">a) Information from your X account</h3>
              <p>When you log in with X, we may receive:</p>
              <ul>
                <li>Your X user ID and handle (@username)</li>
                <li>Display name and profile image</li>
                <li>Basic profile information provided by X’s API</li>
                <li>Any other data that X’s API returns under the permissions you grant (such as read-level access)</li>
              </ul>
              <p>We do not receive your X password.</p>

              <h3 id="info-chain">b) On-chain and wallet information</h3>
              <p>When you connect a wallet or when we analyse a draw, we may process:</p>
              <ul>
                <li>Public wallet addresses</li>
                <li>Token balances relevant to a draw</li>
                <li>On-chain transactions made to or from those addresses</li>
              </ul>
              <p>
                This data is public on the blockchain, but we process and display it in XPOT (for example, to show
                eligibility, entries or winners).
              </p>

              <h3 id="info-usage">c) Usage and technical data</h3>
              <p>We may automatically collect:</p>
              <ul>
                <li>Log data (IP address, browser type, device information, pages visited)</li>
                <li>Timestamps and basic interaction events</li>
                <li>Cookies or similar technologies to remember your session and preferences</li>
              </ul>
              <p>We use this to keep the Service secure and improve the experience.</p>

              <hr className="my-7" />

              <h2 id="how-we-use">2. How we use your information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Authenticate you via X and maintain your session</li>
                <li>Determine eligibility and ticket entries for XPOT prize draws</li>
                <li>
                  Display draw results and provide transparency (for example, linking winning tickets to X handles or
                  wallet addresses)
                </li>
                <li>Monitor the Service for abuse, bots or suspicious activity</li>
                <li>Improve, maintain and debug the Service</li>
                <li>Communicate with you about updates, issues or important changes</li>
              </ul>
              <p>
                We may also use aggregated, anonymised data for analytics and reporting that cannot reasonably identify
                you.
              </p>

              <hr className="my-7" />

              <h2 id="legal-bases">3. Legal bases</h2>
              <p>Where required by law, we process your personal data based on:</p>
              <ul>
                <li>Your consent (for example, when you connect your X account)</li>
                <li>
                  Our legitimate interest in operating and improving XPOT, ensuring transparency of draws and preventing
                  abuse
                </li>
                <li>Compliance with legal obligations, where applicable</li>
              </ul>

              <hr className="my-7" />

              <h2 id="cookies">4. Cookies and similar technologies</h2>
              <p>
                XPOT may use cookies and local storage to keep you logged in, remember preferences and collect basic
                usage analytics.
              </p>
              <p>
                You can usually control cookies through your browser settings, but disabling them may affect how the
                Service works.
              </p>

              <hr className="my-7" />

              <h2 id="sharing">5. Sharing of information</h2>
              <p>We may share information:</p>
              <ul>
                <li>
                  With service providers who help us operate XPOT (hosting, analytics and infrastructure), under
                  appropriate confidentiality obligations
                </li>
                <li>When required by law, regulation or legal process</li>
                <li>To investigate or respond to suspected fraud, security issues or abuse</li>
                <li>
                  In connection with a merger, acquisition or other business transfer, in which case we will seek to
                  ensure similar protections for your data
                </li>
              </ul>
              <p>
                We do not sell your personal data to third parties. Because blockchain data is public by design, some
                information (wallet addresses, transactions, token balances) is inherently visible to anyone on the
                network.
              </p>

              <hr className="my-7" />

              <h2 id="retention">6. Data retention</h2>
              <p>
                We retain personal data only as long as necessary for the purposes described in this Policy, unless a
                longer retention period is required or permitted by law.
              </p>
              <p>Blockchain data itself is not controlled or deletable by XPOT.</p>

              <hr className="my-7" />

              <h2 id="your-rights">7. Your rights</h2>
              <p>Depending on your jurisdiction, you may have certain rights over your personal data, such as:</p>
              <ul>
                <li>Access to the information we hold about you</li>
                <li>Correction of inaccurate information</li>
                <li>Deletion of certain data</li>
                <li>Restriction or objection to some processing</li>
                <li>Portability of data in a structured, machine-readable format</li>
              </ul>
              <p>
                To exercise these rights, contact us using the details below. We may need to verify your identity
                before responding.
              </p>

              <hr className="my-7" />

              <h2 id="security">8. Security</h2>
              <p>
                We use reasonable technical and organisational measures to protect the information we process. However,
                no system is completely secure and we cannot guarantee absolute security.
              </p>
              <p>
                You are responsible for keeping your wallet credentials and any private keys safe. XPOT will never ask
                you for your private key or seed phrase.
              </p>

              <hr className="my-7" />

              <h2 id="children">9. Children</h2>
              <p>
                XPOT is not intended for use by children under 18. We do not knowingly collect personal data from
                children under 18. If you believe a child has used XPOT, please contact us so we can delete any
                relevant information.
              </p>

              <hr className="my-7" />

              <h2 id="changes">10. Changes to this Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. When we do, we will update the “Last updated” date
                at the top. Your continued use of XPOT after changes take effect means you accept the revised Policy.
              </p>

              <hr className="my-7" />

              <h2 id="contact">11. Contact</h2>
              <p>
                If you have questions or requests relating to this Privacy Policy, you can contact us at{' '}
                <a href="mailto:privacy@xpot.bet">privacy@xpot.bet</a>.
              </p>
            </div>

            {/* BOTTOM ACTIONS */}
            <div className="mt-8">
              <div className="xpot-divider" />
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Last updated: <span className="text-slate-300">{LAST_UPDATED}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/"
                    className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-slate-200 hover:bg-white/[0.06]"
                  >
                    Back to Home
                  </Link>

                  <a
                    href="mailto:privacy@xpot.bet"
                    className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-slate-200 hover:bg-white/[0.06]"
                  >
                    Email privacy@xpot.bet
                    <Mail className="ml-2 h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SMALL FOOT NOTE */}
      <footer className="mt-10 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            Privacy, security and transparency are core to XPOT.
          </span>
          <span className="font-mono text-slate-600">build: privacy-xpot</span>
        </div>
      </footer>
    </XpotPageShell>
  );
}

/**
 * NOTE:
 * This page uses `prose` classes. Ensure you have @tailwindcss/typography enabled,
 * or replace the `prose ...` block with your own utility classes.
 *
 * If you do not use typography plugin, tell me and I’ll rewrite the body styling
 * without `prose` but with the same XPOT look.
 */

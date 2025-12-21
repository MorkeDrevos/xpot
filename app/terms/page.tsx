// app/terms/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import XpotPageShell from '@/components/XpotPageShell';
import { Lock, ShieldCheck, Globe, Mail, ExternalLink, ScrollText, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | XPOT',
};

const LAST_UPDATED = '27 November 2025';

export default function TermsPage() {
  return (
    <XpotPageShell
      title="Terms of Service"
      subtitle={`Rules for using XPOT. Last updated: ${LAST_UPDATED}.`}
      topBarProps={{
        pillText: 'LEGAL',
        sloganRight: 'Transparent draws, clear rules',
      }}
      pageTag="hub"
    >
      {/* HERO / SUMMARY */}
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
                Terms of Service
              </h1>
              <p className="text-sm leading-relaxed text-slate-300">
                Welcome to <span className="font-semibold text-slate-100">XPOT</span> (“XPOT”, “we”, “us”, “our”). These
                Terms govern your access to and use of xpot.bet and any related applications, services and features
                (collectively, the “Service”).
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Handle-first identity
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-slate-300">
                  <Globe className="h-4 w-4 text-sky-300" />
                  On-chain transparency
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-slate-300">
                  <Lock className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
                  No seed phrases, ever
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/30">
                    <AlertTriangle className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100">Important</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      XPOT does not provide investment, financial or legal advice. Any value associated with XPOT-related
                      tokens is volatile and not guaranteed.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-300">
                By accessing or using XPOT, you agree to be bound by these Terms. If you do not agree, you must not use
                the Service.
              </p>
            </div>

            {/* QUICK NAV */}
            <div className="xpot-card px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Quick nav</p>
                <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  <ScrollText className="h-4 w-4 text-slate-500" />
                  Legal
                </span>
              </div>

              <div className="mt-3 grid gap-2 text-sm">
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#what-xpot-is">
                  1. What XPOT is
                </a>
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#eligibility">
                  2. Eligibility
                </a>
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#x-login">
                  3. Connecting your X account
                </a>
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#draws">
                  4. Tickets, entries and prize draws
                </a>
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#no-guarantees">
                  5. No guarantees, no reliance
                </a>
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#responsibilities">
                  6. Your responsibilities
                </a>
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#liability">
                  7. Limitation of liability
                </a>
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#third-party">
                  8. Third-party services
                </a>
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#changes">
                  9. Changes to the Service and these Terms
                </a>
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#law">
                  10. Governing law
                </a>
                <a className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-slate-200 hover:bg-white/[0.04]" href="#contact">
                  11. Contact
                </a>
              </div>

              <div className="mt-4 xpot-divider" />

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  href="/privacy"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-slate-200 hover:bg-white/[0.06]"
                >
                  Privacy Policy
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>

                <a
                  href="mailto:support@xpot.bet"
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

      {/* TERMS BODY */}
      <section className="mt-6">
        <div className="xpot-panel">
          <div className="relative z-10 p-6 sm:p-7 lg:p-8">
            <div className="prose prose-invert max-w-none prose-headings:scroll-mt-28 prose-headings:text-slate-50 prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-slate-100 prose-a:text-slate-100 prose-a:no-underline hover:prose-a:underline prose-hr:border-white/10">
              <h2 id="what-xpot-is">1. What XPOT is</h2>
              <p>
                XPOT connects X (Twitter) accounts to ticket entries for prize draws and displays draw results
                transparently, using on-chain data where applicable.
              </p>
              <p>
                XPOT does <strong>not</strong> provide investment, financial or legal advice. Any value associated with
                XPOT-related tokens is volatile and not guaranteed.
              </p>

              <hr className="my-7" />

              <h2 id="eligibility">2. Eligibility</h2>
              <p>You may only use XPOT if:</p>
              <ul>
                <li>You are at least 18 years old (or the age of majority in your jurisdiction), and</li>
                <li>
                  You are legally allowed to participate in online prize draws or promotions under the laws of your
                  country or region.
                </li>
              </ul>
              <p>By using the Service you represent and warrant that you meet these requirements.</p>

              <hr className="my-7" />

              <h2 id="x-login">3. Connecting your X account</h2>
              <p>
                To use certain features you may log in with your X account. By doing so, you authorise us to access
                basic information from X in accordance with our Privacy Policy and X’s own terms and policies.
              </p>
              <p>
                You are responsible for keeping your X account secure and for all activity that occurs under your
                session with XPOT.
              </p>

              <hr className="my-7" />

              <h2 id="draws">4. Tickets, entries and prize draws</h2>
              <ul>
                <li>
                  XPOT uses your linked X account and other signals (for example, on-chain holdings or activity) to
                  determine ticket entries as described in the relevant campaign or draw.
                </li>
                <li>
                  Only <strong>tickets</strong> are entered into a draw - wallets themselves are not “selected” or
                  “drawn”.
                </li>
                <li>
                  Each draw’s rules (eligibility, prize, timing, snapshot logic, etc.) will be described in XPOT or in
                  an official announcement.
                </li>
                <li>
                  We reserve the right to verify eligibility, disqualify suspicious entries or cancel / modify a draw if
                  there is suspected abuse, error or technical issues.
                </li>
              </ul>
              <p>
                All outcomes are final once published, except in cases of obvious technical error, fraud or manipulation,
                in which case we may re-run or void a draw.
              </p>

              <hr className="my-7" />

              <h2 id="no-guarantees">5. No guarantees, no reliance</h2>
              <p>
                XPOT is provided on an <strong>“as is” and “as available”</strong> basis.
              </p>
              <p>We do not guarantee that:</p>
              <ul>
                <li>The Service will be uninterrupted, secure or error-free, or</li>
                <li>Any particular user will win a prize, or</li>
                <li>Any associated token will have or maintain any particular value.</li>
              </ul>
              <p>Nothing in XPOT should be relied upon as advice of any kind.</p>

              <hr className="my-7" />

              <h2 id="responsibilities">6. Your responsibilities</h2>
              <p>You agree that you will not:</p>
              <ul>
                <li>Use XPOT for any unlawful, fraudulent or abusive purpose.</li>
                <li>
                  Attempt to manipulate draws (for example through bots, fake accounts or wash activity).
                </li>
                <li>Interfere with the normal operation of the Service.</li>
              </ul>
              <p>
                We may suspend or terminate your access at any time if we believe you have violated these Terms or are
                otherwise creating risk for XPOT or other users.
              </p>

              <hr className="my-7" />

              <h2 id="liability">7. Limitation of liability</h2>
              <p>
                To the maximum extent permitted by law, XPOT and its owners, partners and contributors shall not be
                liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits
                or data, arising out of or in connection with your use of the Service.
              </p>
              <p>
                Our total aggregate liability for any claim relating to the Service will not exceed the greater of (a)
                USD 100, or (b) the total value of prizes you actually received from XPOT in the 3 months preceding the
                claim.
              </p>
              <p>
                Some jurisdictions do not allow certain limitations; in those cases, the above applies only to the
                extent permitted by law.
              </p>

              <hr className="my-7" />

              <h2 id="third-party">8. Third-party services (including X and blockchain networks)</h2>
              <p>
                XPOT depends on third-party services and networks, including X (Twitter) APIs, blockchain nodes and
                explorers and infrastructure providers. We are not responsible for outages, changes or issues caused by
                these third parties.
              </p>
              <p>
                You are responsible for securely managing your own wallets and private keys. XPOT will{' '}
                <strong>never</strong> ask for your private key or seed phrase.
              </p>

              <hr className="my-7" />

              <h2 id="changes">9. Changes to the Service and these Terms</h2>
              <p>
                We may update or change the Service at any time and may modify these Terms from time to time. When we do,
                we will update the “Last updated” date at the top.
              </p>
              <p>By continuing to use XPOT after changes take effect, you agree to the revised Terms.</p>

              <hr className="my-7" />

              <h2 id="law">10. Governing law</h2>
              <p>
                These Terms are governed by the laws of the jurisdiction where XPOT is operated, without regard to
                conflict of law principles. If any part of these Terms is held invalid, the remaining parts remain in
                full force and effect.
              </p>

              <hr className="my-7" />

              <h2 id="contact">11. Contact</h2>
              <p>
                If you have questions about these Terms, you can contact us at{' '}
                <a href="mailto:support@xpot.bet">support@xpot.bet</a>.
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

                  <Link
                    href="/privacy"
                    className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-slate-200 hover:bg-white/[0.06]"
                  >
                    Privacy Policy
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>

                  <a
                    href="mailto:support@xpot.bet"
                    className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-slate-200 hover:bg-white/[0.06]"
                  >
                    Email support@xpot.bet
                    <Mail className="ml-2 h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOT NOTE */}
      <footer className="mt-10 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            XPOT ships with “proof-first” UX and clear rules.
          </span>
          <span className="font-mono text-slate-600">build: terms-xpot</span>
        </div>
      </footer>
    </XpotPageShell>
  );
}

/**
 * NOTE:
 * This page uses `prose` classes. Ensure you have @tailwindcss/typography enabled.
 * If you don’t use it, tell me and I’ll restyle the body without `prose`.
 */

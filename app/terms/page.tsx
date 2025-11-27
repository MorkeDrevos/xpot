// app/terms/page.tsx
import React from 'react';

export const metadata = {
  title: 'Terms of Service | XPOT',
};

const LAST_UPDATED = '27 November 2025';

export default function TermsPage() {
  return (
    <main className="legal-page">
      <section className="legal-container">
        <p className="legal-eyebrow">XPOT</p>
        <h1 className="legal-title">Terms of Service</h1>
        <p className="legal-updated">Last updated: {LAST_UPDATED}</p>

        <p className="legal-intro">
          Welcome to <strong>XPOT</strong> (“XPOT”, “we”, “us”, “our”). These Terms of
          Service (“Terms”) govern your access to and use of xpot.bet and any related
          applications, services, and features (collectively, the “Service”).
        </p>

        <p>
          By accessing or using XPOT, you agree to be bound by these Terms. If you do not
          agree, you must not use the Service.
        </p>

        <h2>1. What XPOT is</h2>
        <p>
          XPOT connects X (Twitter) accounts to ticket entries for prize draws and displays
          draw results transparently, using on-chain data where applicable.
        </p>
        <p>
          XPOT does <strong>not</strong> provide investment, financial, or legal advice.
          Any value associated with XPOT-related tokens is volatile and not guaranteed.
        </p>

        <h2>2. Eligibility</h2>
        <p>You may only use XPOT if:</p>
        <ul>
          <li>You are at least 18 years old (or the age of majority in your jurisdiction), and</li>
          <li>
            You are legally allowed to participate in online prize draws or promotions
            under the laws of your country or region.
          </li>
        </ul>
        <p>
          By using the Service you represent and warrant that you meet these requirements.
        </p>

        <h2>3. Connecting your X account</h2>
        <p>
          To use certain features you may log in with your X account. By doing so, you
          authorize us to access basic information from X in accordance with our Privacy
          Policy and X’s own terms and policies.
        </p>
        <p>
          You are responsible for keeping your X account secure and for all activity that
          occurs under your session with XPOT.
        </p>

        <h2>4. Tickets, entries and prize draws</h2>
        <ul>
          <li>
            XPOT uses your linked X account and other signals (for example, on-chain
            holdings or activity) to determine ticket entries as described in the relevant
            campaign or draw.
          </li>
          <li>
            Only <strong>tickets</strong> are entered into a draw – wallets themselves are
            not “selected” or “drawn”.
          </li>
          <li>
            Each draw’s rules (eligibility, prize, timing, snapshot logic, etc.) will be
            described in XPOT or in an official announcement.
          </li>
          <li>
            We reserve the right to verify eligibility, disqualify suspicious entries, or
            cancel / modify a draw if there is suspected abuse, error, or technical issues.
          </li>
        </ul>
        <p>
          All outcomes are final once published, except in cases of obvious technical
          error, fraud, or manipulation, in which case we may re-run or void a draw.
        </p>

        <h2>5. No guarantees, no reliance</h2>
        <p>
          XPOT is provided on an <strong>“as is” and “as available”</strong> basis.
        </p>
        <p>We do not guarantee that:</p>
        <ul>
          <li>The Service will be uninterrupted, secure, or error-free, or</li>
          <li>Any particular user will win a prize, or</li>
          <li>Any associated token will have or maintain any particular value.</li>
        </ul>
        <p>Nothing in XPOT should be relied upon as advice of any kind.</p>

        <h2>6. Your responsibilities</h2>
        <p>You agree that you will not:</p>
        <ul>
          <li>Use XPOT for any unlawful, fraudulent, or abusive purpose.</li>
          <li>
            Attempt to manipulate draws (for example through bots, fake accounts, or wash
            activity).
          </li>
          <li>Interfere with the normal operation of the Service.</li>
        </ul>
        <p>
          We may suspend or terminate your access at any time if we believe you have
          violated these Terms or are otherwise creating risk for XPOT or other users.
        </p>

        <h2>7. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, XPOT and its owners, partners, and
          contributors shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages, or any loss of profits or data, arising out
          of or in connection with your use of the Service.
        </p>
        <p>
          Our total aggregate liability for any claim relating to the Service will not
          exceed the greater of (a) USD 100, or (b) the total value of prizes you actually
          received from XPOT in the 3 months preceding the claim.
        </p>
        <p>
          Some jurisdictions do not allow certain limitations; in those cases, the above
          applies only to the extent permitted by law.
        </p>

        <h2>8. Third-party services (including X and blockchain networks)</h2>
        <p>
          XPOT depends on third-party services and networks, including X (Twitter) APIs,
          blockchain nodes and explorers, and infrastructure providers. We are not
          responsible for outages, changes, or issues caused by these third parties.
        </p>
        <p>
          You are responsible for securely managing your own wallets and private keys.
          XPOT will <strong>never</strong> ask for your private key or seed phrase.
        </p>

        <h2>9. Changes to the Service and these Terms</h2>
        <p>
          We may update or change the Service at any time, and may modify these Terms from
          time to time. When we do, we will update the “Last updated” date at the top.
        </p>
        <p>By continuing to use XPOT after changes take effect, you agree to the revised Terms.</p>

        <h2>10. Governing law</h2>
        <p>
          These Terms are governed by the laws of the jurisdiction where XPOT is operated,
          without regard to conflict of law principles. If any part of these Terms is held
          invalid, the remaining parts remain in full force and effect.
        </p>

        <h2>11. Contact</h2>
        <p>
          If you have questions about these Terms, you can contact us at:{' '}
          <a href="mailto:support@xpot.bet">support@xpot.bet</a>
        </p>
      </section>
    </main>
  );
}

// app/privacy/page.tsx
import React from 'react';

export const metadata = {
  title: 'Privacy Policy | XPOT',
};

const LAST_UPDATED = '27 November 2025';

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <section className="legal-container">
        <p className="legal-eyebrow">XPOT</p>
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-updated">Last updated: {LAST_UPDATED}</p>

        <p className="legal-intro">
          This Privacy Policy explains how <strong>XPOT</strong> (“XPOT”, “we”, “us”,
          “our”) collects, uses, and protects information when you use xpot.bet and
          related services (the “Service”).
        </p>

        <p>
          By using XPOT, you agree to the collection and use of information in accordance
          with this Policy.
        </p>

        <h2>1. Information we collect</h2>

        <h3>a) Information from your X account</h3>
        <p>When you log in with X, we may receive:</p>
        <ul>
          <li>Your X user ID and handle (@username)</li>
          <li>Display name and profile image</li>
          <li>Basic profile information provided by X’s API</li>
          <li>
            Any other data that X’s API returns under the permissions you grant (such as
            read-level access)
          </li>
        </ul>
        <p>We do not receive your X password.</p>

        <h3>b) On-chain and wallet information</h3>
        <p>When you connect a wallet or when we analyze a draw, we may process:</p>
        <ul>
          <li>Public wallet addresses</li>
          <li>Token balances relevant to a draw</li>
          <li>On-chain transactions made to or from those addresses</li>
        </ul>
        <p>
          This data is public on the blockchain, but we process and display it in XPOT
          (for example, to show eligibility, entries, or winners).
        </p>

        <h3>c) Usage and technical data</h3>
        <p>We may automatically collect:</p>
        <ul>
          <li>Log data (IP address, browser type, device information, pages visited)</li>
          <li>Timestamps and basic interaction events</li>
          <li>Cookies or similar technologies to remember your session and preferences</li>
        </ul>
        <p>We use this to keep the Service secure and improve the experience.</p>

        <h2>2. How we use your information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Authenticate you via X and maintain your session</li>
          <li>Determine eligibility and ticket entries for XPOT prize draws</li>
          <li>
            Display draw results and provide transparency (for example, linking winning
            tickets to X handles or wallet addresses)
          </li>
          <li>Monitor the Service for abuse, bots, or suspicious activity</li>
          <li>Improve, maintain, and debug the Service</li>
          <li>Communicate with you about updates, issues, or important changes</li>
        </ul>
        <p>
          We may also use aggregated, anonymized data for analytics and reporting that
          cannot reasonably identify you.
        </p>

        <h2>3. Legal bases</h2>
        <p>Where required by law, we process your personal data based on:</p>
        <ul>
          <li>Your consent (for example, when you connect your X account)</li>
          <li>
            Our legitimate interest in operating and improving XPOT, ensuring transparency
            of draws, and preventing abuse
          </li>
          <li>Compliance with legal obligations, where applicable</li>
        </ul>

        <h2>4. Cookies and similar technologies</h2>
        <p>
          XPOT may use cookies and local storage to keep you logged in, remember
          preferences, and collect basic usage analytics.
        </p>
        <p>
          You can usually control cookies through your browser settings, but disabling
          them may affect how the Service works.
        </p>

        <h2>5. Sharing of information</h2>
        <p>We may share information:</p>
        <ul>
          <li>
            With service providers who help us operate XPOT (hosting, analytics, and
            infrastructure), under appropriate confidentiality obligations
          </li>
          <li>When required by law, regulation, or legal process</li>
          <li>To investigate or respond to suspected fraud, security issues, or abuse</li>
          <li>
            In connection with a merger, acquisition, or other business transfer, in which
            case we will seek to ensure similar protections for your data
          </li>
        </ul>
        <p>
          We do not sell your personal data to third parties. Because blockchain data is
          public by design, some information (wallet addresses, transactions, token
          balances) is inherently visible to anyone on the network.
        </p>

        <h2>6. Data retention</h2>
        <p>
          We retain personal data only as long as necessary for the purposes described in
          this Policy, unless a longer retention period is required or permitted by law.
        </p>
        <p>Blockchain data itself is not controlled or deletable by XPOT.</p>

        <h2>7. Your rights</h2>
        <p>
          Depending on your jurisdiction, you may have certain rights over your personal
          data, such as:
        </p>
        <ul>
          <li>Access to the information we hold about you</li>
          <li>Correction of inaccurate information</li>
          <li>Deletion of certain data</li>
          <li>Restriction or objection to some processing</li>
          <li>Portability of data in a structured, machine-readable format</li>
        </ul>
        <p>
          To exercise these rights, contact us using the details below. We may need to
          verify your identity before responding.
        </p>

        <h2>8. Security</h2>
        <p>
          We use reasonable technical and organizational measures to protect the
          information we process. However, no system is completely secure, and we cannot
          guarantee absolute security.
        </p>
        <p>
          You are responsible for keeping your wallet credentials and any private keys
          safe. XPOT will never ask you for your private key or seed phrase.
        </p>

        <h2>9. Children</h2>
        <p>
          XPOT is not intended for use by children under 18. We do not knowingly collect
          personal data from children under 18. If you believe a child has used XPOT,
          please contact us so we can delete any relevant information.
        </p>

        <h2>10. Changes to this Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. When we do, we will update
          the “Last updated” date at the top. Your continued use of XPOT after changes
          take effect means you accept the revised Policy.
        </p>

        <h2>11. Contact</h2>
        <p>
          If you have questions or requests relating to this Privacy Policy, you can
          contact us at:{' '}
          <a href="mailto:privacy@xpot.bet">privacy@xpot.bet</a>
        </p>
      </section>
    </main>
  );
}

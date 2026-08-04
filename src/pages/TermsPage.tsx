import LegalLayout, { type LegalSection } from "@/components/LegalLayout";

const sections: LegalSection[] = [
  {
    id: "acceptance",
    label: "Acceptance of terms",
    body: (
      <>
        <p>
          These Terms of Service ("Terms") govern your access to and use of the Brikoh platform,
          including the website, mobile app and related services (the "Services"). By creating an
          account or using the Services, you agree to these Terms. If you don't agree, please don't
          use the Services.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    label: "Eligibility",
    body: (
      <>
        <p>
          You must be at least 18 years old and capable of forming a binding contract to use the
          Services. By using Brikoh you represent that you meet these requirements and that the
          information you provide is accurate and complete.
        </p>
      </>
    ),
  },
  {
    id: "account",
    label: "Your account",
    body: (
      <>
        <p>
          You are responsible for safeguarding your login credentials and for all activity under
          your account. Notify us immediately of any unauthorised use. You may not share your
          account with third parties or allow others to access it in ways that violate these Terms.
        </p>
        <p>
          If you create an account on behalf of a business, you confirm you have authority to bind
          that business to these Terms.
        </p>
      </>
    ),
  },
  {
    id: "services",
    label: "Our services",
    body: (
      <>
        <p>
          Brikoh provides tools to build an online store, record sales, issue invoices and
          receipts, manage inventory, accept payments and access analytics. We may add, change or
          remove features over time, and we'll make reasonable efforts to notify you of material
          changes.
        </p>
        <p>
          The Services are provided "as is" and we don't guarantee that they will be uninterrupted,
          error-free or that results will be exactly as you expect — though we work hard to make
          them excellent.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    label: "Fees & payments",
    body: (
      <>
        <p>
          Certain features are free; others require a paid plan. Fees are shown before you
          subscribe and are billed in advance for the chosen period. Unless stated otherwise, fees
          are non-refundable.
        </p>
        <p>
          Payment processing on Brikoh is powered by regulated payment partners. You agree to their
          terms when you connect them, and you're responsible for complying with all applicable
          laws, taxes and regulations for your business.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    label: "Acceptable use",
    body: (
      <>
        <p>You agree not to use the Services to:</p>
        <ul>
          <li>Engage in fraud, money laundering or any illegal activity;</li>
          <li>Sell prohibited, counterfeit or infringing products;</li>
          <li>Misrepresent your identity or business;</li>
          <li>Attempt to access, tamper with or disrupt the Services or other users' data;</li>
          <li>Harass, abuse or harm other users or our staff.</li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate these rules, and we'll cooperate with
          authorities where required by law.
        </p>
      </>
    ),
  },
  {
    id: "ip",
    label: "Intellectual property",
    body: (
      <>
        <p>
          The Brikoh name, logo, software and content are owned by Brikoh Technologies Ltd or its
          licensors and are protected by intellectual property laws. We grant you a limited,
          non-exclusive, non-transferable licence to use the Services for your business.
        </p>
        <p>
          You retain all rights to your business data and content. You grant us a licence to host,
          process and display your content solely to provide the Services to you.
        </p>
      </>
    ),
  },
  {
    id: "third-party",
    label: "Third-party services",
    body: (
      <>
        <p>
          The Services may integrate with third-party tools such as payment gateways, delivery
          partners and advertising platforms. We don't control those services and aren't
          responsible for their performance, content or policies. Your use of them is subject to
          their own terms.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    label: "Termination",
    body: (
      <>
        <p>
          You may stop using Brikoh and delete your account at any time. We may suspend or
          terminate your access if you breach these Terms, if required by law, or to protect the
          integrity and safety of the platform.
        </p>
        <p>
          Upon termination, your right to use the Services ends. Provisions that by their nature
          should survive — including disclaimers and liability limits — will remain in effect.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    label: "Disclaimers",
    body: (
      <>
        <p>
          To the maximum extent permitted by law, the Services are provided on an "as is" and "as
          available" basis without warranties of any kind, whether express or implied, including
          merchantability, fitness for a particular purpose and non-infringement.
        </p>
        <p>
          We don't provide legal, tax or financial advice. You're responsible for decisions you
          make for your business.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    label: "Limitation of liability",
    body: (
      <>
        <p>
          To the maximum extent permitted by law, Brikoh shall not be liable for indirect,
          incidental, special, consequential or punitive damages, or for lost profits, revenue,
          data or goodwill, arising from your use of the Services.
        </p>
        <p>
          Our total aggregate liability for any claim relating to the Services will not exceed the
          amount you paid us in the twelve months preceding the claim, or one hundred US dollars,
          whichever is greater.
        </p>
      </>
    ),
  },
  {
    id: "indemnification",
    label: "Indemnification",
    body: (
      <>
        <p>
          You agree to indemnify and hold Brikoh and its affiliates, officers and employees
          harmless from any claims, damages, losses and expenses arising out of your use of the
          Services, your content, or your violation of these Terms or applicable law.
        </p>
      </>
    ),
  },
  {
    id: "governing-law",
    label: "Governing law",
    body: (
      <>
        <p>
          These Terms are governed by the laws of the Federal Republic of Nigeria, without regard
          to conflict-of-law principles. Any disputes will be resolved in the courts of Lagos,
          Nigeria, unless applicable law provides otherwise.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    label: "Changes & contact",
    body: (
      <>
        <p>
          We may update these Terms from time to time. Material changes will be announced by email
          or in-app notice at least 14 days before they take effect, unless required sooner by law.
        </p>
        <p>
          Questions about these Terms? Contact us at <strong>legal@brikoh.com</strong> or write to
          14B Admiralty Way, Lekki Phase 1, Lagos, Nigeria.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      updated="January 15, 2026"
      intro="These Terms of Service form a legally binding agreement between you and Brikoh Technologies Ltd governing your use of the Brikoh platform."
      sections={sections}
      contactEmail="legal@brikoh.com"
    />
  );
}

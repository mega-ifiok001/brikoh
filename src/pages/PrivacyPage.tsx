import LegalLayout, { type LegalSection } from "@/components/LegalLayout";

const sections: LegalSection[] = [
  {
    id: "introduction",
    label: "Introduction",
    body: (
      <>
        <p>
          Brikoh Technologies Ltd ("Brikoh", "we", "us" or "our") provides an all-in-one platform
          that helps businesses build stores, sell online, accept payments, manage inventory and
          understand their numbers. This Privacy Policy explains what personal data we collect,
          why we collect it, how we use and share it, and the choices you have.
        </p>
        <p>
          By creating an account or using the Brikoh app, website or services (together, the
          "Services"), you agree to the practices described in this policy.
        </p>
      </>
    ),
  },
  {
    id: "collection",
    label: "Information we collect",
    body: (
      <>
        <p>
          <strong>Information you give us.</strong> When you create an account, we collect your
          name, email address, phone number and password. When you set up payments, we may collect
          bank or payment details and business information needed for verification.
        </p>
        <p>
          <strong>Information we collect automatically.</strong> We log device information, IP
          address, browser type, pages visited and how you interact with the Services, so we can
          keep things secure and improve the experience.
        </p>
        <p>
          <strong>Information about your business.</strong> Your products, sales, inventory,
          invoices, customers and analytics data are stored to provide the Services to you. You own
          this data and can export or delete it at any time.
        </p>
      </>
    ),
  },
  {
    id: "use",
    label: "How we use your information",
    body: (
      <>
        <p>We use personal data to:</p>
        <ul>
          <li>Provide, operate and secure the Services;</li>
          <li>Process payments and payouts you authorise;</li>
          <li>Send service notifications, receipts and security alerts;</li>
          <li>Provide support and respond to your requests;</li>
          <li>Improve, test and develop new features;</li>
          <li>Send marketing communications where you've opted in — you can opt out anytime.</li>
        </ul>
      </>
    ),
  },
  {
    id: "sharing",
    label: "Sharing & disclosure",
    body: (
      <>
        <p>
          We never sell your personal data. We share information only with trusted parties who help
          us run the Services — such as payment processors, cloud providers and analytics tools —
          under strict contractual obligations to protect your data.
        </p>
        <p>
          We may disclose information where required by law, to protect the rights and safety of
          our users or the public, or in connection with a merger, acquisition or sale of assets.
        </p>
      </>
    ),
  },
  {
    id: "security",
    label: "Data security",
    body: (
      <>
        <p>
          We protect your data with encryption in transit (TLS 1.3) and at rest (256-bit AES),
          role-based access controls, continuous monitoring and automated backups. Our security
          practices are independently audited against SOC 2 Type II and ISO 27001.
        </p>
        <p>
          No method of transmission or storage is 100% secure, but we work hard to protect your
          data and will notify you promptly of any incident affecting it.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    label: "Data retention",
    body: (
      <>
        <p>
          We keep your account data for as long as your account is active, plus a reasonable period
          afterwards to meet legal and tax obligations. Transaction records may be retained for up
          to seven years as required by financial regulations.
        </p>
        <p>
          When you delete your account, we delete or anonymise your personal data unless the law
          requires us to keep it.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    label: "Your rights & choices",
    body: (
      <>
        <p>
          Depending on your location, you may have the right to access, correct, export or delete
          your personal data, to object to or restrict certain processing, and to withdraw consent
          at any time.
        </p>
        <p>
          You can exercise most of these rights directly in the app. For anything else, email us at
          the address below and we'll respond within 30 days.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    label: "Cookies & similar technologies",
    body: (
      <>
        <p>
          We use cookies and similar technologies to keep you signed in, remember preferences,
          measure usage and support our marketing. You can manage cookies in your browser settings,
          but disabling them may affect how the Services work.
        </p>
        <p>
          For full details, including a breakdown of the categories of cookies we use, please see
          our <strong>Cookie Policy</strong>.
        </p>
      </>
    ),
  },
  {
    id: "transfers",
    label: "International transfers",
    body: (
      <>
        <p>
          Brikoh operates across Africa and beyond. Your data may be processed in countries
          different from where you live. Where we transfer data across borders, we use appropriate
          safeguards, including standard contractual clauses, to protect it.
        </p>
      </>
    ),
  },
  {
    id: "children",
    label: "Children's privacy",
    body: (
      <>
        <p>
          The Services are intended for business use by adults. We do not knowingly collect
          personal data from children under 16. If you believe a child has provided us data,
          contact us and we will delete it.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    label: "Changes to this policy",
    body: (
      <>
        <p>
          We may update this policy from time to time. We'll notify you of material changes by
          email or in-app notice before they take effect. Continued use of the Services after
          changes means you accept the updated policy.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    label: "Contact us",
    body: (
      <>
        <p>
          Questions about this policy or your data? Contact our Data Protection team at{" "}
          <strong>privacy@brikoh.com</strong>, or write to us at 14B Admiralty Way, Lekki Phase 1,
          Lagos, Nigeria.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      updated="January 15, 2026"
      intro="This policy explains how Brikoh Technologies Ltd collects, uses, shares and protects your personal information when you use our Services."
      sections={sections}
      contactEmail="privacy@brikoh.com"
    />
  );
}

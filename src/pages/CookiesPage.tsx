import LegalLayout, { type LegalSection } from "@/components/LegalLayout";

const categories = [
  {
    name: "Essential",
    purpose: "Required for the Services to work — sign-in, security and load balancing.",
    examples: "session, csrf, consent",
    duration: "Up to 1 year",
  },
  {
    name: "Preferences",
    purpose: "Remember your choices, like language, currency and display settings.",
    examples: "locale, currency",
    duration: "Up to 1 year",
  },
  {
    name: "Analytics",
    purpose: "Help us understand how the Services are used so we can improve them.",
    examples: "_ga, _gid, mixpanel",
    duration: "Up to 2 years",
  },
  {
    name: "Marketing",
    purpose: "Support our advertising and measure campaign performance (opt-in only).",
    examples: "fbp, gclid, ttclid",
    duration: "Up to 2 years",
  },
];

const sections: LegalSection[] = [
  {
    id: "what-are-cookies",
    label: "What are cookies?",
    body: (
      <>
        <p>
          Cookies are small text files stored on your device when you visit a website or use an
          app. They help the site remember you, understand how it's used, and deliver a smoother,
          more personal experience.
        </p>
        <p>
          This Cookie Policy explains the cookies and similar technologies Brikoh uses, why we use
          them, and how you can control them.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    label: "How we use cookies",
    body: (
      <>
        <p>We use cookies and similar technologies (like local storage and pixels) to:</p>
        <ul>
          <li>Keep you signed in securely across sessions;</li>
          <li>Remember your preferences and settings;</li>
          <li>Measure how the Services perform and where we can improve;</li>
          <li>Support our marketing, only where you've opted in.</li>
        </ul>
        <p>
          Cookies we set ourselves are "first-party". Cookies set by our partners (for example,
          analytics or advertising providers) are "third-party".
        </p>
      </>
    ),
  },
  {
    id: "categories",
    label: "Categories of cookies",
    body: (
      <>
        <p>Here's a breakdown of the cookies we use:</p>
        <div className="overflow-x-auto rounded-xl border border-ink/10">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-cream text-xs font-bold uppercase tracking-wider text-ink">
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Examples</th>
                <th className="px-4 py-3">Duration</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={c.name} className={i % 2 ? "bg-cream/50" : "bg-white"}>
                  <td className="px-4 py-3 font-semibold text-ink">{c.name}</td>
                  <td className="px-4 py-3 text-muted">{c.purpose}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{c.examples}</td>
                  <td className="px-4 py-3 text-muted">{c.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: "managing",
    label: "Managing cookies",
    body: (
      <>
        <p>
          You can control cookies through your browser settings — most browsers let you block or
          delete cookies, or alert you when one is set. When you first visit Brikoh you can also
          choose which optional categories to allow via our consent banner.
        </p>
        <p>
          <strong>Note:</strong> blocking essential cookies may prevent the Services from working
          correctly, including keeping you signed in.
        </p>
      </>
    ),
  },
  {
    id: "third-party",
    label: "Third-party cookies",
    body: (
      <>
        <p>
          Some of our partners — such as analytics and advertising providers — may set their own
          cookies when you use the Services. These partners have their own privacy and cookie
          policies, and we encourage you to review them.
        </p>
      </>
    ),
  },
  {
    id: "updates",
    label: "Updates to this policy",
    body: (
      <>
        <p>
          We may update this Cookie Policy as our Services and the technology around us evolve. We
          will post any changes here with an updated revision date. Significant changes will be
          communicated through the Services.
        </p>
      </>
    ),
  },
];

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Cookie Policy"
      updated="January 15, 2026"
      intro="Learn how Brikoh uses cookies and similar technologies to keep the Services secure, fast and personal — and how you can control them."
      sections={sections}
      contactEmail="privacy@brikoh.com"
    />
  );
}

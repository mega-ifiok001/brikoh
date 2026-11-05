// ─────────────────────────────────────────────────────────────────────────────
// Everything you'll want to edit on the careers page lives in this one file.
// Add / remove roles, change the email, tweak values and perks. No other file
// needs to change. To close a role, delete it (or set `open: false`).
// ─────────────────────────────────────────────────────────────────────────────

export const CAREERS_EMAIL = "careers@brikoh.com";
export const MAIN_SITE = "https://brikoh.com";

export type Team = "Engineering" | "Design" | "Growth" | "Operations";

export type Role = {
  id: string; // deep link: careers.brikoh.com/#/?role=<id>
  title: string;
  team: Team;
  location: string;
  type: string;
  open: boolean;
  summary: string;
  doing: string[];
  needs: string[];
  bonus?: string[];
};

// NOTE: These roles are starter placeholders written from what Brikoh is
// building today. Replace them with the real openings before launch.
export const ROLES: Role[] = [
  {
    id: "full-stack-engineer",
    title: "Full-stack Engineer",
    team: "Engineering",
    location: "Remote (Nigeria)",
    type: "Full-time",
    open: true,
    summary:
      "Own features end to end across the Brikoh dashboard, storefront and API, from the schema to the screen a shop owner taps at 7am.",
    doing: [
      "Ship product features across React, Node/Express and PostgreSQL",
      "Build the money-adjacent flows: orders, wallet, payouts, invoices, stock movements",
      "Keep the dashboard fast on mid-range phones and patchy networks",
      "Write the tests and checks that let us deploy without holding our breath",
    ],
    needs: [
      "Strong TypeScript and React; comfortable on the backend too",
      "You've built and shipped something real that people used",
      "You think in edge cases: what happens when a payment webhook arrives twice?",
      "Clear written communication, we work asynchronously",
    ],
    bonus: [
      "Experience with Paystack or other Nigerian payment rails",
      "Prisma / PostgreSQL in production",
    ],
  },
  {
    id: "mobile-engineer",
    title: "Mobile Engineer (React Native)",
    team: "Engineering",
    location: "Remote (Nigeria)",
    type: "Full-time",
    open: true,
    summary:
      "Build the Brikoh app that merchants carry in their pocket: POS, stock checks, orders and wallet, built to be quick and forgiving.",
    doing: [
      "Build and ship the Brikoh mobile app with React Native and Expo",
      "Design for low-end Android devices and unreliable connectivity",
      "Work with the web team on shared API contracts and flows",
      "Own release quality: crash-free sessions, performance, app store releases",
    ],
    needs: [
      "Shipped at least one React Native or native mobile app to production",
      "Strong TypeScript, state management and API integration skills",
      "A feel for small details: taps, loading states, empty states",
    ],
    bonus: ["Offline-first or sync experience", "Barcode scanning / receipt printing experience"],
  },
  {
    id: "product-designer",
    title: "Product Designer",
    team: "Design",
    location: "Remote (Nigeria)",
    type: "Full-time or contract",
    open: true,
    summary:
      "Make a serious business tool feel warm and obvious. You'll design the screens shop owners use all day, from rough idea to polished handoff.",
    doing: [
      "Design end-to-end flows for POS, inventory, storefronts and payouts",
      "Maintain and grow the Brikoh design system (cream, orange, ink)",
      "Talk to real merchants and turn what you hear into product decisions",
      "Work side by side with engineers so what ships matches what you drew",
    ],
    needs: [
      "A portfolio showing real product work, not just visual exercises",
      "Fluent in Figma and in designing for dense, data-heavy interfaces",
      "Empathy for non-technical users who are busy running a shop",
    ],
  },
  {
    id: "merchant-growth-associate",
    title: "Merchant Growth Associate",
    team: "Growth",
    location: "Uyo, Akwa Ibom",
    type: "Full-time",
    open: true,
    summary:
      "Be the face of Brikoh to the shops and markets around you. Find merchants, get them set up, and make sure they come back the next day.",
    doing: [
      "Visit and onboard small and mid-sized retailers in person",
      "Run demos, help merchants add their first products and make their first sale",
      "Collect honest feedback and bring it to the product team every week",
      "Run local activations, webinars and referral pushes",
    ],
    needs: [
      "Confident talking to business owners, in person and on WhatsApp",
      "Self-driven. You'll have targets but not a script",
      "Comfortable with simple software; you pick up tools fast",
      "Fluent English; Ibibio or Pidgin is a plus",
    ],
  },
  {
    id: "customer-success",
    title: "Customer Success Specialist",
    team: "Operations",
    location: "Remote (Nigeria)",
    type: "Full-time",
    open: true,
    summary:
      "Be the reason merchants stay. You'll answer questions, fix problems fast and spot the patterns that tell us what to build next.",
    doing: [
      "Support merchants over chat, email and calls",
      "Triage and document bugs for the engineering team",
      "Write help guides and short how-to videos",
      "Track the questions that keep coming up and push for fixes",
    ],
    needs: [
      "Patient, clear and warm communicator",
      "Comfortable learning a product deeply and teaching it simply",
      "Organised: nothing falls through the cracks on your watch",
    ],
  },
];

export const TEAMS: ("All" | Team)[] = ["All", "Engineering", "Design", "Growth", "Operations"];

export const STATS = [
  { k: "₦", v: "Built for naira", d: "Naira-first pricing, payouts and reports" },
  { k: "1", v: "Dashboard", d: "POS, storefront, stock, orders and wallet together" },
  { k: "0", v: "Card needed", d: "Merchants start free and upgrade when they grow" },
];

export const VALUES = [
  {
    icon: "market",
    title: "Start from the market stall",
    body: "Our users are shop owners, boutique founders and traders. Before we build anything, we ask: would this help someone running a busy shop on a Tuesday?",
  },
  {
    icon: "shield",
    title: "Every kobo accounted for",
    body: "We handle people's money and stock. Accuracy isn't a feature, it's the job. We prefer a boring, correct ledger to a clever, wrong one.",
  },
  {
    icon: "zap",
    title: "Ship small, ship often",
    body: "Small team, real users, short loops. We'd rather put something useful in front of a merchant this week than perfect it for three months.",
  },
  {
    icon: "heart",
    title: "Warm, not noisy",
    body: "We build software that's friendly and clear. We communicate the same way: honestly, kindly, and without the jargon.",
  },
];

export const WORKING = [
  { icon: "users", t: "Small team, real ownership", b: "You won't be one of hundreds. You'll own meaningful parts of the product from day one and see your work in merchants' hands quickly." },
  { icon: "globe", t: "Remote-friendly", b: "Most roles can be done from anywhere in Nigeria. We work asynchronously, write things down and keep meetings short." },
  { icon: "chart", t: "Grow with the company", b: "We're early. People who join now help shape how Brikoh is built, and grow as the company does." },
  { icon: "book", t: "Learn in the open", b: "Work with experienced builders, get honest feedback, and make decisions that matter." },
];

export const PROCESS = [
  { t: "Apply", b: "Send us a short note and your CV, portfolio or GitHub. Tell us what you've built and why Brikoh." },
  { t: "Intro chat", b: "A relaxed 30-minute conversation about you, the role and where Brikoh is headed." },
  { t: "Practical task", b: "A small exercise close to the real work, sized to respect your time. No whiteboard riddles." },
  { t: "Meet the team", b: "Talk with the people you'd work with every day, and ask us anything." },
  { t: "Decision", b: "We aim to give you a clear answer quickly, whichever way it goes." },
];

export const FAQ = [
  {
    q: "Is Brikoh hiring right now?",
    a: "Yes, the roles listed above are open. If nothing fits but you're excited about what we're building, send an open application and tell us how you'd help.",
  },
  {
    q: "Do I need to live in Nigeria?",
    a: "Most roles are for people based in Nigeria, because that's the market we build for. Each role lists its location.",
  },
  {
    q: "How long until I hear back?",
    a: "We read every application. If your background looks like a fit, expect to hear from us within about a week.",
  },
  {
    q: "I don't tick every box. Should I still apply?",
    a: "Yes. Requirements are a guide, not a wall. Show us what you've built and how you learn.",
  },
];
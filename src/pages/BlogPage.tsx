"use client";

import { useState } from "react";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import Newsletter from "@/components/Newsletter";
import { Container, Reveal } from "@/components/ui";
import { Clock, ArrowRight } from "@/components/icons";

const CATEGORIES = ["All", "Growth", "Product", "Payments", "Operations", "Stories", "Marketing"];

type Post = {
  title: string;
  tag: string;
  excerpt: string;
  date: string;
  readTime: string;
  grad: string;
  emoji: string;
  author: string;
  initials: string;
};

const featured: Post = {
  title: "How Nigerian SMEs can win with online stores in 2026",
  tag: "Growth",
  excerpt:
    "Online selling in Nigeria is no longer optional — it's where the customers are. Here's the playbook our top merchants are using to stand out, convert and grow this year.",
  date: "Jan 12, 2026",
  readTime: "12 min read",
  grad: "from-forest via-pine to-leaf",
  emoji: "🚀",
  author: "Ada Obi",
  initials: "AO",
};

const posts: Post[] = [
  {
    title: "From Instagram DMs to a real online store: Tola's story",
    tag: "Stories",
    excerpt: "How a Lagos fashion brand stopped losing orders in the chat and doubled sales in 90 days.",
    date: "Jan 8, 2026",
    readTime: "6 min read",
    grad: "from-sun to-brand",
    emoji: "🛍️",
    author: "Chiamaka Nwosu",
    initials: "CN",
  },
  {
    title: "The complete guide to accepting international payments",
    tag: "Payments",
    excerpt: "Dollar settlement, gateways and currency fees — everything you need to sell globally without the headache.",
    date: "Jan 3, 2026",
    readTime: "9 min read",
    grad: "from-pine to-forest",
    emoji: "💳",
    author: "Tunde Bakare",
    initials: "TB",
  },
  {
    title: "5 inventory habits that save small businesses thousands",
    tag: "Operations",
    excerpt: "Dead stock is silent profit leakage. These five habits keep your cash flowing and your shelves moving.",
    date: "Dec 28, 2025",
    readTime: "7 min read",
    grad: "from-brand to-sun",
    emoji: "📦",
    author: "Kofi Adjei",
    initials: "KA",
  },
  {
    title: "Brikoh Analytics 101: read your numbers like a pro",
    tag: "Product",
    excerpt: "Profit, best-sellers, repeat customers — a plain-English tour of the dashboard that runs your business.",
    date: "Dec 20, 2025",
    readTime: "8 min read",
    grad: "from-leaf to-pine",
    emoji: "📊",
    author: "Ngozi Eze",
    initials: "NE",
  },
  {
    title: "WhatsApp selling: turn chats into checkout",
    tag: "Growth",
    excerpt: "Millions of African shoppers buy in WhatsApp. Here's how to take those conversations and turn them into paid orders.",
    date: "Dec 12, 2025",
    readTime: "5 min read",
    grad: "from-sun to-leaf",
    emoji: "💬",
    author: "Samuel Okafor",
    initials: "SO",
  },
  {
    title: "The psychology of flash sales (and when to run them)",
    tag: "Marketing",
    excerpt: "Urgency sells — but only when it's honest. Learn the timing and framing that move inventory without cheapening your brand.",
    date: "Dec 5, 2025",
    readTime: "6 min read",
    grad: "from-brand to-pine",
    emoji: "⚡",
    author: "Amina Yusuf",
    initials: "AY",
  },
  {
    title: "Record sales in seconds: a day in the life of Brikoh",
    tag: "Product",
    excerpt: "From the morning stock check to the last invoice of the day — follow one merchant through a fully automated day.",
    date: "Nov 27, 2025",
    readTime: "10 min read",
    grad: "from-forest to-brand",
    emoji: "🌞",
    author: "Ngozi Eze",
    initials: "NE",
  },
  {
    title: "Pricing for profit in a rising economy",
    tag: "Growth",
    excerpt: "Costs are climbing. Here's how to raise prices the right way — and keep your best customers happy.",
    date: "Nov 18, 2025",
    readTime: "7 min read",
    grad: "from-leaf to-brand",
    emoji: "🏷️",
    author: "Ada Obi",
    initials: "AO",
  },
];

function PostCard({ post, large = false }: { post: Post; large?: boolean }) {
  return (
    <article
      className={`group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-ink/5 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-forest/15 ${
        large ? "lg:grid lg:grid-cols-2" : ""
      }`}
    >
      <div
        className={`relative flex items-center justify-center bg-gradient-to-br ${post.grad} ${
          large ? "min-h-[240px] lg:min-h-full" : "h-44"
        }`}
      >
        <div className="absolute inset-0 bg-dotgrid-light opacity-30" />
        <span className="relative text-6xl drop-shadow-lg transition-transform duration-500 group-hover:scale-110">
          {post.emoji}
        </span>
        {large && (
          <span className="absolute left-5 top-5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            ⭐ Featured
          </span>
        )}
      </div>
      <div className={`flex flex-1 flex-col p-6 sm:p-7 ${large ? "lg:justify-center" : ""}`}>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
            {post.tag}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" /> {post.readTime}
          </span>
        </div>
        <h3
          className={`mt-3 font-display font-extrabold leading-snug tracking-tight text-ink transition-colors group-hover:text-brand ${
            large ? "text-2xl sm:text-3xl" : "text-lg"
          }`}
        >
          {post.title}
        </h3>
        {large && <p className="mt-3 text-[15px] leading-relaxed text-muted">{post.excerpt}</p>}
        <div className="mt-5 flex items-center gap-3 pt-1">
          <span
            className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${post.grad} text-xs font-bold text-white`}
          >
            {post.initials}
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-ink">{post.author}</p>
            <p className="text-xs text-muted">{post.date}</p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand opacity-0 transition-opacity group-hover:opacity-100">
            Read <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );
}

export default function BlogPage() {
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? posts : posts.filter((p) => p.tag === active);

  return (
    <PageShell title="Blog">
      <PageHero
        eyebrow="The Brikoh Blog"
        eyebrowTone="orange"
        title={
          <>
            Insights to help you <span className="text-gradient-brand">sell more</span>
          </>
        }
        subtitle="Practical playbooks, merchant stories and product updates from the team building Africa's favourite business app."
      />

      {/* featured */}
      <section className="pb-10">
        <Container>
          <Reveal>
            <a href="#/blog" className="block">
              <PostCard post={featured} large />
            </a>
          </Reveal>
        </Container>
      </section>

      {/* grid */}
      <section className="pb-16 sm:pb-20">
        <Container>
          {/* category pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  active === c
                    ? "bg-forest text-white shadow-lg shadow-forest/20"
                    : "bg-white text-ink/70 ring-1 ring-ink/10 hover:text-ink"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => (
              <Reveal key={p.title} delay={(i % 3) * 70}>
                <PostCard post={p} />
              </Reveal>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="mt-10 text-center text-sm text-muted">No articles in this category yet.</p>
          )}

          <div className="mt-12 text-center">
            <button className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand">
              Load more articles
            </button>
          </div>
        </Container>
      </section>

      <Newsletter
        title="Get the playbook, weekly"
        subtitle="One practical growth idea every week — read by 40,000+ founders."
      />
    </PageShell>
  );
}

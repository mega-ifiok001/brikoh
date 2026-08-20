"use client";

import { useState } from "react";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import { Container, Reveal } from "@/components/ui";
import { TextInput, PrimaryButton, AlertBox } from "@/components/auth/AuthUI";
import { isValidEmail } from "@/lib/auth";
import { Mail, MessageCircle, Phone, Headphones, MapPin, CheckCircle, ArrowRight } from "@/components/icons";

const topics = ["Product support", "Sales & demo", "Partnerships", "Press & media", "Something else"];

const channels = [
  {
    icon: <Mail className="h-6 w-6" />,
    title: "Email support",
    detail: "support@brikoh.com",
    note: "Replies within 24 hours",
    tint: "bg-brand/10 text-brand",
  },
  {
    icon: <MessageCircle className="h-6 w-6" />,
    title: "Live chat",
    detail: "In-app, 9am – 6pm WAT",
    note: "Average 2-minute response",
    tint: "bg-pine/10 text-pine",
  },
  {
    icon: <Phone className="h-6 w-6" />,
    title: "Call us",
    detail: "+234 800 123 4567",
    note: "Mon – Fri, 9am – 5pm",
    tint: "bg-brand/10 text-brand",
  },
  {
    icon: <Headphones className="h-6 w-6" />,
    title: "Help center",
    detail: "Guides & tutorials",
    note: "Self-serve, 24/7",
    tint: "bg-pine/10 text-pine",
  },
];

const offices = [
  { city: "Lagos", country: "Nigeria", addr: "14B Admiralty Way, Lekki Phase 1", grad: "from-sun to-brand" },
  { city: "Accra", country: "Ghana", addr: "25 Oxford Street, Osu", grad: "from-leaf to-pine" },
  { city: "Nairobi", country: "Kenya", addr: "7 Riverside Drive, Westlands", grad: "from-brand to-sun" },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(topics[0]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) {
      setError("Please tell us your name.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (message.trim().length < 10) {
      setError("Please add a little more detail (at least 10 characters).");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setDone(true);
  }

  return (
    <PageShell title="Contact us">
      <PageHero
        eyebrow="Contact us"
        eyebrowTone="orange"
        title={
          <>
            Let's talk — <span className="text-gradient-brand">we're all ears</span>
          </>
        }
        subtitle="Whether you need help, want a demo, or dream of partnering with us, the Brikoh team would love to hear from you."
      />

      <section className="pb-20 sm:pb-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            {/* form */}
            <Reveal>
              <div className="rounded-3xl border border-ink/5 bg-white p-7 shadow-sm sm:p-9">
                {done ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <span className="grid h-16 w-16 animate-pop place-items-center rounded-full bg-leaf/15 text-leaf">
                      <CheckCircle className="h-8 w-8" />
                    </span>
                    <h3 className="mt-5 font-display text-2xl font-extrabold text-ink">
                      Message sent!
                    </h3>
                    <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
                      Thanks {name.split(" ")[0]}. Our team will get back to you within one
                      business day.
                    </p>
                    <button
                      onClick={() => {
                        setDone(false);
                        setMessage("");
                      }}
                      className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-light"
                    >
                      Send another message <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={onSubmit} noValidate className="space-y-5">
                    <h3 className="font-display text-xl font-extrabold text-ink">Send us a message</h3>
                    {error && <AlertBox>{error}</AlertBox>}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <TextInput
                        label="Full name"
                        placeholder="Amara Obi"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      <TextInput
                        label="Email address"
                        type="email"
                        placeholder="you@business.com"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-ink">Topic</label>
                      <select
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3.5 text-[15px] text-ink outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
                      >
                        {topics.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-ink">Message</label>
                      <textarea
                        rows={5}
                        placeholder="Tell us a little about what you need…"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full resize-none rounded-xl border border-ink/10 bg-white px-4 py-3.5 text-[15px] text-ink outline-none transition-all placeholder:text-ink/30 focus:border-brand focus:ring-4 focus:ring-brand/10"
                      />
                    </div>
                    <PrimaryButton loading={loading}>Send message</PrimaryButton>
                  </form>
                )}
              </div>
            </Reveal>

            {/* channels + offices */}
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {channels.map((c, i) => (
                  <Reveal key={c.title} delay={i * 70}>
                    <div className="h-full rounded-2xl border border-ink/5 bg-white p-5 transition-shadow hover:shadow-lg hover:shadow-forest/10">
                      <span className={`grid h-11 w-11 place-items-center rounded-xl ${c.tint}`}>
                        {c.icon}
                      </span>
                      <h3 className="mt-3.5 font-display text-base font-bold text-ink">{c.title}</h3>
                      <p className="mt-1 text-sm font-semibold text-ink/80">{c.detail}</p>
                      <p className="mt-0.5 text-xs text-muted">{c.note}</p>
                    </div>
                  </Reveal>
                ))}
              </div>

              <Reveal delay={150}>
                <div className="rounded-3xl border border-ink/5 bg-white p-6">
                  <h3 className="font-display text-lg font-bold text-ink">Our offices</h3>
                  <div className="mt-4 space-y-4">
                    {offices.map((o) => (
                      <div key={o.city} className="flex items-center gap-4">
                        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${o.grad} text-white`}>
                          <MapPin className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-ink">
                            {o.city}, {o.country}
                          </p>
                          <p className="text-xs text-muted">{o.addr}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={220}>
                <div className="rounded-3xl bg-forest p-6 text-white">
                  <p className="text-sm font-semibold uppercase tracking-wider text-sun">
                    Response time
                  </p>
                  <p className="mt-2 font-display text-3xl font-extrabold">&lt; 24 hours</p>
                  <p className="mt-1.5 text-sm text-white/70">
                    Average first response across all channels, weekdays 9am–6pm WAT.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>
    </PageShell>
  );
}

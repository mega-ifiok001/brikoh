/** The 3 storefront templates merchants can choose from. */

export type WebsiteTemplate = {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  badge: string;
  heroStyle: "split" | "centered" | "editorial";
  accent: string;
  swatch: [string, string];
  font: string;
};

export const TEMPLATES: WebsiteTemplate[] = [
  {
    id: "classic",
    name: "Classic",
    desc: "Clean, light and timeless — suits any store.",
    emoji: "🤍",
    badge: "Minimal",
    heroStyle: "split",
    accent: "#E86100",
    swatch: ["#145A32", "#1E8449"],
    font: "font-display",
  },
  {
    id: "modern",
    name: "Modern",
    desc: "Bold gradients, big statements, playful energy.",
    emoji: "✨",
    badge: "Vibrant",
    heroStyle: "centered",
    accent: "#F2690E",
    swatch: ["#F2690E", "#FF8C4A"],
    font: "font-display",
  },
  {
    id: "bold",
    name: "Bold",
    desc: "Dark & editorial — fashion-forward and confident.",
    emoji: "🖤",
    badge: "Editorial",
    heroStyle: "editorial",
    accent: "#FF8C4A",
    swatch: ["#11231A", "#E86100"],
    font: "font-display",
  },
];

export const getTemplate = (id?: string) =>
  TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];

export const waLink = (phone?: string, text = "Hello! I'd like to ask about your products.") => {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : "https://wa.me/";
};

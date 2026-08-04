export type OrderStatus = "Paid" | "Shipped" | "Delivered" | "Processing" | "Refunded";

export type Order = {
  id: string;
  customer: string;
  date: string;
  items: string;
  total: number;
  status: OrderStatus;
};

export const orders: Order[] = [
  { id: "#2041", customer: "Adaeze Okafor", date: "Today, 10:24", items: "Ankara set · 2", total: 36500, status: "Paid" },
  { id: "#2040", customer: "Kwame Mensah", date: "Today, 09:12", items: "Leather bag · 1", total: 42000, status: "Shipped" },
  { id: "#2039", customer: "Zainab Toure", date: "Yesterday", items: "Skincare kit · 3", total: 27600, status: "Delivered" },
  { id: "#2038", customer: "Tolu Adeyemi", date: "Yesterday", items: "Beaded clutch · 1", total: 12500, status: "Processing" },
  { id: "#2037", customer: "Nana Boateng", date: "Mon, 08:40", items: "Kente scarf · 4", total: 18400, status: "Delivered" },
  { id: "#2036", customer: "Fatima Bello", date: "Mon, 07:05", items: "Perfume set · 2", total: 64000, status: "Paid" },
  { id: "#2035", customer: "David Mensah", date: "Sun", items: "Coffee beans · 6", total: 21000, status: "Refunded" },
];

export type Product = {
  id: string;
  name: string;
  emoji: string;
  price: number;
  stock: number;
  reorder: number;
  status: "Active" | "Low" | "Draft";
  sales: number;
};

export const products: Product[] = [
  { id: "P-102", name: "Embroidered Ankara Gown", emoji: "👗", price: 18250, stock: 42, reorder: 10, status: "Active", sales: 214 },
  { id: "P-088", name: "Handmade Leather Bag", emoji: "👜", price: 42000, stock: 12, reorder: 8, status: "Active", sales: 98 },
  { id: "P-121", name: "Beaded Clutch", emoji: "🪭", price: 12500, stock: 5, reorder: 10, status: "Low", sales: 176 },
  { id: "P-054", name: "Kente Silk Scarf", emoji: "🧣", price: 4600, stock: 88, reorder: 20, status: "Active", sales: 320 },
  { id: "P-133", name: "Shea Butter Skincare Kit", emoji: "🧴", price: 9200, stock: 3, reorder: 12, status: "Low", sales: 264 },
  { id: "P-077", name: "Nomad Coffee — Single Origin", emoji: "☕", price: 3500, stock: 120, reorder: 30, status: "Active", sales: 412 },
  { id: "P-145", name: "Beaded Sandals", emoji: "👡", price: 9800, stock: 0, reorder: 15, status: "Draft", sales: 0 },
];

export type Customer = {
  name: string;
  email: string;
  orders: number;
  spent: number;
  segment: "VIP" | "Regular" | "New";
  initials: string;
  grad: string;
};

export const customers: Customer[] = [
  { name: "Adaeze Okafor", email: "adaeze@example.com", orders: 24, spent: 486500, segment: "VIP", initials: "AO", grad: "from-sun to-brand" },
  { name: "Kwame Mensah", email: "kwame@example.com", orders: 17, spent: 312000, segment: "VIP", initials: "KM", grad: "from-leaf to-pine" },
  { name: "Zainab Toure", email: "zainab@example.com", orders: 11, spent: 198400, segment: "Regular", initials: "ZT", grad: "from-brand to-sun" },
  { name: "Tolu Adeyemi", email: "tolu@example.com", orders: 8, spent: 96400, segment: "Regular", initials: "TA", grad: "from-pine to-forest" },
  { name: "Nana Boateng", email: "nana@example.com", orders: 3, spent: 38400, segment: "New", initials: "NB", grad: "from-sun to-leaf" },
  { name: "Fatima Bello", email: "fatima@example.com", orders: 2, spent: 129000, segment: "New", initials: "FB", grad: "from-brand to-pine" },
];

export type Tx = {
  id: string;
  desc: string;
  date: string;
  amount: number;
  dir: "in" | "out";
  method: string;
};

export const transactions: Tx[] = [
  { id: "TXN-9012", desc: "Order #2041 — Adaeze O.", date: "Today, 10:24", amount: 36500, dir: "in", method: "Card" },
  { id: "TXN-9011", desc: "Order #2040 — Kwame M.", date: "Today, 09:12", amount: 42000, dir: "in", method: "Transfer" },
  { id: "TXN-9010", desc: "Payout to bank account", date: "Yesterday, 14:00", amount: 284000, dir: "out", method: "Bank" },
  { id: "TXN-9009", desc: "Order #2039 — Zainab T.", date: "Yesterday, 11:47", amount: 27600, dir: "in", method: "Mobile money" },
  { id: "TXN-9008", desc: "Refund — Order #2035", date: "Sun, 16:20", amount: 21000, dir: "out", method: "Card" },
  { id: "TXN-9007", desc: "Order #2036 — Fatima B.", date: "Mon, 07:05", amount: 64000, dir: "in", method: "Card" },
];

export const salesSeries = {
  "7d": [42, 58, 36, 72, 50, 88, 64],
  "30d": [30, 45, 38, 60, 52, 78, 70, 92, 58, 74, 66, 84],
  "90d": [22, 28, 35, 30, 44, 52, 48, 62, 58, 70, 66, 82, 78, 92],
};

export const channelData = [
  { label: "Direct / Website", value: 42, color: "bg-brand" },
  { label: "Social media", value: 28, color: "bg-leaf" },
  { label: "Marketplace", value: 18, color: "bg-sun" },
  { label: "Referrals", value: 12, color: "bg-pine" },
];

export const topProducts = [
  { name: "Kente Silk Scarf", emoji: "🧣", units: 320, revenue: 1472000, pct: 92 },
  { name: "Embroidered Ankara Gown", emoji: "👗", units: 214, revenue: 3905500, pct: 74 },
  { name: "Beaded Clutch", emoji: "🪭", units: 176, revenue: 2200000, pct: 61 },
  { name: "Shea Butter Skincare Kit", emoji: "🧴", units: 164, revenue: 1508800, pct: 48 },
];

export const lowStock = [
  { name: "Shea Butter Skincare Kit", emoji: "🧴", stock: 3, reorder: 12 },
  { name: "Beaded Clutch", emoji: "🪭", stock: 5, reorder: 10 },
  { name: "Handmade Leather Bag", emoji: "👜", stock: 8, reorder: 8 },
];

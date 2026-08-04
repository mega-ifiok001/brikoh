"use client";

import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

/* ============================== Types ============================== */

export type Branch = { id: string; name: string; location: string };

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  costPrice: number | null;
  sellingPrice: number;
  discountPrice: number | null;
  threshold: number;
  expiry: string | null;
  emoji: string;
  /** Product photos — first item is the cover. Emoji stand in for photos in the demo. */
  images: string[];
  status: "draft" | "active" | "archived";
  variants: { id: string; name: string; price: number; stock: number }[];
  createdAt: string;
};

export type StockEvent = {
  id: string;
  productId: string;
  variantId?: string;
  branchId: string;
  type: "initial" | "restock" | "sale" | "damage" | "correction" | "transfer_out" | "transfer_in";
  delta: number;
  note: string;
  ref: string;
  user: string;
  at: string;
};

export type Supplier = { id: string; name: string; phone: string; email: string; createdAt: string };
export type PurchaseOrder = {
  id: string;
  supplierId: string;
  branchId: string;
  items: { productId: string; name: string; qty: number; cost: number }[];
  status: "pending" | "approved" | "received" | "cancelled";
  createdAt: string;
  total: number;
};
export type CustomerSource = "STOREFRONT" | "POS" | "MANUAL" | "IMPORTED";
export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  groupId: string | null;
  groupIds: string[];
  source: CustomerSource;
  createdAt: string;
};
export type CustomerGroup = { id: string; name: string; discountPct: number; createdAt: string };
export type CustomerNote = { id: string; customerId: string; note: string; at: string };

/* ------------------------- Payments / Wallet ------------------------- */

export type PaymentChannel = "CARD" | "BANK_TRANSFER" | "USSD" | "QR";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REVERSED";
export type PaymentTransaction = {
  id: string;
  saleId: string;
  paystackReference: string;
  amount: number;
  paystackFee: number;
  netAmount: number;
  channel: PaymentChannel;
  status: PaymentStatus;
  paidAt: string;
  settledAt: string | null;
  createdAt: string;
};

export type WalletEntryType = "SALE_SETTLEMENT" | "WITHDRAWAL" | "INTEREST_PAYOUT" | "FEE" | "REVERSAL" | "REFUND";
export type WalletEntry = {
  id: string;
  type: WalletEntryType;
  amount: number; // positive = credit, negative = debit
  referenceId: string;
  note: string;
  settled: boolean; // Phase 1: pending until Paystack settlement window
  at: string;
};

export type WithdrawalStatus = "PENDING" | "PROCESSING" | "SUCCESSFUL" | "FAILED";
export type Withdrawal = {
  id: string;
  amount: number;
  fee: number;
  bankAccountId: string;
  status: WithdrawalStatus;
  requestedAt: string;
  completedAt: string | null;
};

export type BankAccount = {
  id: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  accountName: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
};

export type Expense = {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
};
export type Discount = {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  appliesTo: "product" | "category" | "group" | "all";
  target: string;
  start: string | null;
  end: string | null;
  active: boolean;
};
export type Sale = {
  id: string;
  customerId: string | null;
  customerName: string;
  branchId: string;
  items: { productId: string; name: string; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  total: number;
  method: "cash" | "transfer" | "card" | "credit";
  paid: number;
  status: "paid" | "owing" | "partial";
  at: string;
};
export type Staff = {
  id: string;
  name: string; email: string; phone: string;
  role: "owner" | "admin" | "manager" | "cashier";
  permissions: string[];
  active: boolean;
};
export type AuditEntry = { id: string; at: string; user: string; action: string; detail: string };

export type DB = {
  branches: Branch[];
  products: Product[];
  events: StockEvent[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  customers: Customer[];
  groups: CustomerGroup[];
  discounts: Discount[];
  sales: Sale[];
  staff: Staff[];
  audit: AuditEntry[];
  categories: string[];
  units: string[];
  payments: PaymentTransaction[];
  ledger: WalletEntry[];
  withdrawals: Withdrawal[];
  bankAccounts: BankAccount[];
  expenses: Expense[];
  expenseCategories: string[];
  notes: CustomerNote[];
};

/* ============================ Helpers ============================== */

export const uid = () => Math.random().toString(36).slice(2, 9).toUpperCase();
const now = () => new Date().toISOString();
const daysAgo = (n: number, h = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, 24, 0, 0);
  return d.toISOString();
};
const daysAhead = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

/** THE core rule: stock is ALWAYS calculated from the event log. */
export function stockOnHand(db: DB, productId: string, branchId: string, variantId?: string) {
  return db.events
    .filter((e) => e.productId === productId && e.branchId === branchId && (variantId ? e.variantId === variantId : !e.variantId))
    .reduce((s, e) => s + e.delta, 0);
}

export const totalStock = (db: DB, productId: string) =>
  db.branches.reduce((s, b) => s + stockOnHand(db, productId, b.id), 0);

export const fmtMoney = (cur: string, n: number) => {
  const sym: Record<string, string> = { NGN: "₦", USD: "$", GHS: "GH₵", KES: "KSh", ZAR: "R", GBP: "£", EUR: "€" };
  return `${sym[cur] ?? ""}${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

/* ------------------------- Wallet helpers (Phase 1) ------------------------- */

export function walletBalances(db: DB) {
  const available = db.ledger.filter((l) => l.settled).reduce((s, l) => s + l.amount, 0);
  const pending = db.ledger.filter((l) => !l.settled && l.type === "SALE_SETTLEMENT").reduce((s, l) => s + l.amount, 0);
  return { available, pending };
}

/** Customer stats — ALWAYS calculated from sales, never stored. */
export function customerStats(db: DB, customerId: string) {
  const sales = db.sales.filter((s) => s.customerId === customerId);
  const totalSpent = sales.reduce((s, x) => s + x.total, 0);
  const totalOrders = sales.length;
  const owing = sales.filter((s) => s.status !== "paid").reduce((s, x) => s + (x.total - x.paid), 0);
  const last = sales.length ? sales.reduce((a, b) => (a.at > b.at ? a : b)).at : null;
  return { sales, totalSpent, totalOrders, owing, last };
}

/* ============================== Seed =============================== */

function seed(): DB {
  const branches: Branch[] = [
    { id: "b1", name: "Main Store", location: "Lagos" },
    { id: "b2", name: "Online Store", location: "Web" },
    { id: "b3", name: "Ikeja Branch", location: "Lagos" },
  ];
  const categories = ["Fashion & Apparel", "Beauty & Skincare", "Food & Drinks", "Home & Living"];
  const units = ["Pieces", "Kg", "Litres", "Packs", "Boxes"];

  const P = (p: Partial<Product> & Pick<Product, "id" | "name">): Product => ({
    description: "", costPrice: null, discountPrice: null, expiry: null, emoji: "📦",
    images: ["📦"], threshold: 10, status: "active", variants: [], createdAt: daysAgo(60),
    category: categories[0], unit: units[0], sellingPrice: 0, ...p,
  });

  const products: Product[] = [
    P({ id: "P1", name: "Embroidered Ankara Gown", category: categories[0], unit: units[0], costPrice: 9000, sellingPrice: 18250, discountPrice: 16500, threshold: 10, emoji: "👗", images: ["👗", "🧵", "✨"], createdAt: daysAgo(90) }),
    P({ id: "P2", name: "Handmade Leather Bag", category: categories[0], unit: units[0], costPrice: 21000, sellingPrice: 42000, threshold: 8, emoji: "👜", images: ["👜", "🧳", "🪡"], createdAt: daysAgo(80) }),
    P({ id: "P3", name: "Beaded Clutch", category: categories[0], unit: units[0], costPrice: 5200, sellingPrice: 12500, threshold: 10, emoji: "🪭", images: ["🪭", "💎", "🎀"], createdAt: daysAgo(70) }),
    P({ id: "P4", name: "Kente Silk Scarf", category: categories[0], unit: units[0], costPrice: 1800, sellingPrice: 4600, threshold: 20, emoji: "🧣", images: ["🧣", "🎨", "🟥"], createdAt: daysAgo(65) }),
    P({ id: "P5", name: "Shea Butter Skincare Kit", category: categories[1], unit: units[0], costPrice: 4000, sellingPrice: 9200, threshold: 12, expiry: daysAhead(4), emoji: "🧴", images: ["🧴", "🌸", "🧪"], createdAt: daysAgo(50) }),
    P({ id: "P6", name: "Nomad Coffee — Single Origin", category: categories[2], unit: units[1], costPrice: 1400, sellingPrice: 3500, threshold: 30, expiry: daysAhead(6), emoji: "☕", images: ["☕", "🫘", "🌱"], createdAt: daysAgo(45) }),
    P({ id: "P7", name: "Vitamin C Face Serum", category: categories[1], unit: units[0], costPrice: 2500, sellingPrice: 6800, threshold: 15, emoji: "🧪", images: ["🧪", "💧", "✨"], createdAt: daysAgo(40) }),
    P({ id: "P8", name: "Beaded Sandals", category: categories[0], unit: units[0], costPrice: 4000, sellingPrice: 9800, threshold: 15, status: "draft", emoji: "👡", images: ["👡", "🏖️", "✨"], createdAt: daysAgo(10) }),
  ];

  const E = (e: Omit<StockEvent, "id" | "user" | "at" | "ref"> & { at?: string; user?: string; ref?: string }): StockEvent => ({
    id: uid(), user: "Ada Obi", at: daysAgo(2), ref: "", ...e,
  });

  const events: StockEvent[] = [
    E({ productId: "P1", branchId: "b1", type: "initial", delta: 30, note: "Opening stock", at: daysAgo(60) }),
    E({ productId: "P1", branchId: "b1", type: "sale", delta: -6, note: "Sale #SL-1001", ref: "SL-1001", at: daysAgo(20) }),
    E({ productId: "P1", branchId: "b1", type: "restock", delta: 25, note: "Supplier: Kente Fabrics", at: daysAgo(10) }),
    E({ productId: "P1", branchId: "b1", type: "sale", delta: -7, note: "Sale #SL-1013", ref: "SL-1013", at: daysAgo(1) }),
    E({ productId: "P2", branchId: "b1", type: "initial", delta: 10, note: "Opening stock", at: daysAgo(55) }),
    E({ productId: "P2", branchId: "b1", type: "restock", delta: 8, note: "Supplier: Aso Leather Works", at: daysAgo(12) }),
    E({ productId: "P2", branchId: "b1", type: "sale", delta: -6, note: "Sale #SL-1008", ref: "SL-1008", at: daysAgo(3) }),
    E({ productId: "P3", branchId: "b1", type: "initial", delta: 20, note: "Opening stock", at: daysAgo(48) }),
    E({ productId: "P3", branchId: "b1", type: "sale", delta: -15, note: "Multiple sales", at: daysAgo(2) }),
    E({ productId: "P4", branchId: "b2", type: "initial", delta: 100, note: "Opening stock (online)", at: daysAgo(60) }),
    E({ productId: "P4", branchId: "b2", type: "sale", delta: -12, note: "Online orders", at: daysAgo(4) }),
    E({ productId: "P5", branchId: "b1", type: "initial", delta: 20, note: "Opening stock", at: daysAgo(50) }),
    E({ productId: "P5", branchId: "b1", type: "sale", delta: -17, note: "Beauty week promo", at: daysAgo(1) }),
    E({ productId: "P6", branchId: "b2", type: "initial", delta: 150, note: "Opening stock (online)", at: daysAgo(45) }),
    E({ productId: "P6", branchId: "b2", type: "sale", delta: -30, note: "Online orders", at: daysAgo(5) }),
    E({ productId: "P7", branchId: "b1", type: "initial", delta: 15, note: "Opening stock", at: daysAgo(40) }),
    E({ productId: "P7", branchId: "b1", type: "sale", delta: -15, note: "Sold out", at: daysAgo(2) }),
  ];

  const suppliers: Supplier[] = [
    { id: "S1", name: "Kente Fabrics Ltd", phone: "+234 801 111 2233", email: "hello@kentefabrics.com", createdAt: daysAgo(80) },
    { id: "S2", name: "Aso Leather Works", phone: "+234 802 222 3344", email: "sales@asoleather.com", createdAt: daysAgo(70) },
    { id: "S3", name: "Pure Earth Beauty", phone: "+234 803 333 4455", email: "orders@pureearth.com", createdAt: daysAgo(55) },
    { id: "S4", name: "Nomad Coffee Roasters", phone: "+234 804 444 5566", email: "trade@nomadcoffee.com", createdAt: daysAgo(45) },
  ];

  const purchaseOrders: PurchaseOrder[] = [
    {
      id: "PO-1042", supplierId: "S1", branchId: "b1",
      items: [{ productId: "P1", name: "Embroidered Ankara Gown", qty: 30, cost: 9000 }],
      status: "received", createdAt: daysAgo(9), total: 270000,
    },
    {
      id: "PO-1043", supplierId: "S3", branchId: "b1",
      items: [{ productId: "P5", name: "Shea Butter Skincare Kit", qty: 24, cost: 4000 }],
      status: "approved", createdAt: daysAgo(3), total: 96000,
    },
    {
      id: "PO-1044", supplierId: "S2", branchId: "b1",
      items: [{ productId: "P2", name: "Handmade Leather Bag", qty: 10, cost: 21000 }],
      status: "pending", createdAt: daysAgo(1), total: 210000,
    },
  ];

  const groups: CustomerGroup[] = [
    { id: "G1", name: "VIP Customers", discountPct: 10, createdAt: daysAgo(50) },
    { id: "G2", name: "Wholesale", discountPct: 15, createdAt: daysAgo(40) },
  ];

  const customers: Customer[] = [
    { id: "C1", name: "Adaeze Okafor", phone: "+234 805 555 0011", email: "adaeze@example.com", groupId: "G1", groupIds: ["G1"], source: "POS", createdAt: daysAgo(40) },
    { id: "C2", name: "Kwame Mensah", phone: "+233 20 111 2233", email: "kwame@example.com", groupId: "G2", groupIds: ["G2"], source: "MANUAL", createdAt: daysAgo(35) },
    { id: "C3", name: "Zainab Toure", phone: "+234 806 666 7788", email: "zainab@example.com", groupId: null, groupIds: [], source: "STOREFRONT", createdAt: daysAgo(30) },
    { id: "C4", name: "Tolu Adeyemi", phone: "+234 807 777 8899", email: "tolu@example.com", groupId: null, groupIds: [], source: "POS", createdAt: daysAgo(20) },
    { id: "C5", name: "Nana Boateng", phone: "+233 24 555 6677", email: "nana@example.com", groupId: null, groupIds: [], source: "IMPORTED", createdAt: daysAgo(8) },
  ];

  const discounts: Discount[] = [
    { id: "D1", name: "Beauty week 15%", type: "percentage", value: 15, appliesTo: "category", target: "Beauty & Skincare", start: daysAgo(3), end: daysAhead(4), active: true },
    { id: "D2", name: "VIP 10% off", type: "percentage", value: 10, appliesTo: "group", target: "G1", start: null, end: null, active: true },
  ];

  const sales: Sale[] = [
    { id: "SL-1013", customerId: "C1", customerName: "Adaeze Okafor", branchId: "b1", items: [{ productId: "P1", name: "Embroidered Ankara Gown", qty: 2, price: 18250 }], subtotal: 36500, discount: 0, total: 36500, method: "cash", paid: 36500, status: "paid", at: daysAgo(1) },
    { id: "SL-1012", customerId: "C2", customerName: "Kwame Mensah", branchId: "b1", items: [{ productId: "P2", name: "Handmade Leather Bag", qty: 1, price: 42000 }], subtotal: 42000, discount: 4200, total: 37800, method: "credit", paid: 0, status: "owing", at: daysAgo(2) },
    { id: "SL-1011", customerId: "C3", customerName: "Zainab Toure", branchId: "b1", items: [{ productId: "P5", name: "Shea Butter Skincare Kit", qty: 3, price: 9200 }], subtotal: 27600, discount: 4140, total: 23460, method: "credit", paid: 10000, status: "partial", at: daysAgo(3) },
    { id: "SL-1010", customerId: null, customerName: "Walk-in customer", branchId: "b2", items: [{ productId: "P4", name: "Kente Silk Scarf", qty: 2, price: 4600 }], subtotal: 9200, discount: 0, total: 9200, method: "card", paid: 9200, status: "paid", at: daysAgo(4) },
  ];

  const staff: Staff[] = [
    { id: "ST1", name: "Ada Obi", email: "ada@brikoh.app", phone: "+234 800 000 0001", role: "owner", permissions: ["all"], active: true },
    { id: "ST2", name: "Chidi Nwosu", email: "chidi@brikoh.app", phone: "+234 800 000 0002", role: "manager", permissions: ["view_profit", "manage_products", "record_sales", "manage_staff"], active: true },
    { id: "ST3", name: "Bisi Ade", email: "bisi@brikoh.app", phone: "+234 800 000 0003", role: "cashier", permissions: ["record_sales"], active: true },
    { id: "ST4", name: "Emeka Obi", email: "emeka@brikoh.app", phone: "+234 800 000 0004", role: "admin", permissions: ["all"], active: false },
  ];

  const audit: AuditEntry[] = [
    { id: uid(), at: daysAgo(1), user: "Ada Obi", action: "record_sale", detail: "Recorded sale SL-1013 (₦36,500)" },
    { id: uid(), at: daysAgo(2), user: "Ada Obi", action: "stock_adjustment", detail: "P5 Beaded Clutch — sale of 15 units" },
    { id: uid(), at: daysAgo(3), user: "Chidi Nwosu", action: "restock", detail: "P2 Leather Bag — restocked +8" },
    { id: uid(), at: daysAgo(4), user: "Ada Obi", action: "product_edit", detail: "Updated price on P6 Nomad Coffee" },
    { id: uid(), at: daysAgo(5), user: "Bisi Ade", action: "record_sale", detail: "Recorded sale SL-1010 (₦9,200)" },
  ];

  /* ------------ Payments / Wallet / Accounting seed (Phase 1) ------------ */

  const bankAccounts: BankAccount[] = [
    { id: "BA1", accountNumber: "0123456789", bankName: "Guaranty Trust Bank", bankCode: "058", accountName: "Amara Obi", isDefault: true, isVerified: true, createdAt: daysAgo(60) },
    { id: "BA2", accountNumber: "2098765432", bankName: "Kuda Bank", bankCode: "50211", accountName: "Amara & Co. Ltd", isDefault: false, isVerified: false, createdAt: daysAgo(30) },
  ];

  const payments: PaymentTransaction[] = [
    { id: "PAY-9001", saleId: "SL-1013", paystackReference: "PSTK-8F3A9C2", amount: 36500, paystackFee: 548, netAmount: 35952, channel: "CARD", status: "SUCCESS", paidAt: daysAgo(1), settledAt: null, createdAt: daysAgo(1) },
    { id: "PAY-9000", saleId: "SL-1010", paystackReference: "PSTK-2B7D4E1", amount: 9200, paystackFee: 138, netAmount: 9062, channel: "BANK_TRANSFER", status: "SUCCESS", paidAt: daysAgo(4), settledAt: daysAgo(3), createdAt: daysAgo(4) },
    { id: "PAY-8999", saleId: "SL-1009", paystackReference: "PSTK-5C1A8F6", amount: 64000, paystackFee: 960, netAmount: 63040, channel: "CARD", status: "SUCCESS", paidAt: daysAgo(6), settledAt: daysAgo(5), createdAt: daysAgo(6) },
    { id: "PAY-8998", saleId: "SL-1007", paystackReference: "PSTK-9E2B6D3", amount: 27600, paystackFee: 414, netAmount: 27186, channel: "USSD", status: "SUCCESS", paidAt: daysAgo(8), settledAt: daysAgo(7), createdAt: daysAgo(8) },
  ];

  const ledger: WalletEntry[] = [
    { id: uid(), type: "SALE_SETTLEMENT", amount: 35952, referenceId: "PAY-9001", note: "Sale SL-1013 (pending settlement)", settled: false, at: daysAgo(1) },
    { id: uid(), type: "SALE_SETTLEMENT", amount: 148240, referenceId: "PAY-8995", note: "Sale SL-1005 (pending settlement)", settled: false, at: daysAgo(1) },
    { id: uid(), type: "SALE_SETTLEMENT", amount: 9062, referenceId: "PAY-9000", note: "Sale SL-1010", settled: true, at: daysAgo(4) },
    { id: uid(), type: "SALE_SETTLEMENT", amount: 63040, referenceId: "PAY-8999", note: "Sale SL-1009", settled: true, at: daysAgo(6) },
    { id: uid(), type: "SALE_SETTLEMENT", amount: 27186, referenceId: "PAY-8998", note: "Sale SL-1007", settled: true, at: daysAgo(8) },
    { id: uid(), type: "SALE_SETTLEMENT", amount: 284000, referenceId: "PAY-8994", note: "Bulk online orders", settled: true, at: daysAgo(10) },
    { id: uid(), type: "SALE_SETTLEMENT", amount: 412500, referenceId: "PAY-8993", note: "Bulk online orders", settled: true, at: daysAgo(12) },
    { id: uid(), type: "SALE_SETTLEMENT", amount: 396000, referenceId: "PAY-8992", note: "Bulk online orders", settled: true, at: daysAgo(14) },
    { id: uid(), type: "WITHDRAWAL", amount: -500000, referenceId: "WD-3001", note: "Withdrawal to GTBank", settled: true, at: daysAgo(9) },
    { id: uid(), type: "FEE", amount: -50, referenceId: "WD-3001", note: "Withdrawal fee", settled: true, at: daysAgo(9) },
  ];

  const withdrawals: Withdrawal[] = [
    { id: "WD-3001", amount: 500000, fee: 50, bankAccountId: "BA1", status: "SUCCESSFUL", requestedAt: daysAgo(9), completedAt: daysAgo(8) },
  ];

  const expenseCategories = ["Rent", "Transport", "Packaging", "Salaries", "Marketing", "Utilities", "Other"];

  const expenses: Expense[] = [
    { id: "EXP-1", category: "Rent", amount: 250000, description: "Shop rent — June", date: daysAgo(12), createdAt: daysAgo(12) },
    { id: "EXP-2", category: "Packaging", amount: 45200, description: "Bags & tissue paper", date: daysAgo(7), createdAt: daysAgo(7) },
    { id: "EXP-3", category: "Marketing", amount: 60000, description: "Instagram ads", date: daysAgo(4), createdAt: daysAgo(4) },
    { id: "EXP-4", category: "Transport", amount: 30000, description: "Delivery fuel", date: daysAgo(2), createdAt: daysAgo(2) },
  ];

  const notes: CustomerNote[] = [
    { id: uid(), customerId: "C1", note: "Prefers WhatsApp over calls. Delivers to Lekki.", at: daysAgo(5) },
  ];

  return {
    branches, products, events, suppliers, purchaseOrders, customers, groups, discounts, sales, staff, audit, categories, units,
    payments, ledger, withdrawals, bankAccounts, expenses, expenseCategories, notes,
  };
}

/* ============================ Persistence ========================== */

const KEY = "brikoh_inventory";
export function loadInventoryDB(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw) as DB;
      // Migration: older saved data has no images array → derive from emoji.
      if (d.products[0] && !Array.isArray(d.products[0].images)) {
        d.products = d.products.map((p) => ({ ...p, images: (p as { images?: string[] }).images ?? [p.emoji] }));
      }
      return d;
    }
  } catch { /* ignore */ }
  return seed();
}

export function saveInventoryDB(db: DB) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ }
}

function loadDB(): DB {
  return loadInventoryDB();
}

/* ============================ Context ============================== */

export type InventoryApi = {
  db: DB;
  resetDemo: () => void;
  addProduct: (p: Omit<Product, "id" | "createdAt" | "status"> & { status?: Product["status"] }, startingStock: number) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  duplicateProduct: (id: string) => Product | null;
  restock: (productId: string, variantId: string | undefined, branchId: string, qty: number, supplierId?: string, note?: string) => void;
  adjustStock: (productId: string, variantId: string | undefined, branchId: string, type: "damage" | "correction", qty: number, note: string) => void;
  transfer: (productId: string, variantId: string | undefined, fromBranch: string, toBranch: string, qty: number) => void;
  addCategory: (name: string) => void;
  addUnit: (name: string) => void;
  addBranch: (name: string, location: string) => void;
  addSupplier: (s: Omit<Supplier, "id" | "createdAt">) => void;
  addCustomer: (c: Omit<Customer, "id" | "createdAt">) => void;
  findOrCreateCustomer: (name: string, phone: string, email: string, source: CustomerSource) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  addCustomerNote: (customerId: string, note: string) => void;
  addGroup: (g: Omit<CustomerGroup, "id" | "createdAt">) => void;
  addDiscount: (d: Omit<Discount, "id">) => void;
  toggleDiscount: (id: string) => void;
  addPO: (po: Omit<PurchaseOrder, "id" | "createdAt" | "total" | "status">) => void;
  setPOStatus: (id: string, status: PurchaseOrder["status"]) => void;
  recordSale: (s: Omit<Sale, "id" | "at" | "status">) => Sale;
  repay: (saleId: string, amount: number) => void;
  addStaff: (s: Omit<Staff, "id">) => void;
  toggleStaff: (id: string) => void;
  setStaffRole: (id: string, role: Staff["role"]) => void;
  logAudit: (action: string, detail: string) => void;

  /* Payments & Wallet (Phase 1) */
  recordPayment: (saleId: string, channel: PaymentChannel) => PaymentTransaction;
  withdraw: (amount: number, bankAccountId: string) => Withdrawal;
  completeWithdrawal: (id: string) => void;
  addBankAccount: (a: Omit<BankAccount, "id" | "createdAt" | "isDefault" | "isVerified">) => void;
  verifyBankAccount: (id: string) => void;
  setDefaultBankAccount: (id: string) => void;

  /* Expenses */
  addExpense: (e: Omit<Expense, "id" | "createdAt">) => void;
  deleteExpense: (id: string) => void;
  addExpenseCategory: (name: string) => void;
};

const InventoryContext = createContext<InventoryApi | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [db, setDb] = useState<DB>(() => loadDB());

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ }
  }, [db]);

  const actor = user?.name ?? "System";

  const api = useMemo<InventoryApi>(() => {
    const logAudit = (action: string, detail: string) =>
      setDb((d) => ({ ...d, audit: [{ id: uid(), at: now(), user: actor, action, detail }, ...d.audit].slice(0, 200) }));

    const addEvent = (e: Omit<StockEvent, "id" | "user" | "at">) =>
      setDb((d) => ({ ...d, events: [...d.events, { ...e, id: uid(), user: actor, at: now() }] }));

    return {
      db,
      resetDemo: () => { setDb(seed()); },

      addProduct: (p, startingStock) => {
        const product: Product = { ...p, id: `P${uid()}`, status: p.status ?? "draft", createdAt: now() };
        setDb((d) => {
          const events = [...d.events];
          // variant stock becomes its own initial event
          product.variants.forEach((v) => events.push({ id: uid(), productId: product.id, variantId: v.id, branchId: d.branches[0].id, type: "initial", delta: v.stock, note: `Initial stock — ${v.name}`, ref: "", user: actor, at: now() }));
          if (startingStock > 0 && product.variants.length === 0) {
            events.push({ id: uid(), productId: product.id, branchId: d.branches[0].id, type: "initial", delta: startingStock, note: "Opening stock", ref: "", user: actor, at: now() });
          }
          return { ...d, products: [product, ...d.products], events };
        });
        logAudit("product_create", `Created "${product.name}"`);
        return product;
      },

      updateProduct: (id, patch) => {
        setDb((d) => ({ ...d, products: d.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
        logAudit("product_edit", `Updated product ${id}`);
      },

      deleteProduct: (id) => {
        setDb((d) => ({ ...d, products: d.products.map((p) => (p.id === id ? { ...p, status: "archived" } : p)) }));
        logAudit("product_delete", `Soft-deleted product ${id}`);
      },

      duplicateProduct: (id) => {
        const src = db.products.find((p) => p.id === id);
        if (!src) return null;
        const copy: Product = { ...src, id: `P${uid()}`, name: `${src.name} (copy)`, status: "draft", variants: [], createdAt: now() };
        setDb((d) => ({ ...d, products: [copy, ...d.products] }));
        logAudit("product_duplicate", `Duplicated "${src.name}" → draft "${copy.name}"`);
        return copy;
      },

      restock: (productId, variantId, branchId, qty, supplierId, note) => {
        addEvent({ productId, variantId, branchId, type: "restock", delta: qty, note: note || (supplierId ? `Restock from ${db.suppliers.find((s) => s.id === supplierId)?.name ?? "supplier"}` : "Restock"), ref: "" });
        logAudit("restock", `Restocked +${qty} of ${productId}${variantId ? ` (${variantId})` : ""}`);
      },

      adjustStock: (productId, variantId, branchId, type, qty, note) => {
        addEvent({ productId, variantId, branchId, type, delta: type === "damage" ? -qty : qty, note: note || (type === "damage" ? "Damaged goods" : "Stock correction"), ref: "" });
        logAudit("stock_adjustment", `${type === "damage" ? "Damage" : "Correction"} on ${productId}: ${type === "damage" ? "-" : "+"}${qty}`);
      },

      transfer: (productId, variantId, fromBranch, toBranch, qty) => {
        addEvent({ productId, variantId, branchId: fromBranch, type: "transfer_out", delta: -qty, note: `Transfer to ${db.branches.find((b) => b.id === toBranch)?.name}`, ref: "" });
        addEvent({ productId, variantId, branchId: toBranch, type: "transfer_in", delta: qty, note: `Transfer from ${db.branches.find((b) => b.id === fromBranch)?.name}`, ref: "" });
        logAudit("stock_transfer", `Transferred ${qty} of ${productId} between branches`);
      },

      addCategory: (name) => { setDb((d) => ({ ...d, categories: [...d.categories, name] })); logAudit("category_create", `Added category "${name}"`); },
      addUnit: (name) => { setDb((d) => ({ ...d, units: [...d.units, name] })); logAudit("unit_create", `Added unit "${name}"`); },
      addBranch: (name, location) => { setDb((d) => ({ ...d, branches: [...d.branches, { id: `B${uid()}`, name, location }] })); logAudit("branch_create", `Added branch "${name}"`); },

      addSupplier: (s) => { setDb((d) => ({ ...d, suppliers: [{ ...s, id: `S${uid()}`, createdAt: now() }, ...d.suppliers] })); logAudit("supplier_create", `Added supplier "${s.name}"`); },
      addCustomer: (c) => { setDb((d) => ({ ...d, customers: [{ ...c, id: `C${uid()}`, createdAt: now() }, ...d.customers] })); logAudit("customer_create", `Added customer "${c.name}"`); },

      findOrCreateCustomer: (name, phone, email, source) => {
        const digits = phone.replace(/\D/g, "");
        const existing = db.customers.find((c) => c.phone.replace(/\D/g, "") === digits);
        if (existing) {
          setDb((d) => ({ ...d, customers: d.customers.map((c) => (c.id === existing.id ? { ...c, name: name || c.name, email: email || c.email } : c)) }));
          return existing;
        }
        const customer: Customer = {
          id: `C${uid()}`, name: name.trim(), phone: phone.trim(), email: email.trim(),
          groupId: null, groupIds: [], source, createdAt: now(),
        };
        setDb((d) => ({ ...d, customers: [customer, ...d.customers] }));
        logAudit("customer_auto", `Auto-created customer "${customer.name}" from ${source}`);
        return customer;
      },

      updateCustomer: (id, patch) => {
        setDb((d) => ({ ...d, customers: d.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
        logAudit("customer_edit", `Updated customer ${id}`);
      },

      addCustomerNote: (customerId, note) => {
        setDb((d) => ({ ...d, notes: [{ id: uid(), customerId, note: note.trim(), at: now() }, ...d.notes] }));
        logAudit("customer_note", `Added note to customer ${customerId}`);
      },
      addGroup: (g) => { setDb((d) => ({ ...d, groups: [{ ...g, id: `G${uid()}`, createdAt: now() }, ...d.groups] })); logAudit("group_create", `Added group "${g.name}"`); },

      addDiscount: (d) => { setDb((db0) => ({ ...db0, discounts: [{ ...d, id: `D${uid()}`, active: true }, ...db0.discounts] })); logAudit("discount_create", `Created discount "${d.name}"`); },
      toggleDiscount: (id) => { setDb((d) => ({ ...d, discounts: d.discounts.map((x) => (x.id === id ? { ...x, active: !x.active } : x)) })); logAudit("discount_toggle", `Toggled discount ${id}`); },

      addPO: (po) => {
        const total = po.items.reduce((s, i) => s + i.qty * i.cost, 0);
        setDb((d) => ({ ...d, purchaseOrders: [{ ...po, id: `PO-${Math.floor(1000 + Math.random() * 9000)}`, total, status: "pending" as const, createdAt: now() }, ...d.purchaseOrders] }));
        logAudit("po_create", `Created purchase order for ${po.items.length} item(s)`);
      },

      setPOStatus: (id, status) => {
        setDb((d) => {
          const po = d.purchaseOrders.find((p) => p.id === id);
          const events = [...d.events];
          if (po && status === "received") {
            po.items.forEach((it) => events.push({ id: uid(), productId: it.productId, branchId: po.branchId, type: "restock", delta: it.qty, note: `PO ${po.id} received — ${it.name}`, ref: po.id, user: actor, at: now() }));
          }
          return { ...d, purchaseOrders: d.purchaseOrders.map((p) => (p.id === id ? { ...p, status } : p)), events };
        });
        logAudit("po_status", `PO ${id} → ${status}`);
      },

      recordSale: (s) => {
        const sale: Sale = { ...s, id: `SL-${Math.floor(1000 + Math.random() * 9000)}`, at: now(), status: s.method === "credit" ? (s.paid >= s.total ? "paid" : s.paid > 0 ? "partial" : "owing") : "paid" };
        setDb((d) => {
          const events = [...d.events];
          s.items.forEach((it) => events.push({ id: uid(), productId: it.productId, branchId: s.branchId, type: "sale", delta: -it.qty, note: `Sale ${sale.id} — ${it.name} ×${it.qty}`, ref: sale.id, user: actor, at: now() }));
          // update customer owing
          const customers = s.customerId ? d.customers.map((c) => c.id === s.customerId ? { ...c } : c) : d.customers;
          return { ...d, sales: [sale, ...d.sales], events, customers };
        });
        logAudit("record_sale", `Recorded sale ${sale.id} (${fmtMoney("NGN", sale.total)})`);
        return sale;
      },

      repay: (saleId, amount) => {
        setDb((d) => {
          const sale = d.sales.find((s) => s.id === saleId);
          if (!sale) return d;
          const paid = Math.min(sale.total, sale.paid + amount);
          const status = paid >= sale.total ? "paid" : "partial";
          return { ...d, sales: d.sales.map((s) => (s.id === saleId ? { ...s, paid, status } : s)) };
        });
        logAudit("repayment", `Recorded ${fmtMoney("NGN", amount)} repayment on ${saleId}`);
      },

      addStaff: (s) => { setDb((d) => ({ ...d, staff: [{ ...s, id: `ST${uid()}` }, ...d.staff] })); logAudit("staff_invite", `Invited "${s.name}" as ${s.role}`); },
      toggleStaff: (id) => { setDb((d) => ({ ...d, staff: d.staff.map((s) => (s.id === id ? { ...s, active: !s.active } : s)) })); logAudit("staff_toggle", `Toggled staff ${id}`); },
      setStaffRole: (id, role) => { setDb((d) => ({ ...d, staff: d.staff.map((s) => (s.id === id ? { ...s, role } : s)) })); logAudit("staff_role", `Changed role for ${id} → ${role}`); },

      /* ---------------- Payments & Wallet (Phase 1) ---------------- */

      recordPayment: (saleId, channel) => {
        const sale = db.sales.find((s) => s.id === saleId);
        const amount = sale?.total ?? 0;
        const paystackFee = Math.max(100, Math.round(amount * 0.015));
        const payment: PaymentTransaction = {
          id: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
          saleId,
          paystackReference: `PSTK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
          amount,
          paystackFee,
          netAmount: amount - paystackFee,
          channel,
          status: "SUCCESS",
          paidAt: now(),
          settledAt: null,
          createdAt: now(),
        };
        setDb((d) => ({
          ...d,
          payments: [payment, ...d.payments],
          ledger: [
            { id: uid(), type: "SALE_SETTLEMENT", amount: payment.netAmount, referenceId: payment.id, note: `Sale ${saleId} (pending Paystack settlement)`, settled: false, at: now() },
            ...d.ledger,
          ],
        }));
        logAudit("payment_received", `Payment ${payment.id} for ${saleId} via ${channel}`);
        return payment;
      },

      withdraw: (amount, bankAccountId) => {
        const fee = 50;
        const wd: Withdrawal = {
          id: `WD-${Math.floor(1000 + Math.random() * 9000)}`,
          amount,
          fee,
          bankAccountId,
          status: "PENDING",
          requestedAt: now(),
          completedAt: null,
        };
        setDb((d) => ({
          ...d,
          withdrawals: [wd, ...d.withdrawals],
          ledger: [
            { id: uid(), type: "WITHDRAWAL", amount: -amount, referenceId: wd.id, note: `Withdrawal to bank`, settled: true, at: now() },
            { id: uid(), type: "FEE", amount: -fee, referenceId: wd.id, note: "Withdrawal fee", settled: true, at: now() },
            ...d.ledger,
          ],
        }));
        logAudit("withdrawal_request", `Requested withdrawal ${wd.id} of ${amount}`);
        return wd;
      },

      completeWithdrawal: (id) => {
        setDb((d) => ({
          ...d,
          withdrawals: d.withdrawals.map((w) =>
            w.id === id ? { ...w, status: (w.status === "PENDING" ? "PROCESSING" : w.status === "PROCESSING" ? "SUCCESSFUL" : w.status) as WithdrawalStatus, completedAt: w.status === "PROCESSING" ? now() : w.completedAt } : w
          ),
        }));
        logAudit("withdrawal_update", `Withdrawal ${id} updated`);
      },

      addBankAccount: (a) => {
        setDb((d) => ({ ...d, bankAccounts: [...d.bankAccounts, { ...a, id: `BA${uid()}`, isDefault: d.bankAccounts.length === 0, isVerified: false, createdAt: now() }] }));
        logAudit("bank_add", `Added bank account ${a.accountNumber}`);
      },

      verifyBankAccount: (id) => {
        setDb((d) => ({ ...d, bankAccounts: d.bankAccounts.map((b) => (b.id === id ? { ...b, isVerified: true, accountName: b.accountName || "Verified Account Name" } : b)) }));
        logAudit("bank_verify", `Verified bank account ${id}`);
      },

      setDefaultBankAccount: (id) => {
        setDb((d) => ({ ...d, bankAccounts: d.bankAccounts.map((b) => ({ ...b, isDefault: b.id === id })) }));
      },

      /* ---------------- Expenses ---------------- */

      addExpense: (e) => {
        setDb((d) => ({ ...d, expenses: [{ ...e, id: `EXP-${uid()}`, createdAt: now() }, ...d.expenses] }));
        logAudit("expense_create", `Recorded ${e.category} expense of ${e.amount}`);
      },

      deleteExpense: (id) => {
        setDb((d) => ({ ...d, expenses: d.expenses.filter((e) => e.id !== id) }));
        logAudit("expense_delete", `Deleted expense ${id}`);
      },

      addExpenseCategory: (name) => {
        setDb((d) => ({ ...d, expenseCategories: [...d.expenseCategories, name] }));
      },

      logAudit,
    };
  }, [db, actor]);

  return createElement(InventoryContext.Provider, { value: api }, children);
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within an InventoryProvider");
  return ctx;
}

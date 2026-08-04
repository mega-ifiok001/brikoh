"use client";

/**
 * Brikoh Mobile — a React Native codebase rendered via react-native-web.
 * Every screen uses RN primitives (View / Text / Pressable / ScrollView /
 * StyleSheet / TextInput), so this file can be dropped into an Expo project
 * by simply changing the import below from "react-native-web" to "react-native".
 */

import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, TextInput, Dimensions } from "react-native-web";
import { useAuth } from "@/context/AuthContext";
import { InventoryProvider, useInventory, totalStock, walletBalances, fmtMoney } from "@/inventory/lib";
import { useTheme } from "@/lib/theme";
import { waLink } from "@/website/templates";

const MAX_W = 448;
const WIN_W = Dimensions.get("window").width;
const frameW = Math.min(WIN_W, MAX_W);

/* ------------------------------ palette ------------------------------ */

type P = ReturnType<typeof palette>;

function palette(dark: boolean) {
  return {
    bg: dark ? "#0a100d" : "#faf8f4",
    card: dark ? "#111a15" : "#ffffff",
    cream: dark ? "#16251d" : "#f2efe9",
    ink: dark ? "#e8f0ea" : "#11231a",
    muted: dark ? "#93a89c" : "#5c6b62",
    border: dark ? "rgba(255,255,255,0.09)" : "rgba(17,35,26,0.08)",
    brand: "#e86100",
    brandLight: "#f2690e",
    sun: "#ff8c4a",
    forest: "#145a32",
    pine: "#1e8449",
    leaf: "#27ae60",
    green: "#25D366",
  };
}

type Tab = "home" | "sell" | "stock" | "money" | "more";
type CartItem = { productId: string; name: string; emoji: string; price: number; qty: number };

/* -------------------------------- App -------------------------------- */

export default function MobileApp() {
  const { user, business, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const P = palette(theme === "dark");
  const [tab, setTab] = useState<Tab>("home");
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!user) window.location.hash = "/login";
    else if (!business) window.location.hash = "/onboarding";
  }, [user, business]);

  if (!user || !business) return null;

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: "home", label: "Home", emoji: "🏠" },
    { id: "sell", label: "Sell", emoji: "🛍️" },
    { id: "stock", label: "Stock", emoji: "📦" },
    { id: "money", label: "Wallet", emoji: "💳" },
    { id: "more", label: "More", emoji: "☰" },
  ];

  return (
    <InventoryProvider>
      <View style={[styles.root, { backgroundColor: P.bg }]}>
        <View style={[styles.frame, { width: frameW }]}>
          {/* header */}
          <View style={[styles.header, { borderBottomColor: P.border }]}>
            <View style={styles.headerLeft}>
              <View style={styles.brandBox}>
                <Text style={styles.brandMark}>B</Text>
              </View>
              <Text style={[styles.brandName, { color: P.ink }]}>Brikoh</Text>
              <View style={styles.mobileTag}>
                <Text style={styles.mobileTagText}>MOBILE</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <Pressable onPress={toggle} style={[styles.headerBtn, { backgroundColor: P.card, borderColor: P.border }]} accessibilityLabel="Toggle theme">
                <Text style={{ fontSize: 16 }}>{theme === "dark" ? "☀️" : "🌙"}</Text>
              </Pressable>
              <Pressable onPress={() => (window.location.hash = "/storefront")} style={[styles.headerBtn, { backgroundColor: P.card, borderColor: P.border }]} accessibilityLabel="View storefront">
                <Text style={{ fontSize: 16 }}>🌐</Text>
              </Pressable>
            </View>
          </View>

          {/* screen */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {tab === "home" && <HomeScreen P={P} onSell={() => setTab("sell")} />}
            {tab === "sell" && <SellScreen P={P} cart={cart} setCart={setCart} />}
            {tab === "stock" && <StockScreen P={P} />}
            {tab === "money" && <MoneyScreen P={P} />}
            {tab === "more" && <MoreScreen P={P} onLogout={logout} />}
          </ScrollView>

          {/* bottom tab bar */}
          <View style={[styles.tabbar, { borderTopColor: P.border, backgroundColor: theme === "dark" ? "rgba(17,26,21,0.96)" : "rgba(255,255,255,0.96)" }]}>
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <Pressable key={t.id} onPress={() => setTab(t.id)} style={styles.tabItem} accessibilityLabel={t.label}>
                  <View style={styles.tabEmojiWrap}>
                    <Text style={{ fontSize: 20, opacity: active ? 1 : 0.45 }}>{t.emoji}</Text>
                    {t.id === "sell" && cart.length > 0 && <View style={styles.tabDot} />}
                  </View>
                  <Text style={[styles.tabLabel, { color: active ? P.brand : P.muted }]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </InventoryProvider>
  );
}

/* -------------------------------- Home ------------------------------- */

function HomeScreen({ P, onSell }: { P: P; onSell: () => void }) {
  const { user, business } = useAuth();
  const { db } = useInventory();
  const cur = business?.currency ?? "NGN";
  const today = new Date().toDateString();
  const todaySales = db.sales.filter((s) => new Date(s.at).toDateString() === today);
  const todayRevenue = todaySales.reduce((s, x) => s + x.total, 0);
  const live = db.products.filter((p) => p.status !== "archived");
  const out = live.filter((p) => totalStock(db, p.id) === 0);
  const low = live.filter((p) => { const st = totalStock(db, p.id); return st > 0 && st <= p.threshold; });
  const { pending } = walletBalances(db);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const quick: { label: string; emoji: string; tint: string; on: () => void }[] = [
    { label: "Record sale", emoji: "🛍️", tint: "#e86100", on: onSell },
    { label: "Add stock", emoji: "➕", tint: "#1e8449", on: () => (window.location.hash = "/inventory/products") },
    { label: "Customers", emoji: "👥", tint: "#27ae60", on: () => (window.location.hash = "/inventory/customers") },
    { label: "Website", emoji: "🌐", tint: "#b7791f", on: () => (window.location.hash = "/website-builder") },
  ];

  return (
    <View style={styles.gap}>
      {/* balance card */}
      <View style={[styles.balanceCard, { backgroundImage: "linear-gradient(135deg, #145A32, #1E8449)" }]}>
        <Text style={styles.balanceGreet}>{greet}, {user?.name.split(" ")[0]} 👋</Text>
        <Text style={styles.balanceLabel}>Today's revenue</Text>
        <Text style={styles.balanceValue}>{fmtMoney(cur, todayRevenue)}</Text>
        <View style={styles.chipsRow}>
          <View style={styles.chipDark}><Text style={styles.chipDarkText}>{todaySales.length} sale(s)</Text></View>
          {pending > 0 && <View style={styles.chipSun}><Text style={styles.chipSunText}>{fmtMoney(cur, pending)} pending</Text></View>}
        </View>
      </View>

      {/* quick actions */}
      <View style={styles.quickRow}>
        {quick.map((a) => (
          <Pressable key={a.label} onPress={a.on} style={({ pressed }) => [styles.quickItem, { backgroundColor: P.card }, pressed && styles.pressed]}>
            <View style={[styles.quickIcon, { backgroundColor: `${a.tint}1a` }]}>
              <Text style={{ fontSize: 18 }}>{a.emoji}</Text>
            </View>
            <Text style={[styles.quickLabel, { color: P.ink }]}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* needs attention */}
      <View style={[styles.card, { backgroundColor: P.card, borderColor: P.border }]}>
        <View style={styles.cardHead}>
          <Text style={[styles.cardTitle, { color: P.ink }]}>Needs attention</Text>
          <Pressable onPress={() => (window.location.hash = "/inventory")}>
            <Text style={styles.link}>Open inventory</Text>
          </Pressable>
        </View>
        {[...out, ...low].slice(0, 4).map((p) => {
          const st = totalStock(db, p.id);
          return (
            <Pressable key={p.id} onPress={() => (window.location.hash = "/inventory")} style={({ pressed }) => [styles.row, { backgroundColor: P.cream }, pressed && styles.pressed]}>
              <View style={[styles.rowEmoji, { backgroundColor: P.card }]}><Text style={{ fontSize: 20 }}>{p.emoji}</Text></View>
              <View style={styles.rowBody}>
                <Text style={[styles.rowTitle, { color: P.ink }]} numberOfLines={1}>{p.name}</Text>
                <Text style={[styles.rowSub, { color: P.muted }]}>{st} left · alert at {p.threshold}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: st === 0 ? "#fee2e2" : "#ffe9cc" }]}>
                <Text style={[styles.badgeText, { color: st === 0 ? "#ef4444" : "#b7791f" }]}>{st === 0 ? "OUT" : "LOW"}</Text>
              </View>
            </Pressable>
          );
        })}
        {out.length + low.length === 0 && <Text style={[styles.emptyText, { color: P.muted }]}>All good 🎉</Text>}
      </View>

      {/* recent sales */}
      <View style={[styles.card, { backgroundColor: P.card, borderColor: P.border }]}>
        <View style={styles.cardHead}>
          <Text style={[styles.cardTitle, { color: P.ink }]}>Recent sales</Text>
          <Pressable onPress={() => (window.location.hash = "/inventory")}><Text style={styles.link}>All</Text></Pressable>
        </View>
        {db.sales.slice(0, 4).map((s) => (
          <View key={s.id} style={styles.rowPlain}>
            <View style={[styles.saleIcon, { backgroundColor: s.status === "paid" ? "#dcfce7" : "#ffe9cc" }]}>
              <Text style={{ fontSize: 14 }}>{s.status === "paid" ? "✅" : "⏳"}</Text>
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: P.ink }]} numberOfLines={1}>{s.customerName}</Text>
              <Text style={[styles.rowSub, { color: P.muted }]}>{s.id} · {new Date(s.at).toLocaleDateString()}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.saleAmount, { color: P.ink }]}>{fmtMoney(cur, s.total)}</Text>
              <Text style={[styles.saleStatus, { color: s.status === "paid" ? P.leaf : "#b7791f" }]}>{s.status}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/* -------------------------------- Sell ------------------------------- */

function SellScreen({ P, cart, setCart }: { P: P; cart: CartItem[]; setCart: (c: CartItem[]) => void }) {
  const { db, recordSale } = useInventory();
  const { business } = useAuth();
  const cur = business?.currency ?? "NGN";
  const [q, setQ] = useState("");
  const [method, setMethod] = useState<"cash" | "transfer" | "card" | "credit">("cash");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const query = q.trim().toLowerCase();
  const live = db.products.filter((p) => p.status === "active" && totalStock(db, p.id) > 0);
  const results = query ? live.filter((p) => p.name.toLowerCase().includes(query)) : live.slice(0, 12);

  const add = (id: string) => {
    const p = db.products.find((x) => x.id === id);
    if (!p) return;
    setErr("");
    const st = totalStock(db, id);
    const have = cart.find((c) => c.productId === id)?.qty ?? 0;
    if (have + 1 > st) { setErr(`Only ${st} in stock.`); return; }
    setCart(
      cart.some((c) => c.productId === id)
        ? cart.map((c) => (c.productId === id ? { ...c, qty: c.qty + 1 } : c))
        : [...cart, { productId: id, name: p.name, emoji: p.emoji, price: p.sellingPrice, qty: 1 }]
    );
  };

  const setQty = (id: string, n: number) => setCart(cart.map((c) => (c.productId === id ? { ...c, qty: Math.max(0, n) } : c)).filter((c) => c.qty > 0));

  const subtotal = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const count = cart.reduce((s, c) => s + c.qty, 0);

  const pay = () => {
    setErr("");
    if (cart.length === 0) return setErr("Add a product first.");
    const sale = recordSale({
      customerId: null, customerName: "Mobile customer", branchId: db.branches[0].id,
      items: cart.map((c) => ({ productId: c.productId, name: c.name, qty: c.qty, price: c.price })),
      subtotal, discount: 0, total: subtotal, method, paid: method === "credit" ? 0 : subtotal,
    });
    setReceipt(sale.id);
    setCart([]);
  };

  if (receipt) {
    return (
      <View style={styles.receiptWrap}>
        <View style={styles.receiptIcon}><Text style={{ fontSize: 34 }}>✅</Text></View>
        <Text style={[styles.receiptTitle, { color: P.ink }]}>Sale recorded!</Text>
        <Text style={[styles.receiptSub, { color: P.muted }]}>{receipt} · {fmtMoney(cur, subtotal)} · {method}</Text>
        <View style={styles.receiptBtns}>
          <Pressable onPress={() => setReceipt(null)} style={styles.btnPrimary}><Text style={styles.btnPrimaryText}>New sale</Text></Pressable>
          <Pressable onPress={() => setReceipt(null)} style={styles.btnGhost}><Text style={[styles.btnGhostText, { color: P.ink }]}>Done</Text></Pressable>
        </View>
        <Text style={[styles.receiptNote, { color: P.muted }]}>Stock updated & logged to history.</Text>
      </View>
    );
  }

  return (
    <View style={styles.gap}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search products…"
        placeholderTextColor={P.muted}
        style={[styles.search, { backgroundColor: P.card, borderColor: P.border, color: P.ink }]}
      />
      {err ? <Text style={styles.err}>{err}</Text> : null}

      <View style={styles.grid}>
        {results.map((p) => {
          const st = totalStock(db, p.id);
          const inCart = cart.find((c) => c.productId === p.id)?.qty ?? 0;
          return (
            <Pressable key={p.id} onPress={() => add(p.id)} disabled={st === 0} style={({ pressed }) => [styles.prod, { backgroundColor: P.card, borderColor: P.border, opacity: st === 0 ? 0.4 : 1 }, pressed && styles.pressed]}>
              <Text style={{ fontSize: 26 }}>{p.emoji}</Text>
              <Text style={[styles.prodName, { color: P.ink }]} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.prodPrice}>{fmtMoney(cur, p.sellingPrice)}</Text>
              {inCart > 0 && <Text style={styles.prodInCart}>{inCart} in cart</Text>}
            </Pressable>
          );
        })}
      </View>

      {/* cart */}
      <View style={[styles.card, { backgroundColor: P.card, borderColor: P.border }]}>
        <View style={styles.cardHead}>
          <Text style={[styles.cardTitle, { color: P.ink }]}>Cart ({count})</Text>
          {cart.length > 0 && <Pressable onPress={() => setCart([])}><Text style={{ color: "#f87171", fontSize: 12, fontWeight: "700" }}>Clear</Text></Pressable>}
        </View>
        {cart.map((c) => (
          <View key={c.productId} style={[styles.cartRow, { backgroundColor: P.cream }]}>
            <Text style={{ fontSize: 20 }}>{c.emoji}</Text>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: P.ink }]} numberOfLines={1}>{c.name}</Text>
              <Text style={[styles.rowSub, { color: P.muted }]}>{fmtMoney(cur, c.price)}</Text>
            </View>
            <View style={styles.qtyStepper}>
              <Pressable onPress={() => setQty(c.productId, c.qty - 1)} style={styles.qtyBtn}><Text style={{ color: P.ink, fontWeight: "800" }}>−</Text></Pressable>
              <Text style={[styles.qtyVal, { color: P.ink }]}>{c.qty}</Text>
              <Pressable onPress={() => setQty(c.productId, c.qty + 1)} style={styles.qtyBtn}><Text style={{ color: P.ink, fontWeight: "800" }}>+</Text></Pressable>
            </View>
            <Pressable onPress={() => setQty(c.productId, 0)} style={styles.removeBtn}><Text style={{ fontSize: 14 }}>🗑️</Text></Pressable>
          </View>
        ))}
        {cart.length === 0 && <Text style={[styles.emptyText, { color: P.muted }]}>Tap products to add them.</Text>}

        <View style={styles.methodRow}>
          {(["cash", "transfer", "card", "credit"] as const).map((m) => (
            <Pressable key={m} onPress={() => setMethod(m)} style={[styles.method, { borderColor: method === m ? P.brand : P.border, backgroundColor: method === m ? "#e8610010" : "transparent" }]}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: method === m ? P.brand : P.muted, textTransform: "capitalize" }}>{m}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={pay} disabled={cart.length === 0} style={({ pressed }) => [styles.chargeBtn, pressed && styles.pressed, cart.length === 0 && { opacity: 0.4 }]}>
          <Text style={styles.chargeText}>Charge {fmtMoney(cur, subtotal)}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ------------------------------- Stock ------------------------------- */

function StockScreen({ P }: { P: P }) {
  const { db, restock, adjustStock } = useInventory();
  const { business } = useAuth();
  const cur = business?.currency ?? "NGN";
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<string | null>(null);
  const [action, setAction] = useState<{ id: string; type: "restock" | "damage" } | null>(null);
  const [amt, setAmt] = useState("");

  const query = q.trim().toLowerCase();
  const list = db.products.filter((p) => p.status !== "archived" && (!query || p.name.toLowerCase().includes(query)));

  const submitAction = () => {
    if (!action) return;
    const n = Number(amt);
    if (!n || n <= 0) return;
    const branch = db.branches[0]?.id ?? "b1";
    if (action.type === "restock") restock(action.id, undefined, branch, n);
    else adjustStock(action.id, undefined, branch, "damage", n, "Mobile damage log");
    setAction(null);
    setAmt("");
  };

  const detailP = detail ? db.products.find((x) => x.id === detail) : null;

  return (
    <View style={styles.gap}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search products…"
        placeholderTextColor={P.muted}
        style={[styles.search, { backgroundColor: P.card, borderColor: P.border, color: P.ink }]}
      />

      <View style={styles.quickRow}>
        <Pressable onPress={() => (window.location.hash = "/inventory/products")} style={({ pressed }) => [styles.quickItem, { backgroundColor: P.card }, pressed && styles.pressed]}>
          <Text style={{ fontSize: 16 }}>➕</Text><Text style={[styles.quickLabel, { color: P.ink }]}>Add product</Text>
        </Pressable>
        <Pressable onPress={() => (window.location.hash = "/inventory/transfers")} style={({ pressed }) => [styles.quickItem, { backgroundColor: P.card }, pressed && styles.pressed]}>
          <Text style={{ fontSize: 16 }}>🔄</Text><Text style={[styles.quickLabel, { color: P.ink }]}>Transfer</Text>
        </Pressable>
        <Pressable onPress={() => (window.location.hash = "/inventory")} style={({ pressed }) => [styles.quickItem, { backgroundColor: P.card }, pressed && styles.pressed]}>
          <Text style={{ fontSize: 16 }}>🧾</Text><Text style={[styles.quickLabel, { color: P.ink }]}>Full module</Text>
        </Pressable>
      </View>

      {list.map((p) => {
        const st = totalStock(db, p.id);
        return (
          <Pressable key={p.id} onPress={() => setDetail(p.id)} style={({ pressed }) => [styles.prodRow, { backgroundColor: P.card, borderColor: P.border }, pressed && styles.pressed]}>
            <View style={[styles.rowEmoji, { backgroundColor: P.cream }]}><Text style={{ fontSize: 22 }}>{p.emoji}</Text></View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: P.ink }]} numberOfLines={1}>{p.name}</Text>
              <Text style={[styles.rowSub, { color: P.muted }]}>{p.category} · {fmtMoney(cur, p.sellingPrice)}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.stockVal, { color: st === 0 ? "#ef4444" : st <= p.threshold ? "#b7791f" : P.leaf }]}>{st}</Text>
              <Text style={[styles.rowSub, { color: P.muted }]}>in stock</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        );
      })}

      {/* detail bottom sheet */}
      {detailP && (
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDetail(null)} />
          <View style={[styles.sheet, { backgroundColor: P.card }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHead}>
              <View style={[styles.rowEmoji, { backgroundColor: P.cream }]}><Text style={{ fontSize: 28 }}>{detailP.emoji}</Text></View>
              <View style={styles.rowBody}>
                <Text style={[styles.sheetTitle, { color: P.ink }]} numberOfLines={2}>{detailP.name}</Text>
                <Text style={[styles.rowSub, { color: P.muted }]}>{detailP.id} · {detailP.category}</Text>
                <Text style={[styles.sheetPrice, { color: P.brand }]}>{fmtMoney(cur, detailP.sellingPrice)}</Text>
              </View>
              <Pressable onPress={() => setDetail(null)} style={styles.closeBtn}><Text style={{ color: P.muted, fontSize: 16, fontWeight: "800" }}>✕</Text></Pressable>
            </View>

            <View style={styles.statRow}>
              <View style={[styles.statBox, { backgroundColor: P.cream }]}>
                <Text style={[styles.statVal, { color: totalStock(db, detailP.id) === 0 ? "#ef4444" : totalStock(db, detailP.id) <= detailP.threshold ? "#b7791f" : P.forest }]}>{totalStock(db, detailP.id)}</Text>
                <Text style={[styles.statLabel, { color: P.muted }]}>In stock</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: P.cream }]}>
                <Text style={[styles.statVal, { color: P.ink }]}>{detailP.threshold}</Text>
                <Text style={[styles.statLabel, { color: P.muted }]}>Alert at</Text>
              </View>
            </View>

            <View style={styles.sheetBtns}>
              <Pressable onPress={() => setAction({ id: detailP.id, type: "restock" })} style={[styles.btnPrimary, { flex: 1 }]}><Text style={styles.btnPrimaryText}>+ Restock</Text></Pressable>
              <Pressable onPress={() => setAction({ id: detailP.id, type: "damage" })} style={[styles.btnGhost, { flex: 1 }]}><Text style={[styles.btnGhostText, { color: P.ink }]}>Log damage</Text></Pressable>
            </View>

            <Text style={[styles.sheetSection, { color: P.muted }]}>RECENT HISTORY</Text>
            {db.events.filter((e) => e.productId === detailP.id).sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 4).map((e) => (
              <View key={e.id} style={[styles.histRow, { backgroundColor: P.cream }]}>
                <Text style={[styles.histType, { color: P.ink }]}>{e.type.replace(/_/g, " ")} · {e.delta > 0 ? "+" : ""}{e.delta}</Text>
                <Text style={[styles.histDate, { color: P.muted }]}>{new Date(e.at).toLocaleDateString()}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* restock / damage sheet */}
      {action && (
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAction(null)} />
          <View style={[styles.sheet, { backgroundColor: P.card }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: P.ink }]}>{action.type === "restock" ? "Restock" : "Log damage"}</Text>
            <TextInput
              value={amt}
              onChangeText={setAmt}
              placeholder="Quantity"
              placeholderTextColor={P.muted}
              keyboardType="numeric"
              autoFocus
              style={[styles.amountInput, { backgroundColor: P.cream, borderColor: P.border, color: P.ink }]}
            />
            <View style={styles.sheetBtns}>
              <Pressable onPress={() => setAction(null)} style={[styles.btnGhost, { flex: 1 }]}><Text style={[styles.btnGhostText, { color: P.ink }]}>Cancel</Text></Pressable>
              <Pressable onPress={submitAction} style={[styles.btnPrimary, { flex: 1 }]}><Text style={styles.btnPrimaryText}>Confirm</Text></Pressable>
            </View>
            <Text style={[styles.receiptNote, { color: P.muted }]}>Logged to stock history automatically.</Text>
          </View>
        </View>
      )}
    </View>
  );
}

/* ------------------------------- Money ------------------------------- */

function MoneyScreen({ P }: { P: P }) {
  const { db } = useInventory();
  const { business } = useAuth();
  const cur = business?.currency ?? "NGN";
  const { available, pending } = walletBalances(db);

  const links: { label: string; emoji: string; tint: string; href: string }[] = [
    { label: "Withdraw", emoji: "🏦", tint: "#e86100", href: "/money/wallet" },
    { label: "Expenses", emoji: "💸", tint: "#1e8449", href: "/money/expenses" },
    { label: "Reports", emoji: "📊", tint: "#27ae60", href: "/money/reports" },
    { label: "Banks", emoji: "🏛️", tint: "#b7791f", href: "/money/bank-accounts" },
  ];

  return (
    <View style={styles.gap}>
      <View style={[styles.balanceCard, { backgroundImage: "linear-gradient(135deg, #145A32, #1E8449)" }]}>
        <Text style={styles.balanceLabel}>Available balance</Text>
        <Text style={styles.balanceValue}>{fmtMoney(cur, available)}</Text>
        <View style={styles.chipsRow}>
          <View style={styles.chipDark}><Text style={styles.chipDarkText}>{fmtMoney(cur, pending)} pending</Text></View>
          <View style={styles.chipDark}><Text style={styles.chipDarkText}>Settles tomorrow</Text></View>
        </View>
      </View>

      <View style={styles.quickRow}>
        {links.map((l) => (
          <Pressable key={l.label} onPress={() => (window.location.hash = l.href)} style={({ pressed }) => [styles.quickItem, { backgroundColor: P.card }, pressed && styles.pressed]}>
            <View style={[styles.quickIcon, { backgroundColor: `${l.tint}1a` }]}><Text style={{ fontSize: 18 }}>{l.emoji}</Text></View>
            <Text style={[styles.quickLabel, { color: P.ink }]}>{l.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: P.card, borderColor: P.border }]}>
        <View style={styles.cardHead}>
          <Text style={[styles.cardTitle, { color: P.ink }]}>Recent activity</Text>
          <Pressable onPress={() => (window.location.hash = "/money/transactions")}><Text style={styles.link}>All</Text></Pressable>
        </View>
        {db.ledger.slice(0, 6).map((l) => (
          <View key={l.id} style={styles.rowPlain}>
            <View style={[styles.saleIcon, { backgroundColor: l.amount > 0 ? "#dcfce7" : "#ffe4e6" }]}>
              <Text style={{ fontSize: 13 }}>{l.amount > 0 ? "↑" : "↓"}</Text>
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: P.ink }]} numberOfLines={1}>{l.note}</Text>
              <Text style={[styles.rowSub, { color: P.muted }]}>{l.type.replace(/_/g, " ")} · {new Date(l.at).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.saleAmount, { color: l.amount > 0 ? P.forest : P.ink }]}>{l.amount > 0 ? "+" : "−"}{fmtMoney(cur, Math.abs(l.amount))}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ------------------------------- More ------------------------------- */

function MoreScreen({ P, onLogout }: { P: P; onLogout: () => void }) {
  const { user, business } = useAuth();
  const whatsapp = business?.whatsapp || business?.phone || "";

  const groups: { title: string; items: { label: string; sub: string; emoji: string; href: string }[] }[] = [
    {
      title: "Business",
      items: [
        { label: "Website Studio", sub: "Edit your online store", emoji: "🌐", href: "/website-builder" },
        { label: "View storefront", sub: business?.websiteName ? `${business.websiteName}.brikoh.app` : "Live site", emoji: "🛍️", href: "/storefront" },
        { label: "Marketing", sub: "Campaigns & coupons", emoji: "📣", href: "/dashboard/marketing" },
        { label: "Analytics", sub: "Sales & Google Analytics", emoji: "📊", href: "/dashboard/analytics" },
      ],
    },
    {
      title: "People",
      items: [
        { label: "Customers", sub: "Groups, notes & owing", emoji: "👥", href: "/inventory/customers" },
        { label: "Staff & roles", sub: "Permissions & audit", emoji: "🛡️", href: "/inventory/staff" },
      ],
    },
    {
      title: "Platform",
      items: [
        { label: "Inventory dashboard", sub: "All 15+ tools", emoji: "📦", href: "/inventory" },
        { label: "Money & accounting", sub: "Wallet, expenses, P&L", emoji: "💳", href: "/money" },
        { label: "Main dashboard", sub: "Overview & settings", emoji: "🏠", href: "/dashboard" },
        { label: "Help center", sub: "Guides & support", emoji: "❓", href: "/help" },
      ],
    },
  ];

  return (
    <View style={styles.gap}>
      {/* profile */}
      <View style={[styles.profile, { backgroundColor: P.card, borderColor: P.border }]}>
        <View style={[styles.avatar, { backgroundImage: "linear-gradient(135deg, #F2690E, #E86100)" }]}>
          <Text style={styles.avatarText}>{user?.name.charAt(0)}</Text>
        </View>
        <View style={styles.rowBody}>
          <Text style={[styles.rowTitle, { color: P.ink }]} numberOfLines={1}>{user?.name}</Text>
          <Text style={[styles.rowSub, { color: P.muted }]} numberOfLines={1}>{user?.email}</Text>
          <Text style={[styles.rowSub, { color: P.forest, fontWeight: "700" }]} numberOfLines={1}>{business?.name}</Text>
        </View>
      </View>

      {/* whatsapp */}
      {whatsapp && (
        <Pressable onPress={() => { const url = waLink(whatsapp); window.open(url, "_blank"); }} style={({ pressed }) => [styles.waCard, { backgroundColor: "#25D36614" }, pressed && styles.pressed]}>
          <View style={[styles.waIcon, { backgroundColor: P.green }]}><Text style={{ color: "#fff", fontSize: 16 }}>✆</Text></View>
          <View style={styles.rowBody}>
            <Text style={[styles.rowTitle, { color: P.ink }]}>WhatsApp chat button</Text>
            <Text style={[styles.rowSub, { color: P.muted }]}>{whatsapp}</Text>
          </View>
          <Text style={styles.chev}>›</Text>
        </Pressable>
      )}

      {groups.map((g) => (
        <View key={g.title}>
          <Text style={[styles.groupLabel, { color: P.muted }]}>{g.title.toUpperCase()}</Text>
          <View style={[styles.menu, { backgroundColor: P.card, borderColor: P.border }]}>
            {g.items.map((it, i) => (
              <Pressable key={it.label} onPress={() => (window.location.hash = it.href)} style={({ pressed }) => [styles.menuRow, i > 0 && { borderTopWidth: 1, borderTopColor: P.border }, pressed && { backgroundColor: P.cream }]}>
                <Text style={{ fontSize: 18 }}>{it.emoji}</Text>
                <View style={styles.rowBody}>
                  <Text style={[styles.rowTitle, { color: P.ink }]} numberOfLines={1}>{it.label}</Text>
                  <Text style={[styles.rowSub, { color: P.muted }]} numberOfLines={1}>{it.sub}</Text>
                </View>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <Pressable onPress={onLogout} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
      <Text style={[styles.version, { color: P.muted }]}>Brikoh Mobile · React Native · {business?.name}</Text>
    </View>
  );
}

/* ------------------------------ styles ------------------------------ */

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center" },
  frame: { flex: 1, maxWidth: MAX_W, position: "relative" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandBox: {
    width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center",
    backgroundImage: "linear-gradient(135deg, #F2690E, #E86100)",
  },
  brandMark: { color: "#fff", fontWeight: "800", fontSize: 16 },
  brandName: { fontWeight: "800", fontSize: 17 },
  mobileTag: { backgroundColor: "#e8610018", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  mobileTagText: { color: "#e86100", fontWeight: "800", fontSize: 8, letterSpacing: 0.5 },
  headerRight: { flexDirection: "row", gap: 6 },
  headerBtn: {
    width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(17,35,26,0.1)", backgroundColor: "#ffffff",
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 96 },

  tabbar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    borderTopWidth: 1,
    paddingTop: 6, paddingBottom: 10,
    backgroundColor: "rgba(255,255,255,0.96)",
    flexDirection: "row",
  },
  tabItem: { flex: 1, alignItems: "center", gap: 1 },
  tabEmojiWrap: { position: "relative" },
  tabDot: { position: "absolute", top: -2, right: -8, width: 8, height: 8, borderRadius: 4, backgroundColor: "#e86100" },
  tabLabel: { fontSize: 10, fontWeight: "700" },

  gap: { gap: 14 },

  balanceCard: { borderRadius: 22, padding: 18, shadowColor: "#145A32", shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  balanceGreet: { color: "rgba(255,255,255,0.85)", fontSize: 14 },
  balanceLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 12 },
  balanceValue: { color: "#fff", fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  chipsRow: { flexDirection: "row", gap: 6, marginTop: 10, flexWrap: "wrap" },
  chipDark: { backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipDarkText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  chipSun: { backgroundColor: "#ff8c4a55", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipSunText: { color: "#ffd9b8", fontSize: 10, fontWeight: "700" },

  quickRow: { flexDirection: "row", gap: 8 },
  quickItem: {
    flex: 1, borderRadius: 16, padding: 10, alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: "rgba(17,35,26,0.06)",
  },
  quickIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 10, fontWeight: "700", textAlign: "center" },

  card: { borderRadius: 20, padding: 14, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: "800" },
  link: { color: "#e86100", fontSize: 12, fontWeight: "700" },

  row: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, padding: 10, marginTop: 8 },
  rowPlain: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 },
  rowEmoji: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 13, fontWeight: "700" },
  rowSub: { fontSize: 11, marginTop: 1 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: "800" },
  saleIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  saleAmount: { fontSize: 13, fontWeight: "800" },
  saleStatus: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  emptyText: { textAlign: "center", fontSize: 12, paddingVertical: 14 },

  search: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
  err: { color: "#ef4444", fontSize: 12, fontWeight: "600", paddingHorizontal: 4 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  prod: {
    width: "31.5%", borderRadius: 14, borderWidth: 1, padding: 10, alignItems: "center", gap: 2,
  },
  prodName: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  prodPrice: { color: "#e86100", fontSize: 11, fontWeight: "800" },
  prodInCart: { color: "#1e8449", fontSize: 10, fontWeight: "800" },

  cartRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, padding: 8, marginTop: 6 },
  qtyStepper: { flexDirection: "row", alignItems: "center", gap: 2 },
  qtyBtn: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  qtyVal: { width: 22, textAlign: "center", fontSize: 13, fontWeight: "800" },
  removeBtn: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },

  methodRow: { flexDirection: "row", gap: 6, marginTop: 12 },
  method: { flex: 1, borderRadius: 12, borderWidth: 2, paddingVertical: 8, alignItems: "center" },

  chargeBtn: { marginTop: 12, borderRadius: 999, paddingVertical: 14, alignItems: "center", backgroundColor: "#e86100", backgroundImage: "linear-gradient(135deg, #F2690E, #E86100)" },
  chargeText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  receiptWrap: { alignItems: "center", paddingTop: 60, paddingHorizontal: 12 },
  receiptIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", backgroundColor: "#dcfce7" },
  receiptTitle: { fontSize: 22, fontWeight: "800", marginTop: 14 },
  receiptSub: { fontSize: 13, marginTop: 4 },
  receiptBtns: { flexDirection: "row", gap: 10, marginTop: 22, alignSelf: "stretch" },
  receiptNote: { fontSize: 11, marginTop: 14, textAlign: "center" },

  prodRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 8 },
  stockVal: { fontSize: 16, fontWeight: "800" },
  chev: { fontSize: 20, color: "rgba(17,35,26,0.3)", fontWeight: "700", marginLeft: 4 },

  sheetOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, top: 0, justifyContent: "flex-end", backgroundColor: "rgba(10,16,13,0.5)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, paddingBottom: 26 },
  sheetHandle: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: "rgba(17,35,26,0.15)", marginBottom: 12 },
  sheetHead: { flexDirection: "row", gap: 10 },
  sheetTitle: { fontSize: 16, fontWeight: "800" },
  sheetPrice: { fontSize: 18, fontWeight: "800", marginTop: 2 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  statRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  statBox: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center" },
  statVal: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 10 },
  sheetBtns: { flexDirection: "row", gap: 8, marginTop: 14 },
  sheetSection: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8, marginTop: 16, marginBottom: 6 },
  histRow: { flexDirection: "row", justifyContent: "space-between", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 4 },
  histType: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  histDate: { fontSize: 11 },
  amountInput: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 18, fontWeight: "700", marginTop: 14 },

  btnPrimary: { borderRadius: 999, paddingVertical: 12, alignItems: "center", backgroundColor: "#145a32" },
  btnPrimaryText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  btnGhost: { borderRadius: 999, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: "rgba(17,35,26,0.15)" },
  btnGhostText: { fontSize: 13, fontWeight: "800" },

  profile: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 20, borderWidth: 1, padding: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "800" },
  waCard: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 18, borderWidth: 1, borderColor: "#25D36644", padding: 12 },
  waIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  groupLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8, paddingHorizontal: 2, marginBottom: 6, marginTop: 2 },
  menu: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  logout: { borderRadius: 999, paddingVertical: 14, alignItems: "center", backgroundColor: "#fee2e2", marginTop: 4 },
  logoutText: { color: "#ef4444", fontSize: 13, fontWeight: "800" },
  version: { textAlign: "center", fontSize: 10, paddingBottom: 8 },

  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});

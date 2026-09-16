const fs = require('fs');
const src = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');
let out = src;

const stateAnchor = `  const [domainBusy, setDomainBusy] = useState(false);`;
const newState = `  const [domainBusy, setDomainBusy] = useState(false);

  const [actionTab, setActionTab] = useState("history");
  const [checkoutTier, setCheckoutTier] = useState("PRO");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState("ENTERPRISE");
  const [upgradeBusy, setUpgradeBusy] = useState(false);
  const [downgradeTier, setDowngradeTier] = useState("STARTER");
  const [downgradeBusy, setDowngradeBusy] = useState(false);
  const [downgradePreview, setDowngradePreview] = useState(null);
  const [downgradePreviewBusy, setDowngradePreviewBusy] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);`;

if (out.includes(stateAnchor) && !out.includes('actionTab')) {
  out = out.replace(stateAnchor, newState);
  console.log('1: state ok');
}

const effectAnchor = `  useEffect(() => {\n    load();\n  }, [load]);`;
const newEffect = `  useEffect(() => {\n    load();\n    loadPayments();\n  }, [load, loadPayments]);\n\n  const afterAction = () => { load(); loadPayments(); };\n\n  const loadPayments = useCallback(async () => {\n    setPaymentsLoading(true);\n    try {\n      const res = await api.get("/api/dashboard/subscriptions/payments");\n      setPayments(Array.isArray(res.items) ? res.items : Array.isArray(res) ? res : []);\n    } catch { setPayments([]); }\n    finally { setPaymentsLoading(false); }\n  }, []);`;

if (out.includes(effectAnchor)) {
  out = out.replace(effectAnchor, newEffect);
  console.log('2: loadPayments ok');
}

const renderAnchor = `
  }

  if (loading) {
    return (
      <div className="card max-w-2xl p-6">
        <div className="skeleton h-40" />
      </div>
    );
  }

  if (error)`;

const handlers = `
  }

  const doCheckout = async () => {
    setCheckoutBusy(true);
    try {
      const res = await api.post("/api/dashboard/subscriptions/checkout", { tier: checkoutTier });
      if (res.authorizationUrl) window.location.assign(res.authorizationUrl);
      else { toast.success("Subscription initiated."); afterAction(); }
    } catch (e) {
      toast.error(e?.code === "ALREADY_SUBSCRIBED" ? "You already have an active subscription."
        : e?.code === "PRICING_NOT_CONFIGURED" ? "Tier not available for checkout."
        : e?.message || "Couldn't start checkout.");
    } finally { setCheckoutBusy(false); }
  };

  const doUpgrade = async () => {
    setUpgradeBusy(true);
    try {
      const res = await api.post("/api/dashboard/subscriptions/upgrade", { tier: upgradeTier });
      if (res.authorizationUrl) window.location.assign(res.authorizationUrl);
      else { toast.success("Upgrade initiated."); afterAction(); }
    } catch (e) {
      toast.error(e?.code === "UPGRADE_NOT_HIGHER" ? "That tier isn't higher."
        : e?.code === "PRICING_NOT_CONFIGURED" ? "Tier not configured for upgrades."
        : e?.code === "PRORATION_ZERO" ? "No time left in billing cycle."
        : e?.message || "Couldn't start upgrade.");
    } finally { setUpgradeBusy(false); }
  };

  const loadDowngradePreview = async (tier) => {
    setDowngradePreviewBusy(true);
    try {
      const res = await api.get("/api/dashboard/subscriptions/downgrade/preview?tier=" + encodeURIComponent(tier));
      setDowngradePreview(res);
    } catch { setDowngradePreview(null); }
    finally { setDowngradePreviewBusy(false); }
  };

  const doDowngrade = async () => {
    setDowngradeBusy(true);
    try {
      await api.post("/api/dashboard/subscriptions/downgrade", { tier: downgradeTier });
      toast.success("Downgrade scheduled.");
      afterAction();
    } catch (e) {
      toast.error(e?.code === "DOWNGRADE_NOT_LOWER" ? "That tier isn't lower."
        : e?.code === "PRICING_NOT_CONFIGURED" ? "Tier not configured for downgrades."
        : e?.message || "Couldn't schedule downgrade.");
    } finally { setDowngradeBusy(false); }
  };

  const doCancel = async () => {
    setCancelBusy(true);
    try {
      await api.post("/api/dashboard/subscriptions/cancel");
      toast.success("Subscription cancelled.");
      setCancelConfirm(false);
      afterAction();
    } catch (e) {
      toast.error(e?.code === "NO_SUBSCRIPTION" ? "No active subscription."
        : e?.code === "NO_PAYSTACK_SUBSCRIPTION" ? "No Paystack subscription."
        : e?.message || "Couldn't cancel subscription.");
    } finally { setCancelBusy(false); }
  };

  const viewPayment = async (id) => {
    try {
      const res = await api.get("/api/dashboard/subscriptions/payments/" + id);
      setSelectedPayment(res);
    } catch (e) { toast.error(e?.message || "Couldn't load payment details."); }
  };

  useEffect(() => {
    if (actionTab === "downgrade") loadDowngradePreview(downgradeTier);
  }, [actionTab, downgradeTier]);

  if (loading) {
    return (
      <div className="card max-w-2xl p-6">
        <div className="skeleton h-40" />
      </div>
    );
  }

  if (error)`;

if (out.includes(renderAnchor)) {
  out = out.replace(renderAnchor, handlers);
  console.log('3: handlers ok');
} else {
  console.log('3: render anchor NOT found');
}

fs.writeFileSync('src/pages/SettingsPage.tsx', out);
console.log('Done');

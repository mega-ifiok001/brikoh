const fs = require('fs');
const base = 'C:/Users/LENOVO/Documents/brikoh/src/pages';

console.log('=== SETTINGSPAGE.TSX ===');
const c = fs.readFileSync(base + '/SettingsPage.tsx', 'utf8');
const lines = c.split('\r\n');
console.log('Lines:', lines.length);
const checks = [
  'const TIERS', 'tierPrice', 'isHigherTier', 'isLowerTier',
  'actionTab', 'checkoutTier', 'upgradeTier', 'downgradeTier',
  'downgradePreview', 'cancelConfirm', 'payments', 'selectedPayment',
  'doCheckout', 'doUpgrade', 'doDowngrade', 'doCancel',
  'viewPayment', 'loadDowngradePreview', 'afterAction', 'loadPayments',
  'paymentsLoading', 'downgradePreviewBusy',
  '/api/dashboard/subscriptions/checkout',
  '/api/dashboard/subscriptions/upgrade',
  '/api/dashboard/subscriptions/downgrade',
  '/api/dashboard/subscriptions/cancel',
  '/api/dashboard/subscriptions/payments',
  '/api/dashboard/subscriptions/downgrade/preview',
  '/api/dashboard/subscriptions/custom-domain',
  '/api/dashboard/subscriptions/usage',
  'ALREADY_SUBSCRIBED', 'PRICING_NOT_CONFIGURED', 'UPGRADE_NOT_HIGHER',
  'PRORATION_ZERO', 'DOWNGRADE_NOT_LOWER', 'NO_SUBSCRIPTION',
  'NO_PAYSTACK_SUBSCRIPTION', 'PLAN_FEATURE_LOCKED', 'SUBSCRIPTION_INACTIVE',
  'CUSTOM_DOMAIN_TAKEN',
];
let allOk = true;
checks.forEach(k => {
  const ok = c.includes(k);
  if (!ok) allOk = false;
  console.log(k + ':', ok ? 'OK' : 'MISSING');
});

console.log();
console.log('=== PRODUCTS.TSX ===');
const p = fs.readFileSync(base + '/Products.tsx', 'utf8');
console.log('PRODUCT_LIMIT_REACHED:', p.includes('PRODUCT_LIMIT_REACHED') ? 'OK' : 'MISSING');

console.log();
console.log('=== STOREVIEW.TSX ===');
const s = fs.readFileSync(base + '/StoreView.tsx', 'utf8');
console.log('ORDER_LIMIT_REACHED:', s.includes('ORDER_LIMIT_REACHED') ? 'OK' : 'MISSING');

console.log();
console.log('=== BRANCHES.TSX ===');
const b = fs.readFileSync(base + '/Branches.tsx', 'utf8');
console.log('LOCATION_LIMIT_REACHED:', b.includes('LOCATION_LIMIT_REACHED') ? 'OK' : 'MISSING');

console.log();
console.log('=== ALL CHECKS PASSED:', allOk, '===');

const fs = require('fs');
const p2b = [
'              {TIERS.map(t => (',
'                <label key={t.id} className={"flex items-start gap-3 rounded-xl border-2 px-4 py-3.5 transition-colors " + (checkoutTier===t.id ? "border-brand-500 bg-brand-50" : "border-cream-200 hover:border-cream-300")}>',
'                  <input type="radio" name="checkoutTier" value={t.id} checked={checkoutTier===t.id} onChange={e => setCheckoutTier(e.target.value)} className="mt-0.5" />',
'                  <div className="min-w-0"><p className="font-bold">{t.label}</p><p className="text-xs text-ink-400">{t.hint}</p><p className="mt-1 text-sm font-extrabold tabular-nums"><Money v={tierPrice(t.id)} currency="NGN" strong /> /mo</p></div>',
'                </label>',
'              ))}',
'            </div>',
'            <Button loading={checkoutBusy} onClick={doCheckout} icon="key" className="w-full">Start checkout</Button>',
'          </div>',
'        )}',
'',
'        {actionTab==="upgrade" && (',
'          <div className="mt-5 space-y-4">',
'            <p className="text-sm text-ink-500">Upgrade to a higher tier. Prorated charge applies.</p>',
'            {higherTiers.length===0 ? (<p className="rounded-xl bg-gold-50 px-4 py-3 text-sm font-semibold text-gold-700">Already on highest tier.</p>) : (',
'              <><div className="space-y-3">',
'                {higherTiers.map(t => (',
'                  <label key={t} className={"flex items-start gap-3 rounded-xl border-2 px-4 py-3.5 transition-colors " + (upgradeTier===t ? "border-brand-500 bg-brand-50" : "border-cream-200 hover:border-cream-300")}>',
'                    <input type="radio" name="upgradeTier" value={t} checked={upgradeTier===t} onChange={e => setUpgradeTier(e.target.value)} className="mt-0.5" />',
'                    <div className="min-w-0"><p className="font-bold">{titleCase(t)}</p><p className="text-xs text-ink-400">{TIERS.find(x => x.id===t)?.hint}</p></div>',
'                  </label>',
'                ))}',
'              </div>',
].join('\n');
fs.appendFileSync('scripts/plan-body.txt', p2b);
console.log('2b:', p2b.length);

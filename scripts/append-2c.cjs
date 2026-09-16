const fs = require('fs');
const p2c = [
'              <Button loading={upgradeBusy} onClick={doUpgrade} icon="zap" className="w-full">Upgrade now</Button></>',
'            )}',
'          </div>',
'        )}',
'',
'        {actionTab==="downgrade" && (',
'          <div className="mt-5 space-y-4">',
'            <p className="text-sm text-ink-500">Downgrade deferred. Keeps current tier until period end.</p>',
'            {lowerTiers.length===0 ? (<p className="rounded-xl bg-gold-50 px-4 py-3 text-sm font-semibold text-gold-700">Already on lowest tier.</p>) : (',
'              <><div className="space-y-3">',
'                {lowerTiers.map(t => (',
'                  <label key={t} className={"flex items-start gap-3 rounded-xl border-2 px-4 py-3.5 transition-colors " + (downgradeTier===t ? "border-brand-500 bg-brand-50" : "border-cream-200 hover:border-cream-300")}>',
'                    <input type="radio" name="downgradeTier" value={t} checked={downgradeTier===t} onChange={e => setDowngradeTier(e.target.value)} className="mt-0.5" />',
'                    <div className="min-w-0"><p className="font-bold">{titleCase(t)}</p><p className="text-xs text-ink-400">{TIERS.find(x => x.id===t)?.hint}</p></div>',
'                  </label>',
'                ))}',
'              </div>',
].join('\n');
fs.appendFileSync('scripts/plan-body.txt', p2c);
console.log('2c:', p2c.length);

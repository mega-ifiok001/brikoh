const fs = require('fs');
const p2a = [
'',
'      <div className="card anim-rise p-6">',
'        <div className="flex items-center gap-2"><Icon name="settings" size={18} className="text-ink-400" /><h3 className="font-display text-base font-extrabold">Subscription</h3></div>',
'        <p className="mt-0.5 text-xs text-ink-400">Subscribe, upgrade, downgrade, or cancel.</p>',
'        <div className="mt-4 flex gap-1 border-b border-cream-200">',
'          {[',
'            { id: "history", label: "History" },',
'            ...((isActive || !!plan?.tier) ? [',
'              { id: "upgrade", label: "Upgrade" },',
'              { id: "downgrade", label: "Downgrade" },',
'              { id: "cancel", label: "Cancel" },',
'            ] : [',
'              { id: "subscribe", label: "Subscribe" },',
'            ]),',
'          ].map(t => (',
'            <button key={t.id} onClick={() => setActionTab(t.id)} className={"border-b-2 px-3.5 py-2 text-sm font-bold transition-colors -mb-px " + (actionTab===t.id ? "border-brand-500 text-brand-600" : "border-transparent text-ink-400 hover:text-ink-700")}>{t.label}</button>',
'          ))}',
'        </div>',
'',
'        {actionTab==="subscribe" && (',
'          <div className="mt-5 space-y-4">',
'            <p className="text-sm text-ink-500">Choose a plan. Redirected to Paystack.</p>',
'            <div className="space-y-3">',
].join('\n');
fs.appendFileSync('scripts/plan-body.txt', p2a);
console.log('2a:', p2a.length);

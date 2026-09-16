const fs = require('fs');
const p2d = [
'              {downgradePreview && downgradePreview.warnings?.length > 0 && (',
'                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-bold text-amber-800">Changes at downgrade:</p><ul className="mt-2 space-y-1">{downgradePreview.warnings.map((w, i) => (<li key={i} className="text-sm text-amber-700">{w.message}</li>))}</ul></div>',
'              )}',
'              {downgradePreviewBusy && <div className="mt-3 flex items-center gap-2 text-sm text-ink-400"><div className="h-4 w-4 animate-spin rounded-full border-2 border-cream-200 border-t-brand-500" />Loading...</div>}',
'              <Button loading={downgradeBusy} onClick={doDowngrade} icon="clock" className="w-full">Schedule downgrade</Button>',
'              </>',
'            )}',
'          </div>',
'        )}',
'',
'        {actionTab==="cancel" && (',
'          <div className="mt-5">',
'            <p className="text-sm text-ink-500">Cancels Paystack recurring subscription.</p>',
'            {!cancelConfirm ? (',
'              <Button variant="outline" danger onClick={() => setCancelConfirm(true)} className="mt-3 w-full">Cancel subscription</Button>',
'            ) : (',
'              <div className="mt-3 rounded-xl border border-danger-200 bg-danger-50 p-4"><p className="text-sm font-bold text-danger-700">Are you sure? Cannot be undone.</p><p className="mt-1 text-xs text-danger-600">Reverts to Starter after period end.</p><div className="mt-4 flex gap-2"><Button variant="ghost" onClick={() => setCancelConfirm(false)}>Go back</Button><Button danger loading={cancelBusy} onClick={doCancel}>Yes cancel</Button></div></div>',
'            )}',
'          </div>',
'        )}',
'      </div>',
].join('\n');
fs.appendFileSync('scripts/plan-body.txt', p2d);
console.log('2d:', p2d.length);

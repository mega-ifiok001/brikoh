const fs = require('fs');
const p = 'C:/Users/LENOVO/Documents/brikoh/src/pages/SettingsPage.tsx';
let s = fs.readFileSync(p, 'utf8');
let n = 0;
const sub = (from, to) => {
  if (!s.includes(from)) { console.log('MISS:', JSON.stringify(from.slice(0, 60))); return; }
  s = s.split(from).join(to);
  n++;
};

// 1. Drop the unused rawNum import
sub('import { fd, rawNum, titleCase } from "../lib/format";',
    'import { fd, titleCase } from "../lib/format";');

// 2. Index the tier-rank lookup maps
sub('const order = { STARTER: 0, PRO: 1, ENTERPRISE: 2 };',
    'const order: Record<string, number> = { STARTER: 0, PRO: 1, ENTERPRISE: 2 };');

// 3. Reorder: loadPayments must be declared before the effect that uses it
sub(`  useEffect(() => {
    load();
    loadPayments();
  }, [load, loadPayments]);

  // Refresh after billing actions
  const afterAction = () => {
    load();
    loadPayments();
  };

  const loadPayments = useCallback(async () => {`,
`  const loadPayments = useCallback(async () => {`);

sub(`    } finally {
      setPaymentsLoading(false);
    }
  }, []);
`,
`    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  // Refresh after billing actions
  const afterAction = () => {
    load();
    loadPayments();
  };

  useEffect(() => {
    load();
    loadPayments();
  }, [load, loadPayments]);
`);

// 4. Type the render helpers
sub('const capLabel = (cap) => cap == null ? "Unlimited" : String(cap);',
    'const capLabel = (cap: number | null | undefined) =>\n    cap == null ? "Unlimited" : String(cap);');
sub('const pct = (u, c) => {', 'const pct = (u: number, c: number | null | undefined) => {');
sub('const barTone = (u, c) => {', 'const barTone = (u: number, c: number | null | undefined) => {');

// 5. Typed tab id + warning map params
sub('onClick={() => setActionTab(t.id)}', 'onClick={() => setActionTab(t.id as any)}');
sub('{downgradePreview.warnings.map((w, i) => (',
    '{downgradePreview.warnings.map((w: any, i: number) => (');

// 6. Button has no `danger` prop — it's a variant
sub('<Button variant="outline" danger onClick={() => setCancelConfirm(true)}',
    '<Button variant="danger" onClick={() => setCancelConfirm(true)}');
sub('<Button danger loading={cancelBusy} onClick={doCancel}>Yes cancel</Button>',
    '<Button variant="danger" loading={cancelBusy} onClick={doCancel}>Yes cancel</Button>');

fs.writeFileSync(p, s);
console.log('applied', n, 'edits');
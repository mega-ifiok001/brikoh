const fs = require('fs');
const p = 'C:/Users/LENOVO/Documents/brikoh/src/pages/SettingsPage.tsx';
let s = fs.readFileSync(p, 'utf8');

// The effect currently sits before loadPayments, which is a use-before-declare
// error under TDZ. Pull the whole loadPayments block out and re-insert it
// above, leaving the effect + afterAction after it.
const re = /  useEffect\(\(\) => \{\r?\n    load\(\);\r?\n    loadPayments\(\);\r?\n  \}, \[load, loadPayments\]\);\r?\n\r?\n  \/\/ Refresh after billing actions\r?\n  const afterAction = \(\) => \{\r?\n    load\(\);\r?\n    loadPayments\(\);\r?\n  \};\r?\n\r?\n(  const loadPayments = useCallback\(async \(\) => \{[\s\S]*?\r?\n  \}, \[\]\);\r?\n)/;

const m = s.match(re);
if (!m) {
  console.log('reorder pattern not found');
} else {
  const loadPaymentsBlock = m[1];
  const rebuilt =
    loadPaymentsBlock +
    '\r\n' +
    '  // Refresh after billing actions\r\n' +
    '  const afterAction = () => {\r\n' +
    '    load();\r\n' +
    '    loadPayments();\r\n' +
    '  };\r\n' +
    '\r\n' +
    '  useEffect(() => {\r\n' +
    '    load();\r\n' +
    '    loadPayments();\r\n' +
    '  }, [load, loadPayments]);\r\n';
  s = s.replace(re, rebuilt);
  fs.writeFileSync(p, s);
  console.log('reordered ok');
}
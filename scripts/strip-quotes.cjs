const fs = require('fs');
const p = 'C:/Users/LENOVO/Documents/brikoh/src/pages/SettingsPage.tsx';
let c = fs.readFileSync(p, 'utf8');
const lines = c.split('\r\n');
const out = [];
for (const l of lines) {
  if (l.length > 2 && l[0] === "'" && l.endsWith("',")) {
    out.push(l.slice(1, -2));
  } else {
    out.push(l);
  }
}
fs.writeFileSync(p, out.join('\r\n'));
console.log('fixed', out.length, 'lines');
console.log('line1209:', JSON.stringify(out[1208]));
console.log('line1239:', JSON.stringify(out[1238]));
console.log('line1363:', JSON.stringify(out[1362]));

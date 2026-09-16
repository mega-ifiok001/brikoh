const fs = require('fs');
const fp = 'C:/Users/LENOVO/Documents/brikoh/src/pages/SettingsPage.tsx';
const c = fs.readFileSync(fp, 'utf8');
const ls = c.split('\n');
const k = [];
for (let i = 0; i < ls.length; i++) {
  const l = ls[i];
  if (l.indexOf("const fs = require") !== -1) continue;
  if (l.indexOf("// Part") !== -1) continue;
  if (l.indexOf("fs.writeFileSync") !== -1) continue;
  if (l.indexOf("console.log") !== -1) continue;
  if (l.indexOf("fs.appendFileSync") !== -1) continue;
  if (l.indexOf(".join") !== -1) continue;
  if (l.indexOf("p1 = [") !== -1) continue;
  if (l.indexOf("p2a = [") !== -1) continue;
  if (l.indexOf("p2b = [") !== -1) continue;
  if (l.indexOf("p2c = [") !== -1) continue;
  if (l.indexOf("p2d = [") !== -1) continue;
  if (l.indexOf("p3 = [") !== -1) continue;
  k.push(l);
}
fs.writeFileSync(fp, k.join('\n'));
console.log("kept", k.length, "lines");
const t = k.join('\n');
console.log("doCheckout:", t.indexOf("doCheckout"));
console.log("const fs:", t.indexOf("const fs = require"));
console.log("TIERS:", t.indexOf("const TIERS"));

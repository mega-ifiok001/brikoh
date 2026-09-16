const fs = require('fs');
const s = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');
const start = s.indexOf('const plan = data?.plan;');
const end = s.lastIndexOf('}\r\n');
const before = s.substring(0, start);
const after = s.substring(end);
const tmpl = fs.readFileSync('scripts/plan-body.txt', 'utf8');
fs.writeFileSync('src/pages/SettingsPage.tsx', before + tmpl + after);
console.log('Spliced. New length:', before.length + tmpl.length + after.length);

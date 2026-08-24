const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const textFiles = ['README.md', 'README.nl.md', 'package.json', 'flows.json', '.gitignore'];
for (const directory of ['docs', 'examples', 'node-red', 'scripts', 'tests']) {
  const pending = [path.join(root, directory)];
  while (pending.length) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes:true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) pending.push(absolute);
      else if (!/\.(?:png|jpe?g|gif|webp|ico|pdf|zip|woff2?)$/i.test(entry.name)) textFiles.push(path.relative(root, absolute).replaceAll('\\', '/'));
    }
  }
}
const patterns = [
  { name:'privé IPv4-adres', regex:/\b(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})\b/g },
  { name:'e-mailadres', regex:/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { name:'Windows-gebruikerspad', regex:/\b[A-Z]:\\Users\\[^\\\s"']+/gi },
  { name:'mogelijk voertuigidentificatienummer', regex:/\b[A-HJ-NPR-Z0-9]{17}\b/g },
  { name:'mogelijk serienummer in entiteits-ID', regex:/\b(?:sensor|binary_sensor|switch|number|select|device_tracker)\.[a-z0-9]{10,}_[a-z0-9_]+\b/gi },
  { name:'oude laadpuntrol', regex:new RegExp(['sensor', 'links_'].join('\\.'), 'gi') },
  { name:'oude voertuigentiteit', regex:new RegExp(['e', 'tron', 'sportback'].join('[_-]'), 'gi') }
];

// Hashes voorkomen dat de privacytest zelf de oude namen of apparaatcodes publiceert.
const forbiddenTokenHashes = new Set([
  '3e9a2230fb35a1d7a36b38bdf5e39b5ba384b1ac4e6f1dc8fe08591ca3adacb7',
  'beefbc9c968fa6679302ef50304bc238b07773db71d406152006fdb9954f7ad4',
  '486deb9f582a1705ea02b3dca0bb59c47bffb8485201071264882e41de59f9f2',
  '160693053592bcb4fa289579e7bf9119c49c247e5f96c51765b6478eded51f2c',
  'bebdac7e965fc42d6a1a770f37141dd2ec0f8423e5642fc8ff6f1fa28908a0e4',
  '6ad50e5818f1a2949d8f46ea5f034e5456aa3bb5716bb493b4cc6ea8395fef95',
  '773d0439dc2a8982b55e1cd3afe989b4852b140dc98b0bde23faf5d043df4a3b',
  '611972cf94fa0c2ac920f5014347ba641dff7c4cc0b8cd0be4c5758e1e7abc4c',
  '5cf705c795ef2d64aa1e8f9ec57d8268f4d5f62c0c28b003ad8d2a008a1ee11c',
  '4561c9db08d7be07c6d19752f1a03d5c87c7e73deba3e1bca7ab7588ac6c49a7'
]);

const findings = [];
for (const relative of textFiles) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) continue;
  const content = fs.readFileSync(absolute, 'utf8');
  for (const pattern of patterns) {
    pattern.regex.lastIndex = 0;
    for (const match of content.matchAll(pattern.regex)) {
      const line = content.slice(0, match.index).split('\n').length;
      findings.push(`${relative}:${line} (${pattern.name})`);
    }
  }
  const tokens = new Set((content.toLowerCase().match(/[a-z0-9-]+/g) || []).filter((token) => token.length >= 4));
  for (const token of tokens) {
    const digest = crypto.createHash('sha256').update(token).digest('hex');
    if (forbiddenTokenHashes.has(digest)) findings.push(`${relative} (bekende niet-neutrale naam of identifier)`);
  }
}

assert.strictEqual(findings.length, 0, `Privacycontrole mislukt:\n${findings.join('\n')}`);
console.log(`Privacycontrole: OK (${textFiles.length} openbare tekstbestanden)`);

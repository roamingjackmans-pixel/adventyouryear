// Headless snapshots for reviewing designs: node tools/snap.mjs <outDir> <url-or-id> [...]
// An id is shot as the raw scene (tools/scene.html?d=<id>&doors=0); anything with "://" is shot as-is.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const [, , out, ...targets] = process.argv;
fs.mkdirSync(out, { recursive: true });
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
for (const t of targets) {
  const url = t.includes('://') ? t : `http://localhost:5173/tools/scene.html?d=${t}&doors=0`;
  const name = (t.includes('://') ? t.replace(/[^a-z0-9]+/gi, '_').slice(-40) : t) + '.png';
  const file = path.resolve(out, name);
  const r = spawnSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--screenshot=${file}`, '--window-size=1600,1000', '--virtual-time-budget=6000', url], { encoding: 'utf8', timeout: 60000 });
  console.log(fs.existsSync(file) ? `ok ${file}` : `FAILED ${t} ${r.stderr.slice(0, 200)}`);
}

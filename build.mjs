// Build: node build.mjs
//  docs/     -> upload this folder's contents to josephjackman.com/adventyouryear/
//  preview/  -> single-file preview (browser-only storage), used for the claude.ai review artifact
import fs from 'node:fs';
const read = (p) => fs.readFileSync(p, 'utf8');
// Designs: parlor first, then the rest alphabetically. Each design has src/designs/<id>.js + src/layouts/<id>.js
const ids = ['parlor', ...fs.readdirSync('src/designs').filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3)).filter((i) => i !== 'parlor').sort()]
  .filter((i) => fs.existsSync('src/layouts/' + i + '.js'));
const JS_ORDER = ['src/util.js', ...ids.flatMap((i) => ['src/designs/' + i + '.js', 'src/layouts/' + i + '.js']), 'src/samples.js', 'src/board.js', 'src/api-demo.js', 'src/api-supabase.js', 'src/app.js'];
// Each design is isolated: if one throws, the others (and the app) still load.
const wrap = (p) => (p.startsWith('src/designs/') || p.startsWith('src/layouts/')
  ? `try {\n${read(p)}\n} catch (e) { console.error('Design file failed: ${p}', e); }`
  : read(p));
const js = JS_ORDER.map((p) => `/* ---- ${p} ---- */\n${wrap(p)}`).join('\n');
const css = read('src/styles.css');
const head = read('src/head.html');
const SUPABASE = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';

fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/app.js', js);
fs.writeFileSync('docs/styles.css', css);
if (!fs.existsSync('docs/config.js')) fs.copyFileSync('src/config.example.js', 'docs/config.js');
fs.writeFileSync('docs/index.html', `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Advent Your Year</title>
${head}<link rel="stylesheet" href="styles.css">
</head>
<body>
<div id="app"></div>
<script src="config.js"></script>
<script src="${SUPABASE}"></script>
<script src="app.js"></script>
</body>
</html>
`);

fs.mkdirSync('preview', { recursive: true });
fs.writeFileSync('preview/advent-your-year.html', `<meta charset="utf-8">
<title>Advent Your Year</title>
<meta name="claude:viewport-fit-sides" content="cover">
${head}<style>
${css}</style>
<div id="app"></div>
<script>window.AYY_CONFIG = { publicUrl: 'https://josephjackman.com/adventyouryear/' };</script>
<script>
${js}
</script>
`);
console.log('designs: ' + ids.join(', '));
console.log('built docs/ and preview/ — js', (js.length / 1024).toFixed(0) + 'KB');

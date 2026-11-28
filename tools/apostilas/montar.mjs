// node tools/apostilas/montar.mjs  → gera os dois PDFs em /tmp/apo com o índice já numerado (2 passadas: acha a página de cada seção e refaz).
import { execFileSync } from 'node:child_process'; import { writeFileSync, readFileSync } from 'node:fs'; import path from 'node:path';
const dir = import.meta.dirname; const run = (f, ...a) => execFileSync('node', [path.join(dir, f), ...a], { env: { ...process.env }, encoding: 'utf8' });
for (const nome of ['bateria', 'teclado']) {
  const ids = JSON.parse(run(`${nome}.mjs`).split('\n').filter((l) => l.startsWith('[')).pop()); run('render.mjs', `/tmp/apo/${nome}.html`, `/tmp/apo/${nome}.pdf`);
  const txt = execFileSync('pdftotext', ['-layout', `/tmp/apo/${nome}.pdf`, '-'], { encoding: 'utf8', maxBuffer: 1 << 28 }).split('\f'); const nums = {};
  for (const id of ids) { const i = txt.findIndex((t) => t.includes(`zzmk_${id}_zz`)); if (i >= 0) nums[id] = i + 1; }
  writeFileSync(`/tmp/apo/${nome}_nums.json`, JSON.stringify(nums));
  execFileSync('node', [path.join(dir, `${nome}.mjs`)], { env: { ...process.env, NUMS: `/tmp/apo/${nome}_nums.json` } }); run('render.mjs', `/tmp/apo/${nome}.html`, `/tmp/apo/${nome}.pdf`);
  console.log(nome, 'ok', Object.keys(nums).length, 'seções numeradas');
}

// node tools/apostilas/montar.mjs  → gera os dois PDFs em /tmp/apo: índice numerado + revisão no fim de cada módulo com linhas de anotação que fecham a página.
import { execFileSync } from 'node:child_process'; import { writeFileSync } from 'node:fs'; import path from 'node:path'; import { usoPaginas } from './verificar.mjs';
const dir = import.meta.dirname; const node = (f, env = {}, ...a) => execFileSync('node', [path.join(dir, f), ...a], { env: { ...process.env, ...env }, encoding: 'utf8' });
const paginas = (pdf) => execFileSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf8', maxBuffer: 1 << 28 }).split('\f');
for (const nome of (process.env.LIVROS || 'bateria,teclado,violao').split(',')) {
  const pdf = `/tmp/apo/${nome}.pdf`; const html = `/tmp/apo/${nome}.html`; const extras = {}; let numsArq = `/tmp/apo/${nome}_nums.json`; writeFileSync(numsArq, '{}');
  const monta = (final = false) => { const saida = node(`${nome}.mjs`, { NUMS: numsArq, EXTRAS: `/tmp/apo/${nome}_extras.json`, SEMMARCA: final ? '1' : '' }); node('render.mjs', {}, html, pdf); return JSON.parse(saida.split('\n').filter((l) => l.startsWith('[')).pop()); };
  const numera = (ids) => { const txt = paginas(pdf); const nums = {}; for (const id of ids) { const i = txt.findIndex((t) => t.includes(`zzmk_${id}_zz`)); if (i >= 0) nums[id] = i + 1; } writeFileSync(numsArq, JSON.stringify(nums)); return nums; };
  writeFileSync(`/tmp/apo/${nome}_extras.json`, '{}'); let ids = monta(); let nums = numera(ids);
  // módulos com divisor: fim do módulo i = página antes do divisor do módulo seguinte
  const mods = JSON.parse(node(`${nome}.mjs`, { NUMS: numsArq, EXTRAS: `/tmp/apo/${nome}_extras.json` }).split('\n').find((l) => l.startsWith('MODS:')).slice(5));
  const fimDe = (i) => { const prox = mods[i + 1]; if (!prox) return null; const n = nums[prox.primeira]; return n ? n - (mods[i + 1].divisor ? 2 : 1) : null; };
  const alvo = mods.map((m, i) => (m.divisor ? i : null)).filter((i) => i !== null);
  for (const i of alvo) extras[i] = (nome === 'teclado' ? +process.env.LINT : +process.env.LIN) || 8; writeFileSync(`/tmp/apo/${nome}_extras.json`, JSON.stringify(extras)); ids = monta(); nums = numera(ids);
  for (let it = 0; it < 0; it++) {
    const uso = usoPaginas(pdf); let mudou = false;
    for (const i of alvo) { const f = fimDe(i); const u = f ? uso[f - 1] : null; if (u === null || u === undefined) continue; const cabe = Math.floor((0.9 - u) * 246 / 9.5) - 3; if (u < 0.82 && cabe > 0) { extras[i] += cabe; mudou = true; } else if (u > 0.97 && extras[i] > 0) { extras[i] -= 1; mudou = true; } }
    if (!mudou) break; writeFileSync(`/tmp/apo/${nome}_extras.json`, JSON.stringify(extras)); ids = monta(); nums = numera(ids);
  }
  ids = monta(); numera(ids); ids = monta(true); console.log(nome, 'ok', JSON.stringify(extras), Object.keys(nums).length, 'seções');
}

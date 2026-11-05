// Exporta as figurinhas em PNG (retina: 1200 x 1800), os 8 modelos vazios, a folha dos modelos, o painel de amostra e o catálogo final.
// Uso: node scripts/export-figurinhas.mjs [pasta-de-saida]      (precisa do Playwright e de Pillow/zip só para o ZIP final, que é opcional)
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { serve, ROOT } from '../tests/e2e/harness.mjs';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'exports/figurinhas'));
const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/figurinhas/catalogo.json'), 'utf8'));
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').toUpperCase().slice(0, 60);
for (const d of ['cartas', 'modelos']) fs.mkdirSync(path.join(OUT, d), { recursive: true });
const { srv, url } = await serve();
const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width: 600, height: 900 }, deviceScaleFactor: 2 });
const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
await pg.goto(`${url}/scripts/figurinhas-render.html`); await pg.waitForFunction(() => window.__ready);
const shot = async (e, file, opts = {}) => {
  await pg.evaluate(async ([e, o]) => {
    if (e.foto) await new Promise((ok, no) => { const i = new Image(); i.onload = ok; i.onerror = () => no(new Error('foto ' + e.foto)); i.src = e.foto; });
    document.getElementById('out').innerHTML = window.__cardSVG(e, { url: e.foto || null, ...o });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, [e, opts]);
  await pg.locator('#out').screenshot({ path: file, omitBackground: true });
};
const rows = [];
for (const e of cat) {
  const saida = `cartas/${e.codigo}_${slug(e.artista_banda)}.png`;
  await shot(e, path.join(OUT, saida));
  rows.push({ codigo: e.codigo, artista_banda: e.artista_banda, colecao: e.colecao, raridade: e.raridade, modelo: e.modelo, foto_original: e.foto, saida_png: saida, status: 'gerada', observacoes: e.nota || '' });
}
const tpls = ['C01', 'C02', 'R01', 'R02', 'E01', 'E02', 'E03', 'E04'];
for (const t of tpls) await shot({ modelo: t }, path.join(OUT, `modelos/${t}_modelo_vazio.png`));
// painel de amostra: modelos com fotos de proporções diferentes
const sample = [['C01', 'F013'], ['C02', 'F014'], ['R01', 'F016'], ['R02', 'F018'], ['E01', 'F001'], ['E02', 'F004'], ['E03', 'F005'], ['E04', 'F010']];
fs.writeFileSync(path.join(OUT, 'catalogo_final.json'), JSON.stringify(rows, null, 1));
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`; const cols = Object.keys(rows[0]);
fs.writeFileSync(path.join(OUT, 'catalogo_final.csv'), `${cols.join(',')}\n${rows.map((r) => cols.map((c) => csvCell(r[c])).join(',')).join('\n')}\n`);
// folhas (montadas numa página só, em escala menor)
const sheet = async (items, file, cols = 4) => {
  await pg.setViewportSize({ width: 600 * cols, height: 900 * Math.ceil(items.length / cols) });
  await pg.evaluate(async ([items, cols]) => {
    for (const [e] of items) if (e.foto) await new Promise((ok) => { const i = new Image(); i.onload = ok; i.src = e.foto; });
    const out = document.getElementById('out'); out.style.cssText = `display:grid;grid-template-columns:repeat(${cols},600px);gap:0;line-height:0`;
    out.innerHTML = items.map(([e], i) => window.__cardSVG(e, { url: e.foto || null, uid: 'p' + i })).join('');
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, [items, cols]);
  await pg.locator('#out').screenshot({ path: file, omitBackground: true });
  await pg.evaluate(() => { document.getElementById('out').style.cssText = ''; });
};
await sheet(tpls.map((t) => [{ modelo: t }]), path.join(OUT, 'FOLHA_8_MODELOS.png'));
await sheet(sample.map(([t, c]) => [{ ...cat.find((r) => r.codigo === c), modelo: t }]), path.join(OUT, 'PAINEL_AMOSTRA_PROPORCOES.png'));
await browser.close(); srv.close();
console.log(JSON.stringify({ cartas: rows.length, modelos: tpls.length, erros: errs }));
if (errs.length) process.exit(1);

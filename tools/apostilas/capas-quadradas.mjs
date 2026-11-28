// node tools/apostilas/capas-quadradas.mjs → capas quadradas (1600×1600) das duas apostilas, no mesmo desenho dos livros.
import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
import { pathToFileURL } from 'node:url'; import path from 'node:path'; import { writeFileSync } from 'node:fs';
import { MEIOTOM_TAMBOR, MEIOTOM_TECLAS, TEMAS } from './lib-premium.mjs';
const F = (n) => pathToFileURL(path.resolve(import.meta.dirname, '../../assets/fonts', n)).href;
const out = process.argv[2] || '/tmp/apo';
const livros = [
  { id: 'bateria', tema: 'vinho', t1: 'BATERIA', t2: 'para adultos', lema: 'da primeira baqueta ao primeiro groove', chips: ['grooves', 'rudimentos', 'leitura de partitura'], art: MEIOTOM_TAMBOR, pos: 'left:350px;top:205px;width:600px;height:600px' },
  { id: 'teclado', tema: 'azul', t1: 'TECLADO', t2: 'do zero', lema: 'da primeira tecla à primeira música', chips: ['acordes', 'duas mãos', 'leitura de partitura'], art: MEIOTOM_TECLAS, pos: 'left:300px;top:230px;width:660px;height:auto' },
];
const b = await chromium.launch({ args: ['--no-sandbox'] });
for (const l of livros) {
  const V = TEMAS[l.tema].v; const arte = l.art(V).replace(/<svg class="arte" style="[^"]*" width="[^"]*" height="[^"]*"/, `<svg class="arte" style="${l.pos}"`);
  const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:'Anton';src:url('${F('Anton-latin.woff2')}')}@font-face{font-family:'Hanken';src:url('${F('HankenGrotesk-latin.woff2')}');font-weight:100 900}
*{box-sizing:border-box}body{margin:0}.c{width:1000px;height:1000px;position:relative;overflow:hidden;background:#f3ead9;color:#0a0406;font-family:'Hanken'}
.vert{position:absolute;left:34px;top:30px;writing-mode:vertical-rl;transform:rotate(180deg);font-family:'Anton';font-size:218px;line-height:.82;color:${V};white-space:nowrap}
.topo{position:absolute;right:44px;top:40px;text-align:right}.topo small{display:block;font-weight:800;font-size:17px;letter-spacing:.32em;text-transform:uppercase;margin-bottom:8px}.topo em{font-style:normal;font-family:'Anton';font-size:48px;text-transform:uppercase;letter-spacing:.02em}
.arte{position:absolute}
.rod{position:absolute;left:0;right:0;bottom:0;height:178px;background:${V};color:#f6efe0;padding:30px 44px 0 300px}
.rod b{display:block;font-family:'Anton';font-weight:400;font-size:35px;letter-spacing:.02em;text-transform:uppercase;color:#d9b266;margin-bottom:12px;line-height:1.1}
.rod span{font-weight:800;font-size:19px;letter-spacing:.18em;text-transform:uppercase}
</style><div class="c"><div class="vert">${l.t1}</div><div class="topo"><small>Beaterista · método</small><em>${l.t2}</em></div>${arte}<div class="rod"><b>${l.lema}</b><span>${l.chips.join(' · ')}</span></div></div>`;
  writeFileSync(`${out}/capa_${l.id}.html`, html);
  const p = await b.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 1.6 }); await p.goto(pathToFileURL(`${out}/capa_${l.id}.html`).href); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `${out}/Capa_${l.id}_quadrada.png` }); await p.close();
}
await b.close(); console.log('ok');

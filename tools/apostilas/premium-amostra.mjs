// Amostra do novo sistema de design (referências: Blue Note/Reid Miles = duas cores + tipografia como imagem; tendências 2026 = tipografia grande, grade suíça, hierarquia por escala).
import { pathToFileURL } from 'node:url'; import path from 'node:path'; import { writeFileSync } from 'node:fs';
import { groove, svgBateria } from './notas.mjs'; import { comContagem, semB } from './lib.mjs';
const F = (n) => pathToFileURL(path.resolve(import.meta.dirname, '../../assets/fonts', n)).href;
const V = '#5b0f22', INK = '#17090d', CREME = '#f3ead9', OURO = '#c9993a';
const css = `
@font-face{font-family:'Anton';src:url('${F('Anton-latin.woff2')}')}
@font-face{font-family:'Bodoni';src:url('${F('BodoniModa-latin.woff2')}');font-weight:400 900}
@font-face{font-family:'Hanken';src:url('${F('HankenGrotesk-latin.woff2')}');font-weight:100 900}
@page{size:A4;margin:0}*{box-sizing:border-box}html,body{margin:0;background:#777}
body{font-family:'Hanken',sans-serif;color:${INK};font-size:9.6pt;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.p{width:210mm;height:297mm;position:relative;overflow:hidden;background:${CREME};page-break-after:always;break-after:page}
.cab{position:absolute;left:16mm;right:16mm;top:11mm;display:flex;justify-content:space-between;font-size:6.8pt;letter-spacing:.28em;text-transform:uppercase;font-weight:700;padding-bottom:2.6mm;border-bottom:.35mm solid ${INK}}
.cab b{color:${V}}
.pe{position:absolute;left:16mm;right:16mm;bottom:10mm;display:flex;justify-content:space-between;align-items:baseline;font-size:6.8pt;letter-spacing:.24em;text-transform:uppercase;font-weight:600;color:#6f5f58}
.pe .n{font-family:'Anton';font-size:15pt;letter-spacing:.02em;color:${V}}
.trilho{position:absolute;left:16mm;top:24mm;width:34mm}
.trilho .num{font-family:'Anton';font-size:84pt;line-height:.88;color:${V};letter-spacing:-.01em}
.trilho .area{margin-top:3mm;font-size:6.8pt;letter-spacing:.26em;text-transform:uppercase;font-weight:700;border-top:.35mm solid ${INK};padding-top:2.4mm;line-height:1.5}
.col{position:absolute;left:56mm;right:16mm;top:24mm;bottom:22mm}
.barra{width:16mm;height:1.8mm;background:${V};margin-bottom:4mm}
h1{font-family:'Anton';font-weight:400;text-transform:uppercase;font-size:33pt;line-height:1.02;letter-spacing:.005em;margin:0 0 2.4mm;color:${INK}}
.sub{font-family:'Bodoni';font-style:italic;font-size:12.5pt;line-height:1.3;color:#5d4d47;margin:0 0 6mm}
h2{font-size:7.4pt;letter-spacing:.26em;text-transform:uppercase;font-weight:800;color:${V};margin:6mm 0 2mm;display:flex;align-items:center;gap:3mm}
h2::after{content:'';flex:1;height:.3mm;background:${INK};opacity:.35}
.fig{border-top:.35mm solid ${INK};padding:2.6mm 0 3.2mm;margin:0 0 1mm}
.fig .et{display:flex;justify-content:space-between;align-items:baseline;font-size:6.8pt;letter-spacing:.22em;text-transform:uppercase;font-weight:800;color:${V}}
.fig .et span:last-child{color:#7b6a62;letter-spacing:.1em;font-weight:500;text-transform:none;font-size:8pt}
.fig svg{display:block;width:100%;height:auto;max-height:27mm;margin:1.6mm 0}
.fig p{margin:0;font-size:8.8pt;color:#3d2e2a}
table{width:100%;border-collapse:collapse;font-size:8.8pt;margin:1mm 0 3mm}
th{text-align:left;font-size:6.6pt;letter-spacing:.22em;text-transform:uppercase;color:${V};font-weight:800;padding:1.6mm 2mm 1.6mm 0;border-bottom:.5mm solid ${INK}}
td{padding:2.1mm 2mm 2.1mm 0;border-bottom:.2mm solid #cdbfae;vertical-align:top}td:first-child{font-weight:700}
.dica{background:${V};color:${CREME};padding:4mm 5mm;margin:5mm 0 3mm}
.dica b{display:block;font-size:6.6pt;letter-spacing:.3em;text-transform:uppercase;color:${OURO};margin-bottom:1.2mm}
.dica span{font-family:'Bodoni';font-size:11pt;line-height:1.35;font-style:italic}
.cit{font-family:'Bodoni';font-style:italic;font-weight:500;font-size:17pt;line-height:1.22;color:${V};margin:6mm 0 4mm;padding-left:8mm;position:relative}
.cit::before{content:'';position:absolute;left:0;top:1.5mm;bottom:1.5mm;width:1.6mm;background:${OURO}}
ul.l{list-style:none;margin:0 0 3mm;padding:0}ul.l li{padding:2mm 0 2mm 7mm;border-bottom:.2mm solid #cdbfae;position:relative}ul.l li::before{content:'';position:absolute;left:0;top:3.4mm;width:3mm;height:1.1mm;background:${V}}
.cad{margin-top:4mm;border-top:.35mm solid ${INK};padding-top:2.4mm;font-size:7.6pt;color:#6f5f58;letter-spacing:.06em}.cad b{letter-spacing:.24em;text-transform:uppercase;font-size:6.6pt;color:${V};margin-right:3mm}
/* capa */
.capa{background:${CREME}}
.capa .vert{position:absolute;left:9mm;top:16mm;writing-mode:vertical-rl;transform:rotate(180deg);font-family:'Anton';font-size:196pt;line-height:.8;color:${V};letter-spacing:.005em;white-space:nowrap;text-transform:uppercase}
.capa .topo{position:absolute;right:16mm;top:16mm;text-align:right}
.capa .topo small{display:block;font-size:7pt;letter-spacing:.34em;text-transform:uppercase;font-weight:800;margin-bottom:2mm}
.capa .topo em{font-family:'Bodoni';font-size:30pt;font-style:italic;line-height:1;color:${INK}}
.capa .halftone{position:absolute;right:-30mm;top:74mm}
.capa .rod{position:absolute;right:16mm;bottom:14mm;width:84mm;border-top:.5mm solid ${INK};padding-top:3mm;font-size:8.6pt;line-height:1.4;font-weight:600}
.capa .rod b{color:${V};display:block;font-size:6.8pt;letter-spacing:.3em;text-transform:uppercase;margin-bottom:1.4mm}
/* divisor */
.div{background:${V};color:${CREME}}
.div .gr{position:absolute;left:12mm;top:20mm;font-family:'Anton';font-size:380pt;line-height:.8;color:transparent;-webkit-text-stroke:.5mm ${OURO};opacity:.9;letter-spacing:-.02em}
.div h1{position:absolute;left:16mm;right:16mm;bottom:112mm;color:${CREME};font-size:74pt;line-height:.95}
.div .barra{position:absolute;left:16mm;bottom:206mm;background:${OURO}}
.div .cita{position:absolute;left:16mm;width:130mm;bottom:70mm;font-family:'Bodoni';font-style:italic;font-size:17pt;line-height:1.28;color:${OURO}}
.div ol{position:absolute;left:16mm;right:16mm;bottom:24mm;margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:0 8mm;font-size:8.6pt;border-top:.35mm solid ${CREME}}
.div ol li{padding:2mm 0;border-bottom:.2mm solid rgba(243,234,217,.3)}.div ol b{font-family:'Anton';font-weight:400;color:${OURO};margin-right:2.6mm;font-size:11pt}
.div .cab{border-color:${CREME};color:${CREME}}.div .cab b{color:${OURO}}.div .pe{color:#d3b5b8}.div .pe .n{color:${OURO}}
/* sumário */
.mod{display:grid;grid-template-columns:34mm 1fr;margin-bottom:7mm}
.mod .k{font-family:'Anton';font-size:46pt;line-height:.9;color:${V}}
.mod h3{margin:0 0 2mm;font-size:7pt;letter-spacing:.28em;text-transform:uppercase;font-weight:800;border-bottom:.5mm solid ${INK};padding-bottom:1.6mm}
.mod .it{display:flex;gap:3mm;padding:1.3mm 0;border-bottom:.2mm solid #cdbfae;font-size:9pt}.mod .it span:first-child{font-weight:800;color:${V};width:7mm}.mod .it span:nth-child(2){flex:1}.mod .it span:last-child{font-family:'Anton';font-size:9.4pt;color:${INK}}
`;
// meio-tom: o tambor visto de cima, desenhado com pontos (como impressão offset)
const meiotom = (() => { const R = 78; const passo = 3.6; let o = ''; for (let y = -R; y <= R; y += passo) for (let x = -R; x <= R; x += passo) { const xx = x + ((Math.round(y / passo) % 2) ? passo / 2 : 0); const d = Math.hypot(xx, y); if (d > R) continue; const nx = xx / R, ny = y / R; const luz = 0.5 + 0.5 * (-(nx * -0.55) - (ny * -0.65)) * 1; const esf = Math.sqrt(Math.max(0, 1 - (d / R) ** 2)); const t = Math.min(1, Math.max(0, 0.18 + 0.82 * esf * (0.35 + 0.65 * luz))); const rr = 0.2 + 1.7 * (1 - t) ** 1.2; o += `<circle cx="${(R + xx).toFixed(2)}" cy="${(R + y).toFixed(2)}" r="${rr.toFixed(2)}" fill="${V}"/>`; } o = `<defs><clipPath id="cl"><circle cx="${R}" cy="${R}" r="${R - 1}"/></clipPath></defs><g clip-path="url(#cl)">${o}</g>`; o += `<circle cx="${R}" cy="${R}" r="${R - 1}" fill="none" stroke="${INK}" stroke-width=".7"/><circle cx="${R}" cy="${R}" r="${R - 9}" fill="none" stroke="${INK}" stroke-width=".35"/>`; return `<svg class="halftone" width="${R * 2}mm" height="${R * 2}mm" viewBox="0 0 ${R * 2} ${R * 2}">${o}</svg>`; })();
const tinta = (svg) => svg.replace(/#b8913f/g, V).replace('font-family="Hanken, sans-serif"', 'font-family="Hanken, sans-serif" letter-spacing=".02em"');
const nota = (l, o = {}, w = 640) => { const evs = groove(l, o); return tinta(comContagem(semB(svgBateria(evs, w)), evs)); };
const fig = (et, meta, svg, tx = '') => `<div class="fig"><div class="et"><span>${et}</span><span>${meta}</span></div>${svg}${tx ? `<p>${tx}</p>` : ''}</div>`;
const cab = (a, b) => `<div class="cab"><span>Bateria para adultos</span><span><b>${a}</b> ${b}</span></div>`;
const pe = (n) => `<div class="pe"><span>Beaterista · método</span><span class="n">${String(n).padStart(2, '0')}</span></div>`;
const sec = (num, area, n, titulo, sub, corpo, cabA, cabB) => `<section class="p">${cab(cabA, cabB)}<div class="trilho"><div class="num">${num}</div><div class="area">${area}</div></div><div class="col"><div class="barra"></div><h1>${titulo}</h1><p class="sub">${sub}</p>${corpo}</div>${pe(n)}</section>`;
const HH8 = 'x.x.x.x.x.x.x.x.', SN = '....x.......x...', BD = 'x.......x.......';
const P = [];
P.push(`<section class="p capa"><div class="vert">bateria</div><div class="topo"><small>Beaterista · método</small><em>para adultos</em></div>${meiotom}<div class="rod"><b>Apostila</b>da primeira baqueta ao primeiro groove, em 15 minutos por dia.</div></section>`);
P.push(`<section class="p">${cab('Índice', '')}<div style="position:absolute;left:16mm;right:16mm;top:24mm"><h1 style="font-size:58pt;margin-bottom:8mm">Índice</h1>
${[['01', 'Primeiros passos', [['01', 'Como usar esta apostila', '04'], ['02', 'Conheça as peças da bateria', '05'], ['03', 'Postura, banco e pegada', '06'], ['04', 'Os pés: bumbo e chimbal', '07']]], ['02', 'Pulso e groove', [['07', 'Aquecimento de 5 minutos', '11'], ['08', 'Pulso e metrônomo', '12'], ['10', 'O primeiro groove', '15'], ['11', 'Variações do bumbo', '16']]], ['03', 'Técnica e expressão', [['16', 'Viradas', '22'], ['18', 'Rudimentos essenciais', '24'], ['20', 'Acentos e notas fantasma', '26']]], ['04', 'Tocando de verdade', [['23', 'Estude em 15 minutos', '30'], ['24', 'Montando sua primeira música', '31'], ['25', 'Uma música de 8 compassos', '32']]]].map(([k, t, it]) => `<div class="mod"><div class="k">${k}</div><div><h3>${t}</h3>${it.map(([n, x, pg]) => `<div class="it"><span>${n}</span><span>${x}</span><span>${pg}</span></div>`).join('')}</div></div>`).join('')}</div>${pe(2)}</section>`);
P.push(`<section class="p div">${cab('Módulo 02', 'Pulso e groove')}<div class="gr">02</div><h1>Pulso<br>e groove</h1><div class="cita">Quem toca no tempo é lembrado. Quem toca rápido é esquecido.</div><ol>${[['07', 'Aquecimento'], ['08', 'Pulso e metrônomo'], ['09', 'Colcheias e semicolcheias'], ['10', 'Pausas e silêncios'], ['11', 'O primeiro groove'], ['12', 'Variações do bumbo']].map(([n, t]) => `<li><b>${n}</b>${t}</li>`).join('')}</ol>${pe(10)}</section>`);
P.push(sec('11', 'Módulo 02<br>Pulso e groove', 15, 'O primeiro<br>groove', 'O ritmo de rock que está em milhares de músicas. Monte em três camadas.', `${fig('Camada 1', 'só o chimbal · 60 bpm', nota({ hh: HH8 }), 'Mão direita. Conte “1 & 2 & 3 & 4 &”.')}${fig('Camada 2', '+ caixa', nota({ hh: HH8, sn: SN }), 'A mão esquerda bate no tempo 2 e no 4.')}${fig('Camada 3', '+ bumbo · groove completo', nota({ hh: HH8, sn: SN, bd: BD }), 'Nos tempos 1 e 3, chimbal e bumbo caem juntos. Nos tempos 2 e 4, chimbal e caixa.')}<div class="dica"><b>Dica de estudo</b><span>Se o bumbo atrapalhar o chimbal, treine só o pé: bumbo no 1 e no 3, contando alto. Depois junte.</span></div><div class="cad"><b>Caderno</b>data ____/____ &nbsp;&nbsp; bpm ______ &nbsp;&nbsp; ☐ difícil ☐ ok ☐ fácil</div>`, 'Módulo 02', 'Pulso e groove'));
P.push(sec('13', 'Módulo 02<br>Pulso e groove', 17, 'Grooves<br>por estilo', 'Seis levadas para tocar junto com muita música.', `${fig('01 · Rock', 'clássico · 90 a 120 bpm', nota({ hh: HH8, sn: SN, bd: BD }), 'O groove base, com acento na caixa para ganhar peso.')}${fig('02 · Meio-tempo', 'balada e pop · 60 a 80 bpm', nota({ hh: HH8, sn: '........x.......', bd: 'x...............' }), 'A caixa cai só no tempo 3: a música “respira” mais devagar.')}${fig('03 · Funk', 'semicolcheias · 80 a 100 bpm', nota({ hh: 'xxxxxxxxxxxxxxxx', sn: '....x.......x...', bd: 'x.....x...x.....' }, { passo: 1 }), 'O chimbal toca quatro notas por tempo: “1 e & a 2 e & a”.')}<div class="dica"><b>Como usar</b><span>Descubra o andamento da música que você gosta com o metrônomo do celular e toque a levada por cima.</span></div>`, 'Módulo 02', 'Pulso e groove'));
P.push(sec('01', 'Módulo 01<br>Primeiros passos', 4, 'Como usar<br>esta apostila', 'Feita pra quem tem agenda cheia e quer resultado de verdade.', `<ul class="l"><li><b>Quinze minutos, todo dia.</b> Treinar pouco e com frequência ensina o corpo melhor do que uma maratona por semana.</li><li><b>Uma página por vez.</b> Não precisa decorar a apostila. Domine um groove, depois passe para o próximo.</li><li><b>Use o metrônomo sempre.</b> É o professor mais honesto que existe. Qualquer aplicativo gratuito serve.</li></ul><div class="cit">O cérebro adulto aprende, sim. Só pede mais repetição inteligente e menos pressa.</div><h2>Sua rotina de 15 minutos</h2><table><tr><th style="width:18mm">Tempo</th><th>O que fazer</th></tr><tr><td>3 min</td><td>Aquecimento: pulso no chimbal com o metrônomo, bem devagar.</td></tr><tr><td>7 min</td><td>O groove ou a virada da semana, em andamento lento.</td></tr><tr><td>3 min</td><td>Rudimento para a coordenação das mãos.</td></tr><tr><td>2 min</td><td>Toque o que você já domina, sem parar, só pelo prazer.</td></tr></table><div class="dica"><b>Dica de estudo</b><span>Marque o horário na agenda como um compromisso. Estudar “quando sobrar tempo” quase nunca acontece.</span></div>`, 'Módulo 01', 'Primeiros passos'));
writeFileSync('/tmp/apo/premium.html', `<!doctype html><meta charset="utf-8"><style>${css}</style>${P.join('')}`);

// ===== variante teclado (mesma gramática, azul-marinho) =====
const AZ = '#0f2a57';
const teclasMeiotom = (() => { const W = 112, H = 100; let o = ''; const brancas = 8; const kw = W / brancas; for (let i = 0; i <= brancas; i++) o += `<line x1="${i * kw}" y1="0" x2="${i * kw}" y2="${H}" stroke="${INK}" stroke-width=".5"/>`; o += `<line x1="0" y1="${H}" x2="${W}" y2="${H}" stroke="${INK}" stroke-width=".5"/><line x1="0" y1="0" x2="${W}" y2="0" stroke="${INK}" stroke-width=".5"/>`; [0, 1, 3, 4, 5].forEach((i) => { const x0 = i * kw + kw * .66, w = kw * .68, h = H * .62; for (let y = 1.2; y < h; y += 3.2) for (let x = x0 + 1.2; x < x0 + w; x += 3.2) { const t = y / h; o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.5 - t * 1.2).toFixed(2)}" fill="${AZ}"/>`; } o += `<rect x="${x0}" y="0" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width=".4"/>`; }); return `<svg class="halftone" style="right:16mm;top:104mm" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">${o}</svg>`; })();
const capaTeclado = `<section class="p capa" style="--v:${AZ}"><div class="vert" style="color:${AZ};font-size:168pt">teclado</div><div class="topo"><small>Beaterista · método</small><em>do zero</em></div>${teclasMeiotom}<div class="rod"><b style="color:${AZ}">Apostila</b>da primeira tecla à primeira música, em 15 minutos por dia.</div></section>`;
writeFileSync('/tmp/apo/premium_teclado.html', `<!doctype html><meta charset="utf-8"><style>${css}</style>${capaTeclado}`);
console.log(P.length);

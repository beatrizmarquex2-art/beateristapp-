// Baixar / compartilhar a figurinha: gera o PNG no próprio aparelho (nada sobe pra servidor).
//   carta: a figurinha sozinha (1080 x 1425, cantos transparentes)
//   post : feed do Instagram (1080 x 1350, 4:5) com a figurinha, "NOVA FIGURINHA!" e o rodapé da escola
//   story: 1080 x 1920 (9:16), com folga em cima e embaixo pra não ficar atrás dos botões do Instagram
import * as O from './ornaments.js';
import { MODELOS2 } from './modelos2-data.js';
import { planoFoto, fitLabel, W2, H2 } from './card2.js';

export const SITE = 'jogos.beaterista.com.br', ESCOLA = 'beaterista escola de música';
export const FORMATOS = { carta: [1080, 1425], post: [1080, 1350], story: [1080, 1920] };
const FONTS = ["40px 'Anton'", "800 24px 'Hanken Grotesk'", "40px 'Gochi Hand'"];

const img = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(`imagem: ${src}`)); i.src = src; });
const svgImg = (svg) => img(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const poly = (ctx, pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };

/** Desfoque barato que funciona em qualquer navegador (o iPhone não tem ctx.filter): encolhe duas vezes e estica. */
function blurDraw(ctx, im, x, y, w, h) {
  let c = canvas(Math.max(8, Math.round(w / 30)), Math.max(8, Math.round(h / 30))); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
  const c2 = canvas(Math.max(16, Math.round(w / 8)), Math.max(16, Math.round(h / 8))); const g = c2.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, c2.width, c2.height);
  ctx.imageSmoothingQuality = 'high'; ctx.drawImage(c2, x, y, w, h);
}

/** A figurinha desenhada num canvas (mesma conta do cardSVG2: foto no maior zoom que não corta rosto, nome no rótulo). */
export async function cartaCanvas(e, { escala = 3, codigo = false } = {}) {
  await Promise.all(FONTS.map((f) => document.fonts.load(f)));
  const m = MODELOS2[e.modelo2], [tpl, foto] = await Promise.all([img(`assets/figurinhas/modelos2/${e.modelo2}.webp`), img(e.foto)]);
  const c = canvas(W2 * escala, H2 * escala), ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(tpl, 0, 0, c.width, c.height);
  ctx.save(); ctx.scale(escala, escala);
  const f = planoFoto({ ...e, largura_px: foto.naturalWidth, altura_px: foto.naturalHeight }, e.modelo2);
  ctx.translate(f.cx, f.cy); ctx.rotate((f.ang * Math.PI) / 180); ctx.translate(-f.cx, -f.cy); poly(ctx, f.poly); ctx.clip();
  if (!f.cobre) { blurDraw(ctx, foto, f.fundo.x, f.fundo.y, f.fundo.w, f.fundo.h); ctx.fillStyle = 'rgba(12,10,16,.42)'; ctx.fillRect(0, 0, W2, H2); }
  ctx.drawImage(foto, f.x, f.y, f.w, f.h);
  ctx.restore();
  // nome no rótulo
  const r = m.rotulo, fit = fitLabel(e.artista_banda || '', r.largura * 0.97), lh = fit.size * 1.05;
  ctx.save(); ctx.scale(escala, escala); ctx.translate(r.centro[0], r.centro[1]); ctx.rotate((r.angulo * Math.PI) / 180);
  ctx.font = `${fit.size}px 'Anton', Impact, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = r.escuro ? '#17130f' : '#f1e3c6';
  fit.lines.forEach((l, i) => ctx.fillText(l, 0, (i - (fit.lines.length - 1) / 2) * lh + fit.size * 0.36));
  ctx.restore();
  if (codigo && e.codigo) {
    const t = `${e.codigo}${e.secao === 'Beatlemania' ? ' · BEATLEMANIA' : ''}`; ctx.save(); ctx.scale(escala, escala); ctx.font = "800 9.5px 'Hanken Grotesk', sans-serif";
    const w = ctx.measureText(t).width + 14; ctx.fillStyle = 'rgba(0,0,0,.62)'; ctx.beginPath(); ctx.roundRect(9, 8, w, 17, 8.5); ctx.fill(); ctx.fillStyle = '#f6ecd5'; ctx.fillText(t, 16, 20); ctx.restore();
  }
  return c;
}

/* ---------- fundo do post (só formas: vira imagem sem precisar de fonte) ---------- */
const TEMAS = {
  Comum: { bg: '#ecdfc2', grade: true, a: '#c4182c', b: '#17224a', tinta: '#17224a', realce: '#c4182c', faixa: '#fbf4e2', logoClaro: false },
  Raras: { bg: '#5b1424', a: '#c4182c', b: '#14111a', tinta: '#efe2c6', realce: '#e9b824', faixa: '#efe2c6', logoClaro: true, stars: true },
  Exclusiva: { bg: '#14111a', a: '#5b1424', b: '#d9a63c', tinta: '#efe2c6', realce: '#d9a63c', faixa: '#efe2c6', logoClaro: true, stars: true },
  Beatlemania: { bg: '#14111a', rays: true, a: '#ff3d81', b: '#35b4ff', tinta: '#fbf6ea', realce: '#ffe94d', faixa: '#fbf6ea', logoClaro: true, stars: true },
};
export const temaDe = (e) => (e.secao === 'Beatlemania' ? TEMAS.Beatlemania : TEMAS[e.raridade] || TEMAS.Comum);
function fundoSVG(t, W, H, seed) {
  const r = O.rng(O.hashSeed(seed)); let s = `<rect width="${W}" height="${H}" fill="${t.bg}"/>`;
  if (t.rays) {
    const cx = W / 2, cy = H * 0.46, cols = ['#ff3d81', '#ffb02e', '#ffe94d', '#3ddc97', '#35b4ff', '#9b5cff', '#ff7a3d'];
    for (let i = 0; i < 28; i++) { const a1 = (i * 360) / 28, a2 = a1 + 360 / 28, p = (a) => `${(cx + 1800 * Math.cos((a * Math.PI) / 180)).toFixed(1)},${(cy + 1800 * Math.sin((a * Math.PI) / 180)).toFixed(1)}`; s += `<polygon points="${cx},${cy} ${p(a1)} ${p(a2)}" fill="${cols[i % 7]}"/>`; }
    s += `<rect width="${W}" height="${H}" fill="#14111a" opacity=".12"/>`;
  } else {
    if (t.grade) { for (let x = 0; x < W; x += 46) s += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#7f95b8" stroke-opacity=".28" stroke-width="2"/>`; for (let y = 0; y < H; y += 46) s += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#7f95b8" stroke-opacity=".28" stroke-width="2"/>`; }
    s += `<circle cx="${W * 0.05}" cy="${H * 0.08}" r="${W * 0.34}" fill="${t.a}"/><circle cx="${W * 0.98}" cy="${H * 0.93}" r="${W * 0.36}" fill="${t.b}"/>`;
    if (!t.grade) s += `<circle cx="${W * 0.95}" cy="${H * 0.1}" r="${W * 0.16}" fill="${t.b}" opacity=".55"/>`;
  }
  const spots = [[0.09, 0.3], [0.92, 0.26], [0.07, 0.62], [0.94, 0.58], [0.13, 0.86], [0.88, 0.84]];
  spots.forEach(([x, y], i) => {
    const k = Math.floor(r() * 4), g = `translate(${(x * W).toFixed(0)} ${(y * H).toFixed(0)}) rotate(${Math.round(r() * 60 - 30)})`;
    const art = [O.star(0, 0, 38, t.realce, '#14111a', 5, -90, i + 2), O.sparkle(0, 0, 34, '#fbf6ea', '#14111a'), `<g transform="scale(.9)">${O.note('#14111a')}</g>`, `<g transform="scale(.55)">${O.bolt(t.realce, '#14111a', 8)}</g>`][k];
    s += `<g transform="${g}" opacity=".95">${art}</g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>`;
}
const fita = (ctx, x, y, w, h, rot, cor) => { ctx.save(); ctx.translate(x, y); ctx.rotate((rot * Math.PI) / 180); ctx.globalAlpha = 0.88; ctx.fillStyle = cor; ctx.beginPath(); for (let i = 0; i <= 6; i++) ctx.lineTo(i % 2 ? 8 : 0, (h * i) / 6); for (let i = 6; i >= 0; i--) ctx.lineTo(w - (i % 2 ? 8 : 0), (h * i) / 6); ctx.closePath(); ctx.fill(); ctx.restore(); };

/** Post (4:5) ou story (9:16): fundo da raridade, figurinha inclinada com fita, título e o rodapé da escola. */
export async function postCanvas(e, formato = 'post') {
  const [W, H] = FORMATOS[formato], t = temaDe(e), story = formato === 'story';
  const [carta, fundo, logo] = await Promise.all([cartaCanvas(e, { escala: 3 }), svgImg(fundoSVG(t, W, H, e.codigo)), img('assets/logo-nome.png')]);
  const c = canvas(W, H), ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(fundo, 0, 0);
  // logo (só a palavra, sem "escola de música"; no escuro vira creme)
  const lw = story ? 520 : 440, lh = (lw * 175) / 900, ly = story ? 200 : 62;
  const lg = canvas(900, 175); const lc = lg.getContext('2d'); lc.drawImage(logo, 0, 0, 900, 257);
  if (t.logoClaro) { lc.globalCompositeOperation = 'source-in'; lc.fillStyle = '#f6ecd5'; lc.fillRect(0, 0, 900, 175); }
  ctx.drawImage(lg, (W - lw) / 2, ly, lw, lh);
  // título
  const ty = ly + lh + (story ? 84 : 74);
  ctx.save(); ctx.translate(W / 2, ty); ctx.rotate((-2 * Math.PI) / 180);
  ctx.font = `${story ? 92 : 72}px 'Anton', Impact, sans-serif`; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 14; ctx.strokeStyle = '#14111a'; ctx.strokeText('NOVA FIGURINHA!', 0, 0); ctx.fillStyle = t.realce === '#c4182c' || t.realce === '#e9b824' || t.realce === '#ffe94d' || t.realce === '#d9a63c' ? '#fbf6ea' : t.tinta; ctx.fillText('NOVA FIGURINHA!', 0, 0); ctx.restore();
  // figurinha
  const cw = story ? 790 : 620, ch = (cw * H2) / W2, cx = W / 2, cy = story ? H * 0.52 : H * 0.5 + 8;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate((-3.2 * Math.PI) / 180);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 38; ctx.shadowOffsetY = 20; ctx.drawImage(carta, -cw / 2, -ch / 2, cw, ch); ctx.shadowColor = 'transparent';
  fita(ctx, -cw / 2 - 26, -ch / 2 - 6, 150, 46, -34, '#e9d9a8'); fita(ctx, cw / 2 - 120, ch / 2 - 40, 150, 46, -34, '#e9d9a8');
  ctx.restore();
  // rodapé: faixa de papel com o site e a escola
  const fy = story ? H - 360 : H - 190, fh = story ? 190 : 150;
  ctx.save(); ctx.translate(W / 2, fy + fh / 2); ctx.rotate((-1.2 * Math.PI) / 180);
  ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8; ctx.fillStyle = t.faixa;
  const fw = W - 90; ctx.beginPath(); const R = O.rng(7); for (let x = -fw / 2; x <= fw / 2; x += 26) ctx.lineTo(x, -fh / 2 + (R() - 0.5) * 8); for (let y = -fh / 2; y <= fh / 2; y += 26) ctx.lineTo(fw / 2 + (R() - 0.5) * 8, y); for (let x = fw / 2; x >= -fw / 2; x -= 26) ctx.lineTo(x, fh / 2 + (R() - 0.5) * 8); for (let y = fh / 2; y >= -fh / 2; y -= 26) ctx.lineTo(-fw / 2 + (R() - 0.5) * 8, y); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.textAlign = 'center'; ctx.fillStyle = '#17224a'; let fs = story ? 70 : 64; ctx.font = `${fs}px 'Anton', Impact, sans-serif`; while (ctx.measureText(SITE).width > fw - 70) { fs -= 2; ctx.font = `${fs}px 'Anton', Impact, sans-serif`; }
  ctx.fillText(SITE, 0, -fh * 0.06);
  ctx.fillStyle = '#c4182c'; ctx.fillRect(-fw * 0.36, fh * 0.08, fw * 0.72, 4);
  ctx.fillStyle = '#17130f'; ctx.font = `800 ${story ? 34 : 32}px 'Hanken Grotesk', sans-serif`; ctx.fillText(`— ${ESCOLA} —`, 0, fh * 0.34);
  ctx.restore();
  return c;
}

const blob = (c) => new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('png'))), 'image/png'));
export const nomeArquivo = (e, formato) => `${e.codigo}_${String(e.artista_banda || 'figurinha').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').toUpperCase().slice(0, 40)}_${formato}.png`;
/** Gera o PNG do formato pedido. */
export async function gerar(e, formato) { const c = formato === 'carta' ? await cartaCanvas(e, { escala: 3 }) : await postCanvas(e, formato); return blob(c); }
/** Celular: abre a folha de compartilhar (Instagram, WhatsApp, Fotos…). Senão baixa o arquivo. Devolve 'compartilhado' | 'baixado' | 'cancelado'. */
export async function compartilhar(e, formato) {
  const b = await gerar(e, formato), nome = nomeArquivo(e, formato), file = new File([b], nome, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Beaterista' }); return 'compartilhado'; } catch (err) { if (err && err.name === 'AbortError') return 'cancelado'; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nome; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'baixado';
}

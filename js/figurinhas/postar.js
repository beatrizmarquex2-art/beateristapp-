// Baixar / compartilhar a figurinha: gera o PNG no próprio aparelho (nada sobe pra servidor).
//   carta: a figurinha sozinha (1080 x 1425, cantos transparentes)
//   post : feed do Instagram (1080 x 1350, 4:5)        story: 1080 x 1920 (9:16, com folga em cima e embaixo)
// Formato 'perfil': a própria figurinha (1080 x 1425) sobre um fundo à escolha (prata, branco, preto, rosa, vermelho, creme, azul ou transparente).
// Quatro modelos de post: colagem (a de sempre, muda de cor pela raridade), palco (neon), retrô (anos 70) e limpo.
// A frase do título vem de e.tituloPost (padrão 'NOVA FIGURINHA!').
// A figurinha também pode ser feita pelo aluno: { modelo2, artista_banda: nome, fotoImg, ajuste: {zoom, ox, oy} } (aba Perfil).
import * as O from './ornaments.js';
import { MODELOS2 } from './modelos2-data.js';
import { planoFoto, fitLabel, janelaLocal, W2, H2 } from './card2.js';

export const SITE = 'jogos.beaterista.com.br', ESCOLA = 'beaterista escola de música';
export const FORMATOS = { carta: [1080, 1425], post: [1080, 1350], story: [1080, 1920], perfil: [1080, 1425] };
export const MODELOS_POST = [['colagem', 'Colagem'], ['palco', 'Palco'], ['retro', 'Retrô'], ['limpo', 'Limpo']];
const FONTS = ["40px 'Anton'", "800 24px 'Hanken Grotesk'", "40px 'Gochi Hand'", "40px 'Abril Fatface'"];
const cache = new Map();
const load = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(`imagem: ${src}`)); i.src = src; });
const img = (src) => { if (!cache.has(src)) cache.set(src, load(src).catch((e) => { cache.delete(src); throw e; })); return cache.get(src); };
const svgImg = (svg) => load(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const poly = (ctx, pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };
const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };

/** Desfoque barato que funciona em qualquer navegador (o iPhone não tem ctx.filter): encolhe duas vezes e estica. */
function blurDraw(ctx, im, x, y, w, h) {
  const c = canvas(Math.max(8, Math.round(w / 30)), Math.max(8, Math.round(h / 30))); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
  const c2 = canvas(Math.max(16, Math.round(w / 8)), Math.max(16, Math.round(h / 8))); const g = c2.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, c2.width, c2.height);
  ctx.imageSmoothingQuality = 'high'; ctx.drawImage(c2, x, y, w, h);
}

/** A figurinha desenhada num canvas (mesma conta do cardSVG2: foto no maior zoom que não corta rosto, nome no rótulo). */
export async function cartaCanvas(e, { escala = 3, codigo = false } = {}) {
  await Promise.all(FONTS.map((f) => document.fonts.load(f)));
  const m = MODELOS2[e.modelo2], [tpl, foto] = await Promise.all([img(`assets/figurinhas/modelos2/${e.modelo2}.webp`), e.fotoImg ? Promise.resolve(e.fotoImg) : img(e.foto)]);
  const pw = foto.naturalWidth || foto.width, ph = foto.naturalHeight || foto.height;
  const c = canvas(Math.round(W2 * escala), Math.round(H2 * escala)), ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(tpl, 0, 0, c.width, c.height);
  ctx.save(); ctx.scale(escala, escala);
  let f;
  if (e.ajuste) { // foto da criança: preenche a janela e ela ajusta zoom e posição
    const L = janelaLocal(e.modelo2), bw = L.bb.x1 - L.bb.x0, bh = L.bb.y1 - L.bb.y0, sc = Math.max(bw / pw, bh / ph) * (e.ajuste.zoom || 1);
    f = { w: pw * sc, h: ph * sc, cx: L.cx, cy: L.cy, ang: L.ang, poly: L.poly, cobre: true };
    f.x = (L.bb.x0 + L.bb.x1) / 2 + (e.ajuste.ox || 0) - f.w / 2; f.y = (L.bb.y0 + L.bb.y1) / 2 + (e.ajuste.oy || 0) - f.h / 2;
  } else f = planoFoto({ ...e, largura_px: pw, altura_px: ph }, e.modelo2);
  ctx.translate(f.cx, f.cy); ctx.rotate((f.ang * Math.PI) / 180); ctx.translate(-f.cx, -f.cy); poly(ctx, f.poly); ctx.clip();
  if (!f.cobre) { blurDraw(ctx, foto, f.fundo.x, f.fundo.y, f.fundo.w, f.fundo.h); ctx.fillStyle = 'rgba(12,10,16,.42)'; ctx.fillRect(0, 0, W2, H2); }
  ctx.drawImage(foto, f.x, f.y, f.w, f.h);
  ctx.restore();
  const r = m.rotulo, fit = fitLabel(e.artista_banda || '', r.largura * 0.97), lh = fit.size * 1.05;
  ctx.save(); ctx.scale(escala, escala); ctx.translate(r.centro[0], r.centro[1]); ctx.rotate((r.angulo * Math.PI) / 180);
  ctx.font = `${fit.size}px 'Anton', Impact, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = r.escuro ? '#17130f' : '#f1e3c6';
  fit.lines.forEach((l, i) => ctx.fillText(l, 0, (i - (fit.lines.length - 1) / 2) * lh + fit.size * 0.36));
  ctx.restore();
  if (codigo && e.codigo) {
    const t = `${e.codigo}${e.secao === 'Beatlemania' ? ' · BEATLEMANIA' : ''}`; ctx.save(); ctx.scale(escala, escala); ctx.font = "800 9.5px 'Hanken Grotesk', sans-serif";
    const w = ctx.measureText(t).width + 14; ctx.fillStyle = 'rgba(0,0,0,.62)'; rr(ctx, 9, 8, w, 17, 8.5); ctx.fill(); ctx.fillStyle = '#f6ecd5'; ctx.fillText(t, 16, 20); ctx.restore();
  }
  return c;
}

/* ---------- temas e peças comuns ---------- */
const TEMAS = {
  Comum: { bg: '#ecdfc2', grade: true, a: '#c4182c', b: '#17224a', tinta: '#17224a', realce: '#c4182c', faixa: '#fbf4e2', logoClaro: false },
  Rara: { bg: '#5b1424', a: '#c4182c', b: '#14111a', tinta: '#efe2c6', realce: '#e9b824', faixa: '#efe2c6', logoClaro: true },
  Exclusiva: { bg: '#14111a', a: '#5b1424', b: '#d9a63c', tinta: '#efe2c6', realce: '#d9a63c', faixa: '#efe2c6', logoClaro: true },
  Beatlemania: { bg: '#14111a', rays: true, a: '#ff3d81', b: '#35b4ff', tinta: '#fbf6ea', realce: '#ffe94d', faixa: '#fbf6ea', logoClaro: true },
};
export const temaDe = (e) => (e.secao === 'Beatlemania' ? TEMAS.Beatlemania : TEMAS[e.raridade] || TEMAS.Comum);
const SPOTS = [[0.09, 0.3], [0.92, 0.26], [0.07, 0.62], [0.94, 0.58], [0.13, 0.86], [0.88, 0.84]];
function doodles(t, W, H, seed, cor) {
  const r = O.rng(O.hashSeed(seed)); let s = '';
  SPOTS.forEach(([x, y], i) => {
    const k = Math.floor(r() * 4), g = `translate(${(x * W).toFixed(0)} ${(y * H).toFixed(0)}) rotate(${Math.round(r() * 60 - 30)})`;
    const art = [O.star(0, 0, 38, t.realce, '#14111a', 5, -90, i + 2), O.sparkle(0, 0, 34, '#fbf6ea', '#14111a'), `<g transform="scale(.9)">${O.note(cor || '#14111a')}</g>`, `<g transform="scale(.55)">${O.bolt(t.realce, '#14111a', 8)}</g>`][k];
    s += `<g transform="${g}" opacity=".95">${art}</g>`;
  });
  return s;
}
function fundoColagem(t, W, H, seed) {
  let s = `<rect width="${W}" height="${H}" fill="${t.bg}"/>`;
  if (t.rays) {
    const cx = W / 2, cy = H * 0.46, cols = ['#ff3d81', '#ffb02e', '#ffe94d', '#3ddc97', '#35b4ff', '#9b5cff', '#ff7a3d'];
    for (let i = 0; i < 28; i++) { const a1 = (i * 360) / 28, a2 = a1 + 360 / 28, p = (a) => `${(cx + 1800 * Math.cos((a * Math.PI) / 180)).toFixed(1)},${(cy + 1800 * Math.sin((a * Math.PI) / 180)).toFixed(1)}`; s += `<polygon points="${cx},${cy} ${p(a1)} ${p(a2)}" fill="${cols[i % 7]}"/>`; }
    s += `<rect width="${W}" height="${H}" fill="#14111a" opacity=".12"/>`;
  } else {
    if (t.grade) { for (let x = 0; x < W; x += 46) s += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#7f95b8" stroke-opacity=".28" stroke-width="2"/>`; for (let y = 0; y < H; y += 46) s += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#7f95b8" stroke-opacity=".28" stroke-width="2"/>`; }
    s += `<circle cx="${W * 0.05}" cy="${H * 0.08}" r="${W * 0.34}" fill="${t.a}"/><circle cx="${W * 0.98}" cy="${H * 0.93}" r="${W * 0.36}" fill="${t.b}"/>`;
    if (!t.grade) s += `<circle cx="${W * 0.95}" cy="${H * 0.1}" r="${W * 0.16}" fill="${t.b}" opacity=".55"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}${doodles(t, W, H, seed)}</svg>`;
}
const fita = (ctx, x, y, w, h, rot, cor) => { ctx.save(); ctx.translate(x, y); ctx.rotate((rot * Math.PI) / 180); ctx.globalAlpha = 0.88; ctx.fillStyle = cor; ctx.beginPath(); for (let i = 0; i <= 6; i++) ctx.lineTo(i % 2 ? 8 : 0, (h * i) / 6); for (let i = 6; i >= 0; i--) ctx.lineTo(w - (i % 2 ? 8 : 0), (h * i) / 6); ctx.closePath(); ctx.fill(); ctx.restore(); };
async function logoCanvas(claro) {
  const logo = await img('assets/logo-nome.png'), lg = canvas(900, 175), lc = lg.getContext('2d'); lc.drawImage(logo, 0, 0, 900, 257);
  if (claro) { lc.globalCompositeOperation = 'source-in'; lc.fillStyle = '#f6ecd5'; lc.fillRect(0, 0, 900, 175); }
  return lg;
}
const fitText = (ctx, txt, maxW, size, fam) => { let fs = size; ctx.font = `${fs}px ${fam}`; while (ctx.measureText(txt).width > maxW && fs > 18) { fs -= 2; ctx.font = `${fs}px ${fam}`; } return fs; };
const ANTON = "'Anton', Impact, sans-serif", HANKEN = "'Hanken Grotesk', sans-serif";
const titulo = (e, pad = 'NOVA FIGURINHA!') => String(e.tituloPost || pad).toUpperCase();
const geo = (formato) => { const [W, H] = FORMATOS[formato]; return { W, H, story: formato === 'story' }; };

/* ---------- modelo 1: colagem ---------- */
async function desenharColagem(e, formato, carta) {
  const { W, H, story } = geo(formato), t = temaDe(e);
  const [fundo, lg] = await Promise.all([svgImg(fundoColagem(t, W, H, e.codigo || e.artista_banda || 'x')), logoCanvas(t.logoClaro)]);
  const c = canvas(W, H), ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(fundo, 0, 0);
  const lw = story ? 520 : 440, lh = (lw * 175) / 900, ly = story ? 200 : 62; ctx.drawImage(lg, (W - lw) / 2, ly, lw, lh);
  const ty = ly + lh + (story ? 84 : 74);
  const TIT = titulo(e); ctx.save(); ctx.translate(W / 2, ty); ctx.rotate((-2 * Math.PI) / 180); fitText(ctx, TIT, W - 120, story ? 92 : 72, ANTON); ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 14; ctx.strokeStyle = '#14111a'; ctx.strokeText(TIT, 0, 0);
  ctx.fillStyle = ['#c4182c', '#e9b824', '#ffe94d', '#d9a63c'].includes(t.realce) ? '#fbf6ea' : t.tinta; ctx.fillText(TIT, 0, 0); ctx.restore();
  const cw = story ? 790 : 620, ch = (cw * H2) / W2, cy = story ? H * 0.52 : H * 0.5 + 8;
  ctx.save(); ctx.translate(W / 2, cy); ctx.rotate((-3.2 * Math.PI) / 180); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 38; ctx.shadowOffsetY = 20; ctx.drawImage(carta, -cw / 2, -ch / 2, cw, ch); ctx.shadowColor = 'transparent';
  fita(ctx, -cw / 2 - 26, -ch / 2 - 6, 150, 46, -34, '#e9d9a8'); fita(ctx, cw / 2 - 120, ch / 2 - 40, 150, 46, -34, '#e9d9a8'); ctx.restore();
  const fy = story ? H - 360 : H - 190, fh = story ? 190 : 150, fw = W - 90;
  ctx.save(); ctx.translate(W / 2, fy + fh / 2); ctx.rotate((-1.2 * Math.PI) / 180); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8; ctx.fillStyle = t.faixa;
  const R = O.rng(7); ctx.beginPath(); for (let x = -fw / 2; x <= fw / 2; x += 26) ctx.lineTo(x, -fh / 2 + (R() - 0.5) * 8); for (let y = -fh / 2; y <= fh / 2; y += 26) ctx.lineTo(fw / 2 + (R() - 0.5) * 8, y); for (let x = fw / 2; x >= -fw / 2; x -= 26) ctx.lineTo(x, fh / 2 + (R() - 0.5) * 8); for (let y = fh / 2; y >= -fh / 2; y -= 26) ctx.lineTo(-fw / 2 + (R() - 0.5) * 8, y);
  ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.textAlign = 'center';
  ctx.fillStyle = '#17224a'; fitText(ctx, SITE, fw - 70, story ? 70 : 64, ANTON); ctx.fillText(SITE, 0, -fh * 0.06);
  ctx.fillStyle = '#c4182c'; ctx.fillRect(-fw * 0.36, fh * 0.08, fw * 0.72, 4);
  ctx.fillStyle = '#17130f'; ctx.font = `800 ${story ? 34 : 32}px ${HANKEN}`; ctx.fillText(`— ${ESCOLA} —`, 0, fh * 0.34); ctx.restore();
  return c;
}

/* ---------- modelo 2: palco (neon) ---------- */
async function desenharPalco(e, formato, carta) {
  const { W, H, story } = geo(formato), lg = await logoCanvas(true), c = canvas(W, H), ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high';
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120d24'); g.addColorStop(0.6, '#0b0916'); g.addColorStop(1, '#060510'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  [[0.15, '#ff3d81'], [0.5, '#ffe94d'], [0.85, '#35b4ff']].forEach(([x, cor]) => { // refletores
    const gr = ctx.createLinearGradient(W * x, 0, W * x, H * 0.75); gr.addColorStop(0, `${cor}66`); gr.addColorStop(1, `${cor}00`); ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(W * x - 26, -10); ctx.lineTo(W * x + 26, -10); ctx.lineTo(W * (x + (x < 0.4 ? 0.3 : x > 0.6 ? -0.3 : 0)) + 230, H * 0.78); ctx.lineTo(W * (x + (x < 0.4 ? 0.3 : x > 0.6 ? -0.3 : 0)) - 230, H * 0.78); ctx.closePath(); ctx.fill();
  });
  ctx.fillStyle = '#ffffff18'; const baseY = story ? H - 600 : H - 430; // pontilhado (halftone)
  for (let y = baseY; y < H; y += 30) for (let x = ((y / 30) % 2) * 15; x < W; x += 30) { const r = Math.max(0.5, ((y - baseY) / (H - baseY)) * 9); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
  const lw = story ? 480 : 400, lh = (lw * 175) / 900, ly = story ? 210 : 70; ctx.drawImage(lg, (W - lw) / 2, ly, lw, lh);
  const ty = ly + lh + (story ? 100 : 80);
  const TIT = titulo(e); ctx.save(); ctx.textAlign = 'center'; fitText(ctx, TIT, W - 120, story ? 96 : 78, ANTON); ctx.shadowColor = '#ff3d81'; ctx.shadowBlur = 36; ctx.fillStyle = '#ffe94d'; ctx.fillText(TIT, W / 2, ty); ctx.shadowBlur = 0; ctx.lineWidth = 3; ctx.strokeStyle = '#fff7c8'; ctx.strokeText(TIT, W / 2, ty); ctx.restore();
  const cw = story ? 740 : 600, ch = (cw * H2) / W2, cy = story ? H * 0.5 + 40 : H * 0.5 + 14;
  ctx.save(); ctx.translate(W / 2, cy); ctx.shadowColor = '#35b4ff'; ctx.shadowBlur = 70; ctx.drawImage(carta, -cw / 2, -ch / 2, cw, ch); ctx.shadowColor = '#ff3d81'; ctx.shadowBlur = 50; ctx.drawImage(carta, -cw / 2, -ch / 2, cw, ch); ctx.restore();
  const fw = W - 120, fh = story ? 190 : 150, fy = story ? H - 360 : H - 196;
  ctx.save(); ctx.fillStyle = 'rgba(14,10,30,.88)'; rr(ctx, 60, fy, fw, fh, 36); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#ffe94d'; ctx.shadowColor = '#ffe94d'; ctx.shadowBlur = 18; ctx.stroke(); ctx.shadowBlur = 0; ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe94d'; fitText(ctx, SITE, fw - 80, story ? 68 : 62, ANTON); ctx.fillText(SITE, W / 2, fy + fh * 0.5); ctx.fillStyle = '#efe2c6'; ctx.font = `800 ${story ? 32 : 30}px ${HANKEN}`; ctx.fillText(`— ${ESCOLA} —`, W / 2, fy + fh * 0.8); ctx.restore();
  return c;
}

/* ---------- modelo 3: retrô (anos 70) ---------- */
async function desenharRetro(e, formato, carta) {
  const { W, H, story } = geo(formato), c = canvas(W, H), ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#f3e6c8'; ctx.fillRect(0, 0, W, H);
  const cx0 = W * 1.02, cy0 = H * 1.0; ['#17224a', '#c4182c', '#e9701f', '#e9b824', '#f3e6c8'].forEach((cor, i) => { ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(cx0, cy0, H * (0.62 - i * 0.075), 0, 7); ctx.fill(); });
  ctx.fillStyle = '#e9b824'; ctx.beginPath(); ctx.arc(-W * 0.02, H * 0.2, W * 0.17, 0, 7); ctx.fill(); ctx.fillStyle = '#e9701f'; ctx.beginPath(); ctx.arc(-W * 0.02, H * 0.2, W * 0.11, 0, 7); ctx.fill();
  const sy = story ? H * 0.49 : H * 0.47; ctx.fillStyle = '#fff1c4'; ctx.beginPath(); ctx.arc(W / 2, sy, W * 0.43, 0, 7); ctx.fill(); // sol atrás da figurinha
  const lw = story ? 470 : 380, lh = (lw * 175) / 900, ly = story ? 205 : 56, lg = await logoCanvas(false); ctx.drawImage(lg, (W - lw) / 2, ly, lw, lh);
  const ty = ly + lh + (story ? 92 : 76); const TIT = e.tituloPost || 'Nova figurinha!'; ctx.save(); ctx.textAlign = 'center'; fitText(ctx, TIT, W - 120, story ? 100 : 82, "'Abril Fatface', " + ANTON); ctx.fillStyle = '#c4182c'; ctx.fillText(TIT, W / 2 + 5, ty + 5); ctx.fillStyle = '#17224a'; ctx.fillText(TIT, W / 2, ty); ctx.restore();
  const cw = story ? 700 : 560, ch = (cw * H2) / W2, cy = sy + (story ? 30 : 36);
  ctx.save(); ctx.translate(W / 2, cy); ctx.shadowColor = 'rgba(23,34,74,.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18; ctx.fillStyle = '#fbf4e2'; rr(ctx, -cw / 2 - 22, -ch / 2 - 22, cw + 44, ch + 44, 40); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.drawImage(carta, -cw / 2, -ch / 2, cw, ch); ctx.restore();
  const fw = W - 100, fh = story ? 190 : 150, fy = story ? H - 360 : H - 190;
  ctx.save(); ctx.fillStyle = '#17224a'; ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8; rr(ctx, 50, fy, fw, fh, 30); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.fillStyle = '#e9b824'; ctx.fillRect(50, fy + fh - 22, fw, 8); ctx.fillStyle = '#c4182c'; ctx.fillRect(50, fy + fh - 12, fw, 8); ctx.textAlign = 'center';
  ctx.fillStyle = '#fbf4e2'; fitText(ctx, SITE, fw - 80, story ? 68 : 62, ANTON); ctx.fillText(SITE, W / 2, fy + fh * 0.5); ctx.fillStyle = '#e9b824'; ctx.font = `800 ${story ? 32 : 30}px ${HANKEN}`; ctx.fillText(`— ${ESCOLA} —`, W / 2, fy + fh * 0.74); ctx.restore();
  return c;
}

/* ---------- modelo 4: limpo ---------- */
async function desenharLimpo(e, formato, carta) {
  const { W, H, story } = geo(formato), t = temaDe(e), c = canvas(W, H), ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high';
  const claro = !t.logoClaro; ctx.fillStyle = t.rays ? '#14111a' : t.bg; ctx.fillRect(0, 0, W, H);
  const gr = ctx.createRadialGradient(W / 2, H * 0.48, 80, W / 2, H * 0.48, W * 0.8); gr.addColorStop(0, claro ? '#ffffff55' : '#ffffff22'); gr.addColorStop(1, '#00000000'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  const ink = claro ? '#17224a' : '#f1e6cf';
  ctx.textAlign = 'center'; ctx.fillStyle = ink; ctx.font = `800 ${story ? 36 : 32}px ${HANKEN}`; ctx.save(); ctx.letterSpacing = '12px'; ctx.fillText((e.tituloPost || 'NOVA FIGURINHA NO ÁLBUM').toUpperCase(), W / 2 + 6, story ? 250 : 120); ctx.restore();
  ctx.fillStyle = t.realce; ctx.fillRect(W / 2 - 70, story ? 280 : 148, 140, 6);
  const cw = story ? 780 : 640, ch = (cw * H2) / W2, cy = story ? H * 0.5 + 10 : H * 0.5 + 6;
  ctx.save(); ctx.translate(W / 2, cy); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 26; ctx.drawImage(carta, -cw / 2, -ch / 2, cw, ch); ctx.restore();
  const by = story ? H - 330 : H - 150; ctx.fillStyle = ink; fitText(ctx, SITE, W - 140, story ? 74 : 66, ANTON); ctx.fillText(SITE, W / 2, by); ctx.fillStyle = t.realce; ctx.font = `800 ${story ? 32 : 28}px ${HANKEN}`; ctx.fillText(ESCOLA.toUpperCase(), W / 2, by + (story ? 56 : 50));
  const lg = await logoCanvas(!claro), lw = 260, lh = (lw * 175) / 900; ctx.globalAlpha = 0.9; ctx.drawImage(lg, (W - lw) / 2, by + (story ? 86 : 74), lw, lh); ctx.globalAlpha = 1;
  return c;
}

/* ---------- foto de perfil: a própria figurinha (formato de cartinha, não redondo) sobre um fundo à escolha ---------- */
export const FUNDOS_PERFIL = [['prata', 'prata'], ['branco', 'branco'], ['preto', 'preto'], ['rosa', 'rosa'], ['vermelho', 'vermelho'], ['creme', 'creme'], ['azul', 'azul'], ['nenhum', 'sem fundo']];
function pintaFundoPerfil(ctx, W, H, k) {
  if (k === 'nenhum') return;
  if (k === 'prata') { // metal escovado: degradê diagonal com reflexos
    const g = ctx.createLinearGradient(0, 0, W, H); [[0, '#f7f8fb'], [0.22, '#b9bfcb'], [0.45, '#eef0f5'], [0.68, '#9aa1b0'], [1, '#e9ecf2']].forEach(([o, c]) => g.addColorStop(o, c)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.14; ctx.fillStyle = '#fff'; for (let i = -H; i < W; i += 34) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 14, 0); ctx.lineTo(i + 14 + H * 0.5, H); ctx.lineTo(i + H * 0.5, H); ctx.fill(); } ctx.globalAlpha = 1; return;
  }
  const cor = { branco: '#ffffff', preto: '#101014', rosa: '#ff9ec7', vermelho: '#c4182c', creme: '#ecdfc2', azul: '#17224a' }[k] || '#ffffff';
  ctx.fillStyle = cor; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H * 0.45, 40, W / 2, H * 0.45, Math.hypot(W, H) * 0.6); g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(0,0,0,.18)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
async function desenharPerfil(e, formato, carta) {
  const { W, H } = geo('perfil'), c = canvas(W, H), ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high';
  pintaFundoPerfil(ctx, W, H, e.fundoPerfil || 'prata');
  const cw = W * 0.86, ch = (cw * H2) / W2; // a cartinha inteira, com margem pro fundo aparecer
  ctx.save(); ctx.translate(W / 2, H / 2); if (e.fundoPerfil !== 'nenhum') { ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; } ctx.drawImage(carta, -cw / 2, -ch / 2, cw, ch); ctx.restore();
  return c;
}
/** Mockup de como a figurinha fica de foto de perfil (no formato da cartinha, não redondo). */
export function mockupPerfil(canvasCarta, nome) {
  const W = 600, H = 600, c = canvas(W, H), ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#f2f2f4'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; rr(ctx, 40, 40, W - 80, H - 80, 36); ctx.fill();
  const aw = 128, ah = Math.round((aw * canvasCarta.height) / canvasCarta.width);
  ctx.save(); rr(ctx, 76, 84, aw, ah, 16); ctx.clip(); ctx.drawImage(canvasCarta, 76, 84, aw, ah); ctx.restore(); ctx.lineWidth = 4; ctx.strokeStyle = '#d6336c'; rr(ctx, 74, 82, aw + 4, ah + 4, 18); ctx.stroke();
  ctx.textAlign = 'left'; ctx.fillStyle = '#16161a'; ctx.font = "800 34px 'Hanken Grotesk', sans-serif"; ctx.fillText(String(nome || 'seu nome').slice(0, 18), 232, 128);
  ctx.fillStyle = '#8a8a93'; ctx.font = "600 22px 'Hanken Grotesk', sans-serif"; ctx.fillText('aluno(a) · Beaterista', 232, 166);
  [['12', 'posts'], ['345', 'seguidores'], ['98', 'seguindo']].forEach(([a, b], i) => { ctx.fillStyle = '#16161a'; ctx.font = "800 30px 'Hanken Grotesk', sans-serif"; ctx.fillText(a, 232 + i * 112, 222); ctx.fillStyle = '#8a8a93'; ctx.font = "600 17px 'Hanken Grotesk', sans-serif"; ctx.fillText(b, 232 + i * 112, 246); });
  ctx.fillStyle = '#ececef'; rr(ctx, 80, 84 + ah + 22, W - 160, 52, 16); ctx.fill(); ctx.fillStyle = '#16161a'; ctx.font = "800 22px 'Hanken Grotesk', sans-serif"; ctx.textAlign = 'center'; ctx.fillText('Editar perfil', W / 2, 84 + ah + 56);
  for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#ffd6e6', '#ffe9c2', '#d6e6ff'][i]; rr(ctx, 80 + i * 142, 84 + ah + 96, 128, 110, 14); ctx.fill(); }
  return c;
}
const DESENHOS = { colagem: desenharColagem, palco: desenharPalco, retro: desenharRetro, limpo: desenharLimpo };

/** Post (4:5) ou story (9:16) no modelo escolhido. */
export async function postCanvas(e, formato = 'post', modelo = 'colagem') {
  const carta = await cartaCanvas(e, { escala: 3 }); return (DESENHOS[modelo] || desenharColagem)(e, formato, carta);
}
const blob = (c) => new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('png'))), 'image/png'));
export const nomeArquivo = (e, formato, modelo = 'colagem') => `${e.codigo || 'MINHA'}_${String(e.artista_banda || 'figurinha').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').toUpperCase().slice(0, 40)}_${formato}${formato === 'carta' || formato === 'perfil' || modelo === 'colagem' ? '' : `_${modelo}`}.png`;
/** Canvas do formato/modelo pedido (formato 'carta' = só a figurinha). */
export async function desenhar(e, formato, modelo) {
  if (formato === 'carta') return cartaCanvas(e, { escala: 3 });
  if (formato === 'perfil') return desenharPerfil(e, formato, await cartaCanvas(e, { escala: 3 }));
  return postCanvas(e, formato, modelo);
}
export async function gerar(e, formato, modelo) { return blob(await desenhar(e, formato, modelo)); }
/** Celular: abre a folha de compartilhar (Instagram, WhatsApp, Fotos…). Senão baixa o arquivo. Devolve 'compartilhado' | 'baixado' | 'cancelado'. */
export async function compartilhar(e, formato, modelo = 'colagem') {
  const b = await gerar(e, formato, modelo), nome = nomeArquivo(e, formato, modelo), file = new File([b], nome, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Beaterista' }); return 'compartilhado'; } catch (err) { if (err && err.name === 'AbortError') return 'cancelado'; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nome; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'baixado';
}

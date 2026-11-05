// Baixar / compartilhar a figurinha: gera o PNG no próprio aparelho (nada sobe pra servidor).
//   carta: a figurinha sozinha (1080 x 1425, cantos transparentes)
//   post : feed do Instagram (1080 x 1350, 4:5)        story: 1080 x 1920 (9:16, com folga em cima e embaixo)
// Cinco modelos de post: colagem (a de sempre, muda de cor pela raridade), palco (neon), retrô (anos 70), limpo e épico (dourado com raios).
// A frase do título vem de e.tituloPost (padrão 'NOVA FIGURINHA!'; no épico, 'CARTA ÉPICA').
// A figurinha também pode ser feita pelo aluno: { modelo2, artista_banda: nome, fotoImg, ajuste: {zoom, ox, oy} } (aba Perfil).
import * as O from './ornaments.js';
import { MODELOS2 } from './modelos2-data.js';
import { planoFoto, fitLabel, janelaLocal, W2, H2 } from './card2.js';

export const SITE = 'jogos.beaterista.com.br', ESCOLA = 'beaterista escola de música';
export const FORMATOS = { carta: [1080, 1425], post: [1080, 1350], story: [1080, 1920] };
export const MODELOS_POST = [['colagem', 'Colagem'], ['palco', 'Palco'], ['retro', 'Retrô'], ['limpo', 'Limpo'], ['epico', 'Épico']];
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

/** Adesivo com borda branca (estilo sticker de celular): silhueta branca espalhada em volta + sombra + o desenho. */
function adesivo(ctx, im, x, y, w, rot, plano = false) {
  const h = (w * im.naturalHeight) / im.naturalWidth, b = Math.max(5, w * (plano ? 0.03 : 0.045)), sil = canvas(Math.ceil(w + b * 4), Math.ceil(h + b * 4)), sc = sil.getContext('2d');
  sc.drawImage(im, b * 2, b * 2, w, h); sc.globalCompositeOperation = 'source-in'; sc.fillStyle = '#fff'; sc.fillRect(0, 0, sil.width, sil.height);
  ctx.save(); ctx.translate(x, y); ctx.rotate((rot * Math.PI) / 180); ctx.shadowColor = plano ? 'rgba(0,0,0,.28)' : 'rgba(0,0,0,.45)'; ctx.shadowBlur = plano ? 6 : 24; ctx.shadowOffsetY = plano ? 3 : 12;
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; ctx.drawImage(sil, -sil.width / 2 + Math.cos(a) * b, -sil.height / 2 + Math.sin(a) * b); }
  ctx.shadowColor = 'transparent'; ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore();
}
const ADESIVOS = ['carinha', 'coracao', 'estrela'];
const adesivos = () => Promise.all(ADESIVOS.map((n) => img(`assets/figurinhas/adesivos/${n}.webp`)));

/* ---------- modelo 5: épico (raios, luz, brilhos) com paleta dourada ou rosa e vermelho ---------- */
const PALETAS = {
  dourado: { centro: '#6a3a08', meio: '#3a1a06', borda: '#150a0e', fim: '#050308', raio: '255,214,102', raio2: '255,170,40', halo: '255,226,140', glow: '#ffb020', glow2: '#ffe08a', glint: '#fff3c4', bokeh: ['255,200,90', '255,160,40', '255,236,170'],
    metal: ['#fff0b0', '#d9a63c', '#8a5a12', '#f6d77a'], titulo: ['#fff7d0', '#f4c64e', '#a8680f'], contorno: '#2a1204', placa: 'rgba(14,8,6,.92)', site: '#f6d77a', tinta: '#efe2c6', enfeite: '#ffd566' },
  rosa: { centro: '#a3124d', meio: '#52092b', borda: '#1c0510', fim: '#07020a', raio: '255,110,170', raio2: '255,45,80', halo: '255,150,196', glow: '#ff2f7d', glow2: '#ff9ec7', glint: '#ffe3f0', bokeh: ['255,95,160', '255,50,90', '255,190,215'],
    metal: ['#ffe3ee', '#ff6aa6', '#c4182c', '#ffb4d2'], titulo: ['#ffffff', '#ff9ec7', '#e11d5a'], contorno: '#3a0618', placa: 'rgba(30,5,16,.92)', site: '#ffc2dc', tinta: '#ffe9f2', enfeite: '#ff8fbd' },
};
const TITULOS = { dourado: ['#fff7d0', '#f4c64e', '#a8680f'], prata: ['#ffffff', '#cfd5e2', '#7b8396'] };
async function desenharEpico(e, formato, carta) {
  const { W, H, story } = geo(formato), plano = e.tema === 'rosa', P = PALETAS[e.tema] || PALETAS.dourado, [lg, stk] = await Promise.all([logoCanvas(true), e.tema === 'rosa' ? adesivos() : Promise.resolve(null)]), c = canvas(W, H), ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high';
  const cx = W / 2, cy = story ? H * 0.52 : H * 0.5, R = O.rng(O.hashSeed(`${e.artista_banda || 'epico'}${e.tema || ''}`)), diag = Math.hypot(W, H);
  const bg = ctx.createRadialGradient(cx, cy, 30, cx, cy, diag * 0.62); bg.addColorStop(0, P.centro); bg.addColorStop(0.24, P.meio); bg.addColorStop(0.58, P.borda); bg.addColorStop(1, P.fim); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // duas camadas de raios girando em sentidos diferentes (mais profundidade)
  [[44, 0.03, 0.62, P.raio, 0.5, 1], [28, 0.08, 0.35, P.raio2, 0.34, -1]].forEach(([n, off, larg, cor, alfa, sentido]) => {
    ctx.save(); ctx.translate(cx, cy);
    for (let i = 0; i < n; i++) { const a = sentido * ((i * Math.PI * 2) / n + off), b2 = a + sentido * (Math.PI / n) * (larg + (i % 3) * 0.1), r = diag; const g = ctx.createLinearGradient(0, 0, Math.cos(a) * r, Math.sin(a) * r);
      g.addColorStop(0, `rgba(${cor},${alfa})`); g.addColorStop(0.55, `rgba(${cor},${alfa * 0.28})`); g.addColorStop(1, `rgba(${cor},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(b2) * r, Math.sin(b2) * r); ctx.closePath(); ctx.fill(); }
    ctx.restore(); });
  const halo = ctx.createRadialGradient(cx, cy, 10, cx, cy, W * 0.66); halo.addColorStop(0, `rgba(${P.halo},.6)`); halo.addColorStop(0.45, `rgba(${P.raio2},.2)`); halo.addColorStop(1, `rgba(${P.raio2},0)`); ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);
  // bokeh: bolas de luz desfocadas em volta
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) { const x = R() * W, y = R() * H, r = 26 + R() * 90, cor = P.bokeh[i % 3]; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${cor},${0.16 + R() * 0.16})`); g.addColorStop(0.7, `rgba(${cor},${0.07})`); g.addColorStop(1, `rgba(${cor},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
  ctx.globalCompositeOperation = 'source-over';
  // brasas
  for (let i = 0; i < 110; i++) { const x = R() * W, y = R() * H, r = 1.4 + R() * 5, a = 0.25 + R() * 0.7; ctx.fillStyle = `rgba(${P.bokeh[i % 3]},${a})`; ctx.shadowColor = P.glow; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); } ctx.shadowBlur = 0;
  // brilhos de 4 pontas (glints)
  const glint = (x, y, r, rot) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = P.glint; ctx.shadowColor = P.glow2; ctx.shadowBlur = 26; ctx.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.14 : r, a = (i * Math.PI) / 4; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.restore(); };
  [[0.11, 0.26, 50], [0.91, 0.3, 38], [0.08, 0.6, 32], [0.93, 0.66, 54], [0.15, 0.87, 40], [0.85, 0.91, 32], [0.5, 0.135, 26]].forEach(([x, y, r], i) => glint(x * W, y * H, r, i * 0.4));
  // vinheta
  const vg = ctx.createRadialGradient(cx, cy, W * 0.42, cx, cy, diag * 0.58); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.72)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  // moldura de metal (dupla) com cantos
  const metal = ctx.createLinearGradient(0, 0, W, H); P.metal.forEach((cor, i) => metal.addColorStop(i / (P.metal.length - 1), cor));
  ctx.lineWidth = 12; ctx.strokeStyle = metal; rr(ctx, 26, 26, W - 52, H - 52, 44); ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = `rgba(${P.halo},.7)`; rr(ctx, 46, 46, W - 92, H - 92, 32); ctx.stroke();
  [[60, 60, 1, 1], [W - 60, 60, -1, 1], [60, H - 60, 1, -1], [W - 60, H - 60, -1, -1]].forEach(([x, y, sx, sy]) => { ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy); ctx.strokeStyle = metal; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 56); ctx.quadraticCurveTo(0, 0, 56, 0); ctx.stroke(); ctx.fillStyle = P.glint; ctx.beginPath(); ctx.arc(10, 10, 6, 0, 7); ctx.fill(); ctx.restore(); });
  // logo + título em faixa
  const lw = story ? 500 : 410, lh = (lw * 175) / 900, ly = story ? 132 : 66; ctx.drawImage(lg, (W - lw) / 2, ly, lw, lh);
  const TIT = titulo(e, 'CARTA ÉPICA'), ty = ly + lh + (story ? 176 : 132);
  ctx.save(); ctx.textAlign = 'center'; const fs = fitText(ctx, TIT, W - 170, story ? 150 : 118, ANTON); const gr = ctx.createLinearGradient(0, ty - fs * 0.85, 0, ty + 6); const TC = e.tituloCor && TITULOS[e.tituloCor] ? TITULOS[e.tituloCor] : (e.tema === 'rosa' ? TITULOS.dourado : P.titulo); gr.addColorStop(0, TC[0]); gr.addColorStop(0.5, TC[1]); gr.addColorStop(1, TC[2]);
  ctx.shadowColor = P.glow; ctx.shadowBlur = plano ? 22 : 54; ctx.lineWidth = plano ? 16 : 20; ctx.lineJoin = 'round'; ctx.strokeStyle = P.contorno; ctx.strokeText(TIT, W / 2, ty); ctx.shadowBlur = 0; ctx.fillStyle = gr; ctx.fillText(TIT, W / 2, ty);
  ctx.globalCompositeOperation = 'lighter'; const re = ctx.createLinearGradient(W / 2 - 300, 0, W / 2 + 300, 0); re.addColorStop(0.4, 'rgba(255,255,255,0)'); re.addColorStop(0.5, 'rgba(255,255,255,.28)'); re.addColorStop(0.6, 'rgba(255,255,255,0)'); ctx.fillStyle = re; ctx.fillText(TIT, W / 2, ty); ctx.restore();
  // ornamento sob o título: linha com estrela no meio
  const oy = ty + (story ? 46 : 38); ctx.save(); ctx.strokeStyle = metal; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(W / 2 - 250, oy); ctx.lineTo(W / 2 - 40, oy); ctx.moveTo(W / 2 + 40, oy); ctx.lineTo(W / 2 + 250, oy); ctx.stroke(); glint(W / 2, oy, 22, 0); ctx.restore();
  // cartinha com aura, sombra no chão e brilho passando
  const cw = story ? 760 : 590, ch = (cw * H2) / W2, cyc = story ? H * 0.52 + 52 : H * 0.5 + 40;
  ctx.save(); ctx.translate(cx, cyc + ch / 2 + 26); ctx.scale(1, 0.12); const chao = ctx.createRadialGradient(0, 0, 10, 0, 0, cw * 0.55); chao.addColorStop(0, 'rgba(0,0,0,.6)'); chao.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = chao; ctx.beginPath(); ctx.arc(0, 0, cw * 0.55, 0, 7); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(cx, cyc); ctx.rotate(((plano ? 0 : -1.6) * Math.PI) / 180); ctx.shadowColor = P.glow; ctx.shadowBlur = plano ? 46 : 120; ctx.drawImage(carta, -cw / 2, -ch / 2, cw, ch); ctx.shadowColor = P.glow2; ctx.shadowBlur = plano ? 8 : 36; ctx.drawImage(carta, -cw / 2, -ch / 2, cw, ch); ctx.shadowColor = 'transparent';
  const brilho = ctx.createLinearGradient(-cw / 2, -ch / 2, cw / 2, ch / 2); brilho.addColorStop(0.36, 'rgba(255,255,255,0)'); brilho.addColorStop(0.5, plano ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.3)'); brilho.addColorStop(0.64, 'rgba(255,255,255,0)'); ctx.fillStyle = brilho; rr(ctx, -cw / 2, -ch / 2, cw, ch, 28); ctx.fill();
  if (!plano) { glint(-cw / 2 + 24, -ch / 2 + 24, 44, 0.3); glint(cw / 2 - 20, ch / 2 - 40, 34, 0.7); } ctx.restore();
  // adesivos (tema rosa): carinha apaixonada, corações e estrelas colados em volta da cartinha
  if (stk) { const [car, cor, est] = stk, L = cx - cw / 2, Rr = cx + cw / 2, T = cyc - ch / 2, B = cyc + ch / 2;
    adesivo(ctx, est, L + 10, T + 34, cw * 0.15, -12, true); adesivo(ctx, car, Rr - 10, T + 18, cw * 0.17, 8, true); adesivo(ctx, cor, L + 14, B - 62, cw * 0.17, -10, true); adesivo(ctx, est, Rr - 6, B - 70, cw * 0.1, 14, true); }
  // rodapé em placa com moldura de metal
  const fw = W - 130, fh = story ? 190 : 150, fy = story ? H - 360 : H - 200;
  ctx.save(); ctx.fillStyle = P.placa; rr(ctx, 65, fy, fw, fh, 34); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = metal; ctx.shadowColor = P.glow; ctx.shadowBlur = 26; ctx.stroke(); ctx.shadowBlur = 0; ctx.textAlign = 'center';
  ctx.fillStyle = P.site; fitText(ctx, SITE, fw - 80, story ? 66 : 60, ANTON); ctx.fillText(SITE, W / 2, fy + fh * 0.5); ctx.fillStyle = P.tinta; ctx.font = `800 ${story ? 32 : 28}px ${HANKEN}`; ctx.fillText(`— ${ESCOLA} —`, W / 2, fy + fh * 0.8); ctx.restore();
  // grão de filme por cima (dá cara de foto de capa, esconde faixas de gradiente)
  const gran = canvas(256, 256), gc = gran.getContext('2d'), id = gc.createImageData(256, 256), RG = O.rng(11); for (let i = 0; i < id.data.length; i += 4) { const v = 120 + Math.floor(RG() * 135); id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 22; } gc.putImageData(id, 0, 0);
  ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = ctx.createPattern(gran, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
  return c;
}
const DESENHOS = { colagem: desenharColagem, palco: desenharPalco, retro: desenharRetro, limpo: desenharLimpo, epico: desenharEpico };

/** Post (4:5) ou story (9:16) no modelo escolhido. */
export async function postCanvas(e, formato = 'post', modelo = 'colagem') {
  const carta = await cartaCanvas(e, { escala: 3 }); return (DESENHOS[modelo] || desenharColagem)(e, formato, carta);
}
const blob = (c) => new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('png'))), 'image/png'));
export const nomeArquivo = (e, formato, modelo = 'colagem') => `${e.codigo || 'MINHA'}_${String(e.artista_banda || 'figurinha').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').toUpperCase().slice(0, 40)}_${formato}${formato === 'carta' || modelo === 'colagem' ? '' : `_${modelo}`}.png`;
/** Canvas do formato/modelo pedido (formato 'carta' = só a figurinha). */
export const desenhar = (e, formato, modelo) => (formato === 'carta' ? cartaCanvas(e, { escala: 3 }) : postCanvas(e, formato, modelo));
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

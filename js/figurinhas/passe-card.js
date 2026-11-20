// Cartão do meu passe pra postar (opção B "palco à noite", escolha da Bea): imagem 1080×1350 (post) ou 1080×1920 (story) com a foto de perfil
// (ou o Paul que a pessoa escolheu), o nome, instrumento · estilo · meta, até 6 favoritos e a marca do Robôterista Paul com o endereço.
// Gera o PNG no próprio aparelho: nada sobe pra servidor, e a foto é a que a pessoa escolheu no Perfil.
import { SITE, ESCOLA } from './postar.js';
import { FORMATOS } from './estrelas-card.js';

const ANTON = "'Anton', Impact, sans-serif", HANKEN = "'Hanken Grotesk', system-ui, sans-serif";
const GOLD = '#f2a91b', CREME = '#fff7e6';
const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
const loadBlob = (b) => new Promise((ok) => { if (!b) return ok(null); const u = URL.createObjectURL(b); const i = new Image(); i.onload = () => { URL.revokeObjectURL(u); ok(i); }; i.onerror = () => { URL.revokeObjectURL(u); ok(null); }; i.src = u; });
const fontes = async () => { try { await Promise.all([document.fonts.load(`40px ${ANTON}`), document.fonts.load(`800 24px ${HANKEN}`), document.fonts.load(`700 24px ${HANKEN}`)]); } catch { /* usa a fonte reserva */ } };
const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); };
const fit = (ctx, txt, maxW, size, fam, peso = '') => { let fs = size; ctx.font = `${peso} ${fs}px ${fam}`; while (ctx.measureText(txt).width > maxW && fs > 18) { fs -= 2; ctx.font = `${peso} ${fs}px ${fam}`; } return fs; };
/** Desenha `img` cobrindo o círculo (cx, cy, r), com o foco em (fx, fy) de 0 a 1 (onde fica o rosto). */
function circulo(ctx, img, cx, cy, r, fx = 0.5, fy = 0.35) {
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  if (img) { const s = Math.max((2 * r) / img.width, (2 * r) / img.height); const w = img.width * s, h = img.height * s; const x = cx - r - Math.max(0, Math.min(w - 2 * r, fx * w - r)), y = cy - r - Math.max(0, Math.min(h - 2 * r, fy * h - r)); ctx.drawImage(img, x, y, w, h); }
  else { ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fill(); }
  ctx.restore();
}

/** `foto`: Blob da foto de perfil (ou null = o Paul). `sobre`: { i, e, m } (instrumento, estilo, meta; '' = vazio). `favs`: [{ nome, foto, rosto }] (até 6). */
export async function desenhar({ nome = '', foto = null, sobre = {}, favs = [], formato = 'story' } = {}) {
  await fontes(); const [W, H] = FORMATOS[formato] || FORMATOS.story; const story = formato === 'story';
  const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d');
  // fundo "palco à noite": azul com luz no meio e escuro nas bordas
  const bg = ctx.createRadialGradient(W / 2, story ? 560 : 420, 60, W / 2, story ? 560 : 420, H * 0.75); bg.addColorStop(0, '#3a4da0'); bg.addColorStop(0.45, '#162146'); bg.addColorStop(1, '#070b1e'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  // título
  ctx.fillStyle = GOLD; ctx.font = `800 34px ${HANKEN}`; ctx.letterSpacing = '8px'; ctx.fillText('MEU PASSE BEATERISTA', W / 2, story ? 150 : 100); ctx.letterSpacing = '0px';
  // foto no holofote
  const R = story ? 250 : 150, cy = story ? 470 : 270;
  const glow = ctx.createRadialGradient(W / 2, cy, R * 0.8, W / 2, cy, R * 1.9); glow.addColorStop(0, 'rgba(242,169,27,.55)'); glow.addColorStop(1, 'rgba(242,169,27,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  const img = (await loadBlob(foto)) || (await load('assets/paul/sprites/bateria-idle_02.webp'));
  ctx.fillStyle = CREME; ctx.beginPath(); ctx.arc(W / 2, cy, R + 14, 0, Math.PI * 2); ctx.fill();
  circulo(ctx, img, W / 2, cy, R, 0.5, 0.4);
  ctx.lineWidth = 16; ctx.strokeStyle = GOLD; ctx.beginPath(); ctx.arc(W / 2, cy, R + 6, 0, Math.PI * 2); ctx.stroke();
  // nome
  let y = cy + R + (story ? 195 : 125); const nm = String(nome || '').trim().slice(0, 20) || 'aluno';
  ctx.fillStyle = GOLD; const fs = fit(ctx, nm.toUpperCase(), W - 200, story ? 150 : 100, ANTON); ctx.font = `${fs}px ${ANTON}`; ctx.fillText(nm.toUpperCase(), W / 2, y);
  // etiquetas: instrumento · estilo · meta (só as que a pessoa preencheu)
  const tags = [['instrumento', sobre.i], ['estilo', sobre.e], ['meta', sobre.m]].filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
  y += story ? 50 : 32; ctx.font = `800 ${story ? 40 : 32}px ${HANKEN}`; const h = story ? 76 : 60, gap = 16;
  const linhas = []; let atual = []; let larg = 0;
  for (const t of tags) { const w = ctx.measureText(t).width + 64; if (atual.length && larg + gap + w > W - 120) { linhas.push(atual); atual = []; larg = 0; } atual.push([t, w]); larg += (atual.length > 1 ? gap : 0) + w; }
  if (atual.length) linhas.push(atual);
  for (const ln of linhas) { const tot = ln.reduce((a, [, w]) => a + w, 0) + gap * (ln.length - 1); let x = W / 2 - tot / 2; for (const [t, w] of ln) { rr(ctx, x, y, w, h, h / 2); ctx.lineWidth = 5; ctx.strokeStyle = GOLD; ctx.stroke(); ctx.fillStyle = GOLD; ctx.fillText(t, x + w / 2, y + h / 2 + 14); x += w + gap; } y += h + 18; }
  // favoritos
  const lista = favs.filter((f) => f && f.nome).slice(0, 6);
  if (lista.length) {
    y += story ? 34 : 22; ctx.fillStyle = GOLD; ctx.font = `800 30px ${HANKEN}`; ctx.letterSpacing = '6px'; ctx.fillText('NO MEU REPERTÓRIO', W / 2, y); ctx.letterSpacing = '0px';
    const r = story ? 70 : 58, gp = story ? 16 : 14; const tot = lista.length * 2 * r + (lista.length - 1) * gp; let x = W / 2 - tot / 2 + r; y += story ? 40 + r : 30 + r;
    for (const f of lista) {
      const im = f.foto ? await load(f.foto) : null; ctx.fillStyle = CREME; ctx.beginPath(); ctx.arc(x, y, r + 5, 0, Math.PI * 2); ctx.fill();
      const rc = f.rosto; circulo(ctx, im, x, y, r, rc ? rc[0] + rc[2] / 2 : 0.5, rc ? rc[1] + rc[3] / 2 : 0.25);
      ctx.lineWidth = 6; ctx.strokeStyle = GOLD; ctx.beginPath(); ctx.arc(x, y, r + 2, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = CREME; const nf = String(f.nome).replace(/^The /, ''); const s2 = fit(ctx, nf, 2 * r + gp - 4, 26, HANKEN, '700'); ctx.font = `700 ${s2}px ${HANKEN}`; ctx.fillText(nf, x, y + r + 40); x += 2 * r + gp;
    }
    y += r + (story ? 50 : 44);
  }
  const topoLogo = y;
  // marca do Robôterista Paul + endereço
  const logo = await load('assets/paul/colorido/paul-logo.webp'); const baseY = H - (story ? 120 : 80); const lh = Math.min(story ? 330 : 200, baseY - 60 - topoLogo - 6);
  if (logo) { const lw = (logo.width / logo.height) * lh; ctx.drawImage(logo, W / 2 - lw / 2, baseY - 60 - lh, lw, lh); }
  ctx.fillStyle = CREME; ctx.font = `800 40px ${HANKEN}`; ctx.fillText(SITE, W / 2, baseY - 10);
  ctx.fillStyle = 'rgba(255,247,230,.75)'; ctx.font = `700 28px ${HANKEN}`; ctx.fillText(ESCOLA, W / 2, baseY + 32);
  return c;
}
const blob = (cv) => new Promise((ok, no) => cv.toBlob((b) => (b ? ok(b) : no(new Error('png'))), 'image/png'));
export const nomeArquivo = (nome, formato) => `BEATERISTA_PASSE_${String(nome || 'aluno').replace(/[^A-Za-z0-9]+/g, '-').slice(0, 20)}_${formato}.png`;
/** Celular: abre a folha de compartilhar. Senão baixa o PNG. Devolve 'compartilhado' | 'baixado' | 'cancelado'. */
export async function compartilhar(args) {
  const b = await blob(await desenhar(args)); const nomeArq = nomeArquivo(args.nome, args.formato || 'story'); const file = new File([b], nomeArq, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'Meu passe Beaterista' }); return 'compartilhado'; } catch (err) { if (err && err.name === 'AbortError') return 'cancelado'; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nomeArq; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'baixado';
}

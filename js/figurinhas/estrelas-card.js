// Cartão de conquista das estrelas (pedido da Bea): uma imagem pra postar (post 1080x1350 ou story 1080x1920) com o total de ★ da pessoa,
// o nome dela e o Paul comemorando. Gera o PNG no próprio aparelho (nada sobe pra servidor), igual à figurinha (postar.js).
import { SITE, ESCOLA, REDES } from './postar.js';

export const FORMATOS = { post: [1080, 1350], story: [1080, 1920] };
const ANTON = "'Anton', Impact, sans-serif", HANKEN = "'Hanken Grotesk', system-ui, sans-serif", GOCHI = "'Gochi Hand', 'Marker Felt', cursive";
const NAVY = '#14284b', GOLD = '#ffd166', CREME = '#fbf7ee', VINHO = '#8a1a30';
const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
const fontes = async () => { try { await Promise.all([document.fonts.load(`40px ${ANTON}`), document.fonts.load(`800 24px ${HANKEN}`), document.fonts.load(`40px ${GOCHI}`)]); } catch { /* usa a fonte reserva */ } };
const estrela = (ctx, cx, cy, R, r) => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rad = i % 2 ? r : R; ctx[i ? 'lineTo' : 'moveTo'](cx + rad * Math.cos(a), cy + rad * Math.sin(a)); } ctx.closePath(); };
const fit = (ctx, txt, maxW, size, fam, peso = '') => { let fs = size; ctx.font = `${peso} ${fs}px ${fam}`; while (ctx.measureText(txt).width > maxW && fs > 20) { fs -= 2; ctx.font = `${peso} ${fs}px ${fam}`; } return fs; };

/** Texto curto de apoio conforme o total de estrelas. */
export const frase = (n) => (n >= 300 ? 'mestre da Beaterista!' : n >= 100 ? 'já sou fera nos jogos e nos estudos!' : n >= 30 ? 'jogando e estudando música todo dia!' : n >= 1 ? 'começando a minha coleção de estrelas!' : 'bora ganhar as primeiras estrelas!');

/** Canvas do cartão. `nome` = nome da pessoa (opcional), `total` = estrelas, `formato` = 'post' | 'story'. */
export async function desenhar({ nome = '', total = 0, formato = 'post' } = {}) {
  await fontes(); const [W, H] = FORMATOS[formato] || FORMATOS.post; const story = formato === 'story';
  const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d');
  const n = Math.max(0, Math.round(Number(total) || 0));
  // fundo: azul-marinho com brilho dourado e raios saindo da estrela
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1d3a6b'); bg.addColorStop(1, NAVY); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const cy = story ? 800 : 510; ctx.save(); ctx.translate(W / 2, cy);
  for (let i = 0; i < 24; i++) { ctx.rotate((Math.PI * 2) / 24); ctx.fillStyle = i % 2 ? 'rgba(255,209,102,.10)' : 'rgba(255,209,102,.04)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-90, -H); ctx.lineTo(90, -H); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  const glow = ctx.createRadialGradient(W / 2, cy, 40, W / 2, cy, 520); glow.addColorStop(0, 'rgba(255,209,102,.45)'); glow.addColorStop(1, 'rgba(255,209,102,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 46; i++) { const x = (i * 337) % W, y = (i * 571) % H, s = 3 + (i % 4) * 2; ctx.fillStyle = i % 3 ? 'rgba(255,255,255,.35)' : 'rgba(255,209,102,.6)'; ctx.fillRect(x, y, s, s); }
  // cabeçalho
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = CREME; ctx.font = `64px ${ANTON}`; ctx.fillText('BEATERISTA', W / 2, story ? 250 : 130);
  ctx.fillStyle = GOLD; ctx.font = `800 32px ${HANKEN}`; ctx.fillText('MINHAS ESTRELAS', W / 2, story ? 306 : 180);
  // estrela grande com o número
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18; estrela(ctx, W / 2, cy, 300, 136); ctx.fillStyle = GOLD; ctx.fill(); ctx.restore();
  estrela(ctx, W / 2, cy, 300, 136); ctx.lineWidth = 14; ctx.strokeStyle = '#142036'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.fillStyle = NAVY; const fs = fit(ctx, String(n), 300, 230, ANTON); ctx.font = `${fs}px ${ANTON}`; ctx.textBaseline = 'middle'; ctx.fillText(String(n), W / 2, cy + 20); ctx.textBaseline = 'alphabetic';
  // texto
  const y0 = cy + 380; ctx.fillStyle = CREME; ctx.font = `110px ${ANTON}`; ctx.fillText(n === 1 ? 'ESTRELA' : 'ESTRELAS', W / 2, y0);
  ctx.fillStyle = CREME; const f2 = fit(ctx, frase(n), W - 160, 46, HANKEN, '700'); ctx.font = `700 ${f2}px ${HANKEN}`; ctx.fillText(frase(n), W / 2, y0 + 74);
  const nm = String(nome || '').trim().slice(0, 24);
  if (nm) { ctx.font = `800 44px ${HANKEN}`; const w = ctx.measureText(nm).width + 90; ctx.fillStyle = VINHO; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(W / 2 - w / 2, y0 + 96, w, 76, 38) : ctx.rect(W / 2 - w / 2, y0 + 96, w, 76); ctx.fill(); ctx.fillStyle = CREME; ctx.fillText(nm, W / 2, y0 + 149); }
  // o Paul comemorando (canto)
  const paul = await load('assets/paul/e20.webp'); if (paul) { const pw = story ? 380 : 330; const ph = (paul.height / paul.width) * pw; ctx.drawImage(paul, 24, y0 - ph + 20, pw, ph); }
  // rodapé
  ctx.fillStyle = GOLD; ctx.fillRect(W / 2 - 60, H - (story ? 340 : 190), 120, 6);
  ctx.fillStyle = CREME; ctx.font = `800 36px ${HANKEN}`; ctx.fillText(`${SITE} · ${ESCOLA}`, W / 2, H - (story ? 280 : 130));
  ctx.fillStyle = 'rgba(251,247,238,.8)'; ctx.font = `700 30px ${HANKEN}`; ctx.fillText(REDES.map(([, t]) => t).join('   '), W / 2, H - (story ? 226 : 78));
  return c;
}
const blob = (cv) => new Promise((ok, no) => cv.toBlob((b) => (b ? ok(b) : no(new Error('png'))), 'image/png'));
export const nomeArquivo = (formato, total) => `BEATERISTA_ESTRELAS_${Math.max(0, Math.round(total) || 0)}_${formato}.png`;
/** Celular: abre a folha de compartilhar. Senão baixa o PNG. Devolve 'compartilhado' | 'baixado' | 'cancelado'. */
export async function compartilhar(args) {
  const b = await blob(await desenhar(args)); const nome = nomeArquivo(args.formato || 'post', args.total); const file = new File([b], nome, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'Beaterista' }); return 'compartilhado'; } catch (err) { if (err && err.name === 'AbortError') return 'cancelado'; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nome; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'baixado';
}

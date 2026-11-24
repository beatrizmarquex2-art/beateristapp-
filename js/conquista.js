// Cartão de conquista pra postar (pedido da Bea, 15/nov/2026): uma imagem em pé (1080×1920, story/reels) com o logo da escola,
// o que a pessoa conquistou ("ganhei no Uno Musical", "terminei o caminho: pauLta"), o que aquele jogo desenvolve e o link.
// Sai do placar azul de fim de jogo (js/jogos/placar.js) e da festa de caminho concluído (festaCaminho, aqui embaixo).
// Nada de foto nem sobrenome: só o desenho do Paul. Quem posta e marca a escola resgata ★ com o print (aba roleta › resgate).
import { h } from './util.js';
import { corSrc } from './paul-cor.js';
import { toast } from './ui.js';

export const LINK = 'jogos.beaterista.com.br';
export const ARROBA = '@beaterista_';
const W = 1080; const H = 1920;
const ANTON = '"Anton","Arial Black",Impact,sans-serif'; const HANKEN = '"Hanken Grotesk",system-ui,sans-serif';

/** O que cada jogo desenvolve, em 3 linhas curtas (pra mãe e pro pai lerem no post). A chave é o nome do jogo em minúsculas. */
export const BENEFICIOS = {
  // regra da Bea: falar sempre ligando a algo musical e sem jargão solto (pai e mãe não sabem o que é "figura")
  'uno musical': ['decorar as figuras musicais com mais facilidade', 'somar e comparar quanto dura cada som', 'planejamento e tomada de decisão'],
  'jogo da velha': ['curiosidades sobre música', 'teoria musical em perguntas rápidas', 'artistas, bandas e muito mais'],
  'quebra-cabeça': ['imaginação e percepção visual', 'persistência pra resolver problemas', 'foco e concentração com cenas de música'],
  'cara a cara': ['conhecer os instrumentos musicais', 'raciocínio por eliminação', 'descobrir novas bandas e artistas'],
  'jogo da memória': ['cultura musical: profissionais da música e shows', 'equipamentos de palco e percussão', 'símbolos de som e de silêncio da partitura'],
  bingo: ['reconhecer instrumentos e símbolos musicais', 'atenção auditiva e visual', 'espera e autocontrole'],
  stop: ['vocabulário musical na ponta da língua', 'rapidez de raciocínio', 'repertório de artistas e instrumentos'],
  paulta: ['teoria musical na prática', 'ler as notas na partitura em várias claves', 'ligar o que se lê ao que se toca'],
  'figuras rítmicas': ['ler os símbolos que mostram quanto dura cada som', 'ler as pausas: os silêncios da música', 'contar os tempos da música'],
  figurix: ['ler os símbolos que mostram quanto dura cada som', 'ler as pausas: os silêncios da música', 'contar os tempos da música'],
  'detetive note': ['memória auditiva: guardar um ritmo de ouvido', 'escuta ativa da música', 'ligar o som à escrita do ritmo'],
  rudimentix: ['coordenação entre as duas mãos na bateria', 'os rudimentos, base de todo baterista', 'pulso firme e regularidade'],
  'toca aqui': ['ler um ritmo na partitura e tocar', 'precisão de tempo', 'tocar olhando a partitura'],
  'beat hero': ['coordenação motora no tempo da música', 'atenção e tempo de reação', 'sentir o pulso e o andamento'],
  'monte seu ritmo': ['criar ritmos com palavras do dia a dia', 'criatividade e composição musical', 'noção de compasso'],
  paulbox: ['noção de arranjo: como uma banda se monta', 'ouvir vários instrumentos tocando juntos', 'criatividade musical'],
};
const GERAL = ['atenção e concentração', 'memória e raciocínio', 'gosto por aprender música'];
/** Benefícios de um jogo pelo nome que aparece na tela (tolera maiúsculas, emoji e sobras). */
export function beneficiosDe(nome) {
  const n = String(nome || '').toLowerCase().normalize('NFC'); const k = Object.keys(BENEFICIOS).sort((a, b) => b.length - a.length).find((x) => n.includes(x));
  return k ? BENEFICIOS[k] : GERAL;
}
/** Tira emoji e símbolos que o canvas desenha torto; mantém letras, números, pontuação e ★. */
export const limpa = (t) => String(t || '').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, (c) => (c === '★' ? c : '')).replace(/\s+/g, ' ').trim();

/* 3 estilos (a Bea escolhe): palco = palco à noite (o mesmo do PaulBox) · creme = papel de zine · azul = o cartão azul do placar */
export const ESTILOS = {
  palco: { fundo: ['#31408a', '#162146', '#0a0f26'], tinta: '#fff7e6', destaque: '#f2a91b', placa: '#fffaf0', caixa: 'rgba(255,255,255,.10)', caixaTinta: '#fff7e6', botao: '#c81e2d', botaoTinta: '#ffffff', luz: '#f2a91b' },
  creme: { fundo: ['#fbf4e2', '#f3ecdc', '#e9dfc8'], tinta: '#162146', destaque: '#a6192e', placa: '#ffffff', caixa: '#ffffff', caixaTinta: '#162146', botao: '#162146', botaoTinta: '#fffaf0', luz: '#f2a91b' },
  azul: { fundo: ['#1f3f93', '#17307a', '#101f47'], tinta: '#ffffff', destaque: '#f6b93b', placa: '#fffaf0', caixa: '#101f47', caixaTinta: '#ffffff', botao: '#f6b93b', botaoTinta: '#101f47', luz: '#f6b93b', borda: '#f6b93b' },
};
export const ESTILO_PADRAO = 'palco';

const carregar = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
const rr = (c, x, y, w, hh, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + hh, r); c.arcTo(x + w, y + hh, x, y + hh, r); c.arcTo(x, y + hh, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
/** Quebra o texto em linhas que cabem na largura. */
function linhas(c, texto, larg) { const out = []; let cur = ''; for (const p of String(texto).split(' ')) { const t = cur ? `${cur} ${p}` : p; if (c.measureText(t).width > larg && cur) { out.push(cur); cur = p; } else cur = t; } if (cur) out.push(cur); return out; }
/** Escreve o texto no maior tamanho que cabe em `max` linhas. Devolve a altura usada. */
function bloco(c, texto, { x, y, larg, tam, min = 30, max = 2, fonte = ANTON, peso = '400', entre = 1.08 }) {
  let sz = tam; let ls = [];
  for (; sz >= min; sz -= 4) { c.font = `${peso} ${sz}px ${fonte}`; ls = linhas(c, texto, larg); if (ls.length <= max) break; }
  ls.slice(0, max).forEach((l, i) => c.fillText(l, x, y + sz + i * sz * entre)); return sz + (Math.min(ls.length, max) - 1) * sz * entre;
}

/**
 * Desenha o cartão. dados = { selo: 'ganhei no' | 'terminei o caminho', titulo, sub, numeros: [{ n, l }], beneficios: [..], pose, estilo }
 * Devolve o canvas (1080×1920).
 */
export async function cartao(dados = {}) {
  const e = ESTILOS[dados.estilo] || ESTILOS[ESTILO_PADRAO]; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  try { await Promise.all([document.fonts.load(`400 80px ${ANTON}`), document.fonts.load(`800 40px ${HANKEN}`)]); } catch { /* segue com a fonte que tiver */ }
  const [selo, nome, paul] = await Promise.all([carregar('assets/logo-512.png'), carregar('assets/logo-nome.png'), carregar(corSrc(dados.pose || 'baquetas-pra-cima'))]);
  const g = c.createRadialGradient(W / 2, 0, 60, W / 2, 300, H); e.fundo.forEach((cor, i) => g.addColorStop(i / (e.fundo.length - 1), cor)); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (e.borda) { c.strokeStyle = e.borda; c.lineWidth = 18; rr(c, 30, 30, W - 60, H - 60, 56); c.stroke(); }
  // logo: placa clara com o selo e o nome da escola
  c.fillStyle = e.placa; rr(c, 170, 96, 740, 190, 95); c.fill();
  if (selo) c.drawImage(selo, 188, 104, 174, 174); if (nome) c.drawImage(nome, 384, 132, 460, 460 * nome.height / nome.width);
  // o Paul com o holofote
  const py = 330; const ph = 520;
  const lg = c.createLinearGradient(0, py - 30, 0, py + ph); lg.addColorStop(0, e.luz); lg.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = 0.5; c.fillStyle = lg;
  c.beginPath(); c.moveTo(W / 2 - 70, py - 30); c.lineTo(W / 2 + 70, py - 30); c.lineTo(W / 2 + 360, py + ph); c.lineTo(W / 2 - 360, py + ph); c.closePath(); c.fill(); c.globalAlpha = 1;
  if (paul) { const s = Math.min(560 / paul.naturalWidth, ph / paul.naturalHeight); c.drawImage(paul, W / 2 - paul.naturalWidth * s / 2, py + ph - paul.naturalHeight * s, paul.naturalWidth * s, paul.naturalHeight * s); }
  // o que conquistou
  c.textAlign = 'center'; c.textBaseline = 'alphabetic'; let y = py + ph + 30;
  c.fillStyle = e.destaque; c.font = `800 46px ${HANKEN}`; c.fillText(limpa(dados.selo || 'conquista').toUpperCase(), W / 2, y + 44); y += 62;
  c.fillStyle = e.tinta; y += bloco(c, limpa(dados.titulo || '').toUpperCase(), { x: W / 2, y, larg: W - 150, tam: 128, min: 64, max: 2 }) + 26;
  if (dados.sub) { c.fillStyle = e.tinta; c.globalAlpha = 0.85; y += bloco(c, limpa(dados.sub), { x: W / 2, y, larg: W - 180, tam: 42, min: 30, max: 2, fonte: HANKEN, peso: '700', entre: 1.2 }) + 22; c.globalAlpha = 1; }
  // números do placar (até 3)
  const ns = (dados.numeros || []).filter((q) => q && limpa(q.n) !== '').slice(0, 3);
  if (ns.length) {
    const bw = 250; const gap = 26; const x0 = (W - (bw * ns.length + gap * (ns.length - 1))) / 2;
    ns.forEach((q, i) => { const x = x0 + i * (bw + gap); c.fillStyle = e.caixa; rr(c, x, y, bw, 150, 26); c.fill(); c.fillStyle = e.destaque; c.font = `400 ${String(limpa(q.n)).length > 4 ? 56 : 78}px ${ANTON}`; c.fillText(limpa(q.n), x + bw / 2, y + 88); c.fillStyle = e.caixaTinta; c.font = `700 28px ${HANKEN}`; c.fillText(limpa(q.l).slice(0, 16), x + bw / 2, y + 128); });
    y += 150 + 30;
  }
  // o que este jogo desenvolve
  const bs = (dados.beneficios || []).slice(0, 3);
  if (bs.length) {
    const bh = 96 + bs.length * 58; const by = Math.min(y, H - 330 - bh); c.fillStyle = e.caixa; rr(c, 90, by, W - 180, bh, 34); c.fill();
    c.fillStyle = e.destaque; c.font = `800 34px ${HANKEN}`; c.fillText('o que este jogo desenvolve', W / 2, by + 58);
    c.fillStyle = e.caixaTinta; c.font = `700 36px ${HANKEN}`; bs.forEach((b, i) => { let t = `✓ ${b}`; while (c.measureText(t).width > W - 240 && t.length > 8) t = `${t.slice(0, -2)}…`; c.fillText(t, W / 2, by + 118 + i * 58); });
  }
  // link
  c.fillStyle = e.tinta; c.font = `700 40px ${HANKEN}`; c.fillText('jogue você também, de graça:', W / 2, H - 236);
  c.fillStyle = e.botao; rr(c, 130, H - 206, W - 260, 112, 56); c.fill(); c.fillStyle = e.botaoTinta; c.font = `400 66px ${ANTON}`; c.fillText(LINK, W / 2, H - 126);
  c.fillStyle = e.tinta; c.globalAlpha = 0.8; c.font = `700 30px ${HANKEN}`; c.fillText(`beaterista escola de música · ${ARROBA}`, W / 2, H - 52); c.globalAlpha = 1;
  return cv;
}

/** Compartilha (onde o aparelho deixa mandar arquivo) ou baixa. Devolve 'compartilhado' | 'baixado' | 'cancelado'. */
export async function compartilharArquivo(blob, nome, texto = '') {
  const arq = new File([blob], nome, { type: blob.type });
  let pode = false; try { pode = !!(navigator.canShare && navigator.canShare({ files: [arq] })); } catch { pode = false; }
  if (pode) { try { await navigator.share({ files: [arq], text: texto }); return 'compartilhado'; } catch (e) { if (e && e.name === 'AbortError') return 'cancelado'; } }
  const url = URL.createObjectURL(blob); const a = h('a', { href: url, download: nome, hidden: true }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); return 'baixado';
}
const slug = (t) => limpa(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'jogo';
/** Gera o cartão e abre o compartilhar. */
export async function postar(dados) {
  const cv = await cartao(dados); const blob = await new Promise((ok) => cv.toBlob(ok, 'image/png')); if (!blob) { toast('não deu pra montar a imagem agora.'); return 'cancelado'; }
  try { window.__conquista = { dados, blob }; } catch { /* só pra teste */ }
  const r = await compartilharArquivo(blob, `beaterista-${slug(dados.titulo)}.png`, `${limpa(dados.selo || '')} ${limpa(dados.titulo || '')} 🎶 aprenda música jogando: https://${LINK} · ${ARROBA}`.trim());
  if (r === 'baixado') toast('imagem baixada! poste e marque a escola.'); else if (r === 'compartilhado') toast(`marcou ${ARROBA}? mande o print na aba roleta › resgate e ganhe 5 ★`);
  return r;
}
/** Botãozinho "compartilhar" (chip pequeno). `dados` pode ser função, pra ler a tela na hora do toque. */
export function botaoPostar(dados, { rotulo = '↗ compartilhar', classe = 'kd-chip cq-bt' } = {}) {
  const b = h('button', { type: 'button', class: classe, onclick: async () => { if (b.disabled) return; b.disabled = true; try { await postar(typeof dados === 'function' ? dados() : dados); } catch { toast('não deu pra compartilhar agora.'); } b.disabled = false; } }, rotulo);
  return b;
}

/* ---------- festa de caminho concluído ---------- */
const KEY = 'beaterista-caminhos-feitos';
const feitos = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } };
/** Já festejou este caminho neste aparelho? */
export const jaFestejou = (chave) => feitos().includes(String(chave));
const reduz = () => { try { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch { return false; } };
/**
 * Festa de "terminei o caminho": chuva de notas, o Paul, o que aquele jogo desenvolve e o botão de postar.
 * { jogo: 'pauLta', caminho: 'Mundo da Bateria', chave: 'paulta:drumF', pose } · com `chave`, só aparece na 1ª vez (use { sempre: true } pra repetir).
 * Devolve a função que fecha, ou null se não mostrou.
 */
export function festaCaminho({ jogo = '', caminho = '', chave = '', pose = 'baquetas-pra-cima', sempre = false } = {}) {
  if (chave && !sempre && jaFestejou(chave)) return null;
  if (chave) { try { localStorage.setItem(KEY, JSON.stringify([...new Set([...feitos(), String(chave)])].slice(-200))); } catch { /* sem armazenamento */ } }
  const bens = beneficiosDe(jogo); const titulo = caminho && limpa(caminho).toLowerCase() !== limpa(jogo).toLowerCase() ? `${jogo}: ${caminho}` : jogo;
  const dados = { selo: 'terminei o caminho', titulo, beneficios: bens, pose };
  const NOTAS = ['♪', '♫', '★', '♬', '✦']; const CORES = ['#00e5ff', '#2d8cff', '#f2a91b', '#ff3d57', '#ffffff'];
  const parts = reduz() ? [] : Array.from({ length: 48 }, (_, i) => h('i', { class: 'pf-p', 'aria-hidden': 'true', style: `--x:${Math.round(Math.random() * 100)}%;--d:${(2.4 + Math.random() * 2.4).toFixed(2)}s;--w:${(Math.random() * 1.6).toFixed(2)}s;--s:${Math.round(18 + Math.random() * 26)}px;--c:${CORES[i % CORES.length]};--r:${Math.round(Math.random() * 360)}deg` }, NOTAS[i % NOTAS.length]));
  const img = h('img', { class: 'cq-paul', src: 'assets/paul/animacoes/web/paul-comemoracao.webp', alt: '', draggable: 'false' });
  const fecha = () => { el.remove(); };
  const caixa = h('div', { class: 'pf-box cq-box', role: 'dialog', 'aria-label': `terminei o caminho: ${titulo}` }, img,
    h('small', { class: 'cq-selo' }, 'terminei o caminho'), h('b', { class: 'cq-t' }, titulo),
    h('div', { class: 'cq-bens' }, h('small', {}, 'o que você treinou aqui'), ...bens.map((b) => h('span', {}, `✓ ${b}`))),
    h('div', { class: 'cq-acoes' }, botaoPostar(dados, { rotulo: '↗ postar minha conquista', classe: 'kd-btn cq-postar' }), h('button', { type: 'button', class: 'kd-chip', onclick: fecha }, 'valeu!')),
    h('small', { class: 'cq-dica' }, `postou e marcou ${ARROBA}? mande o print na aba roleta › resgate e ganhe 5 ★`));
  const el = h('div', { class: 'pf cq' }, ...parts, caixa); document.body.append(el);
  import('./paulta/festa.js').then((F) => F.musicaDaFesta()).catch(() => {});
  return fecha;
}

// Perfil na sala (opção B "palco à noite", escolhida pela Bea): ao tocar no nome de quem está na sala abre a foto e os favoritos da pessoa.
// SÓ aparece de quem ligou "mostrar meu perfil na sala" no Perfil (desligado por padrão; muitos alunos são crianças).
// Do perfil vai pra sala: os nomes dos favoritos e uma MINIATURA da foto (96 px, uns 4 KB). O original continua só no aparelho.
import { h } from '../util.js';
import { sheet } from '../ui.js';
import * as D from '../figurinhas/dono.js';
import * as FAV from '../inicio-fav.js';
import * as PERF from '../inicio-perfil.js';

const KEY = 'bt-perfil-sala';
export const ligado = () => D.lsLer(KEY) === '1';
export function ligar(v) { D.lsGravar(KEY, v ? '1' : '0'); cache = null; if (v) preparar(); }

let cache = null; // { f: [até 6 nomes], d: 'data:image/jpeg;base64,...' }
const MAX_D = 16000;
/** Miniatura quadrada (centro da foto) de 96 px em JPEG. */
async function miniatura(blob) {
  const u = URL.createObjectURL(blob);
  try {
    const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('imagem')); i.src = u; });
    const lado = Math.min(im.naturalWidth, im.naturalHeight); const c = document.createElement('canvas'); c.width = 96; c.height = 96;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 96, 96); g.imageSmoothingQuality = 'high';
    g.drawImage(im, (im.naturalWidth - lado) / 2, (im.naturalHeight - lado) / 2, lado, lado, 0, 0, 96, 96);
    return c.toDataURL('image/jpeg', 0.7);
  } finally { URL.revokeObjectURL(u); }
}
/** Monta (e guarda) o que este celular manda pra sala. Chamado ao entrar na tela da sala; `meu()` devolve o resultado na hora. */
export async function preparar() {
  if (!ligado()) { cache = null; return null; }
  let d = ''; try { const b = await D.metaLer('perfil-foto'); if (b) d = await miniatura(b); } catch { /* sem foto */ }
  if (d.length > MAX_D) d = '';
  const f = (() => { try { return FAV.favoritos().slice(0, 6).map((x) => String(x).slice(0, 40)); } catch { return []; } })();
  const sobre = (() => { try { const o = PERF.perfil(); return { i: o.i, e: o.e, m: o.m }; } catch { return {}; } })(); // instrumento, estilo e meta do passe
  cache = f.length || d || sobre.i || sobre.e || sobre.m ? { f, d, s: sobre } : null; return cache;
}
/** O que mando agora (ou null se está desligado ou ainda não preparou). */
export const meu = () => (ligado() ? cache : null);
/** Limpa o que chegou de outro celular (nunca confia no que vem da sala). */
export function limpa(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
  const f = Array.isArray(p.f) ? p.f.slice(0, 6).map((x) => String(x || '').replace(/\s+/g, ' ').trim().slice(0, 40)).filter(Boolean) : [];
  const d = typeof p.d === 'string' && p.d.length <= MAX_D && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p.d) ? p.d : '';
  const so = {}; for (const c of PERF.CAMPOS) { const v = p.s && typeof p.s === 'object' ? p.s[c.k] : ''; so[c.k] = PERF.valido(c.k, v); } // só valores da lista (ou texto livre limpo, no estilo)
  return f.length || d || so.i || so.e || so.m ? { f, d, s: so } : null;
}

let catCache = null;
const fotosArtistas = async () => {
  if (!catCache) { const lista = await fetch('assets/figurinhas/catalogo.json').then((r) => r.json()).catch(() => []); catCache = new Map(); for (const e of lista) if (e.secao !== 'Beaterista' && !catCache.has(e.artista_banda)) catCache.set(e.artista_banda, { foto: e.foto, rosto: (e.rostos || [])[0] || null }); }
  return catCache;
};
const rostoPos = (r) => (r ? `${Math.round((r[0] + r[2] / 2) * 100)}% ${Math.round((r[1] + r[3] / 2) * 100)}%` : '50% 20%');

/** Abre o cartão (folha que sobe por cima do jogo). `perfil` = o que a pessoa mandou (ou null se ela não mostra). */
export function abrirPerfil(nome, perfil) {
  const p = limpa(perfil);
  sheet(nome, () => {
    const raiz = h('div', { class: 'ps-b' });
    const inicial = (nome || '?').trim().charAt(0).toUpperCase() || '?';
    raiz.append(h('div', { class: 'ps-foto', role: 'img', 'aria-label': `foto de ${nome}` }, p && p.d ? h('img', { src: p.d, alt: '' }) : h('i', {}, inicial)));
    if (!p) { raiz.append(h('p', { class: 'ps-vazio' }, `${nome} não mostra o perfil na sala.`)); return raiz; }
    const favs = h('div', { class: 'ps-favs', role: 'group', 'aria-label': 'favoritos' });
    p.f.forEach((n) => favs.append(h('div', { class: 'ps-fav' }, h('b', { class: 'ps-fav-foto' }, h('i', {}, '♪')), h('small', {}, n))));
    const etiquetas = PERF.CAMPOS.filter((c) => p.s && p.s[c.k]).map((c) => h('em', { class: 'ps-pill' }, `${c.nome}: ${p.s[c.k]}`));
    if (etiquetas.length) raiz.append(h('div', { class: 'ps-pills' }, ...etiquetas));
    raiz.append(h('p', { class: 'ps-lab' }, p.f.length ? `no repertório de ${nome}` : 'ainda sem favoritos'), favs);
    fotosArtistas().then((m) => { favs.querySelectorAll('.ps-fav').forEach((el, i) => { const a = m.get(p.f[i]); if (a && a.foto) el.querySelector('.ps-fav-foto').replaceChildren(h('img', { src: a.foto, alt: '', style: `object-position:${rostoPos(a.rosto)}` })); }); });
    return raiz;
  });
}

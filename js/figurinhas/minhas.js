// "Minha coleção": as cartinhas que a pessoa criou (foto + nome), guardadas SÓ neste aparelho (IndexedDB). Quem não tem acesso ao Álbum guarda aqui, no Perfil;
// quem tem acesso vê a mesma coleção na aba "Minhas" do Álbum. Cada cartinha vira PNG 720 x 950; dá pra baixar, postar (todos os formatos) ou apagar.
import { h } from '../util.js';
import { db } from '../db.js';
import * as D from './dono.js';
import { sheet, toast, confirmSheet } from '../ui.js';
import { cartaCanvas } from './postar.js';
import * as AC from '../acesso.js';
import { shareUI } from './share-ui.js';
import { LIMITE_IGUAIS, contaIguais, ESPACOS, ESPACOS_PAGINA, PAGINAS, proximoEspaco, colar, descolar, praColar, coladas, paginaDe } from './minhas-regras.js';
export { LIMITE_IGUAIS, contaIguais };

const LISTA = 'minhas-cartinhas', IMG = (id) => `minha-carta:${id}`, MAX = 40;
export const listar = async () => { try { return (await D.metaLer(LISTA)) || []; } catch { return []; } };
const gravaLista = (l) => D.metaGravar(LISTA, l);
const blob = (c) => new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('png'))), 'image/png'));
const imgDe = (b) => new Promise((ok, no) => { const u = URL.createObjectURL(b), i = new Image(); i.onload = () => ok({ i, u }); i.onerror = () => no(new Error('imagem')); i.src = u; });

/** Impressão digital da imagem pronta: duas cartinhas iguais dão a mesma. */
async function assinatura(b) {
  try { const buf = await b.arrayBuffer(); if (crypto && crypto.subtle) return [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map((x) => x.toString(16).padStart(2, '0')).join(''); const a = new Uint8Array(buf); let h = 2166136261; for (let i = 0; i < a.length; i += 7) h = Math.imul(h ^ a[i], 16777619); return `${a.length}-${h >>> 0}`; } catch { return ''; }
}
/** Impressão digital da FOTO (miniatura 16x16 em poucas cores): a mesma foto dá a mesma, mesmo com outro corte ou outro nome. Vazio se não der pra medir. */
export function assinaturaFoto(img) {
  try {
    const c = document.createElement('canvas'); c.width = 16; c.height = 16; const g = c.getContext('2d'); g.drawImage(img, 0, 0, 16, 16); const d = g.getImageData(0, 0, 16, 16).data;
    let hx = 2166136261; for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) { hx ^= d[i + k] >> 5; hx = Math.imul(hx, 16777619) >>> 0; } return hx.toString(36);
  } catch { return ''; }
}
/** Guarda a cartinha (já montada) na coleção. Devolve o item, ou lança erro se a coleção está cheia. */
export async function guardar(entry) {
  const l = await listar(); if (l.length >= MAX) throw new Error('cheia');
  const c = await cartaCanvas(entry, { escala: 2 }), b = await blob(c), sig = await assinatura(b);
  if (l.some((x) => x.sig && x.sig === sig)) throw new Error('repetida'); // a mesma figurinha (mesma foto, modelo, nome e enquadramento) não entra duas vezes
  const fotoSig = assinaturaFoto(entry.fotoImg); if (contaIguais(l, fotoSig, entry.modelo2) >= LIMITE_IGUAIS) throw new Error('limite2'); // no máximo 2 da mesma foto e do mesmo card
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  await db.metaSet(IMG(id), b); const item = { id, sig, fotoSig, nome: String(entry.artista_banda || '').slice(0, 24), modelo: entry.modelo2, em: Date.now() };
  await gravaLista([item, ...l]); return item;
}
export async function apagarTudo() { for (const it of await listar()) { try { await db.metaDel(IMG(it.id)); } catch { /* ok */ } } await gravaLista([]); }
export async function apagar(id) { await gravaLista((await listar()).filter((x) => x.id !== id)); try { await db.metaDel(IMG(id)); } catch { /* ok */ } }

/** Grade com as cartinhas guardadas. `onMudou` roda quando guarda/apaga (o chamador pode atualizar contagens). */
export function colecao({ titulo = 'minha coleção', vazio = 'ainda não tem nenhuma. crie uma cartinha e toque em "guardar na minha coleção".' } = {}) {
  const grade = h('div', { class: 'mc-grade' }), cont = h('p', { class: 'muted' }), urls = [];
  const barra = h('div', { class: 'mc-bar' });
  const el = h('section', { class: 'card pad mc' }, h('h2', { class: 'tag' }, titulo), cont, barra, grade, h('p', { class: 'muted pf-priv' }, 'ficam só neste aparelho. com código de acesso, elas também aparecem no Álbum, na aba Minhas. se limpar os dados do navegador, elas somem — baixe as que quiser guardar pra sempre.'));
  let alive = true;
  async function desenha() {
    urls.splice(0).forEach((u) => URL.revokeObjectURL(u)); const l = await listar(); if (!alive) return;
    barra.replaceChildren(...(l.length ? [h('button', { type: 'button', class: 'btn small ghost', onclick: async () => { if (await confirmSheet('excluir todas?', `as ${l.length} cartinhas somem da sua coleção neste aparelho.`, 'excluir todas')) { await apagarTudo(); await desenha(); toast('coleção limpa'); } } }, 'excluir todas')] : []), ...(AC.liberado() ? [h('a', { class: 'btn small', href: '#/album/Minhas' }, 'ver no álbum')] : []));
    cont.textContent = l.length ? `${l.length} cartinha${l.length > 1 ? 's' : ''}` : vazio; grade.replaceChildren();
    for (const it of l) {
      const b = await db.metaGet(IMG(it.id)); if (!b || !alive) continue; const u = URL.createObjectURL(b); urls.push(u);
      grade.append(h('div', { class: 'mc-cell' }, h('button', { type: 'button', class: 'mc-item', 'aria-label': `${it.nome || 'cartinha'}, abrir`, onclick: () => abrir(it, b) }, h('img', { src: u, alt: it.nome || 'cartinha', width: 360, height: 475, loading: 'lazy' }), h('span', {}, it.nome || '—')),
        h('button', { type: 'button', class: 'mc-del', 'aria-label': `excluir ${it.nome || 'cartinha'}`, onclick: async () => { if (await confirmSheet('excluir a cartinha?', `“${it.nome || 'cartinha'}” some da sua coleção neste aparelho.`, 'excluir')) { await apagar(it.id); await desenha(); toast('cartinha excluída'); } } }, '×')));
    }
  }
  function abrir(it, b) {
    sheet(it.nome || 'cartinha', (close) => {
      const box = h('div', { class: 'fig-detail' }); let share = null;
      imgDe(b).then(({ i, u }) => { if (!box.isConnected && !alive) return; URL.revokeObjectURL(u); share = shareUI({ cartaPronta: i, modelo2: it.modelo, artista_banda: it.nome, raridade: 'Comum', secao: 'Comum', codigo: '' }, { titulo: 'baixar / postar' }); box.append(share); }).catch(() => box.append(h('p', { class: 'fig-note' }, 'não consegui abrir essa cartinha.')));
      box.append(h('button', { type: 'button', class: 'btn ghost', onclick: async () => { if (await confirmSheet('apagar a cartinha?', 'ela some da sua coleção neste aparelho.', 'apagar')) { await apagar(it.id); close(); desenha(); toast('cartinha apagada'); } } }, 'apagar da coleção'));
      box.cleanup = () => share && share.cleanup(); return box;
    });
  }
  desenha();
  return { el, refresh: desenha, cleanup() { alive = false; urls.splice(0).forEach((u) => URL.revokeObjectURL(u)); } };
}

/**
 * "Meu álbum": um álbum de verdade só das cartinhas que o aluno criou. As novas ficam em "pra colar"; ele toca e cola num espaço numerado.
 * Fica SÓ neste aparelho e é de quem está com o nome agora (não vai pra conta, pro iPad da professora nem pra outro celular).
 */
export function album({ nome = '' } = {}) {
  const urls = []; let alive = true; let pag = 1; let escolhida = null; // cartinha escolhida pra colar num espaço
  const titulo = h('h2', { class: 'ma-tit' }, nome ? `álbum de ${nome}` : 'meu álbum'); const cont = h('p', { class: 'ma-cont' });
  const mao = h('div', { class: 'ma-mao' }); const folha = h('div', { class: 'ma-folha' }); const nav = h('div', { class: 'ma-nav' });
  const el = h('section', { class: 'ma' }, titulo, cont, mao, folha, nav, h('p', { class: 'muted pf-priv' }, 'este álbum fica só neste celular e é só seu: não aparece em outro aparelho nem pra outra pessoa. se limpar os dados do navegador, ele some — baixe as cartinhas que quiser guardar pra sempre.'));
  const urlDe = async (it) => { const b = await db.metaGet(IMG(it.id)); if (!b) return null; const u = URL.createObjectURL(b); urls.push(u); return { b, u }; };
  async function colaEm(l, id, slot) { const n = colar(l, id, slot); if (n === l) return false; await gravaLista(n); escolhida = null; const it = n.find((x) => x.id === id); pag = paginaDe(it.slot); await desenha(it.slot); return true; }
  async function desenha(novo = 0) {
    urls.splice(0).forEach((u) => URL.revokeObjectURL(u)); const l = await listar(); if (!alive) return;
    const soltas = praColar(l); const presas = coladas(l); cont.textContent = `${presas.length} colada${presas.length === 1 ? '' : 's'} · ${soltas.length} pra colar · ${ESPACOS} espaços`;
    // --- pra colar ---
    mao.replaceChildren(); mao.hidden = !soltas.length;
    if (soltas.length) {
      const fila = h('div', { class: 'ma-fila' });
      for (const it of soltas) { const r = await urlDe(it); if (!r || !alive) continue; fila.append(h('button', { type: 'button', class: `ma-solta${escolhida === it.id ? ' on' : ''}`, 'data-id': it.id, 'aria-pressed': String(escolhida === it.id), 'aria-label': `${it.nome || 'cartinha'}: escolher pra colar`, onclick: () => { escolhida = escolhida === it.id ? null : it.id; desenha(); } }, h('img', { src: r.u, alt: '', width: 360, height: 475 }), h('span', {}, it.nome || '—'))); }
      mao.append(h('div', { class: 'ma-mao-top' }, h('b', {}, escolhida ? 'agora toque num espaço vazio' : 'pra colar: toque numa cartinha'), h('button', { type: 'button', class: 'btn small ma-todas', onclick: async () => { let cur = await listar(); for (const it of praColar(cur)) cur = colar(cur, it.id); await gravaLista(cur); escolhida = null; toast('tudo colado no seu álbum!'); await desenha(); } }, 'colar todas')), fila);
    }
    // --- a página ---
    const de = (pag - 1) * ESPACOS_PAGINA + 1; folha.replaceChildren(h('div', { class: 'ma-pag-t' }, `página ${pag}`));
    const grade = h('div', { class: 'ma-grade' }); folha.append(grade);
    for (let n = de; n < de + ESPACOS_PAGINA; n++) {
      const it = presas.find((x) => x.slot === n);
      if (!it) { grade.append(h('button', { type: 'button', class: `ma-esp${escolhida ? ' alvo' : ''}`, 'data-slot': String(n), 'aria-label': `espaço ${n}, vazio`, onclick: async () => { const cur = await listar(); if (escolhida) { await colaEm(cur, escolhida, n); return; } const s = praColar(cur)[0]; if (s) await colaEm(cur, s.id, n); else toast('crie uma cartinha no Perfil pra colar aqui'); } }, h('i', {}, String(n)))); continue; }
      const r = await urlDe(it); if (!alive) return;
      grade.append(h('button', { type: 'button', class: `ma-esp cheia${novo === n ? ' colou' : ''}`, 'data-slot': String(n), 'aria-label': `espaço ${n}: ${it.nome || 'cartinha'}, abrir`, onclick: () => r && abrir(it, r.b) }, r ? h('img', { src: r.u, alt: it.nome || 'cartinha', width: 360, height: 475 }) : null, h('span', {}, it.nome || '—')));
    }
    nav.replaceChildren(h('button', { type: 'button', class: 'btn small ghost', disabled: pag <= 1, 'aria-label': 'página anterior', onclick: () => { pag--; desenha(); } }, '‹'), h('span', {}, `${pag} de ${PAGINAS}`), h('button', { type: 'button', class: 'btn small ghost', disabled: pag >= PAGINAS, 'aria-label': 'próxima página', onclick: () => { pag++; desenha(); } }, '›'));
  }
  function abrir(it, b) {
    sheet(it.nome || 'cartinha', (close) => {
      const box = h('div', { class: 'fig-detail' }); let share = null;
      imgDe(b).then(({ i, u }) => { URL.revokeObjectURL(u); share = shareUI({ cartaPronta: i, modelo2: it.modelo, artista_banda: it.nome, raridade: 'Comum', secao: 'Comum', codigo: '' }, { titulo: 'baixar / postar' }); box.append(share); }).catch(() => box.append(h('p', { class: 'fig-note' }, 'não consegui abrir essa cartinha.')));
      box.append(h('button', { type: 'button', class: 'btn', onclick: async () => { await gravaLista(descolar(await listar(), it.id)); close(); desenha(); toast('descolada: ela voltou pra “pra colar”'); } }, 'descolar do álbum'),
        h('button', { type: 'button', class: 'btn ghost', onclick: async () => { if (await confirmSheet('apagar a cartinha?', 'ela some do seu álbum neste aparelho.', 'apagar')) { await apagar(it.id); close(); desenha(); toast('cartinha apagada'); } } }, 'apagar a cartinha'));
      box.cleanup = () => share && share.cleanup(); return box;
    });
  }
  desenha();
  return { el, refresh: desenha, cleanup() { alive = false; urls.splice(0).forEach((u) => URL.revokeObjectURL(u)); } };
}

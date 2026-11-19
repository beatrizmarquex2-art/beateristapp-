// Aba INÍCIO (prévia, aparece só com ?inicio=1): o "passe do aluno" com 3 bandas/cantores favoritos (das figurinhas que o aluno já ganhou),
// dias seguidos, estrelas, faltam pra roleta, a faixa amarela "continuar de onde parou" e o desafio de hoje (rascunho).
import { h } from '../util.js';
import * as CODE from '../codigo.js';
import * as P from '../kids/progress.js';
import * as ESTRELAS from '../figurinhas/estrelas.js';
import * as D from '../figurinhas/dono.js';
import { sheet } from '../ui.js';

const DIAS_KEY = 'bt-inicio-dias'; const LUGAR_KEY = 'bt-inicio-lugar'; const FAV_KEY = 'bt-inicio-favoritos';
const dia = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const lerDias = () => { try { const a = JSON.parse(localStorage.getItem(DIAS_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } };
/** Conta o dia de hoje como "dia de uso" (chamado a cada tela que o aluno abre). */
export function marcaDia() { try { const a = lerDias(); const hoje = dia(); if (a[a.length - 1] !== hoje) { a.push(hoje); localStorage.setItem(DIAS_KEY, JSON.stringify(a.slice(-90))); } } catch { /* sem armazenamento */ } }
/** Dias seguidos até hoje (se hoje ainda não entrou, conta até ontem). */
export function sequencia() {
  const set = new Set(lerDias()); let n = 0; const d = new Date(); if (!set.has(dia(d))) d.setDate(d.getDate() - 1);
  while (set.has(dia(d))) { n++; d.setDate(d.getDate() - 1); } return n;
}

/* ---------- continuar de onde parou: o último lugar (jogo, aula, instrumento...) ---------- */
const NOMES = [
  [/^#\/estudos\/aulas\/?$/, 'aulas do Paul'], [/^#\/estudos\/aulas\/(.+)/, 'uma aula do Paul'], [/^#\/estudos\/basica/, 'teoria com o Paul'], [/^#\/estudos\/ritmos/, 'ritmos'], [/^#\/estudos\/acordes/, 'acordes'],
  [/^#\/estudos\/dicas/, 'dicas do método'], [/^#\/estudos\/curiosidades/, 'curiosidades de músicos'], [/^#\/dicionario/, 'dicionário musical'], [/^#\/toque/, 'bateria no Palco'], [/^#\/piano/, 'teclado no Palco'],
  [/^#\/violao/, 'violão no Palco'], [/^#\/xilofone/, 'xilofone no Palco'], [/^#\/metronomo/, 'metrônomo'], [/^#\/roleta/, 'a roleta'], [/^#\/album/, 'o álbum'], [/^#\/estudos\/?$/, 'Estudos'], [/^#\/tocar\/?$/, 'Palco'],
];
/** Guarda onde o aluno está (a tela "inicio" não conta). `nomeJogo` vem do catálogo de jogos quando o endereço é de um jogo. */
export function lembrarLugar(hash, nomeJogo) {
  try {
    if (!hash || /^#\/(inicio|perfil|lojinha)/.test(hash)) return;
    const nome = nomeJogo || (NOMES.find(([re]) => re.test(hash)) || [])[1]; if (!nome) return;
    localStorage.setItem(LUGAR_KEY, JSON.stringify({ href: hash, nome, at: Date.now() }));
  } catch { /* sem armazenamento */ }
}
const lugar = () => { try { const u = JSON.parse(localStorage.getItem(LUGAR_KEY) || 'null'); return u && u.href && u.nome ? u : null; } catch { return null; } };
const haQuanto = (t) => { const m = Math.max(0, Math.round((Date.now() - t) / 60000)); if (m < 2) return 'agora há pouco'; if (m < 60) return `há ${m} min`; const hh = Math.round(m / 60); if (hh < 24) return `há ${hh} h`; const d = Math.round(hh / 24); return d === 1 ? 'ontem' : `há ${d} dias`; };

/* ---------- bandas e cantores favoritos (das figurinhas que o aluno já tem) ---------- */
const lerFav = () => { try { const a = JSON.parse(D.lsLer(FAV_KEY) || '[]'); return Array.isArray(a) ? a.slice(0, 3) : []; } catch { return []; } };
const gravarFav = (a) => D.lsGravar(FAV_KEY, JSON.stringify(a.slice(0, 3)));
let catCache = null;
async function figurinhasGanhas() {
  catCache ||= await fetch('assets/figurinhas/catalogo.json').then((r) => r.json()).catch(() => []);
  const st = D.albumDados(); const tem = new Set([...Object.keys(st.pasted || {}), ...Object.keys(st.inv || {}).filter((c) => st.inv[c] > 0)]);
  const por = new Map(); // artista -> { nome, foto, rosto, qtd }
  for (const e of catCache) {
    if (!tem.has(e.codigo) || e.secao === 'Beaterista') continue;
    const a = por.get(e.artista_banda) || { nome: e.artista_banda, foto: e.foto, rosto: (e.rostos || [])[0] || null, secao: e.secao, qtd: 0 }; a.qtd++; por.set(e.artista_banda, a);
  }
  return [...por.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
}
const rostoPos = (r) => (r ? `${Math.round((r[0] + r[2] / 2) * 100)}% ${Math.round((r[1] + r[3] / 2) * 100)}%` : '50% 20%');

export function mount(host, { nome = '' } = {}) {
  let pid = null; try { const a = P.active(); pid = a && a.id; } catch { /* sem perfil ainda */ }
  let estrelas = 0; try { estrelas = pid ? ESTRELAS.estrelasTotais(pid) : 0; } catch { estrelas = 0; }
  let faltam = null; try { faltam = ESTRELAS.faltamParaRoleta(estrelas); } catch { faltam = null; }
  const seq = sequencia();
  const cod = (() => { try { const c = CODE.saved(); return c ? CODE.mascarar(c) : ''; } catch { return ''; } })();
  const u = lugar();

  /* favoritos */
  let ganhas = []; let fav = lerFav();
  const slots = h('div', { class: 'in-favs', role: 'group', 'aria-label': 'bandas e cantores favoritos' });
  const desenhaFav = () => {
    slots.replaceChildren(...[0, 1, 2].map((i) => {
      const nomeF = fav[i]; const a = nomeF && ganhas.find((x) => x.nome === nomeF);
      return h('button', { type: 'button', class: `in-fav${a ? ' tem' : ''}`, 'aria-label': a ? `favorito ${i + 1}: ${a.nome}. tocar pra trocar` : `escolher favorito ${i + 1}`, onclick: () => escolher(i) },
        h('span', { class: 'in-fav-foto' }, a ? h('img', { src: a.foto, alt: '', style: `object-position:${rostoPos(a.rosto)}` }) : h('i', {}, '+')),
        h('small', {}, a ? a.nome : 'escolher'));
    }));
  };
  function escolher(i) {
    sheet('bandas e cantores favoritos', (close) => {
      const box = h('div', { class: 'in-pick' });
      if (!ganhas.length) { box.append(h('p', {}, 'você ainda não ganhou figurinhas de bandas ou cantores. jogue, ganhe estrelas e abra os pacotes na roleta: elas aparecem aqui pra você escolher!'), h('a', { class: 'btn primary wide', href: '#/album', onclick: close }, 'ir pro álbum')); return box; }
      box.append(h('p', { class: 'in-pick-t' }, `escolha o favorito ${i + 1} (só aparecem as que você já tem):`));
      const grade = h('div', { class: 'in-pick-grade' }, ...ganhas.map((a) => {
        const usado = fav.includes(a.nome) && fav[i] !== a.nome;
        return h('button', { type: 'button', class: `in-pick-it${fav[i] === a.nome ? ' on' : ''}`, disabled: usado ? '' : null, onclick: () => { fav[i] = a.nome; fav = fav.filter(Boolean); gravarFav(fav); desenhaFav(); close(); } },
          h('span', { class: 'in-fav-foto' }, h('img', { src: a.foto, alt: '', style: `object-position:${rostoPos(a.rosto)}` })), h('small', {}, a.nome));
      }));
      box.append(grade);
      if (fav[i]) box.append(h('button', { type: 'button', class: 'btn wide', onclick: () => { fav.splice(i, 1); gravarFav(fav); desenhaFav(); close(); } }, 'tirar este favorito'));
      return box;
    });
  }
  desenhaFav();
  figurinhasGanhas().then((l) => { ganhas = l; fav = fav.filter((n) => l.some((x) => x.nome === n)); desenhaFav(); }).catch(() => { /* fica sem figurinhas */ });

  const passe = h('section', { class: 'in-passe', 'aria-label': 'passe do aluno' },
    h('i', { class: 'in-furo', 'aria-hidden': 'true' }),
    h('p', { class: 'in-tag' }, 'beaterista · passe do aluno'),
    h('h1', { class: 'in-nome' }, nome || 'aluno'),
    h('p', { class: 'in-favt' }, 'bandas e cantores favoritos'),
    slots,
    h('div', { class: 'in-foto' }, h('img', { src: 'assets/paul/sprites/bateria-idle_02.webp', alt: '' })),
    cod ? h('p', { class: 'in-cod' }, `CÓDIGO ${cod}`) : null,
    h('div', { class: 'in-selos', 'aria-hidden': 'true' }, h('i', {}, '★'), h('i', {}, '♪'), h('i', {}, '●')));

  const tres = h('div', { class: 'in-tres' },
    h('div', {}, h('b', {}, String(seq)), h('small', {}, seq === 1 ? 'dia seguido' : 'dias seguidos')),
    h('div', {}, h('b', {}, String(estrelas)), h('small', {}, 'estrelas')),
    h('div', {}, h('b', {}, faltam == null ? '–' : String(faltam)), h('small', {}, 'pra próxima roleta')));

  const continuar = u ? h('a', { class: 'in-cont', href: u.href },
    h('span', { class: 'in-cont-pl', 'aria-hidden': 'true' }, '▶'),
    h('span', { class: 'in-cont-tx' }, h('small', {}, 'continuar de onde parou'), h('b', {}, u.nome)),
    h('span', { class: 'in-cont-q' }, haQuanto(u.at))) : null;

  // RASCUNHO: a Bea e eu ainda vamos estruturar o desafio do dia (ver proposta no chat)
  const desafio = h('section', { class: 'in-hoje' },
    h('small', {}, 'desafio de hoje'),
    h('h2', {}, 'jogue uma fase do Hero Drum'),
    h('p', {}, 'rascunho: aqui vai entrar o desafio do dia'),
    h('a', { class: 'in-btn', href: '#/ritmo/drum' }, 'jogar ▶'),
    h('img', { src: 'assets/paul/sprites/danca-up.webp', alt: '', 'aria-hidden': 'true' }));

  const atalhos = h('div', { class: 'in-prox' },
    h('a', { href: '#/jogos' }, h('b', {}, 'jogos'), 'Hero Drum, Piano Hero, Beat Hero e mais'),
    h('a', { href: '#/estudos' }, h('b', {}, 'estudos'), 'aulas do Paul e dicionário'),
    h('a', { href: '#/tocar' }, h('b', {}, 'palco'), 'bateria, violão, teclado e xilofone'),
    h('a', { href: '#/lojinha' }, h('b', {}, 'lojinha'), 'cards e apostilas pra imprimir'));

  host.append(h('div', { class: 'inicio' }, passe, tres, continuar, desafio, atalhos));
  return () => {};
}

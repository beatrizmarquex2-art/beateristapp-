// Aba INÍCIO (prévia, aparece só com ?inicio=1): o "passe do aluno" com 3 bandas/cantores favoritos (das figurinhas que o aluno já ganhou),
// dias seguidos, estrelas, faltam pra roleta, a faixa amarela "continuar de onde parou" a roleta grátis diária e "ganhar mais estrelas" (abre uma folha).
import { h, todayKey } from '../util.js';
import * as CODE from '../codigo.js';
import * as P from '../kids/progress.js';
import * as ESTRELAS from '../figurinhas/estrelas.js';
import * as D from '../figurinhas/dono.js';
import { sheet } from '../ui.js';
import * as FAV from '../inicio-fav.js';
import * as A from '../figurinhas/acesso.js';
import * as L from '../figurinhas/album-logic.js';
import * as store from '../store.js';
import { atualizarAgora } from '../atualizar-btn.js';
import * as PERF from '../inicio-perfil.js';

const DIAS_KEY = 'bt-inicio-dias'; const LUGAR_KEY = 'bt-inicio-lugar';
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
let catCache = null; let albumTrazido = false;
/** Quem tem código: traz as figurinhas coladas da nuvem (as de outro celular) e junta com as daqui, pra escolher favoritos sem abrir o Álbum antes. */
async function trazerAlbum() {
  if (albumTrazido) return; albumTrazido = true;
  try {
    const c = CODE.saved(); if (!c) return;
    const r = await Promise.race([A.entrar(c), new Promise((_, no) => setTimeout(() => no(new Error('demorou')), 4000))]);
    if (r && r.ok && r.estado) await store.upsert('figurinhas', D.albumId(), L.mergeStates({ ...L.emptyState(), ...D.albumDados() }, r.estado));
  } catch { /* sem internet: fica com as daqui */ }
}
/** `todas`: foto e rosto de cada banda/cantor do catálogo (pra mostrar um favorito que veio de outro celular); `ganhas`: só as que este aluno já tem. */
async function figurinhasGanhas() {
  await trazerAlbum();
  catCache ||= await fetch('assets/figurinhas/catalogo.json').then((r) => r.json()).catch(() => []);
  const st = D.albumDados(); const tem = new Set([...Object.keys(st.pasted || {}), ...Object.keys(st.inv || {}).filter((c) => st.inv[c] > 0)]);
  const todas = new Map(); const por = new Map(); // artista -> { nome, foto, rosto, qtd }
  for (const e of catCache) {
    if (e.secao === 'Beaterista') continue;
    if (!todas.has(e.artista_banda)) todas.set(e.artista_banda, { nome: e.artista_banda, foto: e.foto, rosto: (e.rostos || [])[0] || null });
    if (!tem.has(e.codigo)) continue;
    const a = por.get(e.artista_banda) || { nome: e.artista_banda, foto: e.foto, rosto: (e.rostos || [])[0] || null, secao: e.secao, qtd: 0 }; a.qtd++; por.set(e.artista_banda, a);
  }
  return { todas, ganhas: [...por.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt')) };
}
const rostoPos = (r) => (r ? `${Math.round((r[0] + r[2] / 2) * 100)}% ${Math.round((r[1] + r[3] / 2) * 100)}%` : '50% 20%');

/** "quero + estrelas": folha com 3 menus (jogos, estudos, palco); tocar num mostra como ganhar estrelas ali. */
function abrirComoGanhar(faltam) {
  const AJUDA = {
    jogos: { ic: '🎮', t: 'jogos', sub: 'os de aprender dão mais estrelas', itens: [
      ['🥁', 'Hero Drum, Piano Hero e Beat Hero', 'termine a fase com 80% ou mais: fácil dá 1 ★, médio 2 ★ e difícil 3 ★.', '#/jogos', 'jogar'],
      ['🎼', 'Toca Aqui, Figurix e pauLta', 'cada fase concluída vale estrela, e quanto mais você acerta, mais estrelas.', '#/jogos', 'ver os jogos'],
      ['🕵️', 'Detetive, quiz e os outros', 'quem ganha leva até 3 ★ (e participar já vale 1 ★ nos duelos).', '#/jogos', 'ver os jogos'],
      ['🎁', 'bônus', 'a cada 4 fases concluídas você ganha mais 1 giro de presente.', '#/jogos', 'jogar']] },
    estudos: { ic: '📚', t: 'estudos', sub: 'aulas com o Paul', itens: [
      ['❓', 'mini quiz de cada fase', 'no fim de cada fase tem 3 perguntas: 3 acertos dão 2 ★ e 2 acertos dão 1 ★ (até 30 ★ por dia nos estudos).', '#/estudos/aulas', 'estudar'],
      ['🎁', 'tema completo', 'acertou as 3 perguntas em todas as fases de um tema? ganha também uma figurinha exclusiva!', '#/estudos/aulas', 'ver os temas'],
      ['📖', 'dicionário e curiosidades', 'servem pra aprender mais, mas não dão estrelas.', '#/estudos', 'abrir estudos']] },
    palco: { ic: '🎸', t: 'palco', sub: 'segredos do Paul', itens: [
      ['🥁', 'bateria, eletrônica e cajón', 'toque os 3 segredos do Paul: Believer, We Will Rock You e Sunflower. Cada um dá 3 ★ na primeira vez. Dica: Believer é 4 batidas no surdo e depois a caixa (no cajón: 4 graves e 1 agudo).', '#/tocar', 'ir pro palco'],
      ['🎹', 'teclado, xilofone e violão', 'toque as notas Dó, Ré, Mi, Fá em sequência pra achar o segredo e ganhar 3 ★.', '#/tocar', 'ir pro palco'],
      ['⭐', 'tocar livre', 'o resto do palco é pra praticar e se divertir, sem estrelas.', '#/tocar', 'ir pro palco']] },
  };
  sheet('quero + estrelas', (close) => {
    const raiz = h('div', { class: 'in-ganhar' });
    const topo = h('p', { class: 'in-ganhar-t' }, `a cada ${L.ESTRELAS_POR_ROLETA} ★ juntas você ganha 1 giro na roleta.${faltam == null ? '' : ` faltam ${faltam} ★ pra próxima!`}`);
    const menu = () => raiz.replaceChildren(topo, h('p', { class: 'in-ganhar-q' }, 'onde você quer ganhar estrelas?'),
      h('div', { class: 'in-menus' }, ...Object.entries(AJUDA).map(([k, m]) => h('button', { type: 'button', class: `in-menu m-${k}`, onclick: () => detalhe(k) }, h('span', { 'aria-hidden': 'true' }, m.ic), h('b', {}, m.t), h('small', {}, m.sub)))));
    const detalhe = (k) => { const m = AJUDA[k]; raiz.replaceChildren(h('button', { type: 'button', class: 'in-ganhar-volta', onclick: menu }, '‹ voltar'), h('h3', { class: 'in-ganhar-h' }, `${m.ic} ${m.t}`),
      ...m.itens.map(([ic, tit, txt, href, bt]) => h('div', { class: 'in-ganhar-it' }, h('span', { 'aria-hidden': 'true' }, ic), h('div', {}, h('b', {}, tit), h('p', {}, txt), h('a', { class: 'btn small', href, onclick: close }, bt))))); };
    menu(); return raiz;
  });
}

export function mount(host, { nome = '' } = {}) {
  let pid = null; try { const a = P.active(); pid = a && a.id; } catch { /* sem perfil ainda */ }
  let estrelas = 0; try { estrelas = pid ? ESTRELAS.estrelasTotais(pid) : 0; } catch { estrelas = 0; }
  let faltam = null; try { faltam = ESTRELAS.faltamParaRoleta(estrelas); } catch { faltam = null; }
  const seq = sequencia();
  const cod = (() => { try { const c = CODE.saved(); return c ? CODE.mascarar(c) : ''; } catch { return ''; } })();
  const u = lugar();

  /* favoritos */
  let ganhas = []; let todas = new Map(); let fav = FAV.favoritos();
  const slots = h('div', { class: 'in-favs', role: 'group', 'aria-label': 'bandas e cantores favoritos' });
  const desenhaFav = () => {
    slots.replaceChildren(...[0, 1, 2, 3, 4, 5].map((i) => {
      const nomeF = fav[i]; const a = nomeF && (todas.get(nomeF) || { nome: nomeF, foto: '', rosto: null });
      return h('button', { type: 'button', class: `in-fav${a ? ' tem' : ''}`, 'aria-label': a ? `favorito ${i + 1}: ${a.nome}. tocar pra trocar` : `escolher favorito ${i + 1}`, onclick: () => escolher(i) },
        h('span', { class: 'in-fav-foto' }, a ? (a.foto ? h('img', { src: a.foto, alt: '', style: `object-position:${rostoPos(a.rosto)}` }) : h('i', {}, '♪')) : h('i', {}, '+')),
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
        return h('button', { type: 'button', class: `in-pick-it${fav[i] === a.nome ? ' on' : ''}`, disabled: usado ? '' : null, onclick: () => { fav[i] = a.nome; fav = fav.filter(Boolean); FAV.gravar(fav); desenhaFav(); close(); } },
          h('span', { class: 'in-fav-foto' }, h('img', { src: a.foto, alt: '', style: `object-position:${rostoPos(a.rosto)}` })), h('small', {}, a.nome));
      }));
      box.append(grade);
      if (fav[i]) box.append(h('button', { type: 'button', class: 'btn wide', onclick: () => { fav.splice(i, 1); FAV.gravar(fav); desenhaFav(); close(); } }, 'tirar este favorito'));
      return box;
    });
  }
  desenhaFav();
  figurinhasGanhas().then((r) => { ganhas = r.ganhas; todas = r.todas; fav = FAV.favoritos(); desenhaFav(); }).catch(() => { /* fica sem figurinhas */ });

  // foto do passe (opção C, escolha da Bea): quadro redondo com aro; mostra a foto de perfil (ou o Paul que a pessoa escolheu); sem nada escolhido, o Paul na bateria. Toca e abre o Perfil.
  const paulBateria = 'assets/paul/sprites/bateria-idle_02.webp';
  const imgPasse = h('img', { src: paulBateria, alt: '' });
  const fotoPasse = h('a', { class: 'in-foto in-foto-redonda', href: '#/perfil', 'aria-label': 'sua foto do perfil. toque pra mudar' }, imgPasse);
  let urlFoto = '';
  const carregaFoto = async () => { try { const bl = await D.metaLer('perfil-foto'); if (urlFoto) URL.revokeObjectURL(urlFoto); urlFoto = bl ? URL.createObjectURL(bl) : ''; imgPasse.src = urlFoto || paulBateria; fotoPasse.classList.toggle('com-foto', !!urlFoto); } catch { /* fica o Paul */ } };
  carregaFoto(); window.addEventListener('bt-foto-perfil', carregaFoto);
  // "sobre mim": instrumento, estilo e meta em etiquetas; tocar numa abre as opções em chips
  const pills = h('div', { class: 'in-pills', role: 'group', 'aria-label': 'sobre mim: instrumento, estilo e meta' });
  const escolherCampo = (c) => sheet(c.nome, (close) => {
    const atual = PERF.perfil()[c.k];
    const pega = (v) => { PERF.gravar(c.k, v); desenhaPills(); close(); };
    const chips = h('div', { class: 'jg-seg in-sobre-chips', role: 'group', 'aria-label': c.nome }, ...c.opcoes.map((o) => h('button', { type: 'button', class: atual === o ? 'on' : '', 'aria-pressed': String(atual === o), onclick: () => pega(o) }, o)));
    const caixa = h('div', { class: 'in-sobre' }, h('p', { class: 'in-sobre-t' }, `escolha o seu ${c.nome}:`), chips);
    if (c.livre) { // "adicionar": a pessoa escreve o dela (até 20 letras); as opções da lista continuam ali
      const erro = h('p', { class: 'in-sobre-erro', role: 'alert' });
      const campo = h('input', { class: 'field in-sobre-in', type: 'text', maxlength: c.max, autocomplete: 'off', placeholder: `escreva o seu (até ${c.max} letras)`, 'aria-label': `adicionar ${c.nome}`, value: atual && !c.opcoes.includes(atual) ? atual : '' });
      const ok = h('button', { type: 'button', class: 'btn small primary', onclick: () => { const r = PERF.checarLivre(c.k, campo.value); if (r.erro) { erro.textContent = r.erro; return; } pega(r.valor); } }, 'ok');
      campo.addEventListener('input', () => { erro.textContent = ''; });
      campo.addEventListener('keydown', (e) => { if (e.key === 'Enter') ok.click(); });
      const linha = h('div', { class: 'in-sobre-add', hidden: !(atual && !c.opcoes.includes(atual)) }, campo, ok);
      chips.append(h('button', { type: 'button', class: `in-sobre-mais${linha.hidden ? '' : ' on'}`, onclick: () => { linha.hidden = false; campo.focus(); } }, '+ adicionar'));
      caixa.append(linha, erro);
    }
    if (atual) caixa.append(h('button', { type: 'button', class: 'btn small ghost', onclick: () => pega('') }, 'tirar'));
    return caixa;
  });
  const desenhaPills = () => { const p = PERF.perfil(); pills.replaceChildren(...PERF.CAMPOS.map((c) => h('button', { type: 'button', class: `in-pill${p[c.k] ? ' tem' : ''}`, 'aria-label': p[c.k] ? `${c.nome}: ${p[c.k]}. tocar pra trocar` : `escolher ${c.nome}`, onclick: () => escolherCampo(c) }, p[c.k] ? `${c.nome}: ${p[c.k]}` : `+ ${c.nome}`))); };
  desenhaPills();
  const passe = h('section', { class: 'in-passe', 'aria-label': 'passe do aluno' },
    h('i', { class: 'in-furo', 'aria-hidden': 'true' }),
    h('p', { class: 'in-tag' }, 'beaterista · passe do aluno'),
    h('div', { class: 'in-esq' }, h('h1', { class: 'in-nome' }, nome || 'aluno'), pills),
    h('p', { class: 'in-favt' }, 'bandas e cantores favoritos'),
    slots,
    fotoPasse,
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

  // roleta grátis diária: o giro de hoje (1 por dia, entregue ao abrir o Stars) está esperando, já foi girado ou ainda não foi pego
  const st = { ...L.emptyState(), ...D.albumDados() }; const idDia = L.checkinId(todayKey());
  const girou = !!(st.opened && st.opened[idDia]); const esperando = !!(st.granted || []).includes(idDia) && !girou;
  const roleta = h('section', { class: `in-roleta${girou ? ' feito' : ''}` },
    h('img', { class: 'in-roleta-ic', src: 'assets/inicio/roleta.png', alt: '', 'aria-hidden': 'true', onerror: (e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'assets/icons/tambor-96.png'; } }), // ícone da roleta: a Bea vai gerar um (assets/inicio/roleta.png); até lá, o tambor
    h('span', { class: 'in-card-tx' }, h('small', {}, 'roleta grátis diária'),
      h('b', {}, girou ? 'você já girou hoje!' : esperando ? 'seu giro de hoje está esperando!' : 'seu giro grátis de hoje'),
      h('em', {}, girou ? 'volte amanhã pra mais um giro, ou junte estrelas pra girar de novo' : 'todo dia tem um giro de presente')),
    h('span', { class: 'in-roleta-bts' }, h('a', { class: 'in-btn', href: '#/album/Pacotes' }, girou ? 'ver ▶' : 'girar ▶'), h('button', { type: 'button', class: 'in-mais', onclick: () => abrirComoGanhar(faltam) }, '★ quero ', h('b', { class: 'in-mais-plus', 'aria-hidden': 'true' }, '+'), ' estrelas')));

  // novidades do Paul: o que aparece vem de assets/novidades.json (a Bea ou eu editamos o arquivo; não precisa mexer no código)
  const rail = h('div', { class: 'in-rail', role: 'list' });
  const novidades = h('section', { class: 'in-nov', hidden: '' }, h('h3', {}, 'novidades do Paul', h('span', {}, 'deslize →')), rail);
  fetch('assets/novidades.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : [])).then((l) => {
    if (!Array.isArray(l) || !l.length) return;
    rail.replaceChildren(...l.map((n) => h('a', { class: `in-nv c-${n.cor || 'azul'}`, role: 'listitem', href: n.href, target: n.externo ? '_blank' : null, rel: n.externo ? 'noopener' : null },
      h('small', {}, n.tag), h('b', {}, n.titulo), h('p', {}, n.texto), h('span', { class: 'in-nv-bt' }, n.botao || 'ver')))); novidades.hidden = false;
  }).catch(() => { /* sem internet: a seção fica escondida */ });

  const atalhos = h('div', { class: 'in-prox' },
    h('a', { href: '#/jogos' }, h('b', {}, 'jogos'), 'Hero Drum, Piano Hero, Beat Hero e mais'),
    h('a', { href: '#/estudos' }, h('b', {}, 'estudos'), 'aulas do Paul e dicionário'),
    h('a', { href: '#/tocar' }, h('b', {}, 'palco'), 'bateria, violão, teclado e xilofone'),
    h('a', { href: '#/lojinha' }, h('b', {}, 'lojinha'), 'cards e apostilas pra imprimir'));

  // aviso de versão nova: aparece aqui dentro do Início (cartão no topo) e o aviso solto do topo some nesta aba (css/inicio.css)
  const botAtu = h('button', { type: 'button', class: 'in-btn in-atu-bt', onclick: (e) => { e.currentTarget.disabled = true; atualizarAgora(); } }, 'atualizar');
  const avisoAtu = h('section', { class: 'in-atu', role: 'status', 'aria-live': 'polite', hidden: true }, h('span', { 'aria-hidden': 'true' }, '✨'), h('p', {}, h('b', {}, 'tem coisa nova no app!'), h('small', {}, 'toque pra atualizar e ver as novidades')), botAtu);
  const mostraAtu = () => { avisoAtu.hidden = false; };
  try { if (document.querySelector('.atualiza-bar, .top-atu.tem-novo')) mostraAtu(); const tinha = !!navigator.serviceWorker.controller; navigator.serviceWorker.addEventListener('controllerchange', () => { if (tinha) mostraAtu(); }); } catch { /* sem service worker */ }
  host.append(h('div', { class: 'inicio' }, avisoAtu, passe, tres, continuar, roleta, novidades, atalhos));
  return () => { window.removeEventListener('bt-foto-perfil', carregaFoto); if (urlFoto) URL.revokeObjectURL(urlFoto); };
}

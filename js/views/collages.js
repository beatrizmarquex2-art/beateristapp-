// Colagens: as artes prontas (stories e posts) e os pedidos de novas artes para o Claude.
import { h } from '../util.js';
import * as store from '../store.js';
import { banner, sheet, toast, confirmSheet } from '../ui.js';

export const COLLAGES = [
  ['01-trajetoria-capa', 'trajetória · capa'], ['02-desde-sempre', 'desde sempre'], ['03-o-cajon', 'o cajón'],
  ['04-meu-nome-no-cartaz', 'meu nome no cartaz'], ['05-virei-professora', 'virei professora'], ['06-a-praca-lotou', 'a praça lotou'],
  ['07-abri-a-minha-escola', 'abri a minha escola'], ['08-dez-anos-depois', 'dez anos depois · Vera'], ['09-na-tv', 'na TV · SBT'],
  ['10-a-sua-vez', 'a sua vez'], ['11-colagem-zine', 'colagem zine'], ['12-notas-que-viram-aula', 'notas que viram aula'],
  ['13-o-app-esta-nascendo', 'o app está nascendo'], ['14-story-so-groove', 'story · só groove'],
];
export const FORMATS = [['story', 'story 9:16'], ['post', 'post 4:5'], ['carrossel', 'carrossel 4:5']];
const src = (id, small) => `assets/colagens/${id}${small ? '-p' : ''}.webp`;

/** Texto pronto para colar numa conversa com o Claude. */
export function requestText(d) {
  const fmt = (FORMATS.find(([k]) => k === d.format) || FORMATS[0])[1];
  return [
    'oi, Claude! é a Bea (Beaterista). quero uma colagem nova no mesmo estilo zine das outras (papel rasgado, fita, textura sempre no fundo, nada arredondado).',
    `formato: ${fmt}`,
    d.idea ? `ideia: ${d.idea}` : '',
    d.text ? `texto da arte: ${d.text}` : '',
    d.photos ? `fotos: ${d.photos} (vou anexar aqui)` : 'fotos: vou anexar aqui',
    d.base ? `parecida com: ${d.base}` : '',
    'me manda primeiro pra eu ver, e junto o arquivo pra editar no Canva.',
  ].filter(Boolean).join('\n');
}
export const claudeLink = (text) => `https://claude.ai/new?q=${encodeURIComponent(text)}`;

export function tabs(on) {
  return h('nav', { class: 'chips lib-tabs', 'aria-label': 'Feed' },
    h('a', { class: `lib-tab${on === 'videos' ? ' on' : ''}`, href: '#/feed', 'aria-current': on === 'videos' ? 'page' : null }, 'vídeos'),
    h('a', { class: `lib-tab${on === 'colagens' ? ' on' : ''}`, href: '#/feed/colagens', 'aria-current': on === 'colagens' ? 'page' : null }, 'colagens'));
}

async function saveToPhone(id, title) {
  try {
    const blob = await (await fetch(src(id))).blob();
    const file = new File([blob], `${id}.webp`, { type: 'image/webp' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title }); return; }
  } catch { /* cancelou ou sem rede: cai no download */ }
  const a = h('a', { href: src(id), download: `${id}.webp` }); document.body.append(a); a.click(); a.remove();
}

function viewer(id, title) {
  sheet(title, (close) => h('div', { class: 'sheet-body' },
    h('img', { class: 'cl-full', src: src(id), alt: `Colagem: ${title}`, decoding: 'async' }),
    h('div', { class: 'row end' },
      h('button', { class: 'btn ghost', type: 'button', onclick: () => { close(); requestSheet({ base: title }); } }, 'pedir variação'),
      h('button', { class: 'btn primary', type: 'button', onclick: () => saveToPhone(id, title) }, 'salvar / compartilhar'))));
}

function requestSheet(seed = {}, rec = null) {
  const d = { format: 'story', ...seed, ...(rec ? rec.data : {}) };
  sheet(rec ? 'Pedido de colagem' : 'Pedir nova colagem', (close) => {
    const idea = h('textarea', { rows: 3, maxlength: 600, placeholder: 'ex.: anunciar vagas de cajón para crianças', 'aria-label': 'Ideia' }, d.idea || '');
    const text = h('textarea', { rows: 2, maxlength: 400, placeholder: 'o que vai escrito na arte (pode deixar comigo)', 'aria-label': 'Texto da arte' }, d.text || '');
    const photos = h('input', { type: 'text', maxlength: 200, placeholder: 'ex.: a do casaco e a do palco', value: d.photos || '', 'aria-label': 'Fotos' });
    let format = d.format;
    const fmtRow = h('div', { class: 'chips' });
    const drawFmt = () => fmtRow.replaceChildren(...FORMATS.map(([k, t]) => h('button', { type: 'button', class: `lib-tab${format === k ? ' on' : ''}`, 'aria-pressed': String(format === k), onclick: () => { format = k; drawFmt(); } }, t)));
    drawFmt();
    const data = () => ({ idea: idea.value.trim(), text: text.value.trim(), photos: photos.value.trim(), format, base: d.base || '' });
    const send = async () => {
      const v = data();
      if (!v.idea) { toast('escreve a ideia em uma frase, só isso.'); idea.focus(); return; }
      const msg = requestText(v);
      if (rec) await store.upsert('pedido', rec.id, v); else await store.upsert('pedido', null, { ...v, status: 'pedido' });
      try { await navigator.clipboard.writeText(msg); } catch { /* sem permissão de cópia */ }
      open(claudeLink(msg), '_blank', 'noopener');
      toast('pedido guardado e copiado. no Claude, anexa as fotos e envia.');
      close();
    };
    return h('div', { class: 'sheet-body' },
      d.base ? h('p', { class: 'muted' }, `variação de: ${d.base}`) : null,
      h('label', { class: 'field' }, h('span', {}, 'ideia'), idea),
      h('div', { class: 'field' }, h('span', {}, 'formato'), fmtRow),
      h('label', { class: 'field' }, h('span', {}, 'texto da arte'), text),
      h('label', { class: 'field' }, h('span', {}, 'quais fotos'), photos),
      h('div', { class: 'row end' },
        rec ? h('button', { class: 'btn ghost danger-txt', type: 'button', onclick: async () => { if (await confirmSheet('Apagar pedido?', rec.data.idea, 'Apagar')) { await store.remove(rec.id); close(); } } }, 'apagar') : null,
        h('button', { class: 'btn primary', type: 'button', onclick: send }, 'enviar pro Claude')),
      h('p', { class: 'muted' }, 'abre uma conversa nova no Claude com o pedido já escrito (e copiado). lá você anexa as fotos e envia. quando a arte chegar, marque como "chegou".'));
  });
}

export function mount(host) {
  const grid = h('div', { class: 'cl-grid' }, COLLAGES.map(([id, title], i) =>
    h('button', { class: `cl-item tilt${i % 3}`, type: 'button', onclick: () => viewer(id, title) },
      h('img', { src: src(id, true), alt: '', width: 360, height: 640, loading: 'lazy', decoding: 'async' }),
      h('span', {}, title))));
  const reqs = h('section', { class: 'card pad' });
  const draw = () => {
    const all = store.list('pedido').sort((a, b) => (a.data.status === 'chegou') - (b.data.status === 'chegou') || b.updated_at - a.updated_at);
    reqs.replaceChildren(
      h('div', { class: 'row between' }, h('h2', { class: 'tag' }, 'pedidos'), h('button', { class: 'btn small primary', type: 'button', onclick: () => requestSheet() }, '+ pedir colagem')),
      ...(all.length ? all.map((r) => h('div', { class: `cl-req${r.data.status === 'chegou' ? ' done' : ''}` },
        h('button', { class: 'link cl-req-t', type: 'button', onclick: () => requestSheet({}, r) }, r.data.idea || 'sem título', h('small', {}, ` · ${(FORMATS.find(([k]) => k === r.data.format) || FORMATS[0])[1]}`)),
        h('button', { class: `fd-pill ${r.data.status === 'chegou' ? 'publicado' : 'pendente'}`, type: 'button', 'aria-label': `Status: ${r.data.status}. Tocar para trocar.`, onclick: () => store.upsert('pedido', r.id, { status: r.data.status === 'chegou' ? 'pedido' : 'chegou' }) }, r.data.status)))
        : [h('p', { class: 'muted' }, 'quer uma arte nova? toca em "+ pedir colagem", escreve a ideia e o app abre o Claude com tudo pronto.')]));
  };
  host.append(banner('Colagens', 'as artes prontas para postar'), tabs('colagens'), reqs, grid,
    h('p', { class: 'pad-x lib-note' }, 'toque numa arte para ver grande, salvar no celular ou pedir uma variação. os arquivos editáveis no Canva ficam no zip que a gente gerou.'));
  draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === 'pedido') draw(); });
}

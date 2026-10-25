// Feed Beaterista: mural PRIVADO de produção de conteúdo (não é rede social).
// ideia → editando → pronto → publicado; uma legenda base + versões por rede; status de cada rede é marcado pela Bea.
// Abrir o compartilhamento NUNCA marca como publicado. Vídeos brutos não são enviados: guarda-se o link do arquivo.
import { h, icon, todayKey } from '../util.js';
import * as store from '../store.js';
import { banner, sheet, toast, confirmSheet, stars } from '../ui.js';
import { BRANDS } from '../modules.js';
import { pickImages, saveImage, imageUrl } from './mural.js';
import { tabs } from './collages.js';

export const STAGES = [['ideia', 'ideias'], ['editando', 'editando'], ['pronto', 'pronto'], ['publicado', 'publicado']];
export const NETS = [['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['youtube', 'YouTube']];
const NET_STATUS = ['pendente', 'agendado', 'publicado'];
const TAGS = { Beaterista: '#bateria #aulasdebateria #beaterista #drummer', 'Pad Gorilla': '#padgorilla #bateria #estudodebateria', Spark: '#sparkcajons #cajon #percussao', Nagano: '#naganodrums #bateria #drummer', Pessoal: '#musica #baterista' };

const posts = () => store.list('post');
const stageIdx = (s) => STAGES.findIndex(([k]) => k === s);
/** Cartões da sprint "3 por dia": os que estão mais perto de sair (editando antes de ideia), mais antigos primeiro. */
export const sprint = (list) => list.filter((p) => ['editando', 'ideia'].includes(p.data.stage)).sort((a, b) => stageIdx(b.data.stage) - stageIdx(a.data.stage) || (a.data.created || 0) - (b.data.created || 0)).slice(0, 3);
export const allPublished = (d) => NETS.every(([k]) => !(d.targets || []).includes(k) || (d.status || {})[k] === 'publicado');

function thumb(d) {
  const box = h('span', { class: 'fd-thumb', 'aria-hidden': 'true' }, icon('photo', 22));
  if (d.thumbId) imageUrl(d.thumbId).then((u) => { if (u) box.replaceChildren(h('img', { src: u, alt: '' })); });
  return box;
}

function editor(rec, close) {
  const d = rec ? rec.data : { stage: 'ideia', brand: 'Beaterista', targets: NETS.map(([k]) => k), captions: {}, status: {} };
  const title = h('input', { type: 'text', value: d.title || '', placeholder: 'ex.: groove do Believer em 1 minuto', maxlength: 100 });
  const stage = h('select', { 'aria-label': 'etapa' }, STAGES.map(([k, t]) => h('option', { value: k, selected: k === d.stage }, t)));
  const brand = h('select', { 'aria-label': 'marca ou campanha' }, BRANDS.map((b) => h('option', { value: b, selected: b === d.brand }, b)));
  const due = h('input', { type: 'date', value: d.due || '', 'aria-label': 'prazo ou data agendada' });
  const file = h('input', { type: 'url', value: d.file || '', placeholder: 'link do vídeo (Drive, iCloud…)' });
  const script = h('textarea', { rows: 3, placeholder: 'roteiro / ideia de gancho' }, d.script || '');
  const base = h('textarea', { rows: 3, placeholder: 'legenda base' }, d.caption || '');
  const tags = h('input', { type: 'text', value: d.hashtags || TAGS[d.brand] || '', placeholder: '#hashtags' });
  brand.addEventListener('change', () => { if (!tags.value.trim() || Object.values(TAGS).includes(tags.value)) tags.value = TAGS[brand.value] || ''; });
  let thumbId = d.thumbId || null;
  const thumbBtn = h('button', { class: 'btn small', type: 'button', onclick: async () => { const [b] = await pickImages(false); if (b) { thumbId = await saveImage(b); thumbBtn.textContent = 'capa escolhida ✓'; } } }, thumbId ? 'trocar capa' : 'escolher capa');
  const per = {}; const targets = new Set(d.targets || []); const status = { ...(d.status || {}) };
  const netBox = h('div', { class: 'fd-nets' }, NETS.map(([k, label]) => {
    const on = h('input', { type: 'checkbox', class: 'switch', checked: targets.has(k), 'aria-label': `postar no ${label}`, onchange: (e) => { e.target.checked ? targets.add(k) : targets.delete(k); } });
    per[k] = h('textarea', { rows: 2, placeholder: `legenda do ${label} (vazio = usa a base)` }, (d.captions || {})[k] || '');
    const st = h('div', { class: 'seg fd-st' });
    const drawSt = () => st.replaceChildren(...NET_STATUS.map((x) => h('button', { type: 'button', class: (status[k] || 'pendente') === x ? 'on' : '', 'aria-pressed': String((status[k] || 'pendente') === x), onclick: () => { status[k] = x; drawSt(); } }, x)));
    drawSt();
    return h('fieldset', { class: 'fd-net' }, h('legend', {}, label), h('label', { class: 'row between met-sw' }, h('span', {}, 'vai para essa rede'), on),
      per[k], h('button', { class: 'btn small ghost', type: 'button', onclick: () => { per[k].value = base.value; } }, 'copiar da base'), st);
  }));
  const submit = async () => {
    if (!title.value.trim()) { toast('dá um nome para o conteúdo.'); title.focus(); return; }
    const data = { title: title.value.trim(), stage: stage.value, brand: brand.value, due: due.value, file: file.value.trim(), script: script.value, caption: base.value, hashtags: tags.value, captions: Object.fromEntries(NETS.map(([k]) => [k, per[k].value])), targets: [...targets], status, thumbId, created: d.created || Date.now() };
    if (data.stage !== 'publicado' && data.targets.length && allPublished(data)) data.stage = 'publicado';
    await store.upsert('post', rec ? rec.id : null, data); close(); toast('salvo ✓');
  };
  return h('form', { class: 'sheet-body', onsubmit: (e) => { e.preventDefault(); submit(); } },
    h('label', { class: 'field' }, h('span', {}, 'título'), title),
    h('div', { class: 'grid2' }, h('label', { class: 'field' }, h('span', {}, 'etapa'), stage), h('label', { class: 'field' }, h('span', {}, 'marca'), brand)),
    h('div', { class: 'grid2' }, h('label', { class: 'field' }, h('span', {}, 'prazo / agendado'), due), h('div', { class: 'field' }, h('span', {}, 'capa'), thumbBtn)),
    h('label', { class: 'field' }, h('span', {}, 'arquivo do vídeo'), file, h('small', {}, 'o vídeo bruto não sobe para o app: guarde o link de onde ele está.')),
    h('label', { class: 'field' }, h('span', {}, 'roteiro'), script),
    h('label', { class: 'field' }, h('span', {}, 'legenda base'), base), h('label', { class: 'field' }, h('span', {}, 'hashtags'), tags),
    netBox,
    h('div', { class: 'row end' }, rec ? h('button', { class: 'btn ghost danger-txt', type: 'button', onclick: async () => { if (await confirmSheet('Apagar conteúdo?', d.title, 'Apagar')) { await store.remove(rec.id); close(); } } }, 'apagar') : null, h('button', { class: 'btn primary', type: 'submit' }, 'salvar')));
}

async function share(d, net) {
  const text = `${(d.captions || {})[net] || d.caption || ''}\n\n${d.hashtags || ''}`.trim();
  try { await navigator.clipboard.writeText(text); toast('legenda copiada. o status continua como está até você marcar.'); } catch { /* sem permissão de cópia */ }
  if (navigator.share) { try { await navigator.share({ text }); } catch { /* cancelou */ } }
}

export function mount(host) {
  let filter = 'todos';
  const chips = h('div', { class: 'chips lib-tabs fd-stages' });
  const sprintBox = h('section', { class: 'card pad' });
  const funnel = h('section', { class: 'card pad fd-funnel' });
  const list = h('div', { class: 'fd-list' });
  const draw = () => {
    const all = posts(); const count = Object.fromEntries(STAGES.map(([k]) => [k, all.filter((p) => p.data.stage === k).length]));
    chips.replaceChildren(...[['todos', `todos · ${all.length}`], ...STAGES.map(([k, t]) => [k, `${t} · ${count[k]}`])].map(([k, t]) =>
      h('button', { type: 'button', class: `lib-tab${filter === k ? ' on' : ''}`, 'aria-pressed': String(filter === k), onclick: () => { filter = k; draw(); } }, t)));
    const top = Math.max(1, ...STAGES.map(([k]) => count[k]));
    funnel.replaceChildren(h('h2', { class: 'tag' }, 'do gravado ao publicado'),
      h('ul', { class: 'hbars', 'aria-label': 'Conteúdos em cada etapa' }, STAGES.map(([k, t]) => h('li', { title: `${t}: ${count[k]}` },
        h('span', { class: 'hb-row' }, h('span', { class: 'hb-lab' }, t), h('span', { class: 'hb-n' }, String(count[k]))),
        h('span', { class: 'hb-track', 'aria-hidden': 'true' }, h('i', { style: { width: `${Math.round(count[k] / top * 100)}%` } }))))));
    const sp = sprint(all);
    sprintBox.replaceChildren(h('div', { class: 'row between' }, h('h2', { class: 'tag' }, '3 de hoje'), h('a', { class: 'link', href: '#/foco' }, 'abrir cronômetro')),
      sp.length ? h('ol', { class: 'lab-list' }, sp.map((p) => h('li', {}, h('button', { class: 'link fd-link', type: 'button', onclick: () => sheet('Conteúdo', (close) => editor(p, close)) }, p.data.title), h('small', {}, ` · ${p.data.stage}`))))
        : h('p', { class: 'muted' }, 'nada em ideia ou edição. que tal anotar 3 vídeos que já estão gravados?'),
      h('p', { class: 'muted' }, 'começar é a parte difícil: um vídeo por bloco de 25 minutos.'));
    const shown = all.filter((p) => filter === 'todos' || p.data.stage === filter).sort((a, b) => stageIdx(a.data.stage) - stageIdx(b.data.stage) || (a.data.due || '9').localeCompare(b.data.due || '9') || b.updated_at - a.updated_at);
    list.replaceChildren(...(shown.length ? shown.map((p, i) => {
      const d = p.data; const k = stageIdx(d.stage); const late = d.due && d.due < todayKey() && d.stage !== 'publicado';
      return h('article', { class: `fd-card tilt${i % 3}` },
        h('button', { class: 'fd-open', type: 'button', onclick: () => sheet('Conteúdo', (close) => editor(p, close)) }, thumb(d),
          h('span', { class: 'fd-info' }, h('span', { class: 'lib-kicker' }, d.stage, ' · ', d.brand || ''), h('strong', {}, d.title), d.due ? h('small', { class: late ? 'danger-txt' : '' }, `${late ? 'atrasado · ' : ''}${d.due.split('-').reverse().join('/')}`) : null)),
        h('div', { class: 'fd-nets-row' }, NETS.filter(([n]) => (d.targets || []).includes(n)).map(([n, label]) =>
          h('button', { type: 'button', class: `fd-pill ${(d.status || {})[n] || 'pendente'}`, 'aria-label': `${label}: ${(d.status || {})[n] || 'pendente'}. Copiar legenda e compartilhar.`, onclick: () => share(d, n) }, label, ' · ', (d.status || {})[n] || 'pendente'))),
        h('div', { class: 'fd-move' },
          h('button', { class: 'icon-btn', type: 'button', disabled: k <= 0, 'aria-label': 'voltar etapa', onclick: () => store.upsert('post', p.id, { stage: STAGES[k - 1][0] }) }, icon('back', 20)),
          h('button', { class: 'btn small', type: 'button', disabled: k >= STAGES.length - 1, onclick: async (e) => { const btn = e.currentTarget; await store.upsert('post', p.id, { stage: STAGES[k + 1][0] }); if (k + 1 === 3) stars(btn); } }, k < STAGES.length - 1 ? `→ ${STAGES[k + 1][1]}` : 'publicado ✓')));
    }) : [h('div', { class: 'empty' }, h('p', { class: 'hand' }, filter === 'todos' ? 'o mural está vazio.' : 'nada nessa etapa.'), h('p', { class: 'muted' }, 'anote seus vídeos gravados aqui e leve cada um até "publicado".'))]));
  };
  host.append(banner('Feed Beaterista', 'do vídeo gravado ao post publicado'), tabs('videos'), chips, funnel, sprintBox, list,
    h('button', { class: 'btn primary wide', type: 'button', onclick: () => sheet('Novo conteúdo', (close) => editor(null, close)) }, '+ novo conteúdo'),
    h('p', { class: 'pad-x lib-note' }, 'privado. compartilhar só abre o menu do iPhone com a legenda copiada: o status de cada rede você marca quando postar de verdade.'));
  draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === 'post') draw(); });
}

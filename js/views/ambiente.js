// Estúdio de Ambiente: mixer de sons (gerados aqui, funcionam offline), misturas prontas e suas, timer pra dormir
// e seus links do YouTube tocando num mini-player que continua quando você troca de tela.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import { banner, toast, sheet, confirmSheet } from '../ui.js';
import * as A from '../ambient.js';
import { CHANNELS, MIXES, SLEEP, clean, isSilent, ytEmbed } from '../ambient-logic.js';

const KEY = 'setting-ambiente';
const saved = () => clean((store.get(KEY) || { data: {} }).data.mix || MIXES[0].mix);
let saveT = 0;
const remember = (mix) => { clearTimeout(saveT); saveT = setTimeout(() => store.upsert('setting', KEY, { mix }), 600); };

export function mount(host) {
  const body = h('div');
  const draw = () => {
    const st = A.state(); const mix = st.playing ? st.mix : { ...saved(), ...st.mix };
    const mine = store.list('ambient').sort((a, b) => a.data.name.localeCompare(b.data.name, 'pt-BR'));
    const links = store.list('ytlink').sort((a, b) => (b.data.created || 0) - (a.data.created || 0));
    const choose = (m) => { A.play(m); remember(clean(m)); };
    const sliders = CHANNELS.map(([id, label]) => {
      const v = Math.round((mix[id] || 0) * 100);
      const input = h('input', { type: 'range', min: 0, max: 100, step: 1, value: String(v), 'aria-label': `Volume: ${label}` });
      input.addEventListener('input', () => { const n = Number(input.value) / 100; A.setLevel(id, n); remember({ ...A.state().mix, [id]: n }); input.closest('.amb-ch').classList.toggle('on', n > 0); });
      return h('label', { class: `amb-ch${v ? ' on' : ''}` }, h('span', {}, label), input);
    });
    const url = h('input', { type: 'url', inputmode: 'url', placeholder: 'link do YouTube (vídeo ou playlist)', 'aria-label': 'Link do YouTube' });
    const title = h('input', { type: 'text', maxlength: 80, placeholder: 'nome (ex.: lo-fi pra estudar)', 'aria-label': 'Nome do link' });
    body.replaceChildren(
      h('section', { class: 'card pad amb-main' },
        h('div', { class: 'row amb-top' },
          h('button', { class: `bl-play${st.playing ? ' on' : ''}`, type: 'button', 'aria-label': st.playing ? 'Parar ambiente' : 'Tocar ambiente', onclick: () => (st.playing ? A.stop() : (isSilent(mix) ? choose(MIXES[0].mix) : choose(mix))) }, icon(st.playing ? 'stop' : 'play', 28)),
          h('p', { class: 'amb-now' }, st.playing ? 'tocando' : 'parado', h('small', { class: 'muted' }, ' · funciona sem internet'))),
        h('div', { class: 'chips lib-tabs amb-mixes' }, ...[...MIXES.map((m) => [m.id, m.name, m.mix, null]), ...mine.map((r) => [r.id, r.data.name, r.data.mix, r])].map(([id, name, m, r]) =>
          h('button', { type: 'button', class: 'lib-tab', onclick: () => choose(m), oncontextmenu: (e) => { if (!r) return; e.preventDefault(); confirmSheet('Apagar mistura?', name, 'Apagar').then((ok) => ok && store.remove(r.id)); } }, name, r ? h('small', {}, ' · minha') : null))),
        h('div', { class: 'amb-sliders' }, ...sliders),
        h('div', { class: 'row tk-line' }, h('span', { class: 'tp-lab' }, 'dormir em'),
          h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': 'Timer pra dormir' }, ...SLEEP.map((m) => {
            const on = m === 0 ? !st.sleepAt : st.sleepAt && Math.abs(st.sleepAt - Date.now() - m * 60000) < 60000;
            return h('button', { type: 'button', class: `lib-tab${on ? ' on' : ''}`, role: 'radio', 'aria-checked': String(!!on), onclick: () => { A.setSleep(m); if (m && !A.state().playing) choose(mix); } }, m ? `${m} min` : 'desligado');
          }))),
        h('button', { class: 'btn small', type: 'button', onclick: () => sheet('Salvar mistura', (close) => {
          const name = h('input', { type: 'text', maxlength: 40, placeholder: 'ex.: noite de estudo', 'aria-label': 'Nome da mistura' });
          return h('div', { class: 'sheet-body' }, h('label', { class: 'field' }, h('span', {}, 'nome'), name), h('button', { class: 'btn primary', type: 'button', onclick: async () => {
            const n = name.value.trim(); if (!n) return; const m = clean(A.state().playing ? A.state().mix : mix); if (isSilent(m)) { toast('suba algum som antes de salvar'); return; }
            await store.upsert('ambient', null, { name: n, mix: m }); close(); toast('mistura salva ✓', { ms: 1400 });
          } }, 'salvar'));
        }) }, 'salvar esta mistura')),
      h('section', { class: 'card pad amb-yt-card' },
        h('h3', {}, 'YouTube'), h('p', { class: 'muted' }, 'precisa de internet. toca num mini-player que continua enquanto você usa o app; com a tela bloqueada o iPhone pode pausar.'),
        h('div', { class: 'bt-form' }, url, title, h('button', { class: 'btn primary', type: 'button', onclick: async () => {
          if (!ytEmbed(url.value)) { toast('esse link não é de vídeo ou playlist do YouTube'); return; }
          await store.upsert('ytlink', null, { url: url.value.trim(), title: title.value.trim() || 'YouTube', created: Date.now() }); url.value = ''; title.value = '';
        } }, '+ guardar link')),
        links.length ? h('ul', { class: 'amb-links' }, ...links.map((r) => h('li', { class: st.yt && st.yt.url === r.data.url ? 'on' : '' },
          h('button', { class: 'btn small', type: 'button', 'aria-label': `Tocar ${r.data.title}`, onclick: () => A.playYT(r.data.url, r.data.title) }, icon('play', 14)),
          h('span', {}, r.data.title),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Apagar ${r.data.title}`, onclick: async () => { if (await confirmSheet('Apagar link?', r.data.title, 'Apagar')) { if (st.yt && st.yt.url === r.data.url) A.closeYT(); store.remove(r.id); } } }, icon('trash', 16))))) : h('p', { class: 'muted' }, 'nenhum link ainda. guarda aqui suas playlists de lo-fi, jazz, bossa…')),
      h('p', { class: 'pad-x lib-note' }, 'os sons de ambiente são gerados aqui no aparelho (nada é baixado de outros sites). misturas prontas: toque pra tocar; nas suas, segure pra apagar. o timer pra dormir abaixa o som devagar nos últimos 20 segundos.'));
  };
  host.append(banner('Estúdio de Ambiente', 'som pra estudar, focar e descansar'), body);
  draw();
  // só redesenha quando liga/desliga, muda o timer ou o vídeo (mexer no volume não pode recriar o controle no meio do arrasto)
  const sig = (st) => `${st.playing}|${st.sleepAt}|${st.yt ? st.yt.url : ''}`;
  let last = sig(A.state());
  const off1 = A.subscribe((st) => { const k = sig(st); if (k !== last) { last = k; draw(); } });
  const off2 = store.subscribe((i) => { if (!i.kind || i.kind === 'ambient' || i.kind === 'ytlink') draw(); });
  return () => { off1(); off2(); };
}

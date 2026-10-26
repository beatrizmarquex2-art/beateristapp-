// Lembretes: o que já chegou na hora (com "ok" pra dispensar), o resto do dia, ajustes e lembretes avulsos.
import { h, todayKey } from '../util.js';
import * as store from '../store.js';
import * as Nt from '../notify.js';
import { REPEAT, LEADS, fmtMin } from '../reminders.js';
import { banner, toast, confirmSheet } from '../ui.js';

const KIND_ICON = { aula: '🥁', pagamento: '💸', treino: '⏱', avulso: '📌' };
const save = (patch) => store.upsert('setting', Nt.KEY, patch);

/** Linha de lembrete (usada aqui e no início). */
export function remItem(x, { ok = true } = {}) {
  return h('li', { class: `rm-item k-${x.kind}` },
    h('span', { class: 'rm-time' }, fmtMin(x.at)),
    h('a', { class: 'rm-t', href: x.href }, h('strong', {}, `${KIND_ICON[x.kind] || ''} ${x.title}`), x.sub ? h('small', {}, x.sub) : null),
    ok ? h('button', { class: 'btn small', type: 'button', 'aria-label': `Dispensar: ${x.title}`, onclick: () => Nt.dismiss(x.id) }, 'ok') : h('span'));
}

/** Faixa do início: só aparece quando tem lembrete na hora. */
export function homeStrip() {
  const box = h('section', { class: 'card pad rm-strip' });
  const draw = () => { const d = Nt.due(); box.hidden = !d.length; box.replaceChildren(h('div', { class: 'row between' }, h('h2', { class: 'tag' }, 'lembretes'), h('a', { class: 'link', href: '#/lembretes' }, 'ver todos')), h('ul', { class: 'rm-list' }, ...d.slice(0, 4).map((x) => remItem(x)))); };
  draw();
  const off1 = Nt.subscribe(draw); const off2 = store.subscribe((i) => { if (!i.kind || i.id === Nt.KEY) draw(); });
  box.unsub = () => { off1(); off2(); };
  return box;
}

export function mount(host) {
  const body = h('div');
  const text = h('input', { type: 'text', maxlength: 120, placeholder: 'ex.: mandar o plano da Ana, trocar a pele da caixa', 'aria-label': 'Lembrete' });
  const date = h('input', { type: 'date', value: todayKey(), 'aria-label': 'Data' });
  const time = h('input', { type: 'time', value: '09:00', 'aria-label': 'Hora' });
  const rep = h('select', { 'aria-label': 'Repetir' }, ...Object.entries(REPEAT).map(([v, t]) => h('option', { value: v }, t)));
  const add = async () => {
    const t = text.value.trim(); if (!t) { toast('escreve o lembrete'); return; }
    await store.upsert('reminder', null, { text: t, date: date.value || todayKey(), time: time.value || '09:00', repeat: rep.value, created: Date.now() });
    text.value = ''; toast('lembrete criado ✓', { ms: 1400 });
  };
  const toggle = (label, on, onChange, extra) => h('div', { class: 'rm-opt' }, h('label', { class: 'rm-sw' }, h('input', { type: 'checkbox', checked: on ? '' : null, onchange: (e) => onChange(e.target.checked) }), h('span', {}, label)), on ? extra : null);
  const timeIn = (v, onChange, aria) => { const i = h('input', { type: 'time', value: v, 'aria-label': aria }); i.addEventListener('change', () => onChange(i.value)); return i; };
  const draw = () => {
    const c = Nt.cfg(); const all = Nt.today(); const now = Nt.nowMin(); const dis = (c.dismissed || {})[todayKey()] || [];
    const due = all.filter((x) => x.at <= now && !dis.includes(x.id)); const later = all.filter((x) => x.at > now);
    const perm = Nt.permission();
    const mine = store.list('reminder').sort((a, b) => (a.data.time || '').localeCompare(b.data.time || ''));
    body.replaceChildren(
      h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'agora'),
        due.length ? h('ul', { class: 'rm-list' }, ...due.map((x) => remItem(x))) : h('p', { class: 'muted' }, 'nada pendente agora ✓')),
      later.length ? h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'mais tarde hoje'), h('ul', { class: 'rm-list' }, ...later.map((x) => remItem(x, { ok: false })))) : null,
      h('section', { class: 'card pad rm-notif' }, h('h2', { class: 'tag' }, 'notificações'),
        perm === 'granted' ? toggle('avisar com notificação do celular', c.on, (v) => save({ on: v }))
          : perm === 'denied' ? h('p', { class: 'muted' }, 'as notificações estão bloqueadas. libere em Ajustes do iPhone → Notificações → Beaterista.')
            : perm === 'unsupported' ? h('p', { class: 'muted' }, 'esse navegador não mostra notificações. no iPhone: adicione o app à Tela de Início e abra por lá.')
              : h('button', { class: 'btn primary', type: 'button', onclick: async () => { const r = await Nt.askPermission(); toast(r === 'granted' ? 'notificações ligadas ✓' : 'sem permissão: os lembretes ficam só dentro do app'); draw(); Nt.tick(); } }, 'ativar notificações'),
        h('p', { class: 'muted rm-note' }, 'o número aparece no ícone do app e o aviso chega com o app aberto ou minimizado há pouco. com o app totalmente fechado o iPhone não deixa o aviso sair sem um servidor de push (dá pra ligar depois).')),
      h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'avisar de'),
        toggle('aula chegando', c.lessons, (v) => save({ lessons: v }), h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': 'Antecedência' }, ...LEADS.map((m) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(c.lead === m), class: `lib-tab${c.lead === m ? ' on' : ''}`, onclick: () => save({ lead: m }) }, `${m} min antes`)))),
        toggle('mensalidade pendente', c.pay, (v) => save({ pay: v }), h('div', { class: 'row rm-inline' }, h('label', {}, 'vence dia ', (() => { const i = h('input', { type: 'number', min: 1, max: 28, value: String(c.payDay), 'aria-label': 'Dia de vencimento', class: 'rm-num' }); i.addEventListener('change', () => save({ payDay: Math.min(28, Math.max(1, Number(i.value) || 10)) })); return i; })()), h('label', {}, ' avisar às ', timeIn(c.payTime, (v) => save({ payTime: v }), 'Hora do aviso de mensalidade')))),
        toggle('treino do dia (se ainda não registrou)', c.study, (v) => save({ study: v }), h('div', { class: 'row rm-inline' }, h('label', {}, 'avisar às ', timeIn(c.studyTime, (v) => save({ studyTime: v }), 'Hora do aviso de treino'))))),
      h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'meus lembretes'),
        mine.length ? h('ul', { class: 'rm-list' }, ...mine.map((r) => h('li', { class: 'rm-item' }, h('span', { class: 'rm-time' }, r.data.time),
          h('span', { class: 'rm-t' }, h('strong', {}, r.data.text), h('small', {}, `${REPEAT[r.data.repeat || 'none']} · desde ${r.data.date.split('-').reverse().join('/')}`)),
          h('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Apagar: ${r.data.text}`, onclick: async () => { if (await confirmSheet('Apagar lembrete?', r.data.text, 'Apagar')) store.remove(r.id); } }, 'apagar')))) : h('p', { class: 'muted' }, 'nenhum ainda.')));
  };
  // o formulário fica fora do redesenho (não perde o que está sendo digitado quando chega sincronização)
  const form = h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'novo lembrete'),
    h('div', { class: 'bt-form rm-form' }, text, h('div', { class: 'row rm-inline' }, date, time, rep), h('button', { class: 'btn primary', type: 'button', onclick: add }, '+ lembrete')));
  host.append(banner('Lembretes', 'aula, mensalidade, treino e o que você quiser'), body, form);
  draw();
  const t = setInterval(draw, 60000);
  const off1 = Nt.subscribe(draw);
  const off2 = store.subscribe((i) => { if (!i.kind || ['student', 'makeup', 'studylog', 'reminder'].includes(i.kind) || i.id === Nt.KEY) draw(); });
  return () => { clearInterval(t); off1(); off2(); };
}

// Espaço Beaterista: alunos, agenda do dia, chamada em um toque, registro de aula e histórico.
// Dados de aluno são privados: sincronizam só com o banco protegido por login; fotos ficam só neste aparelho.
import { h, icon, todayKey, weekdayOf } from '../util.js';
import * as store from '../store.js';
import { banner, sheet, toast, stamp, confirmSheet } from '../ui.js';
import * as S from '../students-logic.js';
import { pickImages, saveImage, imageUrl } from './mural.js';
import { partnerStrip } from './home.js';
import { weekWidget } from './widgets.js';

const students = () => store.list('student').sort((a, b) => a.data.name.localeCompare(b.data.name));
const lessons = () => store.list('lesson');
const dateBR = (key) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${key}T12:00:00Z`)).replace(/\./g, '');
const monthBR = (mk) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', month: 'long' }).format(new Date(`${mk}-15T12:00:00Z`));

/** Polaroid quadrada; sem foto mostra as iniciais. */
export function avatar(st, size = 56) {
  const box = h('span', { class: 'st-photo', style: { width: `${size}px`, height: `${size}px` }, 'aria-hidden': 'true' },
    h('span', { class: 'st-ini' }, st.data.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()));
  if (st.data.photoId) imageUrl(st.data.photoId).then((u) => { if (u) box.replaceChildren(h('img', { src: u, alt: '' })); });
  return box;
}

async function squarePhoto() {
  const [blob] = await pickImages(false); if (!blob) return null;
  const src = URL.createObjectURL(blob);
  try {
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
    const side = Math.min(img.naturalWidth, img.naturalHeight); const c = document.createElement('canvas'); c.width = c.height = 600;
    c.getContext('2d').drawImage(img, (img.naturalWidth - side) / 2, Math.max(0, (img.naturalHeight - side) * 0.3), side, side, 0, 0, 600, 600);
    const sq = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.86));
    return saveImage(sq);
  } finally { URL.revokeObjectURL(src); }
}

/* ---------- chamada de hoje (usada aqui e no início) ---------- */
const ATT = { presente: 'presente', faltou: 'faltou', remarcou: 'remarcou' };
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
export function todayRoll({ compact = false } = {}) {
  const box = h('section', { class: 'card pad st-today', 'aria-label': 'Aulas de hoje' });
  const draw = () => {
    const day = todayKey(); const list = S.lessonsOn(students(), day, weekdayOf(day), store.list('makeup'));
    box.replaceChildren(
      h('div', { class: 'row between' }, h('h2', { class: 'tag st-today-tag' }, `aulas de hoje${list.length ? ` (${list.length})` : ''}`), h('a', { class: 'link', href: '#/beaterista' }, compact ? 'ver agenda ›' : `${list.length} aula${list.length === 1 ? '' : 's'}`)),
      ...(list.length ? list.map(({ student: st, time, makeup }) => {
        const rec = S.lessonOnDay(lessons(), st.id, day); const att = rec ? rec.data.attendance : null; const last = S.lastLesson(lessons(), st.id);
        const mark = async (a, el) => { if (rec) await store.upsert('lesson', rec.id, { attendance: a }); else await store.upsert('lesson', null, { studentId: st.id, date: day, attendance: a, at: Date.now() }); stamp(el); };
        return h('div', { class: 'st-roll' },
          h('a', { class: 'st-roll-main', href: `#/beaterista/aluno/${st.id}` }, avatar(st, 48),
            h('span', { class: 'st-roll-txt' }, h('strong', {}, st.data.name, h('em', { class: 'st-time' }, time || 'sem horário')),
              h('small', {}, [cap(st.data.instrument || 'bateria'), makeup ? 'reposição' : '', ATT[att] || 'aguardando', last && last.data.song ? `última: ${last.data.song}` : ''].filter(Boolean).join(' · ')))),
          h('div', { class: 'st-att', role: 'group', 'aria-label': `Chamada de ${st.data.name}` },
            [['presente', '✓', 'presente'], ['faltou', '✗', 'faltou'], ['remarcou', '↻', 'remarcou']].map(([a, sym, lbl]) =>
              h('button', { type: 'button', class: `st-att-b ${a}${att === a ? ' on' : ''}`, 'aria-pressed': String(att === a), 'aria-label': `${st.data.name}: ${lbl}`, onclick: (e) => mark(a, e.currentTarget) }, sym))));
      }) : [h('p', { class: 'hand muted' }, students().length ? 'sem aulas hoje.' : 'cadastre seus alunos para a agenda aparecer aqui.')]));
  };
  draw();
  box.unsub = store.subscribe((i) => { if (!i.kind || ['student', 'lesson', 'makeup'].includes(i.kind)) draw(); });
  return box;
}

/* ---------- ficha (criar/editar) ---------- */
function studentEditor(rec, close) {
  const d = rec ? rec.data : { schedule: [{ day: weekdayOf(todayKey()), time: '' }], active: true };
  const f = (label, el, hint) => h('label', { class: 'field' }, h('span', {}, label), el, hint ? h('small', {}, hint) : null);
  const name = h('input', { type: 'text', value: d.name || '', maxlength: 80, autocomplete: 'off' });
  const instrument = h('input', { type: 'text', value: d.instrument || 'bateria', maxlength: 40 });
  const age = h('input', { type: 'number', inputmode: 'numeric', min: 3, max: 99, value: d.age || '' });
  const phone = h('input', { type: 'tel', value: d.phone || '', placeholder: '(18) 9…', autocomplete: 'off' });
  const social = h('input', { type: 'text', value: d.social || '', placeholder: '@usuario' });
  const level = h('input', { type: 'text', value: d.level || '', placeholder: 'iniciante, intermediário…' });
  const plan = h('textarea', { rows: 2, placeholder: 'objetivo e próximos passos' }, d.plan || '');
  const fee = h('input', { type: 'number', inputmode: 'decimal', min: 0, step: '0.01', value: d.fee || '', placeholder: 'mensalidade (R$)' });
  const playlist = h('input', { type: 'url', value: (d.playlists || [])[0] || '', placeholder: 'link do Spotify ou YouTube' });
  const notes = h('textarea', { rows: 3, placeholder: 'observações privadas' }, d.notes || '');
  const minor = h('input', { type: 'checkbox', class: 'switch', checked: !!d.minor });
  const consent = h('input', { type: 'checkbox', class: 'switch', checked: !!d.consent });
  const consentRow = h('label', { class: 'row between met-sw', hidden: !d.minor }, h('span', {}, 'responsáveis autorizaram foto e dados'), consent);
  minor.addEventListener('change', () => { consentRow.hidden = !minor.checked; });
  const sched = (d.schedule || []).map((x) => ({ ...x }));
  const schedBox = h('div', { class: 'st-sched' });
  const drawSched = () => schedBox.replaceChildren(...sched.map((x, i) => h('div', { class: 'row' },
    h('select', { 'aria-label': 'dia da semana', onchange: (e) => { x.day = Number(e.target.value); } }, S.WEEKDAYS.map((w, k) => h('option', { value: k, selected: k === Number(x.day) }, w))),
    h('input', { type: 'time', value: x.time || '', 'aria-label': 'horário', onchange: (e) => { x.time = e.target.value; } }),
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'remover horário', onclick: () => { sched.splice(i, 1); drawSched(); } }, icon('x', 18)))),
    h('button', { class: 'btn small ghost', type: 'button', onclick: () => { sched.push({ day: 1, time: '' }); drawSched(); } }, '+ horário'));
  drawSched();
  const err = h('p', { class: 'form-err', 'aria-live': 'assertive' });
  const submit = async () => {
    if (!name.value.trim()) { err.textContent = 'o nome é obrigatório.'; name.focus(); return; }
    const data = { name: name.value.trim(), instrument: instrument.value.trim(), age: age.value ? Number(age.value) : null, phone: phone.value.trim(), social: social.value.trim(), level: level.value.trim(), plan: plan.value, fee: fee.value ? Number(fee.value) : null, playlists: playlist.value.trim() ? [playlist.value.trim()] : [], notes: notes.value, minor: minor.checked, consent: minor.checked ? consent.checked : false, schedule: sched.filter((x) => x.day != null), active: d.active !== false };
    if (!S.canHavePhoto(data) && d.photoId) data.photoId = null; // sem autorização, a foto sai da ficha
    const saved = await store.upsert('student', rec ? rec.id : null, data);
    close(); toast(rec ? 'ficha atualizada ✓' : 'aluno cadastrado ✓');
    if (!rec) location.hash = `#/beaterista/aluno/${saved.id}`;
  };
  return h('form', { class: 'sheet-body', onsubmit: (e) => { e.preventDefault(); submit(); } },
    f('nome *', name), h('div', { class: 'grid2' }, f('instrumento', instrument), f('idade', age)),
    h('div', { class: 'field' }, h('span', {}, 'horários fixos'), schedBox),
    h('div', { class: 'grid2' }, f('telefone (DDD)', phone), f('rede social', social)),
    f('nível', level), f('plano', plan), f('mensalidade', fee), f('playlist', playlist), f('observações', notes, 'só você vê. evite dados sensíveis desnecessários.'),
    h('label', { class: 'row between met-sw' }, h('span', {}, 'aluno menor de idade'), minor), consentRow,
    err, h('div', { class: 'row end' }, h('button', { class: 'btn primary', type: 'submit' }, 'salvar')));
}

/* ---------- registro de aula (< 1 minuto) ---------- */
function lessonEditor(st, rec, close) {
  const day = todayKey();
  const base = rec ? rec.data : { date: day, attendance: 'presente', ...S.prefill(S.lastLesson(lessons(), st.id)) };
  let att = base.attendance || 'presente';
  const date = h('input', { type: 'date', value: base.date || day, 'aria-label': 'data' });
  const song = h('input', { type: 'text', value: base.song || '', placeholder: 'música' });
  const content = h('textarea', { rows: 2, placeholder: 'o que foi trabalhado' }, base.content || '');
  const diff = h('select', { 'aria-label': 'dificuldade' }, ['', 'fácil', 'ok', 'difícil'].map((v) => h('option', { value: v, selected: v === (base.difficulty || '') }, v || 'dificuldade')));
  const homework = h('textarea', { rows: 2, placeholder: 'tema de casa' }, base.homework || '');
  const notes = h('textarea', { rows: 2, placeholder: 'observações' }, base.notes || '');
  const seg = h('div', { class: 'seg' });
  const drawSeg = () => seg.replaceChildren(...Object.keys(S.ATTEND).map((a) => h('button', { type: 'button', class: att === a ? 'on' : '', 'aria-pressed': String(att === a), onclick: () => { att = a; drawSeg(); } }, a)));
  drawSeg();
  const submit = async () => {
    const data = { studentId: st.id, date: date.value || day, attendance: att, song: song.value.trim(), content: content.value, difficulty: diff.value, homework: homework.value, notes: notes.value, at: rec ? rec.data.at : Date.now() };
    // aula nova nunca sobrescreve o histórico: se já existe registro do mesmo dia (da chamada), completa esse; senão cria outro
    const same = rec || S.lessonOnDay(lessons(), st.id, data.date);
    await store.upsert('lesson', same ? same.id : null, data);
    close(); toast('aula registrada ✓');
  };
  return h('form', { class: 'sheet-body', onsubmit: (e) => { e.preventDefault(); submit(); } },
    seg, h('div', { class: 'grid2' }, h('label', { class: 'field' }, h('span', {}, 'data'), date), h('label', { class: 'field' }, h('span', {}, 'dificuldade'), diff)),
    h('label', { class: 'field' }, h('span', {}, 'música'), song), h('label', { class: 'field' }, h('span', {}, 'conteúdo'), content),
    h('label', { class: 'field' }, h('span', {}, 'tema de casa'), homework), h('label', { class: 'field' }, h('span', {}, 'observações'), notes),
    h('div', { class: 'row end' }, h('button', { class: 'btn primary', type: 'submit' }, 'salvar aula')));
}

function makeupEditor(st, close) {
  const date = h('input', { type: 'date', value: todayKey(), 'aria-label': 'data da reposição' });
  const time = h('input', { type: 'time', 'aria-label': 'horário da reposição' });
  return h('form', { class: 'sheet-body', onsubmit: async (e) => { e.preventDefault(); await store.upsert('makeup', null, { studentId: st.id, date: date.value, time: time.value }); close(); toast('reposição marcada ✓'); } },
    h('div', { class: 'grid2' }, h('label', { class: 'field' }, h('span', {}, 'data'), date), h('label', { class: 'field' }, h('span', {}, 'horário'), time)),
    h('div', { class: 'row end' }, h('button', { class: 'btn primary', type: 'submit' }, 'marcar')));
}

/* ---------- página do aluno ---------- */
function mountStudent(host, id) {
  const draw = () => {
    const st = store.get(id);
    if (!st || st.kind !== 'student') { host.replaceChildren(banner('Aluno'), h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'aluno não encontrado.'), h('a', { class: 'btn primary', href: '#/beaterista' }, 'voltar'))); return; }
    const d = st.data; const hist = S.historyOf(lessons(), id); const last = S.lastLesson(lessons(), id);
    const mk = S.monthKey(todayKey()); const paid = S.paidIn(st, mk); const wa = S.whatsapp(d.phone);
    const photoBtns = S.canHavePhoto(d)
      ? h('div', { class: 'row' },
        h('button', { class: 'btn small', type: 'button', onclick: async () => { const pid = await squarePhoto(); if (pid) { await store.upsert('student', id, { photoId: pid }); toast('foto salva neste aparelho ✓'); } } }, d.photoId ? 'trocar foto' : 'adicionar foto'),
        d.photoId ? h('button', { class: 'btn small ghost', type: 'button', onclick: () => store.upsert('student', id, { photoId: null }) }, 'remover foto') : null)
      : h('p', { class: 'muted' }, 'menor de idade: para ter foto, registre na ficha a autorização dos responsáveis.');
    host.replaceChildren(...[
      h('a', { class: 'link pad-x st-back', href: '#/beaterista' }, '← alunos'),
      h('section', { class: 'card pad st-head' },
        h('div', { class: 'row' }, avatar(st, 96), h('div', { class: 'st-id' }, h('h1', { class: 'reader-title' }, d.name), h('p', { class: 'muted' }, [d.instrument, d.age ? `${d.age} anos` : '', d.level].filter(Boolean).join(' · ')),
          h('p', { class: 'muted' }, (d.schedule || []).map((x) => `${S.WD_SHORT[x.day]} ${x.time || ''}`.trim()).join(' · ') || 'sem horário fixo'))),
        photoBtns,
        h('div', { class: 'row' },
          wa ? h('a', { class: 'btn small', href: wa, target: '_blank', rel: 'noopener noreferrer' }, 'WhatsApp') : null,
          (d.playlists || [])[0] ? h('a', { class: 'btn small ghost', href: d.playlists[0], target: '_blank', rel: 'noopener noreferrer' }, 'playlist') : null,
          h('button', { class: 'btn small ghost', type: 'button', onclick: () => sheet('Editar ficha', (close) => studentEditor(st, close)) }, 'editar ficha'))),
      h('section', { class: 'card pad st-last' },
        h('h2', { class: 'tag' }, 'última aula'),
        last ? h('div', {}, h('p', {}, h('strong', {}, dateBR(last.data.date)), last.data.song ? ` · ${last.data.song}` : ''), last.data.content ? h('p', {}, last.data.content) : null, last.data.homework ? h('p', {}, h('strong', {}, 'tema de casa: '), last.data.homework) : null)
          : h('p', { class: 'muted' }, 'nenhuma aula registrada ainda.'),
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', type: 'button', onclick: () => sheet(last ? 'Continuar de onde paramos' : 'Registrar aula', (close) => lessonEditor(st, null, close)) }, last ? 'continuar de onde paramos' : 'registrar aula'),
          h('button', { class: 'btn small ghost', type: 'button', onclick: () => sheet('Reposição', (close) => makeupEditor(st, close)) }, 'marcar reposição'))),
      h('section', { class: 'card pad' },
        h('div', { class: 'row between' }, h('h2', { class: 'tag' }, `pagamento de ${monthBR(mk)}`),
          h('button', { class: `btn small${paid ? ' st-paid' : ''}`, type: 'button', 'aria-pressed': String(paid), onclick: () => store.upsert('student', id, { payments: { ...(d.payments || {}), [mk]: !paid } }) }, paid ? 'pago ✓' : 'pendente')),
        d.fee ? h('p', { class: 'muted' }, `mensalidade: R$ ${Number(d.fee).toFixed(2).replace('.', ',')}`) : null),
      d.plan || d.notes ? h('section', { class: 'card pad' }, d.plan ? [h('h2', { class: 'tag' }, 'plano'), h('p', { class: 'pre' }, d.plan)] : null, d.notes ? [h('h2', { class: 'tag' }, 'observações'), h('p', { class: 'pre' }, d.notes)] : null) : null,
      h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'histórico'),
        hist.length ? h('ul', { class: 'st-hist' }, hist.map((l) => h('li', {},
          h('button', { type: 'button', class: 'st-hist-b', onclick: () => sheet('Aula', (close) => lessonEditor(st, l, close)) },
            h('span', { class: `st-badge ${l.data.attendance}` }, l.data.attendance), h('strong', {}, dateBR(l.data.date)), l.data.song ? ` · ${l.data.song}` : '', l.data.content ? h('small', {}, l.data.content.slice(0, 90)) : null))))
          : h('p', { class: 'muted' }, 'o histórico aparece aqui, do mais recente ao mais antigo.')),
      h('div', { class: 'row pad-x' },
        h('button', { class: 'btn small ghost', type: 'button', onclick: () => store.upsert('student', id, { active: d.active === false }) }, d.active === false ? 'reativar aluno' : 'arquivar aluno'),
        h('button', { class: 'btn small ghost danger-txt', type: 'button', onclick: async () => { if (await confirmSheet('Apagar aluno?', `A ficha de ${d.name} sai do app. O histórico de aulas fica guardado.`, 'Apagar')) { await store.remove(id); location.hash = '#/beaterista'; } } }, 'apagar'))].filter(Boolean));
  };
  draw();
  return store.subscribe((i) => { if (!i.kind || ['student', 'lesson'].includes(i.kind)) draw(); });
}

/* ---------- lista + agenda ---------- */
function mountList(host) {
  let q = '', showArchived = false, inst = '';
  const roll = todayRoll();
  const week = weekWidget();
  const list = h('div', { class: 'st-list' });
  const chips = h('div', { class: 'chips lib-tabs st-chips' });
  const search = h('input', { type: 'search', placeholder: 'buscar aluno…', 'aria-label': 'Buscar aluno', enterkeyhint: 'search' });
  search.addEventListener('input', () => { q = search.value; draw(); });
  const draw = () => {
    const all = students().filter((s) => (s.data.active === false) === showArchived);
    const insts = [...new Set(all.map((s) => cap((s.data.instrument || 'bateria').trim().toLowerCase())))].sort();
    if (inst && !insts.includes(inst)) inst = '';
    chips.replaceChildren(...[['', 'Todos'], ['★', '★ favoritos'], ...insts.map((i) => [i, i])].map(([k, t]) => h('button', { type: 'button', class: `lib-tab${inst === k ? ' on' : ''}`, 'aria-pressed': String(inst === k), onclick: () => { inst = k; draw(); } }, t)));
    const found = S.searchStudents(all, q).filter((s) => !inst || (inst === '★' ? s.data.fav : cap((s.data.instrument || 'bateria').trim().toLowerCase()) === inst))
      .sort((a, b) => (b.data.fav ? 1 : 0) - (a.data.fav ? 1 : 0));
    list.replaceChildren(...(found.length ? found.map((st) => {
      const last = S.lastLesson(lessons(), st.id); const fav = !!st.data.fav;
      return h('div', { class: 'st-row' },
        h('a', { class: 'st-row-main', href: `#/beaterista/aluno/${st.id}` }, avatar(st, 52),
          h('span', {}, h('strong', {}, st.data.name), h('small', {}, [(st.data.schedule || []).map((x) => `${S.WD_SHORT[x.day]} ${x.time || ''}`.trim()).join(', '), st.data.instrument, last ? `última: ${dateBR(last.data.date)}` : ''].filter(Boolean).join(' · ')))),
        h('button', { class: `st-fav${fav ? ' on' : ''}`, type: 'button', 'aria-pressed': String(fav), 'aria-label': `${fav ? 'Tirar dos' : 'Marcar como'} favorito: ${st.data.name}`, onclick: () => store.upsert('student', st.id, { fav: !fav }) }, fav ? '★' : '☆'),
        h('a', { class: 'icon-btn st-go', href: `#/beaterista/aluno/${st.id}`, 'aria-label': `Abrir ${st.data.name}` }, h('span', { style: { display: 'inline-flex', transform: 'scaleX(-1)' } }, icon('back', 18))));
    })
      : [h('div', { class: 'empty' }, h('p', { class: 'hand' }, q ? 'ninguém com esse nome.' : showArchived ? 'nenhum aluno arquivado.' : 'nenhum aluno ainda.'))]));
  };
  host.append(
    banner('Alunos', 'aulas, presença e histórico'),
    roll,
    week,
    h('div', { class: 'card pad' }, search,
      h('div', { class: 'seg' }, ...[['ativos', false], ['arquivados', true]].map(([t, v]) => h('button', { type: 'button', class: v === showArchived ? 'on' : '', onclick: (e) => { showArchived = v; e.currentTarget.parentNode.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); draw(); } }, t)))),
    h('nav', { class: 'st-tools', 'aria-label': 'Ferramentas para usar em aula' }, h('span', { class: 'lib-kicker' }, 'usar em aula'),
      h('a', { class: 'chip-link', href: '#/ouvido' }, icon('mic', 16), ' estúdio de ouvido'), h('a', { class: 'chip-link', href: '#/beatlab' }, icon('kit', 16), ' beat lab'), h('a', { class: 'chip-link', href: '#/metronomo' }, icon('metro', 16), ' metrônomo')),
    chips,
    list,
    h('button', { class: 'btn primary wide', type: 'button', onclick: () => sheet('Novo aluno', (close) => studentEditor(null, close)) }, '+ novo aluno'),
    h('p', { class: 'pad-x lib-note' }, 'privado: os dados ficam no seu banco com login. fotos ficam só neste aparelho (ainda não sincronizam).'),
    partnerStrip());
  draw();
  const off = store.subscribe((i) => { if (!i.kind || ['student', 'lesson'].includes(i.kind)) draw(); });
  return () => { off(); roll.unsub(); week.unsub(); };
}

export function mount(host, parts) {
  if (parts[0] === 'aluno' && parts[1]) return mountStudent(host, parts[1]);
  return mountList(host);
}

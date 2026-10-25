// Meu Kit: links (redes, site, WhatsApp), ebooks, na mídia, fotos profissionais e meus dados.
// Tudo é registro privado da Bea no Supabase (RLS); nada disso fica escrito no código do site, que é público.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import { banner, sheet, toast, confirmSheet } from '../ui.js';
import { pickImages, saveImage, imageUrl } from './mural.js';
import * as files from '../files-sync.js';
import { db } from '../db.js';

export const TABS = [
  ['links', 'Links', 'link'],
  ['ebooks', 'Ebooks', 'book'],
  ['midia', 'Na mídia', 'news'],
  ['fotos', 'Fotos pro', 'photo'],
  ['dados', 'Meus dados', 'id'],
];
const DADOS = 'setting-meus-dados';
const GROUPS = [['redes', 'redes sociais'], ['site', 'site e Google'], ['contato', 'WhatsApp'], ['outros', 'outros']];

export async function copy(text, what = 'copiado') {
  try { await navigator.clipboard.writeText(text); toast(`${what} ✓`); }
  catch {
    const ta = h('textarea', { style: { position: 'fixed', opacity: '0' } }, text); document.body.append(ta); ta.select();
    try { document.execCommand('copy'); toast(`${what} ✓`); } catch { toast(text); } ta.remove();
  }
}
const safeUrl = (u) => (/^(https?:|mailto:|tel:)/i.test(u || '') ? u : '');
const host = (u) => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return ''; } };
const byOrder = (a, b) => (a.data.order ?? 99) - (b.data.order ?? 99) || a.updated_at - b.updated_at;

function tabs(on) {
  return h('nav', { class: 'chips lib-tabs kit-tabs', 'aria-label': 'Meu kit' },
    ...TABS.map(([k, t]) => h('a', { class: `lib-tab${on === k ? ' on' : ''}`, href: `#/kit/${k}`, 'aria-current': on === k ? 'page' : null }, t)));
}
function field(label, input) { return h('label', { class: 'field' }, h('span', {}, label), input); }

/* ---------- links ---------- */
function editLink(rec) {
  const d = rec ? rec.data : { group: 'outros' };
  sheet(rec ? 'Editar link' : 'Novo link', (close) => {
    const label = h('input', { type: 'text', maxlength: 60, value: d.label || '', placeholder: 'ex.: Spotify' });
    const url = h('input', { type: 'url', inputmode: 'url', value: d.url || '', placeholder: 'https://…' });
    const group = h('select', {}, ...GROUPS.map(([k, t]) => h('option', { value: k, selected: d.group === k }, t)));
    return h('div', { class: 'sheet-body' }, field('nome', label), field('link', url), field('grupo', group),
      h('div', { class: 'row between' },
        rec ? h('button', { class: 'btn ghost danger', type: 'button', onclick: async () => { if (await confirmSheet('Apagar link?', d.label, 'Apagar')) { await store.remove(rec.id); close(); } } }, 'apagar') : h('span'),
        h('button', { class: 'btn primary', type: 'button', onclick: async () => {
          let u = url.value.trim(); if (u && !/^[a-z]+:/i.test(u)) u = `https://${u}`;
          if (u && !safeUrl(u)) return toast('esse link não parece válido');
          await store.upsert('link', rec ? rec.id : null, { label: label.value.trim() || host(u) || 'link', url: u, group: group.value }); close(); toast('link salvo');
        } }, 'salvar')));
  });
}
function mountLinks(el) {
  const box = h('div');
  const draw = () => {
    const all = store.list('link').sort(byOrder);
    box.replaceChildren(...GROUPS.map(([g, title]) => {
      const items = all.filter((r) => (r.data.group || 'outros') === g);
      if (!items.length) return null;
      return h('section', { class: 'card kit-list' }, h('h2', { class: 'tag' }, title), ...items.map((r) => {
        const u = safeUrl(r.data.url);
        return h('div', { class: 'kit-row' },
          u ? h('a', { class: 'kit-main', href: u, target: '_blank', rel: 'noopener' }, h('span', { class: 'kit-ico' }, icon('link', 20)), h('span', {}, h('strong', {}, r.data.label), h('small', {}, host(u) || u)))
            : h('button', { class: 'kit-main', type: 'button', onclick: () => editLink(r) }, h('span', { class: 'kit-ico' }, icon('plus', 20)), h('span', {}, h('strong', {}, r.data.label), h('small', {}, 'toque pra colocar o link'))),
          u ? h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Copiar link: ${r.data.label}`, onclick: () => copy(u, 'link copiado') }, icon('copy', 20)) : null,
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Editar ${r.data.label}`, onclick: () => editLink(r) }, icon('edit', 18)));
      }));
    }).filter(Boolean));
    if (!all.length) box.replaceChildren(h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'nenhum link ainda.')));
  };
  el.append(box, h('div', { class: 'row pad-x kit-foot' },
    h('button', { class: 'btn primary', type: 'button', onclick: () => editLink(null) }, '+ adicionar link'),
    h('button', { class: 'btn', type: 'button', onclick: () => copy(store.list('link').sort(byOrder).filter((r) => safeUrl(r.data.url)).map((r) => `${r.data.label}: ${r.data.url}`).join('\n'), 'todos os links copiados') }, 'copiar todos')));
  draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === 'link') draw(); });
}

/* ---------- ebooks ---------- */
function mountEbooks(el) {
  const grid = h('div', { class: 'kit-books' });
  const draw = () => {
    const recs = store.list('ebook').sort((a, b) => b.updated_at - a.updated_at);
    grid.replaceChildren(...(recs.length ? recs.map((r, k) => {
      const state = h('small', { class: 'kit-cloud' });
      files.isUp(r.data.fileId).then((up) => { state.textContent = up ? 'na nuvem ✓' : 'só neste aparelho'; });
      return h('article', { class: `kit-book c${k % 4}` },
        h('button', { class: 'kit-book-cover', type: 'button', 'aria-label': `Abrir ${r.data.title}`, onclick: () => openBook(r) },
          h('span', { class: 'kit-book-title' }, r.data.title), h('span', { class: 'kit-book-meta' }, `${r.data.ext || 'pdf'} · ${r.data.mb || '?'} MB`)),
        h('div', { class: 'kit-book-foot' }, state,
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Renomear ${r.data.title}`, onclick: () => rename(r) }, icon('edit', 16)),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Apagar ${r.data.title}`, onclick: async () => { if (await confirmSheet('Apagar ebook?', r.data.title, 'Apagar')) { await files.remove(r.data.fileId); await store.remove(r.id); } } }, icon('trash', 16))));
    }) : [h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'sua estante tá vazia.'), h('p', { class: 'muted' }, 'toque em “+ adicionar ebook” e escolha um PDF ou EPUB.'))]));
  };
  const openBook = async (r) => {
    const w = window.open('', '_blank'); // abre já no toque (senão o iPhone bloqueia a janela)
    const u = await files.openUrl(r.data.fileId);
    if (!u) { w && w.close(); return toast('esse arquivo ainda não chegou neste aparelho. abre com internet.'); }
    if (w) w.location.href = u; else location.href = u;
  };
  const rename = (r) => sheet('Renomear', (close) => {
    const t = h('input', { type: 'text', maxlength: 90, value: r.data.title });
    return h('div', { class: 'sheet-body' }, field('título', t), h('button', { class: 'btn primary', type: 'button', onclick: async () => { await store.upsert('ebook', r.id, { title: t.value.trim() || r.data.title }); close(); } }, 'salvar'));
  });
  const add = () => {
    const input = h('input', { type: 'file', accept: 'application/pdf,application/epub+zip,.pdf,.epub', multiple: true, style: { display: 'none' } });
    document.body.append(input);
    input.addEventListener('change', async () => {
      const list = [...input.files]; input.remove();
      for (const f of list) {
        if (f.size > files.MAX_MB * 1048576) { toast(`${f.name}: passa de ${files.MAX_MB} MB, não cabe na nuvem grátis`); continue; }
        const fileId = await files.saveFile(f);
        await store.upsert('ebook', null, { title: f.name.replace(/\.(pdf|epub)$/i, ''), fileId, ext: (f.name.split('.').pop() || 'pdf').toLowerCase(), mb: (f.size / 1048576).toFixed(1) });
      }
      if (list.length) toast('ebook guardado ✓');
    });
    input.click();
  };
  el.append(h('div', { class: 'row pad-x kit-foot' }, h('button', { class: 'btn primary', type: 'button', onclick: add }, '+ adicionar ebook')), grid,
    h('p', { class: 'pad-x lib-note' }, `PDF ou EPUB até ${files.MAX_MB} MB. fica numa pasta privada da sua nuvem: só você abre.`));
  draw(); files.pushPending();
  return store.subscribe((i) => { if (!i.kind || i.kind === 'ebook') draw(); });
}

/* ---------- na mídia ---------- */
function editMidia(rec) {
  const d = rec ? rec.data : {};
  let imgId = d.imgId || null;
  sheet(rec ? 'Editar matéria' : 'Nova matéria', (close) => {
    const title = h('input', { type: 'text', maxlength: 140, value: d.title || '', placeholder: 'título da matéria' });
    const outlet = h('input', { type: 'text', maxlength: 60, value: d.outlet || '', placeholder: 'jornal, TV, site…' });
    const date = h('input', { type: 'date', value: d.date || '' });
    const url = h('input', { type: 'url', inputmode: 'url', value: d.url || '', placeholder: 'https://…' });
    const prev = h('div', { class: 'kit-media-prev' });
    const paint = async () => { const u = imgId && await imageUrl(imgId); prev.replaceChildren(u ? h('img', { src: u, alt: '' }) : h('span', { class: 'muted' }, 'sem imagem (uso um cartão com o nome do veículo)')); };
    paint();
    return h('div', { class: 'sheet-body' }, field('título', title), field('veículo', outlet), field('data', date), field('link', url), prev,
      h('button', { class: 'btn', type: 'button', onclick: async () => { const [b] = await pickImages(false); if (b) { imgId = await saveImage(b); paint(); } } }, icon('photo', 18), ' escolher imagem (print da matéria)'),
      h('div', { class: 'row between' },
        rec ? h('button', { class: 'btn ghost danger', type: 'button', onclick: async () => { if (await confirmSheet('Apagar matéria?', d.title, 'Apagar')) { await store.remove(rec.id); close(); } } }, 'apagar') : h('span'),
        h('button', { class: 'btn primary', type: 'button', onclick: async () => {
          let u = url.value.trim(); if (u && !/^[a-z]+:/i.test(u)) u = `https://${u}`;
          await store.upsert('midia', rec ? rec.id : null, { title: title.value.trim() || 'matéria', outlet: outlet.value.trim(), date: date.value, url: safeUrl(u), imgId }); close(); toast('salvo');
        } }, 'salvar')));
  });
}
const fmtDate = (d) => (d ? d.split('-').reverse().join('/') : '');
function mountMidia(el) {
  const grid = h('div', { class: 'kit-media' });
  const draw = () => {
    const recs = store.list('midia').sort((a, b) => (b.data.date || '').localeCompare(a.data.date || ''));
    grid.replaceChildren(...recs.map((r, k) => {
      const u = safeUrl(r.data.url);
      const pic = h('div', { class: `kit-media-pic c${k % 4}` }, h('span', {}, r.data.outlet || 'na mídia'));
      if (r.data.imgId) imageUrl(r.data.imgId).then((src) => { if (src) pic.replaceChildren(h('img', { src, alt: '', loading: 'lazy' })); });
      const body = [pic, h('div', { class: 'kit-media-txt' }, h('small', {}, [r.data.outlet, fmtDate(r.data.date)].filter(Boolean).join(' · ')), h('strong', {}, r.data.title))];
      return h('article', { class: 'kit-media-card' },
        u ? h('a', { class: 'kit-media-main', href: u, target: '_blank', rel: 'noopener' }, ...body) : h('button', { class: 'kit-media-main', type: 'button', onclick: () => editMidia(r) }, ...body),
        h('div', { class: 'kit-media-act' },
          u ? h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Copiar link da matéria', onclick: () => copy(u, 'link copiado') }, icon('copy', 18)) : h('small', { class: 'muted' }, 'sem link'),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Editar ${r.data.title}`, onclick: () => editMidia(r) }, icon('edit', 16))));
    }));
  };
  el.append(h('div', { class: 'row pad-x kit-foot' }, h('button', { class: 'btn primary', type: 'button', onclick: () => editMidia(null) }, '+ adicionar matéria')), grid,
    h('p', { class: 'pad-x lib-note' }, 'dica: tira um print da matéria e coloca como imagem no lápis. os links vieram do seu dossiê de imprensa.'));
  draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === 'midia') draw(); });
}

/* ---------- fotos profissionais ---------- */
function mountFotos(el) {
  const grid = h('div', { class: 'kit-photos' });
  const view = (r) => sheet('Foto', (close) => {
    const img = h('img', { class: 'kit-photo-big', alt: '' });
    imageUrl(r.data.imgId).then((u) => { if (u) img.src = u; });
    return h('div', { class: 'sheet-body' }, img,
      h('div', { class: 'row between' },
        h('button', { class: 'btn ghost danger', type: 'button', onclick: async () => { if (await confirmSheet('Tirar essa foto?', 'Ela sai da galeria.', 'Tirar')) { await store.remove(r.id); close(); } } }, 'apagar'),
        h('button', { class: 'btn primary', type: 'button', onclick: async () => {
          const u = await imageUrl(r.data.imgId); if (!u) return;
          const blob = await db.metaGet(`img:${r.data.imgId}`); if (!blob) return; const file = new File([blob], 'beaterista.jpg', { type: blob.type || 'image/jpeg' });
          try { if (navigator.canShare && navigator.canShare({ files: [file] })) return await navigator.share({ files: [file] }); } catch { return; }
          const a = h('a', { href: u, download: 'beaterista.jpg' }); document.body.append(a); a.click(); a.remove();
        } }, 'compartilhar / salvar')));
  });
  const draw = () => {
    const recs = store.list('fotopro').sort((a, b) => b.updated_at - a.updated_at);
    grid.replaceChildren(...(recs.length ? recs.map((r) => {
      const b = h('button', { class: 'kit-photo', type: 'button', 'aria-label': 'Abrir foto', onclick: () => view(r) });
      imageUrl(r.data.imgId).then((u) => { if (u) b.append(h('img', { src: u, alt: '', loading: 'lazy' })); });
      return b;
    }) : [h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'nenhuma foto ainda.'), h('p', { class: 'muted' }, 'importa as suas fotos profissionais aqui, até 12 por vez.'))]));
  };
  el.append(h('div', { class: 'row pad-x kit-foot' }, h('button', { class: 'btn primary', type: 'button', onclick: async () => {
    const blobs = await pickImages(true);
    for (const b of blobs) await store.upsert('fotopro', null, { imgId: await saveImage(b) });
    if (blobs.length) toast(`${blobs.length} foto${blobs.length > 1 ? 's' : ''} importada${blobs.length > 1 ? 's' : ''} ✓`);
  } }, '+ importar fotos')), grid,
  h('p', { class: 'pad-x lib-note' }, 'as fotos sobem pra sua nuvem privada (versão leve, até 1400 px, boa pra mandar no WhatsApp e no Instagram).'));
  draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === 'fotopro') draw(); });
}

/* ---------- meus dados ---------- */
function mountDados(el) {
  let show = false;
  const list = h('section', { class: 'card kit-list kit-dados' });
  const fields = () => (store.get(DADOS) ? store.get(DADOS).data.fields || [] : []);
  const eye = h('button', { class: 'btn small', type: 'button', onclick: () => { show = !show; draw(); } });
  const draw = () => {
    eye.textContent = show ? 'esconder' : 'mostrar tudo';
    const f = fields();
    list.replaceChildren(...(f.length ? f.map(([k, v]) => h('div', { class: 'kit-row' },
      h('div', { class: 'kit-main' }, h('span', {}, h('small', {}, k), h('strong', { class: show ? '' : 'kit-hide' }, show ? v : '•••• ' + String(v).slice(-3)))),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Copiar ${k}`, onclick: () => copy(v, `${k} copiado`) }, icon('copy', 20))))
      : [h('p', { class: 'muted' }, 'nada aqui ainda. toque em editar.')]));
  };
  const edit = () => sheet('Editar meus dados', (close) => {
    const rows = h('div', { class: 'kit-edit' });
    const addRow = (k = '', v = '') => rows.append(h('div', { class: 'kit-edit-row' },
      h('input', { type: 'text', value: k, placeholder: 'nome (ex.: CPF)', 'aria-label': 'Nome do dado' }),
      h('input', { type: 'text', value: v, placeholder: 'valor', 'aria-label': 'Valor' }),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Tirar', onclick: (e) => e.currentTarget.parentNode.remove() }, icon('x', 16))));
    fields().forEach(([k, v]) => addRow(k, v));
    return h('div', { class: 'sheet-body' }, rows, h('button', { class: 'btn', type: 'button', onclick: () => addRow() }, '+ linha'),
      h('button', { class: 'btn primary', type: 'button', onclick: async () => {
        const out = [...rows.children].map((r) => [...r.querySelectorAll('input')].map((i) => i.value.trim())).filter(([k, v]) => k || v);
        await store.upsert('setting', DADOS, { fields: out }); close(); toast('dados salvos');
      } }, 'salvar'));
  });
  el.append(h('div', { class: 'row pad-x kit-foot' }, eye,
    h('button', { class: 'btn small', type: 'button', onclick: () => copy(fields().map(([k, v]) => `${k}: ${v}`).join('\n'), 'tudo copiado') }, 'copiar tudo'),
    h('button', { class: 'btn small', type: 'button', onclick: edit }, 'editar')), list,
  h('p', { class: 'pad-x lib-note' }, icon('lock', 14), ' esses dados ficam só na sua conta (Supabase privado). não estão no código do site, e aparecem escondidos até você tocar em “mostrar”.'));
  draw();
  return store.subscribe((i) => { if (!i.kind || i.id === DADOS) draw(); });
}

const SUBS = { links: ['Meus Links', 'toque pra abrir, ou copie', mountLinks], ebooks: ['Meus Ebooks', 'sua estante', mountEbooks], midia: ['Na Mídia', 'jornal, TV e sites', mountMidia], fotos: ['Fotos Profissionais', 'pra divulgação', mountFotos], dados: ['Meus Dados', 'pra copiar rapidinho', mountDados] };
export function mount(el, parts) {
  const k = SUBS[parts && parts[0]] ? parts[0] : 'links';
  const [t, sub, fn] = SUBS[k];
  el.append(banner(t, sub), tabs(k));
  const off = fn(el);
  return () => off();
}

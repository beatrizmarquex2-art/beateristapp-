// "Enviar pra pasta": guarda um exercício (folha, partitura, plano) como imagem numa pasta do Meus Arquivos.
// Fica igual a qualquer arquivo (nuvem privada + cópia no aparelho) e dá pra juntar com outros num PDF dentro da pasta.
import { h, icon } from './util.js';
import * as store from './store.js';
import * as files from './files-sync.js';
import { folderList, nameTaken, GERAL } from './files-logic.js';
import { sheet, toast } from './ui.js';
import { toJpeg } from './views/plan-pdf.js';

const FILE = 'file', FOLDER = 'folder';

/** Folha pra escolher a pasta (ou criar uma). Resolve com { id, name } ou null se cancelar. */
export function chooseFolder(title = 'Enviar pra qual pasta?') {
  return new Promise((resolve) => {
    let done = false; const finish = (v) => { if (!done) { done = true; resolve(v); } };
    sheet(title, (close) => {
      const list = folderList(store.list(FOLDER), store.list(FILE));
      const name = h('input', { type: 'text', maxlength: 40, placeholder: 'nome da nova pasta', 'aria-label': 'Nome da nova pasta' });
      const create = async () => {
        const n = name.value.trim(); if (!n) return;
        if (nameTaken(store.list(FOLDER), n)) { toast('já existe uma pasta com esse nome', { ms: 2200 }); return; }
        const rec = await store.upsert(FOLDER, null, { name: n }); finish({ id: rec.id, name: n }); close();
      };
      name.addEventListener('keydown', (e) => { if (e.key === 'Enter') create(); });
      return h('div', { class: 'sheet-body' },
        h('div', { style: 'display:grid;gap:6px' }, ...list.map((f) => h('button', { class: 'btn ghost', type: 'button', onclick: () => { finish({ id: f.id, name: f.name }); close(); } }, icon('folder', 16), ` ${f.name} · ${f.n}`))),
        h('div', { class: 'row', style: 'margin-top:10px' }, name, h('button', { class: 'btn primary', type: 'button', onclick: create }, '+ criar')));
    }, { onClose: () => finish(null) });
  });
}

/** Guarda canvases (uma página cada) numa pasta escolhida. `base` = nome do arquivo sem extensão. */
export async function sendCanvases(canvases, base) {
  const folder = await chooseFolder(); if (!folder) return false;
  toast('guardando na pasta…', { id: 'send-folder', ms: 60000 });
  const safe = String(base).replace(/[\\/:*?"<>|]+/g, '-').trim() || 'exercicio';
  let n = 0;
  for (let i = 0; i < canvases.length; i++) {
    const jpeg = await toJpeg(canvases[i]);
    const name = `${safe}${canvases.length > 1 ? ` - folha ${i + 1}` : ''}.jpg`;
    const blob = new File([jpeg], name, { type: 'image/jpeg' });
    const fileId = await files.saveFile(blob);
    await store.upsert(FILE, null, { name, folder: folder.id === GERAL ? GERAL : folder.id, fileId, mime: 'image/jpeg', kind: 'imagem', size: blob.size, created: Date.now() + i });
    n++;
  }
  toast(`${n} página(s) na pasta ${folder.name} ✓`, { id: 'send-folder', ms: 5000, action: 'abrir', onAction: () => { location.hash = `#/arquivos/${folder.id}`; } });
  files.pushPending();
  return true;
}

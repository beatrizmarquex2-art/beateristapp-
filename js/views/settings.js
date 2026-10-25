import { h } from '../util.js';
import * as store from '../store.js';
import * as auth from '../auth.js';
import * as sync from '../sync.js';
import * as photos from '../photos-sync.js';
import { banner, toast, confirmSheet } from '../ui.js';

export const APP_VERSION = '1.0.0-fase1';

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = h('a', { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function mount(host, { onSignedOut }) {
  const syncBox = h('div', { class: 'card pad' });
  const drawSync = () => {
    const pend = store.pendingCount();
    const s = sync.state;
    const label = { idle: 'aguardando', ok: 'tudo sincronizado', syncing: 'sincronizando…', offline: 'sem internet — salvando só neste aparelho', error: s.error, auth: s.error }[s.status] || s.status;
    syncBox.replaceChildren(
      h('h2', { class: 'tag' }, 'sincronização'),
      h('p', {}, label),
      h('p', { class: 'muted' }, `${pend} alteração(ões) esperando envio${s.lastSync ? ` · última vez ${new Date(s.lastSync).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}` : ''}`),
      h('button', { class: 'btn small', type: 'button', onclick: () => { sync.run(); toast('Sincronizando…'); } }, 'sincronizar agora'));
  };
  drawSync();
  // fotos: quantas já estão na nuvem e quantas faltam subir
  const photoBox = h('div', { class: 'card pad' });
  const drawPhotos = (st = photos.status) => photoBox.replaceChildren(...[
    h('h2', { class: 'tag' }, 'fotos na nuvem'),
    h('p', {}, st.running ? `enviando… faltam ${st.pending}` : st.pending ? `${st.pending} foto(s) esperando internet` : `${st.uploaded} foto(s) guardadas na nuvem`),
    h('p', { class: 'muted' }, 'capa, alunos, artistas, mural e capas do feed ficam numa pasta privada do seu Supabase e aparecem em qualquer aparelho em que você entrar.'),
    st.failed ? h('p', { class: 'muted' }, `${st.failed} não subiram agora; tento de novo sozinha.`) : null,
    h('button', { class: 'btn small', type: 'button', onclick: () => photos.pushPending() }, 'enviar fotos agora')].filter(Boolean));
  drawPhotos(); photos.pushPending().catch(() => {});
  const offPhotos = photos.onStatus(drawPhotos);

  const importInput = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  importInput.addEventListener('change', async () => {
    const f = importInput.files[0]; if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      if (j.app !== 'beaterista' || !Array.isArray(j.records)) throw new Error('formato');
      const n = await store.importBackup(j.records);
      toast(`${n} registro(s) restaurado(s). Registros mais novos no aparelho foram mantidos.`);
    } catch { toast('Esse arquivo não parece um backup do Beaterista.'); }
    importInput.value = '';
  });

  host.append(
    banner('Ajustes', 'conta, backup e sincronização', 'clip'),
    h('div', { class: 'card pad' }, h('h2', { class: 'tag' }, 'conta'), h('p', {}, auth.userEmail() || '—'),
      h('p', { class: 'muted' }, 'Só pessoas autorizadas no servidor conseguem sincronizar. Os dados salvos neste aparelho ficam protegidos pela senha/Face ID do iPhone — o app não os criptografa.')),
    syncBox,
    photoBox,
    h('div', { class: 'card pad' }, h('h2', { class: 'tag' }, 'backup'),
      h('p', {}, 'Baixe uma cópia de tudo que está neste aparelho (tarefas, notas, favoritos, ordem dos atalhos).'),
      h('div', { class: 'row' },
        h('button', { class: 'btn small', type: 'button', onclick: () => {
          const records = store.allRaw().map(({ id, kind, data, updated_at, deleted }) => ({ id, kind, data, updated_at, deleted }));
          download(`beaterista-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: 'beaterista', version: 1, exported_at: new Date().toISOString(), records }, null, 1));
          toast('Backup gerado. Guarde em lugar seguro: ele contém suas notas.');
        } }, 'baixar backup'),
        h('button', { class: 'btn small ghost', type: 'button', onclick: () => importInput.click() }, 'restaurar de backup'), importInput)),
    h('div', { class: 'card pad' }, h('h2', { class: 'tag' }, 'iphone'),
      h('p', {}, 'Para instalar: abra no Safari → Compartilhar → “Adicionar à Tela de Início”. Com o app instalado e aberto uma vez com internet, o checklist, as notas e os favoritos funcionam offline.')),
    h('div', { class: 'card pad' }, h('h2', { class: 'tag' }, 'sair'),
      h('button', { class: 'btn danger', type: 'button', onclick: async () => {
        const pend = store.pendingCount();
        const ok = await confirmSheet('Sair deste aparelho?', pend
          ? `Há ${pend} alteração(ões) que ainda não foram enviadas. Se você sair e apagar os dados daqui, elas serão perdidas. Conecte-se e sincronize antes.`
          : 'Você sairá da conta e os dados locais deste aparelho serão apagados (eles continuam salvos na nuvem).', 'Sair e apagar daqui');
        if (!ok) return;
        await auth.signOut(); await store.wipe(); onSignedOut();
      } }, 'sair e apagar dados deste aparelho')),
    h('p', { class: 'muted center' }, `Beaterista · ${APP_VERSION}`));
  const off = sync.onSync(drawSync);
  const off2 = store.subscribe(() => drawSync());
  return () => { off(); off2(); offPhotos(); };
}

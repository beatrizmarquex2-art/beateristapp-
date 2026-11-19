// Botão "atualizar" no topo (junto do som): apaga a cópia guardada do app e baixa tudo de novo.
// O nome, o código e o progresso do aluno ficam (só o cache do app é apagado).
import { h } from './util.js';
import { iconeTopo } from './top-icons.js';

export async function atualizarAgora() {
  try { const regs = (await navigator.serviceWorker.getRegistrations()) || []; await Promise.all(regs.map((r) => r.unregister())); } catch { /* sem service worker */ }
  try { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); } catch { /* sem cache */ }
  try { sessionStorage.setItem('bt-atualizou', '1'); } catch { /* ok */ }
  location.reload();
}

export function atualizarButton({ linha = false } = {}) {
  const b = h('button', { type: 'button', class: 'icon-btn top-snd top-atu', 'aria-label': 'Atualizar o app: baixa a versão mais nova', title: 'atualizar o app' }, linha ? h('span', { class: 'atu-ico' }, iconeTopo('atualizar')) : h('span', { class: 'atu-ico', 'aria-hidden': 'true' }, '⟳'));
  // quando chega versão nova, aparece um pino vermelhinho no botão (pra ninguém esquecer de atualizar)
  try { const tinha = !!navigator.serviceWorker.controller; navigator.serviceWorker.addEventListener('controllerchange', () => { if (tinha) { b.classList.add('tem-novo'); b.title = 'tem versão nova: toque pra atualizar'; } }); } catch { /* sem service worker */ }
  b.onclick = () => { b.disabled = true; b.classList.add('girando'); atualizarAgora(); };
  return b;
}

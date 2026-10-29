// Arrastar pra reordenar (dedo ou mouse). Com handleSel: só pela alça. Sem handleSel: o item inteiro (no dedo, segurando um instante; no mouse, arrastando),
// pra não brigar com a rolagem.
// container: onde ficam os itens; itemSel: cada item (precisa de data-key); onDone(chaves na nova ordem) só chama se mudou.
export function dragSort(container, { itemSel, handleSel, onDone, axis = 'xy' }) {
  let drag = null;
  const keysOf = () => [...container.querySelectorAll(itemSel)].map((x) => x.dataset.key);
  const down = (e) => {
    let el, grip = null;
    if (handleSel) { grip = e.target.closest(handleSel); if (!grip || !container.contains(grip)) return; el = grip.closest(itemSel); }
    else { if (e.target.closest('button, input, select, textarea')) return; el = e.target.closest(itemSel); if (!el || !container.contains(el)) return; }
    if (!el) return;
    if (grip) e.preventDefault();
    drag = { el, id: e.pointerId, x: e.clientX, y: e.clientY, on: false, hold: !grip && e.pointerType !== 'mouse', before: keysOf().join('|') };
    if (grip && grip.setPointerCapture) grip.setPointerCapture(e.pointerId);
    if (drag.hold) { const d = drag; d.timer = setTimeout(() => { if (drag === d && !d.on) { start(); if (navigator.vibrate) navigator.vibrate(12); } }, 260); }
  };
  const start = () => {
    const r = drag.el.getBoundingClientRect();
    const ghost = drag.el.cloneNode(true);
    Object.assign(ghost.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, margin: '0', zIndex: 9999, pointerEvents: 'none', opacity: '.92', boxShadow: '0 8px 22px rgb(0 0 0 / .35)', transform: 'scale(1.04)' });
    document.body.append(ghost); drag.ghost = ghost; drag.dx = drag.x - r.left; drag.dy = drag.y - r.top; drag.el.style.opacity = '.25'; drag.on = true;
    const tick = () => { if (!drag || !drag.on) return; if (drag.edge) window.scrollBy(0, drag.edge); requestAnimationFrame(tick); }; requestAnimationFrame(tick);
  };
  const move = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.on) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
      if (drag.hold) { clearTimeout(drag.timer); drag = null; return; } // moveu antes de segurar: é rolagem
      start();
    }
    e.preventDefault();
    drag.ghost.style.left = `${e.clientX - drag.dx}px`; drag.ghost.style.top = `${e.clientY - drag.dy}px`;
    drag.edge = e.clientY < 90 ? -12 : e.clientY > innerHeight - 120 ? 12 : 0;
    const t = document.elementFromPoint(e.clientX, e.clientY); const over = t && t.closest(itemSel);
    if (!over || over === drag.el || !container.contains(over)) return;
    const r = over.getBoundingClientRect();
    const before = axis === 'y' ? e.clientY < r.top + r.height / 2 : e.clientX < r.left + r.width / 2;
    container.insertBefore(drag.el, before ? over : over.nextSibling);
  };
  const up = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null; clearTimeout(d.timer);
    if (!d.on) return;
    d.on = false; d.ghost.remove(); d.el.style.opacity = '';
    const swallow = (ev) => { ev.preventDefault(); ev.stopPropagation(); }; // o dedo que arrastou não "clica" no que está embaixo
    addEventListener('click', swallow, { capture: true, once: true }); setTimeout(() => removeEventListener('click', swallow, true), 400);
    const now = keysOf(); if (now.join('|') !== d.before) onDone(now);
  };
  const noNative = (e) => e.preventDefault(); // links e imagens têm arrastar nativo, que atrapalharia o mouse
  container.addEventListener('dragstart', noNative);
  container.addEventListener('pointerdown', down);
  const noScroll = (e) => { if (drag && drag.on) e.preventDefault(); };
  addEventListener('touchmove', noScroll, { passive: false });
  addEventListener('pointermove', move, { passive: false });
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  return () => { removeEventListener('touchmove', noScroll); removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); container.removeEventListener('pointerdown', down); container.removeEventListener('dragstart', noNative); };
}

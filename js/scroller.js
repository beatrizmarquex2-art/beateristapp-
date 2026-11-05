// Barra de rolagem visível (o iPhone esconde a dele) que dá pra arrastar, e botão de voltar ao topo.
import { h, icon } from './util.js';

export function startScroller() {
  // fora do iPhone/iPad a barra do próprio navegador funciona: só o botão de voltar ao topo, sem medir a tela a cada rolagem
  if (!document.documentElement.classList.contains('apple')) return topOnly();
  const thumb = h('div', { class: 'scroll-thumb', 'aria-hidden': 'true' });
  const track = h('div', { class: 'scroll-track', 'aria-hidden': 'true' }, thumb);
  const topBtn = h('button', { class: 'to-top', type: 'button', 'aria-label': 'Voltar ao topo', onclick: () => scrollTo({ top: 0, behavior: 'smooth' }) }, icon('up', 22));
  document.body.append(track, topBtn);
  let hide = 0, drag = null;
  const geo = () => {
    const doc = document.documentElement; const max = doc.scrollHeight - innerHeight;
    const th = Math.max(44, innerHeight * (innerHeight / doc.scrollHeight)); const room = track.clientHeight - th;
    return { max, th, room };
  };
  const paint = () => {
    const { max, th, room } = geo();
    track.classList.toggle('none', max < 40);
    thumb.style.height = `${th}px`;
    thumb.style.transform = `translateY(${max > 0 ? (scrollY / max) * room : 0}px)`;
    topBtn.classList.toggle('show', scrollY > innerHeight * 0.9);
  };
  let raf = 0;
  const wake = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; wakeNow(); }); };
  const wakeNow = () => { paint(); track.classList.add('on'); clearTimeout(hide); hide = setTimeout(() => { if (!drag) track.classList.remove('on'); }, 1400); };
  addEventListener('scroll', wake, { passive: true });
  addEventListener('resize', paint);
  new ResizeObserver(paint).observe(document.body);
  thumb.addEventListener('pointerdown', (e) => {
    e.preventDefault(); thumb.setPointerCapture(e.pointerId);
    drag = { y: e.clientY, s: scrollY }; track.classList.add('on', 'drag');
  });
  thumb.addEventListener('pointermove', (e) => {
    if (!drag) return; const { max, room } = geo();
    scrollTo(0, drag.s + ((e.clientY - drag.y) / Math.max(room, 1)) * max);
  });
  const end = () => { drag = null; track.classList.remove('drag'); wake(); };
  thumb.addEventListener('pointerup', end); thumb.addEventListener('pointercancel', end);
  paint();
}

function topOnly() {
  const topBtn = h('button', { class: 'to-top', type: 'button', 'aria-label': 'Voltar ao topo', onclick: () => scrollTo({ top: 0, behavior: 'smooth' }) }, icon('up', 22));
  document.body.append(topBtn);
  let raf = 0; let shown = false;
  addEventListener('scroll', () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; const on = scrollY > innerHeight * 0.9; if (on !== shown) { shown = on; topBtn.classList.toggle('show', on); } });
  }, { passive: true });
}

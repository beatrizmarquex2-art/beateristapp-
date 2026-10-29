// Ciclo de vida de uma tela, jogo ou fase: tudo que ela agenda (timers, quadros de animação, escutas de evento) fica registrado aqui
// e some junto quando a sessão acaba. Nada de timer solto que dispara numa fase que já não existe.
//
//   const s = session();               // uma por tela/jogo
//   s.later(fn, ms) · s.every(fn, ms) · s.raf(fn) · s.on(alvo, 'evento', fn, opts) · s.add(() => limpar())
//   s.reset()                           // virou a fase: cancela tudo que a fase anterior agendou (a sessão segue viva) e cala o som
//   s.dispose()                         // acabou: reset + a sessão não aceita mais nada (callbacks tardios viram no-op)
//
// Os callbacks só rodam se a sessão (e a fase) em que foram criados ainda for a atual.
import { silence } from './audio.js';

export function session({ quiet = true } = {}) {
  let alive = true; let gen = 0;
  const timers = new Set(); const intervals = new Set(); const rafs = new Set(); const offs = new Set();
  const s = {
    get alive() { return alive; },
    /** número da fase atual: guarde-o antes de um await e confira depois com `s.current(g)` */
    get gen() { return gen; },
    current(g) { return alive && g === gen; },
    later(fn, ms = 0) {
      if (!alive) return 0;
      const g = gen; const id = setTimeout(() => { timers.delete(id); if (alive && g === gen) fn(); }, ms); timers.add(id); return id;
    },
    every(fn, ms) {
      if (!alive) return 0;
      const g = gen; const id = setInterval(() => { if (alive && g === gen) fn(); else { clearInterval(id); intervals.delete(id); } }, ms); intervals.add(id); return id;
    },
    raf(fn) {
      if (!alive) return 0;
      const g = gen; const id = requestAnimationFrame((t) => { rafs.delete(id); if (alive && g === gen) fn(t); }); rafs.add(id); return id;
    },
    cancel(id) { clearTimeout(id); clearInterval(id); cancelAnimationFrame(id); timers.delete(id); intervals.delete(id); rafs.delete(id); },
    on(target, type, fn, opts) {
      if (!alive) return () => {};
      const g = gen; const h = (e) => { if (alive && g === gen) fn(e); };
      target.addEventListener(type, h, opts);
      const off = () => { target.removeEventListener(type, h, opts); offs.delete(off); };
      offs.add(off); return off;
    },
    /** registra uma função de limpeza (parar microfone, soltar wake lock…) que roda no reset/dispose */
    add(fn) { offs.add(fn); return fn; },
    /** `calar = false` cancela só os agendamentos, deixando o som que acabou de sair terminar (ex.: o acorde de acerto antes do resultado) */
    reset(calar = quiet) {
      gen++;
      timers.forEach(clearTimeout); timers.clear(); intervals.forEach(clearInterval); intervals.clear(); rafs.forEach(cancelAnimationFrame); rafs.clear();
      const list = [...offs]; offs.clear(); list.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
      if (calar) silence();
      return s;
    },
    dispose() { if (!alive) return; s.reset(); alive = false; },
  };
  return s;
}

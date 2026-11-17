// "Prova do Paul": 3 perguntinhas depois de estudar um acorde ou um ritmo. Cada acerto vale 1 ★ (até 3 ★ por acorde/ritmo, igual a pauLta).
// A estrela é paga uma vez na vida por `chave` (só a diferença se a pessoa melhorar), vale o limite diário de 30 ★ e só com código.
import { h } from '../util.js';
const emb = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
export const sorteia = emb;
/** Estrelas pelo número de acertos (3 perguntas = 0 a 3 ★). Puro. */
export const estrelasProva = (acertos, total = 3) => Math.max(0, Math.min(3, Math.round((acertos / Math.max(1, total)) * 3)));
let css = false;
function estilo() {
  if (css) return; css = true; const s = document.createElement('style');
  s.textContent = `.pv-ov{position:fixed;inset:0;z-index:9000;background:#0b1130ee;display:grid;place-items:center;padding:16px;overflow:auto}
.pv-box{background:#fff6e0;color:#17224a;border-radius:20px;padding:16px;max-width:420px;width:100%;display:grid;gap:12px;text-align:center}.pv-box h2{margin:0;font-size:18px}
.pv-en{display:grid;gap:6px;justify-items:center;font-weight:800}.pv-en svg{max-width:240px;width:100%}.pv-ops{display:grid;gap:8px;grid-template-columns:1fr 1fr}
.pv-op{border:2px solid #17224a;background:#fff;border-radius:12px;padding:10px;font:inherit;font-weight:800;color:#17224a;cursor:pointer;min-height:48px;display:grid;place-items:center}.pv-op svg{max-width:100%;height:auto}
.pv-op.ok{background:#bdf0c4;border-color:#1c8a3a}.pv-op.no{background:#ffc9c9;border-color:#c4182c}.pv-box .pv-st{font-size:34px;letter-spacing:6px}.pv-bar{font-size:12px;opacity:.7}`;
  document.head.append(s);
}
/** cfg: { chave, titulo, rodadas: [{ enun: string|Node, ouvir?: fn, opcoes: [{ rot: string|()=>Node, ok: bool }] }] } */
export function abrirProva(cfg, aoFim) {
  estilo(); const ov = h('div', { class: 'pv-ov', role: 'dialog', 'aria-modal': 'true', 'aria-label': cfg.titulo }); let i = 0; let acertos = 0;
  const fecha = () => ov.remove();
  const tela = () => {
    const r = cfg.rodadas[i]; let resp = false;
    const ops = emb(r.opcoes).map((o) => { const b = h('button', { type: 'button', class: 'pv-op' }, typeof o.rot === 'function' ? o.rot() : o.rot);
      b.addEventListener('click', () => { if (resp) return; resp = true; if (o.ok) acertos++; b.classList.add(o.ok ? 'ok' : 'no'); ops.forEach((x, k) => { if (r.opcoes && x._ok) x.b.classList.add('ok'); }); setTimeout(() => { i++; i < cfg.rodadas.length ? tela() : fim(); }, 900); });
      return { b, _ok: o.ok }; });
    ov.replaceChildren(h('div', { class: 'pv-box' }, h('small', { class: 'pv-bar' }, `${cfg.titulo} · pergunta ${i + 1} de ${cfg.rodadas.length}`),
      h('div', { class: 'pv-en' }, typeof r.enun === 'string' ? h('span', {}, r.enun) : r.enun, r.ouvir ? h('button', { type: 'button', class: 'btn', onclick: r.ouvir }, '🔊 ouvir') : null),
      h('div', { class: 'pv-ops' }, ...ops.map((x) => x.b)), h('button', { type: 'button', class: 'btn ghost', onclick: fecha }, 'sair')));
    if (r.ouvir) setTimeout(() => { try { r.ouvir(); } catch { /* sem áudio */ } }, 250);
  };
  const fim = async () => {
    const est = estrelasProva(acertos, cfg.rodadas.length);
    ov.replaceChildren(h('div', { class: 'pv-box' }, h('h2', {}, est === 3 ? 'mandou bem demais! 🎉' : est ? 'boa, quase lá!' : 'ainda não foi, mas ouve de novo e tenta'), h('div', { class: 'pv-st', 'aria-label': `${est} estrelas` }, '★'.repeat(est) + '☆'.repeat(3 - est)),
      h('p', {}, `${acertos} de ${cfg.rodadas.length} certas · cada acorde ou ritmo paga até 3 ★ na vida`), h('button', { type: 'button', class: 'btn primary', onclick: fecha }, 'fechar'), h('button', { type: 'button', class: 'btn ghost', onclick: () => { i = 0; acertos = 0; tela(); } }, 'tentar de novo')));
    if (est) { try { const E = await import('../jogos/estrelas-jogo.js'); await E.ganhou('estudos', est, cfg.chave); } catch { /* sem estrela */ } }
    if (aoFim) aoFim(est);
  };
  document.body.append(ov); tela();
}
export const botaoProva = (onclick) => h('button', { type: 'button', class: 'btn small', onclick }, '🎯 prova do Paul · até 3 ★');

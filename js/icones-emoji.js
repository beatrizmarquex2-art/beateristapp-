// Troca, em TODAS as telas, os emojis que têm um ícone novo (Drive "Ícones Beaterista Play", 27/nov/2026) pelo desenho da Bea.
// Como funciona: percorre os textos da página (e tudo que for aparecendo) e, onde acha um emoji da lista, põe um <img> do ícone no lugar (o emoji fica no `alt`).
// Não mexe em: campos de digitação, scripts, SVG, nem em quem tiver `data-sem-icone`. Se o ícone não carregar, volta o emoji. Sem DOM (testes em node): não faz nada.
const EST = 'assets/icones-novos/estado-jogo-musica/'; const ROL = 'assets/icones-novos/roleta-missoes/';
const e = (arq) => `${EST}${arq}.png`; const r = (arq) => `${ROL}${arq}.png`;
export const MAPA = {
  '🔒': e('estado-trancado'), '🔐': e('estado-trancado'), '✅': e('estado-feito'), '🚫': e('estado-bloqueado'), '⛔': e('estado-bloqueado'), '❌': e('acao-fechar'), '✖': e('acao-fechar'), '✕': e('acao-fechar'),
  '🔊': e('acao-som'), '🔉': e('acao-som'), '🔇': e('acao-mudo'), '⏸': e('acao-pausa'),
  '🏆': e('premio-trofeu'), '🏅': e('premio-medalha'), '🎉': e('festa-parabens'), '🎊': e('festa-parabens'), '🎁': e('premio-presente'),
  '🎯': e('jogo-meta'), '⏱': e('jogo-tempo'), '⚡': e('jogo-energia'), '🔥': e('jogo-sequencia'), '🎡': e('jogo-roleta'), '✨': e('jogo-acerto'), '🌟': e('jogo-acerto'), '⭐': e('jogo-acerto'),
  '🥁': e('inst-bateria'), '🎸': e('inst-guitarra'), '🎹': e('inst-teclado'), '🎤': e('inst-microfone'), '🎙': e('inst-microfone'), '🎧': e('inst-fone'),
  '🎼': e('estudo-partitura'), '📖': e('estudo-livro'), '📚': e('estudo-livro'), '💡': e('estudo-dica'), '📁': e('estudo-pasta'), '📂': e('estudo-pasta'),
  '🤘': e('gesto-rock'), '🤫': e('gesto-silencio'),
  '📷': r('acao-print'), '📸': r('acao-print'), '🔗': r('acao-copiar-link'), '📱': r('tipo-wallpaper'), '🗓': r('tipo-planner'), '📅': r('tipo-planner'),
};
const chaves = Object.keys(MAPA).sort((a, b) => b.length - a.length);
const RE = new RegExp(`(${chaves.join('|')})\\ufe0f?`, 'gu');
const PULA = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'OPTION', 'SELECT', 'TITLE', 'NOSCRIPT', 'CODE', 'PRE', 'IMG']);

/** Lista os pedaços de um texto: strings e { emoji, src }. Pura (testada em node). */
export function partes(texto) {
  const out = []; let ult = 0; const s = String(texto);
  s.replace(RE, (m, emo, i) => { if (i > ult) out.push(s.slice(ult, i)); out.push({ emoji: emo, src: MAPA[emo] }); ult = i + m.length; return m; });
  if (!out.length) return null; if (ult < s.length) out.push(s.slice(ult)); return out;
}
const img = ({ emoji, src }) => {
  const i = document.createElement('img'); i.className = 'emo'; i.src = src; i.alt = emoji; i.draggable = false; i.decoding = 'async';
  i.style.cssText = 'height:1.2em;width:1.2em;vertical-align:-.22em;display:inline-block;object-fit:contain;margin:0 .05em';
  i.addEventListener('error', () => { i.replaceWith(document.createTextNode(emoji)); }, { once: true }); // sem o arquivo: volta o emoji
  return i;
};
function ignorado(no) {
  for (let p = no.parentNode; p && p.nodeType === 1; p = p.parentNode) {
    if (PULA.has(p.nodeName) || p.namespaceURI !== 'http://www.w3.org/1999/xhtml' || p.isContentEditable || (p.hasAttribute && p.hasAttribute('data-sem-icone'))) return true;
  }
  return false;
}
function trata(no) {
  if (no.nodeType === 3) { if (!no.nodeValue || ignorado(no)) return; const ps = partes(no.nodeValue); if (!ps) return; const f = document.createDocumentFragment(); ps.forEach((p) => f.append(typeof p === 'string' ? document.createTextNode(p) : img(p))); no.replaceWith(f); return; }
  if (no.nodeType !== 1 || PULA.has(no.nodeName) || no.namespaceURI !== 'http://www.w3.org/1999/xhtml') return;
  const w = document.createTreeWalker(no, NodeFilter.SHOW_TEXT); const lista = []; while (w.nextNode()) lista.push(w.currentNode); lista.forEach(trata);
}
export function ligar(raiz = typeof document !== 'undefined' ? document.body : null) {
  if (typeof document === 'undefined' || !raiz || raiz.__emo) return; raiz.__emo = true;
  let fila = new Set(); let agendado = false;
  const roda = () => { agendado = false; const l = [...fila]; fila = new Set(); l.forEach((n) => { if (n.isConnected) trata(n); }); };
  const mo = new MutationObserver((ms) => { for (const m of ms) { if (m.type === 'characterData') fila.add(m.target); else m.addedNodes.forEach((n) => fila.add(n)); } if (!agendado) { agendado = true; requestAnimationFrame(roda); } });
  mo.observe(raiz, { childList: true, subtree: true, characterData: true }); trata(raiz);
}
if (typeof document !== 'undefined') { if (document.body) ligar(); else document.addEventListener('DOMContentLoaded', () => ligar(), { once: true }); }

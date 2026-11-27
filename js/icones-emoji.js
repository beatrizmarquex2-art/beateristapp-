// Troca os emojis de interface pelos ícones da Bea (assets/icones-loja) em toda a área dos alunos, sem mexer em cada tela.
// Só mexe em TEXTO visível (nunca em campos, listas de opções, scripts ou onde estiver `data-sem-icone`). O emoji original fica no `alt`.
const MAPA = {
  '🔒': 'estado-trancado', '✓': 'estado-feito', '✔': 'estado-feito', '✕': 'acao-fechar', '🚫': 'estado-bloqueado', '⏸': 'acao-pausa', '🔊': 'acao-som', '🔇': 'acao-mudo',
  '🏆': 'premio-trofeu', '🏅': 'premio-medalha', '🎉': 'festa-parabens', '🎁': 'premio-presente', '💥': 'jogo-acerto', '🔥': 'jogo-sequencia', '🎯': 'jogo-meta', '⏱': 'jogo-tempo', '⚡': 'jogo-energia', '🎡': 'jogo-roleta',
  '🥁': 'inst-bateria', '🎸': 'inst-guitarra', '🎹': 'inst-teclado', '🎤': 'inst-microfone', '🎙': 'inst-microfone', '🎧': 'inst-fone',
  '🎼': 'estudo-partitura', '📖': 'estudo-livro', '💡': 'estudo-dica', '📁': 'estudo-pasta', '🤘': 'gesto-rock', '🤫': 'gesto-silencio',
};
const PEQUENOS = new Set(['estado-trancado', 'estado-feito', 'acao-fechar', 'acao-pausa', 'acao-som', 'acao-mudo']); // têm versão de 32 px, mais nítida em tamanho de texto
const RE = new RegExp(`(${Object.keys(MAPA).join('|')})️?`, 'g');
const PULAR = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'OPTION', 'SELECT', 'TITLE', 'CANVAS', 'NOSCRIPT']);
const TEM = new RegExp(Object.keys(MAPA).join('|'));

function pula(el) { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { if (PULAR.has(e.tagName) || e.hasAttribute('data-sem-icone') || e.isContentEditable) return true; } return false; }
function img(emoji) {
  const nome = MAPA[emoji]; const i = document.createElement('img');
  i.className = 'ic-emoji'; i.src = `assets/icones-loja/${nome}${PEQUENOS.has(nome) ? '-32' : ''}.png`; i.alt = emoji; i.draggable = false; i.decoding = 'async'; return i;
}
function trocarTexto(no) {
  const t = no.nodeValue; if (!t || !TEM.test(t) || !no.parentElement || pula(no.parentElement)) return;
  RE.lastIndex = 0; let m; let atual = no; let ate = 0; const achados = [];
  while ((m = RE.exec(t))) achados.push([m.index, m[0].length, m[1]]);
  // de trás pra frente: o nó original continua sendo o começo do texto (quem guarda a referência dele não perde)
  for (let k = achados.length - 1; k >= 0; k--) { const [ini, len, emoji] = achados[k]; const resto = no.splitText(ini); const depois = len < resto.nodeValue.length ? resto.splitText(len) : null; resto.replaceWith(img(emoji)); void depois; }
  void atual; void ate;
}
function varrer(raiz) {
  if (raiz.nodeType === 3) { trocarTexto(raiz); return; }
  if (raiz.nodeType !== 1 || pula(raiz)) return;
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (TEM.test(n.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
  const lista = []; for (let n = w.nextNode(); n; n = w.nextNode()) lista.push(n);
  lista.forEach(trocarTexto);
}
let ligado = false;
export function iniciar(raiz = document.body) {
  if (ligado || !raiz) return; ligado = true; varrer(raiz);
  let fila = []; let agendado = false;
  const rodar = () => { agendado = false; const l = fila; fila = []; for (const n of l) if (n.isConnected) varrer(n); };
  new MutationObserver((muts) => {
    for (const m of muts) { if (m.type === 'characterData') fila.push(m.target); else m.addedNodes.forEach((n) => { if (n.nodeType === 1 && n.classList && n.classList.contains('ic-emoji')) return; fila.push(n); }); }
    if (!agendado) { agendado = true; (window.requestAnimationFrame || setTimeout)(rodar); }
  }).observe(raiz, { childList: true, subtree: true, characterData: true });
}

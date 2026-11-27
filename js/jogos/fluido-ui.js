// Peças visuais dos jogos "fluidos" (placar em pílulas e botões redondos): ícones próprios em SVG. Usado no cara a cara (o quebra-cabeça tem os dele em quebra.js).
const ICO = {
  pergunta: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.6 2.2c-.8.5-1.2 1-1.2 1.8M12 17v.1"/>',
  coracao: '<path d="M12 19.5s-7-4.2-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7 2.300c0 5-7 9.200-7 9.200z"/>',
  cartas: '<rect x="4.5" y="7" width="11" height="13.5" rx="2"/><path d="M8.5 4.500h8a3 3 0 0 1 3 3V16"/>',
  alvo: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".9"/>',
  olho: '<path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z"/><circle cx="12" cy="12" r="2.800"/>',
  desfazer: '<path d="M8.500 7l-4 4.500 4 4.500M4.500 11.500H14a5 5 0 0 1 0 10h-3"/>',
  recomecar: '<path d="M20 12a8 8 0 1 1-2.600-5.900M20 4v4.500h-4.500"/>',
  sair: '<path d="M14 4.500h4.500A1.500 1.500 0 0 1 20 6v12a1.500 1.500 0 0 1-1.500 1.500H14M10 8l-4 4 4 4M6 12h10"/>',
  historico: '<path d="M5 6.500h14M5 12h14M5 17.500h9"/>',
};
export function ico(k) { const t = document.createElement('template'); t.innerHTML = `<svg class="qz-i" viewBox="0 0 24 24" aria-hidden="true">${ICO[k] || ''}</svg>`; return t.content.firstChild; }

// "CABE NA TELA" dos jogos (pedido da Bea, nov/2026): o jogo NÃO vira rolagem. A página trava, o quadro do jogo ocupa o espaço entre o topo e o menu de baixo
// e, se o conteúdo for mais alto que isso, ele é reduzido na proporção certa (transform: scale) até caber inteiro, em qualquer tela:
// celular em pé/deitado, iPad, MacBook, notebook Windows (com zoom 125%/150%), monitor grande.
//  * Reduz só até MIN (0.8). Telas de configuração muito compridas (que não são "jogo") ficam no tamanho normal e rolam DENTRO do quadro (uma rolagem só, nunca barra dentro de barra).
//  * Recalcula sozinho quando o jogo troca de tela, a imagem carrega, a janela muda ou o aparelho gira.
//  * Em celular deitado (altura < 520px) o menu de baixo e o topo do app saem de cena enquanto o jogo está aberto (css: html.jg-fit).
const MIN = 0.8; // reduz no máximo 20% (botões continuam do tamanho de dedo); se precisar mais, rola só dentro do quadro

export function cabeNaTela(wrap, body) {
  const de = document.documentElement; de.classList.add('jg-fit'); wrap.classList.add('jg-fitted');
  let raf = 0; let vivo = true; let ult = '';
  const altura = () => (window.visualViewport ? window.visualViewport.height : window.innerHeight);
  const limpa = () => { body.style.transform = ''; body.style.transformOrigin = ''; body.style.height = ''; body.style.overflowY = ''; wrap.style.height = ''; wrap.classList.remove('jg-fit-rola', 'jg-fit-reduzido', 'jg-fluido'); };
  const aplica = () => {
    raf = 0; if (!vivo || !wrap.isConnected || de.classList.contains('kb-open')) return; // teclado aberto: não mexe (a altura encolhe de propósito)
    if (window.scrollY) window.scrollTo(0, 0);
    const fluido = !!body.querySelector(':scope > .jg-fluido-root');
    if (!fluido) { body.style.transform = ''; body.style.transformOrigin = ''; body.style.height = ''; body.style.overflowY = ''; wrap.classList.remove('jg-fit-rola', 'jg-fit-reduzido'); } // (só os jogos que reduzem precisam medir o tamanho natural)
    const nav = document.querySelector('.bottom-nav'); const ns = nav ? getComputedStyle(nav) : null;
    const navTop = nav && ns.display !== 'none' && ns.visibility !== 'hidden' && ns.position === 'fixed' ? nav.getBoundingClientRect().top : altura();
    const topo = wrap.getBoundingClientRect().top; const folga = Math.floor(navTop - topo - 8);
    const cab = body.getBoundingClientRect().top - topo; // cabeçalho do jogo (voltar, título, pausa…): não depende da altura do corpo
    const disp = folga - cab; if (disp < 80) return;
    // jogo "fluido" (refeito pra se redistribuir sozinho, ex.: quebra-cabeça): ocupa EXATAMENTE o espaço que sobra e organiza o próprio layout.
    // Não zera a altura antes de medir (isso fazia a tela "piscar" e voltar a rolagem da bandeja pro começo).
    if (fluido) { wrap.classList.add('jg-fluido'); const hpx = `${Math.floor(disp)}px`; if (body.style.height !== hpx) body.style.height = hpx; ult = 'fluido'; return; }
    wrap.classList.remove('jg-fluido');
    const nat = Math.max(body.scrollHeight, body.getBoundingClientRect().height);
    if (nat <= disp + 1) { wrap.style.height = ''; ult = 'cabe'; return; } // já cabe
    const s = disp / nat;
    if (s >= MIN) { // reduz até caber
      body.style.transformOrigin = 'top center'; body.style.transform = `scale(${s.toFixed(4)})`; body.style.height = `${Math.floor(disp)}px`; wrap.classList.add('jg-fit-reduzido');
      ult = `s${s.toFixed(3)}`; return;
    }
    body.style.height = `${Math.floor(disp)}px`; body.style.overflowY = 'auto'; wrap.classList.add('jg-fit-rola'); ult = 'rola'; // muito comprido (formulário/regras): rola só aqui dentro
  };
  const agenda = () => { if (!raf && vivo) raf = requestAnimationFrame(aplica); };
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(agenda) : null; if (ro) ro.observe(de); // (nunca observa o corpo: a própria moldura muda a altura dele e entraria em loop)
  const mo = new MutationObserver((ms) => { if (ms.some((m) => [...m.addedNodes, ...m.removedNodes].some((n) => n.nodeType === 1))) agenda(); }); mo.observe(body, { childList: true, subtree: true }); // só muda de tela de verdade (elementos), não o relógio que troca texto
  window.addEventListener('resize', agenda); window.addEventListener('orientationchange', agenda); body.addEventListener('load', agenda, true);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', agenda);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(agenda);
  agenda(); setTimeout(agenda, 350); setTimeout(agenda, 1200); // 2ª e 3ª passadas: fontes, imagens e animações de entrada
  wrap.__cabe = { atual: () => ult, recalcula: aplica };
  return () => {
    vivo = false; if (raf) cancelAnimationFrame(raf); if (ro) ro.disconnect(); mo.disconnect();
    window.removeEventListener('resize', agenda); window.removeEventListener('orientationchange', agenda); body.removeEventListener('load', agenda, true);
    if (window.visualViewport) window.visualViewport.removeEventListener('resize', agenda);
    de.classList.remove('jg-fit'); wrap.classList.remove('jg-fitted'); limpa();
  };
}

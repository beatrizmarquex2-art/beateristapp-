// "CABE NA TELA" dos jogos (pedido da Bea, nov/2026): o jogo NÃO vira rolagem. A página trava, o quadro do jogo ocupa o espaço entre o topo e o menu de baixo
// e, se o conteúdo for mais alto que isso, ele é reduzido na proporção certa (transform: scale) até caber inteiro, em qualquer tela:
// celular em pé/deitado, iPad, MacBook, notebook Windows (com zoom 125%/150%), monitor grande.
//  * Reduz só até MIN (0.62). Telas de configuração muito compridas (que não são "jogo") ficam no tamanho normal e rolam DENTRO do quadro (uma rolagem só, nunca barra dentro de barra).
//  * Recalcula sozinho quando o jogo troca de tela, a imagem carrega, a janela muda ou o aparelho gira.
//  * Em celular deitado (altura < 520px) o menu de baixo e o topo do app saem de cena enquanto o jogo está aberto (css: html.jg-fit).
const MIN = 0.62;

export function cabeNaTela(wrap, body) {
  const de = document.documentElement; de.classList.add('jg-fit'); wrap.classList.add('jg-fitted');
  let raf = 0; let vivo = true; let ult = '';
  const altura = () => (window.visualViewport ? window.visualViewport.height : window.innerHeight);
  const limpa = () => { body.style.transform = ''; body.style.transformOrigin = ''; body.style.height = ''; body.style.overflowY = ''; wrap.style.height = ''; wrap.classList.remove('jg-fit-rola', 'jg-fit-reduzido'); };
  const aplica = () => {
    raf = 0; if (!vivo || !wrap.isConnected || de.classList.contains('kb-open')) return; // teclado aberto: não mexe (a altura encolhe de propósito)
    if (window.scrollY) window.scrollTo(0, 0);
    limpa();
    const nav = document.querySelector('.bottom-nav'); const ns = nav ? getComputedStyle(nav) : null;
    const navTop = nav && ns.display !== 'none' && ns.visibility !== 'hidden' && ns.position === 'fixed' ? nav.getBoundingClientRect().top : altura();
    const topo = wrap.getBoundingClientRect().top; const folga = Math.floor(navTop - topo - 8);
    const cab = body.getBoundingClientRect().top - topo; // cabeçalho do jogo (voltar, título, pausa…)
    const disp = folga - cab; if (disp < 80) return;
    const nat = Math.max(body.scrollHeight, body.getBoundingClientRect().height);
    if (nat <= disp + 1) { wrap.style.height = ''; return; } // já cabe
    const s = disp / nat;
    if (s >= MIN) { // reduz até caber
      body.style.transformOrigin = 'top center'; body.style.transform = `scale(${s.toFixed(4)})`; body.style.height = `${Math.floor(disp)}px`; wrap.classList.add('jg-fit-reduzido');
      ult = `s${s.toFixed(3)}`; return;
    }
    body.style.height = `${Math.floor(disp)}px`; body.style.overflowY = 'auto'; wrap.classList.add('jg-fit-rola'); ult = 'rola'; // muito comprido (formulário/regras): rola só aqui dentro
  };
  const agenda = () => { if (!raf && vivo) raf = requestAnimationFrame(aplica); };
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(agenda) : null; if (ro) { ro.observe(body); ro.observe(de); }
  const mo = new MutationObserver(agenda); mo.observe(body, { childList: true, subtree: true, characterData: true });
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

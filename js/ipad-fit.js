// iPad/tablet: a tela abre no tamanho certo e NÃO sai rolando em volta quando alguém dá zoom sem querer.
//  * viewport fixo (largura do aparelho, sem zoom) em telas de toque; o iPadOS no modo "site para computador" ignora a largura, então reaplicamos no JS;
//  * o beliscão (pinch) de zoom do Safari é cancelado (gesturestart) — junto com touch-action no CSS;
//  * se a página mesmo assim ficar mais larga que a tela, volta pro começo em vez de ficar "flutuando".
const touch = (navigator.maxTouchPoints || 0) > 1;
if (touch) {
  const meta = document.querySelector('meta[name="viewport"]');
  const FIX = 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, viewport-fit=cover';
  if (meta && meta.content !== FIX) meta.content = FIX;
  for (const ev of ['gesturestart', 'gesturechange']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
  const volta = () => { if (window.scrollX) window.scrollTo(0, window.scrollY); };
  window.addEventListener('scroll', volta, { passive: true }); window.addEventListener('orientationchange', () => setTimeout(volta, 300));
}

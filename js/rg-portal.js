// iPad/Safari: dentro de alguns elementos pais (animação de entrada, translate, overflow) o position:fixed do jogo de ritmo vira uma "caixa" menor que a
// tela e o jogo aparece cortado (topo, base e laterais). Enquanto o jogo roda (body.rz-lock) a tela do jogo é levada pro <body>, onde o position:fixed
// vale pra tela toda, e quando acaba ela volta pro lugar de origem. Serve pro Beat Hero normal, pra aventura e pro duelo.
export function portal(el) {
  let marca = null; let fora = false;
  const volta = () => {
    if (!fora) return; fora = false;
    if (marca && marca.parentNode) marca.parentNode.replaceChild(el, marca); else el.remove();
    marca = null;
  };
  const sync = () => {
    const jogando = document.body.classList.contains('rz-lock');
    if (jogando && !fora && el.isConnected && el.parentNode !== document.body) { marca = document.createComment('rg-host'); el.parentNode.replaceChild(marca, el); document.body.append(el); fora = true; }
    else if (!jogando && fora) volta();
  };
  const mo = new MutationObserver(sync); mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  sync();
  return () => { mo.disconnect(); volta(); };
}

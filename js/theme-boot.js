// Aplica o tema salvo ANTES da primeira pintura (evita piscar). Só guarda preferência visual, nada pessoal.
try {
  var d = document.documentElement, t = localStorage.getItem('beaterista-theme'), m = localStorage.getItem('beaterista-motion'), f = localStorage.getItem('beaterista-font') || 'marcador';
  d.setAttribute('data-theme', 'rabisco'); // único tema por enquanto
  // Android e outros: o navegador já tem barra de rolagem boa e o celular costuma ser mais simples; o CSS tira os efeitos pesados (modo leve)
  var ua = navigator.userAgent || '', apple = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  d.classList.add(apple ? 'apple' : 'lite');
  if (!window.__BT_ALUNO) d.setAttribute('data-space', localStorage.getItem('bt-space') === 'beaterista' ? 'beaterista' : 'bea'); // só o app da Bea (a área dos alunos não tem espaços)
  if (f !== 'bodoni') d.setAttribute('data-font', f);
  if (m === 'off') d.setAttribute('data-motion', 'off');
} catch (e) { /* armazenamento bloqueado: segue com o tema padrão */ }

// Aplica o tema salvo ANTES da primeira pintura (evita piscar). Só guarda preferência visual, nada pessoal.
try {
  var d = document.documentElement, t = localStorage.getItem('beaterista-theme'), m = localStorage.getItem('beaterista-motion'), f = localStorage.getItem('beaterista-font') || 'marcador';
  d.setAttribute('data-theme', 'rabisco'); // único tema por enquanto
  if (!window.__BT_ALUNO) d.setAttribute('data-space', localStorage.getItem('bt-space') === 'beaterista' ? 'beaterista' : 'bea'); // só o app da Bea (a área dos alunos não tem espaços)
  if (f !== 'bodoni') d.setAttribute('data-font', f);
  if (m === 'off') d.setAttribute('data-motion', 'off');
} catch (e) { /* armazenamento bloqueado: segue com o tema padrão */ }

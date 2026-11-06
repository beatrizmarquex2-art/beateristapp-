// Aula ao vivo do Toca Aqui: a professora monta a partitura (1 a 4 compassos, cada tempo uma célula rítmica), escolhe o andamento e abre uma sala por código.
// Os alunos entram com o código (quantos forem), veem a partitura e tocam na bateria (microfone) ou na tela; quando a professora aperta "começar pra todos"
// começa a contagem em todos os celulares. Cada aluno vê o seu resultado (precisão). Usa as salas por código (online.js, funções sala_*, jogo "tocaprof").
import { h } from '../util.js';
import { CELLS, TIERS } from '../reading.js';
import { score as pauta, chunk, schedule } from '../views/treinos.js';
import { audio } from '../audio.js';
import { criarSala, entrarSala } from './online.js';
import { linha, chips, passo, ajuda } from './opcoes.js';

const JOGO = 'tocaprof';
const BPMS = Array.from({ length: 25 }, (_, i) => 40 + i * 5).map((b) => [b, `${b} bpm`]);
const COMPASSOS = [[1, '1 compasso'], [2, '2'], [3, '3'], [4, '4']];
export const nomeDaCelula = (p) => (CELLS.find((c) => c.p === p) || { name: p }).name;
/** A partitura que chega pela sala só vale se for 1 a 4 compassos de 4 tempos, cada tempo uma das células conhecidas. */
export const barValida = (bar) => Array.isArray(bar) && bar.length >= 4 && bar.length <= 16 && bar.length % 4 === 0 && bar.every((p) => CELLS.some((c) => c.p === p));
export const bpmValido = (bpm) => Number.isFinite(bpm) && bpm >= 30 && bpm <= 220;
/** Estado da aula (o que a professora publica). `go` sobe a cada "começar pra todos"; `rev` sobe quando ela troca a partitura. */
export const estadoAula = ({ titulo, bar, bpm }, go = 0, rev = 1) => ({ v: 1, titulo: String(titulo || '').slice(0, 60), bar: bar.slice(), bpm, go, rev });
export const aulaValida = (e) => !!e && e.v === 1 && barValida(e.bar) && bpmValido(e.bpm) && Number.isFinite(e.go) && Number.isFinite(e.rev);

export function mountAulaToca(host) {
  let gone = false; let conn = null; let player = null; let L = null; const timers = [];
  const root = h('div', { class: 'au-toca' }); host.replaceChildren(root);
  const later = (fn, ms) => { const t = setTimeout(() => { if (!gone) fn(); }, ms); timers.push(t); return t; };
  const cleanupPlayer = () => { if (player) { try { player.destroy(); } catch { /* ok */ } player = null; } };
  const fechaSala = () => { if (conn) { try { conn.close(); } catch { /* ok */ } conn = null; } };

  /* ---------- começo ---------- */
  function inicio() {
    cleanupPlayer(); fechaSala();
    root.replaceChildren(
      h('div', { class: 'au-esc' },
        h('button', { type: 'button', class: 'btn primary', onclick: () => editor() }, '🎼 sou professora: criar a partitura'),
        h('button', { type: 'button', class: 'btn', onclick: () => entrar() }, '🥁 sou aluna: entrar com o código')));
  }

  /* ---------- professora: editor ---------- */
  const rascunho = { titulo: '', n: 1, bar: ['1000', '1000', '1000', '1000'], bpm: 70 };
  function editor() {
    cleanupPlayer(); fechaSala();
    const r = rascunho; while (r.bar.length < r.n * 4) r.bar.push('1000'); r.bar.length = r.n * 4;
    const nomes = CELLS.map((c) => [c.p, c.name]);
    const sels = r.bar.map((p, i) => h('select', { class: 'dl-sel au-cel', 'aria-label': `tempo ${i + 1}`, onchange: (e) => { r.bar[i] = e.target.value; editor(); } }, ...nomes.map(([v, n]) => h('option', { value: v, selected: v === p || null }, n))));
    const ouvir = () => { try { audio(); schedule(r.bar, r.bpm, { play: true }); } catch { /* ok */ } };
    const msg = h('p', { class: 'jg-msg', 'aria-live': 'polite' });
    const criar = async () => {
      msg.textContent = 'criando a aula…';
      try { const { code, conn: c } = await criarSala(JOGO, estadoAula(r)); conn = c; painelProfessora(code, estadoAula(r)); }
      catch { msg.textContent = 'não consegui criar a aula. confira a internet e tente de novo'; }
    };
    root.replaceChildren(
      h('section', { class: 'card pad dl-cfg' }, h('b', {}, 'monte a partitura'),
        h('input', { type: 'text', class: 'field', maxlength: 60, placeholder: 'nome da atividade (opcional)', 'aria-label': 'Nome da atividade', value: r.titulo, oninput: (e) => { r.titulo = e.target.value; } }),
        linha('compassos', chips(COMPASSOS, r.n, (v) => { r.n = v; editor(); }, 'compassos')),
        linha('andamento', passo(BPMS, r.bpm, (v) => { r.bpm = v; editor(); }, 'andamento')),
        pauta(chunk(r.bar)),
        h('p', { class: 'muted au-dica' }, 'escolha uma célula pra cada tempo (4 tempos por compasso):'),
        h('div', { class: 'au-cels' }, ...sels.map((s, i) => h('label', { class: 'au-cel-l' }, h('small', {}, `${Math.floor(i / 4) + 1}.${(i % 4) + 1}`), s))),
        h('div', { class: 'row tr-actions' }, h('button', { type: 'button', class: 'btn', onclick: ouvir }, '▶ ouvir'), h('button', { type: 'button', class: 'btn primary', onclick: criar }, 'criar a aula ao vivo')), msg),
      h('p', { class: 'muted' }, h('a', { href: '#/jogos/toca/livre', onclick: (e) => { e.preventDefault(); inicio(); } }, '‹ voltar')));
  }

  /* ---------- professora: sala aberta ---------- */
  function painelProfessora(code, est) {
    let atual = est; let contando = false;
    const status = h('p', { class: 'jg-msg', role: 'status', 'aria-live': 'polite' });
    const comecar = async () => {
      if (contando) return; contando = true; status.textContent = 'avisando a turma… 3, 2, 1';
      const novo = { ...atual, go: atual.go + 1 };
      for (let i = 0; i < 4; i++) { if (await conn.push(novo)) { atual = novo; break; } await new Promise((ok) => setTimeout(ok, 900)); }
      status.textContent = 'a turma recebeu o sinal: contagem rolando!'; later(() => { contando = false; status.textContent = ''; }, 6000);
    };
    root.replaceChildren(h('section', { class: 'card pad au-sala' },
      h('p', { class: 'jg-lab' }, 'código da aula'), h('div', { class: 'jg-code', role: 'status', 'aria-label': `código ${code.split('').join(' ')}` }, code),
      h('p', { class: 'jg-p' }, 'os alunos abrem o Toca Aqui › aula ao vivo › “sou aluna” e digitam o código.'),
      h('b', {}, est.titulo || 'sem nome'), h('small', { class: 'muted' }, `${est.bpm} bpm · ${est.bar.length / 4} compasso${est.bar.length > 4 ? 's' : ''}`), pauta(chunk(est.bar)),
      h('div', { class: 'row tr-actions' }, h('button', { type: 'button', class: 'btn primary', onclick: comecar }, '▶ começar pra todos'), h('button', { type: 'button', class: 'btn ghost', onclick: () => editor() }, 'mudar a partitura')), status,
      h('p', { class: 'muted' }, 'cada aluno toca no seu aparelho (microfone na bateria ou na tela) e vê a própria precisão. a sala dura 1 dia.')));
  }

  /* ---------- aluna ---------- */
  function entrar() {
    cleanupPlayer(); fechaSala();
    const inp = h('input', { type: 'text', class: 'jg-code-in', maxlength: 5, autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'CÓDIGO', 'aria-label': 'código da aula', oninput: (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); }, onkeydown: (e) => { if (e.key === 'Enter') ir(); } });
    const msg = h('p', { class: 'jg-msg', 'aria-live': 'polite' });
    const ir = async () => {
      const c = inp.value.trim(); if (c.length !== 5) { msg.textContent = 'o código tem 5 letras ou números'; return; }
      msg.textContent = 'entrando…';
      try { const r = await entrarSala(c, JOGO); if (!r || !aulaValida(r.estado)) { msg.textContent = 'não achei essa aula. confira o código com a professora'; return; } conn = r.conn; tocar(r.estado); }
      catch { msg.textContent = 'sem internet ou o serviço não respondeu. tente de novo'; }
    };
    root.replaceChildren(h('section', { class: 'card pad' }, h('b', {}, 'código da aula'), h('div', { class: 'jg-actions row' }, inp, h('button', { class: 'btn primary', type: 'button', onclick: ir }, 'entrar')), msg),
      h('p', { class: 'muted' }, h('a', { href: '#/jogos/toca/livre', onclick: (e) => { e.preventDefault(); inicio(); } }, '‹ voltar')));
  }
  async function tocar(est) {
    let atual = est; let boxEl = null; const aviso = h('p', { class: 'jg-msg', role: 'status', 'aria-live': 'polite' });
    if (!L) L = await import('../views/leitura-missao.js');
    const monta = () => {
      cleanupPlayer(); boxEl = h('div', { class: 'au-play' });
      cab.replaceChildren(h('b', {}, atual.titulo || 'aula ao vivo'), h('small', { class: 'muted' }, ` ${atual.bpm} bpm · ${atual.bar.length / 4} compasso${atual.bar.length > 4 ? 's' : ''}`));
      stage.replaceChildren(boxEl);
      player = L.mountLeituraMissao(boxEl, { bar: atual.bar, bpm: atual.bpm, mic: true, onResult: () => { aviso.textContent = 'muito bem! quando a professora mandar de novo, é só tocar outra vez.'; } });
    };
    const cab = h('section', { class: 'card pad au-cab' }); const stage = h('div', {});
    root.replaceChildren(cab, aviso, stage, h('p', { class: 'muted' }, h('a', { href: '#/jogos/toca/livre', onclick: (e) => { e.preventDefault(); inicio(); } }, '‹ sair da aula')));
    monta(); aviso.textContent = 'esperando a professora começar… (se quiser, toque agora por conta própria)';
    conn.on.state = (novo) => {
      if (gone || !aulaValida(novo)) return;
      const trocou = novo.rev !== atual.rev; const go = novo.go > atual.go; atual = novo;
      if (trocou) { monta(); aviso.textContent = 'a professora trocou a partitura.'; }
      if (go) { aviso.textContent = 'valendo! contagem…'; later(() => { const b = boxEl && boxEl.querySelector('.tr-actions .btn.primary'); if (b && !b.disabled) b.click(); }, 400); }
    };
  }
  inicio();
  return () => { gone = true; timers.forEach((t) => clearTimeout(t)); cleanupPlayer(); fechaSala(); };
}
export { TIERS };

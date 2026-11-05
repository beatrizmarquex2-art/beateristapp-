// Modo Aventura do STOP musical (individual). A partida é a do jogo (stop.js + stop-logic.js): categorias oficiais, validação e revisão
// ficam como estão. A missão só LÊ o resultado que o jogo já calculou (matchSummary): pontos confirmados, acertos, pendentes.
//
// Pontuação real (solo): 10 pontos por resposta válida (reconhecida pelo banco OU aprovada na revisão), 0 para inválida/vazia.
// Máximo por categoria = 10; por rodada = 10 × nº de categorias; por missão = rodadas × 10 × categorias (todos os números abaixo vêm daí).
//
// PENDENTES (resposta que o banco não conhece, "aguardando revisão"): o jogador pode aprová-la/rejeitá-la na revisão (decisão do jogo,
// vale como acerto/erro conforme decidido) ou "deixar pendente". Pendente deixada vale 0 e NÃO é contada como erro nem como acerto:
//   - se os pontos já confirmados batem a meta, a missão conclui (as pendentes não entram na conta);
//   - se NÃO batem a meta mas as pendentes poderiam ter batido (pontos + 10 × pendentes ≥ meta), o resultado é INCONCLUSIVO:
//     não conclui, não é tratado como derrota "de verdade" (o texto pede pra revisar as pendentes na próxima tentativa);
//   - se nem com todas as pendentes valendo daria, é derrota normal.
// Tempo: é o tempo por rodada do próprio jogo (explícito no objetivo). Ao acabar, as respostas escritas são guardadas e valem normalmente;
// o tempo NÃO entra em nenhum critério de estrela.
import { mount as mountGame } from '../../jogos/stop.js';

const PTS = 10; // = POINTS.unique de stop-logic.js
const ALL = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'J', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V'];

/** Como avaliar uma partida: puro. `q` = params da missão; `r` = matchSummary do jogo. */
export function judge(q, r) {
  const max = q.rounds * q.cats.length * PTS;
  const ok = !!r && Number.isFinite(r.pontos) && r.rodadas === q.rounds && r.rounds === q.rounds && Array.isArray(r.cats) && r.cats.length === q.cats.length && r.max === max && r.pontos >= 0 && r.pontos <= max;
  if (!ok) return { done: false, stars: 0, summary: ['a partida não terminou (todas as rodadas precisam ser confirmadas).'] };
  const pend = Math.max(0, Number(r.pendentes) || 0); const p = r.pontos;
  const sum = [`${p} de ${max} pontos possíveis (meta: ${q.goal})`, `${r.acertos} respostas válidas de ${q.rounds * q.cats.length}`];
  if (p >= q.goal) {
    const stars = p >= q.s3 ? 3 : p >= q.s2 ? 2 : 1;
    if (pend) sum.push(`${pend} resposta(s) ficaram aguardando revisão: não contaram nem a favor nem contra.`);
    if (stars < 3) sum.push(`próxima estrela com ${stars === 1 ? q.s2 : q.s3} pontos.`);
    return { done: true, stars, summary: sum, label: `${p} pts` };
  }
  if (pend && p + pend * PTS >= q.goal) { sum.push(`${pend} resposta(s) ficaram aguardando revisão e poderiam mudar o resultado: não contaram nem como acerto nem como erro. Resultado inconclusivo: na próxima, resolva as pendentes (aprovar ou rejeitar) antes de confirmar a rodada.`); return { done: false, stars: 0, summary: sum, label: `${p} pts` }; }
  sum.push(`faltaram ${q.goal - p} pontos pra meta.`);
  return { done: false, stars: 0, summary: sum };
}

const mk = (n, title, tag, cats, seconds, rounds, goal, s2, s3, letters, combo, extra = []) => {
  const q = { cats, seconds, rounds, letters, goal, s2, s3 };
  const max = rounds * cats.length * PTS;
  return {
    id: `stop-${String(n).padStart(2, '0')}`, title, tag,
    goal: `faça ${goal} pontos ou mais em ${rounds === 1 ? '1 rodada' : `${rounds} rodadas`} de ${seconds} s (${cats.length} categorias: ${combo})`,
    rules: [
      `cada resposta válida e que comece com a letra vale 10 pontos. máximo: ${cats.length * PTS} por rodada, ${max} na missão.`,
      `tempo: ${seconds} s por rodada. quando acaba, o que você escreveu é guardado e vale normalmente: o tempo não tira pontos nem estrelas.`,
      'resposta que o jogo não conhece fica “aguardando revisão”: aprove ou rejeite na correção. se deixar pendente, ela não conta nem a favor nem contra.',
      ...extra,
    ],
    stars: [`concluir: ${goal} pontos ou mais`, `${s2} pontos ou mais`, `${s3} pontos ou mais (máximo possível: ${max})`],
    params: q,
    evaluate: (r) => judge(q, r),
  };
};

export const spec = {
  id: 'stop', title: 'STOP musical', theme: 'stop',
  missions: [
    mk(0, 'Primeiro STOP', 'tutorial', ['instrumento', 'estilo', 'banda', 'cantor', 'musica'], 90, 1, 30, 40, 50, ['B', 'C', 'F', 'G', 'P', 'R', 'S', 'T', 'V'], 'instrumento, estilo, banda, cantor e música', [
      'tutorial: o jogo sorteia uma letra, você escreve uma palavra de cada categoria que comece com ela e aperta STOP! (ou espera o tempo). Depois confere a correção e confirma a rodada.']),
    mk(1, 'Só cultura', 'só cultura', ['cantor', 'banda', 'musica', 'album', 'brasileiro'], 90, 2, 50, 70, 90, ALL, 'cantor, banda, música, álbum e artista brasileiro'),
    mk(2, 'Teoria e instrumentos', 'sem cultura', ['instrumento', 'percussao', 'estilo', 'profissao', 'tecnica'], 85, 2, 50, 70, 90, ['A', 'B', 'C', 'G', 'P', 'R', 'S', 'T'], 'instrumento, percussão, estilo, profissão e técnicas'),
    mk(3, 'Mistura leve', 'mista', ['instrumento', 'estilo', 'tecnica', 'cantor', 'banda', 'musica'], 80, 3, 90, 130, 160, ['B', 'C', 'D', 'F', 'G', 'L', 'P', 'R', 'S', 'T', 'V'], 'instrumento, estilo, técnicas, cantor, banda e música'),
    mk(4, 'Palco e estúdio', 'sem cultura', ['instrumento', 'percussao', 'equipamento', 'marca', 'estilo', 'tecnica'], 80, 3, 100, 140, 160, ['A', 'B', 'C', 'P', 'R', 'S', 'T'], 'instrumento, percussão, equipamentos, marca, estilo e técnicas'),
    mk(5, 'Cultura e estilo', 'cultura +', ['cantor', 'banda', 'musica', 'album', 'brasileiro', 'estilo'], 75, 3, 100, 140, 160, ALL, 'cantor, banda, música, álbum, brasileiro e estilo'),
    mk(6, 'Mista de 7', 'mista', ['instrumento', 'equipamento', 'estilo', 'profissao', 'cantor', 'banda', 'album'], 75, 3, 130, 160, 190, ['A', 'B', 'C', 'L', 'P', 'R', 'S', 'T'], 'instrumento, equipamentos, estilo, profissão, cantor, banda e álbum'),
    mk(7, 'Teoria e bastidores', 'sem cultura', ['instrumento', 'percussao', 'equipamento', 'marca', 'estilo', 'profissao', 'tecnica'], 70, 3, 130, 160, 190, ['A', 'B', 'C', 'P', 'R', 'S', 'T'], 'instrumento, percussão, equipamentos, marca, estilo, profissão e técnicas'),
    mk(8, 'Mista de 8', 'mista', ['instrumento', 'percussao', 'marca', 'estilo', 'tecnica', 'cantor', 'musica', 'brasileiro'], 70, 3, 150, 190, 220, ['A', 'B', 'C', 'D', 'G', 'J', 'P', 'R', 'S', 'T'], 'instrumento, percussão, marca, estilo, técnicas, cantor, música e brasileiro'),
    mk(9, 'Cultura e teoria', 'cultura + teoria', ['cantor', 'banda', 'musica', 'album', 'brasileiro', 'estilo', 'profissao', 'tecnica'], 65, 3, 160, 190, 220, ['A', 'B', 'C', 'E', 'G', 'L', 'M', 'P', 'R', 'S', 'T', 'V'], 'cantor, banda, música, álbum, brasileiro, estilo, profissão e técnicas'),
    mk(10, 'Show final', 'final', ['instrumento', 'percussao', 'equipamento', 'marca', 'profissao', 'banda', 'album', 'brasileiro'], 60, 4, 220, 250, 290, ['A', 'B', 'C', 'P', 'R', 'S', 'T'], 'instrumento, percussão, equipamentos, marca, profissão, banda, álbum e brasileiro'),
  ],
  medals: [
    { id: 'stop-cultura', title: 'Rei da cultura', desc: 'conclua as missões só de cultura e de cultura + estilo (1 e 5)', icon: '🎤', test: (g) => ['stop-01', 'stop-05'].every((id) => ((g.m[id] || {}).s || 0) >= 1) },
    { id: 'stop-teoria', title: 'Mestre da teoria', desc: 'conclua as missões sem cultura (2, 4 e 7)', icon: '🎼', test: (g) => ['stop-02', 'stop-04', 'stop-07'].every((id) => ((g.m[id] || {}).s || 0) >= 1) },
    { id: 'stop-2', title: 'Mão afiada', desc: 'consiga 2 estrelas ou mais em 5 missões', icon: '⚡', test: (g) => Object.values(g.m).filter((x) => x.s >= 2).length >= 5 },
  ],
};

export function mount(body, opts) { return mountGame(body, opts); }
export default { spec, mount };

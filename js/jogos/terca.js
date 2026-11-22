// 3ª ou 5ª? O Paul toca a tônica e depois outra nota; a pessoa diz se é a 3ª ou a 5ª da escala.
import { montaQuiz, toca, chips } from './ouvido-quiz.js';
import { rodadaGrau } from './ouvido-logic.js';
import { nomeNota } from './vivo-logic.js';

export function mount(host) {
  return montaQuiz(host, {
    id: 'terca', intro: 'o Paul toca a nota base e depois outra: é a 3ª ou a 5ª?', padrao: { modo: 'maior' },
    ops: (c, muda) => [chips('escala', [['maior', 'maior (3ª alegre)'], ['menor', 'menor (3ª triste)']], c.modo, (v) => muda({ modo: v }))],
    chave: (c) => c.modo, gera: (c) => rodadaGrau({ modo: c.modo }),
    pergunta: (c, r) => `a nota base é ${nomeNota(r.raiz)}. a segunda nota é a…`,
    ouvir: (r) => toca([r.raiz, r.alvo], { passo: 0.9, dur: 0.85 }),
    opcoes: () => [[3, '3ª'], [5, '5ª']], certa: (r) => r.grau,
    explica: (r) => `era a ${r.grau}ª: ${nomeNota(r.raiz)} → ${nomeNota(r.alvo)}. ${r.grau === 3 ? 'a 3ª é a nota que dá a cor (alegre ou triste)' : 'a 5ª soa firme, parece o "chão" do acorde'}.`,
  });
}

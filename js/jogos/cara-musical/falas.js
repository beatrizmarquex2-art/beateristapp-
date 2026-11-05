// Falas do Paul no Cara a Cara Musical. Sorteadas sem repetir até passar todas da mesma situação. {n} = nome da carta, {k} = cartas que sobraram, {q} = pergunta.
export const FALAS = {
  abertura: ['escolhi uma carta em segredo… bora descobrir? 🤘', 'faça uma pergunta e eu respondo! depois a gente vira as cartas que não combinam.', 'psiu! já escolhi. quem será?', 'toca numa pergunta pra começar!'],
  sim: ['SIM! Vamos virar as que não são.', 'SIM! Boa pergunta!', 'Isso aí, é SIM!', 'SIM! Tá esquentando.', 'SIM! Essa pista ajuda muito.'],
  nao: ['NÃO! Essas não combinam.', 'NÃO! Isso ajuda a descartar.', 'NÃO, mas boa tentativa!', 'NÃO! Já sobrou menos carta.', 'NÃO! Pode virar as que combinam com isso.'],
  poucas: ['só sobraram {k} cartas… já dá pra palpitar?', 'tá fechando o cerco: {k} cartas!', 'restam {k}. quase lá!'],
  uma: ['sobrou só uma carta! hora de adivinhar. 🎯', 'só uma carta no jogo… vai adivinhar?'],
  semPergunta: ['acabaram as perguntas boas… é hora de palpitar!', 'sem mais pergunta pra separar essas cartas. palpita!'],
  dica: ['quase! essa não é. olha a dica do Paul:', 'ops, não era. tenta de novo com esta dica:'],
  errou: ['não era {n}. ele(a) sai do jogo.', 'quase! {n} não é.', 'não era {n}. segura a calma!'],
  ultima: ['última chance! pensa com carinho…', 'um palpite só! respira e escolhe.'],
  acerto: ['ACERTOU! era {n}! 🎉', 'isso aí! era {n}. você é craque!', 'mandou bem! era {n}. 🤘', 'boa! {n}! você entende de música!'],
  revela: ['não foi dessa vez! era {n}. bora de novo?', 'era {n}! na próxima você pega!'],
  paulPergunta: ['minha vez! {q}', 'agora eu pergunto: {q}', 'deixa eu tentar: {q}'],
  paulPalpita: ['acho que já sei… é {n}?', 'hmm… vou arriscar: {n}!'],
  paulAcertou: ['ACERTEI! era {n} 😎', 'achei! {n}!'],
  paulErrou: ['ih… errei! era {n}.', 'não era {n}… eu me enrolei!'],
  rodadaGanha: ['você ganhou a rodada! 🏆', 'essa foi sua! mandou bem!'],
  rodadaPerde: ['essa rodada foi minha! revanche?', 'ganhei essa! mas ainda dá pra virar.'],
  rodadaEmpate: ['empatou! que rodada!', 'empate! vamos desempatar?'],
  serieGanha: ['campeão(ã)! você levou a melhor de 3! 🏆', 'você venceu o duelo! 🤘'],
  seriePerde: ['eu levei a melhor de 3… na próxima você pega!', 'dessa vez foi minha! revanche?'],
  novaRodada: ['nova rodada! embaralhei tudo.', 'outras cartas, outros segredos. 😎'],
  passe: ['passe o aparelho pra {n}', 'agora é a vez de {n}'],
};
export function falador(rnd = Math.random) {
  const used = {};
  return (tipo, vars = {}) => {
    const list = FALAS[tipo]; if (!list) return '';
    let pool = list.map((_, i) => i).filter((i) => !(used[tipo] || []).includes(i)); if (!pool.length) { used[tipo] = []; pool = list.map((_, i) => i); }
    const i = pool[Math.floor(rnd() * pool.length)]; (used[tipo] = used[tipo] || []).push(i);
    return list[i].replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ''));
  };
}

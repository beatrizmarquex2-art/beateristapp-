// Perguntas do Cara a Cara Musical. Cada pergunta olha UM atributo (da entidade ou da foto) e só vale quando o atributo está verificado (true/false) em TODOS os alvos da mesa.
// kids: texto curtinho com ícone (modo Kids); classico: texto normal. `por_que` aparece depois da resposta (fala do Paul).
export const PERGUNTAS = [
  { id: 'banda', de: 'entidade', attr: 'banda', kids: 'É uma banda?', classico: 'é uma banda?', icone: '🎸', kidsOk: true, porque: 'banda é um grupo de músicos que toca junto.' },
  { id: 'solo', de: 'entidade', attr: 'solo', kids: 'É uma pessoa só?', classico: 'é uma pessoa só (artista solo)?', icone: '🧍', kidsOk: true, porque: 'artista solo é uma pessoa sozinha.' },
  { id: 'dupla', de: 'entidade', attr: 'dupla', kids: 'São duas pessoas?', classico: 'é uma dupla ou colaboração?', icone: '👥', kidsOk: false, porque: 'dupla ou colaboração é quando duas pessoas aparecem juntas.' },
  { id: 'brasileiro', de: 'entidade', attr: 'brasileiro', kids: 'É do Brasil?', classico: 'é do Brasil?', icone: '🇧🇷', kidsOk: true, porque: 'conta de onde o artista ou a banda é.' },
  { id: 'eua', de: 'entidade', attr: 'eua', kids: 'É dos Estados Unidos?', classico: 'é dos Estados Unidos?', icone: '🗽', kidsOk: false, porque: 'conta de onde o artista ou a banda é.' },
  { id: 'uk', de: 'entidade', attr: 'uk', kids: 'É do Reino Unido?', classico: 'é do Reino Unido (Inglaterra, Escócia…)?', icone: '☂️', kidsOk: false, porque: 'conta de onde o artista ou a banda é.' },
  { id: 'rock', de: 'entidade', attr: 'rock', kids: 'Faz rock?', classico: 'é conhecido pelo rock?', icone: '🤘', kidsOk: true, porque: 'rock é o estilo com guitarra, baixo e bateria.' },
  { id: 'pop', de: 'entidade', attr: 'pop', kids: 'Faz pop?', classico: 'faz pop?', icone: '🎤', kidsOk: false, porque: 'pop é música feita pra tocar em todo lugar.' },
  { id: 'pesado', de: 'entidade', attr: 'pesado', kids: 'É rock pesado?', classico: 'é rock pesado (metal ou hard rock)?', icone: '⚡', kidsOk: false, porque: 'rock pesado tem guitarras bem distorcidas e som forte.' },
  { id: 'punk', de: 'entidade', attr: 'punk', kids: 'É punk?', classico: 'é punk, pop punk ou emo?', icone: '📌', kidsOk: false, porque: 'punk é rápido e direto; emo é mais emotivo.' },
  { id: 'mpb', de: 'entidade', attr: 'mpb', kids: 'É música brasileira (MPB)?', classico: 'é MPB (música popular brasileira)?', icone: '🪘', kidsOk: false, porque: 'MPB mistura samba, bossa e canção brasileira.' },
  { id: 'baterista', de: 'entidade', attr: 'baterista', kids: 'Toca bateria?', classico: 'é baterista?', icone: '🥁', kidsOk: true, porque: 'baterista toca com baquetas, tambores e pratos.' },
  { id: 'guitarrista', de: 'entidade', attr: 'guitarrista', kids: 'Toca guitarra?', classico: 'é guitarrista?', icone: '🎸', kidsOk: true, porque: 'guitarrista toca guitarra: riffs e solos.' },
  { id: 'antes1980', de: 'entidade', attr: 'antes1980', kids: 'É bem antigo?', classico: 'a carreira começou antes de 1980?', icone: '📻', kidsOk: false, porque: 'conta o ano em que o artista ou a banda começou.' },
  { id: 'depois2000', de: 'entidade', attr: 'depois2000', kids: 'É bem novo?', classico: 'a carreira começou depois de 2000?', icone: '📱', kidsOk: false, porque: 'conta o ano em que o artista ou a banda começou.' },
  { id: 'beatles', de: 'entidade', attr: 'beatles', kids: 'É dos Beatles?', classico: 'é dos Beatles?', icone: '🪲', kidsOk: true, porque: 'os Beatles são a banda de Liverpool; entram a banda e os integrantes.' },
  { id: 'pb', de: 'foto', attr: 'preto_e_branco', kids: 'A foto é preto e branco?', classico: 'a foto é preto e branco?', icone: '⬛', kidsOk: true, porque: 'olha só a foto: sem cores, só tons de cinza.' },
];
export const BY_Q = Object.fromEntries(PERGUNTAS.map((p) => [p.id, p]));
export const textoDe = (q, modo) => (modo === 'kids' ? q.kids : q.classico);

// pauLta: aulinhas do Paul (liberadas quando o mundo é concluído). Cada passo: o que o Paul fala + desenhos.
import { drumStaff, clefStaff, keyboard } from './draw.js';
import { mk } from './music.js';

const row = (...svgs) => svgs;
export const LESSONS = {
  drum: { title: 'Aulinha: a pauta da bateria', steps: [
    { say: 'Na pauta da bateria cada peça mora num lugar fixo. Os pratos usam X e ficam lá em cima.', draw: row(['hh', 'chimbal'], ['rd', 'prato de condução'], ['cr', 'prato de ataque']).map(([id, t]) => ({ svg: drumStaff(id), cap: t })) },
    { say: 'Os tambores usam bolinha cheia. Quanto mais embaixo na pauta, mais grave a peça.', draw: [['tt', 'tom 1'], ['mt', 'tom 2'], ['ft', 'surdo'], ['sn', 'caixa'], ['bd', 'bumbo']].map(([id, t]) => ({ svg: drumStaff(id), cap: t })) },
    { say: 'Duas notas alinhadas na vertical são tocadas AO MESMO TEMPO. Mãos com a haste pra cima, pés com a haste pra baixo.', draw: [{ svg: drumStaff(['hh', 'bd']), cap: 'chimbal + bumbo' }, { svg: drumStaff(['rd', 'sn']), cap: 'prato de condução + caixa' }] },
    { say: 'Pequenos sinais mudam o jeito de tocar: círculo = chimbal aberto; X embaixo = chimbal com o pé.', draw: [{ svg: drumStaff('hh'), cap: 'fechado' }, { svg: drumStaff('ho'), cap: 'aberto' }, { svg: drumStaff('hf'), cap: 'com o pé' }] },
    { say: 'Na caixa: parênteses = nota fantasma (baixinha); > = acento (forte); X no lugar da caixa = aro (cross-stick). Rimshot é outra técnica, que bate pele e aro juntos.', draw: [{ svg: drumStaff('sn'), cap: 'normal' }, { svg: drumStaff('sg'), cap: 'fantasma' }, { svg: drumStaff('sa'), cap: 'acento' }, { svg: drumStaff('sr'), cap: 'aro' }] },
    { say: 'Dentro de um tempo cabem 1 semínima, 2 colcheias (1 traço) ou 4 semicolcheias (2 traços).', draw: [{ svg: drumStaff('hh', 'seminima'), cap: '1 nota' }, { svg: drumStaff('hh', 'colcheia'), cap: '2 notas' }, { svg: drumStaff('hh', 'semicolcheia'), cap: '4 notas' }] },
  ] },
  sol: { title: 'Aulinha: a clave de sol', steps: [
    { say: 'A clave de sol enrola na 2ª linha: é ali que mora o sol. As linhas, de baixo pra cima: mi, sol, si, ré, fá.', draw: [{ svg: clefStaff('sol', [mk('E', 4), mk('G', 4), mk('B', 4)]), cap: 'mi · sol · si' }, { svg: clefStaff('sol', [mk('D', 5), mk('F', 5)]), cap: 'ré · fá' }] },
    { say: 'Os espaços, de baixo pra cima, formam uma palavra: fá, lá, dó, mi.', draw: [{ svg: clefStaff('sol', [mk('F', 4), mk('A', 4), mk('C', 5)]), cap: 'fá · lá · dó' }, { svg: clefStaff('sol', [mk('E', 5)]), cap: 'mi' }] },
    { say: 'O dó central (dó4) mora na 1ª linha suplementar, embaixo da pauta. Ele é a ponte entre as duas claves.', draw: [{ svg: clefStaff('sol', mk('C', 4)), cap: 'dó central' }, { svg: keyboard('sol', mk('C', 4)), cap: 'no teclado' }] },
    { say: 'Mesma letra, outra oitava: o dó4, o dó5 e o dó6 têm o mesmo nome, mas alturas diferentes.', draw: [{ svg: keyboard('sol', [mk('C', 4), mk('C', 5), mk('C', 6)]), cap: 'três dós' }] },
  ] },
  fa: { title: 'Aulinha: a clave de fá', steps: [
    { say: 'A clave de fá tem dois pontinhos em volta da 4ª linha: é onde mora o fá. As linhas, de baixo pra cima: sol, si, ré, fá, lá.', draw: [{ svg: clefStaff('fa', [mk('G', 2), mk('B', 2), mk('D', 3)]), cap: 'sol · si · ré' }, { svg: clefStaff('fa', [mk('F', 3), mk('A', 3)]), cap: 'fá · lá' }] },
    { say: 'Os espaços, de baixo pra cima: lá, dó, mi, sol. São notas graves!', draw: [{ svg: clefStaff('fa', [mk('A', 2), mk('C', 3), mk('E', 3)]), cap: 'lá · dó · mi' }, { svg: clefStaff('fa', [mk('G', 3)]), cap: 'sol' }] },
    { say: 'O dó central (dó4) também aparece aqui: fica na 1ª linha suplementar ACIMA da pauta.', draw: [{ svg: clefStaff('fa', mk('C', 4)), cap: 'dó central' }, { svg: keyboard('fa', mk('C', 4)), cap: 'no teclado' }] },
    { say: 'Cuidado! A mesma posição na pauta tem outro nome na clave de fá: a 1ª linha é sol2 aqui e mi4 na clave de sol.', draw: [{ svg: clefStaff('fa', mk('G', 2)), cap: 'sol2 (fá)' }, { svg: clefStaff('sol', mk('E', 4)), cap: 'mi4 (sol)' }] },
  ] },
  duel: { title: 'Aulinha: o duelo das claves', steps: [
    { say: 'Antes de ler a nota, olhe a clave! A mesma posição na pauta muda de nome.', draw: [{ svg: clefStaff('sol', mk('G', 4)), cap: 'sol4 na clave de sol' }, { svg: clefStaff('fa', mk('B', 2)), cap: 'si2 na clave de fá' }] },
    { say: 'Pra não se perder: 1) clave, 2) linha ou espaço, 3) oitava. Nessa ordem.', draw: [{ svg: keyboard('sol', [mk('G', 4), mk('G', 5)]), cap: 'sol4 e sol5' }] },
  ] },
};

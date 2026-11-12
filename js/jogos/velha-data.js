// Banco aprovado do jogo da velha musical: 59 perguntas (IDs não são consecutivos de propósito). Dados separados da tela.
// Enunciado e resposta são exatamente os aprovados. As alternativas erradas foram escolhidas antes (nada é gerado na partida).
// options[0] é sempre a resposta certa; a tela embaralha a posição. Infantil/fácil: 3 opções. Intermediário: 4 opções.
// show (opcional): imagem ou figura mostrada DEPOIS da resposta (nunca antes, pra não entregar o gabarito).
export const LEVELS = [['infantil', 'infantil'], ['facil', 'fácil'], ['intermediario', 'intermediário']];

const INS = (n) => ({ src: `assets/jogos/instrumentos/${n}.webp` });
const FIG = (f) => ({ fig: f });

// [id, nível, categoria, pergunta, resposta, erradas, explicação, show]
const RAW = [
  [1, 'infantil', 'bateria', 'qual instrumento tem tambores, pratos e é tocado com baquetas?', 'bateria', ['violão', 'flauta'], 'a bateria junta tambores e pratos, e a gente toca com baquetas.', INS('bateria')],
  [2, 'infantil', 'bateria', 'o que seguramos nas mãos para tocar bateria?', 'baquetas', ['palhetas', 'arcos'], 'as baquetas são os bastões que batem nos tambores e nos pratos.'],
  [3, 'infantil', 'bateria', 'quantas baquetas usamos normalmente para tocar bateria?', 'duas', ['uma', 'quatro'], 'uma em cada mão: duas baquetas.'],
  [4, 'infantil', 'bateria', 'qual parte do corpo usamos para acionar o pedal do bumbo?', 'pé', ['cotovelo', 'joelho'], 'o pé aperta o pedal e o bumbo bate.'],
  [5, 'infantil', 'teclas', 'qual instrumento musical tem teclas brancas e pretas?', 'piano ou teclado', ['violino', 'flauta'], 'piano e teclado têm teclas brancas e pretas.', INS('teclado')],
  [6, 'infantil', 'teoria', 'como chamamos o momento em que paramos de tocar por um instante na música?', 'pausa', ['refrão', 'volume'], 'a pausa é o silêncio que também faz parte da música.'],
  [7, 'infantil', 'teoria', 'quando tocamos bem baixinho, o som fica forte ou fraco?', 'fraco', ['forte', 'agudo'], 'tocar baixinho deixa o som fraco.'],
  [8, 'facil', 'bateria', 'qual peça da bateria normalmente é responsável pelas batidas graves?', 'bumbo', ['caixa', 'chimbal'], 'o bumbo faz o som grave da bateria.'],
  [9, 'facil', 'teoria', 'qual aparelho usamos para estudar mantendo a velocidade constante?', 'metrônomo', ['afinador', 'amplificador'], 'o metrônomo marca o tempo sempre igual.'],
  [10, 'facil', 'teoria', 'o que significa BPM na música?', 'batidas por minuto', ['baixos por minuto', 'barras por música'], 'BPM é a velocidade: quantas batidas cabem em um minuto.'],
  [11, 'facil', 'teoria', 'qual figura rítmica vale um tempo quando a semínima é a unidade de tempo?', 'semínima', ['mínima', 'semibreve'], 'a semínima é a unidade: vale 1 tempo.', FIG('seminima')],
  [12, 'facil', 'teoria', 'qual figura musical vale dois tempos de semínima?', 'mínima', ['semínima', 'colcheia'], 'a mínima dura o dobro da semínima: 2 tempos.', FIG('minima')],
  [13, 'facil', 'teoria', 'qual figura musical vale meio tempo de semínima?', 'colcheia', ['mínima', 'semibreve'], 'duas colcheias cabem em uma semínima: cada uma vale meio tempo.'],
  [14, 'facil', 'teoria', 'qual símbolo na partitura representa um momento de silêncio?', 'pausa', ['clave', 'compasso'], 'a pausa marca na partitura quanto tempo ficamos em silêncio.'],
  [15, 'facil', 'teoria', 'qual símbolo indica que uma nota deve ser tocada com destaque ou mais intensidade?', 'acento (>)', ['pausa', 'ligadura'], 'o acento (>) pede a nota mais forte.'],
  [16, 'facil', 'bateria', 'como chamamos uma batida muito suave na caixa, usada para dar textura ao groove?', 'nota fantasma (ghost note)', ['acento', 'rulo'], 'a nota fantasma é bem baixinha e dá textura ao groove.'],
  [17, 'facil', 'bateria', 'qual rudimento alterna as mãos D E D E continuamente?', 'toque simples (single stroke roll)', ['toque duplo', 'paradiddle'], 'no toque simples as mãos se alternam: D E D E.'],
  [18, 'facil', 'bateria', 'qual rudimento utiliza a sequência D D E E continuamente?', 'toque duplo (double stroke roll)', ['toque simples', 'paradiddle'], 'no toque duplo cada mão bate duas vezes: D D E E.'],
  [19, 'intermediario', 'bateria', 'qual rudimento utiliza a sequência D E D D E D E E?', 'paradiddle simples', ['toque simples', 'toque duplo', 'flam'], 'o paradiddle simples é D E D D, E D E E.'],
  [20, 'intermediario', 'teoria', 'quantas semicolcheias cabem em um tempo de semínima?', 'quatro', ['duas', 'três', 'oito'], 'uma semínima tem quatro semicolcheias.'],
  [21, 'facil', 'cordas', 'qual instrumento de cordas elétrico é muito usado para fazer solos no rock?', 'guitarra elétrica', ['violino', 'ukulele'], 'a guitarra elétrica é a estrela dos solos de rock.', INS('guitarra')],
  [22, 'facil', 'cordas', 'qual instrumento de cordas graves costuma ter quatro cordas em sua versão mais comum nas bandas?', 'baixo elétrico', ['guitarra elétrica', 'flauta'], 'o baixo elétrico tem quatro cordas e faz as notas graves.', INS('baixo')],
  [23, 'facil', 'cordas', 'qual pequeno instrumento de quatro cordas é associado à música havaiana?', 'ukulele', ['cavaquinho', 'violino'], 'o ukulele é pequeno, tem quatro cordas e lembra o Havaí.'],
  [27, 'facil', 'cordas', 'qual instrumento de arco produz os sons mais agudos da família tradicional das cordas orquestrais?', 'violino', ['violoncelo', 'contrabaixo'], 'o violino é o mais agudo das cordas de arco.', INS('violino')],
  [29, 'facil', 'percussão', 'qual instrumento de percussão possui uma pele e pequenas platinelas metálicas?', 'pandeiro', ['cajón', 'tamborim'], 'o pandeiro tem pele e platinelas que tilintam.', INS('pandeiro')],
  [30, 'facil', 'percussão', 'qual instrumento de percussão tem formato de caixa e é tocado enquanto o músico se senta sobre ele?', 'cajón', ['pandeiro', 'triângulo'], 'no cajón a gente senta em cima e bate na frente.'],
  [32, 'facil', 'percussão', 'qual pequeno tambor redondo, com uma pele, costuma ser tocado com baqueta nas escolas de samba?', 'tamborim', ['surdo', 'pandeiro'], 'o tamborim é pequeno, agudo e tocado com baqueta no samba.'],
  [37, 'facil', 'sopros', 'qual instrumento de sopro é comum nas aulas de iniciação musical e tem furos cobertos pelos dedos?', 'flauta doce', ['trompete', 'saxofone'], 'a flauta doce é a queridinha das primeiras aulas de música.'],
  [40, 'facil', 'acessórios', 'qual pequeno acessório é utilizado para tocar as cordas de guitarra e violão?', 'palheta', ['arco', 'baqueta'], 'a palheta é a pecinha que ajuda a tocar as cordas.'],
  [43, 'facil', 'equipamentos', 'qual equipamento reúne vários efeitos sonoros para guitarra e costuma ser controlado com os pés?', 'pedaleira', ['amplificador', 'metrônomo'], 'a pedaleira junta vários efeitos e a gente liga com os pés.'],
  [52, 'intermediario', 'sopros', 'qual instrumento costuma ocupar o registro mais grave da família dos metais na orquestra?', 'tuba', ['trompete', 'trombone', 'trompa'], 'a tuba é o metal mais grave.'],
  [54, 'intermediario', 'cordas', 'entre violino e viola de arco, qual geralmente possui afinação mais grave?', 'viola de arco', ['violino', 'flauta', 'trompete'], 'a viola de arco é um pouco maior e mais grave que o violino.'],
  [56, 'intermediario', 'cordas', 'qual é a afinação padrão das seis cordas soltas do violão, da mais grave para a mais aguda?', 'mi, lá, ré, sol, si, mi', ['mi, si, sol, ré, lá, mi', 'dó, ré, mi, fá, sol, lá', 'lá, ré, sol, dó, mi, lá'], 'do grave ao agudo: mi, lá, ré, sol, si, mi.'],
  [57, 'intermediario', 'cordas', 'qual é a afinação padrão das quatro cordas soltas do baixo elétrico, da mais grave para a mais aguda?', 'mi, lá, ré, sol', ['sol, ré, lá, mi', 'dó, sol, ré, lá', 'lá, ré, sol, si'], 'do grave ao agudo: mi, lá, ré, sol.'],
  [58, 'intermediario', 'cordas', 'qual técnica de baixo elétrico utiliza ataques percussivos com o polegar?', 'slap', ['pizzicato', 'hammer-on', 'palm mute'], 'no slap o polegar bate na corda com som percussivo.'],
  [65, 'intermediario', 'teoria', 'qual acidente musical eleva uma nota em um semitom?', 'sustenido', ['bemol', 'bequadro', 'fermata'], 'o sustenido sobe a nota meio tom (um semitom).'],
  [66, 'intermediario', 'teoria', 'qual acidente musical abaixa uma nota em um semitom?', 'bemol', ['sustenido', 'bequadro', 'staccato'], 'o bemol desce a nota meio tom (um semitom).'],
  [71, 'facil', 'bateria', 'qual prato é formado por dois pratos que abrem e fecham por meio de um pedal?', 'chimbal', ['ride', 'crash'], 'o chimbal são dois pratos que abrem e fecham com o pedal.'],
  [73, 'facil', 'bateria', 'qual prato é conhecido como prato de condução?', 'ride', ['chimbal', 'splash'], 'o ride conduz o ritmo, por isso é o prato de condução.'],
  [74, 'facil', 'bateria', 'qual tambor da bateria possui uma esteira metálica na parte inferior?', 'caixa', ['bumbo', 'tom'], 'a caixa tem a esteira embaixo e soa estalada.'],
  [75, 'facil', 'bateria', 'como chamamos os tambores menores geralmente posicionados acima do bumbo?', 'tons', ['surdos', 'congas'], 'os tons ficam acima do bumbo.'],
  [77, 'facil', 'bateria', 'qual acessório usamos para apertar os parafusos de afinação da bateria?', 'chave de afinação', ['banco de bateria', 'baqueta'], 'a chave de afinação aperta os parafusos pra afinar os tambores.'],
  [78, 'facil', 'bateria', 'qual equipamento permite tocar o bumbo utilizando o pé?', 'pedal de bumbo', ['suporte de prato', 'banco de bateria'], 'o pedal de bumbo leva o movimento do pé até o bumbo.'],
  [79, 'facil', 'bateria', 'qual equipamento permite abrir e fechar os pratos do chimbal?', 'máquina de chimbal', ['pedal de bumbo', 'chave de afinação'], 'a máquina de chimbal abre e fecha os pratos com o pé.'],
  [82, 'intermediario', 'bateria', 'qual mecanismo permite ligar e desligar a esteira da caixa?', 'automático da caixa', ['chave de afinação', 'máquina de chimbal', 'pedal de bumbo'], 'o automático liga e desliga a esteira da caixa.'],
  [86, 'intermediario', 'bateria', 'qual componente circular mantém a pele presa ao tambor?', 'aro', ['esteira', 'casco', 'pedal'], 'o aro prende a pele no tambor.'],
  [99, 'facil', 'marcas', 'qual produto da Pad Gorilla utilizamos para treinar com as baquetas sem precisar de uma bateria completa?', 'pad de estudo', ['pad de bumbo', 'metrônomo digital'], 'o pad de estudo deixa treinar com baquetas em qualquer lugar.'],
  [101, 'facil', 'marcas', 'qual modelo de cajon da Spark pode ser tocado apoiado nas pernas do músico?', 'cajon de colo', ['cajon de assento', 'pad de colo'], 'o cajon de colo toca apoiado nas pernas.'],
  [102, 'facil', 'marcas', 'além das baterias acústicas, qual outro tipo de bateria a Nagano fabrica?', 'bateria eletrônica', ['guitarra elétrica', 'teclado digital'], 'a Nagano também faz bateria eletrônica.'],
  [104, 'facil', 'marcas', 'qual produto da Pad Gorilla permite praticar golpes de pedal de bumbo?', 'pad de bumbo', ['pad de estudo', 'cajon de colo'], 'o pad de bumbo serve pra treinar o pedal.'],
  [108, 'intermediario', 'marcas', 'qual tipo de saída para cabo de áudio está presente no Cajon de Colo Elétrico da Spark?', 'saída P10', ['saída USB', 'saída HDMI', 'saída óptica'], 'a saída P10 liga o cajon elétrico num amplificador ou mesa.'],
  [130, 'facil', 'bandas', 'qual banda lançou Believer e Enemy?', 'Imagine Dragons', ['OneRepublic', 'Coldplay'], 'Believer e Enemy são do Imagine Dragons.'],
  [131, 'facil', 'rock', "qual é o guitarrista da banda Guns N' Roses?", 'Slash', ['Axl Rose', 'Angus Young'], "Slash é o guitarrista do Guns N' Roses."],
  [132, 'facil', 'rock', 'quem canta as músicas TNT e Back in Black?', 'AC/DC', ['Metallica', 'Black Sabbath'], 'TNT e Back in Black são do AC/DC.'],
  [133, 'intermediario', 'pop', 'Uptown Funk toca no filme do?', 'Sonic e Alvin e os esquilos', ['Shrek', 'Toy Story', 'Madagascar'], 'Uptown Funk toca no filme do Sonic e Alvin e os esquilos.'],
  [134, 'facil', 'rock', 'Kurt Cobain era vocalista da banda?', 'Nirvana', ['Pearl Jam', 'Foo Fighters'], 'Kurt Cobain era vocalista do Nirvana.'],
  [135, 'intermediario', 'pop', 'qual música toca no filme do Homem-Aranha no Aranhaverso?', 'Sunflower (Post Malone)', ['Blinding Lights (The Weeknd)', 'bad guy (Billie Eilish)', 'Believer (Imagine Dragons)'], 'Sunflower, do Post Malone, toca no Aranhaverso.'],
  [136, 'facil', 'pop', 'quem é considerado o Rei do Pop?', 'Michael Jackson', ['Bruno Mars', 'Justin Bieber'], 'Michael Jackson é o Rei do Pop.'],
  [137, 'facil', 'pop', 'quem canta a famosa música da Copa Waka Waka?', 'Shakira', ['Beyoncé', 'Jennifer Lopez'], 'Waka Waka é da Shakira.'],
];

export const QUESTIONS = RAW.map(([id, level, cat, text, ans, wrong, explain, show]) => ({
  id: `q${id}`, num: id, level, cat, text, options: [ans, ...wrong], answer: 0, explain, show: show || null,
}));

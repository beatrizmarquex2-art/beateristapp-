// Dados que completam o elenco: atributos novos de ENTIDADE (cantor, ativo, grande, anos80_90) e da FOTO (varias, instrumento).
// Mesma regra do elenco: true / false / null. null = não verificado, a pergunta some da mesa. Nada vem de reconhecer pessoas pela imagem:
// os atributos da foto só dizem o que se VÊ (quantas pessoas, se há instrumento). Marcados olhando as 125 fotos, uma a uma.
import { ENTIDADES, FOTOS } from './elenco.js';

const lista = (s) => s.split(/\s+/).filter(Boolean);
/** cantor/cantora: quem é conhecido principalmente pela voz (uma pessoa ou dupla de cantores). Bandas, instrumentistas = false. Misto = null. */
const CANTOR_SIM = lista(`chorao renato-russo cassia-eller caetano-veloso lulu-santos pitty rita-lee seu-jorge djavan adam-levine hayley-williams billie-eilish raul-seixas michael-jackson avril-lavigne
  john-lennon-the-beatles thom-yorke-radiohead justin-bieber bad-bunny alex-turner amy-winehouse britney-spears elvis-presley cazuza ed-sheeran shawn-mendes axl-rose post-malone sabrina-carpenter
  justin-bieber-e-billie-eilish john-lennon-e-paul-mccartney-the-beatles paul-mccartney-e-michael-jackson`);
const CANTOR_NAO = lista(`angus-young tim-henson flea slash john-bonham eloy-casagrande`);
/** ainda está em atividade: false = artista que já morreu ou banda que acabou. Em dúvida = null. */
const ATIVO_NAO = lista(`nirvana the-beatles john-bonham legiao-urbana mamonas-assassinas chorao renato-russo cassia-eller raul-seixas michael-jackson led-zeppelin amy-winehouse elvis-presley cazuza
  jimi-hendrix black-sabbath john-lennon-the-beatles george-harrison-the-beatles rita-lee`);
const ATIVO_NULO = lista(`charlie-brown-jr skank kiss nx-zero restart britney-spears john-lennon-e-paul-mccartney-the-beatles paul-mccartney-e-michael-jackson`);
/** mais de 3 integrantes (só bandas). Solo e dupla = false. Em dúvida (formação mudou) = null. */
const GRANDE_SIM = lista(`the-beatles mamonas-assassinas jota-quest nx-zero imagine-dragons linkin-park metallica led-zeppelin queen kiss guns-n-roses the-rolling-stones red-hot-chili-peppers oasis black-sabbath
  slipknot system-of-a-down arctic-monkeys coldplay the-strokes the-neighbourhood the-1975 polyphia bring-me-the-horizon radiohead ac-dc bon-jovi charlie-brown-jr limp-bizkit my-chemical-romance`);
const GRANDE_NAO_BANDA = lista(`nirvana green-day paramore blink-182 muse twenty-one-pilots`);
const GRANDE_NULO = lista(`legiao-urbana restart terno-rei skank gorillaz`);

const tri = (v) => (v === true ? true : v === false ? false : null);
for (const e of ENTIDADES) {
  const a = e.attrs; const id = e.id;
  a.cantor = CANTOR_SIM.includes(id) ? true : (CANTOR_NAO.includes(id) || a.banda === true) ? false : null;
  a.ativo = ATIVO_NAO.includes(id) ? false : ATIVO_NULO.includes(id) ? null : true;
  a.grande = GRANDE_SIM.includes(id) ? true : GRANDE_NULO.includes(id) ? null : (GRANDE_NAO_BANDA.includes(id) || a.banda !== true) ? false : null;
  const ant = tri(a.antes1980); const dep = tri(a.depois2000);
  a.anos80_90 = ant === null || dep === null ? null : (!ant && !dep); // derivado: nem antes de 1980 nem depois de 2000
}

/** Foto: [mais de uma pessoa, instrumento aparecendo] em T/F/N (N = não dá pra afirmar pela imagem). */
const VISUAL = `F001 FT|F004 FT|F005 FF|F010 FF|F011 FF|F012 FT|F013 TF|F014 TF|F015 FF|F016 TF|F017 FT|F018 FT|F020 TF|F021 TF|F022 TF|F023 TF|
F024 TF|F025 FF|F026 FF|F027 NT|F028 FT|F029 FT|F030 TF|F031 FF|F032 FT|F033 FF|F034 FT|F035 TF|F036 NT|F037 TF|F038 FF|F039 FT|
F040 TF|F041 TF|F042 FF|F043 FN|F044 FF|F045 TF|F046 TT|F047 TF|F048 TF|F049 TF|F050 TF|F051 TF|F052 FT|F053 TT|F054 TF|F055 TF|
F056 TF|F057 TF|F058 FT|F059 TT|F060 TF|F061 TF|F062 TT|F063 TT|F064 TN|F065 TF|F066 TT|F067 TF|F068 TF|F069 TF|F070 TF|F071 TN|
F072 FT|F073 TF|F074 TF|F075 TF|F076 TF|F077 TF|F078 TT|F079 TF|F080 TF|F081 TF|F082 TF|F083 TF|F084 TF|F085 TF|F086 FT|F087 TF|
F088 TF|F089 FT|F090 FT|F091 FF|F092 TF|F093 FF|F094 FF|F095 FT|F096 FT|F097 FT|F098 FT|F099 FT|F100 FT|F101 TF|F102 FT|F103 TF|
F104 TT|F105 TF|F106 FF|F107 FT|F108 NT|F109 FT|F110 TF|F111 FT|F112 TF|F113 FF|F114 FF|F115 FF|F116 FF|F117 FF|F118 FF|F119 FF|
F120 FF|F121 FT|F122 FF|F123 FF|F124 FT|F125 TF|F126 NN|F127 FF|F128 FF|F129 FT|F130 FT|F131 FT|F132 NT`;
const L = (c) => (c === 'T' ? true : c === 'F' ? false : null);
for (const par of VISUAL.split('|').map((x) => x.trim()).filter(Boolean)) {
  const [cod, v] = par.split(' '); const f = FOTOS[cod]; if (!f) continue;
  f.varias = L(v[0]); f.instrumento = L(v[1]);
}
for (const cod of Object.keys(FOTOS)) { const f = FOTOS[cod]; if (!('varias' in f)) f.varias = null; if (!('instrumento' in f)) f.instrumento = null; }

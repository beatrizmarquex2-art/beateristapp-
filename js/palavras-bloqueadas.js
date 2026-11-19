// Palavras que NÃO podem aparecer nos textos que o aluno escreve (instrumento, estilo e meta do passe, que também vão pra sala e pra nuvem).
// É uma lista inicial: a Bea (ou eu) acrescenta ou tira palavras aqui, uma por linha. Escreva sem acento e em minúsculas.
// Como confere: ignora acento, maiúscula, número no lugar de letra (p0rra), letras repetidas (puuuta) e espaço ou ponto no meio (p u t a).
const BLOQUEADAS = `
puta puto putaria putinha putao porra caralho caraio karalho carai krl cacete merda merdinha bosta bostinha foda fode foder fodase fodido fodida fdp vsf vtnc pqp pnc
cu cuzao cuzona cuzinho buceta bct xoxota xana piroca punheta boquete siririca tomanocu vaitomanocu
viado viadinho bicha sapatao traveco vagabunda vagabundo vadia piranha arrombado arrombada desgraca desgracado
otario otaria idiota imbecil retardado retardada mongol babaca escroto escrota burro burra estupido estupida trouxa corno cornudo cretino cretina demente debil lazarento nojento mulambo
sexo sexy porno pornografia nude nudes tesao transar estupro estuprador pedofilo pedofilia
nazista nazismo hitler racista crioulo
suicidio suicida cocaina maconha heroina
67 sixseven seissete aura farmaaura farmador farmadora farmar farmando farmei sigma skibidi gyatt gyat rizz mewing brainrot ohio
fuck fucking shit bitch dick pussy cunt asshole nigger nigga faggot porn sex
`.split(/\s+/).filter(Boolean);
const SET = new Set(BLOQUEADAS);
const LONGAS = BLOQUEADAS.filter((w) => w.length >= 5); // palavras longas também valem "grudadas" (p u t a r i a), sem pegar palavras normais por engano

const normaliza = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[0]/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/[4@]/g, 'a').replace(/[5$]/g, 's').replace(/7/g, 't').replace(/8/g, 'b');
const semRepetir = (t) => t.replace(/(.)\1+/g, '$1');

/** O texto tem alguma palavra que não pode? */
export function bloqueada(texto) {
  const base = normaliza(texto);
  if (/(?:^|\D)6\s*[-.,_]?\s*7(?!\d)/.test(String(texto || ''))) return true; // "67" (também "6 7", "6-7")
  const brutas = base.split(/[^a-z]+/).filter(Boolean);
  const palavras = []; let letras = ''; // letras soltas seguidas (p u t a) viram uma palavra só
  for (const t of brutas) { if (t.length === 1) letras += t; else { if (letras) { palavras.push(letras); letras = ''; } palavras.push(t); } }
  if (letras) palavras.push(letras);
  for (const p of palavras) { if (SET.has(p) || SET.has(semRepetir(p))) return true; }
  const grudado = semRepetir(base.replace(/[^a-z]+/g, ''));
  return LONGAS.some((w) => grudado.includes(semRepetir(w)));
}

// Endereço do site: UM lugar só.
//   ESCRITO = o endereço que aparece ESCRITO (marca nos cartões das aulas, figurinhas, vídeo do PaulBox, PDFs da partitura).
//   LINKS   = o endereço dos links de verdade e das mensagens que o aluno copia e usa (códigos, WhatsApp, entrar no site).
// Hoje os dois são jogos.beaterista.com.br. O domínio de verdade NÃO muda por aqui: isso só troca o que está escrito/linkado nos textos.
// Pra trocar o ESCRITO pra play.beaterista.com.br (quando a Bea mandar):   node scripts/trocar-endereco.mjs play
// Pra trocar também os LINKS (só depois que play.beaterista.com.br abrir de verdade, com o CNAME e o CSP prontos):   node scripts/trocar-endereco.mjs play --links
// Voltar:   node scripts/trocar-endereco.mjs jogos [--links]
export const ENDERECOS = { jogos: 'jogos.beaterista.com.br', play: 'play.beaterista.com.br' };
export const ESCRITO = 'jogos';
export const LINKS = 'jogos';
/** O endereço escrito, sem https (ex.: jogos.beaterista.com.br). */
export const SITE_TEXTO = ENDERECOS[ESCRITO];
/** O endereço dos links, sem https. */
export const SITE_DOMINIO = ENDERECOS[LINKS];
/** O endereço dos links, com https, sem barra no final. */
export const SITE_URL = `https://${SITE_DOMINIO}`;
// o CSS (css/lote3.css) lê o endereço escrito desta variável: a marca nos cartões muda junto
if (typeof document !== 'undefined' && document.documentElement) document.documentElement.style.setProperty('--site-texto', JSON.stringify(SITE_TEXTO));

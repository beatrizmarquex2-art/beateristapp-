// Passe Beaterista anual (R$ 49,90, 12 meses, 2 aparelhos) vendido por PIX/WhatsApp: gera o código e a mensagem pro comprador.
// Mesmo formato do passe automático da Hotmart (supabase/015_passe_hotmart.sql): código "P" + 9 letras/números, tipo 'passe', vence 12 meses depois de HOJE.
// Não usa a coluna `jogos` (que ainda não existe no banco), então funciona já.
const ALFA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 letras/números sem I, O, 0, 1 (256 % 32 = 0: sem viés)
export function gerarCodigoPasse(rand = (n) => crypto.getRandomValues(new Uint8Array(n))) {
  return `P${[...rand(9)].map((x) => ALFA[x % 32]).join('')}`;
}
/** 12 meses a partir de `de` (29/02 vira 28/02 do ano seguinte, nunca pula pra março). */
export function daquiA12Meses(de = new Date()) {
  const d = new Date(de); const dia = d.getUTCDate(); d.setUTCDate(1); d.setUTCFullYear(d.getUTCFullYear() + 1);
  const ult = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate(); d.setUTCDate(Math.min(dia, ult)); return d;
}
export const linhaPasse = (nome, code, expira) => ({ code, nome: `Passe ${String(nome || '').trim()}`.trim().slice(0, 60), tipo: 'passe', dias: 365, max_aparelhos: 2, expira_em: expira.toISOString(), ativo: true });
const dataBR = (d) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
export function mensagemPasse({ nome, code, expira, site = 'https://jogos.beaterista.com.br' }) {
  const p = String(nome || '').trim().split(/\s+/)[0];
  return `oi${p ? `, ${p}` : ''}! pagamento confirmado 🎉 aqui está o seu Passe Beaterista: ${code}\nvale 12 meses (até ${dataBR(expira)}) e funciona em até 2 aparelhos.\nentre em ${site}, escreva seu nome e digite o código em "código de acesso".`;
}
/** Link "abrir no WhatsApp" com a mensagem pronta (telefone só com dígitos; assume Brasil se vier sem 55). Sem telefone: null. */
export function linkWhatsapp(tel, msg) {
  const d = String(tel || '').replace(/\D/g, ''); if (d.length < 10) return null;
  return `https://wa.me/${d.startsWith('55') && d.length >= 12 ? d : `55${d}`}?text=${encodeURIComponent(msg)}`;
}

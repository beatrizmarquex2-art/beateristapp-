// Interruptor da Lojinha e do Passe. Enquanto LOJA_PUBLICA for false, os alunos veem SÓ o que já existia (lojinha "em construção").
// A Bea revisa abrindo aluno.html?loja=on (fica ligado só nesse navegador; ?loja=off desliga). Para publicar depois da aprovação: LOJA_PUBLICA = true.
export const LOJA_PUBLICA = false;
// Compra do Passe: só liga quando a oferta e o webhook de produção existirem (passo 3 do PENDENCIAS-LOJINHA.md).
export const PASSE_COMPRA_ATIVA = false;
// Simulador de compra (só preview local/teste): nunca aparece com LOJA_PUBLICA = true.
const KEY = 'bt-loja-previa';
const get = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
export function lerPrevia(search = (typeof location !== 'undefined' ? location.search : '')) {
  try {
    const q = new URLSearchParams(search).get('loja');
    if (q === 'on') localStorage.setItem(KEY, '1'); else if (q === 'off') localStorage.removeItem(KEY);
  } catch { /* sem armazenamento */ }
  return get();
}
export const lojaLigada = () => LOJA_PUBLICA || lerPrevia();
export const modoTeste = () => !LOJA_PUBLICA && get();

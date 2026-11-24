// Mudança de endereço: jogos.beaterista.com.br → play.beaterista.com.br (nov/2026).
// O navegador guarda código, nome, id do aparelho e preferências POR ENDEREÇO, então quem entra no `play` pela 1ª vez começaria do zero.
// Enquanto o `jogos` ainda abrir o app, ele empacota o que é do aluno (só chaves `beaterista-*` e `bt-*`), manda pro `play` no #hash (o hash NUNCA vai pro servidor)
// e o `play` grava e limpa o endereço. O id do aparelho viaja junto: o servidor não conta um aparelho novo (limite de 2 aparelhos do passe).
// Progresso e álbum já ficam na nuvem, ligados ao código, e voltam sozinhos.
export const HOST_ANTIGO = 'jogos.beaterista.com.br';
export const URL_NOVO = 'https://play.beaterista.com.br';
export const FLAG_MIGRADO = 'bt-migrado-de-jogos';
const PREFIXO = /^(beaterista-|bt-)/;
const MAX_VALOR = 200000; const MAX_CHAVES = 400; const MAX_TOTAL = 600000; const VALE_MS = 120000;
// o que identifica a pessoa/aparelho: só é trocado se o `play` ainda não tem um código guardado
const IDENTIDADE = new Set(['beaterista-aluno-codigo', 'beaterista-aluno-codigo-ok', 'beaterista-aluno-codigo-pendente', 'beaterista-aluno-escopo', 'beaterista-aparelho-id', 'beaterista-aparelho-prof', 'beaterista-aluno-nome', 'beaterista-aluno-origem']);
const COD = 'beaterista-aluno-codigo'; const PEND = 'beaterista-aluno-codigo-pendente';

const chaves = (st) => { const r = []; for (let i = 0; i < st.length; i++) { const k = st.key(i); if (k != null) r.push(k); } return r; };
/** Tudo que é do aluno neste navegador, com limite de tamanho (o endereço não pode ficar enorme). */
export function empacotar(st) {
  const out = {}; let total = 0;
  for (const k of chaves(st)) {
    if (!PREFIXO.test(k) || k === FLAG_MIGRADO || Object.keys(out).length >= MAX_CHAVES) continue;
    const v = st.getItem(k); if (typeof v !== 'string' || v.length > MAX_VALOR || total + v.length > MAX_TOTAL) continue;
    out[k] = v; total += v.length;
  }
  return out;
}
const bin = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode(...bytes.subarray(i, i + 8192)); return s; };
export const codificar = (obj) => btoa(bin(new TextEncoder().encode(JSON.stringify(obj)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
/** Lê o pacote do endereço. Recusa pacote velho (mais de 2 min), de outro formato ou com chaves que não são do app. */
export function decodificar(txt, agora = Date.now()) {
  try {
    const b = String(txt).replace(/-/g, '+').replace(/_/g, '/'); const raw = atob(b + '='.repeat((4 - (b.length % 4)) % 4));
    const p = JSON.parse(new TextDecoder().decode(Uint8Array.from(raw, (c) => c.charCodeAt(0))));
    if (!p || p.v !== 1 || typeof p.t !== 'number' || agora - p.t > VALE_MS || p.t - agora > 30000 || !p.k || typeof p.k !== 'object') return null;
    const k = {}; for (const [c, v] of Object.entries(p.k).slice(0, MAX_CHAVES)) if (PREFIXO.test(c) && typeof v === 'string' && v.length <= MAX_VALOR) k[c] = v;
    return k;
  } catch { return null; }
}
/** Grava no navegador do `play`. Nunca apaga nada. Se o `play` já tem código, não mexe em identidade (nem troca de pessoa por link); só completa o que falta. */
export function aplicar(k, st) {
  const temCodigo = !!(st.getItem(COD) || st.getItem(PEND)); let n = 0;
  for (const [c, v] of Object.entries(k)) {
    const id = IDENTIDADE.has(c); const existe = st.getItem(c) !== null;
    if (temCodigo ? (id || existe) : (existe && !id)) continue;
    st.setItem(c, v); n++;
  }
  return n;
}
/** Chamar no começo do app. true = está indo embora pro endereço novo (não continue). */
export function migrarSeNecessario({ loc, st, hist, agora = () => Date.now() }) {
  try {
    if (loc.hostname === HOST_ANTIGO) {
      let hash = ''; try { const k = empacotar(st); if (Object.keys(k).length) hash = `#migrar=${codificar({ v: 1, t: agora(), k })}`; } catch { /* vai sem dados */ }
      loc.replace(`${URL_NOVO}/${hash}`); return true;
    }
    if (String(loc.hash || '').startsWith('#migrar=')) {
      const k = decodificar(loc.hash.slice(8), agora());
      try { if (k && aplicar(k, st) >= 0) st.setItem(FLAG_MIGRADO, '1'); } catch { /* sem armazenamento */ }
      hist.replaceState(null, '', `${loc.pathname}${loc.search}`); // tira os dados do endereço
    }
  } catch { /* segue normal */ }
  return false;
}

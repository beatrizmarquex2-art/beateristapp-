// Edição Passe Beaterista: 3 cartas bônus, FORA do sorteio e do percentual do álbum principal (as 125 originais não mudam).
// IDs estáveis P01..P03. As artes finais ainda não existem: em preview usa-se arte autoral provisória do Paul (provisoria: true).
export const SECAO_PASSE = 'Edição Passe Beaterista';
export const CARTAS_PASSE = [
  { id: 'P01', titulo: 'Paul no Fliperama', descricao: 'pixel art, boné vermelho e baquetas cruzadas', arte: 'assets/aluno/paul-skate.webp', provisoria: true },
  { id: 'P02', titulo: 'Paul Colecionador', descricao: 'abrindo um envelope holográfico com figurinhas voando', arte: 'assets/aluno/paul-selfie.webp', provisoria: true },
  { id: 'P03', titulo: 'Paul no Palco', descricao: 'na bateria vermelha, sob luz dourada e moldura de ingresso', arte: 'assets/aluno/paul-bateria.webp', provisoria: true },
];
export const IDS_PASSE = CARTAS_PASSE.map((c) => c.id);
/** Marca as 3 cartas no estado do álbum (idempotente: chamar de novo não duplica nem muda a data). Não mexe em inv/pasted/granted. */
export function registrarBonus(state, quando = Date.now()) {
  const s = { ...(state || {}) }; if (s.passe && s.passe.ids && s.passe.ids.length === IDS_PASSE.length) return s;
  s.passe = { ids: [...IDS_PASSE], em: quando }; return s;
}
export const temBonus = (state) => !!(state && state.passe && IDS_PASSE.every((i) => state.passe.ids.includes(i)));
/** Junta dois estados (outro aparelho): o bônus vale se estiver em qualquer um, com a data mais antiga. */
export function juntarBonus(a, b) {
  const pa = a && a.passe, pb = b && b.passe; if (!pa && !pb) return null; if (!pa) return pb; if (!pb) return pa;
  return { ids: [...new Set([...pa.ids, ...pb.ids])], em: Math.min(pa.em || Infinity, pb.em || Infinity) };
}

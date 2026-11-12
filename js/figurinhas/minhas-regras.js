// Regra da Bea pra "minha coleção" (puro, testado em tests/minhas-limite.test.mjs): no máximo 2 cartinhas da MESMA foto no MESMO modelo de card,
// mesmo mudando o nome ou o enquadramento.
export const LIMITE_IGUAIS = 2;
/** Quantas cartinhas da lista são da mesma foto (`fotoSig`) e do mesmo modelo de card. Sem assinatura da foto (não deu pra medir) nunca bloqueia. */
export const contaIguais = (lista, fotoSig, modelo) => (fotoSig ? (lista || []).filter((x) => x && x.fotoSig === fotoSig && x.modelo === modelo).length : 0);

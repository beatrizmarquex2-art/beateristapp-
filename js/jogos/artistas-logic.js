// Adaptador compartilhado dos jogos Roleta Musical e Memória de Artistas: agrupa as 125 fotos do catálogo por ARTISTA/BANDA (ENTIDADES do Cara a Cara).
// Regra de ouro: a quantidade de fotos NUNCA muda a chance de sorteio. 1 artista = 1 entrada (com uma foto principal e as alternativas).
// Sem DOM: roda em Node (testes). Nenhum nome, música ou biografia é inventado: só o que está no cadastro. Nenhum jogo daqui concede figurinhas.

/** Filtros: [id, rótulo, teste]. Atributos nulos (não verificados) NUNCA entram em "solo/banda/dupla". */
export const FILTROS = [
  ['tudo', 'tudo', () => true],
  ['geral', 'geral', (a) => a.colecoes.includes('Geral')],
  ['beatles', 'Beatles', (a) => a.colecoes.includes('Beatles')],
  ['beaterista', 'Beaterista', (a) => a.colecoes.includes('Beaterista')],
  ['especial', 'especial', (a) => a.colecoes.includes('Especial')],
  ['raras', 'raras', (a) => a.raro],
  ['solo', 'solo', (a) => a.tipo === 'solo'],
  ['banda', 'banda', (a) => a.tipo === 'banda'],
  ['dupla', 'dupla / colab', (a) => a.tipo === 'dupla'],
];
export const FILTRO_IDS = FILTROS.map((f) => f[0]);

/** catalogo: array do catalogo.json. entidades: ENTIDADES. Devolve só artistas com pelo menos 1 foto existente no catálogo. */
export function agrupar(entidades, catalogo) {
  const cat = new Map((catalogo || []).map((c) => [c.codigo, c]));
  const out = []; const faltando = [];
  for (const e of entidades || []) {
    const fotos = (e.fotos || []).filter((c) => cat.has(c));
    for (const c of e.fotos || []) if (!cat.has(c)) faltando.push(c);
    if (!fotos.length) continue;
    const a = e.attrs || {};
    const tipo = a.dupla === true ? 'dupla' : a.banda === true ? 'banda' : a.solo === true ? 'solo' : null;
    out.push({
      id: e.id, nome: e.nome, curto: e.curto || e.nome, tipo,
      colecoes: [...new Set(fotos.map((c) => cat.get(c).colecao))],
      raro: fotos.some((c) => cat.get(c).raridade === 'Rara'),
      fotoPrincipal: fotos[0], fotosAlternativas: fotos.slice(1), fotos,
    });
  }
  return { artistas: out, faltando };
}

export const elegiveis = (artistas, filtro) => { const f = FILTROS.find((x) => x[0] === filtro) || FILTROS[0]; return artistas.filter(f[2]); };
export const contagens = (artistas) => Object.fromEntries(FILTROS.map((f) => [f[0], artistas.filter(f[2]).length]));

/** RNG padrão: crypto quando existir (imparcial), Math.random como último recurso. Devolve [0,1). */
export function rngPadrao() {
  const c = typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues ? globalThis.crypto : null;
  return () => { if (c) { const u = new Uint32Array(1); c.getRandomValues(u); return u[0] / 4294967296; } return Math.random(); };
}
export function embaralhar(lista, rng = rngPadrao()) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Roleta: 1 artista (uma chance por artista), evitando os `recentes` (ids). Se sobrar pouca opção, reduz a janela. Devolve {artista, janela, esgotou}. */
export function sortearUm(lista, { recentes = [], evitar = true, rng = rngPadrao() } = {}) {
  if (!lista.length) return { artista: null, janela: 0, esgotou: false };
  let janela = evitar ? Math.min(recentes.length, Math.max(0, lista.length - 1)) : 0;
  const bloq = new Set(recentes.slice(0, janela));
  const pool = lista.filter((a) => !bloq.has(a.id));
  const escolha = pool[Math.floor(rng() * pool.length)];
  return { artista: escolha, janela, esgotou: evitar && recentes.length > 0 && janela < Math.min(recentes.length, 10) };
}

/** Memória: n artistas DISTINTOS. `evitar` = ids da partida anterior: só entram se não houver outros suficientes. */
export function sortearPares(lista, n, { evitar = [], rng = rngPadrao() } = {}) {
  if (lista.length < n) return null; // nunca repete entidade pra completar
  const ev = new Set(evitar);
  const frescos = embaralhar(lista.filter((a) => !ev.has(a.id)), rng);
  const velhos = embaralhar(lista.filter((a) => ev.has(a.id)), rng);
  return [...frescos, ...velhos].slice(0, n);
}

/** Cartas da memória: 2 por artista (mesma foto) ou, no modo "fotos diferentes", 2 fotos distintas do mesmo artista. Cada carta: {uid, par, foto, artista}. */
export function montarCartas(artistas, { diferentes = false, rng = rngPadrao() } = {}) {
  const cartas = [];
  artistas.forEach((a, i) => {
    let f1 = a.fotoPrincipal, f2 = a.fotoPrincipal;
    if (diferentes && a.fotos.length >= 2) { const dois = embaralhar(a.fotos, rng); f1 = dois[0]; f2 = dois[1]; }
    cartas.push({ par: i, foto: f1, artista: a }, { par: i, foto: f2, artista: a });
  });
  return embaralhar(cartas, rng).map((c, k) => ({ ...c, uid: k }));
}

export const NIVEIS = [['kids', 'kids', 4], ['medio', 'médio', 6], ['dificil', 'difícil', 8], ['avancado', 'avançado', 10], ['expert', 'especialista', 12]];

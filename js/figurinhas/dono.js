// De quem são a foto do perfil, a configuração da figurinha e a "minha coleção" neste aparelho: do NOME que a pessoa usa na área dos alunos.
// Quem troca de nome (outra pessoa no mesmo aparelho) começa com tudo vazio; ao voltar com o nome antigo, o que era dele está lá.
// Sem nome (app da Bea) a chave não muda. O que já existia sem dono passa a ser de quem está com o nome agora (uma vez só).
import { db } from '../db.js';
const NOME = 'beaterista-aluno-nome';
export const dono = () => { try { return (localStorage.getItem(NOME) || window.__alunoNome || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30); } catch { return ''; } };
export const chave = (base) => { const d = dono(); return d ? `${base}:${d}` : base; };

/** localStorage: lê a chave do dono; se não existe e há uma antiga sem dono, passa a antiga pra ele (e apaga a antiga). */
export function lsLer(base) {
  const k = chave(base); try { let v = localStorage.getItem(k); if (v == null && k !== base) { v = localStorage.getItem(base); if (v != null) { localStorage.setItem(k, v); localStorage.removeItem(base); } } return v || ''; } catch { return ''; }
}
export const lsGravar = (base, v) => { try { localStorage.setItem(chave(base), v); } catch { /* ok */ } };
/** IndexedDB (db.meta): mesma ideia. */
export async function metaLer(base) {
  const k = chave(base); let v = await db.metaGet(k);
  if ((v == null) && k !== base) { v = await db.metaGet(base); if (v != null) { await db.metaSet(k, v); try { await db.metaDel(base); } catch { /* ok */ } } }
  return v;
}
export const metaGravar = (base, v) => db.metaSet(chave(base), v);
export const metaApagar = (base) => db.metaDel(chave(base));

/* ---------- álbum de figurinhas: um por dono (antes era um só por aparelho e misturava as cartas de quem trocava de nome) ---------- */
import * as store from '../store.js';
const ALBUM = 'figurinhas-album';
export const albumId = () => chave(ALBUM);
const migrados = new Set();
/** Dados do álbum de quem está com o nome agora. O álbum antigo (sem dono) vai inteiro pra UMA pessoa só (a primeira que abrir); as outras começam vazias. */
export function albumDados() {
  const id = albumId(); const meu = store.get(id); if (meu) return meu.data || {};
  if (id === ALBUM) return {};
  const velho = store.get(ALBUM); if (!velho) return {};
  if (!migrados.has(id)) { migrados.add(id); store.upsert('figurinhas', id, velho.data || {}).then(() => store.remove(ALBUM)).catch(() => {}); }
  return velho.data || {};
}

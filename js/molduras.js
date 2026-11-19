// Molduras do perfil: enfeites que a pessoa ganha nos jogos e que aparecem em volta da foto (topo do app e aba Perfil).
// Cada moldura tem o seu jeito de ganhar. Ficam guardadas junto do progresso do jogo (vão pra nuvem com ele); qual usar fica neste aparelho.
import { getGame, setGame } from './jogos/base.js';
export const MOLDURAS = [
  { id: 'lab', nome: 'Estúdio do Paul', img: 'assets/aluno/molduras/lab.webp', como: 'abra a porta bônus (a SAÍDA) do mapa Estúdio do Paul, na Fuga do Estúdio' },
];
const KEY = 'beaterista-moldura';
const avisa = () => { try { window.dispatchEvent(new CustomEvent('moldura-mudou')); } catch { /* sem janela */ } };
export const tem = (id) => !!((getGame('fuga').molduras || {})[id]);
export const dar = (id) => { if (tem(id)) return false; setGame('fuga', { molduras: { ...(getGame('fuga').molduras || {}), [id]: true } }); avisa(); return true; };
const lerEscolha = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
/** Qual moldura aparece agora: a que a pessoa escolheu (se ainda tem), "nenhuma" se desligou, senão a 1ª que ganhou. */
export const ativa = () => { const e = lerEscolha(); if (e === 'nenhuma') return ''; if (e && tem(e)) return e; const m = MOLDURAS.find((x) => tem(x.id)); return m ? m.id : ''; };
export const escolher = (id) => { try { localStorage.setItem(KEY, id || 'nenhuma'); } catch { /* sem armazenamento */ } avisa(); };
export const srcDe = (id) => (MOLDURAS.find((m) => m.id === id) || {}).img || '';
/** Faz o elemento <img> de moldura acompanhar a escolha (liga e desliga sozinho). Devolve a função que para de ouvir. */
export function ligarImg(img) {
  const p = () => { const a = ativa(); img.hidden = !a; if (a) img.src = srcDe(a); };
  p(); window.addEventListener('moldura-mudou', p); return () => window.removeEventListener('moldura-mudou', p);
}

// Toca Aqui: velocidade (atalhos de andamento) e som do toque (caixa, tambor, bumbo, chimbal). Tudo guardado no aparelho.
import { snare, kick, tom, hihat } from './audio.js';

export const BPM_MAX = 200;
export const VELOCIDADES = [['devagar', 80], ['normal', 100], ['rápido', 120], ['turbo', 140], ['super', 160]];
export const SONS = [['caixa', 'caixa']]; // só o som de caixa (pedido da Bea); a escolha de som sumiu das telas
export const ICONE_VEL = { devagar: '1', normal: '2', 'rápido': '3', turbo: '4', super: '5' }; // só pra quem ainda precisa de um texto curto; as telas usam os discos de vinil (drum-art.js)
const KEY = 'beaterista-toca-som';
export const getSom = () => { try { const v = localStorage.getItem(KEY); return SONS.some(([k]) => k === v) ? v : 'caixa'; } catch { return 'caixa'; } };
export const setSom = (k) => { try { localStorage.setItem(KEY, k); } catch { /* sem armazenamento */ } };
/** Toca a voz escolhida no instante t (segundos do relógio de áudio). */
export function voz(t, vel = 0.8, som = getSom()) {
  if (som === 'tambor') return tom(t, 150, Math.min(1, vel * 1.15));
  if (som === 'bumbo') return kick(t, Math.min(1, vel * 1.1));
  if (som === 'chimbal') return hihat(t, vel);
  return snare(t, vel);
}
/** Qual atalho de velocidade combina com este BPM (ou null se estiver entre dois). */
export const velocidadeDe = (bpm) => (VELOCIDADES.find(([, v]) => v === bpm) || [null])[0];

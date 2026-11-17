// Bônus escondidos do álbum (regras da Bea, 17/nov/2026). Ninguém é avisado antes: a figurinha EXCLUSIVA (Beaterista e Paul) simplesmente chega no baú.
//  · SEGREDOS ("easter eggs", 1 vez na vida cada): clicar no "paradiddle" do dicionário · acertar 80% do paradiddle no Rudimentix (colcheia, 120 bpm ou mais)
//    · ligar no PaulBox bateria + metrônomo + pandeiro juntos (e só esses 3).
//  · 5 VITÓRIAS SEGUIDAS jogando ONLINE (2 celulares) no mesmo jogo (memória, Uno Musical ou jogo da velha): bônus de no máximo 3 POR MÊS.
//    Depois do limite, ganhar a partida continua valendo só a estrela normal.
// Cada bônus é um pacote de 1 carta com id próprio (`egg:<segredo>` ou `bonus:<AAAA-MM>:<1..3>`), então nunca entrega em dobro, nem em dois aparelhos.
import * as AC from '../acesso.js';
import * as FR from './rewards.js';
import * as D from './dono.js';
import { toast } from '../ui.js';

export const SEQ_ONLINE = 5, MAX_POR_MES = 3;
const livre = () => { try { return document.documentElement.classList.contains('aluno-on') && !AC.liberado(); } catch { return true; } };
const chave = () => `beaterista-bonus:${D.albumId()}`;
const ler = () => { try { return JSON.parse(localStorage.getItem(chave()) || '{}') || {}; } catch { return {}; } };
const gravar = (s) => { try { localStorage.setItem(chave(), JSON.stringify(s)); } catch { /* sem armazenamento */ } };
const mesDe = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Segredo achado (1 vez na vida por segredo). Devolve true se entregou agora. */
export async function egg(nome) {
  if (livre()) return false;
  try { const n = await FR.grantPacks([`egg:${nome}`]); if (n) toast('🥚 você achou um segredo do Paul! uma figurinha exclusiva chegou no baú (Stars)', { ms: 5200 }); return !!n; } catch { return false; }
}
/** Quantos bônus de vitória seguida já vieram neste mês (conta nos pacotes do álbum, então vale em qualquer aparelho). */
export const bonusDoMes = (granted, mes = mesDe()) => (granted || []).filter((id) => String(id).startsWith(`bonus:${mes}:`)).length;
/** Fim de uma partida ONLINE: `res` = 'win' | 'loss' | 'tie'. Vitória soma na sequência daquele jogo; derrota zera; empate não mexe. */
export async function online(jogo, res) {
  if (livre()) return false;
  try {
    const s = ler(); s.seq = s.seq || {};
    if (res === 'loss') s.seq[jogo] = 0;
    else if (res === 'win') s.seq[jogo] = (s.seq[jogo] || 0) + 1;
    let deu = false;
    if ((s.seq[jogo] || 0) >= SEQ_ONLINE) {
      s.seq[jogo] = 0; const mes = mesDe(); const ja = bonusDoMes(FR.stateOf().granted, mes);
      if (ja < MAX_POR_MES) { const n = await FR.grantPacks([`bonus:${mes}:${ja + 1}`]); if (n) { deu = true; toast('🎁 bônus! 5 vitórias seguidas online: uma figurinha exclusiva chegou no baú (Stars)', { ms: 5200 }); } }
    }
    gravar(s); return deu;
  } catch { return false; }
}

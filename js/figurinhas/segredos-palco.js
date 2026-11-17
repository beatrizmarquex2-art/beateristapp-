// Segredos do Palco (easter eggs): toque certo = 3 ★ na 1ª vez (nome grande na tela) e, nas outras, só um brilhinho com notinhas.
//  · bateria / eletrônica: Believer = 4 no surdo + caixa · We Will Rock You = surdo, tom, surdo, tom + caixa · Sunflower = 4 no chimbal + caixa
//  · cajón (só grave e agudo): Believer = 4 graves + agudo · We Will Rock You = 2 graves + agudo · Sunflower = 4 agudos + grave
//  · teclado, xilofone e violão (notas): Dó Ré Mi Fá Fá Fá
// A estrela vem de `ganhou('palco', 3, 'segredo|id')`: cada segredo paga uma vez na vida (sem repetir), e sem código só aparece o efeito.
const DRUM = { believer: 'FFFFS', wwry: 'FTFTS', sunflower: 'HHHHS' };
const CAJON = { believer: 'FFFFS', wwry: 'FFS', sunflower: 'SSSSF' };
const NOMES = { believer: 'Believer', wwry: 'We Will Rock You', sunflower: 'Sunflower', melodia: 'Dó Ré Mi Fá Fá Fá' };
const MELODIA = [0, 2, 4, 5, 5, 5];
const ORDEM = ['believer', 'wwry', 'sunflower'];
const JANELA = 1300; // ms entre uma batida e a outra
let buf = '', ult = 0, nbuf = [], nult = 0;
const cls = (modelo, id) => (modelo === 'cajon' ? { bd: 'F', sn: 'S' }[id] : { bd: 'B', sn: 'S', tt: 'T', mt: 'T', ft: 'F', hh: 'H', ho: 'H' }[id]) || '';
/** Casa o fim do que foi tocado com algum segredo (o mais comprido primeiro). Puro. */
export function achaBateria(modelo, texto) { const tab = modelo === 'cajon' ? CAJON : DRUM; return ORDEM.filter((k) => texto.endsWith(tab[k])).sort((a, b) => tab[b].length - tab[a].length)[0] || null; }
export const achaMelodia = (midis) => midis.length >= MELODIA.length && MELODIA.every((p, i) => ((midis[midis.length - MELODIA.length + i] % 12) + 12) % 12 === p);
export function bateria(modelo, id, agora = Date.now()) {
  const c = cls(modelo, id); if (!c) return null;
  if (agora - ult > JANELA) buf = ''; ult = agora; buf = (buf + c).slice(-8);
  const k = achaBateria(modelo, buf); if (k) { buf = ''; mostrar(k); } return k;
}
export function nota(midi, agora = Date.now()) {
  if (agora - nult > JANELA * 1.6) nbuf = []; nult = agora; nbuf = [...nbuf, midi].slice(-8);
  if (achaMelodia(nbuf)) { nbuf = []; mostrar('melodia'); return 'melodia'; } return null;
}
let css = false;
function estilo() {
  if (css || typeof document === 'undefined') return; css = true;
  const s = document.createElement('style'); s.textContent = `.sg-pop{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;pointer-events:none}
.sg-box{background:linear-gradient(160deg,#17224a,#0b1130);color:#fff6e0;border:3px solid #ffd23f;border-radius:22px;padding:18px 26px;text-align:center;box-shadow:0 0 60px #ffd23f88;animation:sgIn .5s cubic-bezier(.2,1.6,.4,1) both,sgOut .5s 3s forwards}
.sg-box small{display:block;letter-spacing:.25em;color:#ffd23f;font-weight:800;font-size:11px;text-transform:uppercase}.sg-box b{display:block;font-size:30px;margin:6px 0;font-family:'Anton',system-ui,sans-serif;letter-spacing:.03em}.sg-box em{font-style:normal;font-weight:800;color:#ffd23f}
.sg-n{position:fixed;bottom:22%;font-size:26px;z-index:99999;pointer-events:none;animation:sgUp 1.6s ease-out forwards}
@keyframes sgIn{from{transform:scale(.3) rotate(-8deg);opacity:0}to{transform:none;opacity:1}}@keyframes sgOut{to{opacity:0;transform:translateY(-30px)}}
@keyframes sgUp{0%{transform:translateY(0) scale(.6);opacity:0}15%{opacity:1}100%{transform:translateY(-160px) rotate(var(--r)) scale(1.1);opacity:0}}
@media (prefers-reduced-motion:reduce){.sg-box,.sg-n{animation-duration:.01s}}`; document.head.append(s);
}
const FLAG = (k) => `beaterista-segredo-${k}`;
const jaViu = (k) => { try { return localStorage.getItem(FLAG(k)) === '1'; } catch { return false; } };
function notinhas(n) {
  for (let i = 0; i < n; i++) { const e = document.createElement('i'); e.className = 'sg-n'; e.textContent = ['♪', '♫', '✨', '♬'][i % 4]; e.style.left = `${18 + Math.random() * 64}%`; e.style.setProperty('--r', `${Math.round(Math.random() * 60 - 30)}deg`); e.style.animationDelay = `${i * 0.09}s`; e.setAttribute('aria-hidden', 'true'); document.body.append(e); setTimeout(() => e.remove(), 2400); }
}
export function mostrar(k) {
  if (typeof document === 'undefined') return; estilo();
  if (jaViu(k)) { notinhas(7); return; } // das próximas vezes: só o brilhinho e as notinhas
  try { localStorage.setItem(FLAG(k), '1'); } catch { /* sem armazenamento: aparece de novo, mas a estrela não se repete */ }
  const pop = document.createElement('div'); pop.className = 'sg-pop'; pop.setAttribute('role', 'status');
  pop.innerHTML = `<div class="sg-box"><small>segredo do Paul</small><b>🎵 ${NOMES[k]}</b><em>+3 ★</em></div>`; document.body.append(pop); notinhas(12); setTimeout(() => pop.remove(), 3600);
  import('../jogos/estrelas-jogo.js').then((E) => E.ganhou('palco', 3, `segredo|${k}`)).catch(() => {});
}

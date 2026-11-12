// Desenhos da aba Tocar: o Útil (metrônomo, afinador, cronômetro) e os pads de percussão (congas, bongô, pandeiro, triângulo, cowbell, ovinho, claves, palma, agogô).
// Tudo é SVG feito aqui (sem imagem de terceiros). Cores do app: vinho, vermelho, creme, ouro, azul-marinho, azul e petróleo, contorno de tinta.
const K = '#1b1818'; const CR = '#fbf3e6'; const VI = '#7a1226'; const RE = '#d92031'; const OU = '#e8a92c'; const AM = '#1d3566'; const AZ = '#4a79b4'; const PE = '#2a7f86'; const MA = '#c58a3a';
const S = (inner, vb = '0 0 100 100') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${inner}</svg>`;
const st = `stroke="${K}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

export const UTIL_ART = {
  // metrônomo de pirâmide: corpo vinho, mostrador creme, haste com peso dourado que balança
  metronomo: S(`
    <path d="M30 90 L38 14 Q50 8 62 14 L70 90 Z" fill="${VI}" ${st}/>
    <path d="M36 90 L42 28 L58 28 L64 90 Z" fill="${CR}" ${st}/>
    <g stroke="${K}" stroke-width="2" stroke-linecap="round"><path d="M45 40h10M44 50h12M43 60h14M42 70h16M41 80h18"/></g>
    <g class="mt-arm" style="transform-origin:50px 86px"><path d="M50 86 L50 22" stroke="${K}" stroke-width="3.5" stroke-linecap="round"/><rect x="44" y="34" width="12" height="11" rx="2" fill="${OU}" ${st}/></g>
    <rect x="24" y="86" width="52" height="9" rx="3" fill="${RE}" ${st}/>
    <circle cx="50" cy="19" r="3.4" fill="${OU}" ${st}/>`),
  // afinador: mostrador de meia-lua com agulha no meio (afinado), zona verde no centro
  afinador: S(`
    <rect x="12" y="22" width="76" height="62" rx="12" fill="${AM}" ${st}/>
    <path d="M24 64 A26 26 0 0 1 76 64" fill="none" stroke="${CR}" stroke-width="5" stroke-linecap="round"/>
    <path d="M42 41 A26 26 0 0 1 58 41" fill="none" stroke="#7fe3a0" stroke-width="5" stroke-linecap="round"/>
    <g stroke="${CR}" stroke-width="2.5" stroke-linecap="round"><path d="M27 55 L31 58M36 43 L39 47M64 47 L67 43M73 58 L77 55"/></g>
    <g class="af-agulha" style="transform-origin:50px 66px"><path d="M50 66 L50 38" stroke="${OU}" stroke-width="3.5" stroke-linecap="round"/></g>
    <circle cx="50" cy="66" r="5.5" fill="${OU}" ${st}/>
    <path d="M30 78h40" stroke="${CR}" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>
    <text x="50" y="17" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="11" fill="${K}">♩ = ♯ ♭</text>`),
  // cronômetro: botão em cima, mostrador creme, ponteiro vermelho
  cronometro: S(`
    <rect x="42" y="7" width="16" height="8" rx="2" fill="${OU}" ${st}/>
    <rect x="46" y="14" width="8" height="8" fill="${K}"/>
    <path d="M72 26 L80 18" stroke="${K}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="50" cy="58" r="34" fill="${AZ}" ${st}/>
    <circle cx="50" cy="58" r="27" fill="${CR}" ${st}/>
    <g stroke="${K}" stroke-width="2.5" stroke-linecap="round"><path d="M50 36v5M50 75v5M28 58h5M67 58h5"/></g>
    <path d="M50 58 L50 58 A27 27 0 0 1 72 70 Z" fill="${RE}" opacity=".35"/>
    <g class="cr-ponteiro" style="transform-origin:50px 58px"><path d="M50 58 L50 40" stroke="${RE}" stroke-width="4" stroke-linecap="round"/></g>
    <circle cx="50" cy="58" r="4.5" fill="${K}"/>`),
};

export const PERC_ART = {
  cg1: S(`<ellipse cx="50" cy="26" rx="25" ry="9" fill="${CR}" ${st}/><path d="M25 26 L31 88 Q50 95 69 88 L75 26 Q50 37 25 26Z" fill="${RE}" ${st}/><path d="M28 44 Q50 54 72 44M30 62 Q50 72 70 62" stroke="${CR}" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="26" rx="25" ry="9" fill="none" stroke="${OU}" stroke-width="3"/>`),
  cg2: S(`<ellipse cx="50" cy="24" rx="30" ry="10" fill="${CR}" ${st}/><path d="M20 24 L27 88 Q50 96 73 88 L80 24 Q50 36 20 24Z" fill="${VI}" ${st}/><path d="M23 44 Q50 55 77 44M25 62 Q50 73 75 62" stroke="${OU}" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="24" rx="30" ry="10" fill="none" stroke="${OU}" stroke-width="3"/>`),
  bg: S(`<g><ellipse cx="30" cy="34" rx="19" ry="7" fill="${CR}" ${st}/><path d="M11 34 L16 80 Q30 86 44 80 L49 34 Q30 42 11 34Z" fill="${AM}" ${st}/></g><g><ellipse cx="68" cy="30" rx="16" ry="6" fill="${CR}" ${st}/><path d="M52 30 L56 74 Q68 80 80 74 L84 30 Q68 37 52 30Z" fill="${AZ}" ${st}/></g><path d="M40 52 Q50 56 60 50" stroke="${OU}" stroke-width="5" fill="none" stroke-linecap="round"/>`),
  pd: S(`<circle cx="50" cy="50" r="38" fill="${MA}" ${st}/><circle cx="50" cy="50" r="30" fill="${CR}" ${st}/><g fill="${OU}" ${st}><ellipse cx="50" cy="16" rx="8" ry="3.6"/><ellipse cx="50" cy="84" rx="8" ry="3.6"/><ellipse cx="16" cy="50" rx="3.6" ry="8"/><ellipse cx="84" cy="50" rx="3.6" ry="8"/><ellipse cx="26" cy="26" rx="7" ry="3.4" transform="rotate(-45 26 26)"/><ellipse cx="74" cy="26" rx="7" ry="3.4" transform="rotate(45 74 26)"/><ellipse cx="26" cy="74" rx="7" ry="3.4" transform="rotate(45 26 74)"/><ellipse cx="74" cy="74" rx="7" ry="3.4" transform="rotate(-45 74 74)"/></g><circle cx="50" cy="50" r="21" fill="none" stroke="${MA}" stroke-width="2.5" stroke-dasharray="3 5" stroke-linecap="round"/><path d="M30 38 Q40 24 58 27" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".9"/><path d="M50 44 l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" fill="${RE}" ${st} stroke-width="2"/>`),
  tr: S(`<path d="M50 14 L84 78 L16 78 Z" fill="none" stroke="${K}" stroke-width="9" stroke-linejoin="round"/><path d="M50 14 L84 78 L16 78 Z" fill="none" stroke="#e9e3d4" stroke-width="5" stroke-linejoin="round"/><path d="M50 14 L50 6" stroke="${K}" stroke-width="3"/><path d="M82 24 L58 70" stroke="${K}" stroke-width="3.5" stroke-linecap="round" opacity=".0"/><g><path d="M74 20 L52 62" stroke="${OU}" stroke-width="5" stroke-linecap="round"/><path d="M74 20 L52 62" stroke="${K}" stroke-width="1.5" stroke-linecap="round" opacity=".5"/></g>`),
  cb: S(`<path d="M32 22 L68 22 L82 86 L18 86 Z" fill="${K}" ${st}/><path d="M36 26 L48 26 L40 80 L26 80 Z" fill="#555" opacity=".9"/><rect x="32" y="12" width="36" height="12" rx="4" fill="${RE}" ${st}/><ellipse cx="50" cy="86" rx="32" ry="6" fill="#2d2a2a" ${st}/><circle cx="50" cy="52" r="7" fill="${OU}" ${st}/>`),
  ov: S(`<path d="M50 10 C74 10 82 44 74 68 C70 84 30 84 26 68 C18 44 26 10 50 10Z" fill="${PE}" ${st}/><g fill="${OU}"><circle cx="42" cy="32" r="4"/><circle cx="58" cy="30" r="4"/><circle cx="50" cy="48" r="4"/><circle cx="36" cy="58" r="4"/><circle cx="64" cy="58" r="4"/></g><path d="M34 76 Q50 84 66 76" stroke="${CR}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`),
  cl: S(`<g transform="rotate(-28 50 50)"><rect x="12" y="38" width="76" height="13" rx="6.5" fill="${MA}" ${st}/></g><g transform="rotate(24 50 50)"><rect x="12" y="52" width="76" height="13" rx="6.5" fill="#a8641f" ${st}/></g><g stroke="${OU}" stroke-width="3.5" stroke-linecap="round"><path d="M18 20 L26 28M50 8 L50 18M82 20 L74 28"/></g>`),
  pm: S(`<g transform="rotate(-20 36 62)"><path d="M26 82 L22 46 Q22 36 30 36 Q38 36 38 46 L40 70 Z" fill="#f2c9a0" ${st}/></g><g transform="rotate(20 64 62)"><path d="M74 82 L78 46 Q78 36 70 36 Q62 36 62 46 L60 70 Z" fill="#f0b98a" ${st}/></g><g stroke="${OU}" stroke-width="4" stroke-linecap="round"><path d="M50 10 L50 24M30 14 L36 24M70 14 L64 24"/></g>`),
  ag: S(`<path d="M50 8 L50 30" stroke="${K}" stroke-width="3.5" stroke-linecap="round"/><path d="M50 30 Q22 30 22 42 M50 30 Q78 30 78 42" fill="none" stroke="${K}" stroke-width="3.5" stroke-linecap="round"/><path d="M14 42 L30 42 L36 88 L8 88 Z" fill="${OU}" ${st}/><path d="M66 42 L84 42 L92 76 L62 76 Z" fill="#f1c552" ${st}/><ellipse cx="22" cy="88" rx="14" ry="4" fill="#b98115" ${st}/><ellipse cx="77" cy="76" rx="15" ry="4" fill="#b98115" ${st}/><path d="M18 50 L20 80" stroke="#fff6" stroke-width="3" stroke-linecap="round"/>`),
};

/** Como cada peça "responde" ao toque (animação do desenho): [keyframes, duração em ms]. */
export const PERC_ANIM = {
  cg1: [[{ transform: 'scale(1)' }, { transform: 'scale(1.1,.86)' }, { transform: 'scale(.97,1.06)' }, { transform: 'scale(1)' }], 280],
  cg2: [[{ transform: 'scale(1)' }, { transform: 'scale(1.12,.82)' }, { transform: 'scale(.96,1.08)' }, { transform: 'scale(1)' }], 340],
  bg: [[{ transform: 'rotate(0)' }, { transform: 'rotate(-7deg) scale(1.06)' }, { transform: 'rotate(5deg)' }, { transform: 'rotate(0)' }], 260],
  pd: [[{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-16deg) scale(1.08)' }, { transform: 'rotate(13deg) scale(1.04)' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(0) scale(1)' }], 460],
  tr: [[{ transform: 'rotate(0)' }, { transform: 'rotate(10deg)' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(5deg)' }, { transform: 'rotate(0)' }], 620],
  cb: [[{ transform: 'rotate(0)' }, { transform: 'rotate(-12deg) scale(1.05)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(0)' }], 300],
  ov: [[{ transform: 'translateX(0) rotate(0)' }, { transform: 'translateX(-9px) rotate(-14deg)' }, { transform: 'translateX(9px) rotate(14deg)' }, { transform: 'translateX(-5px) rotate(-8deg)' }, { transform: 'translateX(0) rotate(0)' }], 380],
  cl: [[{ transform: 'scale(1)' }, { transform: 'scale(.86) rotate(-5deg)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], 200],
  pm: [[{ transform: 'scale(1)' }, { transform: 'scale(.82)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], 240],
  ag: [[{ transform: 'rotate(0)', transformOrigin: '50% 0' }, { transform: 'rotate(-14deg)', transformOrigin: '50% 0' }, { transform: 'rotate(11deg)', transformOrigin: '50% 0' }, { transform: 'rotate(-6deg)', transformOrigin: '50% 0' }, { transform: 'rotate(0)', transformOrigin: '50% 0' }], 560],
};
/** Cor de fundo de cada pad. */
export const PERC_BG = { cg1: '#ffe1d6', cg2: '#f5d9de', bg: '#d9e5f5', pd: '#fff0c9', tr: '#e8f1f3', cb: '#ececec', ov: '#d7efee', cl: '#f6e7cf', pm: '#fde4d2', ag: '#fff2c2' };

/** Os 4 grupos de instrumento (bateria, cordas, teclas, percussão) em desenho. */
const IMG = (n) => `<img src="assets/jogos/instrumentos/${n}.webp" alt="" draggable="false" decoding="async">`;
export const INSTR_ART_SVG = {
  toque: S(`<g><circle cx="60" cy="62" r="26" fill="${RE}" ${st}/><circle cx="60" cy="62" r="19" fill="${CR}" ${st}/><circle cx="60" cy="62" r="4" fill="${VI}"/></g><g><ellipse cx="30" cy="38" rx="15" ry="6" fill="${CR}" ${st}/><path d="M15 38 V54 Q30 62 45 54 V38" fill="${AM}" ${st}/></g><g><ellipse cx="90" cy="38" rx="15" ry="6" fill="${CR}" ${st}/><path d="M75 38 V54 Q90 62 105 54 V38" fill="${AM}" ${st}/></g><ellipse cx="14" cy="18" rx="16" ry="4" fill="${OU}" ${st}/><g><ellipse cx="106" cy="14" rx="16" ry="4" fill="${OU}" ${st}/><path d="M106 18 V60" stroke="${K}" stroke-width="3"/></g>`, '0 0 120 100'),
  violao: S(`<g transform="rotate(-38 60 52)"><path d="M12 52 H64" stroke="${K}" stroke-width="9" stroke-linecap="round"/><path d="M12 52 H64" stroke="${MA}" stroke-width="5" stroke-linecap="round"/><rect x="2" y="44" width="16" height="16" rx="3" fill="${K}"/><path d="M60 52 C60 36 78 30 84 40 C88 46 100 40 106 48 C112 58 100 74 84 72 C78 71 74 66 68 66 C58 66 60 58 60 52Z" fill="${RE}" ${st}/><circle cx="84" cy="54" r="7" fill="${K}"/><rect x="92" y="46" width="4" height="16" fill="${K}"/></g>`, '0 0 120 100'),
  piano: S(`<rect x="6" y="26" width="108" height="52" rx="8" fill="${K}"/><rect x="10" y="30" width="100" height="44" rx="5" fill="${CR}"/><g stroke="${K}" stroke-width="1.5"><path d="M24 30v44M38 30v44M52 30v44M66 30v44M80 30v44M94 30v44"/></g><g fill="${K}"><rect x="20" y="30" width="9" height="26" rx="2"/><rect x="34" y="30" width="9" height="26" rx="2"/><rect x="62" y="30" width="9" height="26" rx="2"/><rect x="76" y="30" width="9" height="26" rx="2"/><rect x="90" y="30" width="9" height="26" rx="2"/></g>`, '0 0 120 100'),
  xilofone: PERC_ART.pd,
};

/** Desenhos de verdade (os mesmos instrumentos ilustrados do resto do app) pro toca-discos e pros pads de pandeiro e triângulo. */
export const INSTR_ART = { toque: IMG('bateria'), violao: IMG('violao'), piano: IMG('teclado'), xilofone: IMG('pandeiro') };
PERC_ART.pd = IMG('pandeiro'); PERC_ART.tr = IMG('triangulo');

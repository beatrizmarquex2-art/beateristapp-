// Desenhos vetoriais simples dos itens do bingo que não têm imagem no pacote (viewBox 48×48). Cada um desenha só o que o nome diz.
const I = '#142036'; const R = '#BD1733'; const N = '#17365B'; const M = '#EBA332'; const C = '#fffdf7';
const sk = (w = 2.4) => `stroke="${I}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
export const ART = {
  bumbo: `<ellipse cx="24" cy="24" rx="19" ry="19" fill="${R}" ${sk()}/><circle cx="24" cy="24" r="13" fill="${C}" ${sk()}/><path d="M24 17l2 5 5 .5-4 3.5 1.2 5L24 28l-4.2 3 1.2-5-4-3.5 5-.5z" fill="${R}"/>`,
  caixa: `<path d="M8 18v14c0 3 7 5 16 5s16-2 16-5V18" fill="${C}" ${sk()}/><ellipse cx="24" cy="18" rx="16" ry="5" fill="${C}" ${sk()}/><path d="M8 24c0 3 7 5 16 5s16-2 16-5M8 30c0 3 7 5 16 5s16-2 16-5" fill="none" stroke="${R}" stroke-width="2.4"/><path d="M12 36l-3 5M36 36l3 5" ${sk()}/>`,
  chimbal: `<path d="M6 17c8-5 28-5 36 0-8 3-28 3-36 0z" fill="${M}" ${sk()}/><path d="M6 24c8 3 28 3 36 0-8-5-28-5-36 0z" fill="${M}" ${sk()} transform="translate(0 2)"/><path d="M24 29v13M16 43h16" ${sk(3)}/>`,
  tom: `<path d="M9 16v16c0 3 6 5 15 5s15-2 15-5V16" fill="${R}" ${sk()}/><ellipse cx="24" cy="16" rx="15" ry="5" fill="${C}" ${sk()}/><path d="M13 21v14M24 22v15M35 21v14" stroke="${C}" stroke-width="2"/>`,
  surdo: `<path d="M7 12v22c0 3 7 5 17 5s17-2 17-5V12" fill="${N}" ${sk()}/><ellipse cx="24" cy="12" rx="17" ry="5.5" fill="${C}" ${sk()}/><path d="M10 40l-2 5M38 40l2 5" ${sk(3)}/><path d="M13 20v16M24 22v17M35 20v16" stroke="${M}" stroke-width="2"/>`,
  crash: `<path d="M5 22c0-4 9-9 19-9s19 5 19 9c-8-3-30-3-38 0z" fill="${M}" ${sk()}/><circle cx="24" cy="15" r="2.4" fill="${I}"/><path d="M24 22v21M17 44h14" ${sk(3)}/><path d="M12 19c4-3 20-3 24 0" fill="none" stroke="${C}" stroke-width="1.6"/>`,
  ride: `<ellipse cx="24" cy="22" rx="20" ry="9" fill="${M}" ${sk()}/><ellipse cx="24" cy="21" rx="6" ry="2.8" fill="${C}" ${sk(1.6)}/><ellipse cx="24" cy="22" rx="12.5" ry="5.4" fill="none" stroke="${I}" stroke-width="1.2"/><path d="M24 31v12M17 44h14" ${sk(3)}/>`,
  baquetas: `<path d="M8 40L34 10" ${sk(5)} stroke="${M}"/><path d="M8 40L34 10" fill="none" stroke="${I}" stroke-width="1.2"/><circle cx="36" cy="8" r="4.2" fill="${C}" ${sk(2)}/><path d="M14 42L40 18" ${sk(5)} stroke="${M}"/><circle cx="42" cy="15" r="4.2" fill="${C}" ${sk(2)}/>`,
  microfone: `<rect x="16" y="4" width="16" height="23" rx="8" fill="${N}" ${sk()}/><path d="M16 12h16M16 17h16M16 22h16" stroke="${C}" stroke-width="1.6"/><path d="M11 22c0 8 5 12 13 12s13-4 13-12" fill="none" ${sk()}/><path d="M24 34v8M16 43h16" ${sk(3)}/>`,
  amplificador: `<rect x="5" y="9" width="38" height="32" rx="4" fill="${I}" ${sk()}/><circle cx="24" cy="27" r="9" fill="#394a63" stroke="${C}" stroke-width="2"/><circle cx="24" cy="27" r="3" fill="${C}"/><circle cx="12" cy="15" r="2" fill="${M}"/><circle cx="19" cy="15" r="2" fill="${M}"/><circle cx="26" cy="15" r="2" fill="${R}"/>`,
  fone: `<path d="M8 28v-4a16 16 0 0132 0v4" fill="none" ${sk(4)}/><rect x="5" y="26" width="9" height="15" rx="4" fill="${R}" ${sk()}/><rect x="34" y="26" width="9" height="15" rx="4" fill="${R}" ${sk()}/>`,
  metronomo: `<path d="M17 6h14l8 36H9z" fill="${M}" ${sk()}/><path d="M24 36L31 11" ${sk(2.6)}/><circle cx="29" cy="17" r="3.2" fill="${R}" ${sk(1.6)}/><rect x="9" y="39" width="30" height="4" rx="1.5" fill="${N}" ${sk(1.6)}/>`,
};
const NS = 'http://www.w3.org/2000/svg';
export function artEl(id) { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 48 48'); s.setAttribute('class', 'jg-art'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = ART[id]; return s; }

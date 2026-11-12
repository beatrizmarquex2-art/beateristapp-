// Pixel art do mapa: sprites desenhados em grades de letras (cada letra = uma cor). SVG com bordas retas, nada de imagem nova.
// cores da escola (mostarda/dourado, azul-cinza e branco); verdes e marrom só nos desenhos de árvore
const PAL = { k: '#1d2a3a', a: '#2b3d52', b: '#5d7189', c: '#8f6a14', d: '#c99a2e', e: '#e2b84a', f: '#2b3d52', g: '#b8c6d6', w: '#ffffff', n: '#3fae6b', m: '#1f6b4a', t: '#7a4a2a', r: '#c99a2e', o: '#e2b84a', p: '#f0d9a0', s: '#c4d0dd', u: '#7fc8e6', v: '#2b86aa', x: '#e98a2b', y: '#b8561a', z: '#f3c98a', q: '#3b4c8a', l: '#8fe0a8', i: '#e6f6ff', j: '#1b5a82', B: '#5a3a22', E: '#a8743f', Y: '#ffd23f', R: '#d9421f', L: '#ff8a2b', G: '#8a93a0', H: '#5c6573', S: '#d5dae1', C: '#f3e0b8' };
const SPR = {
  amp: ['kkkkkkkkkk', 'kffffffffk', 'kfdfdfdffk', 'kffffffffk', 'kkkkkkkkkk', 'kffggggffk', 'kfgkkkkgfk', 'kfgkwwkgfk', 'kfgkkkkgfk', 'kffggggffk', 'kkkkkkkkkk'],
  tape: ['kkkkkkkkkkkk', 'kddddddddddk', 'kdwwwddwwwdk', 'kdwkwddwkwdk', 'kdwwwddwwwdk', 'kddddddddddk', 'kkdkkkkkkdkk', 'kkkkkkkkkkkk'],
  note: ['...kkkk', '...kddk', '...kd.k', '...kd..', '.kkkd..', 'kddkd..', 'kddkk..', '.kk....'],
  shop: ['..kkkkkkkkkk..', '.kdwdwdwdwdwdk', 'kkkkkkkkkkkkkk', 'kbbbbbbbbbbbbk', 'kbgggbbbbgggbk', 'kbgeegbbbgeegk', 'kbgggbbkkbgggk', 'kbbbbbbkdkbbbk', 'kbbbbbbkkkbbbk', 'kkkkkkkkkkkkkk'],
  school: ['......ke......', '......kkkk....', '..kkkkkkkkkk..', '.kcccccccccck.', 'kkkkkkkkkkkkkk', 'kwwkwwkwwkwwwk', 'kwgkwgkwgkwgwk', 'kwwkwwkwwkwwwk', 'kwwwwwkkkwwwwk', 'kwwwwwkdkwwwwk', 'kkkkkkkkkkkkkk'],
  stage: ['kkkkkkkkkkkkkkkk', 'kccccddeeddccck.', 'kcccdddeeedddck.', 'kccddd....dddck.', 'kccdd......ddck.', 'kcdd........dck.', 'kkkkkkkkkkkkkkkk', 'kbbbbbbbbbbbbbbk', 'kkkkkkkkkkkkkkkk'],
  tree: ['...kkkk...', '..knnnnk..', '.knnmnnnk.', 'knnnnnmnnk', 'knmnnnnnnk', '.knnnnmnk.', '..kkntkk..', '....ktk...', '....ktk...'],
  lamp: ['.kkkkk.', 'keeeeek', 'keewwek', 'kkkkkkk', '..kfk..', '..kfk..', '..kfk..', '..kfk..', '.kkfkk.'],
  star: ['...ke...', '...kek..', 'kkkkekkk', 'keeeeeek', '.keeeeek', '..keeek.', '.kek.ek.', '.k....k.'],
  lock: ['..kkkk..', '.kwwwwk.', '.kw..wk.', 'kkkkkkkk', 'keeeeeek', 'keekkeek', 'keekkeek', 'kkkkkkkk'],
  card: ['kkkkkkkk', 'kwwwwwwk', 'kwdwwwwk', 'kwwwwwwk', 'kwwddwwk', 'kwwddwwk', 'kwwwwwwk', 'kwwwwdwk', 'kwwwwwwk', 'kkkkkkkk'],
  ball: ['..kkkkk..', '.kdddddk.', 'kdddddddk', 'kddwwwddk', 'kddwkwddk', 'kddwwwddk', 'kdddddddk', '.kdddddk.', '..kkkkk..'],
  book: ['.kkkkkkkk.', 'kbbbbbbbbk', 'kbwwkwwwbk', 'kbwwkwwwbk', 'kbwwkwwwbk', 'kbwwkwwwbk', 'kbbbbbbbbk', '.kkkkkkkk.'],
  sticks: ['ke.....ek', '.kek.kek.', '..kekek..', '...kek...', '..kekek..', '.kek.kek.', 'ke.....ek'],
  frame: ['kkkkkkkkkk', 'keeeeeeeek', 'kegggggggek', 'kegggeeggek', 'kennnnnnnek', 'kennnnnnnek', 'keeeeeeeek', 'kkkkkkkkkk'],
  face: ['..kkkk..', '.kddddk.', 'kddddddk', 'kdkddkdk', 'kddddddk', 'kdkkkkdk', '.kddddk.', '..kkkk..'],
  guitar: ['.....kk', '....kek', '...kek.', '..kek..', '.kbbk..', 'kbbbbk.', 'kbkkbk.', 'kbbbbk.', '.kbbk..', '..kk...'],
  gear: ['...kkk...', '.k.kbk.k.', '.kkbbbkk.', 'kkbbkbbkk', 'kbbkwkbbk', 'kkbbkbbkk', '.kkbbbkk.', '.k.kbk.k.', '...kkk...'],
  mic: ['.kkkk.', 'kggggk', 'kgwwgk', 'kggggk', '.kkkk.', '..kk..', '..kk..', '.kkkk.'],
  trophy: ['kkkkkkkkk', 'keeeeeeek', 'keewweeek', '.keeeeek.', '..keeek..', '...kek...', '...kek...', '.kkkkkkk.', '.kbbbbbk.', '.kkkkkkk.'],
  piece: ['..kk....', '.kggk...', 'kkggkkkk', 'kggggggk', 'kggggggk', 'kkggkkkk', '..kggk..', '...kk...'],
  piano: ['kkkkkkkkkkkk', 'kwkkwkkwkkwk', 'kwkkwkkwkkwk', 'kwkkwkkwkkwk', 'kwwkwwkwwkwk', 'kwwkwwkwwkwk', 'kkkkkkkkkkkk'],
  drum: ['.kkkkkkkk.', 'kwwwwwwwwk', 'kkkkkkkkkk', 'kddkddkddk', 'kddkddkddk', 'kkkkkkkkkk', '.k......k.', 'k.k....k.k'],
  record: ['..kkkkk..', '.kaaaaak.', 'kaabbbaak', 'kabbddbak', 'kabddddbk', 'kabbddbak', 'kaabbbaak', '.kaaaaak.', '..kkkkk..'],
  curtain: ['kkkkkkkkkk', 'kccckkcccc', 'kccckkcccc', 'kcdckkcdck', 'kccckkcccc', 'kccckkcccc', 'kkkkkkkkkk'],
  spot: ['kkkk....', 'kfffk...', 'kfeeek..', 'kfeeeek.', 'kkfeeeek', '..kkfeek', '....kkkk'],
  sax: ['.kkk..', 'keek..', '.kek..', '.kek..', '.kek..', '.keek.', 'kekeek', 'keeeek', '.kkkk.'],
  heart: ['.kk.kk.', 'kddkddk', 'kdddddk', 'kdddddk', '.kdddk.', '..kdk..', '...k...'],
  bush: ['..kkkkk..kkk.', '.knnnnnkknnnk', 'knnmnnnnnnmnk', 'knnnnnmnnnnnk', 'knmnnnnnnmnnk', 'kkkkkkkkkkkkk'],
  flower: ['.kkkkk.', 'kwwwwwk', 'kwwdwwk', 'kwwwwwk', '.kkkkk.', '..knk..', '.knnk..', 'knnkk..'],
  cactus: ['...kkk...', '..knnnk..', '..knmnk..', 'k.knnnk.k', 'knknnnknk', 'knknmnknk', 'kkknnnkkk', '..knnnk..', '..knnnk..', '.kkkkkkk.'],
  vaso: ['..k..k...', '.knk.knk.', 'knnmknnnk', '.knnnnnk.', '..kmnmk..', '.kbbbbbk.', '..kbbbk..', '..kkkkk..'],
  sprout: ['.kk.kk.', 'knnknnk', 'kmnnnmk', '.kknkk.', '...kn..', '...kn..', '..kkkk.'],
  pine: ['....k....', '...knk...', '..knnnk..', '...knnk..', '..knmnnk.', '.knnnmnnk', '..knnnnk.', '.knnmnnnk', '....ktk..', '....ktk..'],
  fish: ['....kkkk....', '..kkxxxxk.kk', '.kxxxxxxkkyk', 'kxxwkxxxxyyk', 'kxxxxxxxxkyk', '.kxxxxxxk.kk', '..kkkkkk....'],
  fish2: ['....kkkk....', '..kkuuuuk.kk', '.kuuuuuukkvk', 'kuuwkuuuuvvk', 'kuuuuuuuukvk', '.kuuuuuuk.kk', '..kkkkkk....'],
  wave: ['...kk.......kk..', '..kuuk.....kuuk.', '.kuuuuk...kuuuuk', 'kuuwuuukkkuuwuuk', 'kkkkkkkkkkkkkkkk'],
  bubble: ['.kkk.', 'kwuuk', 'kuuuk', '.kkk.'],
  moon: ['..kkkk..', '.kzzzzk.', 'kzzzkkk.', 'kzzk....', 'kzzk....', 'kzzzkkk.', '.kzzzzk.', '..kkkk..'],
  planet: ['...kkkkk...', '..kxxxxxk..', '.kxxyxxxxk.', 'kkkkkkkkkkk', 'keeeeeeeeek', 'kkkkkkkkkkk', '.kxxxxyxxk.', '..kxxxxxk..', '...kkkkk...'],
  rocket: ['...kk...', '..kwwk..', '.kwwwwk.', '.kwuuwk.', '.kwuuwk.', '.kwwwwk.', 'kkwwwwkk', 'kxkkkkxk', 'kx.kk.xk', '..kxxk..', '...yy...'],
  pineS: ['....k....', '...kwk...', '..kwwwk..', '...kswk..', '..kwswwk.', '.kwwswwwk', '..kswwwk.', '.kwwswwwk', '....ktk..', '....ktk..'],
  flake: ['..k..', 'kwkwk', '.kwk.', 'kwkwk', '..k..'],
  igloo: ['..kkkkk..', '.kwwwwwk.', 'kwwswwwwk', 'kwwkkkwwk', 'kwwkbkwwk', 'kkkkkkkkk'],
  volcano: ['.....kk.....', '....kyyk....', '...kyxxyk...', '..kbbxxbbk..', '.kbbbkkbbbk.', 'kbbbbbbbbbbk'],
  flame: ['..k..k..', '.kxk.kxk', '.kxxkxxk', 'kxxyxxyk', 'kxyyyyyk', '.kyyyyk.', '..kkkk..'],
  rock: ['..kkkk..', '.kbbbbk.', 'kbbsbbbk', 'kbbbbbbk', 'kkkkkkkk'],
  table: ['kkkkkkkkkkkk', 'kbbbbbbbbbbk', 'kbkkkkkbdbbk', 'kbkaakkbbbbk', 'kbkkkkkbbbbk', 'kbbbbbbbbbbk', 'kkkkkkkkkkkk'],
};

// versão com mais detalhe (luz e sombra) dos desenhos dos mundos: árvores, bichos do mar, espaço, gelo e vulcão
Object.assign(SPR, {
  tree: ['....kkkk....', '..kkllnnkk..', '.kllnnnnnnk.', 'klnnnnmnnnnk', 'knnnmnnnnlnk', 'knnnnnnmnnnk', 'kmnnnlnnnnmk', '.kmnnnnnmmk.', '..kkmmmmkk..', '....kBtk....', '....ktBk....', '...kttBBk...', '...kkkkkk...'],
  pine: ['.....k.....', '....klk....', '...klnnk...', '..klnnnnk..', '....knmk...', '..klnnnnnk.', '.klnnnmnnnk', '..kmnnnnmk.', '.klnnnnnnnk', 'klnnmnnmnnnk', '.kmnnmmnnmk.', '....kBtk...', '....kBtk...', '...kkkkkk..'],
  bush: ['....kkkk....kk.', '..kkllnnkkkllk.', '.klnnnnnnnnnnnk', 'knnnmnnnnlnnmnk', 'knmnnnnnnnnnnnk', 'kmnnnlnnnmnnnmk', '.kkmnnnnnnnmkk.', '...kkkkkkkkk...'],
  flower: ['..kk.kk..', '.kwwkwwk.', 'kwwwYwwwk', 'kwwYYYwwk', '.kwwYwwk.', '..kkkkk..', '...knk...', '..knnk.k.', '.knnkknk.', '..kknnk..', '....kk...'],
  cactus: ['.....kkk.....', '....kRRRk....', '....kkYkk....', '...klnnmk....', 'kk.klnnmk.kk.', 'knkklnnmkknk.', 'knnnlnnmnnnk.', 'kkknlnnmnkkk.', '..knlnnmnk...', '..knlnnmnk...', '..knlnnmnk...', '.kkkkkkkkkk..'],
  vaso: ['..k.kk.k.', '.knkknnk.', 'knnmnnmnk', '.knnnnnk.', '..kmnmk..', '.kxxxxxk.', '.kxyxxyk.', '..kxxxk..', '..kkkkk..'],
  fish: ['....kkkk......', '..kkxxxxkk.kk.', '.kxxxzzxxkykk.', 'kxxwkxzxxxyyyk', 'kxxxxxzxxxyyyk', '.kxxxxxxxkykk.', '..kkyyyykk.kk.', '....kkkk......'],
  fish2: ['....kkkk......', '..kkuuuukk.kk.', '.kuuuiiuukvkk.', 'kuuwkuiuuuvvvk', 'kuuuuuiuuuvvvk', '.kuuuuuuukvkk.', '..kkvvvvkk.kk.', '....kkkk......'],
  wave: ['....kkk......kkk...', '..kkiiikk..kkiiikk.', '.kiiuuuuikkiiuuuuik', 'kiuuuvvuuiiuuuvvuuk', 'kuuvvvjjvuuuvvvjjvk', 'kkkkkkkkkkkkkkkkkkk'],
  moon: ['..kkkkkk..', '.kCCCCCCk.', 'kCCsCCCCCk', 'kCsssCCCCk', 'kCCsCCCsCk', 'kCCCCCsssk', 'kCCCsCCsCk', 'kCCCCCCCCk', '.kCCCCCCk.', '..kkkkkk..'],
  planet: ['....kkkkk....', '..kkzzxxxkk..', '.kzzxxxyxxxk.', 'kzxxxyyxxxxxk', 'kkkkkkkkkkkkk', 'keeeeeeeeeeek', 'kkkkkkkkkkkkk', 'kxxxyyxxxxyxk', '.kxxxxxxyyxk.', '..kkxxxxxkk..', '....kkkkk....'],
  rocket: ['....k....', '...kwk...', '..kwwwk..', '..kwwwk..', '.kwwuuwk.', '.kwuuuwk.', '.kwwuuwk.', '.kwwwwwk.', 'kRkwwwkRk', 'kRRkkkRRk', '.kRkwkRk.', '..kkkkk..', '..kLYLk..', '...kYk...', '....k....'],
  star: ['...ke...', '...kek..', 'kkkkekkk', 'keeeeeek', '.keeeeek', '..keeek.', '.kek.ek.', '.k....k.'],
  pineS: ['.....k.....', '....kwk....', '...kwwwk...', '..kwwnwwk..', '...knnnk...', '..kwwwwwk..', '.kwwnnnwwk.', '..knnmnnk..', '.kwwwwwwwk.', 'kwwnnmnnwwk', '.knnmmmnnk.', '....kBk....', '....kBk....', '...kkkkk...'],
  flake: ['....w....', '.w..w..w.', '..w.w.w..', '...www...', 'wwwwiwwww', '...www...', '..w.w.w..', '.w..w..w.', '....w....'],
  igloo: ['....kkkkk....', '..kkwwwwwkk..', '.kwwswwwswwk.', 'kwwswwwwwswwk', 'kwwwwkkkwwwwk', 'kswwkbbbkwwsk', 'kwwwkbbbkwwwk', 'kkkkkbbbkkkkk'],
  volcano: ['...SSS.........', '..SSSSS..SS....', '...SSS..SSSS...', '.....kkkkk.....', '....kLYYYLk....', '...kHRLLLRHk...', '..kHHHRRRHHHk..', '..kHGHHHHHGHk..', '.kHHHLHHHLHHHk.', '.kHGHHLHHHHGHk.', 'kHHHHHHLHHHHHHk', 'kkkkkkkkkkkkkkk'],
  flame: ['....k....', '...kRk.k.', '..kRLkkRk', '.kRLLRRLk', '.kRLYLLLk', 'kRLLYYYLk', 'kRLYYYYLk', '.kRLYYLk.', '..kkkkk..'],
  rock: ['..kkkkk..', '.kGGSGGk.', 'kGGGGHGGk', 'kHGGGGGHk', 'kHHHGHHHk', 'kkkkkkkkk'],
});
/** SVG de um sprite (`px` = tamanho de cada quadradinho em unidades do viewBox; o tamanho final vem do CSS). */
export function sprite(name, cls = '') {
  const rows = SPR[name]; if (!rows) return '';
  const w = Math.max(...rows.map((r) => r.length)); const by = {};
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = r[x]; if (PAL[c]) (by[c] = by[c] || []).push(`M${x} ${y}h1v1h-1z`); } });
  const paths = Object.entries(by).map(([c, d]) => `<path fill="${PAL[c]}" d="${d.join('')}"/>`).join('');
  return `<svg class="mp-spr ${cls}" viewBox="0 0 ${w} ${rows.length}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${paths}</svg>`;
}
/** Enfeites de cada região: [sprite, lado, deslocamento 0..1 dentro da região]. */
export const DECOR = {
  vila: [['school', 'l', 0.2], ['lamp', 'l', 0.8]],
  rua: [['shop', 'r', 0.25], ['lamp', 'l', 0.5], ['amp', 'r', 0.8]],
  estudio: [['tape', 'l', 0.2], ['table', 'r', 0.5], ['amp', 'l', 0.8]],
  floresta: [['tree', 'l', 0.2], ['tree', 'r', 0.75], ['tree', 'l', 0.9]],
  neon: [['lamp', 'r', 0.2], ['shop', 'l', 0.45], ['star', 'r', 0.7]],
  palco: [['stage', 'l', 0.35], ['amp', 'r', 0.3], ['star', 'r', 0.7]],
};

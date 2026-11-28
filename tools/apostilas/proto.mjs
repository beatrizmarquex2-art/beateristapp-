import { groove, svgBateria } from './notas.mjs'; import { comContagem, semB } from './lib.mjs'; import { writeFileSync } from 'node:fs';
const e1 = groove({ hh: 'x.x.x.x.x.x.x.x.', sn: '....x.......x...', bd: 'x.......x.......' });
const e2 = groove({ hh: 'xxxxxxxxxxxxxxxx', sn: '....X.......X...', bd: 'x.....x...x.....' }, { passo: 1 });
const e3 = groove({ hh: 'x.x.x.x.x.x.x.x.', sn: '....x.......x...', bd: 'x.......x.......', cr: 'x...............' });
writeFileSync('/tmp/apo/proto.html', `<meta charset=utf-8><body style="background:#fff;padding:20px;width:700px">${comContagem(semB(svgBateria(e1, 640)), e1)}<hr>${comContagem(semB(svgBateria(e2, 640)), e2)}<hr>${comContagem(semB(svgBateria(e3, 640)), e3)}</body>`);

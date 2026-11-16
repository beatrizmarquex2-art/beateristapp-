// Peças de divulgação dos baralhos Cards do Robôterista Paul: capa da Hotmart (quadrada, até 5 MB), carrossel do Instagram (1080×1350),
// cenas de story/reel (1080×1920) e o reel em mp4. Uso: NODE_PATH=$(npm root -g) node scripts/cards-paul-pecas.mjs PASTA_DE_SAIDA [instrumentos|dicionario]
// Os cards são fotografados direto do cards.html (as mesmas cartas do PDF). A saída NÃO vai pro repositório.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { serve, ROOT } from '../tests/e2e/harness.mjs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const saida = process.argv[2]; if (!saida) { console.error('informe a pasta de saída'); process.exit(1); }
const decks = process.argv[3] ? [process.argv[3]] : ['instrumentos', 'dicionario'];
const TITULOS = { instrumentos: ['Pratos', 'Dó maior', 'Mi menor (Em)'], dicionario: ['síncope', 'clave de sol', 'tablatura'] };
const slug = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const { srv, url } = await serve(); const browser = await chromium.launch();
const tmp = path.join(ROOT, 'marketing/cards-paul/_out'); // a página das peças lê os cards daqui (pasta ignorada pelo git)
for (const deck of decks) {
  fs.mkdirSync(path.join(tmp, deck), { recursive: true }); const dir = path.join(saida, deck); fs.mkdirSync(dir, { recursive: true });
  // 1) fotografa as 3 cartas (transparente, 4x)
  const c1 = await browser.newContext({ deviceScaleFactor: 4, viewport: { width: 820, height: 1200 } }); const p1 = await c1.newPage();
  await p1.goto(`${url}/marketing/cards-paul/cards.html?deck=${deck}`); await p1.waitForFunction(() => window.__pronto, null, { timeout: 60000 });
  await p1.addStyleTag({ content: 'html,body,.pg{background:transparent!important}.card{border:0!important}' });
  for (const t of TITULOS[deck]) {
    const el = await p1.evaluateHandle((t) => [...document.querySelectorAll('.card')].find((c) => (c.querySelector('h3') || {}).textContent.trim().toLowerCase() === t.toLowerCase())?.querySelector('.in'), t);
    const e = el.asElement(); if (!e) throw new Error('carta não achada: ' + t);
    await e.screenshot({ path: path.join(tmp, deck, `card-${slug(t)}.png`), omitBackground: true });
  }
  await c1.close();
  // 2) as peças
  const c2 = await browser.newContext({ deviceScaleFactor: 1 }); const p2 = await c2.newPage(); p2.on('pageerror', (e) => console.error('ERRO', String(e)));
  const PECAS = { hotmart: [1500, 1500], s1: [1080, 1350], s2: [1080, 1350], s3: [1080, 1350], s4: [1080, 1350], s5: [1080, 1350], s6: [1080, 1350], r1: [1080, 1920], r2: [1080, 1920], r3: [1080, 1920], r4: [1080, 1920], r5: [1080, 1920] };
  const NOMES = { hotmart: `capa-hotmart-${deck}`, s1: `carrossel-1-${deck}`, s2: `carrossel-2-${deck}`, s3: `carrossel-3-${deck}`, s4: `carrossel-4-${deck}`, s5: `carrossel-5-${deck}`, s6: `carrossel-6-${deck}`, r1: `cena-1-${deck}`, r2: `cena-2-${deck}`, r3: `cena-3-${deck}`, r4: `cena-4-${deck}`, r5: `cena-5-${deck}` };
  for (const [k, [w, h]] of Object.entries(PECAS)) {
    await p2.setViewportSize({ width: w, height: h }); await p2.goto(`${url}/marketing/cards-paul/pecas.html?deck=${deck}&peca=${k}`); await p2.waitForFunction(() => window.__pronto, null, { timeout: 30000 });
    await p2.screenshot({ path: path.join(dir, `${NOMES[k]}.jpg`), type: 'jpeg', quality: 90 });
  }
  await c2.close();
  // 3) o reel: 5 cenas com zoom lento e transição, em cima de uma batida
  const wav = path.join(dir, '_batida.wav');
  const py = `import numpy as np, wave, sys
sr=44100; bpm=104; q=60/bpm; dur=16.5; n=int(sr*dur); y=np.zeros(n)
def add(t,s,v=1.0):
    i=int(t*sr); e=min(n,i+len(s)); y[i:e]+=s[:e-i]*v
t=np.arange(int(sr*0.30))/sr
kick=np.sin(2*np.pi*(150*np.exp(-t*18)+45)*t)*np.exp(-t*9)
rng=np.random.default_rng(3); nz=rng.uniform(-1,1,int(sr*0.2)); tn=np.arange(len(nz))/sr
snare=(nz*np.exp(-tn*22)*0.7+np.sin(2*np.pi*190*tn)*np.exp(-tn*30)*0.5)
th=np.arange(int(sr*0.05))/sr; hat=np.diff(rng.uniform(-1,1,len(th)+1))*np.exp(-th*90)*0.5
tb=np.arange(int(sr*q*0.9))/sr
def bass(f): return np.sin(2*np.pi*f*tb)*np.exp(-tb*3.2)*0.5
notas=[55,55,65.4,49]
k=0; tt=0.0
while tt<dur-1:
    b=int(round(tt/q))%4
    if b in (0,2): add(tt,kick,0.9)
    if b in (1,3): add(tt,snare,0.8)
    add(tt,hat,0.5); add(tt+q/2,hat,0.35)
    if b==0: add(tt,bass(notas[(int(tt/(q*4)))%4]),0.7)
    tt+=q
y=y/np.max(np.abs(y))*0.55
fade=int(sr*0.8); y[-fade:]*=np.linspace(1,0,fade)
w=wave.open(sys.argv[1],'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((y*32767).astype(np.int16).tobytes()); w.close()`;
  spawnSync('python3', ['-I', '-c', py, wav], { stdio: 'inherit' });
  const imgs = [1, 2, 3, 4, 5].map((i) => path.join(dir, `${NOMES['r' + i]}.jpg`)); const dur = 3.5; const tr = 0.4;
  const args = ['-y']; imgs.forEach((f) => args.push('-loop', '1', '-t', String(dur + tr), '-i', f)); args.push('-i', wav);
  const fil = imgs.map((_, i) => `[${i}:v]scale=1188:2112,zoompan=z='min(zoom+0.0007,1.09)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round((dur + tr) * 30)}:s=1080x1920:fps=30,format=yuv420p[v${i}]`);
  let last = 'v0'; let off = dur;
  for (let i = 1; i < imgs.length; i++) { fil.push(`[${last}][v${i}]xfade=transition=fade:duration=${tr}:offset=${(off).toFixed(2)}[x${i}]`); last = `x${i}`; off += dur; }
  args.push('-filter_complex', fil.join(';'), '-map', `[${last}]`, '-map', `${imgs.length}:a`, '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', path.join(dir, `reel-${deck}.mp4`));
  const r = spawnSync('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] }); if (r.status !== 0) console.error(String(r.stderr).slice(-600));
  fs.rmSync(wav, { force: true });
  console.log(deck, 'ok:', fs.readdirSync(dir).length, 'arquivos');
}
await browser.close(); srv.close();

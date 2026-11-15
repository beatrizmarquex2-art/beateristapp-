// PaulBox: grava um trecho da banda (vídeo em pé 720×1280 com o som que está tocando) pra postar ou baixar.
// O vídeo é desenhado num canvas próprio (não é a tela do app): logo da Beaterista em cima, os 10 Pauls no palco e o link embaixo.
export const LINK = 'jogos.beaterista.com.br';
const W = 720; const H = 1280;
// mp4 de verdade (H.264 + AAC, o que as redes aceitam) primeiro; sem ele, webm; o mp4 genérico fica por último (é o do iPhone)
const TIPOS = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1.42E01E', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
/** O aparelho consegue gravar? (canvas em vídeo + MediaRecorder) */
export const podeGravar = () => typeof MediaRecorder !== 'undefined' && !!HTMLCanvasElement.prototype.captureStream;
const carregar = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };

/**
 * @param o.ctx AudioContext do app · o.fonte nó de áudio da banda · o.tracks [{nome, cor}] · o.imgs <img> de cada Paul
 * @param o.estado () => [0..4] por instrumento · o.pulsos [ms do último pulso de cada um] · o.seg duração · o.onTick(segRestantes)
 * Devolve { canvas, fim: Promise<Blob|null>, cancelar() }.
 */
export function gravar(o) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  let selo = null; let nome = null; const logos = Promise.all([carregar('assets/logo-512.png').then((i) => { selo = i; }), carregar('assets/logo-nome.png').then((i) => { nome = i; })]);
  const LETRA = ['', 'A', 'B', 'C', 'D']; let raf = 0; let vivo = true;
  let t0 = performance.now(); // o relógio do vídeo recomeça quando os logos chegam (o 1º quadro já sai completo)
  function quadro() {
    if (!vivo) return; const agora = performance.now(); const p = Math.min(1, (agora - t0) / (o.seg * 1000)); const st = o.estado();
    // palco
    const g = c.createRadialGradient(W / 2, 0, 40, W / 2, 200, H); g.addColorStop(0, '#31408a'); g.addColorStop(0.45, '#162146'); g.addColorStop(1, '#0a0f26'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // logo: placa creme com o selo e o nome da escola
    c.fillStyle = '#fffaf0'; rr(c, 110, 54, 500, 132, 66); c.fill();
    if (selo) c.drawImage(selo, 122, 60, 120, 120);
    if (nome) c.drawImage(nome, 256, 80, 310, 310 * nome.height / nome.width);
    // título
    c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = '#fff7e6'; c.font = '400 124px "Anton","Arial Black",Impact,sans-serif'; c.textAlign = 'left';
    const wp = c.measureText('PAUL').width; const wb = c.measureText('BOX').width; const xt = (W - wp - wb - 6) / 2; c.fillText('PAUL', xt, 338);
    c.fillStyle = '#f2a91b'; c.fillText('BOX', xt + wp + 6, 338); c.textAlign = 'center';
    c.fillStyle = '#fff7e6'; c.font = '700 30px "Hanken Grotesk",system-ui,sans-serif'; c.fillText('a banda do Paul · qual é a sua?', W / 2, 392);
    // os 10 Pauls: 5 em cima, 5 embaixo
    const cw = 132; const ch = 190; const x0 = (W - cw * 5) / 2; const y0 = 470; const passo = 330;
    o.tracks.forEach((t, i) => {
      const x = x0 + (i % 5) * cw; const y = y0 + Math.floor(i / 5) * passo; const on = st[i] > 0; const cx = x + cw / 2;
      const k = on ? Math.max(0, 1 - (agora - (o.pulsos[i] || 0)) / 220) : 0;
      if (on) { // holofote da cor do instrumento
        const lg = c.createLinearGradient(0, y - 40, 0, y + ch); lg.addColorStop(0, t.cor); lg.addColorStop(1, 'rgba(0,0,0,0)');
        c.globalAlpha = 0.55 + 0.25 * k; c.fillStyle = lg; c.beginPath(); c.moveTo(cx - 22, y - 40); c.lineTo(cx + 22, y - 40); c.lineTo(cx + cw * 0.62, y + ch); c.lineTo(cx - cw * 0.62, y + ch); c.closePath(); c.fill();
        c.globalAlpha = 0.9; const fl = c.createRadialGradient(cx, y + ch - 6, 2, cx, y + ch - 6, cw * 0.55); fl.addColorStop(0, t.cor); fl.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = fl; c.fillRect(x - 10, y + ch - 40, cw + 20, 70);
      }
      const im = o.imgs[i];
      if (im && im.naturalWidth) {
        const s = Math.min((cw - 8) / im.naturalWidth, ch / im.naturalHeight) * (1 + 0.07 * k); const w = im.naturalWidth * s; const h = im.naturalHeight * s;
        c.globalAlpha = on ? 1 : 0.24; c.drawImage(im, cx - w / 2, y + ch - h - 8 * k, w, h);
      }
      c.globalAlpha = on ? 1 : 0.5; c.fillStyle = '#fff7e6'; c.font = '400 23px "Anton","Arial Black",Impact,sans-serif'; c.fillText(t.nome.toUpperCase(), cx, y + ch + 34);
      if (on) { c.globalAlpha = 1; c.fillStyle = t.cor; rr(c, cx - 44, y + ch + 44, 88, 30, 15); c.fill(); c.fillStyle = '#fff'; c.font = '800 19px "Hanken Grotesk",system-ui,sans-serif'; c.fillText(`ritmo ${LETRA[st[i]]}`, cx, y + ch + 66); }
      c.globalAlpha = 1;
    });
    // link
    c.fillStyle = '#fff7e6'; c.font = '700 30px "Hanken Grotesk",system-ui,sans-serif'; c.fillText('monte a sua banda de graça em', W / 2, 1124);
    c.fillStyle = '#c81e2d'; rr(c, 90, 1146, 540, 76, 38); c.fill();
    c.fillStyle = '#fff'; c.font = '400 44px "Anton","Arial Black",Impact,sans-serif'; c.fillText(LINK, W / 2, 1201);
    // barrinha do tempo
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(0, H - 10, W, 10); c.fillStyle = '#f2a91b'; c.fillRect(0, H - 10, W * p, 10);
    raf = requestAnimationFrame(quadro);
  }
  quadro();

  let rec = null; let dest = null; let tick = 0; let fimT = 0; let resolver = () => {}; const partes = [];
  const fim = new Promise((ok) => { resolver = ok; });
  const solta = () => { vivo = false; cancelAnimationFrame(raf); clearInterval(tick); clearTimeout(fimT); if (dest) { try { o.fonte.disconnect(dest); } catch { /* já saiu */ } dest.stream.getTracks().forEach((t) => t.stop()); dest = null; } };
  const inicia = () => { if (!vivo) { resolver(null); return; }
  try {
    dest = o.ctx.createMediaStreamDestination(); o.fonte.connect(dest);
    const video = cv.captureStream(30);
    const stream = new MediaStream([...video.getVideoTracks(), ...dest.stream.getAudioTracks()]);
    const tipo = TIPOS.find((t) => MediaRecorder.isTypeSupported(t)) || '';
    rec = new MediaRecorder(stream, { ...(tipo ? { mimeType: tipo } : {}), videoBitsPerSecond: 2500000, audioBitsPerSecond: 128000 });
    rec.ondataavailable = (e) => { if (e.data && e.data.size) partes.push(e.data); };
    rec.onstop = () => { const cancelou = !vivo; video.getTracks().forEach((t) => t.stop()); solta(); resolver(cancelou || !partes.length ? null : new Blob(partes, { type: (rec.mimeType || tipo || 'video/webm').split(';')[0] })); };
    rec.onerror = () => { solta(); resolver(null); };
    rec.start(500);
    let resta = o.seg; if (o.onTick) o.onTick(resta);
    tick = setInterval(() => { resta -= 1; if (o.onTick) o.onTick(Math.max(0, resta)); }, 1000);
    fimT = setTimeout(() => { try { rec.stop(); } catch { solta(); resolver(null); } }, o.seg * 1000);
  } catch (e) { solta(); resolver(null); } };
  Promise.race([logos, new Promise((ok) => setTimeout(ok, 1500))]).then(() => { t0 = performance.now(); inicia(); });
  return { canvas: cv, fim, cancelar() { if (!vivo) return; vivo = false; try { if (rec && rec.state !== 'inactive') rec.stop(); else { solta(); resolver(null); } } catch { solta(); resolver(null); } } };
}

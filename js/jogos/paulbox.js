// Paulbox: a banda do Paul. 10 Pauls num palco; cada toque liga um instrumento e troca o ritmo dele (A a D), no quinto toque ele sai.
// Tudo sintetizado no aparelho (sem amostras), no mesmo AudioContext do app, com saída própria (pausar e sair calam na hora).
// O desenho e os sons vieram prontos da Bea (página solta "paulbox"); aqui ele só foi encaixado na moldura dos jogos.
import { h } from '../util.js';
import { audio, isMuted } from '../audio.js';
import { getGame, setGame } from './base.js';
import { musicaPausa, musicaVolta } from './musica.js';
import { gravar, podeGravar, LINK } from './paulbox-gravar.js';
import { toast } from '../ui.js';

const IMG = 'assets/jogos/paulbox/';
export const TRACKS = [
  { id: 'bateria', nome: 'Bateria', cor: '#c81e2d', alt: 'Paul tocando bateria' },
  { id: 'baixo', nome: 'Baixo', cor: '#2a6fdb', alt: 'Paul encostado no amplificador do baixo' },
  { id: 'teclado', nome: 'Teclado', cor: '#d6409f', alt: 'Paul tocando teclado' },
  { id: 'guitarra', nome: 'Guitarra', cor: '#f2a91b', alt: 'Paul tocando guitarra' },
  { id: 'voz', nome: 'Voz', cor: '#7a3fd1', alt: 'Paul cantando no microfone' },
  { id: 'dj', nome: 'DJ', cor: '#12a4b8', alt: 'Paul na mesa de DJ' },
  { id: 'trompete', nome: 'Trompete', cor: '#d9a400', alt: 'Paul tocando trompete' },
  { id: 'pandeiro', nome: 'Pandeiro', cor: '#2e9e57', alt: 'Paul tocando pandeiro' },
  { id: 'violino', nome: 'Violino', cor: '#e0611a', alt: 'Paul tocando violino' },
  { id: 'metronomo', nome: 'Metrônomo', cor: '#8a5a2b', alt: 'Paul com o metrônomo' },
];
const LABEL = ['desligado', 'ritmo A', 'ritmo B', 'ritmo C', 'ritmo D'];
const N = TRACKS.length;
const BPM_MIN = 70; const BPM_MAX = 130;
const SEG = 20; // duração da gravação pra postar

export function mount(host) {
  const salvo = getGame('paulbox');
  let bpm = Number(salvo.bpm) >= BPM_MIN && Number(salvo.bpm) <= BPM_MAX ? Number(salvo.bpm) : 96;
  let gone = false; let parado = false; // parado = pausa da moldura
  const state = TRACKS.map(() => 0);
  const glow = h('div', { class: 'pbx-glow', 'aria-hidden': 'true' });
  const dots = [0, 1, 2, 3].map(() => h('i', {}));
  const els = TRACKS.map((t, i) => {
    const b = h('button', { type: 'button', class: 'pbx-slot', 'data-s': '0', 'data-id': t.id, 'aria-label': `${t.nome}: desligado`, onclick: () => { unlock(); setState(i, (state[i] + 1) % 5); } },
      h('span', { class: 'pbx-art' }, h('img', { src: `${IMG}${t.id}.webp`, alt: t.alt, draggable: 'false', decoding: 'async' }), h('span', { class: 'pbx-lvl', 'aria-hidden': 'true' }, h('b', {}), h('b', {}), h('b', {}), h('b', {}))),
      h('span', { class: 'pbx-tag' }, h('span', { class: 'pbx-name' }, t.nome), h('span', { class: 'pbx-chip' }, 'desligado')));
    b.style.setProperty('--ink', t.cor);
    return b;
  });
  const stage = h('section', { class: 'pbx-stage', 'aria-label': 'Banda do Paul' }, ...els);
  const hintEl = h('p', { class: 'pbx-hint', role: 'status', 'aria-live': 'polite' });
  const bpmV = h('span', {}, String(bpm));
  const sl = h('input', { type: 'range', min: String(BPM_MIN), max: String(BPM_MAX), value: String(bpm), 'aria-label': 'andamento', oninput: () => { bpm = Number(sl.value); bpmV.textContent = sl.value; mudouBpm(); }, onchange: () => setGame('paulbox', { bpm }) });
  const pulsos = TRACKS.map(() => 0); let grav = null; // gravação em andamento
  const btnRec = podeGravar() ? h('button', { type: 'button', class: 'pbx-act pbx-rec', 'aria-label': `gravar ${SEG} segundos pra postar`, onclick: () => (grav ? grav.cancelar() : comecaGravar()) }, `● gravar ${SEG}s`) : null;
  const act = (txt, fn, main) => h('button', { type: 'button', class: `pbx-act${main ? ' main' : ''}`, onclick: fn }, txt);
  const root = h('div', { class: 'pbx' }, glow,
    h('div', { class: 'pbx-head' },
      h('p', { class: 'pbx-sub' }, 'Toque num Paul pra ele entrar. Cada toque troca o ritmo (A a D); no quinto ele sai.'),
      h('img', { class: 'pbx-walker', src: `${IMG}chegou.webp`, alt: 'Paul chegando com a case da guitarra', draggable: 'false' })),
    h('div', { class: 'pbx-bar' },
      act('Banda base', () => { unlock(); for (let i = 0; i < N; i++) setState(i, i < 4 ? 1 : 0); }, true),
      act('Surpresa', () => { unlock(); let n = 0; for (let i = 0; i < N; i++) { const s = Math.random() < 0.5 ? 1 + Math.floor(Math.random() * 4) : 0; setState(i, s); if (s) n++; } if (!n) setState(0, 1); }),
      act('Silêncio', () => { for (let i = 0; i < N; i++) setState(i, 0); }),
      btnRec,
      h('label', { class: 'pbx-tempo' }, h('span', { class: 'pbx-beat', 'aria-hidden': 'true' }, ...dots), sl, bpmV, ' bpm')),
    stage, hintEl);
  host.replaceChildren(root);
  musicaPausa(); // a banda do Paul é a música: o fundo dos jogos fica quieto aqui

  function setState(i, s) {
    state[i] = s; const b = els[i]; b.dataset.s = String(s); if (timer) tocaTrilha(i);
    b.querySelector('.pbx-chip').textContent = LABEL[s];
    b.setAttribute('aria-label', `${TRACKS[i].nome}: ${LABEL[s]}`);
    hint();
  }
  function hint() {
    const n = state.filter(Boolean).length;
    hintEl.textContent = n === 0 ? 'Comece pela bateria ou pelo metrônomo: eles seguram o tempo pra todo mundo.'
      : n < 5 ? `${n} na banda. Toque de novo no mesmo Paul pra trocar o ritmo, ou chame outro.`
        : `Banda cheia com ${n} Pauls! Tente trocar só um deles pro ritmo D.`;
  }

  /* ---------- áudio (motor da página original, sem mudar os sons) ---------- */
  var ctx=null, master=null, saida=null, noiseBuf=null, timer=null, step=0, nextT=0, visT=[];
  var CH=[{r:48,t:[0,4,7]},{r:45,t:[0,3,7]},{r:41,t:[0,4,7]},{r:43,t:[0,4,7]}]; // C Am F G
  var PENT=[0,2,4,7,9];
  function mf(m){return 440*Math.pow(2,(m-69)/12);}
  function secs(){return 60/bpm/4;}

  function ligaSaida() { if (master) master.gain.value = isMuted() || parado ? 0 : 0.55; }
  function unlock() {
    if (gone) return;
    if (!ctx) {
      try { ctx = audio(); } catch (e) { ctx = null; } if (!ctx) return;
      var comp = ctx.createDynamicsCompressor(); master = ctx.createGain(); ligaSaida();
      master.connect(comp); comp.connect(ctx.destination); saida = comp;
      var len = ctx.sampleRate; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0); for (var k = 0; k < len; k++) d[k] = Math.random() * 2 - 1;
    } else audio(); // destrava de novo depois de tela bloqueada (iPhone)
    if (!timer && !parado) { step = 0; nextT = ctx.currentTime + 0.08; T0 = nextT; timer = setInterval(sched, 25); for (var z = 0; z < N; z++) tocaTrilha(z); }
  }

  /* ---------- trechos prontos (o jeito do Incredibox/Sprunki): cada Paul + ritmo é desenhado UMA vez num trecho de 4 compassos e depois só repete.
     Antes, com os 10 Pauls ligados, o app criava centenas de sons novos por segundo ao vivo e o celular travava. Agora são no máximo 10 trechos tocando.
     Se o aparelho não conseguir preparar o trecho, aquele Paul toca ao vivo como antes (aoVivo). ---------- */
  var T0 = 0, trechos = {}, tocando = [], aoVivo = [], bpmT = null;
  function fazTrecho(i, st) {
    var chave = i + '_' + st + '_' + bpm; if (trechos[chave]) return trechos[chave];
    var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!OC || !ctx) return (trechos[chave] = Promise.resolve(null));
    var sc = secs(), sr = ctx.sampleRate, volta = Math.round(64 * sc * sr), total = volta + Math.round(2.5 * sr), real = ctx, realM = master, off;
    try { off = new OC(1, total, sr); } catch (e) { return (trechos[chave] = Promise.resolve(null)); }
    try { ctx = off; master = off.createGain(); master.connect(off.destination); for (var k = 0; k < 64; k++) P[TRACKS[i].id][st - 1](k, 0.02 + k * sc, Math.floor(k / 16) % 4); }
    catch (e) { ctx = real; master = realM; return (trechos[chave] = Promise.resolve(null)); }
    ctx = real; master = realM;
    var pr = new Promise(function (ok) { var feito = false, fim = function (b) { if (feito) return; feito = true; ok(b || null); };
      try { off.oncomplete = function (ev) { fim(ev.renderedBuffer); }; var r = off.startRendering(); if (r && r.then) r.then(fim, function () { fim(null); }); } catch (e) { fim(null); } })
      .then(function (buf) { if (!buf) return null; // a sobra do fim (nota que ainda está soando) entra no começo, pra emenda não dar estalo
        var a = buf.getChannelData(0), o = real.createBuffer(1, volta, sr), d = o.getChannelData(0), ini = Math.round(0.02 * sr), x;
        for (x = 0; x < volta; x++) d[x] = a[x + ini] || 0; for (x = 0; x + ini + volta < a.length && x < volta; x++) d[x] += a[x + ini + volta]; return o; });
    return (trechos[chave] = pr);
  }
  function calaTrilha(i) { var c = tocando[i]; tocando[i] = null; if (!c || !ctx) return; try { c.g.gain.setTargetAtTime(0, ctx.currentTime, 0.015); c.s.stop(ctx.currentTime + 0.1); } catch (e) { /* já parou */ } }
  function calaTudo() { for (var i = 0; i < N; i++) { calaTrilha(i); aoVivo[i] = false; } }
  function tocaTrilha(i) {
    if (!ctx || gone) return; var st = state[i], b0 = bpm; calaTrilha(i); aoVivo[i] = false; if (!st) return;
    fazTrecho(i, st).then(function (buf) {
      if (gone || !timer || state[i] !== st || bpm !== b0 || tocando[i]) return;
      if (!buf) { aoVivo[i] = true; return; }
      var s = ctx.createBufferSource(), g = ctx.createGain(), L = buf.duration, quando = ctx.currentTime + 0.04, pos = (((quando - T0) % L) + L) % L;
      s.buffer = buf; s.loop = true; g.gain.setValueAtTime(0, quando); g.gain.linearRampToValueAtTime(1, quando + 0.02); s.connect(g); g.connect(master); s.start(quando, pos); tocando[i] = { s: s, g: g };
    });
  }
  function mudouBpm() { clearTimeout(bpmT); bpmT = setTimeout(function () { trechos = {}; if (!timer || gone) return; calaTudo(); step = 0; nextT = ctx.currentTime + 0.08; T0 = nextT; for (var i = 0; i < N; i++) tocaTrilha(i); }, 180); }
  function env(g,t,a,d,peak){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);}
  function noise(t,dur,freq,peak,type,q){
    var s=ctx.createBufferSource(); s.buffer=noiseBuf; var f=ctx.createBiquadFilter(); f.type=type||'highpass'; f.frequency.value=freq; if(q)f.Q.value=q;
    var g=ctx.createGain(); env(g,t,.002,dur,peak); s.connect(f);f.connect(g);g.connect(master); s.start(t); s.stop(t+dur+.05);
  }
  function kick(t,v){v=v||1;var o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(160,t);o.frequency.exponentialRampToValueAtTime(42,t+.14);env(g,t,.003,.22,v);o.connect(g);g.connect(master);o.start(t);o.stop(t+.3);}
  function snare(t,v){v=v||1;noise(t,.16,1800,.5*v);var o=ctx.createOscillator(),g=ctx.createGain();o.type='triangle';o.frequency.value=190;env(g,t,.002,.09,.38*v);o.connect(g);g.connect(master);o.start(t);o.stop(t+.15);}
  function clap(t){noise(t,.05,1500,.45,'bandpass',1.2);noise(t+.018,.12,1500,.4,'bandpass',1.2);}
  function hat(t,open,v){v=v||1;noise(t,open?.28:.05,7000,(open?.2:.16)*v);}
  function thump(t,v){v=v||1;var o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(90,t+.08);env(g,t,.002,.12,.5*v);o.connect(g);g.connect(master);o.start(t);o.stop(t+.16);}
  function slap(t){noise(t,.08,2500,.34,'bandpass',.9);}
  function jingle(t,v){noise(t,.06,8000,.16*(v||1));}
  function click(t,f,v,dur){var o=ctx.createOscillator(),g=ctx.createGain();o.type='triangle';o.frequency.value=f;env(g,t,.001,dur||.05,v||.3);o.connect(g);g.connect(master);o.start(t);o.stop(t+(dur||.05)+.03);}

  // o = {dist, vib, att, pluck, brass, wob}
  function tone(type,f,t,dur,peak,lp,o){
    o=o||{};
    var osc=ctx.createOscillator(),g=ctx.createGain(),fl=ctx.createBiquadFilter(); osc.type=type;osc.frequency.value=f;fl.type='lowpass';fl.Q.value=o.q||1;
    if(o.brass){fl.frequency.setValueAtTime(lp*.3,t);fl.frequency.exponentialRampToValueAtTime(lp,t+.09);} else fl.frequency.value=lp;
    var att=o.att||.01;
    if(o.pluck){g.gain.setValueAtTime(peak,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);}
    else{g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+att);g.gain.setValueAtTime(peak,t+Math.max(att+.01,dur-.08));g.gain.linearRampToValueAtTime(.0001,t+dur);}
    if(o.vib){var l=ctx.createOscillator(),lg=ctx.createGain();l.frequency.value=5.5;lg.gain.value=16;l.connect(lg);lg.connect(osc.detune);l.start(t);l.stop(t+dur+.05);}
    if(o.wob){var l2=ctx.createOscillator(),lg2=ctx.createGain();l2.frequency.value=o.wob;lg2.gain.value=lp*.8;l2.connect(lg2);lg2.connect(fl.frequency);l2.start(t);l2.stop(t+dur+.05);}
    osc.connect(fl);
    if(o.dist){var w=ctx.createWaveShaper(),c=new Float32Array(256);for(var i=0;i<256;i++){var x=i/128-1;c[i]=Math.tanh(x*(o.dist>1?o.dist:4));}w.curve=c;fl.connect(w);w.connect(g);}else fl.connect(g);
    g.connect(master);osc.start(t);osc.stop(t+dur+.05);
  }
  var VOW={aah:[800,1150],ooh:[350,750],eh:[600,1700],uh:[500,1000]};
  function voice(f,t,dur,peak,vow,att){
    var fm=VOW[vow],g=ctx.createGain(); att=att||.05;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+att);g.gain.setValueAtTime(peak,t+Math.max(att+.01,dur-.1));g.gain.linearRampToValueAtTime(.0001,t+dur);
    [0,7].forEach(function(dt){
      var o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=dt;
      fm.forEach(function(ff){var b=ctx.createBiquadFilter();b.type='bandpass';b.frequency.value=ff;b.Q.value=5;o.connect(b);b.connect(g);});
      o.start(t);o.stop(t+dur+.05);
    });
    g.connect(master);
  }

  /* guitarra: corda dedilhada (Karplus-Strong) */
  var ksC={};
  function ksBuf(f,dur,decay){
    var key=f.toFixed(1)+'_'+dur+'_'+decay; if(ksC[key])return ksC[key];
    var sr=ctx.sampleRate,len=Math.floor(sr*dur),p=Math.max(2,Math.round(sr/f-.5)),b=ctx.createBuffer(1,len,sr),d=b.getChannelData(0),i,m=0;
    var prev=0; for(i=0;i<p+1;i++){var x=Math.random()*2-1; d[i]=.6*x+.4*prev; prev=x;}
    for(i=p+1;i<len;i++)d[i]=decay*.5*(d[i-p]+d[i-p-1]);
    for(i=0;i<len;i++)m=Math.max(m,Math.abs(d[i])); for(i=0;i<len;i++)d[i]/=m||1;
    ksC[key]=b; return b;
  }
  function pluck(f,t,dur,peak,o){
    o=o||{}; var src=ctx.createBufferSource(); src.buffer=ksBuf(f,dur+.08,o.decay||.996);
    var fl=ctx.createBiquadFilter(); fl.type='lowpass'; fl.frequency.value=o.lp||3500;
    var g=ctx.createGain(); g.gain.setValueAtTime(peak,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    src.connect(fl);
    if(o.dist){var w=ctx.createWaveShaper(),c=new Float32Array(512);for(var i=0;i<512;i++){var x=i/256-1;c[i]=Math.tanh(x*o.dist);}w.curve=c;fl.connect(w);w.connect(g);}else fl.connect(g);
    g.connect(master); src.start(t); src.stop(t+dur+.1);
  }
  /* voz: fonte glotal + 3 formantes que deslizam de uma vogal pra outra */
  var FM={aah:[800,1150,2800],ooh:[320,800,2250],eh:[530,1840,2480],ee:[270,2290,3010],uh:[600,1100,2400],la:[360,1300,2600]};
  function voice2(f,t,dur,peak,v1,v2,o){
    o=o||{}; var att=o.att||.04, g=ctx.createGain(), lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=3800;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak*3,t+att);g.gain.setValueAtTime(peak*3,t+Math.max(att+.01,dur-.09));g.gain.linearRampToValueAtTime(.0001,t+dur);
    var A=FM[v1],Bf=FM[v2],gains=[1,.55,.3],qs=[7,9,11];
    var oscs=[-7,7].map(function(dt){var o2=ctx.createOscillator();o2.type='sawtooth';o2.detune.value=dt;
      o2.frequency.setValueAtTime(f*(o.scoop?.94:.985),t);o2.frequency.exponentialRampToValueAtTime(f,t+.07);
      var l=ctx.createOscillator(),lg=ctx.createGain();l.frequency.value=5.3;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(16,t+Math.min(dur,.35));l.connect(lg);lg.connect(o2.detune);l.start(t);l.stop(t+dur+.05);
      o2.connect(lp);o2.start(t);o2.stop(t+dur+.05);return o2;});
    for(var k=0;k<3;k++){
      var bp=ctx.createBiquadFilter(),gk=ctx.createGain(); bp.type='bandpass'; bp.Q.value=qs[k]; gk.gain.value=gains[k];
      bp.frequency.setValueAtTime(A[k],t); bp.frequency.setValueAtTime(A[k],t+dur*.4); bp.frequency.linearRampToValueAtTime(Bf[k],t+dur*.85);
      lp.connect(bp); bp.connect(gk); gk.connect(g);
    }
    var br=ctx.createBufferSource(); br.buffer=noiseBuf; var bf=ctx.createBiquadFilter(); bf.type='bandpass'; bf.frequency.value=A[1]; bf.Q.value=3; var bg=ctx.createGain(); bg.gain.value=peak*.25;
    br.connect(bf);bf.connect(bg);bg.connect(g); br.start(t); br.stop(t+dur+.05);
    g.connect(master);
  }
  function babyScratch(t,up){
    var o=ctx.createOscillator(),g=ctx.createGain(),bp=ctx.createBiquadFilter(); o.type='sawtooth'; bp.type='bandpass'; bp.Q.value=1.2; bp.frequency.value=1800;
    var a=up?260:760,b=up?760:260; o.frequency.setValueAtTime(a,t); o.frequency.exponentialRampToValueAtTime(b,t+.09);
    g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(.28,t+.015); g.gain.exponentialRampToValueAtTime(.0001,t+.1);
    o.connect(bp);bp.connect(g);g.connect(master);o.start(t);o.stop(t+.12); noise(t,.08,2500,.12,'bandpass',2);
  }

  /* power chord pesado: 3 notas x 2 serras desafinadas -> pré-amp saturado -> caixa */
  var HG=null;
  function pcChord(r,t,dur,peak,lp){
    if(!HG){HG=new Float32Array(1024);for(var i=0;i<1024;i++){var x=i/512-1;HG[i]=Math.tanh(x*30+.35)-Math.tanh(.35);}}
    var bus=ctx.createGain();
    [0,7,12].forEach(function(n,k){[-9,9].forEach(function(dt){
      var o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=mf(r+n);o.detune.value=dt;
      var gk=ctx.createGain();gk.gain.value=k==0?.5:.35;o.connect(gk);gk.connect(bus);o.start(t);o.stop(t+dur+.1);});});
    var hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=100;
    var ws=ctx.createWaveShaper();ws.curve=HG;ws.oversample='4x';
    var pk=ctx.createBiquadFilter();pk.type='peaking';pk.frequency.value=1400;pk.gain.value=5;pk.Q.value=.8;
    var cab=ctx.createBiquadFilter();cab.type='lowpass';cab.frequency.value=lp||3200;cab.Q.value=.9;
    var g=ctx.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.004);g.gain.setValueAtTime(peak,t+Math.max(.01,dur-.04));g.gain.linearRampToValueAtTime(.0001,t+dur);
    bus.connect(hp);hp.connect(ws);ws.connect(pk);pk.connect(cab);cab.connect(g);g.connect(master);
    noise(t,.03,2500,.1,'bandpass',1);
  }
  /* DJ */
  function fScratch(t,up){
    var o=ctx.createOscillator(),g=ctx.createGain(),bp=ctx.createBiquadFilter();o.type='sawtooth';bp.type='bandpass';bp.Q.value=3;
    var a=up?170:430,b=up?430:170,fa=up?500:1800,fb=up?1800:500;
    o.frequency.setValueAtTime(a,t);o.frequency.exponentialRampToValueAtTime(b,t+.1);
    bp.frequency.setValueAtTime(fa,t);bp.frequency.exponentialRampToValueAtTime(fb,t+.1);
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.42,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+.12);
    o.connect(bp);bp.connect(g);g.connect(master);o.start(t);o.stop(t+.14);noise(t,.09,3000,.1,'bandpass',2);
  }
  function airhorn(t,dur){
    var g=ctx.createGain(),fl=ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=3600;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.13,t+.01);g.gain.setValueAtTime(.13,t+Math.max(.02,dur-.05));g.gain.linearRampToValueAtTime(.0001,t+dur);
    [698,880,1047].forEach(function(f){[-12,12].forEach(function(dt){var o=ctx.createOscillator();o.type='sawtooth';o.detune.value=dt;
      o.frequency.setValueAtTime(f*1.09,t);o.frequency.exponentialRampToValueAtTime(f,t+.06);o.connect(fl);o.start(t);o.stop(t+dur+.05);});});
    fl.connect(g);g.connect(master);
  }
  function impact(t){
    var o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(95,t);o.frequency.exponentialRampToValueAtTime(30,t+.7);
    g.gain.setValueAtTime(.9,t);g.gain.exponentialRampToValueAtTime(.0001,t+.8);o.connect(g);g.connect(master);o.start(t);o.stop(t+.9);
    noise(t,.9,3000,.3);
  }
  function whoosh(t,dur){
    var s2=ctx.createBufferSource();s2.buffer=noiseBuf;var f=ctx.createBiquadFilter();f.type='bandpass';f.Q.value=2;
    f.frequency.setValueAtTime(300,t);f.frequency.exponentialRampToValueAtTime(7000,t+dur);
    var g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.4,t+dur*.95);g.gain.linearRampToValueAtTime(.0001,t+dur);
    s2.connect(f);f.connect(g);g.connect(master);s2.start(t);s2.stop(t+dur+.05);riser(t,dur);
  }
  function scratch(t){
    var s=ctx.createBufferSource(); s.buffer=noiseBuf; var f=ctx.createBiquadFilter(); f.type='bandpass'; f.Q.value=4;
    f.frequency.setValueAtTime(500,t);f.frequency.exponentialRampToValueAtTime(3200,t+.11);f.frequency.exponentialRampToValueAtTime(500,t+.24);
    var g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.34,t+.04);g.gain.exponentialRampToValueAtTime(.0001,t+.26);
    s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+.3);
  }
  function riser(t,dur){
    var o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(180,t);o.frequency.exponentialRampToValueAtTime(1800,t+dur);
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.12,t+dur*.9);g.gain.linearRampToValueAtTime(.0001,t+dur);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.05);
  }
  function has(a,q){return a.indexOf(q)>-1;}

  var P={
    bateria:[
      function(s,t,b){var q=s%16; if(q==0||q==8)kick(t); if(q==4||q==12)snare(t); if(q%2==0)hat(t);},
      function(s,t,b){var q=s%16; if(has([0,3,8,10],q))kick(t); if(q==4||q==12)snare(t); hat(t,q==14); if(b==3&&q>=12&&q%2==0)snare(t);},
      function(s,t,b){var q=s%16; if(q%4==0)kick(t); if(q==4||q==12)clap(t); if(q%4==2)hat(t,true,.8);},
      function(s,t,b){var q=s%16; if(has([0,7,10],q))kick(t); if(q==8)snare(t); if(has([3,11,14],q))snare(t,.25); hat(t,false,q%4==0?1:.5);}
    ],
    baixo:[
      function(s,t,b){var q=s%16,r=CH[b].r-12; if(has([0,6,8,14],q))tone('sawtooth',mf(q==14?r+12:r),t,.22,.3,420);},
      function(s,t,b){var q=s%16,r=CH[b].r-12,sq=[0,0,12,0,7,0,12,7]; if(q%2==0)tone('sawtooth',mf(r+sq[q/2]),t,.17,.27,520);},
      function(s,t,b){var q=s%16,r=CH[b].r-12; if(has([0,3,6,10,11,14],q))tone('sawtooth',mf(r+(q==6||q==14?7:0)),t,.13,.28,650);},
      function(s,t,b){var q=s%16,r=CH[b].r-12; if(q==0)tone('triangle',mf(r),t,1.3,.5,500); if(q==8)tone('triangle',mf(r+7),t,.7,.45,500);}
    ],
    teclado:[
      function(s,t,b){var q=s%16,c=CH[b]; if(q==0||q==10)c.t.forEach(function(n){tone('triangle',mf(c.r+12+n),t,q==0?.9:.3,.11,2400);});},
      function(s,t,b){var q=s%16,c=CH[b]; if(q%2==0){var n=c.t[(q/2)%3]+(((q/2)%4==3)?12:0);tone('triangle',mf(c.r+24+n),t,.2,.18,3200);}},
      function(s,t,b){var q=s%16,c=CH[b]; if(q%4==2)c.t.forEach(function(n){tone('square',mf(c.r+12+n),t,.12,.045,1800);});},
      function(s,t,b){var q=s%16,c=CH[b]; if(has([0,3,6,8,11,14],q))tone('sine',mf(c.r+36+c.t[q%3]),t,.5,.14,6000,{pluck:1});}
    ],
    guitarra:[
      function(s,t,b){var q=s%16,c=CH[b],h={0:.4,3:.14,6:.14,8:.3,11:.14,14:.14}; if(h[q])pcChord(c.r,t,h[q],.17,3200);},
      function(s,t,b){var q=s%16,c=CH[b]; if(q%4==0)pcChord(c.r,t,.52,.15,3600);},
      function(s,t,b){var q=s%16,c=CH[b]; if(q%2==0)pcChord(c.r,t,.085,q%8==0?.22:.17,1500);},
      function(s,t,b){var q=s%16; if(q%2==0)tone('sawtooth',mf(72+PENT[(q/2+b*3)%5]),t,.2,.12,2600,{dist:10,vib:1});}
    ],
    voz:[
      function(s,t,b){var q=s%16,c=CH[b]; if(q==0)c.t.forEach(function(n){voice2(mf(c.r+12+n),t,1.7,.05,'aah','ooh',{att:.18});});},
      function(s,t,b){var q=s%16,c=CH[b]; if(q==4||q==12){noise(t,.07,3200,.16,'bandpass',1.5);voice2(mf(c.r+19),t+.03,.2,.11,'eh','ee',{att:.01});}},
      function(s,t,b){var q=s%16; if(q%4==0)voice2(mf(60+PENT[(q/4+b*2)%5]),t,.4,.1,'la','aah',{att:.03});},
      function(s,t,b){var q=s%16,c=CH[b]; if(q%4==2)voice2(mf(c.r+7),t,.15,.12,'uh','uh',{att:.01,scoop:1});}
    ],
    dj:[
      function(s,t,b){var q=s%16; if(has([0,2,3,6,8,10,11,14],q))fScratch(t,q%4!=3);},
      function(s,t,b){var q=s%16,h={0:.3,3:.1,6:.1,10:.1}; if(h[q])airhorn(t,h[q]);},
      function(s,t,b){var q=s%16; if(b==3&&q==0)whoosh(t,16*secs()); if(b==0&&q==0)impact(t);},
      function(s,t,b){var q=s%16,c=CH[b]; if(q==0||q==8){var d=8*secs()*.92; tone('sawtooth',mf(c.r-12),t,d,.3,800,{wob:bpm/60*2,q:9}); tone('sine',mf(c.r-12),t,d,.3,200);}}
    ],
    trompete:[
      function(s,t,b){var q=s%16,c=CH[b]; if(q==0)tone('sawtooth',mf(c.r+19),t,.5,.11,2800,{brass:1,vib:1}); if(q==6)tone('sawtooth',mf(c.r+16),t,.2,.11,2800,{brass:1});},
      function(s,t,b){var q=s%16,c=CH[b]; if(q==0||q==2||q==4)tone('sawtooth',mf(c.r+24+c.t[q/2]),t,.18,.11,3000,{brass:1}); if(q==6)tone('sawtooth',mf(c.r+36),t,.5,.11,3000,{brass:1,vib:1});},
      function(s,t,b){var q=s%16,c=CH[b]; if(q==0)tone('sawtooth',mf(c.r+19),t,1.6,.09,2400,{brass:1,vib:1,att:.4});},
      function(s,t,b){var q=s%16,c=CH[b]; if(has([3,6,10,11],q))tone('sawtooth',mf(c.r+24),t,.1,.13,3000,{brass:1});}
    ],
    pandeiro:[
      function(s,t,b){var q=s%16; if(q==0||q==8)thump(t); if(q==4||q==12)slap(t); if(q%2==1)jingle(t,.5);},
      function(s,t,b){var q=s%16; if(has([0,3,8,11],q))thump(t); if(q==5||q==13)slap(t); jingle(t,q%4==2?.6:.35);},
      function(s,t,b){var q=s%16; if(q==0)thump(t); noise(t,.05,6000,q%2==0?.2:.1);},
      function(s,t,b){var q=s%16; if(q==0)thump(t); if(b==3||q%8>=6)jingle(t,.8); else if(q%4==2)jingle(t,.6);}
    ],
    violino:[
      function(s,t,b){var q=s%16,c=CH[b]; if(q==0)tone('sawtooth',mf(c.r+12+c.t[1]),t,1.8*secs()*8/1.8,.08,3500,{vib:1,att:.18});},
      function(s,t,b){var q=s%16,c=CH[b]; if(q%2==0)tone('sawtooth',mf(c.r+24+c.t[(q/2)%3]),t,.12,.08,3800);},
      function(s,t,b){var q=s%16,c=CH[b]; if(q%4==0)tone('sawtooth',mf(c.r+24+c.t[(q/4)%3]),t,.5,.08,3500,{vib:1,att:.08});},
      function(s,t,b){var q=s%16; if(has([0,2,3,6,8,10,11,14],q))tone('triangle',mf(72+PENT[(q+b)%5]),t,.14,.2,4500,{pluck:1});}
    ],
    metronomo:[
      function(s,t,b){var q=s%16; if(q%4==0)click(t,q==0?1900:1400,.32);},
      function(s,t,b){var q=s%16; if(q%2==0)click(t,q%4==0?1300:900,.3);},
      function(s,t,b){var q=s%16; click(t,q%4==0?(q==0?1900:1400):1000,q%4==0?.3:.12);},
      function(s,t,b){var q=s%16; if(has([0,3,6,10,12],q))click(t,2400,.3,.09);}
    ]
  };

  function sched() {
    if (!ctx || gone) return;
    if (nextT < ctx.currentTime - 0.2) { var k0 = Math.ceil((ctx.currentTime + 0.08 - T0) / secs()); nextT = T0 + k0 * secs(); step = ((k0 % 64) + 64) % 64; } // o app ficou em segundo plano: retoma no mesmo compasso dos trechos, sem despejar o atraso
    var sc = secs();
    while (nextT < ctx.currentTime + 0.14) {
      var bar = Math.floor(step / 16) % 4;
      for (var i = 0; i < N; i++) { if (state[i] && aoVivo[i]) { P[TRACKS[i].id][state[i] - 1](step, nextT, bar); } } // só quem não conseguiu virar trecho pronto toca ao vivo
      (function (st, when) { visT.push(setTimeout(function () { visT.shift(); visual(st); }, Math.max(0, (when - ctx.currentTime) * 1000))); })(step, nextT);
      nextT += sc; step = (step + 1) % 64;
    }
  }
  function visual(st) {
    if (gone || parado) return;
    var q = st % 16;
    if (q % 4 == 0) dots.forEach(function (d, k) { d.classList.toggle('on', k === q / 4); });
    for (var i = 0; i < N; i++) {
      if (!state[i]) continue;
      var id = TRACKS[i].id, fast = (id === 'bateria' || id === 'pandeiro' || id === 'metronomo');
      if (fast ? (q % 4 == 0) : (q == 0 || q == 8)) pulse(i);
    }
  }
  function pulse(i) {
    pulsos[i] = performance.now();
    glow.style.setProperty('--g', TRACKS[i].cor); glow.classList.add('on'); setTimeout(function () { glow.classList.remove('on'); }, 60);
    var b = els[i]; b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit');
    var a = b.querySelector('.pbx-art'), n = document.createElement('span'); n.className = 'pbx-note'; n.textContent = Math.random() < 0.5 ? '♪' : '♫';
    n.style.left = (15 + Math.random() * 65) + '%'; n.style.bottom = '14%'; a.appendChild(n); setTimeout(function () { n.remove(); }, 1100);
  }
  function para() { calaTudo(); clearInterval(timer); timer = null; visT.forEach(clearTimeout); visT = []; dots.forEach(function (d) { d.classList.remove('on'); }); }
  var onMute = function () { ligaSaida(); }; window.addEventListener('bt-mute', onMute);
  hint();
  window.__paulbox = { get trechos() { return tocando.filter(Boolean).length; }, get aoVivo() { return aoVivo.filter(Boolean).length; }, get state() { return state.slice(); }, get tocando() { return !!timer; }, get bpm() { return bpm; } }; // só pra teste

  /* ---------- gravar 20 s pra postar ou baixar ---------- */
  const pausar = () => { parado = true; para(); ligaSaida(); };
  const voltar = () => { parado = false; ligaSaida(); musicaPausa(); if (state.some(Boolean)) unlock(); };
  let fimEl = null; let urlVideo = '';
  function fechaFim() { if (fimEl) { fimEl.remove(); fimEl = null; } if (urlVideo) { URL.revokeObjectURL(urlVideo); urlVideo = ''; } }
  function comecaGravar() {
    if (gone || grav) return; unlock(); if (!ctx || !saida) { toast('não deu pra ligar o som neste aparelho'); return; }
    if (!state.some(Boolean)) for (let i = 0; i < 4; i++) setState(i, 1); // palco vazio: entra a banda base
    const seg = Number(window.__pbxSeg) > 0 ? Number(window.__pbxSeg) : SEG; // (__pbxSeg: só pra teste)
    const g = gravar({ ctx, fonte: saida, tracks: TRACKS, imgs: els.map((b) => b.querySelector('img')), estado: () => state, pulsos, seg, onTick: (r) => { btnRec.textContent = `■ gravando ${r}s`; } });
    grav = g; g.canvas.className = 'pbx-rec-cv'; g.canvas.setAttribute('aria-hidden', 'true'); root.append(g.canvas); btnRec.classList.add('on'); root.classList.add('gravando');
    hintEl.textContent = 'gravando! vai tocando nos Pauls: tudo o que você mudar entra no vídeo.';
    g.fim.then((blob) => {
      grav = null; g.canvas.remove(); if (gone) return; btnRec.classList.remove('on'); root.classList.remove('gravando'); btnRec.textContent = `● gravar ${SEG}s`; hint();
      if (!blob) return; mostraFim(blob);
    });
  }
  function mostraFim(blob) {
    fechaFim(); pausar(); const ext = /mp4/.test(blob.type) ? 'mp4' : 'webm'; const arq = new File([blob], `paulbox-beaterista.${ext}`, { type: blob.type });
    urlVideo = URL.createObjectURL(blob); window.__paulbox.video = blob;
    const texto = `montei minha banda no PaulBox 🎶 faça a sua: https://${LINK}`;
    let pode = false; try { pode = !!(navigator.canShare && navigator.canShare({ files: [arq] })); } catch { pode = false; }
    const sair = () => { fechaFim(); voltar(); };
    fimEl = h('div', { class: 'pbx-fim', role: 'dialog', 'aria-label': 'seu vídeo do PaulBox' },
      h('b', { class: 'pbx-fim-t' }, 'seu vídeo ficou pronto!'),
      h('video', { class: 'pbx-fim-v', src: urlVideo, controls: true, playsinline: true, loop: true, preload: 'auto' }),
      h('div', { class: 'pbx-fim-b' },
        pode ? h('button', { type: 'button', class: 'pbx-act main', onclick: async () => { try { await navigator.share({ files: [arq], text: texto }); } catch (e) { if (!e || e.name !== 'AbortError') toast('não abriu o compartilhar. use o baixar.'); } } }, 'postar') : null,
        h('a', { class: `pbx-act${pode ? '' : ' main'}`, href: urlVideo, download: arq.name }, 'baixar'),
        h('button', { type: 'button', class: 'pbx-act', onclick: () => { sair(); comecaGravar(); } }, 'gravar de novo'),
        h('button', { type: 'button', class: 'pbx-act', onclick: sair }, 'fechar')),
      h('small', { class: 'pbx-fim-l' }, `o vídeo já sai com o logo e o link ${LINK}`));
    root.append(fimEl);
  }

  return {
    inProgress: () => false, // brinquedo livre: sair não perde partida
    pause() { if (grav) grav.cancelar(); pausar(); },
    resume() { if (!fimEl) voltar(); },
    restart() { for (let i = 0; i < N; i++) setState(i, 0); },
    destroy() {
      gone = true; if (grav) grav.cancelar(); fechaFim(); para(); window.removeEventListener('bt-mute', onMute);
      if (master) { try { master.gain.value = 0; } catch { /* ok */ } const s = saida; setTimeout(() => { try { s.disconnect(); } catch { /* já saiu */ } }, 120); }
      delete window.__paulbox; musicaVolta();
    },
  };
}

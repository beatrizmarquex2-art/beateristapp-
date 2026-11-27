// Áudio/vídeo → partitura (sugestão). A professora sobe o arquivo, escolhe o trecho e o que quer ouvir (bateria, melodia ou acordes);
// o app analisa o som e monta uma SUGESTÃO que abre no editor pra ela corrigir. Não é mágica: funciona melhor com bateria clara,
// uma voz/instrumento por vez e acordes simples. Música completa mixada erra bastante, e o texto da tela diz isso.
import { h, aviso, campo, escolha, entrada } from './ui.js';
import * as M from './transcricao-motor.js';
import * as R from './ritmo.js';
import { desenhoDe } from './exportar.js';

const MODOS = [['bateria', 'Bateria (bumbo, caixa e chimbal)'], ['melodia', 'Melodia (uma nota de cada vez)'], ['acordes', 'Acordes (violão)']];
const DESTINOS = [['teclas', 'Teclado'], ['violao', 'Violão'], ['guitarra', 'Guitarra'], ['baixo', 'Baixo']];
const ROTA = { teclas: '#/editor', violao: '#/editor/violao', guitarra: '#/editor/guitarra', baixo: '#/editor/baixo', bateria: '#/editor/bateria' };

export function linhaDoResultado({ modo, destino, evs, bpm, nome }) {
  if (modo === 'bateria') return { instrumento: 'bateria', nome, dados: { evs, bpm, escrita: 'pauta', modelo: 'acustica', kit: 'medio', versao: 2, tipo: 'bateria', inst: 'bateria' } };
  if (modo === 'acordes' || destino === 'violao' || destino === 'guitarra' || destino === 'baixo') { const inst = modo === 'acordes' ? 'violao' : destino; return { instrumento: inst, nome, dados: { evs, bpm, escrita: 'tab', ncord: inst === 'baixo' ? 4 : 6, versao: 2, tipo: 'tab', inst } }; }
  return { instrumento: 'teclas', nome, dados: { evs, bpm, escrita: 'pauta', grade: 2, clave: 'auto' } };
}
export const deslocar = (evs, d) => evs.map((e) => ({ ...e, ini: e.ini + d })).filter((e) => e.ini >= 0);

export function mount(host) {
  let gone = false; let arq = null; let amostras = null; let res = null; let url = '';
  const st = h('p', { class: 'pt-x', role: 'status' }, 'escolha um arquivo de áudio ou vídeo (mp3, wav, m4a, mp4…).');
  const prev = h('div', { class: 'tr-prev', 'aria-live': 'polite' });
  const player = h('div', { class: 'tr-player' });
  const file = h('input', { type: 'file', accept: 'audio/*,video/*', class: 'tr-file', 'aria-label': 'Arquivo de áudio ou vídeo' });
  const modo = escolha(MODOS, 'bateria'); const dest = escolha(DESTINOS, 'teclas'); const ini = entrada({ type: 'number', min: 0, step: 1, value: 0, inputmode: 'numeric' }); const dur = entrada({ type: 'number', min: 4, max: M.MAX_SEG, step: 1, value: 20, inputmode: 'numeric' }); const bpm = entrada({ type: 'number', min: 0, max: 220, step: 1, value: '', inputmode: 'numeric', placeholder: 'automático' });
  const campoDest = campo('Escrever para', dest);
  const go = h('button', { type: 'button', class: 'pb ouro' }, 'Analisar o áudio'); const barra = h('progress', { class: 'tr-prog', max: 1, value: 0, hidden: true });
  const acoes = h('div', { class: 'tr-acoes', hidden: true });
  const sync = () => { campoDest.hidden = modo.value !== 'melodia'; }; modo.addEventListener('change', sync); sync();

  file.addEventListener('change', async () => {
    arq = file.files && file.files[0]; amostras = null; res = null; prev.replaceChildren(); acoes.hidden = true; player.replaceChildren(); if (url) { try { URL.revokeObjectURL(url); } catch { /* ok */ } url = ''; }
    if (!arq) return; st.textContent = `lendo ${arq.name}…`; go.disabled = true;
    try {
      url = URL.createObjectURL(arq); player.append(h(arq.type.startsWith('video') ? 'video' : 'audio', { src: url, controls: true, preload: 'metadata', playsinline: true, class: 'tr-media' }));
      const Ctx = window.AudioContext || window.webkitAudioContext; const ctx = new Ctx(); const buf = await ctx.decodeAudioData(await arq.arrayBuffer()); try { ctx.close(); } catch { /* ok */ }
      const canais = []; for (let c = 0; c < buf.numberOfChannels; c++) canais.push(buf.getChannelData(c)); amostras = M.mono(canais, buf.sampleRate); amostras.dur = buf.duration;
      st.textContent = `${arq.name} · ${Math.floor(buf.duration / 60)}:${String(Math.round(buf.duration % 60)).padStart(2, '0')}. escolha o trecho (até ${M.MAX_SEG} s por vez) e o que analisar.`;
    } catch { st.textContent = 'não consegui ler esse arquivo. tente mp3, wav ou m4a (ou um mp4 com som).'; arq = null; } go.disabled = false;
  });

  const desenha = () => {
    if (!res) return; const row = linhaDoResultado({ modo: modo.value, destino: dest.value, evs: res.evs, bpm: res.bpm, nome: (arq ? arq.name.replace(/\.[^.]+$/, '') : 'Sugestão do áudio') });
    prev.replaceChildren(); if (!res.evs.length) { prev.append(h('p', { class: 'pt-x' }, (res.avisos || [])[0] || 'não achei notas nesse trecho.')); acoes.hidden = true; return; }
    const box = h('div', { class: 'tr-folha' }); try { box.innerHTML = desenhoDe(row)(Math.max(300, Math.min(760, host.clientWidth - 40))).svg; } catch { box.textContent = 'não consegui desenhar a sugestão.'; }
    prev.append(h('p', { class: 'tr-info' }, `andamento sugerido: ${res.bpm} bpm · ${res.evs.length} nota${res.evs.length > 1 ? 's' : ''}`, res.acordes ? ` · acordes: ${res.acordes.join('  ')}` : ''), box, ...(res.avisos || []).map((a) => h('p', { class: 'pt-x' }, a)));
    acoes.hidden = false; res.row = row;
  };
  go.addEventListener('click', async () => {
    if (!amostras) { aviso('escolha um arquivo primeiro'); return; }
    go.disabled = true; barra.hidden = false; barra.value = 0; st.textContent = 'ouvindo o trecho…'; prev.replaceChildren(); acoes.hidden = true;
    try {
      const x = M.recorte(amostras.x, amostras.sr, Math.max(0, +ini.value || 0), Math.max(4, +dur.value || 20)); const op = { bpm: +bpm.value || 0, progresso: (p) => { if (!gone) barra.value = p; } };
      if (modo.value === 'bateria') res = await M.bateria(x, amostras.sr, op);
      else if (modo.value === 'acordes') res = await M.acordes(x, amostras.sr, op);
      else { res = await M.melodia(x, amostras.sr, op); if (dest.value !== 'teclas') { const inst = R.INSTRUMENTOS[dest.value]; const r = M.melodiaEmCordas(res.evs, R.cordasDe(dest.value, Object.keys(inst.opcoes).map(Number)[0])); if (r.fora) res.avisos = [...(res.avisos || []), `${r.fora} nota(s) ficaram fora do braço e não entraram.`]; res.evs = r.evs; } }
      if (gone) return; st.textContent = 'pronto. isto é uma sugestão: ouça, compare com o original e corrija no editor.'; desenha();
    } catch (e) { st.textContent = 'deu erro ao analisar. tente um trecho menor.'; } barra.hidden = true; go.disabled = false;
  });
  const abrir = () => { if (!res || !res.row) return; try { sessionStorage.setItem('pm-importar', JSON.stringify(res.row)); } catch { aviso('não consegui passar pro editor neste navegador'); return; } location.hash = ROTA[res.row.instrumento] || '#/editor'; };
  const mexe = (d) => { if (!res) return; res.evs = deslocar(res.evs, d); desenha(); };
  acoes.append(h('button', { type: 'button', class: 'pb ouro', onclick: abrir }, 'Abrir no editor e corrigir'), h('button', { type: 'button', class: 'pb', onclick: () => mexe(-4) }, '← 1 tempo antes'), h('button', { type: 'button', class: 'pb', onclick: () => mexe(4) }, '1 tempo depois →'), h('button', { type: 'button', class: 'pb', onclick: () => mexe(-16) }, '← 1 compasso'), h('button', { type: 'button', class: 'pb', onclick: () => mexe(16) }, '1 compasso →'));
  host.append(h('div', { class: 'pt tr' },
    h('header', { class: 'pt-top' }, h('div', {}, h('p', { class: 'pt-ov' }, 'Estúdio de criação'), h('h1', {}, 'Áudio → partitura'))),
    h('p', { class: 'pt-x tr-honesto' }, 'o app ouve o arquivo e monta uma sugestão. funciona bem com bateria clara, uma melodia por vez e acordes simples. em música completa (com tudo misturado) ele erra bastante: use o editor pra corrigir. o arquivo não sai do seu aparelho.'),
    h('section', { class: 'tr-box' }, campo('Arquivo', file), player, st),
    h('section', { class: 'tr-box tr-grade' }, campo('O que analisar', modo), campoDest, campo('Começa em (segundos)', ini), campo('Duração (segundos)', dur, `até ${M.MAX_SEG} s por vez`), campo('Andamento (bpm)', bpm, 'deixe vazio pra detectar')),
    h('div', { class: 'tr-go' }, go, barra), prev, acoes));
  return () => { gone = true; if (url) { try { URL.revokeObjectURL(url); } catch { /* ok */ } } };
}

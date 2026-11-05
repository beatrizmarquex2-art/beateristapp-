// Tela "💾 salvar / recuperar meu álbum": código BEA-0000 (servidor, salva sozinho) + código longo de reserva (sem internet).
import { h } from '../util.js';
import * as store from '../store.js';
import { sheet, toast, confirmSheet } from '../ui.js';
import * as P from './progress.js';
import * as SG from './savegame-logic.js';
import * as Cloud from './album-cloud.js';
import * as FR from '../figurinhas/rewards.js';

/** 💾 Save game: código BEA-0000 (servidor, salva sozinho) + código longo de reserva (sem internet). */
export function saveSheet(me, rerender = () => {}) {
  sheet('💾 save do álbum', (close) => {
    const body = h('div', { class: 'sheet-body' });
    const fail = () => toast('sem internet ou o servidor ainda não está ligado. tenta de novo daqui a pouco', { ms: 3500 });
    const copyText = async (t) => { try { await navigator.clipboard.writeText(t); toast('copiado ✓', { ms: 1500 }); } catch { toast(`anota aí: ${t}`, { ms: 4000 }); } };
    // ---- código de reserva (texto longo, funciona sem internet) ----
    const longBox = () => {
      const out = h('textarea', { class: 'input kx-code', readonly: 'true', rows: 4, 'aria-label': 'código longo', onfocus: (e) => e.target.select() }, 'gerando…'); let code = '';
      SG.encode(SG.snapshot(me.name, P.progOf(me.id), FR.stateOf())).then((c) => { code = c; out.value = c; });
      const inp = h('textarea', { class: 'input kx-code', rows: 3, placeholder: 'cole aqui o código BEA1-…', 'aria-label': 'colar código longo' });
      const restore = async () => { const snap = await SG.decode(inp.value); if (!snap) { toast('esse código não está certo. confere se copiou tudo', { ms: 3000 }); return; }
        await P.patch(me.id, SG.mergeSnap(P.progOf(me.id), snap)); if (snap.f) await store.upsert('figurinhas', FR.ID, SG.mergeFig(FR.stateOf(), snap.f)); close(); toast(`álbum recuperado: ${FR.pastedCount()} figurinhas coladas ✓`, { ms: 3000 }); rerender(); };
      return h('details', { class: 'kx-more' }, h('summary', {}, 'sem internet? código longo de reserva'), out,
        h('div', { class: 'row' }, h('button', { class: 'kd-chip', type: 'button', onclick: () => copyText(code) }, 'copiar')), inp,
        h('button', { class: 'kd-chip', type: 'button', onclick: restore }, 'recuperar com o código longo'));
    };
    // antes de gerar: usa o mesmo nome da entrada ou outro?
    const askName = () => {
      const make = (nome) => Cloud.create(me, nome).then(() => draw()).catch(fail);
      const other = h('input', { class: 'input', maxlength: '20', placeholder: 'outro nome', 'aria-label': 'outro nome' });
      body.replaceChildren(h('p', {}, 'seu álbum vai ficar guardado com o nome:'), h('div', { class: 'kx-bigcode' }, me.name),
        h('button', { class: 'kd-btn', type: 'button', onclick: () => make(me.name) }, `sim, usar ${me.name}`),
        h('p', { class: 'muted' }, 'ou escolhe outro:'), h('div', { class: 'row' }, other, h('button', { class: 'kd-chip', type: 'button', onclick: () => { const n = other.value.replace(/\s+/g, ' ').trim().slice(0, 20); if (!n) { other.focus(); return; } make(n); } }, 'usar esse')));
    };
    const draw = () => {
      const code = Cloud.codeOf(me.id);
      const mine = code
        ? [h('p', {}, 'seu código é:'), h('div', { class: 'kx-bigcode' }, code), h('p', { class: 'muted' }, 'anota ou tira print. o álbum salva sozinho quando você ganha figurinha. num celular novo, é só digitar esse código.'),
          h('div', { class: 'row' }, h('button', { class: 'kd-btn', type: 'button', onclick: () => Cloud.create(me).then(() => toast('álbum salvo ✓', { ms: 1800 })).catch(fail) }, 'salvar agora'), h('button', { class: 'kd-chip', type: 'button', onclick: () => copyText(code) }, 'copiar'))]
        : [h('p', {}, 'gere um código de 4 números pra guardar seu álbum e recuperar em qualquer celular.'),
          h('button', { class: 'kd-btn', type: 'button', onclick: askName }, 'gerar meu código')];
      const inp = h('input', { class: 'input', inputmode: 'numeric', maxlength: '8', placeholder: 'BEA-0000', 'aria-label': 'código do álbum' });
      const find = async () => {
        const c = SG.normCode(inp.value); if (!c) { toast('digita os 4 números do código', { ms: 2200 }); return; }
        let snap; try { snap = await Cloud.peek(c); } catch { fail(); return; }
        if (!snap) { toast('não achei esse código. confere os números', { ms: 2800 }); return; }
        const r = SG.resumo(snap);
        if (!(await confirmSheet(`é o álbum de ${r.nome}?`, `${r.figurinhas} figurinhas · ${r.estrelas} ★. vai juntar com o que você já tem (não apaga nada).`, 'é meu'))) return;
        try { await Cloud.adopt(me, c, snap); } catch { fail(); return; } close(); toast(`álbum recuperado: ${FR.pastedCount()} figurinhas coladas ✓`, { ms: 3000 }); rerender();
      };
      body.replaceChildren(...mine, h('h3', {}, 'já tenho um código'), h('div', { class: 'row' }, inp, h('button', { class: 'kd-btn', type: 'button', onclick: find }, 'recuperar')), longBox());
    };
    draw(); return body;
  });
}

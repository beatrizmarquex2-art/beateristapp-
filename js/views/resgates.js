// Tela da Bea: resgates por print esperando aprovação. Aprovar entrega a recompensa no aparelho do aluno e o print é apagado do servidor.
import { h } from '../util.js';
import { banner, toast, confirmSheet } from '../ui.js';
import * as R from '../resgate.js';

const quando = (t) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(t));
export function mount(host) {
  const lista = h('div', { class: 'pad-x', style: 'display:grid;gap:12px' }); let gone = false;
  host.append(banner('Resgates por print', 'confira o print e aprove ou recuse'), lista);
  async function carregar() {
    lista.replaceChildren(h('p', { class: 'muted' }, 'carregando…'));
    let rows; try { rows = await R.pendentes(); } catch { lista.replaceChildren(h('p', { class: 'muted' }, 'não consegui carregar. entre no app e tente de novo.')); return; }
    if (gone) return;
    if (!rows.length) { lista.replaceChildren(h('section', { class: 'card pad' }, h('b', {}, 'nenhum resgate esperando'), h('p', { class: 'muted' }, 'quando um aluno mandar um print, ele aparece aqui e você recebe um aviso ao abrir o app.'))); return; }
    lista.replaceChildren(...rows.map((r) => {
      const card = h('section', { class: 'card pad rs-card' },
        h('b', {}, `${r.nome || 'aluno'} · código ${r.code}`), h('p', { class: 'muted' }, `${R.TIPO_NOME[r.tipo] || r.tipo} · ${quando(r.criado_em)}`),
        r.print_b64 ? h('img', { class: 'rs-img', src: `data:image/jpeg;base64,${r.print_b64}`, alt: 'print enviado' }) : h('p', { class: 'muted' }, '(sem imagem)'),
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', type: 'button', onclick: async () => { try { await R.decidir(r.id, 'aprovado'); toast('aprovado! a recompensa chega no aparelho do aluno.'); card.remove(); if (!lista.children.length) carregar(); } catch { toast('não consegui aprovar agora.'); } } }, 'aprovar'),
          h('button', { class: 'btn ghost', type: 'button', onclick: async () => { if (!(await confirmSheet('recusar o print?', 'o print some e o aluno pode mandar outro.', 'recusar'))) return; try { await R.decidir(r.id, 'recusado', 'print não confere'); toast('recusado.'); card.remove(); if (!lista.children.length) carregar(); } catch { toast('não consegui recusar agora.'); } } }, 'recusar')));
      return card;
    }));
  }
  carregar();
  return () => { gone = true; };
}

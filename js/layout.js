import * as store from './store.js';

export const LAYOUT_KEY = 'setting-home-layout';
export const SECTIONS = [
  { id: 'aulas', label: 'Aulas de hoje', off: true },
  { id: 'hoje', label: 'Checklist de hoje' },
  { id: 'nota', label: 'Nota fixa' },
  { id: 'estudar', label: 'Widget: continuar estudando' },
  { id: 'metro', label: 'Widget: metrônomo rápido', off: true },
  { id: 'foco', label: 'Widget: cronômetro de foco', off: true },
  { id: 'favoritos', label: 'Favoritos' },
  { id: 'atalhos', label: 'Atalhos', off: true },
  { id: 'frase', label: 'Frase' },
  { id: 'parceiros', label: 'Parceiros' },
];
export function getLayout() {
  const d = store.get(LAYOUT_KEY) ? store.get(LAYOUT_KEY).data : {};
  const ids = SECTIONS.map((s) => s.id);
  const order = (d.order || []).filter((x) => ids.includes(x));
  // v2: a Bea pediu o checklist de hoje logo abaixo das aulas (vale para a ordem já salva também)
  if ((d.v || 0) < 2 && order.includes('hoje')) { order.splice(order.indexOf('hoje'), 1); order.splice(order.includes('aulas') ? order.indexOf('aulas') + 1 : 0, 0, 'hoje'); }
  // seção nova entra na posição padrão dela (aulas de hoje vai para o topo), não no fim
  ids.forEach((x, k) => { if (!order.includes(x)) order.splice(Math.min(k, order.length), 0, x); });
  // widget novo (que a Bea ainda não viu) entra ligado ou desligado conforme o padrão dele
  const known = d.known || (d.order ? ['aulas', 'nota', 'hoje', 'favoritos', 'atalhos', 'frase', 'parceiros'] : []);
  const hidden = (d.hidden || []).filter((x) => ids.includes(x));
  // v3: as atividades foram pro menu ☰; os atalhos saem do início (menos rolagem). religa em Personalizar.
  if ((d.v || 0) < 3 && !hidden.includes('atalhos')) hidden.push('atalhos');
  // v4: aulas de hoje fica desligada até a Bea atualizar os alunos; o que ela estuda (com barrinha de progresso) sobe pro início
  if ((d.v || 0) < 4) {
    if (!hidden.includes('aulas')) hidden.push('aulas');
    const hi = hidden.indexOf('estudar'); if (hi >= 0) hidden.splice(hi, 1);
    const o = order.indexOf('estudar'); if (o >= 0) { order.splice(o, 1); order.splice(order.includes('hoje') ? order.indexOf('hoje') + 1 : 0, 0, 'estudar'); }
  }
  SECTIONS.forEach((s) => { if (s.off && !known.includes(s.id) && !hidden.includes(s.id)) hidden.push(s.id); });
  return { order, hidden };
}
export const saveLayout = (order, hidden) => store.upsert('setting', LAYOUT_KEY, { order, hidden, known: SECTIONS.map((s) => s.id), v: 4 });
export const resetLayout = () => store.upsert('setting', LAYOUT_KEY, { order: SECTIONS.map((s) => s.id), hidden: SECTIONS.filter((s) => s.off).map((s) => s.id), known: SECTIONS.map((s) => s.id), v: 4 });

// Motor dos lembretes: confere a cada 30 s (e quando o app volta pra frente), põe o número no ícone do app
// e, se a Bea deixou, mostra notificação do sistema. Funciona com o app aberto ou recém-minimizado;
// com o app fechado o iPhone não acorda a página (isso exigiria um servidor de push).
import * as store from './store.js';
import { todayKey, clock } from './util.js';
import { DEFAULTS, remindersFor, dueNow, toNotify } from './reminders.js';

export const KEY = 'setting-lembretes';
export const cfg = () => ({ ...DEFAULTS, ...(store.get(KEY) ? store.get(KEY).data : {}) });
export const nowMin = () => { const [hh, mm] = clock().split(':').map(Number); return hh * 60 + mm; };
const subs = new Set(); let timer = 0; let last = [];
export const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };

export function today() {
  const day = todayKey();
  return remindersFor({ day, students: store.list('student'), makeups: store.list('makeup'), studylogs: store.list('studylog'), custom: store.list('reminder'), cfg: cfg() });
}
const dismissedToday = () => ((cfg().dismissed || {})[todayKey()] || []);
export const due = () => dueNow(today(), nowMin(), dismissedToday());

export async function dismiss(id) {
  const c = cfg(); const day = todayKey();
  // guarda só o dia de hoje (o resto é lixo velho)
  await store.upsert('setting', KEY, { dismissed: { [day]: [...new Set([...((c.dismissed || {})[day] || []), id])] } });
  // tira do centro de notificações também
  try { const reg = await navigator.serviceWorker.getRegistration(); if (reg) (await reg.getNotifications({ tag: id })).forEach((n) => n.close()); } catch { /* sem service worker */ }
  tick();
}

const notifiedKey = () => `bt-notified-${todayKey()}`;
const getNotified = () => { try { return JSON.parse(localStorage.getItem(notifiedKey()) || '[]'); } catch { return []; } };
const setNotified = (ids) => { try { localStorage.setItem(notifiedKey(), JSON.stringify(ids)); } catch { /* sem armazenamento: avisa de novo, tudo bem */ } };

export const permission = () => ('Notification' in window ? Notification.permission : 'unsupported');
export async function askPermission() {
  if (!('Notification' in window)) return 'unsupported';
  try { return await Notification.requestPermission(); } catch { return Notification.permission; }
}

async function show(items) {
  // espera o service worker ficar pronto (no iPhone só ele mostra notificação); sem ele em 3 s, tenta direto
  const reg = 'serviceWorker' in navigator ? await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 3000))]) : null;
  for (const x of items) {
    const opts = { body: x.sub || '', tag: x.id, data: { href: x.href }, icon: 'assets/icons/icon-192.png', badge: 'assets/icons/icon-192.png' };
    try { if (reg && reg.showNotification) await reg.showNotification(x.title, opts); else new Notification(x.title, opts); } catch { /* navegador recusou: fica só o aviso dentro do app */ }
  }
}

export async function tick() {
  const list = today(); const now = nowMin(); const dis = dismissedToday();
  const d = dueNow(list, now, dis);
  try { if (navigator.setAppBadge) (d.length ? navigator.setAppBadge(d.length) : navigator.clearAppBadge()).catch(() => {}); } catch { /* sem selo */ }
  const c = cfg();
  if (c.on && permission() === 'granted') {
    const notified = getNotified(); const fresh = toNotify(list, now, dis, notified);
    if (fresh.length) { setNotified([...notified, ...fresh.map((x) => x.id)]); await show(fresh); }
  }
  const sig = d.map((x) => x.id).join('|');
  if (sig !== last.join('|')) { last = d.map((x) => x.id); subs.forEach((f) => f(d)); }
}

export function start() {
  if (timer) return;
  timer = setInterval(tick, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.type === 'go' && e.data.href) location.hash = e.data.href.replace(/^#/, ''); });
  store.subscribe((i) => { if (!i.kind || ['student', 'makeup', 'studylog', 'reminder'].includes(i.kind) || i.id === KEY) tick(); });
  tick();
}

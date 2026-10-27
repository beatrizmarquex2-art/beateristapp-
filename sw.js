// Service worker: cacheia só o "casco" do app (código + marca). Nenhum dado do usuário passa por aqui.
const VERSION = 'beaterista-v67';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/app.js', 'js/util.js', 'js/db.js', 'js/store.js', 'js/auth.js', 'js/sync.js', 'js/config.js',
  'js/ui.js', 'js/modules.js', 'js/tasks-logic.js', 'js/theme.js', 'js/theme-boot.js', 'js/layout.js',
  'js/views/home.js', 'js/views/tasks.js', 'js/views/notes.js', 'js/views/favs.js', 'js/views/settings.js',
  'js/views/misc.js', 'js/views/personalize.js', 'js/views/mural.js', 'js/views/login.js', 'js/views/capture.js',
  'js/views/library.js', 'js/lib.js', 'js/md.js', 'js/zip.js',
  'js/music.js', 'js/audio.js', 'js/views/metronome.js', 'js/views/accent.js',
  'js/students-logic.js', 'js/views/students.js', 'js/views/focus.js', 'js/views/feed.js', 'js/views/widgets.js', 'js/views/cover.js', 'js/views/collages.js', 'js/catalog.js', 'js/views/artist-photo.js', 'js/views/club.js', 'js/beats.js', 'js/charts.js', 'js/photos-sync.js', 'js/music-facts.js', 'js/hero-text.js', 'js/views/beatlab.js', 'js/pitch.js', 'js/views/ouvido.js', 'js/notation.js', 'js/files-sync.js', 'js/scroller.js', 'js/views/kit.js', 'js/views/menu.js', 'js/views/tempo.js', 'js/views/partitura.js', 'js/views/ideias.js', 'js/views/arquivos.js', 'js/views/bateristas.js', 'js/views/treinos.js', 'js/views/combo.js', 'js/views/toque.js', 'js/views/piano.js', 'js/send-folder.js', 'js/folder-pdf.js', 'js/piano-logic.js', 'js/views/rudimentos.js', 'js/views/plano.js', 'js/views/ambiente.js', 'js/views/planos.js', 'js/views/kids.js', 'js/albums-logic.js', 'js/musicdata.js', 'js/textimport.js', 'js/collection.js', 'js/repertoire.js', 'js/reminders.js', 'js/notify.js', 'js/views/lembretes.js', 'js/tools-logic.js', 'js/glossary.js', 'js/views/jogos-ritmo.js', 'js/midi.js', 'js/midi-chart.js', 'assets/rhythm-games/rhythm-games.js', 'assets/rhythm-games/rhythm-games.css', 'js/views/dicionario.js', 'js/synth.js', 'js/views/ferramentas.js', 'js/views/tools-common.js', 'js/views/tools-leitura.js', 'js/views/tools-mapa.js', 'js/views/tools-loop.js', 'js/views/tools-um.js', 'js/views/tools-groovebox.js', 'js/views/tools-desafio.js', 'js/views/repertorio.js', 'js/kids-logic.js', 'js/views/plan-pdf.js', 'js/pdf.js', 'js/studentplan.js', 'assets/papel-timbrado.png', 'js/ambient.js', 'js/ambient-logic.js', 'js/plan.js', 'js/rudiments.js', 'js/touchkit.js', 'js/reading.js', 'js/drummers-logic.js', 'js/files-logic.js', 'js/wav.js', 'js/views/xray-tab.js', 'js/xray.js', 'js/views/setlist.js', 'js/setlist-logic.js', 'js/views/tuneguide.js', 'js/tuning-guide.js', 'js/timing.js', 'js/onset-core.js', 'js/onset-worklet.js', 'css/fonts.css',
  'cartas/', 'cartas/index.html', 'cartas/src/music.js', 'cartas/src/render.js', 'cartas/src/audio.js', 'cartas/src/illus.js', 'cartas/src/store.js', 'cartas/src/print.js', 'cartas/src/app.js',
  'cartas/vendor/react.production.min.js', 'cartas/vendor/react-dom.production.min.js', 'cartas/vendor/htm.umd.js', 'cartas/vendor/vexflow-bravura.js',
  'assets/fonts/BodoniModa-latin-ext.woff2', 'assets/fonts/BodoniModa-latin.woff2', 'assets/fonts/HankenGrotesk-latin-ext.woff2', 'assets/fonts/HankenGrotesk-latin.woff2', 'assets/fonts/SpecialElite-latin-ext.woff2', 'assets/fonts/SpecialElite-latin.woff2', 'assets/fonts/Anton-latin.woff2', 'assets/fonts/Anton-latin-ext.woff2', 'assets/fonts/PermanentMarker-latin.woff2', 'assets/fonts/AbrilFatface-latin.woff2', 'assets/fonts/AbrilFatface-latin-ext.woff2', 'assets/fonts/GochiHand-latin.woff2',
  'assets/zine/bea-casaco.webp', 'assets/zine/bea-rock.webp', 'assets/zine/circulo-creme.webp', 'assets/zine/circulo-terracota.webp', 'assets/zine/cursor-mao.webp', 'assets/zine/cursor-seta.webp', 'assets/zine/explosao-creme.webp', 'assets/zine/explosao-ouro.webp', 'assets/zine/fita-1.webp', 'assets/zine/fita-2.webp', 'assets/zine/fita-3.webp', 'assets/zine/fita-4.webp', 'assets/zine/gotas-ouro.webp', 'assets/zine/kraft-4.webp', 'assets/zine/nota-creme.webp', 'assets/zine/nota-ouro.webp', 'assets/zine/notas-terracota.webp', 'assets/zine/papel-preto-brilho.webp', 'assets/zine/papel-preto-faixa.webp', 'assets/zine/papel-preto-onda.webp', 'assets/zine/papel-vermelho-3.webp', 'assets/zine/seta-creme.webp', 'assets/zine/seta-tinta.webp', 'assets/zine/sombra-retangulo.webp', 'assets/zine/textura-fundo-creme.webp', 'assets/zine/textura-fundo-tinta.webp',
  'assets/logo-512.png', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/icons/apple-touch-icon.png', 'assets/icons/tambor-96.png', 'assets/icons/icon-maskable-512.png',
  'assets/parceiros.png', 'assets/wash/a.png', 'assets/wash/b.png', 'assets/wash/c.png', 'assets/wash/d.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Supabase, YouTube etc.: sempre rede, nunca cache
  // Rede primeiro para o código (pega atualizações); cache como reserva offline.
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok && !url.pathname.includes('/originals/papel_') && !url.pathname.endsWith('.pdf')) {
        const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then((m) => m || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))),
  );
});

// Toque na notificação de lembrete: abre (ou foca) o app na tela certa.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const href = (e.notification.data && e.notification.data.href) || '#/lembretes';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const c = list[0];
    if (c) { c.postMessage({ type: 'go', href }); return c.focus(); }
    return self.clients.openWindow(`./${href}`);
  }));
});

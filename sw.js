// Service worker: cacheia só o "casco" do app (código + marca). Nenhum dado do usuário passa por aqui.
const VERSION = 'beaterista-v199';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css', 'css/kids.css', 'css/lote2.css', 'css/lote3.css', 'css/audit.css', 'js/session.js', 'css/jogos.css', 'css/estudos.css', 'js/views/story.js', 'assets/story/meio-tom-branco.webp', 'assets/story/rasgado-cinza.webp', 'js/jogos/velha.js', 'js/jogos/velha-logic.js', 'js/jogos/velha-data.js', 'js/jogos/bingo.js', 'js/jogos/bingo-logic.js', 'js/jogos/bingo-art.js', 'js/jogos/cara.js', 'js/jogos/cara-logic.js', 'js/jogos/cara-data.js', 'js/jogos/quebra.js', 'js/jogos/quebra-logic.js', 'js/jogos/stop.js', 'js/jogos/stop-logic.js', 'assets/jogos/palco.webp', 'js/views/jogos.js', 'js/views/jogos-relatorio.js', 'js/jogos/base.js', 'js/jogos/domino.js', 'js/jogos/domino-logic.js', 'js/jogos/cartas.js', 'js/jogos/cartas-logic.js', 'aluno.html', 'js/aluno.js', 'js/aluno-boot.js', 'js/ranking.js', 'js/paul-talk.js', 'js/views/acessos.js', 'manifest-aluno.webmanifest', 'js/mic-access.js', 'js/views/ata.js', 'js/views/kids-relatorio.js', 'js/feedback.js', 'js/tips.js', 'js/tipbox.js', 'js/views/dicas.js', 'js/views/figuras-aprender.js', 'js/kids/ritmo.js', 'js/kids/memoria.js', 'js/kids/memory-themes.js',
  'js/app.js', 'js/util.js', 'js/db.js', 'js/store.js', 'js/auth.js', 'js/sync.js', 'js/config.js',
  'js/ui.js', 'js/modules.js', 'js/tasks-logic.js', 'js/theme.js', 'js/theme-boot.js', 'js/layout.js',
  'js/views/home.js', 'js/views/tasks.js', 'js/views/notes.js', 'js/views/favs.js', 'js/views/settings.js',
  'js/views/misc.js', 'js/views/personalize.js', 'js/views/mural.js', 'js/views/login.js', 'js/views/capture.js',
  'js/views/library.js', 'js/lib.js', 'js/md.js', 'js/zip.js',
  'js/music.js', 'js/audio.js', 'js/views/metronome.js', 'js/views/accent.js',
  'js/students-logic.js', 'js/views/students.js', 'js/views/focus.js', 'js/views/feed.js', 'js/views/widgets.js', 'js/views/cover.js', 'js/views/collages.js', 'js/catalog.js', 'js/views/artist-photo.js', 'js/views/club.js', 'js/views/arsenal.js', 'js/space.js', 'js/beats.js', 'js/charts.js', 'js/photos-sync.js', 'js/music-facts.js', 'js/hero-text.js', 'js/views/beatlab.js', 'js/pitch.js', 'js/views/ouvido.js', 'js/notation.js', 'js/files-sync.js', 'js/scroller.js', 'js/views/kit.js', 'js/views/menu.js', 'js/views/tempo.js', 'js/views/partitura.js', 'js/views/ideias.js', 'js/views/arquivos.js', 'js/views/bateristas.js', 'js/views/treinos.js', 'js/views/combo.js', 'js/views/toque.js', 'js/views/piano.js', 'js/kids/art.js', 'js/kids/icons.js', 'js/kids/robo.js', 'js/kids/levels.js', 'js/kids/quiz.js', 'js/kids/progress.js', 'js/kids/engine.js', 'js/kids/album.js', 'js/kids/album-data.js', 'js/kids/games.js', 'js/kids/report.js', 'js/kids/eco.js', 'js/kids/detetive.js', 'js/kids/groove.js', 'js/kids/capture.js', 'js/kids/mic.js', 'js/kids/memory.js', 'js/kids/doodles.js', 'js/kids/instruments.js', 'js/views/hub.js', 'js/highlights.js', 'js/views/anotacoes.js', 'js/send-folder.js', 'js/folder-pdf.js', 'js/piano-logic.js', 'js/views/rudimentos.js', 'js/views/plano.js', 'js/views/ambiente.js', 'js/views/planos.js', 'js/views/kids.js', 'js/recent.js', 'js/midi-write.js', 'js/albums-logic.js', 'js/musicdata.js', 'js/textimport.js', 'js/collection.js', 'js/study-link.js', 'js/jogos/festa.js', 'js/jogos/ouvir.js', 'js/kids/kit-theme.js', 'js/dragsort.js', 'js/repertoire.js', 'js/reminders.js', 'js/notify.js', 'js/views/lembretes.js', 'js/tools-logic.js', 'js/glossary.js', 'js/views/jogos-ritmo.js', 'js/midi.js', 'js/midi-chart.js', 'assets/rhythm-games/rhythm-games.js', 'assets/rhythm-games/rhythm-games.css', 'js/views/dicionario.js', 'js/synth.js', 'js/views/ferramentas.js', 'js/views/tools-common.js', 'js/views/tools-leitura.js', 'js/views/tools-mapa.js', 'js/views/tools-loop.js', 'js/views/tools-um.js', 'js/views/tools-groovebox.js', 'js/views/tools-desafio.js', 'js/views/repertorio.js', 'js/kids-logic.js', 'js/views/plan-pdf.js', 'js/pdf.js', 'js/studentplan.js', 'assets/papel-timbrado.png', 'assets/cards/g01.webp', 'assets/cards/g02.webp', 'assets/cards/g03.webp', 'assets/cards/g04.webp', 'assets/cards/g05.webp', 'assets/cards/g06.webp', 'assets/cards/g07.webp', 'assets/cards/g08.webp', 'assets/cards/g09.webp', 'assets/cards/g10.webp', 'assets/cards/g11.webp', 'assets/cards/g12.webp', 'assets/cards/b01.webp', 'assets/cards/b02.webp', 'assets/cards/b03.webp', 'assets/cards/b04.webp', 'assets/cards/b05.webp', 'assets/cards/b06.webp', 'assets/cards/b07.webp', 'assets/cards/b08.webp', 'assets/cards/b09.webp', 'assets/cards/b10.webp', 'assets/logo-nome.png', 'assets/logo-menu-beaterista.webp', 'assets/paul/e01.webp', 'assets/paul/e02.webp', 'assets/paul/e03.webp', 'assets/paul/e04.webp', 'assets/paul/e05.webp', 'assets/paul/e06.webp', 'assets/paul/e07.webp', 'assets/paul/e08.webp', 'assets/paul/e09.webp', 'assets/paul/e10.webp', 'assets/paul/e11.webp', 'assets/paul/e12.webp', 'assets/paul/e13.webp', 'assets/paul/e14.webp', 'assets/paul/e15.webp', 'assets/paul/e16.webp', 'assets/paul/e17.webp', 'assets/paul/e18.webp', 'assets/paul/e19.webp', 'assets/paul/e20.webp', 'assets/paul/e21.webp', 'assets/paul/e22.webp', 'assets/paul/e23.webp', 'assets/paul/e24.webp', 'assets/paul/e25.webp', 'assets/paul/e26.webp', 'assets/paul/e27.webp', 'assets/paul/e28.webp', 'assets/paul/e29.webp', 'assets/paul/e30.webp', 'assets/paul/estudando.webp', 'assets/paul/bateria.webp', 'assets/paul/d-blackscr.webp', 'assets/paul/d-bolt2.webp', 'assets/paul/d-boltgold.webp', 'assets/paul/d-bubble.webp', 'assets/paul/d-burst.webp', 'assets/paul/d-cap.webp', 'assets/paul/d-cymbal.webp', 'assets/paul/d-heart.webp', 'assets/paul/d-heartfill.webp', 'assets/paul/d-laptop.webp', 'assets/paul/d-navyscr.webp', 'assets/paul/d-note.webp', 'assets/paul/d-phones.webp', 'assets/paul/d-notered.webp', 'assets/paul/d-redm2.webp', 'assets/paul/d-redscr.webp', 'assets/paul/d-stars.webp', 'assets/paul/d-ulstar.webp', 'assets/paul/d-xface.webp', 'assets/paul/p-back.webp', 'assets/paul/p-back2.webp', 'assets/paul/p-book.webp', 'assets/paul/p-cat.webp', 'assets/paul/p-chest.webp', 'assets/paul/p-chin.webp', 'assets/paul/p-cool.webp', 'assets/paul/p-drink.webp', 'assets/paul/p-drum2.webp', 'assets/paul/p-guitar.webp', 'assets/paul/p-hip.webp', 'assets/paul/p-kit.webp', 'assets/paul/p-laptop.webp', 'assets/paul/p-peace.webp', 'assets/paul/p-peek.webp', 'assets/paul/p-point.webp', 'assets/paul/p-rest.webp', 'assets/paul/p-run.webp', 'assets/paul/p-selfie.webp', 'assets/paul/p-sit.webp', 'assets/paul/p-skate.webp', 'assets/paul/p-walk.webp', 'assets/paul/p-wave.webp', 'assets/paul/p-zzz.webp', 'js/ambient.js', 'js/ambient-logic.js', 'js/plan.js', 'js/rudiments.js', 'js/touchkit.js', 'js/reading.js', 'js/drummers-logic.js', 'js/files-logic.js', 'js/wav.js', 'js/views/xray-tab.js', 'js/xray.js', 'js/views/setlist.js', 'js/setlist-logic.js', 'js/views/tuneguide.js', 'js/tuning-guide.js', 'js/timing.js', 'js/onset-core.js', 'js/onset-worklet.js', 'css/fonts.css', 'css/kids.css',
  'assets/fonts/BodoniModa-latin-ext.woff2', 'assets/fonts/Silkscreen-400-latin.woff2', 'assets/fonts/Silkscreen-700-latin.woff2', 'assets/fonts/BodoniModa-latin.woff2', 'assets/fonts/HankenGrotesk-latin-ext.woff2', 'assets/fonts/HankenGrotesk-latin.woff2', 'assets/fonts/SpecialElite-latin-ext.woff2', 'assets/fonts/SpecialElite-latin.woff2', 'assets/fonts/Anton-latin.woff2', 'assets/fonts/Anton-latin-ext.woff2', 'assets/fonts/PermanentMarker-latin.woff2', 'assets/fonts/AbrilFatface-latin.woff2', 'assets/fonts/AbrilFatface-latin-ext.woff2', 'assets/fonts/GochiHand-latin.woff2',
  'assets/zine/bea-casaco.webp', 'assets/zine/bea-rock.webp', 'assets/zine/circulo-creme.webp', 'assets/zine/circulo-terracota.webp', 'assets/zine/cursor-mao.webp', 'assets/zine/cursor-seta.webp', 'assets/zine/explosao-creme.webp', 'assets/zine/explosao-ouro.webp', 'assets/zine/fita-1.webp', 'assets/zine/fita-2.webp', 'assets/zine/fita-3.webp', 'assets/zine/fita-4.webp', 'assets/zine/gotas-ouro.webp', 'assets/zine/kraft-4.webp', 'assets/zine/nota-creme.webp', 'assets/zine/nota-ouro.webp', 'assets/zine/notas-terracota.webp', 'assets/zine/papel-preto-brilho.webp', 'assets/zine/papel-preto-faixa.webp', 'assets/zine/papel-preto-onda.webp', 'assets/zine/papel-vermelho-3.webp', 'assets/zine/seta-creme.webp', 'assets/zine/seta-tinta.webp', 'assets/zine/sombra-retangulo.webp', 'assets/zine/textura-fundo-creme.webp', 'assets/zine/textura-fundo-tinta.webp',
  'assets/logo-512.png', 'assets/icons/icon-192.png', 'assets/icons/tambor-menu.png', 'assets/icons/icon-512.png', 'assets/icons/apple-touch-icon.png', 'assets/icons/tambor-96.png', 'assets/icons/icon-maskable-512.png',
  'assets/parceiros.png', 'assets/wash/a.png', 'assets/wash/b.png', 'assets/wash/c.png', 'assets/wash/d.png',
];

// <extra-gerado> arquivos dos jogos e das artes, baixados depois do essencial (scripts/sw-extra.mjs refaz esta lista)
const EXTRA = [
  'assets/aluno/bingo.webp',
  'assets/aluno/cara-a-cara.webp',
  'assets/aluno/cartas.webp',
  'assets/aluno/domino.webp',
  'assets/aluno/paul-apontando.webp',
  'assets/aluno/paul-bateria.webp',
  'assets/aluno/paul-paz.webp',
  'assets/aluno/paul-selfie.webp',
  'assets/aluno/paul-skate.webp',
  'assets/aluno/paul-violao.webp',
  'assets/aluno/paul.webp',
  'assets/aluno/quebra-cabeca.webp',
  'assets/aluno/velha.webp',
  'assets/arsenal/discos.json',
  'assets/jogos/icones/bingo.webp',
  'assets/jogos/icones/caca.svg',
  'assets/jogos/icones/cara-a-cara.webp',
  'assets/jogos/icones/cartas.webp',
  'assets/jogos/icones/cruza.svg',
  'assets/jogos/icones/domino.webp',
  'assets/jogos/icones/eco.svg',
  'assets/jogos/icones/explorar.svg',
  'assets/jogos/icones/fases.svg',
  'assets/jogos/icones/figuras.svg',
  'assets/jogos/icones/memoria.svg',
  'assets/jogos/icones/monte.svg',
  'assets/jogos/icones/paul.webp',
  'assets/jogos/icones/pauta.svg',
  'assets/jogos/icones/quebra-cabeca.webp',
  'assets/jogos/icones/quiz.svg',
  'assets/jogos/icones/rabiscos.webp',
  'assets/jogos/icones/relatorio.svg',
  'assets/jogos/icones/ritmo.svg',
  'assets/jogos/icones/stop.webp',
  'assets/jogos/icones/velha.webp',
  'assets/jogos/instrumentos/acordeao.webp',
  'assets/jogos/instrumentos/baixo.webp',
  'assets/jogos/instrumentos/bateria.webp',
  'assets/jogos/instrumentos/flauta.webp',
  'assets/jogos/instrumentos/guitarra.webp',
  'assets/jogos/instrumentos/pandeiro.webp',
  'assets/jogos/instrumentos/saxofone.webp',
  'assets/jogos/instrumentos/teclado.webp',
  'assets/jogos/instrumentos/triangulo.webp',
  'assets/jogos/instrumentos/trompete.webp',
  'assets/jogos/instrumentos/violao.webp',
  'assets/jogos/instrumentos/violino.webp',
  'assets/memoria/bateria/01_bumbo.webp',
  'assets/memoria/bateria/02_caixa.webp',
  'assets/memoria/bateria/03_tom1.webp',
  'assets/memoria/bateria/04_tom2.webp',
  'assets/memoria/bateria/05_surdo.webp',
  'assets/memoria/bateria/06_chimbal.webp',
  'assets/memoria/bateria/07_ride.webp',
  'assets/memoria/bateria/08_crash.webp',
  'assets/memoria/bateria/verso.webp',
  'assets/memoria/figuras/01_whole.webp',
  'assets/memoria/figuras/02_pausa_whole.webp',
  'assets/memoria/figuras/03_half.webp',
  'assets/memoria/figuras/04_pausa_half.webp',
  'assets/memoria/figuras/05_quarter.webp',
  'assets/memoria/figuras/06_pausa_quarter.webp',
  'assets/memoria/figuras/07_eighth.webp',
  'assets/memoria/figuras/08_pausa_eighth.webp',
  'assets/memoria/figuras/09_sixteenth.webp',
  'assets/memoria/figuras/10_pausa_sixteenth.webp',
  'assets/memoria/figuras/verso.webp',
  'assets/memoria/palco/01_microfone.webp',
  'assets/memoria/palco/02_amplificador.webp',
  'assets/memoria/palco/03_pedal.webp',
  'assets/memoria/palco/04_mesa_de_som.webp',
  'assets/memoria/palco/05_fone.webp',
  'assets/memoria/palco/06_interface_de_audio.webp',
  'assets/memoria/palco/07_pedestal.webp',
  'assets/memoria/palco/08_cabo_xlr.webp',
  'assets/memoria/palco/verso.webp',
  'assets/memoria/paul/01_bateria.webp',
  'assets/memoria/paul/02_violao.webp',
  'assets/memoria/paul/03_guitarra.webp',
  'assets/memoria/paul/04_baixo.webp',
  'assets/memoria/paul/05_teclado.webp',
  'assets/memoria/paul/06_saxofone.webp',
  'assets/memoria/paul/07_violino.webp',
  'assets/memoria/paul/08_pandeiro.webp',
  'assets/memoria/paul/verso.webp',
  'assets/memoria/percussao/01_pandeiro.webp',
  'assets/memoria/percussao/02_tamborim.webp',
  'assets/memoria/percussao/03_agogo.webp',
  'assets/memoria/percussao/04_reco_reco.webp',
  'assets/memoria/percussao/05_triangulo.webp',
  'assets/memoria/percussao/06_ganza.webp',
  'assets/memoria/percussao/07_congas.webp',
  'assets/memoria/percussao/08_bongos.webp',
  'assets/memoria/percussao/verso.webp',
  'assets/memoria/profissoes/01_maestro.webp',
  'assets/memoria/profissoes/02_dj.webp',
  'assets/memoria/profissoes/03_baterista.webp',
  'assets/memoria/profissoes/04_cantora.webp',
  'assets/memoria/profissoes/05_guitarrista.webp',
  'assets/memoria/profissoes/06_compositora.webp',
  'assets/memoria/profissoes/07_tecnico_de_som.webp',
  'assets/memoria/profissoes/08_produtora_musical.webp',
  'assets/memoria/profissoes/verso.webp',
  'assets/memoria/rock/01_beatles.webp',
  'assets/memoria/rock/02_queen.webp',
  'assets/memoria/rock/03_nirvana.webp',
  'assets/memoria/rock/04_acdc.webp',
  'assets/memoria/rock/05_metallica.webp',
  'assets/memoria/rock/06_blink182.webp',
  'assets/memoria/rock/07_arctic_monkeys.webp',
  'assets/memoria/rock/08_rhcp.webp',
  'assets/memoria/rock/verso.webp',
  'assets/memoria/sinais/01_acento.webp',
  'assets/memoria/sinais/02_nota_fantasma.webp',
  'assets/memoria/sinais/03_metronomo.webp',
  'assets/memoria/sinais/verso.webp',
  'assets/mural/bolt-ink.svg',
  'assets/mural/bolt-red.svg',
  'assets/mural/brush-gold.svg',
  'assets/mural/brush-navy.svg',
  'assets/mural/brush-red.svg',
  'assets/mural/brush-wine.svg',
  'assets/mural/cassette.svg',
  'assets/mural/clip.svg',
  'assets/mural/drum.svg',
  'assets/mural/note.svg',
  'assets/mural/shard-black-2.svg',
  'assets/mural/shard-black.svg',
  'assets/mural/shard-red.svg',
  'assets/mural/smile-face.svg',
  'assets/mural/smile.svg',
  'assets/mural/star-ink.svg',
  'assets/mural/star-red-solid.svg',
  'assets/mural/star-red.svg',
  'assets/mural/star-spray.svg',
  'assets/mural/sticks.svg',
  'assets/mural/tape-wide.svg',
  'assets/mural/tape.svg',
  'assets/mural/underline.svg',
  'assets/mural/vinyl.svg',
  'assets/paul/el/balao.webp',
  'assets/paul/el/coracao-cheio.webp',
  'assets/paul/el/coracao.webp',
  'assets/paul/el/estrela-azul-p.webp',
  'assets/paul/el/estrela-azul.webp',
  'assets/paul/el/estrela-ouro.webp',
  'assets/paul/el/exclamacao.webp',
  'assets/paul/el/fone.webp',
  'assets/paul/el/nota-preta.webp',
  'assets/paul/el/nota-vermelha.webp',
  'assets/paul/el/prato.webp',
  'assets/paul/el/raio.webp',
  'assets/paul/paul-memoria.webp',
];
// </extra-gerado>

self.addEventListener('install', (e) => {
  // o essencial entra todo ou nada; as artes dos jogos entram uma a uma (se uma falhar, as outras ficam e o app instala do mesmo jeito)
  e.waitUntil(caches.open(VERSION).then(async (c) => {
    await c.addAll(SHELL); self.skipWaiting();
    await Promise.allSettled(EXTRA.map((u) => c.add(u)));
  }));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Supabase, YouTube etc.: sempre rede, nunca cache
  if (req.headers.has('range')) return; // áudio/vídeo em pedaços: deixa o navegador cuidar
  // Cópia salva primeiro (abre na hora, mesmo com sinal fraco) e atualiza por trás. A cada versão nova o app baixa tudo de novo (VERSION),
  // então a cópia nunca fica velha por mais de uma abertura.
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
    const net = fetch(req).then((res) => {
      if (res.ok && res.status === 200 && !url.pathname.includes('/originals/papel_') && !url.pathname.endsWith('.pdf')) cache.put(req, res.clone()).catch(() => {});
      return res;
    });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    try { return await net; } catch { return (req.mode === 'navigate' && (await caches.match('index.html'))) || Response.error(); }
  })());
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

# Testes de regressão (E2E)

Sem build e sem dependências no projeto: usam o Playwright/Chromium já instalado (`require('playwright')`).
Cada script sobe um servidor estático local, abre o app e **mede o áudio que realmente sai** (todo `AudioContext` passa por um analisador).

    node tests/e2e/ritmo.mjs    # Beatstar/Piano Tiles/Setinhas: prévia, 20 trocas de fase, fase nova ainda toca
    node tests/e2e/kids.mjs     # jogos Kids: sair/trocar de fase 20x, timers, resultado gravado uma vez
    node tests/e2e/routes.mjs   # 52 telas do app: entrar/tocar/sair 2x; vazamento de escutas, timers, rAF, fontes de áudio, microfone
    node tests/e2e/layout.mjs   # 8 tamanhos de tela (320px a 1366px, retrato e paisagem): rolagem horizontal e elementos vazando

Limites: emulação de viewport/toque do Chromium; não substitui teste em iPhone/iPad/Android reais (Safari, bloqueio de tela, chamada, MIDI/microfone físicos).

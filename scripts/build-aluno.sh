#!/usr/bin/env bash
# Monta a pasta do site dos alunos (Netlify "beaterista-alunos", domínio oficial jogos.beaterista.com.br).
# Uso: scripts/build-aluno.sh /caminho/de/saida   (depois publique essa pasta no Netlify)
set -euo pipefail
OUT="${1:?informe a pasta de saída}"
rm -rf "$OUT"; mkdir -p "$OUT"
cp -r css js assets vendas sw.js manifest-aluno.webmanifest manifest.webmanifest aluno.html "$OUT"/
rm -rf "$OUT/assets/originals" "$OUT/assets/arsenal"
cp aluno.html "$OUT/index.html"   # a raiz do domínio abre direto a área do aluno
printf '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Permissions-Policy: camera=(), microphone=(self), geolocation=()\n/sw.js\n  Cache-Control: no-cache\n/js/*\n  Cache-Control: no-cache\n/css/*\n  Cache-Control: no-cache\n' > "$OUT/_headers"
# GitHub Pages (jogos.beaterista.com.br): sem estes 2 arquivos o endereço sai do ar com "404 There isn't a GitHub Pages site here" (aconteceu 2 vezes em 19-20/nov/2026)
printf 'jogos.beaterista.com.br' > "$OUT/CNAME"; touch "$OUT/.nojekyll"

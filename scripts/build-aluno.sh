#!/usr/bin/env bash
# Monta a pasta do site dos alunos (Netlify "beaterista-alunos", domínio aluno.beaterista.com.br).
# Uso: scripts/build-aluno.sh /caminho/de/saida   (depois publique essa pasta no Netlify)
set -euo pipefail
OUT="${1:?informe a pasta de saída}"
rm -rf "$OUT"; mkdir -p "$OUT"
cp -r css js assets sw.js manifest-aluno.webmanifest manifest.webmanifest aluno.html "$OUT"/
rm -rf "$OUT/assets/originals" "$OUT/assets/arsenal"
cp aluno.html "$OUT/index.html"   # a raiz do subdomínio abre direto a área do aluno
printf '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Permissions-Policy: camera=(), microphone=(self), geolocation=()\n/sw.js\n  Cache-Control: no-cache\n/js/*\n  Cache-Control: no-cache\n/css/*\n  Cache-Control: no-cache\n' > "$OUT/_headers"

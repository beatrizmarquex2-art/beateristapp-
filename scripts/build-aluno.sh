#!/usr/bin/env bash
# Monta a pasta do site dos alunos (Netlify "beaterista-alunos", domínio aluno.beaterista.com.br).
# Uso: scripts/build-aluno.sh /caminho/de/saida   (depois publique essa pasta no Netlify)
set -euo pipefail
OUT="${1:?informe a pasta de saída}"
rm -rf "$OUT"; mkdir -p "$OUT"
cp -r css js assets sw.js manifest-aluno.webmanifest manifest.webmanifest aluno.html "$OUT"/
rm -rf "$OUT/assets/originals" "$OUT/assets/arsenal"
# fotos de terceiros (álbum e Cara a Cara Musical) ficam só no app da Bea até a Bea liberar: tira as fotos e desliga o tema musical
rm -rf "$OUT/assets/figurinhas/fotos" "$OUT/assets/figurinhas/mini" "$OUT/assets/figurinhas/cara-a-cara-elenco.json" "$OUT/js/jogos/cara-musical"
sed -i 's/const MUSICAL_LIBERADO = true;/const MUSICAL_LIBERADO = false;/' "$OUT/js/jogos/cara.js"
sed -i -E "s#'js/jogos/cara-musical/[a-z-]+\.js', ?##g" "$OUT/sw.js"   # o cache do app não pode listar arquivo que não existe
cp aluno.html "$OUT/index.html"   # a raiz do subdomínio abre direto a área do aluno
printf '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Permissions-Policy: camera=(), microphone=(self), geolocation=()\n/sw.js\n  Cache-Control: no-cache\n/js/*\n  Cache-Control: no-cache\n/css/*\n  Cache-Control: no-cache\n' > "$OUT/_headers"

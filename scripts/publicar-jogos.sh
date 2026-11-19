#!/usr/bin/env bash
# Publica a área dos alunos no GitHub Pages (repo beaterista-jogos, domínio jogos.beaterista.com.br).
# Uso: scripts/publicar-jogos.sh            -> monta, copia pro repo dos jogos e dá push na main
#      scripts/publicar-jogos.sh --so-montar -> só monta em /tmp/jogos-out (não publica)
# Sempre recria CNAME e .nojekyll, pra o domínio não cair.
set -euo pipefail
DOMINIO="jogos.beaterista.com.br"
REPO="https://github.com/beatrizmarquex2-art/beaterista-jogos.git"
AQUI="$(cd "$(dirname "$0")/.." && pwd)"
SAIDA="${TMPDIR:-/tmp}/jogos-out"
CLONE="${TMPDIR:-/tmp}/jogos-repo"

"$AQUI/scripts/build-aluno.sh" "$SAIDA"
rm -f "$SAIDA/_headers"                 # o Pages não usa
: > "$SAIDA/.nojekyll"
printf '%s\n' "$DOMINIO" > "$SAIDA/CNAME"

[ "${1:-}" = "--so-montar" ] && { echo "montado em $SAIDA (nada publicado)"; exit 0; }

rm -rf "$CLONE"
git clone --depth 1 "$REPO" "$CLONE"
# troca o conteúdo todo (menos .git) pelo novo, que já leva CNAME e .nojekyll
find "$CLONE" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -a "$SAIDA"/. "$CLONE"/
cd "$CLONE"
[ -f CNAME ] && grep -qx "$DOMINIO" CNAME || { echo "ERRO: CNAME faltando"; exit 1; }
git add -A
if git diff --cached --quiet; then echo "nada mudou, nada a publicar"; exit 0; fi
git commit -m "publica área dos alunos ($(grep -o "beaterista-v[0-9]*" sw.js | head -1))"
git push origin main
echo "publicado. confere em https://$DOMINIO em 1-2 min (aba anônima)"

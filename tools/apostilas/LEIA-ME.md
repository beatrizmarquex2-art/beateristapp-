# Apostilas Beaterista (PDF)

Gera as apostilas "Bateria para adultos" e "Teclado do zero" no mesmo visual da apostila de violão (azul-marinho, dourado, serifa nos títulos).
As partituras saem do mesmo motor de escrita do Beaterista PRO (`js/pro/escrita.js`), então o PDF e o editor nunca discordam.

```
node tools/apostilas/bateria.mjs   # escreve /tmp/apo/bateria.html
node tools/apostilas/teclado.mjs   # escreve /tmp/apo/teclado.html
node tools/apostilas/render.mjs /tmp/apo/bateria.html bateria.pdf   # HTML -> PDF A4 (e avisa se alguma página estoura)
```

Para mudar texto, edite o `.mjs` da apostila. Cada página é um bloco `P.push(pg({...}))`.

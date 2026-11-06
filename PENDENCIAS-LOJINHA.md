# Lojinha e Passe Beaterista: o que depende da Bea

Tudo está numa branch (`lojinha-passe`), **invisível aos alunos** (interruptor `LOJA_PUBLICA = false` em `js/loja/flags.js`). Nada foi publicado, nada foi aplicado no Supabase de produção, nada foi mexido na Hotmart.

## Como ver agora (privado)
- Local: `python3 -m http.server 8080` na pasta do app e abrir `http://localhost:8080/aluno.html?loja=on#/lojinha` (o `?loja=on` liga a Lojinha só nesse navegador; `?loja=off` desliga).
- O Passe no preview é uma **simulação** (nada vai ao Supabase). Abra `#/passe`, abra "modo teste" no fim da página, toque "nova compra simulada" e ative com `teste@exemplo.com` + `PAUL1234`. Os botões "vencer", "revogar" e "renovar" mostram os outros estados.

## Lista única (em ordem)
1. **Aprovar o visual** da Lojinha, do Passe, do envelope e do bloco "Paul apresenta" (ou pedir ajustes).
2. **Checkout do Passe**: na Hotmart, criar a oferta de pagamento único R$ 49,90 e me passar (a) o link `pay.hotmart.com/...` e (b) o **código da oferta** (o `off=` do link). Vão em `PASSE.oferta` (`js/loja/catalogo.js`) e em `passe_config.oferta_codigos` (SQL abaixo). Também o **ID do produto** (`produto_ids`).
3. **Webhook da Hotmart** (Ferramentas > Webhook): apontar para a URL da função `hotmart-webhook` e escolher a versão 2.0.0 com os eventos de compra aprovada/completa, reembolso, chargeback, cancelada e atrasada. O token (hottok) que a Hotmart mostra vai como segredo `HOTMART_HOTTOK`. **Atenção**: não consegui abrir a documentação da Hotmart daqui, então os caminhos do JSON (`data.buyer.email`, `data.purchase.transaction`, `data.purchase.offer.code`, `data.product.id`) estão pelo formato 2.0.0 que conheço. Fazer uma compra de teste e conferir antes de vender.
4. **Aplicar no Supabase** (só depois de aprovar): colar `supabase/013_passe.sql` no SQL Editor; depois `update passe_config set valor='producao' where chave='ambiente'`, preencher `oferta_codigos`/`produto_ids` e `compra_ativa='sim'`. Publicar a função: `supabase functions deploy hotmart-webhook --no-verify-jwt` e `supabase secrets set HOTMART_HOTTOK=...`. Tudo cabe no plano Free. O projeto `beaterista-app` é o de produção; se preferir testar antes, um segundo projeto Free serve de ensaio.
5. **Checkouts avulsos** (hoje mostram "Em breve"): me passar link + preço de cada um em `PRODUTOS[].oferta`: Jogo da Memória Musical, Bateria Kids, Robôterista Ensina, Violão do Zero (confirmar se o "Violão Start" da Hotmart é o PDF de 47 páginas), Beaterista Mood (o R$ 29,90 vale só como adicional do curso) e Bateria Start e-book de 44 páginas. O curso já abre o checkout confirmado (R$ 79,90): reconferir o preço no dia da publicação.
6. **Como o comprador recebe o código PAUL####**: hoje o servidor guarda a mensagem em `passe_outbox` e **não envia nada**. Escolha: você copia em Menu > Passe Beaterista e manda, ou ligamos um envio automático de e-mail (precisa de um serviço e do seu OK).
7. **Artes finais das 3 cartas** (Paul no Fliperama, Paul Colecionador, Paul no Palco): ainda não existem. No preview entram poses do Paul como arte provisória, marcadas "arte provisória" só no modo teste. Mande as artes (ou peça para eu gerar) e trocamos em `js/figurinhas/passe-cartas.js`. A comunicação pública do bônus só deve sair com elas prontas.
8. **Kit promocional do curso** (PNG do Paul, banner, versão mobile da página de vendas, thumbnail 1280×720, capa do canal 2560×1440, feed 1080×1350, Story 1080×1920): não produzi, pois dependem de fotos e trechos reais das aulas. Me envie e eu monto.
9. **Decisão**: quem já é aluno e compra o Passe recebe uma conta de Passe **separada** (o código de aluno e o progresso dele não são alterados nem juntados).
10. **Salas online e downloads**: onde o servidor já conferia código (lista de MIDI, dicas, álbum) agora também vale o fim do Passe/revogação, porque o Passe cria um código de aluno com validade. As salas online que já existiam (jogos em 2 celulares) **não** conferem código no servidor hoje, e eu não mudei isso para não quebrar o que funciona. Se quiser o modo online só para Passe/alunos, é um próximo passo.

## Para publicar (depois do seu OK)
1. `LOJA_PUBLICA = true` em `js/loja/flags.js` (e `PASSE_COMPRA_ATIVA = true` só quando o item 2 e 3 estiverem prontos).
2. Passos de sempre: `scripts/build-aluno.sh`, copiar para `beaterista-jogos` e push na `main`. A versão do cache (`sw.js`) já foi subida para v317.
3. Merge da branch na `main` do app da Bea só quando for publicar (a `main` publica sozinha).

## Testes
- `node --test tests/*.test.mjs` (inclui `tests/loja-catalogo.test.mjs` e `tests/webhook-logic.test.mjs`).
- `node --test tests/sql/passe.test.mjs`: sobe um Postgres local descartável e testa a migration (webhook idempotente, reentrega, fora de ordem, reembolso só do direito ligado, renovação sem duplicar bônus, código PAUL único/atômico/bloqueio, permissões, auditoria).
- `NODE_PATH=$(npm root -g) node tests/e2e/loja.mjs`: visitante em link direto, interruptor, ordem, checkout, Passe e estados, envelope único, álbum, Paul apresenta, menu e layout (320, 390 e desktop).
- Já falhavam antes, na `main`: `tests/e2e/figurinhas.mjs` e `routes.mjs` (precisam de rede/Supabase).

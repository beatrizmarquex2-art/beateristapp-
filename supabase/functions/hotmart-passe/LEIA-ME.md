# Passe Beaterista: liberação automática pela Hotmart

Fluxo: **Hotmart (compra aprovada) → webhook `hotmart-passe` → código em `alunos_codigos` (tipo `passe`, 12 meses, 2 aparelhos) → e-mail com o código**. O comprador entra pelo mesmo campo "Código de acesso" do site.

Arquivos: `supabase/015_passe_hotmart.sql` (tabela `passe_compras` + funções), `supabase/functions/hotmart-passe/` (Edge Function), `scripts/passe-codigo-revisao.sql` (código de teste da Hotmart), `scripts/passe-testar.mjs`.
Testes: `node --test tests/passe-hotmart.test.mjs` (webhook, sem rede) e `PGLITE_DIR=/tmp/pgt node tests/e2e/passe-sql.mjs` (SQL de verdade num Postgres em memória).

## Configurar (nada disso está feito ainda)
1. **Banco** (muda o banco, só com a confirmação da Bea): aplicar `supabase/015_passe_hotmart.sql` (SQL Editor ou migração).
2. **E-mail**: conta no Resend (ou troque `enviarEmail` em `passe-core.mjs`), verificar o domínio, criar a chave.
3. **Segredos da função** (Supabase → Edge Functions → Secrets, ou `supabase secrets set ...`):
   `HOTMART_HOTTOK`, `HOTMART_PRODUCT_IDS`, `RESEND_API_KEY`, `MAIL_FROM` (ex.: `Beaterista <passe@seudominio.com.br>`), `ADMIN_TOKEN` (qualquer texto longo; só pro reenvio manual). Opcional: `SITE_URL`. `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` o Supabase já injeta.
4. **Deploy sem JWT** (a Hotmart não manda JWT, quem autentica é o hottok): `supabase functions deploy hotmart-passe --no-verify-jwt --project-ref fnxgjxatremjdxaqmswu`.
5. **Hotmart** → Ferramentas → Webhook (v2.0.0): URL `https://fnxgjxatremjdxaqmswu.supabase.co/functions/v1/hotmart-passe`, eventos **Compra aprovada, Compra completa, Reembolso, Chargeback**, produto = o Passe. O "hottok" que a Hotmart mostra é o `HOTMART_HOTTOK`.
6. **Produto**: `HOTMART_PRODUCT_IDS` = o ID numérico do produto Passe (Produtos → o produto → aparece na URL e em "Dados gerais") ou o "ucode"; pode listar vários separados por vírgula. Eventos de qualquer outro produto são ignorados com 200.

## Reenvio do e-mail
Falhou o envio? A função responde 502 e a Hotmart repete o aviso: o **mesmo código** é reaproveitado e o e-mail é reenviado. Manual:
`curl -X POST https://fnxgjxatremjdxaqmswu.supabase.co/functions/v1/hotmart-passe/reenviar -H 'x-admin-token: SEU_ADMIN_TOKEN' -H 'content-type: application/json' -d '{"transacao":"HP12345678"}'`

## Ver compras
Na tabela `passe_compras` (transação, código, e-mail, status aprovada/reembolsada/chargeback, e-mail enviado, erro). Só a Bea (is_allowed) lê; ninguém mais.

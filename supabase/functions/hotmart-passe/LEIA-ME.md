# Passe Beaterista: liberação automática pela Hotmart

Fluxo: **Hotmart (compra aprovada) → webhook `hotmart-passe` → código em `alunos_codigos` (tipo `passe`, 12 meses, 2 aparelhos) → e-mail com o código**. O comprador entra pelo mesmo campo "Código de acesso" do site.

Arquivos: `supabase/015_passe_hotmart.sql` (tabela `passe_compras` + funções), `supabase/functions/hotmart-passe/` (Edge Function), `scripts/passe-codigo-revisao.sql` (código de teste da Hotmart), `scripts/passe-testar.mjs`.
Testes: `node --test tests/passe-hotmart.test.mjs` (webhook, sem rede) e `PGLITE_DIR=/tmp/pgt node tests/e2e/passe-sql.mjs` (SQL de verdade num Postgres em memória; instalar: `mkdir /tmp/pgt && cd /tmp/pgt && npm i @electric-sql/pglite`).

## Configurar (nada disso está feito ainda; o banco `beaterista-app` (fnxgjxatremjdxaqmswu) não tem `passe_compras` nem função publicada)
Ordem importa: **teste primeiro, só depois troque os links de venda.**

### Supabase
1. **Banco** (só com o OK da Bea): SQL Editor → colar `supabase/015_passe_hotmart.sql` → Run. Cria `passe_compras` (privada: RLS ligada, sem acesso do site; só a Bea, via `is_allowed`, lê) e as funções, que só o `service_role` executa.
2. **E-mail (Resend)**: criar conta → Domains → verificar o domínio (DNS) → API Keys → criar chave "hotmart-passe".
3. **Segredos** (Edge Functions → Secrets, ou CLI). Nunca no GitHub nem no site:
   `supabase secrets set HOTMART_HOTTOK=... HOTMART_PRODUCT_IDS=... RESEND_API_KEY=... MAIL_FROM="Beaterista <passe@seudominio.com.br>" ADMIN_TOKEN=<texto longo aleatório> --project-ref fnxgjxatremjdxaqmswu`
   Opcional `SITE_URL` (padrão https://play.beaterista.com.br). `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` o Supabase já injeta. A service role só existe dentro da função.
4. **Deploy sem JWT** (a Hotmart não manda JWT; quem autentica é o hottok): `supabase functions deploy hotmart-passe --no-verify-jwt --project-ref fnxgjxatremjdxaqmswu`.

### Domínio
4b. **play.beaterista.com.br** precisa apontar pro mesmo site do app dos alunos (Netlify: Domain management → adicionar o domínio; DNS: CNAME de `play` pro endereço que o Netlify mostrar) e ter HTTPS ativo **antes** de vender: é o link que vai no e-mail.

### Hotmart
5. **ID do produto**: Produtos → Passe → o número na URL da página do produto (ex.: `.../products/4567890`) ou "Dados gerais". Vira `HOTMART_PRODUCT_IDS` (vários separados por vírgula; vale também o ucode). Confira que é o produto do **Passe** e não de um ebook. Evento de qualquer outro produto é ignorado com 200.
6. **Webhook**: Ferramentas → Webhook (API e notificações) → Cadastrar webhook. URL `https://fnxgjxatremjdxaqmswu.supabase.co/functions/v1/hotmart-passe`, **versão 2.0.0**, produto = Passe, eventos: Compra aprovada, Compra completa, Reembolso, Chargeback, Compra cancelada, Compra expirada (pode marcar também Boleto impresso/Atrasada/Protesto: são ignorados com 200). O **hottok** que a Hotmart mostra é o `HOTMART_HOTTOK`.
7. **Testar antes de vender**: no mesmo painel, "Enviar teste" (o evento de teste traz um produto de exemplo, então vai voltar `ignorado: produto`, o que já prova o hottok) e uma compra real barata/cupom 100% com e-mail seu → conferir: código `P` + 9 caracteres no e-mail, link do e-mail (play.beaterista.com.br) abre a tela de entrada, o código entra, a linha em `passe_compras` e a validade (12 meses). Depois reembolse essa compra e confirme que o código passa a dar "não achei esse código". Teste também "comprei o passe e perdi meu código" na tela de entrada.
8. **Só então** trocar os links: `node scripts/passe-link.mjs https://pay.hotmart.com/<checkout do Passe>` (muda `js/loja-config.js` e `vendas/index.html`, só o Passe), subir o `sw.js` e publicar. `js/entrada.js` (botão "quero meu passe anual") ainda usa o WhatsApp: trocar `PASSE_LINK` lá também quando quiser.

## Rotas da função
- `POST /` webhook da Hotmart (exige hottok no cabeçalho `X-HOTMART-HOTTOK`; o corpo v2 também traz `hottok`).
- `POST /recuperar` `{ "email": "..." }` público (botão "comprei o passe e perdi meu código"): responde sempre `{ok:true}`, exista ou não compra; o código só vai pro e-mail da compra; no máx. 1 envio por e-mail a cada 10 min.
- `POST /reenviar` `{ "transacao": "HP..." }` com `x-admin-token`.

## Eventos
Aprovada/Completa: cria o código (uma vez por transação) e manda o e-mail. Reembolso, Chargeback, Cancelada e Expirada: desativam só o código daquela transação (turma e outros passes ficam intactos); aviso de reembolso/chargeback que chega antes da aprovação impede a liberação tardia; cancelamento sem compra aprovada não faz nada. Pendente (boleto/pix gerado, atrasado) é ignorado.

## Offline
`OFFLINE_DAYS` em `js/codigo.js` passou de 365 para 30: com internet o código é conferido a cada abertura (revogação vale na hora); só um aparelho que nunca reconecta segue liberado por até 30 dias.

## Reenvio do e-mail
Falhou o envio? A função responde 502 e a Hotmart repete o aviso: o **mesmo código** é reaproveitado e o e-mail é reenviado. Manual:
`curl -X POST https://fnxgjxatremjdxaqmswu.supabase.co/functions/v1/hotmart-passe/reenviar -H 'x-admin-token: SEU_ADMIN_TOKEN' -H 'content-type: application/json' -d '{"transacao":"HP12345678"}'`

## Ver compras
Na tabela `passe_compras` (transação, código, e-mail, status aprovada/reembolsada/chargeback, e-mail enviado, erro). Só a Bea (is_allowed) lê; ninguém mais.

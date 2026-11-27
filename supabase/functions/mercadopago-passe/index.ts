// v15 (27/nov/2026): + e-mail "seu Pix foi gerado" (copia e cola + link pra voltar ao QR Code) e + codigo na resposta de status (so se o e-mail informado bater com o do pedido).
// Mercado Pago Pix -> verificacao pela API -> codigo anual + email.
// Pagamento somente no servidor: nunca expor MP_ACCESS_TOKEN ao navegador.
// Publico sem JWT para criar Pix; webhook exige assinatura HMAC x-signature.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

// PRECO DO PIX POR DATA (meia-noite de Brasilia). Mantenha igual a js/oferta-precos.js do site.
const PRECOS_PIX: { desde: string; valor: number }[] = [
  { desde: "1970-01-01T00:00:00-03:00", valor: 49.90 },
  { desde: "2027-01-01T00:00:00-03:00", valor: 99.90 },
];
function precoPixAgora(agora = Date.now()): number {
  let v = PRECOS_PIX[0].valor;
  for (const p of PRECOS_PIX) if (Date.parse(p.desde) <= agora) v = p.valor;
  return v;
}
const PRECO_LEGADO = 49.90; // pedidos antigos sem valor gravado
const URL_ENTRADA = "https://jogos.beaterista.com.br/?entrar";
const URL_PIX = "https://jogos.beaterista.com.br/pix/";
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ORIGENS = new Set(["https://jogos.beaterista.com.br", "http://localhost:8080", "http://127.0.0.1:8080"]);

type Pedido = {
  pedido: string; pagamento_id: string | null; status: string;
  comprador_email: string; comprador_nome: string; codigo: string | null;
  email_enviado_em: string | null; valor?: number | string | null;
};
function resposta(obj: unknown, status = 200, origin = ""): Response {
  const headers: Record<string, string> = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
  if (ORIGENS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Vary"] = "Origin";
  }
  return new Response(JSON.stringify(obj), { status, headers });
}
function normalizarEmail(raw: unknown): string {
  return String(raw ?? "").trim().toLowerCase();
}
function emailValido(v: string): boolean {
  return v.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const tam of [9, 10]) {
    const total = Array.from(cpf.slice(0, tam)).reduce((a, d, i) => a + Number(d) * (tam + 1 - i), 0);
    const dig = (total * 10) % 11 % 10;
    if (dig !== Number(cpf[tam])) return false;
  }
  return true;
}
function novoCodigo(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return "P" + Array.from(bytes, (v) => ALFABETO[v % ALFABETO.length]).join("");
}
function htmlSeguro(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
}
function strSafe(a: string, b: string): boolean {
  const A = new TextEncoder().encode(a), B = new TextEncoder().encode(b);
  if (A.length !== B.length) return false;
  let n = 0;
  for (let i = 0; i < A.length; i++) n |= A[i] ^ B[i];
  return n === 0;
}
// caracteres invisiveis escritos por codigo (ASCII puro aqui): zero-width, word joiner, BOM e o de objeto
const INVISIVEIS = String.fromCharCode(0x200b) + "-" + String.fromCharCode(0x200d) + String.fromCharCode(0x2060, 0xfeff, 0xfffc);
const RE_CRED_SUJO = new RegExp("[\\s" + INVISIVEIS + "]", "g");
const RE_INVISIVEIS = new RegExp("[" + INVISIVEIS + "]", "g");
function env(name: string): string {
  const raw = Deno.env.get(name) || "";
  if (name === "MP_ACCESS_TOKEN" || name === "MP_WEBHOOK_SECRET" || name === "RESEND_API_KEY") {
    // Credentials are ASCII. Remove only whitespace and known invisible clipboard artifacts.
    return raw.replace(RE_CRED_SUJO, "");
  }
  if (name === "HOTMART_EMAIL_FROM") return raw.replace(RE_INVISIVEIS, "").trim();
  return raw;
}
function cliente() {
  if (!env("SUPABASE_URL") || !env("SUPABASE_SERVICE_ROLE_KEY")) throw Error("supabase_not_configured");
  if (!/^[\x21-\x7E]+$/.test(env("SUPABASE_SERVICE_ROLE_KEY"))) throw Error("supabase_service_key_non_ascii");
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
async function mpPagamento(id: string): Promise<any> {
  if (!/^\d{4,25}$/.test(id)) throw Error("invalid_payment_id");
  const token = env("MP_ACCESS_TOKEN");
  if (!token) throw Error("mp_not_configured");
  if (!/^[\x21-\x7E]+$/.test(token)) throw Error("mp_access_token_non_ascii");
  const r = await fetch("https://api.mercadopago.com/v1/payments/" + id, {
    headers: { Authorization: "Bearer " + token },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw Error("mp_get_payment_" + r.status);
  return await r.json();
}
async function assinaturaValida(req: Request, paymentId: string): Promise<boolean> {
  // Log only categorical failure reasons, never headers, signatures, IDs or secrets.
  const falha = (motivo: string): false => {
    console.warn("mp_webhook_signature_rejected", motivo);
    return false;
  };
  const chave = env("MP_WEBHOOK_SECRET").trim();
  const assinatura = req.headers.get("x-signature") || "";
  const requestId = (req.headers.get("x-request-id") || "").trim();
  if (!chave) return falha("secret_missing");
  if (!/^[\x21-\x7E]+$/.test(chave)) return falha("secret_non_ascii");
  if (!assinatura) return falha("signature_header_missing");
  if (!requestId) return falha("request_id_missing");
  if (!paymentId) return falha("payment_id_missing");
  const campos = new Map<string, string>();
  for (const parte of assinatura.split(",")) {
    const pos = parte.indexOf("=");
    if (pos < 0) continue;
    const nome = parte.slice(0, pos).trim();
    const valor = parte.slice(pos + 1).trim();
    if (nome !== "ts" && nome !== "v1") continue;
    if (campos.has(nome)) return falha("duplicate_signature_field");
    campos.set(nome, valor);
  }
  const ts = campos.get("ts") || "";
  const v1 = campos.get("v1") || "";
  if (!/^[0-9]+$/.test(ts)) return falha("timestamp_invalid");
  if (!/^[a-fA-F0-9]{64}$/.test(v1)) return falha("hash_format_invalid");
  const manifest = "id:" + paymentId + ";request-id:" + requestId + ";ts:" + ts + ";";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(chave), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const hash = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest)));
  const hex = Array.from(hash, (b) => b.toString(16).padStart(2, "0")).join("");
  if (!strSafe(hex, v1.toLowerCase())) return falha("hmac_mismatch");
  console.info("mp_webhook_signature_verified");
  return true;
}
function conferePagamento(p: any, pedido: Pedido): void {
  if (String(p?.id) !== pedido.pagamento_id && pedido.pagamento_id !== null) throw Error("payment_id_mismatch");
  if (String(p?.external_reference || "") !== pedido.pedido) throw Error("external_reference_mismatch");
  // o valor esperado e o do PROPRIO pedido (gravado quando o Pix foi gerado): um Pix gerado antes da virada de preco continua valido
  const esperado = Number(pedido.valor) > 0 ? Number(pedido.valor) : PRECO_LEGADO;
  if (p?.currency_id !== "BRL" || Math.abs(Number(p?.transaction_amount) - esperado) > 0.001) {
    throw Error("amount_mismatch");
  }
  if (p?.payment_method_id !== "pix") throw Error("method_mismatch");
  if (p?.live_mode !== true) throw Error("test_payment_rejected");
  const payerEmail = normalizarEmail(p?.payer?.email);
  if (payerEmail && payerEmail !== pedido.comprador_email) throw Error("payer_mismatch");
}
async function emailAcesso(sb: ReturnType<typeof cliente>, pedido: Pedido): Promise<void> {
  if (pedido.status !== "aprovada" || pedido.email_enviado_em || !pedido.codigo) return;
  if (!env("RESEND_API_KEY") || !env("HOTMART_EMAIL_FROM")) throw Error("email_not_configured");
  const primeiro = pedido.comprador_nome.split(/\s+/)[0] || "aluno(a)";
  const html = [
    '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#252525">',
    "<h2>seu Passe Anual Robôterista está pronto!</h2>",
    "<p>olá, " + htmlSeguro(primeiro) + "! seu Pix foi confirmado.</p>",
    "<p>seu código dá 12 meses de acesso em até 2 aparelhos:</p>",
    '<p style="font-size:26px;letter-spacing:3px;font-weight:bold">' + pedido.codigo + "</p>",
    '<p>entre em <a href="' + URL_ENTRADA + '">' + URL_ENTRADA + "</a>, escreva seu nome",
    " e use o código na opção “já tenho código”.</p>",
    "<p>guarde este e-mail para recuperar seu acesso.</p>",
    "<p>equipe Beaterista</p></div>",
  ].join("");
  const envio = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env("RESEND_API_KEY"),
      "Content-Type": "application/json",
      "Idempotency-Key": "mp-passe-" + pedido.pedido,
    },
    body: JSON.stringify({
      from: env("HOTMART_EMAIL_FROM"),
      to: [pedido.comprador_email],
      subject: "seu acesso ao Passe Anual Robôterista",
      html,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!envio.ok) throw Error("email_send_" + envio.status);
  const { error } = await sb.from("mercadopago_passe_vendas")
    .update({ email_enviado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
    .eq("pedido", pedido.pedido).eq("status", "aprovada").is("email_enviado_em", null);
  if (error) throw Error("email_mark_" + error.code);
}
/** E-mail logo depois de gerar o Pix: valor, copia e cola e link pra voltar ao QR Code. Nunca derruba a criacao do Pix (quem chama captura o erro). */
async function emailPixGerado(pedidoId: string, nome: string, email: string, valor: number, venceISO: string, copiaECola: string): Promise<void> {
  if (!env("RESEND_API_KEY") || !env("HOTMART_EMAIL_FROM") || !copiaECola) return;
  const primeiro = nome.split(/\s+/)[0] || "aluno(a)";
  const ate = new Date(venceISO).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  const link = URL_PIX + "?pedido=" + pedidoId;
  const html = [
    '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#252525;max-width:520px">',
    "<h2>seu Pix do Passe Anual Robôterista está pronto</h2>",
    "<p>olá, " + htmlSeguro(primeiro) + "! seu Pix de <b>R$ " + valor.toFixed(2).replace(".", ",") + "</b> foi gerado e vale até <b>" + ate + "</b> (horário de Brasília).</p>",
    "<p>copie o código abaixo e cole no app do seu banco, na opção Pix copia e cola:</p>",
    '<p style="word-break:break-all;font-family:monospace;font-size:13px;background:#f4f4f4;padding:12px;border-radius:8px">' + htmlSeguro(copiaECola) + "</p>",
    '<p>prefere o QR Code? <a href="' + link + '">abra o seu Pix aqui</a>.</p>',
    "<p>assim que o pagamento for confirmado, o seu código de acesso chega por e-mail e também aparece na tela.</p>",
    '<p style="font-size:12px;color:#777">se você não pediu este Pix, é só ignorar este e-mail: sem pagamento, nada acontece.</p>',
    "<p>equipe Beaterista</p></div>",
  ].join("");
  const envio = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env("RESEND_API_KEY"),
      "Content-Type": "application/json",
      "Idempotency-Key": "mp-pix-gerado-" + pedidoId,
    },
    body: JSON.stringify({ from: env("HOTMART_EMAIL_FROM"), to: [email], subject: "seu Pix do Passe Anual Robôterista (vale por 30 minutos)", html }),
    signal: AbortSignal.timeout(8000),
  });
  if (!envio.ok) throw Error("email_pix_" + envio.status);
}
async function sincronizar(sb: ReturnType<typeof cliente>, payment: any): Promise<Pedido> {
  const pedidoId = String(payment?.external_reference || "");
  if (!/^[a-f0-9-]{36}$/i.test(pedidoId)) throw Error("invalid_reference");
  const { data: pedido, error } = await sb.from("mercadopago_passe_vendas")
    .select("pedido,pagamento_id,status,comprador_email,comprador_nome,codigo,email_enviado_em,valor")
    .eq("pedido", pedidoId).maybeSingle();
  if (error || !pedido) throw Error("order_missing");
  conferePagamento(payment, pedido as Pedido);
  const status = String(payment.status || "");
  if (["approved", "refunded", "charged_back", "cancelled", "rejected", "pending", "in_process", "authorized"].includes(status)) {
    let atualizacao = null;
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const { data, error: err } = await sb.rpc("mercadopago_passe_processar", {
        p_pedido: pedidoId, p_pagamento_id: String(payment.id),
        p_status: status, p_codigo: status === "approved" ? novoCodigo() : null,
        p_aprovada_em: status === "approved" ? payment.date_approved || null : null,
      });
      if (!err) { atualizacao = data; break; }
      if (err.code === "23505" && tentativa < 4) continue;
      throw Error("mp_rpc_" + err.code);
    }
    if (!atualizacao) throw Error("mp_rpc_failed");
  }
  const { data: atualizado, error: err2 } = await sb.from("mercadopago_passe_vendas")
    .select("pedido,pagamento_id,status,comprador_email,comprador_nome,codigo,email_enviado_em")
    .eq("pedido", pedidoId).single();
  if (err2 || !atualizado) throw Error("order_reload_failed");
  if (atualizado.status === "aprovada" && !atualizado.email_enviado_em) {
    await emailAcesso(sb, atualizado as Pedido);
    atualizado.email_enviado_em = new Date().toISOString();
  }
  return atualizado as Pedido;
}
function respostaPagamento(p: any) {
  const t = p?.point_of_interaction?.transaction_data || {};
  const ticket = typeof t.ticket_url === "string" && t.ticket_url.startsWith("https://") ? t.ticket_url : null;
  return {
    pagamento_status: String(p?.status || "pending"),
    ticket_url: ticket,
    qr_code: typeof t.qr_code === "string" ? t.qr_code : null,
    qr_code_base64: typeof t.qr_code_base64 === "string" ? t.qr_code_base64 : null,
  };
}
async function criar(req: Request, origem: string): Promise<Response> {
  if (!env("MP_ACCESS_TOKEN")) return resposta({ erro: "pix_nao_configurado" }, 503, origem);
  if (!env("HOTMART_EMAIL_FROM") || !env("RESEND_API_KEY")) return resposta({ erro: "email_nao_configurado" }, 503, origem);
  const raw = await req.text();
  if (raw.length > 4000) return resposta({ erro: "dados_invalidos" }, 413, origem);
  let body: any;
  try { body = JSON.parse(raw); } catch { return resposta({ erro: "dados_invalidos" }, 400, origem); }
  const nome = String(body?.nome || "").trim().replace(/\s+/g, " ");
  const email = normalizarEmail(body?.email);
  const cpf = String(body?.cpf || "").replace(/\D/g, "");
  if (nome.length < 2 || nome.length > 80 || !emailValido(email) || !cpfValido(cpf)) {
    return resposta({ erro: "verifique_nome_email_cpf" }, 422, origem);
  }
  const sb = cliente();
  // Limite simples por e-mail; para escala maior acrescentar Turnstile / quota por IP confiavel.
  const desde = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count, error: countErr } = await sb.from("mercadopago_passe_vendas")
    .select("pedido", { count: "exact", head: true }).eq("comprador_email", email).gte("criado_em", desde);
  if (countErr) throw Error("order_limit_error");
  if ((count || 0) >= 3) return resposta({ erro: "muitas_tentativas_tente_mais_tarde" }, 429, origem);
  // aviso por e-mail so no 1o Pix da hora pra cada e-mail (evita usar a nossa conta pra encher a caixa de alguem)
  const desde60 = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: count60, error: err60 } = await sb.from("mercadopago_passe_vendas")
    .select("pedido", { count: "exact", head: true }).eq("comprador_email", email).gte("criado_em", desde60);
  const enviarAviso = !err60 && (count60 || 0) === 0;
  const pedido = crypto.randomUUID();
  const valor = precoPixAgora(); // valor vigente neste instante; fica gravado no pedido
  const { error: insErr } = await sb.from("mercadopago_passe_vendas")
    .insert({ pedido, idempotencia: pedido, comprador_nome: nome, comprador_email: email, valor });
  if (insErr) throw Error("order_insert_" + insErr.code);
  const partes = nome.split(" ");
  const vence = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const payload = {
    transaction_amount: valor,
    payment_method_id: "pix",
    description: "Beaterista Play - Passe Anual Robôterista (12 meses)",
    external_reference: pedido,
    notification_url: env("SUPABASE_URL") + "/functions/v1/mercadopago-passe?hook=1",
    date_of_expiration: vence,
    payer: {
      email, first_name: partes[0],
      last_name: partes.slice(1).join(" ") || partes[0],
      identification: { type: "CPF", number: cpf },
    },
  };
  let r: Response;
  try {
    r = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env("MP_ACCESS_TOKEN"),
        "Content-Type": "application/json",
        "X-Idempotency-Key": pedido,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    // Poderia ter sido criado na MP mesmo sem resposta; o webhook ainda reconhece external_reference.
    return resposta({ erro: "falha_temporaria_ao_gerar_pix" }, 503, origem);
  }
  if (!r.ok) {
    console.error("mp_create_failure", r.status);
    await sb.from("mercadopago_passe_vendas").update({ status: "falhou", atualizado_em: new Date().toISOString() }).eq("pedido", pedido);
    return resposta({ erro: "falha_ao_gerar_pix" }, 502, origem);
  }
  const mp = await r.json();
  if (!mp?.id || mp?.payment_method_id !== "pix") throw Error("mp_bad_create_response");
  await sb.from("mercadopago_passe_vendas").update({ pagamento_id: String(mp.id), atualizado_em: new Date().toISOString() })
    .eq("pedido", pedido).eq("status", "pendente");
  const dadosPix = respostaPagamento(mp);
  if (enviarAviso && dadosPix.qr_code) {
    try { await emailPixGerado(pedido, nome, email, valor, vence, dadosPix.qr_code); } catch (e) { console.warn("email_pix_gerado_falhou", String(e).slice(0, 80)); }
  }
  return resposta({ pedido, valor, ...dadosPix }, 200, origem);
}
async function statusPedido(req: Request, origem: string): Promise<Response> {
  const raw = await req.text();
  if (raw.length > 1000) return resposta({ erro: "dados_invalidos" }, 400, origem);
  let body: any;
  try { body = JSON.parse(raw); } catch { return resposta({ erro: "dados_invalidos" }, 400, origem); }
  const pedidoId = String(body?.pedido || "");
  if (!/^[0-9a-f-]{36}$/i.test(pedidoId)) return resposta({ erro: "pedido_invalido" }, 400, origem);
  const sb = cliente();
  const { data, error } = await sb.from("mercadopago_passe_vendas")
    .select("pedido,pagamento_id,status,email_enviado_em,comprador_email,codigo").eq("pedido", pedidoId).maybeSingle();
  if (error || !data) return resposta({ erro: "pedido_nao_encontrado" }, 404, origem);
  let detalhe = {};
  let pedido = data;
  if (data.pagamento_id && env("MP_ACCESS_TOKEN")) {
    const payment = await mpPagamento(data.pagamento_id);
    const atualizado = await sincronizar(sb, payment);
    pedido = atualizado;
    // Server-side reconciliation needs no QR code or payment link in its response.
    if (body?.somente_status !== true) detalhe = respostaPagamento(payment);
  }
  // o codigo aparece na tela so pra quem informou o MESMO e-mail do pedido (o pedido em si e um UUID que so o comprador tem)
  const emailInformado = normalizarEmail(body?.email);
  const codigo = pedido.status === "aprovada" && pedido.codigo && emailInformado && emailInformado === normalizarEmail(pedido.comprador_email) ? pedido.codigo : null;
  return resposta({
    status: pedido.status, email_enviado: !!pedido.email_enviado_em,
    ...(codigo ? { codigo } : {}),
    ...detalhe,
  }, 200, origem);
}
async function webhook(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.searchParams.get("data.id") || "";
  const tipo = url.searchParams.get("type") || url.searchParams.get("topic") || "";
  if (tipo !== "payment") return resposta({ ok: true, ignorado: true });
  if (!/^\d{4,25}$/.test(id)) {
    console.warn("mp_webhook_signature_rejected", "payment_id_invalid");
    return resposta({ erro: "assinatura_invalida" }, 401);
  }
  if (!(await assinaturaValida(req, id))) {
    return resposta({ erro: "assinatura_invalida" }, 401);
  }
  const mp = await mpPagamento(id);
  const sb = cliente();
  try {
    await sincronizar(sb, mp);
    return resposta({ ok: true });
  } catch (e) {
    if (String(e).includes("order_missing") || String(e).includes("invalid_reference")) {
      // Notificacao de outro produto/conta: nao emitir codigo e nao ficar reprocessando.
      return resposta({ ok: true, ignorado: true });
    }
    throw e;
  }
}

Deno.serve(async (req: Request) => {
  const origem = req.headers.get("origin") || "";
  const url = new URL(req.url);
  const ehWebhook = url.searchParams.has("hook");
  if (req.method === "OPTIONS") {
    if (origem && !ORIGENS.has(origem)) return resposta({ erro: "origem_nao_permitida" }, 403);
    return new Response(null, { status: 204, headers: {
      "Access-Control-Allow-Origin": ORIGENS.has(origem) ? origem : "",
      "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type",
    } });
  }
  if (req.method !== "POST") return resposta({ erro: "method_not_allowed" }, 405, origem);
  if (!ehWebhook && origem && !ORIGENS.has(origem)) return resposta({ erro: "origem_nao_permitida" }, 403);
  try {
    if (ehWebhook) return await webhook(req);
    const modo = url.searchParams.get("acao") || "";
    if (modo === "criar") return await criar(req, origem);
    if (modo === "status") return await statusPedido(req, origem);
    return resposta({ erro: "acao_invalida" }, 400, origem);
  } catch (e) {
    console.error("mercadopago_passe_error", String(e).slice(0, 160));
    return resposta({ erro: "falha_temporaria" }, 503, origem);
  }
});

// Edge Function `hotmart-passe`. Deploy SEM verificação de JWT (a Hotmart não manda JWT; a autenticação é o hottok):
//   supabase functions deploy hotmart-passe --no-verify-jwt --project-ref fnxgjxatremjdxaqmswu
// URL do webhook: https://fnxgjxatremjdxaqmswu.supabase.co/functions/v1/hotmart-passe
// Segredos: supabase secrets set HOTMART_HOTTOK=... HOTMART_PRODUCT_IDS=... RESEND_API_KEY=... MAIL_FROM=... ADMIN_TOKEN=...
// @ts-nocheck
import { criarHandler } from './passe-core.mjs';

Deno.serve(criarHandler({ env: Deno.env.toObject() }));

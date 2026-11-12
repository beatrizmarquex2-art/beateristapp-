// Confere se um código entra no site (chama a mesma função do campo "Código de acesso": aluno_acesso). Uso:
//   node scripts/passe-testar.mjs HOTMARTREV            (código do revisor da Hotmart)
//   node scripts/passe-testar.mjs PXXXXXXXXX            (código de um comprador)
// Mostra ok/motivo e a validade. Conta como um uso do código (e ocupa 1 vaga de aparelho de teste).
import { CONFIG } from '../js/config.js';
const code = String(process.argv[2] || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
if (!code) { console.error('uso: node scripts/passe-testar.mjs CODIGO'); process.exit(2); }
const url = process.env.SUPABASE_URL || CONFIG.SUPABASE_URL; const key = process.env.SUPABASE_ANON_KEY || CONFIG.SUPABASE_ANON_KEY;
const r = await fetch(`${url}/rest/v1/rpc/aluno_acesso`, { method: 'POST', headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify({ p_code: code, p_aparelho: `teste-cli-${code}`.slice(0, 40).padEnd(8, 'x'), p_ua: 'passe-testar.mjs' }) }).catch((e) => { console.error(`sem rede até o Supabase (${e.cause?.code || e.message}). Se estiver atrás de proxy, rode com NODE_USE_ENV_PROXY=1.`); process.exit(3); });
const j = await r.json().catch(() => ({}));
console.log(r.status, JSON.stringify(j));
if (j.ok) console.log(`✔ entra. tipo: ${j.tipo} · nome: ${j.nome} · vale até: ${j.expira_em || 'sem data'}`);
else console.log(`✘ não entra (${j.motivo || j.message || 'erro'}). vencido = passou da data; codigo = não existe ou foi desativado; aparelhos = passou do limite de aparelhos.`);
process.exit(j.ok ? 0 : 1);

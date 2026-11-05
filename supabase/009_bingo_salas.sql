-- Bingo Musical online (2 jogadores). O SERVIDOR é a autoridade: sorteio, marcas, vitória e empate são decididos aqui.
-- As tabelas são fechadas (RLS ligada, sem acesso direto); o app só chama as funções bingo_* abaixo (RPC, chave anon, sem login).
-- Casas da cartela (grade 3x3, índices 0..8 em ordem de linha): linhas {0,1,2} {3,4,5} {6,7,8}; colunas {0,3,6} {1,4,7} {2,5,8};
-- diagonais {0,4,8} {2,4,6}. Sem casa central livre.
-- Regra de saída do convidado: o convidado que sai libera o slot 1 e a sala volta ao 'lobby' (rodada zerada); o anfitrião que sai apaga a sala.

-- temas: ids (strings) de cada tema, iguais a assets/bingo/temas.json e assets/bingo/artistas.json (gerado por script)
create table if not exists public.bingo_temas (
  tema text primary key,
  ids text[] not null
);
alter table public.bingo_temas enable row level security;
revoke all on public.bingo_temas from anon, authenticated;

insert into public.bingo_temas(tema, ids) values
  ('instrumentos', array['bateria','violao','guitarra','baixo','teclado','piano','pandeiro','cajon','triangulo','tamborim','agogô','saxofone','trompete','flauta','violino','ukulele']::text[]),
  ('pecas', array['bumbo','caixa','chimbal','tom1','tom2','surdo','ride','crash','pedal_bumbo','pedal_chimbal','baquetas','banco','maquina_chimbal','estante_prato','pele','aro']::text[]),
  ('figuras', array['semibreve','minima','seminima','colcheia','semicolcheia','pausa_semibreve','pausa_minima','pausa_seminima','pausa_colcheia','pausa_semicolcheia','duas_colcheias','quatro_semicolcheias','minima_pontuada','seminima_pontuada','colcheia_pontuada','duas_semicolcheias']::text[]),
  ('simbolos', array['clave_sol','clave_fa','sustenido','bemol','bequadro','fermata','ponto_aumento','ligadura_prolongamento','staccato','acento','crescendo','decrescendo','barra_dupla','ritornello','compasso_3_4','compasso_4_4']::text[]),
  ('artistas', array['s001','s002','s003','s004','s005','s006','s007','s008','s009','s010','s011','s012','s013','s014','s015','s016','s017','s018','s019','s020','s021','s022','s023','s024','s025','s026','s027','s028','s029','s030','s031','s032','s033','s034','s035','s036','s037','s038','s039','s040','s041','s042','s043','s044','s045','s046','s047','s048','s049','s050','s051','s052','s053','s054','s055','s056','s057','s058','s059','s060','s061','s062','s063','s064','s065','s066','s067','s068','s069','s070','s071','s072','s073','s074','s075','s076','s077','s078','s079','s080','s081','s082','s083','s084','s085','s086']::text[])
on conflict (tema) do update set ids = excluded.ids;

create table if not exists public.bingo_salas (
  code text primary key check (code ~ '^[A-HJKMNP-Z2-9]{6}$'),
  tema text not null references public.bingo_temas(tema),
  perfil text not null check (perfil in ('kids','classico')),
  vitoria text not null check (vitoria in ('qualquer','horizontal','vertical','diagonal')),
  modo text not null check (modo in ('manual','auto')),
  intervalo int not null check (intervalo between 5 and 60),
  auto_marcar boolean not null default false,
  status text not null default 'lobby' check (status in ('lobby','jogando','fim')),
  pool text[],                       -- ids da rodada (16, ou 18 sorteados dos 86 em 'artistas')
  seq text[],                        -- ordem do sorteio (SECRETA: só o prefixo seq[1..idx] sai nas respostas)
  idx int not null default 0,        -- quantos já foram sorteados
  pausado boolean not null default false,
  resultado jsonb,
  ver int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  iniciou_em timestamptz,
  sorteou_em timestamptz
);
alter table public.bingo_salas enable row level security;
revoke all on public.bingo_salas from anon, authenticated;

create table if not exists public.bingo_jogadores (
  code text not null references public.bingo_salas(code) on delete cascade,
  slot int not null check (slot in (0,1)),
  token text not null unique,
  nome text not null check (char_length(nome) between 1 and 20),
  cartela text[],                    -- 9 ids distintos do pool
  marcas boolean[],                  -- 9 marcas
  ping timestamptz not null default now(),
  vis_presente boolean not null default true,  -- última presença vista pelo outro (para avisar a mudança por ver)
  completou_em int,                  -- sorteio (idx) em que a 1ª linha válida ficou toda sorteada
  primary key (code, slot)
);
alter table public.bingo_jogadores enable row level security;
revoke all on public.bingo_jogadores from anon, authenticated;

-- ---------- auxiliares internas (sem grant: só as funções abaixo chamam) ----------

-- linhas válidas conforme a condição de vitória (índices 0..8)
create or replace function public._bingo_linhas(p_vit text)
returns setof int[] language sql immutable set search_path = public as $$
  select v.l from (values
    (1, array[0,1,2]), (2, array[3,4,5]), (3, array[6,7,8]),
    (4, array[0,3,6]), (5, array[1,4,7]), (6, array[2,5,8]),
    (7, array[0,4,8]), (8, array[2,4,6])) v(n, l)
  where case p_vit when 'qualquer' then true when 'horizontal' then v.n <= 3
                   when 'vertical' then v.n between 4 and 6 when 'diagonal' then v.n >= 7 else false end
  order by v.n;
$$;

-- primeira linha cujas 3 casas estão sorteadas (e marcadas, se p_marcas não for nulo); null se não houver
create or replace function public._bingo_tem_linha(p_cartela text[], p_sorteados text[], p_marcas boolean[], p_vit text)
returns int[] language plpgsql stable set search_path = public as $$
declare l int[]; ok boolean; i int;
begin
  if p_cartela is null then return null; end if;
  for l in select x from public._bingo_linhas(p_vit) x loop
    ok := true;
    foreach i in array l loop
      if not (p_cartela[i + 1] = any(coalesce(p_sorteados, '{}'::text[]))) or (p_marcas is not null and not coalesce(p_marcas[i + 1], false)) then ok := false; exit; end if;
    end loop;
    if ok then return l; end if;
  end loop;
  return null;
end $$;

-- Fisher-Yates uniforme
create or replace function public._bingo_embaralhar(p_a text[])
returns text[] language plpgsql volatile set search_path = public as $$
declare a text[] := p_a; i int; j int; t text;
begin
  if a is null then return null; end if;
  for i in reverse coalesce(array_length(a, 1), 0)..2 loop
    j := 1 + floor(random() * i)::int;
    t := a[i]; a[i] := a[j]; a[j] := t;
  end loop;
  return a;
end $$;

-- confere código + token e devolve o slot; erro simples se algo não bate
create or replace function public._bingo_auth(p_code text, p_token text)
returns int language plpgsql stable security definer set search_path = public as $$
declare s int;
begin
  select j.slot into s from public.bingo_jogadores j where j.code = upper(btrim(coalesce(p_code, ''))) and j.token = p_token and p_token is not null;
  if s is null then raise exception 'sala ou token inválido'; end if;
  return s;
end $$;

-- o estado que o cliente enxerga (nunca inclui seq inteira nem a cartela do outro antes do fim)
create or replace function public._bingo_json(p_code text, p_slot int)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare s public.bingo_salas; me public.bingo_jogadores; ou public.bingo_jogadores; r jsonb; jogo boolean;
begin
  select * into s from public.bingo_salas where code = p_code;
  if not found then raise exception 'sala não encontrada'; end if;
  select * into me from public.bingo_jogadores where code = p_code and slot = p_slot;
  select * into ou from public.bingo_jogadores where code = p_code and slot = 1 - p_slot;
  jogo := s.status in ('jogando', 'fim');
  r := jsonb_build_object(
    'ver', s.ver, 'status', s.status,
    'config', jsonb_build_object('tema', s.tema, 'perfil', s.perfil, 'vitoria', s.vitoria, 'modo', s.modo, 'intervalo', s.intervalo, 'auto_marcar', s.auto_marcar),
    'eu', jsonb_build_object('slot', me.slot, 'nome', me.nome,
                             'cartela', case when jogo then to_jsonb(me.cartela) end,
                             'marcas', case when jogo then to_jsonb(me.marcas) end),
    'outro', case when ou.slot is null then null else jsonb_build_object('nome', ou.nome, 'presente', ou.ping > now() - interval '20 seconds') end,
    'host', me.slot = 0,
    'pool', case when jogo then to_jsonb(s.pool) else '[]'::jsonb end,
    'sorteados', to_jsonb(coalesce(s.seq[1:s.idx], '{}'::text[])),
    'total', coalesce(array_length(s.seq, 1), 0),
    'idx', s.idx, 'pausado', s.pausado, 'resultado', s.resultado);
  if s.status = 'fim' then
    r := r || jsonb_build_object(
      'cartelas', jsonb_build_array(to_jsonb(case when me.slot = 0 then me.cartela else ou.cartela end), to_jsonb(case when me.slot = 0 then ou.cartela else me.cartela end)),
      'marcas', jsonb_build_array(to_jsonb(case when me.slot = 0 then me.marcas else ou.marcas end), to_jsonb(case when me.slot = 0 then ou.marcas else me.marcas end)));
  end if;
  return r;
end $$;

-- ---------- funções públicas ----------

-- 1) cria a sala; quem cria é o anfitrião (slot 0)
create or replace function public.bingo_criar(p_nome text, p_tema text, p_perfil text, p_vitoria text, p_modo text, p_intervalo int, p_auto_marcar bool)
returns table(code text, token text, slot int) language plpgsql security definer set search_path = public as $$
declare
  abc constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   -- sem 0 O 1 I L
  c text; tk text; i int; n text; tentativas int := 0;
begin
  n := btrim(coalesce(p_nome, ''));
  if char_length(n) < 1 or char_length(n) > 20 then raise exception 'nome inválido'; end if;
  if not exists (select 1 from public.bingo_temas t where t.tema = p_tema)
     or p_perfil is null or p_perfil not in ('kids', 'classico')
     or p_vitoria is null or p_vitoria not in ('qualquer', 'horizontal', 'vertical', 'diagonal')
     or p_modo is null or p_modo not in ('manual', 'auto')
     or p_intervalo is null or p_intervalo < 5 or p_intervalo > 60 then
    raise exception 'dados inválidos';
  end if;
  delete from public.bingo_salas s where s.updated_at < now() - interval '1 day';
  if (select count(*) from public.bingo_salas) > 20000 then raise exception 'servidor cheio, tente mais tarde'; end if;
  loop
    tentativas := tentativas + 1;
    if tentativas > 50 then raise exception 'não consegui criar a sala'; end if;
    c := '';
    for i in 1..6 loop c := c || substr(abc, 1 + floor(random() * length(abc))::int, 1); end loop;
    begin
      insert into public.bingo_salas(code, tema, perfil, vitoria, modo, intervalo, auto_marcar)
        values (c, p_tema, p_perfil, p_vitoria, p_modo, p_intervalo, coalesce(p_auto_marcar, false));
      exit;
    exception when unique_violation then null;
    end;
  end loop;
  tk := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.bingo_jogadores(code, slot, token, nome) values (c, 0, tk, n);
  return query select c, tk, 0;
end $$;

-- 2) o segundo jogador entra (slot 1)
create or replace function public.bingo_entrar(p_code text, p_nome text)
returns table(token text, slot int) language plpgsql security definer set search_path = public as $$
declare c text := upper(btrim(coalesce(p_code, ''))); n text := btrim(coalesce(p_nome, '')); s public.bingo_salas; tk text;
begin
  if char_length(n) < 1 or char_length(n) > 20 then raise exception 'nome inválido'; end if;
  select * into s from public.bingo_salas b where b.code = c for update;
  if not found then raise exception 'sala não encontrada'; end if;
  if s.status = 'fim' then raise exception 'sala encerrada'; end if;
  if exists (select 1 from public.bingo_jogadores j where j.code = c and j.slot = 1) then raise exception 'sala cheia'; end if;
  tk := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.bingo_jogadores(code, slot, token, nome) values (c, 1, tk, n);
  update public.bingo_salas b set ver = b.ver + 1, updated_at = now() where b.code = c;
  return query select tk, 1;
end $$;

-- 3) inicia a rodada (também serve de revanche quando status = 'fim'): pool/seq/cartelas novos
create or replace function public.bingo_iniciar(p_code text, p_token text)
returns void language plpgsql security definer set search_path = public as $$
declare
  c text := upper(btrim(coalesce(p_code, ''))); me int; s public.bingo_salas;
  ids text[]; pl text[]; c0 text[]; c1 text[]; k int := 0;
begin
  me := public._bingo_auth(c, p_token);
  select * into s from public.bingo_salas b where b.code = c for update;
  if me <> 0 then raise exception 'só o anfitrião pode iniciar'; end if;
  if s.status = 'jogando' then raise exception 'o jogo já começou'; end if;
  if (select count(*) from public.bingo_jogadores j where j.code = c) <> 2 then raise exception 'precisa de 2 jogadores'; end if;
  select t.ids into ids from public.bingo_temas t where t.tema = s.tema;
  if s.tema = 'artistas' then pl := (public._bingo_embaralhar(ids))[1:18]; else pl := ids; end if;
  c0 := (public._bingo_embaralhar(pl))[1:9];
  loop
    c1 := (public._bingo_embaralhar(pl))[1:9];
    exit when c1 <> c0;
    k := k + 1; exit when k > 20;
  end loop;
  update public.bingo_jogadores j set cartela = case j.slot when 0 then c0 else c1 end,
         marcas = array_fill(false, array[9]), completou_em = null, vis_presente = true, ping = now()
    where j.code = c;
  update public.bingo_salas b set status = 'jogando', pool = pl, seq = public._bingo_embaralhar(pl), idx = 0,
         pausado = false, resultado = null, ver = b.ver + 1, updated_at = now(), iniciou_em = now(), sorteou_em = null
    where b.code = c;
end $$;

-- 4) estado atual (NULL se p_ver já é a versão atual); sempre atualiza o ping de quem chama
create or replace function public.bingo_estado(p_code text, p_token text, p_ver int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c text := upper(btrim(coalesce(p_code, ''))); me int; v int; ou public.bingo_jogadores; pres boolean;
begin
  me := public._bingo_auth(c, p_token);
  update public.bingo_jogadores j set ping = now() where j.code = c and j.slot = me;
  select * into ou from public.bingo_jogadores j where j.code = c and j.slot = 1 - me;
  if found then
    pres := ou.ping > now() - interval '20 seconds';
    if pres is distinct from ou.vis_presente then
      update public.bingo_jogadores j set vis_presente = pres where j.code = c and j.slot = ou.slot;
      update public.bingo_salas b set ver = b.ver + 1 where b.code = c;   -- avisa a mudança de presença
    end if;
  end if;
  select b.ver into v from public.bingo_salas b where b.code = c;
  if v is null then raise exception 'sala não encontrada'; end if;
  if p_ver is not null and p_ver = v then return null; end if;
  return public._bingo_json(c, me);
end $$;

-- 5) sorteia o próximo (só o anfitrião; idempotente por p_idx)
create or replace function public.bingo_sortear(p_code text, p_token text, p_idx int, p_auto bool default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c text := upper(btrim(coalesce(p_code, ''))); me int; s public.bingo_salas; novo text; ni int; r record; ses text[]; ou_ping timestamptz;
begin
  me := public._bingo_auth(c, p_token);
  select * into s from public.bingo_salas b where b.code = c for update;
  if me <> 0 then raise exception 'só o anfitrião pode sortear'; end if;
  if s.status = 'lobby' then raise exception 'o jogo ainda não começou'; end if;
  if s.status <> 'jogando' or s.pausado or p_idx is distinct from s.idx or s.idx >= coalesce(array_length(s.seq, 1), 0) then
    return public._bingo_json(c, me);
  end if;
  if coalesce(p_auto, false) then
    select j.ping into ou_ping from public.bingo_jogadores j where j.code = c and j.slot = 1;
    if ou_ping is null or ou_ping < now() - interval '20 seconds' then return public._bingo_json(c, me); end if;
  end if;
  ni := s.idx + 1; novo := s.seq[ni]; ses := s.seq[1:ni];
  if s.auto_marcar then
    update public.bingo_jogadores j set marcas = array(select (j.cartela[k] = novo) or coalesce(j.marcas[k], false) from generate_series(1, 9) k order by k)
      where j.code = c and j.cartela is not null;
  end if;
  for r in select j.slot, j.cartela from public.bingo_jogadores j where j.code = c and j.completou_em is null and j.cartela is not null loop
    if public._bingo_tem_linha(r.cartela, ses, null, s.vitoria) is not null then
      update public.bingo_jogadores j set completou_em = ni where j.code = c and j.slot = r.slot;
    end if;
  end loop;
  update public.bingo_salas b set idx = ni, ver = b.ver + 1, updated_at = now(), sorteou_em = now() where b.code = c;
  return public._bingo_json(c, me);
end $$;

-- 6) marca/desmarca uma casa (só marca se o id já foi sorteado)
create or replace function public.bingo_marcar(p_code text, p_token text, p_cel int, p_valor bool)
returns void language plpgsql security definer set search_path = public as $$
declare c text := upper(btrim(coalesce(p_code, ''))); me int; s public.bingo_salas; j public.bingo_jogadores; v boolean := coalesce(p_valor, false);
begin
  me := public._bingo_auth(c, p_token);
  if p_cel is null or p_cel < 0 or p_cel > 8 then raise exception 'casa inválida'; end if;
  select * into s from public.bingo_salas b where b.code = c for update;
  if s.status <> 'jogando' then return; end if;
  select * into j from public.bingo_jogadores x where x.code = c and x.slot = me;
  if j.cartela is null then return; end if;
  if v and not (j.cartela[p_cel + 1] = any(coalesce(s.seq[1:s.idx], '{}'::text[]))) then raise exception 'esse item ainda não saiu'; end if;
  if coalesce(j.marcas[p_cel + 1], false) = v then return; end if;
  update public.bingo_jogadores x set marcas[p_cel + 1] = v where x.code = c and x.slot = me;
  update public.bingo_salas b set ver = b.ver + 1, updated_at = now() where b.code = c;
end $$;

-- 7) pausa/retoma o sorteio (só o anfitrião)
create or replace function public.bingo_pausar(p_code text, p_token text, p_pausa bool)
returns void language plpgsql security definer set search_path = public as $$
declare c text := upper(btrim(coalesce(p_code, ''))); me int; s public.bingo_salas; v boolean := coalesce(p_pausa, false);
begin
  me := public._bingo_auth(c, p_token);
  select * into s from public.bingo_salas b where b.code = c for update;
  if me <> 0 then raise exception 'só o anfitrião pode pausar'; end if;
  if s.status <> 'jogando' or s.pausado = v then return; end if;
  update public.bingo_salas b set pausado = v, ver = b.ver + 1, updated_at = now() where b.code = c;
end $$;

-- 8) BINGO! o servidor confere (linha toda sorteada E marcada). Empate se o outro completou no mesmo sorteio.
create or replace function public.bingo_bingo(p_code text, p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c text := upper(btrim(coalesce(p_code, ''))); me int; s public.bingo_salas; a public.bingo_jogadores; o public.bingo_jogadores;
  ses text[]; la int[]; lo int[]; res jsonb;
begin
  me := public._bingo_auth(c, p_token);
  select * into s from public.bingo_salas b where b.code = c for update;   -- serializa pedidos simultâneos
  if s.status = 'fim' then return public._bingo_json(c, me); end if;
  if s.status <> 'jogando' then raise exception 'o jogo ainda não começou'; end if;
  select * into a from public.bingo_jogadores j where j.code = c and j.slot = me;
  select * into o from public.bingo_jogadores j where j.code = c and j.slot = 1 - me;
  ses := coalesce(s.seq[1:s.idx], '{}'::text[]);
  la := public._bingo_tem_linha(a.cartela, ses, a.marcas, s.vitoria);
  if la is null then return public._bingo_json(c, me) || jsonb_build_object('erro', 'invalido'); end if;
  lo := public._bingo_tem_linha(o.cartela, ses, null, s.vitoria);
  if lo is not null and o.completou_em is not distinct from coalesce(a.completou_em, s.idx) then
    res := jsonb_build_object('tipo', 'empate', 'vencedores', jsonb_build_array(0, 1),
             'linhas', jsonb_build_object(me::text, to_jsonb(la), o.slot::text, to_jsonb(lo)));
  else
    res := jsonb_build_object('tipo', 'vitoria', 'vencedores', jsonb_build_array(me), 'linhas', jsonb_build_object(me::text, to_jsonb(la)));
  end if;
  update public.bingo_salas b set status = 'fim', resultado = res, pausado = false, ver = b.ver + 1, updated_at = now() where b.code = c;
  return public._bingo_json(c, me);
end $$;

-- 9) sai da sala: anfitrião apaga a sala; convidado libera o slot 1 e a sala volta ao 'lobby' (rodada zerada)
create or replace function public.bingo_sair(p_code text, p_token text)
returns void language plpgsql security definer set search_path = public as $$
declare c text := upper(btrim(coalesce(p_code, ''))); me int;
begin
  me := public._bingo_auth(c, p_token);
  perform 1 from public.bingo_salas b where b.code = c for update;
  if me = 0 then
    delete from public.bingo_salas b where b.code = c;
  else
    delete from public.bingo_jogadores j where j.code = c and j.slot = 1;
    update public.bingo_jogadores j set cartela = null, marcas = null, completou_em = null where j.code = c;
    update public.bingo_salas b set status = 'lobby', pool = null, seq = null, idx = 0, pausado = false, resultado = null,
           ver = b.ver + 1, updated_at = now() where b.code = c;
  end if;
end $$;

revoke all on function public._bingo_linhas(text), public._bingo_tem_linha(text[], text[], boolean[], text), public._bingo_embaralhar(text[]),
  public._bingo_auth(text, text), public._bingo_json(text, int) from public, anon, authenticated;
revoke all on function public.bingo_criar(text, text, text, text, text, int, bool), public.bingo_entrar(text, text), public.bingo_iniciar(text, text),
  public.bingo_estado(text, text, int), public.bingo_sortear(text, text, int, bool), public.bingo_marcar(text, text, int, bool),
  public.bingo_pausar(text, text, bool), public.bingo_bingo(text, text), public.bingo_sair(text, text) from public;
grant execute on function public.bingo_criar(text, text, text, text, text, int, bool), public.bingo_entrar(text, text), public.bingo_iniciar(text, text),
  public.bingo_estado(text, text, int), public.bingo_sortear(text, text, int, bool), public.bingo_marcar(text, text, int, bool),
  public.bingo_pausar(text, text, bool), public.bingo_bingo(text, text), public.bingo_sair(text, text) to anon, authenticated;

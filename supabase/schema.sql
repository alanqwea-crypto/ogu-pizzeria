-- =========================================================
-- 오구 피제리아 고객센터 데이터베이스
-- Supabase 대시보드 > SQL Editor 에 전체를 붙여넣고 Run 하세요.
-- 여러 번 실행해도 안전하도록 작성했습니다.
-- =========================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- 관리자 ----------
-- Supabase Auth 에서 만든 사용자 중, 이 표에 있는 사람만 관리자입니다.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins
  for select using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------- 공지사항 ----------
create table if not exists public.notices (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) between 1 and 10000),
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.notices enable row level security;
drop policy if exists "notices public read" on public.notices;
drop policy if exists "notices admin write" on public.notices;
create policy "notices public read" on public.notices
  for select using (true);
create policy "notices admin write" on public.notices
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- FAQ ----------
create table if not exists public.faqs (
  id bigint generated always as identity primary key,
  category text not null check (category in ('일반', '예약', '주문', '배달', '매장')),
  question text not null check (char_length(question) between 1 and 300),
  answer text not null check (char_length(answer) between 1 and 5000),
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.faqs enable row level security;
drop policy if exists "faqs public read" on public.faqs;
drop policy if exists "faqs admin write" on public.faqs;
create policy "faqs public read" on public.faqs
  for select using (true);
create policy "faqs admin write" on public.faqs
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- 1:1 문의 ----------
-- 고객은 표에 직접 접근할 수 없고, 아래 함수(create_inquiry 등)로만 쓰고 읽습니다.
create table if not exists public.inquiries (
  id bigint generated always as identity primary key,
  category text not null default '일반' check (category in ('일반', '예약', '주문', '배달', '매장')),
  name text not null check (char_length(name) between 1 and 30),
  phone text not null check (phone ~ '^[0-9-]{9,13}$'),
  title text not null check (char_length(title) between 1 and 100),
  content text not null check (char_length(content) between 1 and 2000),
  password_hash text not null,
  answer text check (answer is null or char_length(answer) <= 5000),
  answered_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.inquiries enable row level security;
drop policy if exists "inquiries admin read" on public.inquiries;
drop policy if exists "inquiries admin update" on public.inquiries;
drop policy if exists "inquiries admin delete" on public.inquiries;
create policy "inquiries admin read" on public.inquiries
  for select using (public.is_admin());
create policy "inquiries admin update" on public.inquiries
  for update using (public.is_admin()) with check (public.is_admin());
create policy "inquiries admin delete" on public.inquiries
  for delete using (public.is_admin());

-- 비밀번호 대입 공격을 막기 위한 실패 기록
create table if not exists public.inquiry_attempts (
  inquiry_id bigint not null references public.inquiries (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.inquiry_attempts enable row level security;

-- 문의 작성 (로그인 없이)
create or replace function public.create_inquiry(
  p_category text, p_name text, p_phone text, p_title text, p_content text, p_password text
)
returns bigint
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  new_id bigint;
begin
  if char_length(coalesce(p_password, '')) < 4 then
    raise exception '비밀번호는 4자 이상 입력해 주세요.';
  end if;
  if (select count(*) from inquiries where phone = p_phone and created_at > now() - interval '1 day') >= 3 then
    raise exception '같은 연락처로는 하루 3건까지 문의할 수 있습니다.';
  end if;
  if (select count(*) from inquiries where created_at > now() - interval '10 minutes') >= 20 then
    raise exception '문의가 많아 잠시 후 다시 시도해 주세요.';
  end if;

  insert into inquiries (category, name, phone, title, content, password_hash)
  values (p_category, trim(p_name), p_phone, trim(p_title), trim(p_content), crypt(p_password, gen_salt('bf')))
  returning id into new_id;
  return new_id;
end;
$$;

-- 문의 목록 (누구나: 내용·제목은 숨기고 상태만)
create or replace function public.list_inquiries(p_limit int default 15, p_offset int default 0)
returns table (id bigint, category text, name_masked text, answered boolean, created_at timestamptz, total bigint)
language sql stable security definer
set search_path = public
as $$
  select i.id, i.category,
         left(i.name, 1) || repeat('*', greatest(char_length(i.name) - 1, 1)),
         i.answer is not null, i.created_at, count(*) over ()
  from inquiries i
  order by i.id desc
  limit least(greatest(p_limit, 1), 50) offset greatest(p_offset, 0);
$$;

-- 내 문의 보기 (비밀번호 확인, 10분에 5번 틀리면 잠시 잠김)
create or replace function public.get_my_inquiry(p_id bigint, p_password text)
returns table (id bigint, category text, title text, content text, answer text, answered_at timestamptz, created_at timestamptz)
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  if (select count(*) from inquiry_attempts a
      where a.inquiry_id = p_id and a.created_at > now() - interval '10 minutes') >= 5 then
    raise exception '비밀번호를 여러 번 틀렸습니다. 10분 후 다시 시도해 주세요.';
  end if;

  return query
    select i.id, i.category, i.title, i.content, i.answer, i.answered_at, i.created_at
    from inquiries i
    where i.id = p_id and i.password_hash = crypt(p_password, i.password_hash);

  if not found then
    insert into inquiry_attempts (inquiry_id)
    select p_id where exists (select 1 from inquiries where inquiries.id = p_id);
  end if;
end;
$$;

revoke all on function public.create_inquiry(text, text, text, text, text, text) from public;
revoke all on function public.list_inquiries(int, int) from public;
revoke all on function public.get_my_inquiry(bigint, text) from public;
grant execute on function public.create_inquiry(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.list_inquiries(int, int) to anon, authenticated;
grant execute on function public.get_my_inquiry(bigint, text) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- 처음 넣어 둘 FAQ (이미 있으면 건너뜀) ----------
insert into public.faqs (category, question, answer, sort)
select * from (values
  ('예약', '예약은 어떻게 하나요?', '네이버 예약으로 런치(11:00–15:00)와 디너(17:00–21:00)를 각각 예약하실 수 있습니다. 홈페이지 상단의 [예약하기] 버튼을 눌러 주세요.', 1),
  ('매장', '영업시간과 휴무일이 궁금해요.', '매일 11:00–23:00 영업하며 연중무휴입니다. 브레이크타임은 15:00–17:00, 라스트오더는 21:00입니다.', 2),
  ('매장', '주차가 가능한가요?', '서초꽃마을주얼리 지하주차장을 이용하실 수 있으며, 1시간 30분 무료입니다.', 3),
  ('매장', '매장 위치는 어디인가요?', '서울 서초구 반포대로27길 13 1층입니다. 2호선 서초역 3번 출구에서 걸어서 3분 거리입니다.', 4),
  ('배달', '배달 주문도 되나요?', '배달의민족과 쿠팡이츠에서 주문하실 수 있습니다. 홈페이지의 주문 바로가기를 이용해 주세요.', 5)
) as seed (category, question, answer, sort)
where not exists (select 1 from public.faqs);

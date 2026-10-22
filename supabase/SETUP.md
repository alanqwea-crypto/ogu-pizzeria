# 고객센터 Supabase 설정 순서

## 1. 프로젝트 만들기
1. https://supabase.com/dashboard 에서 **New project**
2. 이름: `ogu-pizzeria`, Region: **Northeast Asia (Seoul)**
3. Database Password 는 따로 안전하게 보관 (사이트에는 쓰지 않음)

## 2. 데이터베이스 만들기
1. 왼쪽 메뉴 **SQL Editor** → New query
2. `supabase/schema.sql` 내용을 전부 붙여넣고 **Run**

## 3. 회원가입 설정 (선택)
- 관리자 권한은 `admins` 표에 등록된 계정에만 생기므로, 회원가입을 열어 두어도
  다른 계정은 고객센터를 관리할 수 없습니다.
- 쓰지 않는 계정이 쌓이는 게 싫다면 **Authentication → Sign In / Providers → Email** 에서
  `Allow new users to sign up` 을 끄면 됩니다.

## 4. 관리자 계정 만들기
1. **Authentication → Users → Add user → Create new user**
   - 이메일, 비밀번호 입력 / `Auto Confirm User` 체크
2. SQL Editor 에서 실행 (이메일만 바꿔서):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = '관리자이메일@example.com';
   ```
3. 관리자를 추가할 때마다 1~2를 반복

## 5. 사이트에 연결
- **Project Settings → API** 에서 두 값을 복사해 `js/config.js` 에 넣기
  - Project URL → `SUPABASE_URL`
  - `anon` `public` 키 → `SUPABASE_ANON_KEY`
- `service_role` 키는 절대 사이트에 넣지 않기

## 관리자 사용법
- 사이트 맨 아래 **관리자** 링크(`admin.html`)에서 로그인
- 로그인하면 고객센터에 작성·수정·삭제·답변 버튼이 나타남
- 끝나면 상단 **로그아웃**

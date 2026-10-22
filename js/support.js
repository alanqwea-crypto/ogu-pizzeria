// 고객센터: 공지사항 / FAQ / 1:1 문의 (Supabase)
const CATEGORIES = ['일반', '예약', '주문', '배달', '매장'];
const PAGE_SIZE = 15;

const cfg = window.OGU_CONFIG || {};
const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes('YOUR-PROJECT');
const sb = configured ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

let isAdmin = false;
let notices = [];
let faqs = [];
let faqFilter = '전체';
let qnaPage = 0;

const $ = id => document.getElementById(id);

// 사용자가 쓴 글은 반드시 이걸로 감싸서 화면에 넣습니다 (스크립트 삽입 방지)
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const text = s => esc(s).replace(/\n/g, '<br>');
const date = d => new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\s/g, '').replace(/\.$/, '');

function fail(error) {
  console.error(error);
  alert(error?.message || '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
}

function fillCategories(select) {
  select.innerHTML = CATEGORIES.map(c => `<option>${c}</option>`).join('');
}

function openForm(form, values = {}) {
  form.reset();
  Object.entries(values).forEach(([k, v]) => {
    const el = form.elements[k];
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!v; else el.value = v ?? '';
  });
  form.hidden = false;
  form.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

document.querySelectorAll('[data-cancel]').forEach(btn => {
  btn.addEventListener('click', () => { btn.closest('form').hidden = true; });
});

// ---------- 탭 ----------
function showTab() {
  const tab = ['notice', 'faq', 'qna'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'notice';
  document.querySelectorAll('.support-tabs a').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
  document.querySelectorAll('.panel').forEach(p => { p.hidden = p.id !== `panel-${tab}` || !configured; });
}
window.addEventListener('hashchange', showTab);

// 아코디언 (공지·FAQ 공통)
function bindAccordion(list) {
  list.addEventListener('click', e => {
    const head = e.target.closest('.acc-head');
    if (head) head.parentElement.classList.toggle('open');
  });
}

// ---------- 공지사항 ----------
async function loadNotices() {
  const { data, error } = await sb.from('notices').select('*')
    .order('pinned', { ascending: false }).order('created_at', { ascending: false });
  if (error) return fail(error);
  notices = data;
  renderNotices();
}

function renderNotices() {
  const list = $('noticeList');
  if (!notices.length) { list.innerHTML = '<li class="empty">등록된 공지사항이 없습니다.</li>'; return; }
  list.innerHTML = notices.map(n => `
    <li data-id="${n.id}">
      <button type="button" class="acc-head">
        <span class="acc-label">${n.pinned ? '<b class="pill">공지</b>' : ''}${date(n.created_at)}</span>
        <span class="acc-title">${esc(n.title)}</span>
      </button>
      <div class="acc-body">
        ${text(n.body)}
        ${isAdmin ? `<div class="admin-actions"><button data-edit-notice="${n.id}">수정</button><button data-del-notice="${n.id}">삭제</button></div>` : ''}
      </div>
    </li>`).join('');
}

$('newNoticeBtn').addEventListener('click', () => openForm($('noticeForm')));

$('noticeList').addEventListener('click', async e => {
  const editId = e.target.dataset.editNotice;
  const delId = e.target.dataset.delNotice;
  if (editId) openForm($('noticeForm'), notices.find(n => n.id == editId));
  if (delId && confirm('이 공지를 삭제할까요?')) {
    const { error } = await sb.from('notices').delete().eq('id', delId);
    if (error) return fail(error);
    loadNotices();
  }
});

$('noticeForm').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target.elements;
  const row = { title: f.title.value.trim(), body: f.body.value.trim(), pinned: f.pinned.checked, updated_at: new Date().toISOString() };
  const { error } = f.id.value
    ? await sb.from('notices').update(row).eq('id', f.id.value)
    : await sb.from('notices').insert(row);
  if (error) return fail(error);
  e.target.hidden = true;
  loadNotices();
});

// ---------- FAQ ----------
async function loadFaqs() {
  const { data, error } = await sb.from('faqs').select('*').order('sort').order('id');
  if (error) return fail(error);
  faqs = data;
  renderFaqs();
}

function renderFaqs() {
  $('faqChips').innerHTML = ['전체', ...CATEGORIES].map(c =>
    `<button type="button" class="${c === faqFilter ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('');

  const q = $('faqSearch').value.trim().toLowerCase();
  const shown = faqs.filter(f =>
    (faqFilter === '전체' || f.category === faqFilter) &&
    (!q || (f.question + f.answer).toLowerCase().includes(q)));

  const list = $('faqList');
  if (!shown.length) { list.innerHTML = '<li class="empty">해당하는 질문이 없습니다.</li>'; return; }
  list.innerHTML = shown.map(f => `
    <li>
      <button type="button" class="acc-head">
        <span class="acc-label">Q. ${esc(f.category)}</span>
        <span class="acc-title">${esc(f.question)}</span>
      </button>
      <div class="acc-body">
        ${text(f.answer)}
        ${isAdmin ? `<div class="admin-actions"><button data-edit-faq="${f.id}">수정</button><button data-del-faq="${f.id}">삭제</button></div>` : ''}
      </div>
    </li>`).join('');
}

$('faqChips').addEventListener('click', e => {
  if (!e.target.dataset.cat) return;
  faqFilter = e.target.dataset.cat;
  renderFaqs();
});
$('faqSearch').addEventListener('input', renderFaqs);
$('newFaqBtn').addEventListener('click', () => openForm($('faqForm'), { category: faqFilter === '전체' ? '일반' : faqFilter }));

$('faqList').addEventListener('click', async e => {
  const editId = e.target.dataset.editFaq;
  const delId = e.target.dataset.delFaq;
  if (editId) openForm($('faqForm'), faqs.find(f => f.id == editId));
  if (delId && confirm('이 FAQ를 삭제할까요?')) {
    const { error } = await sb.from('faqs').delete().eq('id', delId);
    if (error) return fail(error);
    loadFaqs();
  }
});

$('faqForm').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target.elements;
  const row = { category: f.category.value, question: f.question.value.trim(), answer: f.answer.value.trim(), sort: Number(f.sort.value) || 0 };
  const { error } = f.id.value
    ? await sb.from('faqs').update(row).eq('id', f.id.value)
    : await sb.from('faqs').insert(row);
  if (error) return fail(error);
  e.target.hidden = true;
  loadFaqs();
});

// ---------- 1:1 문의 ----------
async function loadQna() {
  const from = qnaPage * PAGE_SIZE;
  let rows, total;

  if (isAdmin) {
    const { data, error, count } = await sb.from('inquiries')
      .select('id, category, name, title, answer, created_at', { count: 'exact' })
      .order('id', { ascending: false }).range(from, from + PAGE_SIZE - 1);
    if (error) return fail(error);
    rows = data.map(r => ({ ...r, answered: r.answer !== null, label: esc(r.title), writer: esc(r.name) }));
    total = count;
  } else {
    const { data, error } = await sb.rpc('list_inquiries', { p_limit: PAGE_SIZE, p_offset: from });
    if (error) return fail(error);
    rows = data.map(r => ({ ...r, label: '🔒 비밀글입니다', writer: esc(r.name_masked) }));
    total = data[0]?.total ?? 0;
  }

  const table = $('qnaTable');
  if (!rows.length) {
    table.innerHTML = '<p class="empty">아직 등록된 문의가 없습니다.</p>';
  } else {
    table.innerHTML = `
      <div class="qna-row qna-head"><span>번호</span><span>분류</span><span>제목</span><span>작성자</span><span>상태</span><span>작성일</span></div>
      ${rows.map(r => `
        <button type="button" class="qna-row" data-qna="${r.id}">
          <span>${r.id}</span><span>${esc(r.category)}</span><span class="qna-title">${r.label}</span>
          <span>${r.writer}</span>
          <span class="${r.answered ? 'done' : 'wait'}">${r.answered ? '답변완료' : '답변대기'}</span>
          <span>${date(r.created_at)}</span>
        </button>`).join('')}`;
  }

  const pages = Math.ceil(total / PAGE_SIZE);
  $('qnaPager').innerHTML = pages > 1
    ? Array.from({ length: pages }, (_, i) => `<button type="button" class="${i === qnaPage ? 'active' : ''}" data-page="${i}">${i + 1}</button>`).join('')
    : '';
}

$('qnaPager').addEventListener('click', e => {
  if (e.target.dataset.page === undefined) return;
  qnaPage = Number(e.target.dataset.page);
  loadQna();
});

$('newQnaBtn').addEventListener('click', () => openForm($('qnaForm')));

$('qnaForm').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target.elements;
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true;
  const { data, error } = await sb.rpc('create_inquiry', {
    p_category: f.category.value,
    p_name: f.name.value.trim(),
    p_phone: f.phone.value.replace(/\s/g, ''),
    p_title: f.title.value.trim(),
    p_content: f.content.value.trim(),
    p_password: f.password.value,
  });
  btn.disabled = false;
  if (error) return fail(error);
  alert(`문의가 접수되었습니다. (문의번호 ${data})\n입력하신 비밀번호로 답변을 확인하실 수 있습니다.`);
  e.target.hidden = true;
  qnaPage = 0;
  loadQna();
});

const dialog = $('qnaDialog');
const dialogBody = $('qnaDialogBody');

function inquiryView(q, adminExtra = '') {
  return `
    <p class="dialog-meta">${esc(q.category)} · 문의번호 ${q.id} · ${date(q.created_at)}</p>
    <h3>${esc(q.title)}</h3>
    ${adminExtra}
    <div class="dialog-content">${text(q.content)}</div>
    <div class="dialog-answer">
      <p class="dialog-answer-label">답변${q.answered_at ? ` · ${date(q.answered_at)}` : ''}</p>
      ${q.answer ? text(q.answer) : '<p class="muted">아직 답변이 등록되지 않았습니다. 조금만 기다려 주세요.</p>'}
    </div>`;
}

$('qnaTable').addEventListener('click', async e => {
  const row = e.target.closest('[data-qna]');
  if (!row) return;
  const id = Number(row.dataset.qna);

  if (isAdmin) {
    const { data: q, error } = await sb.from('inquiries').select('*').eq('id', id).single();
    if (error) return fail(error);
    dialogBody.innerHTML = `
      <p class="dialog-meta">${esc(q.category)} · 문의번호 ${q.id} · ${date(q.created_at)}</p>
      <h3>${esc(q.title)}</h3>
      <p class="dialog-contact">${esc(q.name)} · <a href="tel:${esc(q.phone)}">${esc(q.phone)}</a></p>
      <div class="dialog-content">${text(q.content)}</div>
      <form class="edit-form" id="answerForm">
        <label>답변<textarea name="answer" rows="6" maxlength="5000" required>${esc(q.answer)}</textarea></label>
        <div class="form-btns">
          <button type="button" class="btn-line" id="deleteQna">문의 삭제</button>
          <button type="submit" class="btn-primary">답변 저장</button>
        </div>
      </form>`;
    dialog.showModal();

    $('answerForm').addEventListener('submit', async ev => {
      ev.preventDefault();
      const { error } = await sb.from('inquiries')
        .update({ answer: ev.target.elements.answer.value.trim(), answered_at: new Date().toISOString() }).eq('id', id);
      if (error) return fail(error);
      dialog.close();
      loadQna();
    });
    $('deleteQna').addEventListener('click', async () => {
      if (!confirm('이 문의를 삭제할까요? 되돌릴 수 없습니다.')) return;
      const { error } = await sb.from('inquiries').delete().eq('id', id);
      if (error) return fail(error);
      dialog.close();
      loadQna();
    });
    return;
  }

  dialogBody.innerHTML = `
    <h3>비밀글입니다</h3>
    <p class="muted">문의 작성 시 입력한 비밀번호를 입력해 주세요.</p>
    <form class="edit-form" id="pwForm">
      <label>비밀번호<input name="password" type="password" required autocomplete="current-password"></label>
      <div class="form-btns"><button type="submit" class="btn-primary">확인</button></div>
    </form>`;
  dialog.showModal();

  $('pwForm').addEventListener('submit', async ev => {
    ev.preventDefault();
    const { data, error } = await sb.rpc('get_my_inquiry', { p_id: id, p_password: ev.target.elements.password.value });
    if (error) return fail(error);
    if (!data.length) { alert('비밀번호가 일치하지 않습니다.'); return; }
    dialogBody.innerHTML = inquiryView(data[0]);
  });
});

// ---------- 관리자 로그인 상태 ----------
async function refreshAuth() {
  const { data: { session } } = await sb.auth.getSession();
  isAdmin = false;
  if (session) {
    const { data } = await sb.rpc('is_admin');
    isAdmin = data === true;
    $('adminEmail').textContent = session.user.email;
  }
  $('adminBar').hidden = !isAdmin;
  document.querySelectorAll('.admin-only').forEach(el => { el.hidden = !isAdmin; });
  document.querySelectorAll('.customer-only').forEach(el => { el.hidden = isAdmin; });
}

$('logoutBtn').addEventListener('click', async () => {
  await sb.auth.signOut();
  location.reload();
});

// ---------- 시작 ----------
fillCategories($('faqForm').elements.category);
fillCategories($('qnaForm').elements.category);
showTab();

if (!configured) {
  $('setupNotice').hidden = false;
} else {
  [$('noticeList'), $('faqList')].forEach(bindAccordion);
  refreshAuth().then(() => Promise.all([loadNotices(), loadFaqs(), loadQna()]));
}

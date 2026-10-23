// 매장찾기
// 직영점이 늘어나면 이 목록에 같은 모양으로 하나씩 추가하면 됩니다.
const STORES = [
  {
    name: '오구피제리아 서초직영점',
    type: '직영점',
    region: '서울 서초구',
    address: '서울 서초구 반포대로27길 13 1층',
    subway: '2호선 서초역 3번 출구 도보 3분',
    phone: '02-598-1259',
    hours: '매일 11:00 – 23:00 (연중무휴)',
    breakTime: '15:00 – 17:00',
    lastOrder: '21:00',
    parking: '서초꽃마을주얼리 지하주차장 (1시간 30분 무료)',
    image: 'images/interior.jpg',
    links: {
      naver: 'https://naver.me/Gow61ugu',
      lunch: 'https://naver.me/5nh1n6BV',
      dinner: 'https://naver.me/xwo0nIop',
      baemin: 'https://s.baemin.com/3m000HuCFxIsR',
      coupang: 'https://web.coupangeats.com/share?storeId=1038656&dishId&key=9a4fbead-d1d6-4c46-999f-460b4fb19ba2',
    },
  },
];

(function () {
  const listEl = document.getElementById('storeList');
  const detailEl = document.getElementById('storeDetail');
  const mapEl = document.getElementById('storeMap');
  const searchEl = document.getElementById('storeSearch');
  const countEl = document.getElementById('storeCount');
  let selected = 0;

  const mapUrl = address => `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=17&output=embed`;

  function renderList() {
    const q = searchEl.value.trim();
    const shown = STORES.map((s, i) => ({ s, i }))
      .filter(({ s }) => !q || (s.name + s.address + s.region + s.subway).includes(q));
    countEl.textContent = shown.length;
    listEl.innerHTML = shown.length
      ? shown.map(({ s, i }) => `
        <button type="button" class="store-card${i === selected ? ' active' : ''}" data-store="${i}">
          <span class="store-type">${s.type}</span>
          <strong>${s.name}</strong>
          <span class="store-addr">${s.address}</span>
          <span class="store-sub">${s.subway}</span>
        </button>`).join('')
      : '<p class="empty">검색 결과가 없습니다.</p>';
  }

  function renderDetail() {
    const s = STORES[selected];
    mapEl.src = mapUrl(s.address);
    mapEl.title = `${s.name} 지도`;
    detailEl.innerHTML = `
      <img src="${s.image}" alt="${s.name} 매장 내부">
      <div class="store-detail-body">
        <span class="store-type">${s.type}</span>
        <h2>${s.name}</h2>
        <dl>
          <dt>주소</dt><dd>${s.address}</dd>
          <dt>오시는 길</dt><dd>${s.subway}</dd>
          <dt>영업시간</dt><dd>${s.hours}</dd>
          <dt>브레이크</dt><dd>${s.breakTime}</dd>
          <dt>라스트오더</dt><dd>${s.lastOrder}</dd>
          <dt>주차</dt><dd>${s.parking}</dd>
          <dt>전화</dt><dd><a href="tel:${s.phone}">${s.phone}</a></dd>
        </dl>
        <div class="store-btns">
          <a class="btn-primary" href="${s.links.lunch}" target="_blank" rel="noopener">런치 예약</a>
          <a class="btn-primary btn-dark" href="${s.links.dinner}" target="_blank" rel="noopener">디너 예약</a>
          <a class="btn-line" href="${s.links.naver}" target="_blank" rel="noopener">네이버 지도</a>
          <a class="btn-line" href="tel:${s.phone}">전화하기</a>
        </div>
        <div class="store-order">
          <a href="${s.links.baemin}" target="_blank" rel="noopener" class="order-baemin">배달의민족 주문</a>
          <a href="${s.links.coupang}" target="_blank" rel="noopener" class="order-coupang">쿠팡이츠 주문</a>
        </div>
      </div>`;
  }

  listEl.addEventListener('click', e => {
    const card = e.target.closest('[data-store]');
    if (!card) return;
    selected = Number(card.dataset.store);
    renderList();
    renderDetail();
  });
  searchEl.addEventListener('input', renderList);

  renderList();
  renderDetail();
})();

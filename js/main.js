// 메인 배너 슬라이드
(function () {
  const slider = document.getElementById('slider');
  const track = slider.querySelector('.slides');
  const slides = track.children;
  const dotsEl = document.getElementById('dots');
  const nowEl = document.getElementById('slideNow');
  const total = slides.length;
  let index = 0;
  let timer;

  document.getElementById('slideTotal').textContent = total;

  for (let i = 0; i < total; i++) {
    const dot = document.createElement('button');
    dot.setAttribute('aria-label', `${i + 1}번 배너`);
    dot.addEventListener('click', () => go(i));
    dotsEl.appendChild(dot);
  }

  function go(i) {
    index = (i + total) % total;
    track.style.transform = `translateX(-${index * 100}%)`;
    nowEl.textContent = index + 1;
    [...dotsEl.children].forEach((d, n) => d.classList.toggle('active', n === index));
    restart();
  }

  function restart() {
    clearInterval(timer);
    timer = setInterval(() => go(index + 1), 5000);
  }

  slider.querySelector('.prev').addEventListener('click', () => go(index - 1));
  slider.querySelector('.next').addEventListener('click', () => go(index + 1));
  slider.addEventListener('mouseenter', () => clearInterval(timer));
  slider.addEventListener('mouseleave', restart);

  // 모바일 스와이프
  let startX = null;
  slider.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    startX = null;
  });

  go(0);
})();

// 전체 메뉴: 카테고리 탭 + 메뉴 목록
// 메뉴나 가격이 바뀌면 이 목록만 고치면 됩니다. (img는 images/menu/ 안의 파일 이름)
const MENU = [
  { cat: '파누쪼', items: [
    { name: '대파크림치즈 파누쪼', price: 9900, tags: ['인기', '대표'], img: 'pannuzzo-cream', desc: '잘 구운 소시지에 향긋한 대파크림치즈와 신선한 혼합 채소, 방울토마토를 더한 파누쪼' },
    { name: '스파이시 치킨 파누쪼', price: 11500, tags: ['인기', '대표'], img: 'pannuzzo-chicken', desc: '쫄깃한 닭다리살에 매콤한 고스트 핫소스와 부드러운 갈릭 소스, 신선한 채소를 더한 파누쪼' },
    { name: '카프레제 파누쪼', price: 10900, tags: ['인기'], img: 'pannuzzo-caprese', desc: '엑스트라버진 올리브 오일과 바질 마요를 베이스로 신선한 토마토를 더한 파누쪼' },
    { name: '잠봉뵈르 파누쪼', price: 11500, tags: [], img: 'pannuzzo-jambon', desc: '향긋한 루꼴라, 고소한 바질마요소스, 잠봉 그리고 프랑스 고급 엘르앤비르 버터' },
  ]},
  { cat: '피자', items: [
    { name: '마르게리타', price: 9900, tags: ['인기'], img: 'pizza-margherita', desc: '토마토소스와 모짜렐라 치즈, 향긋한 바질이 어우러진 나폴리 스타일 피자' },
    { name: '루꼴라 올리브', price: 13900, tags: ['대표'], img: 'pizza-rucola-olive', desc: '향긋한 루꼴라와 가득 채운 블랙 올리브 칩이 어우러진 깔끔한 피자' },
    { name: '잠봉 루꼴라', price: 14900, tags: ['인기', '대표'], img: 'pizza-jambon', desc: '얇게 저민 잠봉뵈르의 짭조름함과 루꼴라의 쌉싸름한 풍미가 조화로운 피자' },
    { name: '풍기 고르곤졸라', price: 14900, tags: [], img: 'pizza-funghi', desc: '버섯의 깊은 향과 고르곤졸라 치즈의 진한 풍미, 호두의 고소함이 어우러진 피자' },
  ]},
  { cat: '파스타/라이스', items: [
    { name: '토마토 스파게티', price: 12500, tags: [], img: 'pasta-tomato', desc: '매장에서 직접 만든 신선한 수제 토마토소스에 고소한 모짜렐라 치즈를 더한 스파게티' },
    { name: '감베로니 크림', price: 15900, tags: [], img: 'pasta-gamberoni-cream', desc: '탱글한 자숙 새우와 마늘, 방울토마토, 브로콜리가 듬뿍 들어간 크림 파스타' },
    { name: '감베로니 로제', price: 16500, tags: [], img: 'pasta-gamberoni-rose', desc: '신선한 크림소스에 토마토소스를 더해 부드럽게 감칠맛을 살린 새우 로제 파스타' },
    { name: 'OGU 필라프', price: 11900, tags: [], img: 'ogu-pilaf', desc: '매콤한 제육볶음을 듬뿍 얹어 김치와 고소하게 볶아낸 한국인의 소울푸드' },
    { name: '알라 네라노', price: 13400, tags: ['매운맛'], img: 'alla-nerano', desc: '향긋한 마늘 오일에 구운 애호박의 달큰함과 페페론치노의 은은한 매콤함' },
  ]},
  { cat: '샐러드', items: [
    { name: '가든샐러드', price: 5900, tags: [], img: 'garden-salad', desc: '부드럽고 고소한 호두, 신선한 채소, 상큼한 방울토마토에 깔끔한 오리엔탈 드레싱' },
    { name: '그릭요거트 가든샐러드', price: 6900, tags: [], img: 'greek-salad', desc: '신선한 채소와 상큼한 방울토마토 위에 단백질이 풍부한 그릭요거트를 올린 샐러드' },
    { name: 'OGU 샐러드', price: 7500, tags: [], img: 'ogu-salad', desc: '고소한 호두와 신선한 채소가 가득한 가든 샐러드에 구워낸 수제 화덕빵을 곁들인 샐러드' },
    { name: '홀 로메인 샐러드', price: 7900, tags: [], img: 'romaine-salad', desc: '아삭한 식감의 통 로메인과 신선한 방울토마토가 갈릭소스와 어우러진 샐러드' },
    { name: '치킨 샐러드', price: 11900, tags: [], img: 'chicken-salad', desc: '8~9pc의 바삭한 치킨 가라아게와 고소한 감자튀김에 진한 갈릭 소스를 곁들인 샐러드' },
  ]},
  { cat: '디너', items: [
    { name: 'OGU 스테이크(150g)', price: 25900, tags: [], img: 'ogu-steak', desc: '부드러운 육질의 채끝등심에 각종 야채를 곁들인 프리미엄 스테이크' },
    { name: '치킨 스테이크(2p)', price: 14900, tags: [], img: 'chicken-steak', desc: '마리네이드한 닭다리살을 그릴에 구워 매콤한 소스와 곁들인 닭구이' },
    { name: '버팔로윙(4p)', price: 5900, tags: [], img: 'wing-4', desc: '쫄깃한 닭날개에 매콤한 수제 소스를 입혀 감칠맛을 더한 버팔로윙' },
    { name: '버팔로윙(6p)', price: 8900, tags: [], img: 'wing-6', desc: '쫄깃한 닭날개에 매콤한 수제 소스를 입혀 감칠맛을 더한 버팔로윙' },
  ]},
  { cat: '사이드', items: [
    { name: '오늘의 수프', price: 4900, tags: [], img: 'soup', desc: '매일 매장에서 직접 만들어 신선하고 풍미 가득한 홈메이드 수프' },
    { name: '대파크림치즈(80g)', price: 4000, tags: [], img: 'cream-cheese', desc: '향긋한 대파와 짭조름한 베이컨을 부드러운 크림치즈에 섞어낸 대파크림치즈' },
    { name: '알리 죠르지오', price: 1000, tags: [], img: 'aglio-giorgio', desc: '피자와 도우를 끝까지 맛있게 즐기는 특제 마늘 소스와 발사믹 올리브오일' },
  ]},
  { cat: '음료', items: [
    { name: '콜라(350ml)', price: 3000, tags: [], img: 'coke' },
    { name: '제로콜라(350ml)', price: 3000, tags: [], img: 'coke-zero' },
    { name: '스프라이트(350ml)', price: 3000, tags: [], img: 'sprite' },
    { name: '아메리카노(ICE)', price: 3900, tags: [], img: 'americano-ice' },
    { name: '아메리카노(HOT)', price: 3900, tags: [], img: 'americano-hot' },
    { name: '카페라떼(ICE)', price: 4900, tags: [], img: 'latte-ice' },
    { name: '카페라떼(HOT)', price: 4900, tags: [], img: 'latte-hot' },
    { name: '레몬에이드', price: 5000, tags: [], img: 'lemon-ade' },
    { name: '자몽에이드', price: 5300, tags: [], img: 'grapefruit-ade' },
    { name: '샤인머스켓에이드', price: 4500, tags: [], img: 'shine-ade' },
    { name: '체리콕', price: 4000, tags: [], img: 'cherry-coke' },
  ]},
];

(function () {
  const tabsEl = document.getElementById('menuTabs');
  const listEl = document.getElementById('menuList');
  const won = n => n.toLocaleString('ko-KR') + '원';
  const tagClass = { '인기': 'tag-pop', '대표': 'tag-rep', '매운맛': 'tag-hot' };

  MENU.forEach((group, i) => {
    const btn = document.createElement('button');
    btn.setAttribute('role', 'tab');
    btn.innerHTML = `${group.cat} <small>${group.items.length}</small>`;
    btn.addEventListener('click', () => show(i));
    tabsEl.appendChild(btn);
  });

  function show(i) {
    [...tabsEl.children].forEach((b, n) => {
      b.classList.toggle('active', n === i);
      b.setAttribute('aria-selected', n === i);
    });
    listEl.innerHTML = MENU[i].items.map(item => `
      <article class="menu-item">
        <div class="menu-item-text">
          ${item.tags.length ? `<div class="menu-tags">${item.tags.map(t => `<span class="${tagClass[t]}">${t}</span>`).join('')}</div>` : ''}
          <h3>${item.name}</h3>
          ${item.desc ? `<p class="menu-desc">${item.desc}</p>` : ''}
          <p class="menu-price">${won(item.price)}</p>
        </div>
        <img src="images/menu/${item.img}.png" alt="${item.name}" loading="lazy">
      </article>`).join('');
  }

  show(0);
})();

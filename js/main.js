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

// BEST 메뉴 탭 필터
(function () {
  const tabs = document.getElementById('menuTabs');
  const cards = document.querySelectorAll('#menuGrid .menu-card');

  tabs.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    tabs.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
    const filter = btn.dataset.filter;
    cards.forEach(card => {
      card.classList.toggle('hidden', filter !== 'all' && card.dataset.cat !== filter);
    });
  });
})();

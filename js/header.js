// 메가 메뉴: 하위 메뉴를 누르면 마우스가 메뉴 밖으로 나갈 때까지 닫아 둠
(function () {
  const gnb = document.querySelector('.gnb');
  if (!gnb) return;
  gnb.addEventListener('click', e => {
    if (!e.target.closest('a')) return;
    gnb.classList.add('closed');
    document.activeElement.blur();
  });
  gnb.addEventListener('mouseleave', () => gnb.classList.remove('closed'));
})();

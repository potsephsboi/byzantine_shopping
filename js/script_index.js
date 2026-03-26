const imagePaths = [
  '../../assets/index/pant.jpg',
  '../../assets/index/logo.png',
  '../../assets/index/xer.jpg',
  '../../assets/index/xer.jpg'
];

const bgTransitionDuration = 0;
const delayAfterBgToBig = 100;
const delaySmallToLeft = 100;
const delayLeftToRight = 100;
const targetBg = '#3d0201';

let img1, overlayImg, leftTopImg, rightTopImg, grid;
let animationStarted = false;

window.addEventListener('load', () => {
  img1 = document.getElementById('img1');
  overlayImg = document.getElementById('overlayImg');
  leftTopImg = document.getElementById('leftTopImg');
  rightTopImg = document.getElementById('rightTopImg');
  grid = document.getElementById('mainGrid');

  if (imagePaths[0] && img1) img1.src = imagePaths[0];
  if (imagePaths[1] && overlayImg) overlayImg.src = imagePaths[1];
  if (imagePaths[2] && leftTopImg) leftTopImg.src = imagePaths[2];
  if (imagePaths[3] && rightTopImg) rightTopImg.src = imagePaths[3];

  adjustSideImages();
  window.addEventListener('resize', adjustSideImages);
  window.addEventListener('orientationchange', adjustSideImages);

  requestAnimationFrame(() => document.body.style.backgroundColor = targetBg);

  const onBgEnd = (e) => {
    if (e.propertyName === 'background-color') {
      document.body.removeEventListener('transitionend', onBgEnd);
      startSequencedReveal();
    }
  };

  let fallback = setTimeout(startSequencedReveal, bgTransitionDuration + 150);
  document.body.addEventListener('transitionend', (e) => {
    if (e.propertyName === 'background-color') {
      clearTimeout(fallback);
      onBgEnd(e);
    }
  });
});

function adjustSideImages() {
  if (!leftTopImg || !rightTopImg) return;
  const leftMenu = document.getElementById('leftMenu');
  const rightMenu = document.getElementById('rightMenu');
  if (!leftMenu || !rightMenu) return;

  const leftRect = leftMenu.getBoundingClientRect();
  const rightRect = rightMenu.getBoundingClientRect();

  const leftMenuTopDoc = Math.round(leftRect.top + window.scrollY);
  const rightMenuTopDoc = Math.round(rightRect.top + window.scrollY);
  const leftMenuLeftDoc = Math.round(leftRect.left + window.scrollX);
  const rightMenuLeftDoc = Math.round(rightRect.left + window.scrollX);

  const sideTopDoc = 100;

  const leftWidth = Math.round(leftRect.width);
  const rightWidth = Math.round(rightRect.width);

  const leftHeight = Math.max(20, Math.round(leftMenuTopDoc - 200));
  const rightHeight = Math.max(20, Math.round(rightMenuTopDoc - 200));

  const root = document.documentElement.style;
  root.setProperty('--side-top', sideTopDoc + 'px');

  root.setProperty('--leftTop-left', leftMenuLeftDoc + 'px');
  root.setProperty('--leftTop-width', leftWidth + 'px');
  root.setProperty('--leftTop-height', leftHeight + 'px');

  root.setProperty('--rightTop-left', rightMenuLeftDoc + 'px');
  root.setProperty('--rightTop-width', rightWidth + 'px');
  root.setProperty('--rightTop-height', rightHeight + 'px');

  if (!animationStarted) {
    leftTopImg.classList.remove('visible');
    rightTopImg.classList.remove('visible');
  }
}

function startSequencedReveal() {
  animationStarted = true;

  if (grid) grid.classList.add('show');
  if (grid) grid.setAttribute('aria-hidden', 'false');

  const leftTitle = document.getElementById('leftTitle');
  const leftItems = Array.from(document.querySelectorAll('#leftMenu .menu-item'));
  const rightTitle = document.getElementById('rightTitle');
  const rightItems = Array.from(document.querySelectorAll('#rightMenu .menu-item'));

  const t0 = performance.now();
  const tBig = t0 + delayAfterBgToBig;
  const tLeft = tBig + delaySmallToLeft;
  const tRight = tLeft + delayLeftToRight;

  const revealList = (els, baseTime, perItem = 80) => {
    els.forEach((el, i) => {
      const when = baseTime + i * perItem;
      const delay = Math.max(0, when - performance.now());
      setTimeout(() => el.classList.add('visible'), delay);
    });
  };

  const bigDelay = Math.max(0, tBig - performance.now());
  setTimeout(() => {
    if (img1) img1.classList.add('visible');
    if (overlayImg) overlayImg.classList.add('visible');
    if (leftTopImg) leftTopImg.classList.add('visible');
    if (rightTopImg) rightTopImg.classList.add('visible');
  }, bigDelay);

  setTimeout(() => { revealList([leftTitle, ...leftItems], performance.now()); }, Math.max(0, tLeft - performance.now()));
  setTimeout(() => { revealList([rightTitle, ...rightItems], performance.now()); }, Math.max(0, tRight - performance.now()));
}

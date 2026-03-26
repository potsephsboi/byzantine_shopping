// foreik script: background animation + category gallery
const BG_TARGET = '#3b0000';
const BG_DURATION = 500;

const CATEGORIES = {
  parastaseis: {
    label: 'παραστασεις',
    images: [
      '../../images/foreik/parastasis-1.jpg',
      '../../images/foreik/parastasis-2.jpg',
      '../../images/foreik/parastasis-3.jpg'
    ]
  },
  figoures: {
    label: 'φιγουρες αγιων',
    images: [
      '../../images/foreik/figoures-1.jpg',
      '../../images/foreik/figoures-2.jpg'
    ]
  }
};

function getSelectedCategoryKey() {
  const params = new URLSearchParams(location.search);
  const cat = params.get('cat');
  return (cat && CATEGORIES[cat]) ? cat : Object.keys(CATEGORIES)[0];
}

function renderGalleryFor(catKey) {
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';
  const cat = CATEGORIES[catKey];
  if (!cat) return;
  cat.images.forEach((src, i) => {
    const card = document.createElement('div');
    card.className = 'thumb';
    const img = document.createElement('img');
    img.alt = `${cat.label} ${i+1}`;
    img.src = src;
    card.appendChild(img);
    gallery.appendChild(card);
  });
}

function markActiveCategory(catKey) {
  const links = document.querySelectorAll('.cat-item');
  links.forEach(link => {
    const k = link.dataset.cat;
    if (k === catKey) link.classList.add('active');
    else link.classList.remove('active');
  });
}

function revealContent() {
  const header = document.querySelector('.toix-header');
  const gallery = document.getElementById('gallery');
  header.classList.add('visible');
  gallery.classList.add('visible');
}

window.addEventListener('load', () => {
  const catKey = getSelectedCategoryKey();
  renderGalleryFor(catKey);
  markActiveCategory(catKey);

  document.getElementById('categories').addEventListener('click', (ev) => {
    const a = ev.target.closest('.cat-item');
    if (!a) return;
    ev.preventDefault();
    const key = a.dataset.cat;
    if (!key || !CATEGORIES[key]) return;
    history.pushState({cat: key}, '', `?cat=${key}`);
    renderGalleryFor(key);
    markActiveCategory(key);
    document.getElementById('gallery').scrollIntoView({behavior: 'smooth', block: 'start'});
  });

  // background transition then reveal content
  requestAnimationFrame(() => { document.body.style.backgroundColor = BG_TARGET; });

  let fallback = setTimeout(revealContent, BG_DURATION + 120);
  document.body.addEventListener('transitionend', function onEnd(e) {
    if (e.propertyName === 'background-color') {
      document.body.removeEventListener('transitionend', onEnd);
      clearTimeout(fallback);
      revealContent();
    }
  });

  window.addEventListener('popstate', (e) => {
    const key = (e.state && e.state.cat) || getSelectedCategoryKey();
    renderGalleryFor(key);
    markActiveCategory(key);
  });
});

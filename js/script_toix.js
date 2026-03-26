// script_toix.js
// - background animation (black -> dark red)
// - reveal header & gallery after bg transition
// - render images for the selected category (query param ?cat=...)
// Thumbnails are links that lead to image_preview.html?img=<encoded-src>

const BG_TARGET = '#3b0000';
const BG_DURATION = 500; // ms - matches CSS

// Categories (example). Keep these src strings in sync with your assets/ paths.
// You can also replace these with filenames that will match IMAGES_DATA entries.
const CATEGORIES = {
  parastaseis: {
    label: 'παραστασεις',
    images: [
      '../../assets/toix/fjord.jpg',
      '../../assets/toix/nordic.png',
      '../../assets/toix/parastasis-3.jpg',
      '../../assets/toix/parastasis-4.jpg'
    ]
  },
  figoures: {
    label: 'φιγουρες αγιων',
    images: [
      '../../assets/toix/figoures-1.jpg',
      '../../assets/toix/figoures-2.jpg',
      '../../assets/toix/figoures-3.jpg'
    ]
  },
  bousta: {
    label: 'μπουστα αγιων',
    images: [
      '../../assets/toix/bousta-1.jpg',
      '../../assets/toix/bousta-2.jpg'
    ]
  },
  diakosmisi: {
    label: 'διακοσμιση',
    images: [
      '../../assets/toix/diakosmisi-1.jpg',
      '../../assets/toix/diakosmisi-2.jpg',
      '../../assets/toix/diakosmisi-3.jpg'
    ]
  }
};

function getSelectedCategoryKey() {
  const params = new URLSearchParams(location.search);
  const cat = params.get('cat');
  if (cat && CATEGORIES[cat]) return cat;
  return Object.keys(CATEGORIES)[0];
}

/* IMAGE DATA LOOKUP HELPER
   - Uses global IMAGES_DATA (from js/images_data.js) if present.
   - Matching strategy: exact `src` string OR filename match (basename).
   - Returns the found data object or null.
*/
function findImageDataBySrc(src) {
  if (!window.IMAGES_DATA || !src) return null;
  const basename = src.split('/').pop();
  const match = window.IMAGES_DATA.find(item => {
    if (!item || !item.src) return false;
    const itemBasename = ('' + item.src).split('/').pop();
    return (item.src === src) || (itemBasename === basename);
  });
  return match || null;
}

function renderGalleryFor(catKey) {
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = ''; // clear
  const cat = CATEGORIES[catKey];
  if (!cat) return;

  cat.images.forEach((src, i) => {
    // create an anchor that links to the preview page and passes the image path
    const link = document.createElement('a');
    link.className = 'thumb';
    link.href = `image_preview.html?img=${encodeURIComponent(src)}`;
    link.setAttribute('aria-label', `${cat.label} ${i+1}`);

    const img = document.createElement('img');
    img.alt = `${cat.label} ${i+1}`;
    img.src = src;
    link.appendChild(img);

    gallery.appendChild(link);

    // example: log matched metadata if available (no UI change)
    const meta = findImageDataBySrc(src);
    if (meta) {
      console.log('Found image metadata for', src, meta);
      // later you can display meta.id, meta.ratio, meta.basePrice in the UI.
    }
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

  // make category links update the gallery without page reload
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

  // background transition then reveal
  requestAnimationFrame(() => { document.body.style.backgroundColor = BG_TARGET; });

  // wait for transition to end (or fallback)
  let fallback = setTimeout(revealContent, BG_DURATION + 120);
  document.body.addEventListener('transitionend', function onEnd(e) {
    if (e.propertyName === 'background-color') {
      document.body.removeEventListener('transitionend', onEnd);
      clearTimeout(fallback);
      revealContent();
    }
  });

  // support back/forward navigation for category switching
  window.addEventListener('popstate', (e) => {
    const key = (e.state && e.state.cat) || getSelectedCategoryKey();
    renderGalleryFor(key);
    markActiveCategory(key);
  });
});

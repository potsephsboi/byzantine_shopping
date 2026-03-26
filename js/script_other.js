// script_other.js
// Simple page: background animation (black -> dark red), header reveal and gallery placeholders.

const BG_TARGET = '#3b0000';
const BG_DURATION = 500; // ms

// placeholder image list (update paths to real images as needed)
const IMAGES = [
  '../../images/pant.jpg',
  '../../images/xer.jpg',
  '../../images/pant.jpg',
  '../../images/xer.jpg'
];

function renderGallery() {
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';
  IMAGES.forEach((src, i) => {
    const card = document.createElement('div');
    card.className = 'thumb';
    const img = document.createElement('img');
    img.alt = `Δείγμα ${i+1}`;
    img.src = src;
    card.appendChild(img);
    gallery.appendChild(card);
  });
}

function revealContent() {
  const header = document.querySelector('.other-header');
  const gallery = document.getElementById('gallery');
  if (header) header.classList.add('visible');
  if (gallery) gallery.classList.add('visible');
}

window.addEventListener('load', () => {
  renderGallery();

  // animate background then reveal content
  requestAnimationFrame(() => { document.body.style.backgroundColor = BG_TARGET; });

  let fallback = setTimeout(revealContent, BG_DURATION + 120);
  document.body.addEventListener('transitionend', function onEnd(e) {
    if (e.propertyName === 'background-color') {
      document.body.removeEventListener('transitionend', onEnd);
      clearTimeout(fallback);
      revealContent();
    }
  });
});

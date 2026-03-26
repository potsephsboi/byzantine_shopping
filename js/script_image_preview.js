
// script_image_preview.js
// - background animation (black -> dark red) then reveal preview content
// - set main image from query ?img=... or default
// - size the placeholder to match the image intrinsic dimensions, but scale down to fit viewport when necessary
// - recompute on window resize
// - UI for entering desired height (cm) and computing width from ratio
// - robust image metadata lookup (uses IMAGES_DATA if present)
// - print-method buttons toggling with "lit" active state
// - quantity input control (default 1, min 1)
// - min/max dimension computation per image ratio
// - add-to-cart: saves item to localStorage (no redirect) with duplicate protection and styled toast
'use strict';

const BG_TARGET = '#3b0000';
const BG_DURATION = 500; // ms

const DEFAULT_IMG = '../../assets/pant.jpg';

// global physical limits (cm)
const MIN_HEIGHT_CM_GLOBAL = 4;
const MAX_HEIGHT_CM_GLOBAL = 180;

function isExternalUrl(u) {
  return /^https?:\/\//i.test(u);
}

function clampScale(nw, nh) {
  const maxW = Math.max(120, Math.floor(window.innerWidth * 0.95));
  const maxH = Math.max(120, Math.floor(window.innerHeight * 0.8));
  const scale = Math.min(1, maxW / nw, maxH / nh);
  return scale;
}

function applyCardSize(cardEl, nw, nh) {
  if (!cardEl || !nw || !nh) return;
  const scale = clampScale(nw, nh);
  const w = Math.round(nw * scale);
  const h = Math.round(nh * scale);
  cardEl.style.width = w + 'px';
  cardEl.style.height = h + 'px';
}

function basenameOf(src) {
  if (!src) return '';
  try {
    const u = new URL(src, location.href);
    const p = u.pathname || '';
    const parts = p.split('/');
    return decodeURIComponent(parts.pop() || parts.pop() || '');
  } catch (err) {
    const parts = ('' + src).split('/');
    return decodeURIComponent(parts.pop() || '');
  }
}

function findImageDataBySrc(src) {
  if (!window.IMAGES_DATA || !src) return null;
  const base = basenameOf(src).toLowerCase();
  for (let i = 0; i < window.IMAGES_DATA.length; i++) {
    const item = window.IMAGES_DATA[i];
    if (!item || !item.src) continue;
    const itemBase = basenameOf(item.src).toLowerCase();
    if (itemBase === base) return item;
    if ((item.src + '').toLowerCase() === (src + '').toLowerCase()) return item;
  }
  return null;
}

function parseRatio(ratioStr, fallbackW = 1, fallbackH = 1) {
  if (!ratioStr || typeof ratioStr !== 'string') return { w: fallbackW, h: fallbackH };
  const parts = ratioStr.split(':');
  if (parts.length === 2) {
    const rw = parseFloat(parts[0].trim()) || fallbackW;
    const rh = parseFloat(parts[1].trim()) || fallbackH;
    if (rw > 0 && rh > 0) return { w: rw, h: rh };
  }
  return { w: fallbackW, h: fallbackH };
}

function gcd(a, b) {
  a = Math.round(Math.abs(a));
  b = Math.round(Math.abs(b));
  if (!a) return b;
  if (!b) return a;
  while (b) {
    const t = a % b;
    a = b;
    b = t;
  }
  return Math.max(a, 1);
}

function formatPrice(v) {
  return Number.isFinite(v) ? Number(v).toFixed(2) : '';
}

/**
 * Unit price (per single piece) based on selected height and minimum height:
 * unitPrice = (h_selected^2 / h_min^2) * basePrice * printFactor
 *
 * totalPrice = unitPrice * quantity
 */
function computeUnitPrice(basePrice, heightSelected, minHeight, printFactor = 1) {
  const bp = Number(basePrice);
  const h = Number(heightSelected);
  const h0 = Number(minHeight);
  if (!isFinite(bp) || !isFinite(h) || !isFinite(h0) || h0 <= 0) return NaN;
  return (h * h) / (h0 * h0) * bp * printFactor;
}
function computeTotalPrice(basePrice, heightSelected, minHeight, printFactor = 1, qty = 1) {
  const unit = computeUnitPrice(basePrice, heightSelected, minHeight, printFactor);
  if (!isFinite(unit)) return NaN;
  return unit * Math.max(1, Math.floor(Number(qty) || 1));
}

/* Map print method to factor */
function printFactorForMethod(method) {
  switch ((method || '').toLowerCase()) {
    case 'canvas': return 1.2;
    case 'silk': return 1.5;
    default: return 1.0; // paper and unknown default
  }
}

function setMainImageFromQueryAndInit() {
  const params = new URLSearchParams(location.search);
  const img = params.get('img') || DEFAULT_IMG;
  const el = document.getElementById('mainPreviewImage');
  const card = document.getElementById('mainImageCard');
  if (!el || !card) return;

  const resolvedSrc = isExternalUrl(img) ? DEFAULT_IMG : img;
  el.src = resolvedSrc;

  const onLoad = () => {
    const nw = el.naturalWidth || 0;
    const nh = el.naturalHeight || 0;
    if (nw > 0 && nh > 0) {
      applyCardSize(card, nw, nh);
    } else {
      card.style.width = '';
      card.style.height = '';
    }

    const meta = findImageDataBySrc(resolvedSrc);
    const imageIdEl = document.getElementById('imageId');
    const crumbEl = document.getElementById('crumbId');
    const selectedDimsEl = document.getElementById('selectedDims');
    const heightInput = document.getElementById('heightInput');
    const qtyInput = document.getElementById('quantityInput');
    const ratioTextEl = document.getElementById('ratioText');
    const minMaxTextEl = document.getElementById('minMaxText');
    const priceTextEl = document.getElementById('priceText');

    // determine ratio components (a = width-component, b = height-component)
    let a = 1, b = 1;
    let ratioDisplay = '-';
    if (meta && meta.ratio) {
      const r = parseRatio(meta.ratio, 1, 1);
      a = r.w; b = r.h;
      ratioDisplay = `${a}:${b}`;
    } else if (nw > 0 && nh > 0) {
      const g = gcd(nw, nh);
      a = Math.round(nw / g);
      b = Math.round(nh / g);
      ratioDisplay = `${a}:${b}`;
    }

    if (imageIdEl) {
      if (meta && meta.id) imageIdEl.textContent = meta.id;
      else imageIdEl.textContent = (basenameOf(resolvedSrc) || resolvedSrc);
    }
    if (crumbEl) {
      if (meta && meta.id) crumbEl.textContent = meta.id;
      else crumbEl.textContent = (basenameOf(resolvedSrc) || resolvedSrc);
    }
    if (ratioTextEl) ratioTextEl.textContent = ratioDisplay;

    // compute min/max height according to algebra described previously
    let minHeight = MIN_HEIGHT_CM_GLOBAL;
    let maxHeight = MAX_HEIGHT_CM_GLOBAL;
    if (a >= b) {
      minHeight = MIN_HEIGHT_CM_GLOBAL;
      maxHeight = Math.floor(MAX_HEIGHT_CM_GLOBAL * (b / a));
    } else {
      maxHeight = MAX_HEIGHT_CM_GLOBAL;
      minHeight = Math.ceil(MIN_HEIGHT_CM_GLOBAL * (b / a));
    }
    // clamp
    minHeight = Math.max(MIN_HEIGHT_CM_GLOBAL, Math.min(MAX_HEIGHT_CM_GLOBAL, minHeight));
    maxHeight = Math.max(MIN_HEIGHT_CM_GLOBAL, Math.min(MAX_HEIGHT_CM_GLOBAL, maxHeight));
    if (minHeight > maxHeight) {
      minHeight = MIN_HEIGHT_CM_GLOBAL;
      maxHeight = MAX_HEIGHT_CM_GLOBAL;
    }
    if (minMaxTextEl) minMaxTextEl.textContent = `${minHeight} cm — ${maxHeight} cm`;

    // default height (20) but clamp to image-specific range
    let defaultHeight = 20;
    if (defaultHeight < minHeight) defaultHeight = minHeight;
    if (defaultHeight > maxHeight) defaultHeight = maxHeight;

    if (heightInput) heightInput.value = defaultHeight;
    if (qtyInput) qtyInput.value = 1;

    // compute default displayed dims
    if (selectedDimsEl) {
      const defaultWidth = Math.round((a * defaultHeight) / b);
      selectedDimsEl.textContent = `${defaultWidth} × ${defaultHeight} cm`;
    }

    // default print button: first active
    const printBtns = Array.from(document.querySelectorAll('.print-btn'));
    if (printBtns.length) {
      printBtns.forEach((bBtn, i) => {
        if (i === 0) {
          bBtn.classList.add('active');
          bBtn.setAttribute('aria-pressed', 'true');
        } else {
          bBtn.classList.remove('active');
          bBtn.setAttribute('aria-pressed', 'false');
        }
      });
    }

    // determine basePrice from metadata if present
    const basePrice = (meta && ('basePrice' in meta)) ? Number(meta.basePrice) : NaN;

    // compute initial price using defaultHeight/minHeight and default print factor (paper)
    const initialUnit = isFinite(basePrice) ? computeUnitPrice(basePrice, defaultHeight, minHeight, 1) : NaN;
    const initialTotal = isFinite(initialUnit) ? initialUnit * 1 : NaN;
    if (priceTextEl) priceTextEl.textContent = isFinite(initialTotal) ? formatPrice(initialTotal) : '';

    // store ratio and limits and basePrice on the form element for later validation/use
    const formEl = document.getElementById('heightForm');
    if (formEl) {
      formEl._ratioA = a;
      formEl._ratioB = b;
      formEl._minHeight = minHeight;
      formEl._maxHeight = maxHeight;
      formEl._basePrice = isFinite(basePrice) ? basePrice : null;
    }

    // update cart count badge
    updateCartBadge();
  };

  el.addEventListener('load', onLoad, { once: true });
  if (el.complete && el.naturalWidth) onLoad();
}

function reveal() {
  const wrapper = document.getElementById('previewWrapper');
  if (wrapper) wrapper.classList.add('visible');
}

function updateCartBadge() {
  try {
    const raw = localStorage.getItem('cart') || '[]';
    const arr = JSON.parse(raw);
    const count = Array.isArray(arr) ? arr.length : 0;
    const badge = document.getElementById('cartCount');
    if (badge) {
      badge.textContent = count > 0 ? String(count) : '';
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
  } catch (err) {
    // ignore
  }
}

function showToast(msg, timeout = 900) {
  const t = document.getElementById('toast');
  const m = document.getElementById('toastMessage');
  if (!t) return;
  if (m) m.textContent = msg || '';
  t.hidden = false;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(t._hideTimer);
  t._hideTimer = setTimeout(() => {
    t.classList.remove('show');
    t._hideTimer2 = setTimeout(() => { t.hidden = true; }, 240);
  }, timeout);
}

/* Read current UI values and update the price display */
function recalcAndUpdatePrice() {
  const formEl = document.getElementById('heightForm');
  if (!formEl) return;

  const heightInput = document.getElementById('heightInput');
  const qtyInput = document.getElementById('quantityInput');
  const priceTextEl = document.getElementById('priceText');

  const heightVal = Number(heightInput && heightInput.value ? heightInput.value : NaN);
  const qty = Math.max(1, Math.floor(Number(qtyInput && qtyInput.value ? qtyInput.value : 1) || 1));
  const minH = formEl._minHeight || MIN_HEIGHT_CM_GLOBAL;
  const basePrice = formEl._basePrice;

  // determine active print method factor
  const activePrint = document.querySelector('.print-btn.active') || document.querySelector('.print-btn[aria-pressed="true"]');
  const method = activePrint ? (activePrint.getAttribute('data-method') || '') : 'paper';
  const factor = printFactorForMethod(method);

  if (!isFinite(heightVal) || !isFinite(minH) || heightVal < minH) {
    // if invalid, clear price
    if (priceTextEl) priceTextEl.textContent = '';
    return;
  }

  if (!isFinite(basePrice)) {
    if (priceTextEl) priceTextEl.textContent = '';
    return;
  }

  const total = computeTotalPrice(basePrice, heightVal, minH, factor, qty);
  if (priceTextEl) priceTextEl.textContent = isFinite(total) ? formatPrice(total) : '';
}

window.addEventListener('load', () => {
  setMainImageFromQueryAndInit();

  requestAnimationFrame(() => { document.body.style.backgroundColor = BG_TARGET; });

  let fallback = setTimeout(reveal, BG_DURATION + 120);
  document.body.addEventListener('transitionend', function onEnd(e) {
    if (e.propertyName === 'background-color') {
      document.body.removeEventListener('transitionend', onEnd);
      clearTimeout(fallback);
      reveal();
    }
  });

  window.addEventListener('resize', () => {
    const el = document.getElementById('mainPreviewImage');
    const card = document.getElementById('mainImageCard');
    if (el && card && el.naturalWidth && el.naturalHeight) {
      applyCardSize(card, el.naturalWidth, el.naturalHeight);
    }
  });

  // form behavior: validate and update "Επιλεγμένες διαστάσεις" and price
  const form = document.getElementById('heightForm');
  if (form) {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const heightInput = document.getElementById('heightInput');
      const heightVal = Number(heightInput && heightInput.value ? heightInput.value : NaN);

      const minH = form._minHeight || MIN_HEIGHT_CM_GLOBAL;
      const maxH = form._maxHeight || MAX_HEIGHT_CM_GLOBAL;

      if (!isFinite(heightVal) || heightVal < minH || heightVal > maxH) {
        alert(`Το ύψος εικόνας πρέπει να είναι μεταξύ ${minH} και ${maxH} cm`);
        return;
      }

      const a = form._ratioA || 1;
      const b = form._ratioB || 1;
      const widthVal = Math.round((a * heightVal) / b);

      const selectedDimsEl = document.getElementById('selectedDims');
      if (selectedDimsEl) selectedDimsEl.textContent = `${widthVal} × ${heightVal} cm`;

      // recalc price after valid selection
      recalcAndUpdatePrice();
    });
  }

  // print method buttons: toggle active state and aria-pressed; recalc price
  const printBtns = Array.from(document.querySelectorAll('.print-btn'));
  if (printBtns.length) {
    printBtns.forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        printBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');

        // recalc price since print factor changed
        recalcAndUpdatePrice();
      });
    });
  }

  // quantity input: enforce min 1 and recalc price
  const qtyInput = document.getElementById('quantityInput');
  if (qtyInput) {
    const clampQty = () => {
      let v = Number(qtyInput.value) || 1;
      if (!isFinite(v) || v < 1) v = 1;
      qtyInput.value = Math.max(1, Math.floor(v));
      recalcAndUpdatePrice();
    };
    qtyInput.addEventListener('blur', clampQty);
    qtyInput.addEventListener('change', clampQty);
    qtyInput.value = (qtyInput.value && Number(qtyInput.value) >= 1) ? Math.floor(Number(qtyInput.value)) : 1;
  }

  // height input: recalc when changed (live update)
  const heightInputEl = document.getElementById('heightInput');
  if (heightInputEl) {
    heightInputEl.addEventListener('input', () => {
      // optional: do not validate bounds here, just update implied width preview and price if possible
      const formEl = document.getElementById('heightForm');
      const a = formEl && formEl._ratioA ? formEl._ratioA : 1;
      const b = formEl && formEl._ratioB ? formEl._ratioB : 1;
      const hVal = Number(heightInputEl.value) || 0;
      const selectedDimsEl = document.getElementById('selectedDims');
      if (selectedDimsEl && hVal > 0) {
        const w = Math.round((a * hVal) / b);
        selectedDimsEl.textContent = `${w} × ${hVal} cm`;
      }
      recalcAndUpdatePrice();
    });
  }

  // ADD TO CART logic (saves to localStorage; no redirect)
  const addToCart = document.getElementById('addToCartBtn');
  if (addToCart) {
    addToCart.addEventListener('click', (ev) => {
      ev.preventDefault();

      const imgEl = document.getElementById('mainPreviewImage');
      const imageIdEl = document.getElementById('imageId');
      const selectedDimsEl = document.getElementById('selectedDims');
      const qtyEl = document.getElementById('quantityInput');

      const imgSrc = imgEl ? (imgEl.getAttribute('src') || imgEl.src) : '';
      const id = imageIdEl ? imageIdEl.textContent.trim() : basenameOf(imgSrc);

      // ensure dims exist / validated
      let dimsText = selectedDimsEl ? selectedDimsEl.textContent.trim() : '';
      const formEl = document.getElementById('heightForm');
      const heightInput = document.getElementById('heightInput');

      let heightVal = Number(heightInput && heightInput.value ? heightInput.value : NaN);
      const minH = (formEl && formEl._minHeight) ? formEl._minHeight : MIN_HEIGHT_CM_GLOBAL;
      const maxH = (formEl && formEl._maxHeight) ? formEl._maxHeight : MAX_HEIGHT_CM_GLOBAL;

      if (!isFinite(heightVal)) {
        alert('Παρακαλώ εισάγετε έγκυρο ύψος εικόνας.');
        return;
      }
      if (heightVal < minH || heightVal > maxH) {
        alert(`Το ύψος εικόνας πρέπει να είναι μεταξύ ${minH} και ${maxH} cm`);
        return;
      }

      // compute width using ratio stored on form (if needed)
      const a = (formEl && formEl._ratioA) ? formEl._ratioA : 1;
      const b = (formEl && formEl._ratioB) ? formEl._ratioB : 1;
      const widthVal = Math.round((a * heightVal) / b);

      if (!dimsText || dimsText === '-') {
        dimsText = `${widthVal} × ${heightVal} cm`;
      } else {
        // if dimsText exists, ensure it matches current height; if not prefer computed one
        if (!dimsText.includes(String(heightVal))) {
          dimsText = `${widthVal} × ${heightVal} cm`;
        }
      }

      const qty = qtyEl ? Math.max(1, Math.floor(Number(qtyEl.value) || 1)) : 1;

      const activePrint = document.querySelector('.print-btn.active') || document.querySelector('.print-btn[aria-pressed="true"]');
      const method = activePrint ? (activePrint.getAttribute('data-method') || '') : '';

      if (!dimsText || dimsText === '-') {
        alert('Παρακαλώ επιλέξτε διαστάσεις πριν προσθέσετε στο καλάθι.');
        return;
      }

      // determine final price using the new formula:
      const basePrice = (formEl && formEl._basePrice) ? formEl._basePrice : null;
      const pf = printFactorForMethod(method);
      const totalPrice = isFinite(basePrice) ? computeTotalPrice(basePrice, heightVal, formEl._minHeight || MIN_HEIGHT_CM_GLOBAL, pf, qty) : null;
      const storedPrice = isFinite(totalPrice) ? Number(formatPrice(totalPrice)) : null;

      const item = {
        id: id || basenameOf(imgSrc) || '',
        src: imgSrc || '',
        dims: dimsText,
        method: method || '',
        qty: qty,
        price: storedPrice,
        addedAt: Date.now()
      };

      // save to localStorage cart array but prevent duplicate based on id+method+dims
      try {
        const existingRaw = localStorage.getItem('cart') || '[]';
        const existing = JSON.parse(existingRaw);
        const arr = Array.isArray(existing) ? existing : [];

        const matchIndex = arr.findIndex(e =>
          e &&
          e.id === item.id &&
          (e.method || '') === (item.method || '') &&
          (e.dims || '') === (item.dims || '')
        );

        if (matchIndex === -1) {
          arr.push(item);
        } else {
          // already exists — do not add duplicate; keep existing unchanged
        }

        localStorage.setItem('cart', JSON.stringify(arr));
      } catch (err) {
        console.error('Failed to add to cart', err);
      }

      // show styled toast (no redirect)
      showToast('Προστέθηκε επιτυχώς στο καλάθι', 1000);
      updateCartBadge();
    });
  }

  // initialize cart badge
  updateCartBadge();
});

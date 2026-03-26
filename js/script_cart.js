
// script_cart.js
// Reads cart array from localStorage and renders boxes.
// Cart item structure (stored in localStorage under key 'cart'):
// { id, src, dims, method, qty, price, addedAt }

function basenameOf(src) {
  if (!src) return '';
  try {
    const u = new URL(src, location.href);
    const parts = u.pathname.split('/');
    return decodeURIComponent(parts.pop() || parts.pop() || '');
  } catch (err) {
    const parts = src.split('/');
    return decodeURIComponent(parts.pop() || '');
  }
}

function readCart() {
  try {
    const raw = localStorage.getItem('cart');
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch (err) {
    return [];
  }
}

function writeCart(arr) {
  try {
    localStorage.setItem('cart', JSON.stringify(arr || []));
  } catch (err) {
    // ignore
  }
}

function formatPriceVal(v) {
  const n = Number(v);
  if (!isFinite(n)) return '-';
  return n.toFixed(2);
}

function renderCart() {
  const list = document.getElementById('cartList');
  if (!list) return;
  list.innerHTML = '';
  const cart = readCart();

  if (!cart.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Το καλάθι είναι άδειο.';
    list.appendChild(empty);
    return;
  }

  cart.forEach((item, idx) => {
    const box = document.createElement('article');
    box.className = 'cart-item';

    // thumb
    const thumb = document.createElement('div');
    thumb.className = 'cart-thumb';
    const img = document.createElement('img');
    img.alt = item.id || basenameOf(item.src) || 'image';
    img.src = item.src || '../../assets/pant.jpg';
    thumb.appendChild(img);

    // meta
    const meta = document.createElement('div');
    meta.className = 'cart-meta';
    const line1 = document.createElement('div');
    line1.className = 'meta-line';
    line1.innerHTML = '<span class="meta-key">Ονομα:</span>' + (item.id || basenameOf(item.src) || '-');

    const line2 = document.createElement('div');
    line2.className = 'meta-line';
    line2.innerHTML = '<span class="meta-key">Διαστάσεις:</span>' + (item.dims || '-');

    // quantity line with inline qty-controls
    const line3 = document.createElement('div');
    line3.className = 'meta-line';
    const qtyLabel = document.createElement('span');
    qtyLabel.innerHTML = '<span class="meta-key">Ποσότητα:</span>';
    line3.appendChild(qtyLabel);

    const qtyValue = document.createElement('span');
    qtyValue.className = 'qty-value';
    qtyValue.textContent = item.qty || 1;
    line3.appendChild(qtyValue);

    const qtyControls = document.createElement('span');
    qtyControls.className = 'qty-controls';
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.className = 'qty-btn minus';
    minus.title = 'Μείωση';
    minus.textContent = '−';
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.className = 'qty-btn plus';
    plus.title = 'Αύξηση';
    plus.textContent = '+';
    qtyControls.appendChild(minus);
    qtyControls.appendChild(plus);
    line3.appendChild(qtyControls);

    // method
    const methodLine = document.createElement('div');
    methodLine.className = 'meta-line';
    const methodMap = {
      paper: 'Εκτύπωση σε χαρτί υψηλής ποιότητας',
      canvas: 'Εκτύπωση σε μουσαμά υψηλής ποιότητας',
      silk: 'Μεταξοτυπία'
    };
    methodLine.innerHTML = '<span class="meta-key">Μέθοδος:</span>' + (methodMap[item.method] || (item.method || '-'));

    // price line
    const priceLine = document.createElement('div');
    priceLine.className = 'meta-line';
    const priceTextVal = (typeof item.price === 'number') ? item.price : parseFloat(item.price);
    priceLine.innerHTML = '<span class="meta-key">Τιμή:</span>' + `<span class="price-inline">${isFinite(priceTextVal) ? priceTextVal.toFixed(2) : (item.price || '-')}</span> €`;

    meta.appendChild(line1);
    meta.appendChild(line2);
    meta.appendChild(line3);
    meta.appendChild(methodLine);
    meta.appendChild(priceLine);

    // actions area (for remove)
    const actions = document.createElement('div');
    actions.className = 'cart-actions-area';
    const remove = document.createElement('button');
    remove.className = 'remove-btn';
    remove.type = 'button';
    remove.textContent = 'Αφαίρεση';
    remove.addEventListener('click', () => {
      const arr = readCart();
      arr.splice(idx, 1);
      writeCart(arr);
      renderCart();
    });
    actions.appendChild(remove);

    // qty handlers: update qty and price in storage and UI
    minus.addEventListener('click', () => {
      const arr = readCart();
      const it = arr[idx];
      if (!it) return;
      let oldQty = Number(it.qty) || 1;
      if (oldQty <= 1) return; // don't go below 1
      const newQty = oldQty - 1;

      // compute unit price (if possible) from stored total price
      let unit = NaN;
      const storedPrice = parseFloat(it.price);
      if (isFinite(storedPrice) && oldQty > 0) {
        unit = storedPrice / oldQty;
      }

      it.qty = newQty;
      if (isFinite(unit)) {
        it.price = Number((unit * newQty).toFixed(2));
      }
      writeCart(arr);
      renderCart();
    });
    plus.addEventListener('click', () => {
      const arr = readCart();
      const it = arr[idx];
      if (!it) return;
      let oldQty = Number(it.qty) || 1;
      const newQty = oldQty + 1;

      // compute unit price (if possible) from stored total price
      let unit = NaN;
      const storedPrice = parseFloat(it.price);
      if (isFinite(storedPrice) && oldQty > 0) {
        unit = storedPrice / oldQty;
      }

      it.qty = newQty;
      if (isFinite(unit)) {
        it.price = Number((unit * newQty).toFixed(2));
      }
      writeCart(arr);
      renderCart();
    });

    box.appendChild(thumb);
    box.appendChild(meta);
    box.appendChild(actions);

    list.appendChild(box);
  });
}

window.addEventListener('load', () => {
  // animate background to match other pages
  requestAnimationFrame(() => { document.body.style.backgroundColor = '#3b0000'; });
  renderCart();

  const checkout = document.getElementById('checkoutBtn');
  if (checkout) {
    checkout.addEventListener('click', () => {
      // navigate to form page where user fills name/address
      window.location.href = 'form.html';
    });
  }
});

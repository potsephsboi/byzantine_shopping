

// js/script_form.js (updated to call validate-cart then create-order)
const BG_TARGET = '#3b0001';
const BG_DURATION = 500;

// put your actual endpoints here:
const VALIDATE_API = 'https://yngpxmdjbmirclinljpz.supabase.co/functions/v1/bright-function'; // your validate function (bright-function)
const CREATE_API = 'https://yngpxmdjbmirclinljpz.supabase.co/functions/v1/create-order';     // new create-order function

// anon key (use meta tag or fall back to literal - keep anon only)
const SUPABASE_ANON_KEY = (function(){
  const m = document.querySelector('meta[name="SUPABASE-ANON-KEY"]');
  if (m && m.getAttribute('content')) return m.getAttribute('content');
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluZ3B4bWRqYm1pcmNsaW5sanB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MzA4MDksImV4cCI6MjA3NDQwNjgwOX0.IMCVzRiZkTD0ns6QGQp3oqQcW6E_43ayc_h9STHvz5c';
})();

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

function formatEuro(v) {
  return Number(v || 0).toFixed(2) + '€';
}

function computeTotal(cart) {
  let sum = 0;
  for (const it of (cart || [])) {
    const p = Number(it.price) || 0;
    const q = Number(it.qty) || 1;
    sum += p * q;
  }
  return sum;
}

function renderSummary() {
  const cart = readCart();
  const count = cart.length;
  const itemsCountEl = document.getElementById('itemsCount');
  const detailsList = document.getElementById('detailsList');
  const totalPriceEl = document.getElementById('totalPrice');

  if (itemsCountEl) itemsCountEl.textContent = `${count} είδη`;
  if (detailsList) {
    detailsList.innerHTML = '';
    if (!cart.length) {
      const li = document.createElement('li');
      li.className = 'detail-item';
      li.textContent = 'Το καλάθι είναι άδειο.';
      detailsList.appendChild(li);
    } else {
      cart.forEach(item => {
        const li = document.createElement('li');
        li.className = 'detail-item';
        const meta = document.createElement('div');
        meta.className = 'detail-meta';
        const id = document.createElement('div');
        id.className = 'id';
        id.textContent = item.id || (item.src || '').split('/').pop();
        const small = document.createElement('div');
        small.className = 'small';
        small.textContent = `Διαστάσεις: ${item.dims || '-'} • Μέθοδος: ${item.method || '-'} • Ποσότητα: ${item.qty || 1}`;
        meta.appendChild(id);
        meta.appendChild(small);

        const priceWrap = document.createElement('div');
        priceWrap.className = 'price-wrap';
        const priceText = document.createElement('div');
        priceText.textContent = (typeof item.price !== 'undefined' && item.price !== null) ? formatEuro(item.price) : '-';
        priceWrap.appendChild(priceText);

        li.appendChild(meta);
        li.appendChild(priceWrap);
        detailsList.appendChild(li);
      });
    }
  }

  const total = computeTotal(cart);
  if (totalPriceEl) totalPriceEl.textContent = formatEuro(total);

  updateCartBadge();
}

function updateCartBadge() {
  try {
    const raw = localStorage.getItem('cart') || '[]';
    const arr = JSON.parse(raw);
    const count = Array.isArray(arr) ? arr.length : 0;
    const badge = document.getElementById('cartCount');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = String(count);
      badge.style.display = 'inline-block';
    } else {
      badge.textContent = '';
      badge.style.display = 'none';
    }
  } catch (err) {
    // ignore
  }
}

function expandStep(n) {
  document.querySelectorAll('.step').forEach(s => {
    if (String(s.dataset.step) === String(n)) return;
    s.classList.remove('expanded');
  });
  const target = document.querySelector(`.step[data-step="${n}"]`);
  if (!target) return;
  target.classList.add('expanded');
  if (window.innerWidth < 900) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.addEventListener('load', () => {
  requestAnimationFrame(() => { document.body.style.backgroundColor = BG_TARGET; });
  const wrapper = document.getElementById('formWrapper');
  setTimeout(() => { if (wrapper) wrapper.classList.add('visible'); }, BG_DURATION + 80);
  renderSummary();

  const cartBtn = document.getElementById('cartBtn');
  if (cartBtn) cartBtn.addEventListener('click', () => window.location.href = 'cart.html');

  const toggle = document.getElementById('toggleDetails');
  const detailsWrap = document.getElementById('detailsWrap');
  if (toggle && detailsWrap) {
    toggle.addEventListener('click', () => {
      const now = detailsWrap.hidden;
      detailsWrap.hidden = !now;
      toggle.textContent = now ? 'απόκρυψη λεπτομερειών ▴' : 'εμφάνιση λεπτομερειών ▾';
    });
  }

  expandStep(1);

  const toStep2 = document.getElementById('toStep2');
  const toStep3 = document.getElementById('toStep3');
  const backTo1 = document.getElementById('backTo1');
  const backTo2 = document.getElementById('backTo2');

  if (toStep2) toStep2.addEventListener('click', () => {
    const fn = document.getElementById('firstName');
    const em = document.getElementById('email');
    if (fn && fn.value.trim() === '') { alert('Παρακαλώ συμπληρώστε το Όνομα.'); fn.focus(); return; }
    if (em && em.value.trim() === '') { alert('Παρακαλώ συμπληρώστε το E-mail.'); em.focus(); return; }
    expandStep(2);
  });
  if (backTo1) backTo1.addEventListener('click', () => expandStep(1));
  if (toStep3) toStep3.addEventListener('click', () => {
    const addr = document.getElementById('address');
    const city = document.getElementById('city');
    const mobile = document.getElementById('mobile');
    if (addr && addr.value.trim() === '') { alert('Παρακαλώ συμπληρώστε τη διεύθυνση.'); addr.focus(); return; }
    if (city && city.value.trim() === '') { alert('Παρακαλώ συμπληρώστε την πόλη.'); city.focus(); return; }
    if (mobile && mobile.value.trim() === '') { alert('Παρακαλώ συμπληρώστε το κινητό τηλέφωνο.'); mobile.focus(); return; }
    expandStep(3);
  });
  if (backTo2) backTo2.addEventListener('click', () => expandStep(2));

  // Payment button
  const payBtn = document.getElementById('payBtn');
// replace the existing listener with this (inside your load handler)
if (payBtn) {
  payBtn.addEventListener('click', async (ev) => {
    // Prevent default form submission (important if button is inside a form)
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();

    const agree = document.getElementById('agreeTerms');
    if (!agree || !agree.checked) { alert('Πρέπει να αποδεχτείτε τους όρους για να συνεχίσετε.'); return; }
    const cart = readCart();
    if (!cart.length) { alert('Το καλάθι είναι άδειο.'); return; }

    payBtn.disabled = true;
    const oldText = payBtn.textContent;
    payBtn.textContent = 'Επεξεργασία...';

    try {
      // 1) validate
      const vResp = await fetch(VALIDATE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify(cart)
      });

      if (!vResp.ok) {
        let parsed; try { parsed = await vResp.json(); } catch (e) {}
        const err = (parsed && parsed.error) ? parsed.error : `HTTP ${vResp.status}`;
        alert(`ServerError: ${err}`);
        return;
      }

      const vData = await vResp.json();
      if (!vData || !vData.ok) {
        const err = (vData && vData.error) ? vData.error : 'validation_failed';
        alert(`ServerError: ${err}`);
        return;
      }

      // item-level errors
      if (Array.isArray(vData.items)) {
        const badItems = vData.items.filter(it => it.errors && Array.isArray(it.errors) && it.errors.length);
        if (badItems.length) {
          badItems.forEach(it => {
            const id = it.id || '(unknown)';
            const e = Array.isArray(it.errors) ? it.errors.join(',') : String(it.errors);
            alert(`ServerError: ${id}: ${e}`);
          });
          return;
        }
      }

      if (!vData.all_match) {
        const mismatches = (vData.items || []).filter(it => it.match !== true);
        if (mismatches.length) {
          const ids = mismatches.map(m => m.id || '(unknown)').join(', ');
          alert(`Ασυμφωνία τιμών για τα είδη: ${ids}`);
        } else {
          alert('Ο έλεγχος ολοκληρώθηκε αλλά οι τιμές δεν συμφωνούν.');
        }
        return;
      }

      // 2) create-order: send cart + customer
      const customer = {
        firstName: (document.getElementById('firstName') || {}).value || '',
        lastName: (document.getElementById('lastName') || {}).value || '',
        email: (document.getElementById('email') || {}).value || '',
        address: (document.getElementById('address') || {}).value || '',
        postcode: (document.getElementById('postcode') || {}).value || '',
        city: (document.getElementById('city') || {}).value || '',
        country: (document.getElementById('country') || {}).value || '',
        mobile: (document.getElementById('mobile') || {}).value || ''
      };

      const idempotency_key = `client-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

      const cResp = await fetch(CREATE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({ cart, customer, idempotency_key })
      });

      // Log raw response for debugging
      const rawText = await cResp.text();
      console.log('create-order raw response text:', rawText);

      // Try parse JSON (if any)
      let cData;
      try { cData = JSON.parse(rawText); } catch (e) { cData = null; }

      if (!cResp.ok) {
        if (cData && cData.errors) {
          cData.errors.forEach(it => alert(`ServerError: ${JSON.stringify(it)}`));
        } else if (cData && cData.error) {
          alert(`ServerError: ${cData.error}`);
        } else {
          alert(`ServerError: ${rawText || `HTTP ${cResp.status}`}`);
        }
        return;
      }

      console.log('create-order parsed response:', cData);

      // Redirect to Stripe Checkout if we have a session URL
      if (cData && cData.ok && cData.checkout_session && cData.checkout_session.url) {
        // use location.assign for reliability
        location.assign(cData.checkout_session.url);
        return; // navigation will occur
      }

      // fallback behavior (no stripe session): handle as before
      if (cData && cData.ok && cData.order_id) {
        alert(`Παραγγελία δημιουργήθηκε: ${cData.order_id}. Σύνολο: ${(cData.total_cents/100).toFixed(2)}€`);
        localStorage.removeItem('cart');
        renderSummary();
        return;
      }

      // final fallback
      const err = (cData && cData.error) ? cData.error : 'order_create_failed';
      alert(`ServerError: ${err}`);

    } catch (err) {
      console.error('Payment flow error', err);
      alert('ServerError: communication_failed');
    } finally {
      payBtn.disabled = false;
      payBtn.textContent = oldText || 'Πληρωμή';
    }
  });
}


	window.addEventListener('storage', (ev) => {
    if (ev.key === 'cart') renderSummary();
  });
});

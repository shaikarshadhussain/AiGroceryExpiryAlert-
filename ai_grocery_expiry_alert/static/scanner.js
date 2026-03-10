/* ─── scanner.js  ─  Barcode Scanner Page Logic ─────────────────────────── */

let scannerRunning = false;
let lastScanned = '';
let scanCooldown = false;

// ── AI Expiry Logic (mirrored on client for instant feedback) ──────────────
function getExpiryStatus(expiryDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0)  return { status: 'expired',       label: 'Expired',        days: diffDays };
  if (diffDays <= 3) return { status: 'expiring_soon', label: 'Expiring Soon',  days: diffDays };
  return               { status: 'valid',          label: 'Valid',          days: diffDays };
}

// ── Fetch product from backend ─────────────────────────────────────────────
async function fetchProduct(barcode) {
  barcode = barcode.trim();
  if (!barcode) return;

  const resultEl = document.getElementById('product-result');
  resultEl.style.display = 'none';
  document.getElementById('scan-status').textContent = 'Looking up product…';

  try {
    const res = await fetch(`/product/${encodeURIComponent(barcode)}`);
    if (!res.ok) {
      showNotFound(barcode);
      return;
    }
    const product = await res.json();
    displayProduct(product);
  } catch (err) {
    document.getElementById('scan-status').textContent = '❌ Network error. Is the server running?';
  }
}

function showNotFound(barcode) {
  document.getElementById('scan-status').textContent = '';
  const resultEl = document.getElementById('product-result');
  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    <div class="alert alert-error">
      <span>🔍</span>
      <span>No product found for barcode: <strong>${barcode}</strong>. Add it via the Admin panel.</span>
    </div>`;
}

function displayProduct(product) {
  document.getElementById('scan-status').textContent = '';
  const resultEl = document.getElementById('product-result');
  resultEl.style.display = 'block';

  const { status, days } = getExpiryStatus(product.expiry);
  const cardClass     = status === 'expired' ? 'expired' : (status === 'expiring_soon' ? 'expiring' : 'valid');
  const badgeClass    = `badge-${status === 'expiring_soon' ? 'expiring' : status}`;
  const badgeLabel    = status === 'expired' ? 'Expired' : (status === 'expiring_soon' ? 'Expiring Soon' : 'Valid');

  let alertHtml = '';
  let addBtn    = '';

  if (status === 'expired') {
    alertHtml = `<div class="alert alert-error">⛔ <strong>AI Alert:</strong> This product is EXPIRED. Do NOT sell this product.</div>`;
  } else if (status === 'expiring_soon') {
    alertHtml = `<div class="alert alert-warning">⚠️ <strong>AI Alert:</strong> This product will expire in ${days} day(s). Sell first!</div>`;
    addBtn    = `<button class="btn btn-orange btn-block mt-3" onclick="addToCart(${JSON.stringify(product).replace(/"/g, '"')})">🛒 Add to Cart</button>`;
  } else {
    alertHtml = `<div class="alert alert-success">✅ <strong>AI:</strong> Product is fresh. Expires in ${days} day(s).</div>`;
    addBtn    = `<button class="btn btn-green btn-block mt-3" onclick="addToCart(${JSON.stringify(product).replace(/"/g, '"')})">🛒 Add to Cart</button>`;
  }

  resultEl.innerHTML = `
    <div class="product-card ${cardClass}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div class="product-name">🛍️ ${product.name}</div>
        <span class="badge ${badgeClass}">${badgeLabel}</span>
      </div>
      <div class="product-meta">
        <span>📦 <strong>Barcode:</strong> ${product.barcode}</span>
        <span>💰 <strong>Price:</strong> ₹${product.price}</span>
        <span>📅 <strong>Expiry:</strong> ${product.expiry}</span>
      </div>
    </div>
    ${alertHtml}
    ${addBtn}
  `;
}

// ── Cart management (stored in sessionStorage) ────────────────────────────
function getCart() {
  return JSON.parse(sessionStorage.getItem('grocery_cart') || '[]');
}

function saveCart(cart) {
  sessionStorage.setItem('grocery_cart', JSON.stringify(cart));
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(i => i.barcode === product.barcode);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart(cart);
  showToast(`✅ ${product.name} added to cart (${cart.reduce((s,i)=>s+i.qty,0)} items)`);
  updateCartBadge();
}

function updateCartBadge() {
  const cart = getCart();
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById('cart-badge');
  if (badge) {
    badge.textContent = total;
    badge.style.display = total > 0 ? 'inline-block' : 'none';
  }
}

// ── Toast notification ─────────────────────────────────────────────────────
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── QuaggaJS Scanner ──────────────────────────────────────────────────────
function startScanner() {
  const viewport = document.getElementById('scanner-viewport');
  if (!viewport) return;

  if (typeof Quagga === 'undefined') {
    document.getElementById('scan-status').textContent = '⚠️ Scanner library not loaded. Use manual input below.';
    return;
  }

  Quagga.init({
    inputStream: {
      name: 'Live',
      type: 'LiveStream',
      target: viewport,
      constraints: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'environment'
      }
    },
    locator: { patchSize: 'medium', halfSample: true },
    numOfWorkers: navigator.hardwareConcurrency || 2,
    frequency: 10,
    decoder: {
      readers: ['ean_reader', 'ean_8_reader', 'code_128_reader', 'code_39_reader', 'upc_reader', 'upc_e_reader']
    },
    locate: true
  }, function(err) {
    if (err) {
      document.getElementById('scan-status').textContent = '⚠️ Camera not available. Use manual input below.';
      console.warn('Quagga init error:', err);
      return;
    }
    Quagga.start();
    scannerRunning = true;
    document.getElementById('scan-status').textContent = '📷 Camera active – point at a barcode…';
  });

  Quagga.onDetected(function(result) {
    if (scanCooldown) return;
    const code = result.codeResult.code;
    if (code && code !== lastScanned) {
      lastScanned = code;
      scanCooldown = true;
      // Visual flash
      viewport.style.outline = '4px solid #2ecc71';
      setTimeout(() => { viewport.style.outline = ''; }, 600);

      document.getElementById('barcode-input').value = code;
      fetchProduct(code);

      setTimeout(() => { scanCooldown = false; }, 3000);
    }
  });
}

function stopScanner() {
  if (scannerRunning && typeof Quagga !== 'undefined') {
    Quagga.stop();
    scannerRunning = false;
  }
}

// ── Manual input ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  updateCartBadge();

  const manualForm = document.getElementById('manual-form');
  if (manualForm) {
    manualForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const val = document.getElementById('barcode-input').value.trim();
      if (val) fetchProduct(val);
    });
  }

  const startBtn = document.getElementById('start-scan-btn');
  const stopBtn  = document.getElementById('stop-scan-btn');

  if (startBtn) {
    startBtn.addEventListener('click', function() {
      startScanner();
      startBtn.classList.add('hidden');
      if (stopBtn) stopBtn.classList.remove('hidden');
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', function() {
      stopScanner();
      stopBtn.classList.add('hidden');
      if (startBtn) startBtn.classList.remove('hidden');
      document.getElementById('scan-status').textContent = 'Scanner stopped.';
    });
  }

  // Stop scanner when leaving page
  window.addEventListener('beforeunload', stopScanner);
});

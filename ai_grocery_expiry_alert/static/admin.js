/* ─── admin.js  ─  Admin Panel Logic ────────────────────────────────────── */

function showToast(msg, type='info') {
  let toast = document.getElementById('toast');
  if (!toast) { toast = document.createElement('div'); toast.id = 'toast'; document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

async function loadProducts() {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;

  try {
    const res = await fetch('/products');
    const products = await res.json();

    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#999;padding:24px">No products yet. Add one above.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    products.forEach(p => {
      const statusLabel = p.status === 'expired' ? '🔴 Expired' : (p.status === 'expiring_soon' ? '🟠 Expiring Soon' : '🟢 Valid');
      const badgeClass  = p.status === 'expired' ? 'badge-expired' : (p.status === 'expiring_soon' ? 'badge-expiring' : 'badge-valid');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code style="font-size:0.8rem">${p.barcode}</code></td>
        <td>${p.name}</td>
        <td>₹${p.price}</td>
        <td>${p.expiry}</td>
        <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="fillEdit('${p.barcode}','${p.name}',${p.price},'${p.expiry}')">✏️ Edit</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch(err) {
    console.error('Failed to load products:', err);
  }
}

function fillEdit(barcode, name, price, expiry) {
  document.getElementById('barcode').value  = barcode;
  document.getElementById('name').value     = name;
  document.getElementById('price').value    = price;
  document.getElementById('expiry').value   = expiry;
  document.getElementById('barcode').readOnly = true;
  document.getElementById('submit-btn').textContent = '💾 Update Product';
  document.getElementById('form-title').textContent = '✏️ Edit Product';
  document.getElementById('cancel-edit-btn').style.display = 'inline-flex';
  document.querySelector('.card').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
  document.getElementById('add-product-form').reset();
  document.getElementById('barcode').readOnly = false;
  document.getElementById('submit-btn').textContent = '➕ Add Product';
  document.getElementById('form-title').textContent = '➕ Add New Product';
  document.getElementById('cancel-edit-btn').style.display = 'none';
  document.getElementById('form-msg').innerHTML = '';
}

document.addEventListener('DOMContentLoaded', function() {
  loadProducts();

  const form = document.getElementById('add-product-form');
  const msgEl = document.getElementById('form-msg');

  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      msgEl.innerHTML = '';

      const data = {
        barcode: document.getElementById('barcode').value.trim(),
        name:    document.getElementById('name').value.trim(),
        price:   parseFloat(document.getElementById('price').value),
        expiry:  document.getElementById('expiry').value
      };

      if (!data.barcode || !data.name || isNaN(data.price) || !data.expiry) {
        msgEl.innerHTML = `<div class="alert alert-error">⚠️ Please fill all fields correctly.</div>`;
        return;
      }

      const submitBtn = document.getElementById('submit-btn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner"></span> Saving…`;

      try {
        const res = await fetch('/add-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();

        if (res.ok) {
          msgEl.innerHTML = `<div class="alert alert-success">✅ ${result.message}: <strong>${data.name}</strong></div>`;
          cancelEdit();
          loadProducts();
          showToast(`✅ ${data.name} saved!`);
        } else {
          msgEl.innerHTML = `<div class="alert alert-error">❌ ${result.error || 'Failed to save.'}</div>`;
        }
      } catch(err) {
        msgEl.innerHTML = `<div class="alert alert-error">❌ Network error.</div>`;
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '➕ Add Product';
      }
    });
  }

  const cancelBtn = document.getElementById('cancel-edit-btn');
  if (cancelBtn) cancelBtn.addEventListener('click', cancelEdit);

  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) refreshBtn.addEventListener('click', loadProducts);
});

/* ─── billing.js  ─  Billing Page Logic ─────────────────────────────────── */

function getCart() {
  return JSON.parse(sessionStorage.getItem('grocery_cart') || '[]');
}

function saveCart(cart) {
  sessionStorage.setItem('grocery_cart', JSON.stringify(cart));
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) { toast = document.createElement('div'); toast.id = 'toast'; document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function renderCart() {
  const cart = getCart();
  const tbody = document.getElementById('cart-body');
  const emptyState = document.getElementById('cart-empty');
  const cartSection = document.getElementById('cart-section');
  const totalEl = document.getElementById('cart-total');
  const generateBtn = document.getElementById('generate-bill-btn');
  const receiptEl = document.getElementById('bill-receipt');

  if (!tbody) return;

  receiptEl.style.display = 'none';

  if (cart.length === 0) {
    emptyState.style.display = 'block';
    cartSection.style.display = 'none';
    if (generateBtn) generateBtn.disabled = true;
    return;
  }

  emptyState.style.display = 'none';
  cartSection.style.display = 'block';
  if (generateBtn) generateBtn.disabled = false;

  let grandTotal = 0;
  tbody.innerHTML = '';

  cart.forEach((item, idx) => {
    const lineTotal = item.price * item.qty;
    grandTotal += lineTotal;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>₹${item.price}</td>
      <td>
        <div class="qty-controls">
          <button onclick="changeQty(${idx}, -1)" title="Decrease">−</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${idx}, 1)" title="Increase">+</button>
        </div>
      </td>
      <td>₹${lineTotal}</td>
      <td><button class="btn btn-red btn-sm" onclick="removeItem(${idx})" title="Remove">🗑️</button></td>
    `;
    tbody.appendChild(tr);
  });

  // Grand total row
  const totalTr = document.createElement('tr');
  totalTr.className = 'total-row';
  totalTr.innerHTML = `<td colspan="3" style="text-align:right">Grand Total</td><td>₹${grandTotal}</td><td></td>`;
  tbody.appendChild(totalTr);

  if (totalEl) totalEl.textContent = `₹${grandTotal}`;
}

function changeQty(idx, delta) {
  const cart = getCart();
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  saveCart(cart);
  renderCart();
}

function removeItem(idx) {
  const cart = getCart();
  const name = cart[idx].name;
  cart.splice(idx, 1);
  saveCart(cart);
  showToast(`🗑️ ${name} removed.`);
  renderCart();
}

function clearCart() {
  if (!confirm('Clear the entire cart?')) return;
  saveCart([]);
  showToast('🧹 Cart cleared.');
  renderCart();
}

function generateBill() {
  const cart = getCart();
  if (cart.length === 0) { showToast('Cart is empty!'); return; }

  const now = new Date();
  const dateStr = now.toLocaleString('en-IN');
  const billNo = 'BILL-' + Date.now().toString().slice(-6);

  let itemsHtml = '';
  let grandTotal = 0;

  cart.forEach(item => {
    const lt = item.price * item.qty;
    grandTotal += lt;
    itemsHtml += `
      <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:0.88rem;">
        <span>${item.name} × ${item.qty}</span>
        <span>₹${lt}</span>
      </div>`;
  });

  const receiptEl = document.getElementById('bill-receipt');
  receiptEl.style.display = 'block';
  receiptEl.innerHTML = `
    <div class="receipt-header">
      <h2>🛒 GroceryMart</h2>
      <p>AI Grocery Expiry Alert System</p>
      <p style="font-size:0.78rem;margin-top:4px">${dateStr}</p>
      <p style="font-size:0.78rem">Bill No: ${billNo}</p>
    </div>
    <div class="receipt-divider"></div>
    ${itemsHtml}
    <div class="receipt-divider"></div>
    <div class="receipt-total">Total: ₹${grandTotal}</div>
    <div style="text-align:center;margin-top:12px;font-size:0.8rem;color:#555">
      Thank you for shopping! 🙏<br>All products verified by AI Expiry System
    </div>
  `;

  receiptEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function printBill() {
  const receipt = document.getElementById('bill-receipt');
  if (!receipt || receipt.style.display === 'none') { showToast('Generate bill first!'); return; }
  window.print();
}

document.addEventListener('DOMContentLoaded', function() {
  renderCart();

  const clearBtn = document.getElementById('clear-cart-btn');
  const generateBtn = document.getElementById('generate-bill-btn');
  const printBtn = document.getElementById('print-bill-btn');

  if (clearBtn)    clearBtn.addEventListener('click', clearCart);
  if (generateBtn) generateBtn.addEventListener('click', generateBill);
  if (printBtn)    printBtn.addEventListener('click', printBill);
});

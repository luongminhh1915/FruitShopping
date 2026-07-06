/**
 * FruitShopping - Homepage JavaScript
 * Handles: Navbar scroll, Hero slider, Categories, Products, Cart
 */

/* =============================
   MOCK DATA (khi chưa có DB)
   ============================= */
const MOCK_CATEGORIES = [
  { categoryId: 1, name: 'Nhiệt đới', image: null, emoji: '🥭' },
  { categoryId: 2, name: 'Nhập khẩu', image: null, emoji: '🍇' },
  { categoryId: 3, name: 'Organic', image: null, emoji: '🌿' },
  { categoryId: 4, name: 'Trái cây miền Nam', image: null, emoji: '🍈' },
  { categoryId: 5, name: 'Thanh long', image: null, emoji: '🐉' },
  { categoryId: 6, name: 'Cam Quýt', image: null, emoji: '🍊' },
  { categoryId: 7, name: 'Dưa hấu', image: null, emoji: '🍉' },
  { categoryId: 8, name: 'Khô - Sấy', image: null, emoji: '🍑' },
];

const MOCK_PRODUCTS = [
  { productId: 1, name: 'Xoài Cát Chu Đồng Tháp', price: 45000, unit: 'kg', origin: 'Đồng Tháp', categoryName: 'Nhiệt đới', imgUrl: null, emoji: '🥭' },
  { productId: 2, name: 'Thanh Long Ruột Đỏ Bình Thuận', price: 35000, unit: 'kg', origin: 'Bình Thuận', categoryName: 'Nhiệt đới', imgUrl: null, emoji: '🐉' },
  { productId: 3, name: 'Nho Mẫu Đơn Đà Lạt', price: 89000, unit: 'kg', origin: 'Đà Lạt', categoryName: 'Organic', imgUrl: null, emoji: '🍇' },
  { productId: 4, name: 'Dưa Hấu Không Hạt', price: 25000, unit: 'kg', origin: 'Long An', categoryName: 'Trái cây miền Nam', imgUrl: null, emoji: '🍉' },
  { productId: 5, name: 'Cherry Mỹ Nhập Khẩu', price: 320000, unit: 'hộp 500g', origin: 'USA', categoryName: 'Nhập khẩu', imgUrl: null, emoji: '🍒' },
  { productId: 6, name: 'Cam Sành Vĩnh Long', price: 28000, unit: 'kg', origin: 'Vĩnh Long', categoryName: 'Cam Quýt', imgUrl: null, emoji: '🍊' },
  { productId: 7, name: 'Bơ Booth Đắk Lắk 034', price: 65000, unit: 'kg', origin: 'Đắk Lắk', categoryName: 'Nhiệt đới', imgUrl: null, emoji: '🥑' },
  { productId: 8, name: 'Sầu Riêng Monthong Thái', price: 185000, unit: 'kg', origin: 'Thái Lan', categoryName: 'Nhập khẩu', imgUrl: null, emoji: '🌟' },
];

/* =============================
   CART STATE & MODAL LOGIC
   ============================= */
function getCartItems() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const key = user.userId ? `cart_items_${user.userId}` : 'cart_items_guest';
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch (e) {
    return [];
  }
}

function saveCartItems(items) {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const key = user.userId ? `cart_items_${user.userId}` : 'cart_items_guest';
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error('Lỗi lưu giỏ hàng:', e);
  }
}

function updateCartBadge() {
  const items = getCartItems();
  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const badge = document.getElementById('cart-badge');
  if (badge) {
    badge.textContent = totalQty;
    badge.style.display = totalQty > 0 ? 'flex' : 'none';
  }
}

function addToCart(product, qty = 1) {
  const token = localStorage.getItem('token');
  if (!token) {
    showToast('⚠️ Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng!', 'error');
    return;
  }

  let items = getCartItems();
  const existingIndex = items.findIndex(item => item.productId === product.productId);

  if (existingIndex > -1) {
    items[existingIndex].quantity = (items[existingIndex].quantity || 1) + qty;
  } else {
    items.push({
      productId: product.productId,
      name: product.name,
      price: product.price,
      unit: product.unit || 'kg',
      categoryName: product.categoryName || '',
      imgUrl: product.imgUrl || null,
      emoji: product.emoji || '🍎',
      quantity: qty
    });
  }

  saveCartItems(items);
  updateCartBadge();
  showToast(`✅ Đã thêm "${product.name}" vào giỏ hàng!`, 'success');

  // Animate cart icon
  const cartBtn = document.getElementById('cart-btn');
  if (cartBtn) {
    cartBtn.style.transform = 'scale(1.35)';
    setTimeout(() => cartBtn.style.transform = '', 300);
  }
}

function renderCartModal() {
  const body = document.getElementById('cart-modal-body');
  const totalPriceEl = document.getElementById('cart-total-price');
  const footer = document.getElementById('cart-modal-footer');
  if (!body) return;

  const items = getCartItems();
  if (items.length === 0) {
    body.innerHTML = `
      <div style="text-align:center; padding: 40px 20px; color: #64748b;">
        <div style="font-size: 4rem; margin-bottom: 12px;">🛒</div>
        <h4 style="font-size: 1.2rem; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Giỏ hàng của bạn đang trống</h4>
        <p style="font-size: 0.9rem;">Hãy chọn mua những món hoa quả tươi ngon nhất nhé!</p>
      </div>
    `;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';

  let grandTotal = 0;
  const itemsHtml = items.map((item, index) => {
    const subtotal = item.price * item.quantity;
    grandTotal += subtotal;

    let firstImg = '';
    if (item.imgUrl) {
      const parts = item.imgUrl.split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length > 0) firstImg = parts[0];
    }
    const isUrl = firstImg && (firstImg.startsWith('http') || firstImg.startsWith('/'));
    const imgHtml = isUrl
      ? `<img src="${firstImg}" alt="${item.name}">`
      : `<div style="font-size: 2.2rem;">${firstImg || item.emoji || '🍎'}</div>`;

    return `
      <div class="cart-item">
        <div class="cart-item-img">${imgHtml}</div>
        <div class="cart-item-details">
          <h4 class="cart-item-name">${item.name}</h4>
          <span class="cart-item-price">${formatPrice(item.price)} / ${item.unit}</span>
        </div>
        <div class="cart-item-qty">
          <button class="cart-qty-btn" onclick="changeCartQty(${index}, -1)">−</button>
          <span class="cart-qty-val">${item.quantity}</span>
          <button class="cart-qty-btn" onclick="changeCartQty(${index}, 1)">+</button>
        </div>
        <div class="cart-item-subtotal">${formatPrice(subtotal)}</div>
        <button class="cart-item-remove" title="Xóa" onclick="removeCartItem(${index})">🗑️</button>
      </div>
    `;
  }).join('');

  let user = (window.Auth && window.Auth.getUser()) || JSON.parse(localStorage.getItem('user') || '{}');
  let userAddress = user.address && user.address !== '—' ? user.address.trim() : '';

  const addressSectionHtml = `
    <div id="cart-address-section" style="margin-top: 20px; padding: 16px; background: ${userAddress ? '#f0fdf4' : '#fef2f2'}; border: 2px solid ${userAddress ? '#86efac' : '#fca5a5'}; border-radius: 14px; transition: all 0.3s ease;">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 8px;">
        <span style="font-weight: 800; font-size: 0.95rem; color: ${userAddress ? '#166534' : '#991b1b'}; display: flex; align-items: center; gap: 6px;">
          📍 Thông tin địa chỉ giao hàng ${userAddress ? '✅' : '⚠️'}
        </span>
      </div>
      <div id="cart-address-alert" style="display: ${userAddress ? 'none' : 'block'}; color: #dc2626; font-size: 0.88rem; font-weight: 800; margin-bottom: 10px; padding: 8px 12px; background: #ffe4e6; border-radius: 8px; border: 1px solid #fecdd3;">
        🔴 YÊU CẦU: Vui lòng nhập thông tin địa chỉ trước khi thanh toán!
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <input type="text" id="cart-address-input" value="${userAddress}" placeholder="Nhập địa chỉ nhận hàng (Số nhà, đường, quận/huyện...)..." style="flex: 1; min-width: 220px; padding: 10px 14px; border: 2px solid ${userAddress ? '#86efac' : '#f87171'}; border-radius: 10px; font-size: 0.92rem; outline: none; box-sizing: border-box; font-family: inherit;" />
        <button onclick="saveCartAddress()" style="background: #16a34a; color: white; border: none; padding: 10px 16px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 0.9rem;">Lưu Địa Chỉ</button>
      </div>
    </div>
  `;

  body.innerHTML = itemsHtml + addressSectionHtml;

  if (totalPriceEl) totalPriceEl.textContent = formatPrice(grandTotal);
}

window.saveCartAddress = async function () {
  const input = document.getElementById('cart-address-input');
  if (!input) return;
  const val = input.value.trim();
  if (!val) {
    showToast('⚠️ Vui lòng nhập địa chỉ giao hàng!', 'error');
    return;
  }

  let user = (window.Auth && window.Auth.getUser()) || JSON.parse(localStorage.getItem('user') || '{}');
  user.address = val;

  const token = localStorage.getItem('token');
  if (token) {
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: user.fullName,
          phone: user.phone || null,
          address: val,
          avatar: user.avatar
        })
      });
      if (res.ok) {
        const json = await res.json();
        const profile = json.data || json;
        if (profile) {
          if (profile.fullName) user.fullName = profile.fullName;
          if (profile.phone) user.phone = profile.phone;
          if (profile.address) user.address = profile.address;
        }
      }
    } catch (e) { console.error(e); }
  }

  localStorage.setItem('user', JSON.stringify(user));
  showToast('✅ Đã lưu địa chỉ giao hàng thành công!', 'success');
  renderCartModal();
};

window.changeCartQty = function (index, delta) {
  let items = getCartItems();
  if (items[index]) {
    items[index].quantity = (items[index].quantity || 1) + delta;
    if (items[index].quantity <= 0) {
      items.splice(index, 1);
    }
    saveCartItems(items);
    updateCartBadge();
    renderCartModal();
  }
};

window.removeCartItem = function (index) {
  let items = getCartItems();
  if (items[index]) {
    showToast(`🗑️ Đã xóa "${items[index].name}" khỏi giỏ hàng!`, 'info');
    items.splice(index, 1);
    saveCartItems(items);
    updateCartBadge();
    renderCartModal();
  }
};

function openCartModal() {
  const token = localStorage.getItem('token');
  if (!token) {
    showToast('⚠️ Bạn cần đăng nhập để xem giỏ hàng!', 'error');
    return;
  }
  const modal = document.getElementById('cart-modal');
  if (modal) {
    renderCartModal();
    modal.classList.add('active');
  }
}

function closeCartModal() {
  const modal = document.getElementById('cart-modal');
  if (modal) modal.classList.remove('active');
}

function initCartModalEvents() {
  const modal = document.getElementById('cart-modal');
  const closeBtn = document.getElementById('cart-modal-close');
  const clearBtn = document.getElementById('btn-clear-cart');
  const checkoutBtn = document.getElementById('btn-checkout');
  const cartBtn = document.getElementById('cart-btn');

  cartBtn?.addEventListener('click', (e) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.roleName !== 'ADMIN') {
      openCartModal();
    }
  });

  closeBtn?.addEventListener('click', closeCartModal);

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeCartModal();
  });

  clearBtn?.addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
      saveCartItems([]);
      updateCartBadge();
      renderCartModal();
      showToast('🗑️ Đã xóa sạch giỏ hàng!', 'info');
    }
  });

  checkoutBtn?.addEventListener('click', async () => {
    const items = getCartItems();
    if (items.length === 0) {
      showToast('⚠️ Giỏ hàng của bạn đang trống!', 'error');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showToast('⚠️ Bạn cần đăng nhập để tiến hành thanh toán!', 'error');
      setTimeout(() => { window.location.href = 'pages/login/index.html'; }, 1500);
      return;
    }

    let user = (window.Auth && window.Auth.getUser()) || JSON.parse(localStorage.getItem('user') || '{}');
    const inputEl = document.getElementById('cart-address-input');
    let userAddress = (inputEl ? inputEl.value.trim() : '') || (user.address && user.address !== '—' ? user.address.trim() : '');

    if (!userAddress) {
      const alertEl = document.getElementById('cart-address-alert');
      const secEl = document.getElementById('cart-address-section');
      if (secEl) {
        secEl.style.background = '#fef2f2';
        secEl.style.borderColor = '#ef4444';
        secEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (alertEl) {
        alertEl.style.display = 'block';
        alertEl.textContent = '🔴 VUI LÒNG ĐIỀN THÔNG TIN ĐỊA CHỈ ĐỂ GIAO HÀNG!';
      }
      if (inputEl) {
        inputEl.focus();
        inputEl.style.borderColor = '#ef4444';
        inputEl.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.25)';
      }
      showToast('⚠️ Vui lòng điền thông tin địa chỉ để giao hàng!', 'error');
      return;
    }

    // Save updated address to localStorage & profile
    if (userAddress !== user.address) {
      user.address = userAddress;
      try {
        const res = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            fullName: user.fullName,
            phone: user.phone || null,
            address: userAddress,
            avatar: user.avatar
          })
        });
        if (res.ok) {
          const json = await res.json();
          const profile = json.data || json;
          if (profile) {
            if (profile.fullName) user.fullName = profile.fullName;
            if (profile.phone) user.phone = profile.phone;
            if (profile.address) user.address = profile.address;
          }
        }
      } catch (err) { console.error(err); }
      localStorage.setItem('user', JSON.stringify(user));
    }

    openPaymentMethodModal();
  });
}

let _selectedPayMethod = 'COD';

window.openPaymentMethodModal = function () {
  const modal = document.getElementById('payment-method-modal');
  if (modal) {
    selectPaymentOption('COD');
    modal.classList.add('active');
  }
};

window.closePaymentMethodModal = function () {
  const modal = document.getElementById('payment-method-modal');
  if (modal) modal.classList.remove('active');
};

window.selectPaymentOption = function (type) {
  _selectedPayMethod = type;
  const codOpt = document.getElementById('pay-opt-cod');
  const vnpayOpt = document.getElementById('pay-opt-vnpay');
  const radioCod = document.getElementById('radio-cod');
  const radioVnpay = document.getElementById('radio-vnpay');

  if (type === 'COD') {
    if (radioCod) radioCod.checked = true;
    if (radioVnpay) radioVnpay.checked = false;
    if (codOpt) {
      codOpt.style.borderColor = '#22c55e';
      codOpt.style.background = '#f0fdf4';
    }
    if (vnpayOpt) {
      vnpayOpt.style.borderColor = '#cbd5e1';
      vnpayOpt.style.background = '#fff';
    }
  } else {
    if (radioCod) radioCod.checked = false;
    if (radioVnpay) radioVnpay.checked = true;
    if (vnpayOpt) {
      vnpayOpt.style.borderColor = '#0284c7';
      vnpayOpt.style.background = '#f0f9ff';
    }
    if (codOpt) {
      codOpt.style.borderColor = '#cbd5e1';
      codOpt.style.background = '#fff';
    }
  }
};

let _pendingVnPayOrder = null;

async function saveOrderToDb(orderObj) {
  const token = localStorage.getItem('token');
  if (!token) {
    showToast('❌ Bạn cần đăng nhập để đặt hàng!', 'error');
    return false;
  }
  try {
    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        payMethod: orderObj.payMethod,
        totalPrice: orderObj.numericTotal,
        numericTotal: orderObj.numericTotal,
        address: orderObj.address,
        items: orderObj.items.map(i => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity
        }))
      })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      console.error('Failed to save order to database:', json.message);
      showToast('⚠️ Không thể lưu đơn hàng: ' + (json.message || 'Lỗi không xác định'), 'error');
      return false;
    } else {
      console.log('Order saved to database successfully:', json.data);
      return true;
    }
  } catch (err) {
    console.error('Network error saving order to database:', err);
    showToast('⚠️ Lỗi kết nối mạng khi lưu đơn hàng!', 'error');
    return false;
  }
}

window.confirmOrderWithPayment = async function () {
  let user = (window.Auth && window.Auth.getUser()) || JSON.parse(localStorage.getItem('user') || '{}');
  let userAddress = user.address || 'Địa chỉ mặc định';
  const cartItems = getCartItems();

  const numericTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const formattedTotal = document.getElementById('cart-total-price')?.textContent || '0 đ';

  const orderObj = {
    orderId: 'DH' + Math.floor(100000 + Math.random() * 900000),
    date: new Date().toLocaleString('vi-VN'),
    address: userAddress,
    payMethod: _selectedPayMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán Online (VNPay)',
    totalPrice: formattedTotal,
    numericTotal: numericTotal,
    items: [...cartItems]
  };

  if (_selectedPayMethod === 'VNPAY') {
    openVnPayQrModal(orderObj);
  } else {
    // Record COD order history to database
    await saveOrderToDb(orderObj);

    // Record COD order history in localStorage as backup
    try {
      const historyRaw = localStorage.getItem('USER_ORDER_HISTORY');
      const historyList = historyRaw ? JSON.parse(historyRaw) : [];
      historyList.unshift(orderObj);
      localStorage.setItem('USER_ORDER_HISTORY', JSON.stringify(historyList));
    } catch (e) { console.error(e); }

    showToast('🎉 Bạn đã đặt hàng thành công!', 'success');
    alert(`🎉 Bạn đã đặt hàng thành công!\n\n📌 Phương thức: Thanh toán khi nhận hàng (COD)\n📍 Địa chỉ giao hàng: ${userAddress}\n🚚 Cảm ơn bạn đã mua sắm tại FruitFresh!`);

    saveCartItems([]);
    updateCartBadge();
    closePaymentMethodModal();
    closeCartModal();
  }
};

window.openVnPayQrModal = function (orderObj) {
  _pendingVnPayOrder = orderObj;
  const modal = document.getElementById('vnpay-qr-modal');
  if (!modal) return;

  document.getElementById('vnpay-display-amount').textContent = orderObj.totalPrice;
  document.getElementById('vnpay-order-code').textContent = `#${orderObj.orderId}`;
  document.getElementById('vnpay-order-memo').textContent = `THANH TOAN ${orderObj.orderId}`;

  const amount = orderObj.numericTotal || 100000;
  // Generate real dynamic VietQR / VNPay QR Code for Techcombank
  const qrUrl = `https://img.vietqr.io/image/TCB-76488888888-compact2.png?amount=${amount}&addInfo=THANHTOAN_${orderObj.orderId}&accountName=LUONG%20HUU%20MINH`;
  document.getElementById('vnpay-qr-img').src = qrUrl;

  modal.style.display = 'flex';
  modal.style.opacity = '1';
  modal.style.visibility = 'visible';
};

window.closeVnPayQrModal = function () {
  const modal = document.getElementById('vnpay-qr-modal');
  if (modal) {
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
    modal.style.display = 'none';
  }
};

window.simulateVnPaySuccess = async function () {
  if (!_pendingVnPayOrder) return;

  // Record VNPay order history to database
  await saveOrderToDb(_pendingVnPayOrder);

  try {
    const historyRaw = localStorage.getItem('USER_ORDER_HISTORY');
    const historyList = historyRaw ? JSON.parse(historyRaw) : [];
    historyList.unshift(_pendingVnPayOrder);
    localStorage.setItem('USER_ORDER_HISTORY', JSON.stringify(historyList));
  } catch (e) { console.error(e); }

  showToast('🎉 Bạn đã đặt hàng & thanh toán VNPay thành công!', 'success');
  alert(`💳 THANH TOÁN VNPAY THÀNH CÔNG!\n\n📌 Mã đơn hàng: #${_pendingVnPayOrder.orderId}\n💰 Số tiền: ${_pendingVnPayOrder.totalPrice}\n📍 Địa chỉ: ${_pendingVnPayOrder.address}\n\n🚚 Đơn hàng của bạn đã được xác nhận và sẽ sớm giao đến bạn!`);

  saveCartItems([]);
  updateCartBadge();
  closeVnPayQrModal();
  closePaymentMethodModal();
  closeCartModal();
  _pendingVnPayOrder = null;
};

let _currentOhFilter = 'ALL';
let _cachedOrderHistory = [];

// --- Order History: load từ API DB ---
async function loadOrderHistoryFromApi() {
  const token = localStorage.getItem('token');
  if (!token) return [];
  try {
    const res = await fetch('/api/orders/my', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok || !json.success) return [];
    return json.data || [];
  } catch (e) {
    console.error('Error loading order history:', e);
    return [];
  }
}

window.openOrderHistoryModal = async function () {
  const modal = document.getElementById('order-history-modal');
  if (!modal) return;

  // Reset filter về ALL
  _currentOhFilter = 'ALL';
  // Đặt active tab
  ['ALL', 'DELIVERED', 'PROCESSING'].forEach(st => {
    const btn = document.getElementById(`oh-tab-${st}`);
    if (btn) {
      if (st === 'ALL') {
        btn.style.background = '#16a34a';
        btn.style.color = 'white';
        btn.style.border = 'none';
      } else {
        btn.style.background = '#f8fafc';
        btn.style.color = '#475569';
        btn.style.border = '1px solid #cbd5e1';
      }
    }
  });

  modal.style.display = 'flex';
  modal.style.opacity = '1';
  modal.style.visibility = 'visible';
  modal.classList.add('active');

  const body = document.getElementById('order-history-body');
  if (body) body.innerHTML = '<div style="text-align:center; padding:40px; color:#94a3b8;">⏳ Đang tải lịch sử đơn hàng...</div>';

  _cachedOrderHistory = await loadOrderHistoryFromApi();
  renderOrderHistoryList();
};

window.filterOrderHistory = function (status) {
  _currentOhFilter = status;
  ['ALL', 'DELIVERED', 'PROCESSING'].forEach(st => {
    const btn = document.getElementById(`oh-tab-${st}`);
    if (btn) {
      if (st === status) {
        btn.style.background = '#16a34a';
        btn.style.color = 'white';
        btn.style.border = 'none';
      } else {
        btn.style.background = '#f8fafc';
        btn.style.color = '#475569';
        btn.style.border = '1px solid #cbd5e1';
      }
    }
  });
  renderOrderHistoryList();
};

function getStatusInfo(status) {
  // status: 1=Đang chuẩn bị hàng, 2=Đang giao hàng, 3=Đã thanh toán
  switch (status) {
    case 1: return { text: '📦 Đang chuẩn bị hàng', bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
    case 2: return { text: '🚚 Đang giao hàng',      bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' };
    case 3: return { text: '✅ Đã thanh toán',        bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
    default: return { text: '❓ Không xác định',      bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
  }
}

function renderOrderHistoryList() {
  const body = document.getElementById('order-history-body');
  if (!body) return;

  const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
  const fmtDate = (dt) => {
    if (!dt) return '';
    const d = new Date(dt);
    return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Filter theo tab
  const filtered = _cachedOrderHistory.filter(o => {
    if (_currentOhFilter === 'ALL') return true;
    if (_currentOhFilter === 'PROCESSING') return o.status === 1 || o.status === 2; // chưa giao
    if (_currentOhFilter === 'DELIVERED')  return o.status === 3;                    // đã thanh toán
    return true;
  });

  if (filtered.length === 0) {
    body.innerHTML = `
      <div style="text-align:center; padding: 40px 20px; color: #64748b;">
        <div style="font-size: 3.5rem; margin-bottom: 12px;">📦</div>
        <h4 style="font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Không tìm thấy đơn hàng nào</h4>
        <p style="font-size: 0.88rem;">Chưa có đơn hàng phù hợp với trạng thái đã chọn.</p>
      </div>
    `;
    return;
  }

  body.innerHTML = filtered.map(order => {
    const si = getStatusInfo(order.status);
    const itemsHtml = (order.items || []).map(item => `
      <div style="display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid #f8fafc;">
        <div style="width:36px; height:36px; border-radius:8px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0;">
          ${item.productImage ? `<img src="${item.productImage}" style="width:36px;height:36px;border-radius:8px;object-fit:cover;">` : '🍎'}
        </div>
        <div style="flex:1; min-width:0;">
          <div style="font-weight:700; font-size:0.88rem; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.productName || 'Sản phẩm'}</div>
          <div style="font-size:0.78rem; color:#64748b;">SL: ${item.quantity} × ${fmt(item.unitPrice)}</div>
        </div>
        <div style="font-weight:800; color:#16a34a; font-size:0.88rem;">${fmt(item.subtotal)}</div>
      </div>
    `).join('');

    return `
      <div style="border:1.5px solid ${si.border}; border-radius:14px; margin-bottom:16px; overflow:hidden; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
        <div style="padding:12px 16px; background:${si.bg}; display:flex; align-items:center; justify-content:space-between; gap:10px;">
          <div>
            <span style="font-weight:800; color:#1e293b; font-size:0.95rem;">#${order.orderId}</span>
            <span style="color:#94a3b8; font-size:0.78rem; margin-left:8px;">${fmtDate(order.orderTime)}</span>
          </div>
          <span style="font-size:0.8rem; font-weight:700; padding:5px 14px; border-radius:20px; background:#fff; color:${si.color}; border:1.5px solid ${si.border};">${si.text}</span>
        </div>
        <div style="padding:12px 16px;">
          <div style="font-size:0.82rem; color:#475569; margin-bottom:10px; display:flex; gap:12px; flex-wrap:wrap;">
            <span>📍 ${order.address || 'N/A'}</span>
            <span>💳 ${order.payMethod || 'N/A'}</span>
          </div>
          ${itemsHtml || '<div style="font-size:0.85rem;color:#94a3b8;padding:8px 0;">Không có sản phẩm</div>'}
          <div style="text-align:right; padding-top:10px; border-top:2px solid #f1f5f9; margin-top:8px;">
            <span style="font-size:0.85rem; color:#64748b;">Tổng cộng: </span>
            <span style="font-size:1.05rem; font-weight:800; color:#16a34a;">${fmt(order.totalPrice)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.closeOrderHistoryModal = function () {
  const modal = document.getElementById('order-history-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
    modal.style.display = 'none';
  }
};

document.addEventListener('click', (e) => {
  const modal = document.getElementById('order-history-modal');
  if (modal && modal.style.display === 'flex' && e.target === modal) {
    closeOrderHistoryModal();
  }
});

window.closeUserDropdown = function () {
  const menu = document.getElementById('user-dropdown-menu');
  if (menu) menu.style.display = 'none';
};

window.handleUserLogout = function () {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.reload();
};

/* =============================
   TOAST NOTIFICATION
   ============================= */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => { toast.className = 'toast'; }, 3000);
}

/* =============================
   FORMAT PRICE
   ============================= */
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

/* =============================
   RENDER PRODUCT CARD
   ============================= */
function renderProductCard(product) {
  const priceFormatted = formatPrice(product.price);
  let firstImg = '';
  if (product.imgUrl) {
    const parts = product.imgUrl.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      firstImg = parts[0];
    }
  }

  const isUrl = firstImg && (firstImg.startsWith('http') || firstImg.startsWith('/'));
  const img = isUrl
    ? `<img src="${firstImg}" alt="${product.name}" loading="lazy">`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:4rem;">${firstImg || product.emoji || '🍎'}</div>`;

  return `
    <div class="product-card" id="product-${product.productId}">
      <div class="product-img-wrap" onclick="quickView(${product.productId})" style="cursor:pointer;">
        ${img}
        <div class="product-badges">
          ${product.origin === 'USA' || product.origin === 'Thái Lan' ? '<span class="badge badge-orange">Nhập khẩu</span>' : ''}
        </div>
      </div>
      <div class="product-info">
        <p class="product-category">${product.categoryName || ''}</p>
        <h3 class="product-name" onclick="quickView(${product.productId})" style="cursor:pointer;">${product.name}</h3>
        <div class="product-meta">
          <span class="product-origin">📍 ${product.origin || 'Việt Nam'}</span>
        </div>
        <div class="product-price-row">
          <div>
            <span class="product-price">${priceFormatted}</span>
            <span class="product-unit">/${product.unit || 'kg'}</span>
          </div>
          <button class="btn-add-cart" title="Thêm vào giỏ" onclick='event.stopPropagation(); addToCart(${JSON.stringify(product)})'>+</button>
        </div>
      </div>
    </div>
  `;
}

/* =============================
   RENDER CATEGORY CARD
   ============================= */
function renderCategoryCard(cat) {
  let defaultEmoji = '🍀';
  let description = '';
  const lowerName = (cat.name || '').toLowerCase();
  if (lowerName.includes('giỏ')) {
    defaultEmoji = '🧺';
    description = 'Giỏ quà tặng sang trọng, kết hợp tinh tế các loại quả ngon cao cấp cho mọi dịp.';
  } else if (lowerName.includes('hoa quả') || lowerName.includes('loại') || lowerName.includes('tổng hợp')) {
    defaultEmoji = '🍎';
    description = 'Tuyển chọn trái cây tươi ngon mọng nước, nhập khẩu và nội địa đạt chuẩn VietGAP.';
  } else {
    description = cat.description || 'Trái cây tươi sạch, thơm ngon thượng hạng mỗi ngày.';
  }

  const inner = cat.image
    ? `<img src="${cat.image}" alt="${cat.name}">`
    : `${cat.emoji || defaultEmoji}`;

  return `
    <div class="category-card" onclick="filterByCategory('${cat.name}')" id="cat-${cat.categoryId}">
      <div class="category-img-wrap">${inner}</div>
      <p class="category-name">${cat.name}</p>
      <p class="category-desc">${description}</p>
      <span class="category-sub">Khám phá ngay →</span>
    </div>
  `;
}

/* =============================
   HERO SLIDER
   ============================= */
const heroData = [
  {
    title: 'Trái Cây Tươi',
    highlight: 'Thẳng Từ Vườn',
    desc: 'Hoa quả sạch, tươi ngon, an toàn từ các vùng nông sản nổi tiếng Việt Nam và nhập khẩu chọn lọc.',
    bg: 'assets/images/hero_banner.png',
    tag: '🌿 100% Tươi Sạch',
  },
  {
    title: 'Hoa Quả',
    highlight: 'Nhập Khẩu Cao Cấp',
    desc: 'Cherry, nho, việt quất từ Mỹ, Úc, Hàn Quốc – giao hàng lạnh, đảm bảo chất lượng tốt nhất.',
    bg: 'assets/images/hero_banner.png',
    tag: '✈️ Nhập khẩu Chính Hãng',
  },
  {
    title: 'Đặt Hàng Dễ',
    highlight: 'Giao Tận Nơi',
    desc: 'Giao hàng nhanh trong 2-4 tiếng tại TP.HCM và Hà Nội. Cam kết tươi ngon hoặc hoàn tiền 100%.',
    bg: 'assets/images/hero_banner.png',
    tag: '🚀 Giao Hàng Nhanh 2H',
  },
];

let heroIndex = 0;
let heroTimer;

function renderHeroSlides() {
  const slider = document.getElementById('hero-slider');
  const dots = document.getElementById('hero-dots');
  if (!slider) return;

  slider.innerHTML = heroData.map((slide, i) => `
    <div class="hero-slide ${i === 0 ? 'active' : ''}" style="background-image:url('${slide.bg}')">
      <div class="hero-slide-overlay"></div>
      <div class="container">
        <div class="hero-content">
          <div class="hero-tag">${slide.tag}</div>
          <h1 class="hero-title">
            ${slide.title}
            <span class="highlight">${slide.highlight}</span>
          </h1>
          <p class="hero-desc">${slide.desc}</p>
          <div class="hero-actions">
            <a href="pages/register/index.html" class="btn btn-secondary btn-lg">🛒 Mua Ngay</a>
            <a href="#featured" class="btn btn-ghost btn-lg">Xem Sản Phẩm</a>
          </div>
          <div class="hero-stats">
            <div>
              <div class="hero-stat-number">500+</div>
              <div class="hero-stat-label">Sản phẩm</div>
            </div>
            <div>
              <div class="hero-stat-number">50K+</div>
              <div class="hero-stat-label">Khách hàng</div>
            </div>
            <div>
              <div class="hero-stat-number">200+</div>
              <div class="hero-stat-label">Cửa hàng</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  if (dots) {
    dots.innerHTML = heroData.map((_, i) => `
      <button class="hero-dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></button>
    `).join('');
  }
}

function goToSlide(index) {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  slides.forEach(s => s.classList.remove('active'));
  dots.forEach(d => d.classList.remove('active'));
  heroIndex = (index + heroData.length) % heroData.length;
  slides[heroIndex]?.classList.add('active');
  dots[heroIndex]?.classList.add('active');
}

function nextSlide() { goToSlide(heroIndex + 1); }
function prevSlide() { goToSlide(heroIndex - 1); }

function startHeroAuto() {
  heroTimer = setInterval(() => { goToSlide(heroIndex + 1); }, 5000);
}
function stopHeroAuto() { clearInterval(heroTimer); }

/* =============================
   LOAD CATEGORIES
   ============================= */
/* =============================
   LOAD CATEGORIES
   ============================= */
async function loadCategories() {
  const container = document.getElementById('categories-grid');
  if (!container) return;

  // Show skeletons
  container.innerHTML = Array(2).fill(`
    <div style="text-align:center;">
      <div class="skeleton" style="width:100px;height:100px;border-radius:50%;margin:0 auto 12px;"></div>
      <div class="skeleton" style="width:70px;height:14px;margin:0 auto;border-radius:4px;"></div>
    </div>
  `).join('');

  let cats = await API.getCategories().catch(() => null);
  if (!cats || cats.length === 0) cats = MOCK_CATEGORIES;

  // Filter to only display "Hoa quả tổng hợp" and "Giỏ hoa quả"
  const allowed = ['hoa quả tổng hợp', 'các loại hoa quả', 'giỏ hoa quả'];
  cats = cats.filter(c => c.name && allowed.some(a => c.name.trim().toLowerCase().includes(a)));

  // Standardize names
  cats.forEach(c => {
    if (c.name.trim().toLowerCase().includes('giỏ')) {
      c.name = 'Giỏ hoa quả';
    } else {
      c.name = 'Hoa quả tổng hợp';
    }
  });

  // Deduplicate by name
  const uniqueCats = [];
  const seen = new Set();
  for (const c of cats) {
    if (!seen.has(c.name)) {
      seen.add(c.name);
      uniqueCats.push(c);
    }
  }
  cats = uniqueCats;

  if (cats.length === 0) {
    cats = [
      { categoryId: 1, name: 'Giỏ hoa quả', emoji: '🧺' },
      { categoryId: 2, name: 'Hoa quả tổng hợp', emoji: '🍎' }
    ];
  }

  container.innerHTML = cats.map(renderCategoryCard).join('');
}

/* =============================
   LOAD PRODUCTS & PAGINATION
   ============================= */
let _cachedFeaturedProducts = [];
let _currentFilteredList = [];
let _currentPage = 1;
const PAGE_SIZE = 12;

function renderPaginatedProducts(page = 1) {
  _currentPage = page;
  const container = document.getElementById('featured-grid');
  const paginationContainer = document.getElementById('featured-pagination');
  if (!container) return;

  const total = _currentFilteredList.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (total === 0) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--color-gray-500);font-weight:600;">Chưa có sản phẩm nào trong mục này.</div>`;
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pagedProducts = _currentFilteredList.slice(start, end);

  container.innerHTML = pagedProducts.map(renderProductCard).join('');

  if (paginationContainer) {
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    let buttonsHtml = '';
    buttonsHtml += `<button class="pagination-btn ${page === 1 ? 'disabled' : ''}" ${page === 1 ? 'disabled' : ''} onclick="goToPage(${page - 1})">‹ Trang trước</button>`;

    for (let i = 1; i <= totalPages; i++) {
      buttonsHtml += `<button class="pagination-btn ${i === page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }

    buttonsHtml += `<button class="pagination-btn ${page === totalPages ? 'disabled' : ''}" ${page === totalPages ? 'disabled' : ''} onclick="goToPage(${page + 1})">Trang sau ›</button>`;

    paginationContainer.innerHTML = buttonsHtml;
  }
}

window.goToPage = function (page) {
  const totalPages = Math.ceil(_currentFilteredList.length / PAGE_SIZE);
  if (page < 1 || page > totalPages) return;
  renderPaginatedProducts(page);
  document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' });
};

async function loadFeaturedProducts() {
  const container = document.getElementById('featured-grid');
  if (!container) return;

  container.innerHTML = Array(8).fill(`
    <div class="card">
      <div class="skeleton" style="aspect-ratio:1;"></div>
      <div style="padding:16px;">
        <div class="skeleton" style="height:14px;margin-bottom:8px;border-radius:4px;"></div>
        <div class="skeleton" style="height:20px;margin-bottom:12px;border-radius:4px;"></div>
        <div class="skeleton" style="height:14px;width:60%;border-radius:4px;"></div>
      </div>
    </div>
  `).join('');

  let products = await API.getFeaturedProducts(100).catch(() => null);
  if (!products || products.length === 0) products = MOCK_PRODUCTS;

  _cachedFeaturedProducts = products;
  _currentFilteredList = products;
  renderPaginatedProducts(1);
}

async function loadNewProducts() {
  const container = document.getElementById('new-products-grid');
  if (!container) return;
  let products = _cachedFeaturedProducts.slice(0, 4);
  container.innerHTML = products.map(renderProductCard).join('');
}

/* =============================
   FILTER BY CATEGORY / TAB
   ============================= */
async function filterByCategory(filterTarget) {
  const container = document.getElementById('featured-grid');
  if (!container) return;

  document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' });

  if (_cachedFeaturedProducts.length === 0) {
    let products = await API.getFeaturedProducts(100).catch(() => null);
    if (!products || products.length === 0) products = MOCK_PRODUCTS;
    _cachedFeaturedProducts = products;
  }

  let filtered = _cachedFeaturedProducts;

  if (filterTarget) {
    const targetStr = String(filterTarget).trim().toLowerCase();
    filtered = _cachedFeaturedProducts.filter(p => {
      const catName = (p.categoryName || '').trim().toLowerCase();
      if (targetStr.includes('giỏ')) {
        return catName.includes('giỏ');
      } else if (targetStr.includes('tổng hợp') || targetStr.includes('hoa quả') || targetStr.includes('loại')) {
        return !catName.includes('giỏ');
      }
      return String(p.categoryId) === targetStr || catName === targetStr;
    });
  }

  _currentFilteredList = filtered;
  renderPaginatedProducts(1);
}

/* =============================
   PRODUCT ACTION STUBS
   ============================= */
function wishlistProduct(id) { showToast('❤️ Đã thêm vào danh sách yêu thích!', 'success'); }

/* =============================
   QUICK VIEW MODAL
   ============================= */

// Mock gallery images for demo (will use imgUrl as primary)
const QV_GALLERY_EMOJIS = {
  '🥭': ['🥭', '🥭', '🌿', '📦', '🏷️'],
  '🐉': ['🐉', '🐉', '🌿', '🏷️', '📦'],
  '🍇': ['🍇', '🍇', '🌿', '🚜', '🏷️'],
  '🍉': ['🍉', '🍉', '🌿', '🏷️', '📦'],
  '🍒': ['🍒', '🍒', '🌿', '📦', '🏷️'],
  '🍊': ['🍊', '🍊', '🌿', '🏷️', '🚜'],
  '🥑': ['🥑', '🥑', '🌿', '📦', '🏷️'],
  '🌟': ['🌟', '🌟', '🌿', '🏷️', '🚜'],
  '🍎': ['🍎', '🍎', '🌿', '📦', '🏷️'],
};

function getStoredReviewsMap() {
  try {
    const raw = localStorage.getItem('STORED_PRODUCT_REVIEWS');
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function saveStoredReviewsMap(map) {
  try {
    localStorage.setItem('STORED_PRODUCT_REVIEWS', JSON.stringify(map));
  } catch (e) { console.error(e); }
}

function getProductReviews(product) {
  if (!product) return [];
  const id = product.productId;
  const map = getStoredReviewsMap();
  if (!map[id]) {
    map[id] = [
      { name: 'Nguyễn Thị Lan', avatar: '👩', stars: 5, comment: `Sản phẩm ${product.name} tươi ngon, đóng gói cẩn thận. Giao hàng nhanh, sẽ mua lại!`, date: '3 ngày trước' },
      { name: 'Trần Văn Hùng', avatar: '👨', stars: 5, comment: `Chất lượng ${product.name} rất tốt, đúng như mô tả. Rất hài lòng.`, date: '1 tuần trước' }
    ];
    saveStoredReviewsMap(map);
  }
  return map[id];
}

let _qvCurrentProduct = null;
let _qvQty = 1;

async function quickView(id) {
  const modal = document.getElementById('quick-view-modal');
  const loading = document.getElementById('qv-loading');
  const body = document.getElementById('qv-body');
  const reviews = document.getElementById('qv-reviews');

  // Reset state
  _qvQty = 1;
  document.getElementById('qv-qty').textContent = '1';
  loading.style.display = 'flex';
  body.style.display = 'none';
  reviews.style.display = 'none';

  // Open modal
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  try {
    // Fetch from backend, fallback to mock data
    let product = null;
    try {
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const json = await res.json();
        product = json.data || json;
      }
    } catch (err) { /* use mock */ }

    if (!product) {
      product = MOCK_PRODUCTS.find(p => p.productId === id) || MOCK_PRODUCTS[0];
    }

    _qvCurrentProduct = product;
    populateQuickView(product);
  } catch (err) {
    console.error('[QuickView]', err);
    showToast('❌ Không thể tải thông tin sản phẩm.', 'error');
    closeQuickView();
  }
}

function populateQuickView(product) {
  const loading = document.getElementById('qv-loading');
  const body = document.getElementById('qv-body');
  const reviews = document.getElementById('qv-reviews');

  // ---- Gallery ----
  const emoji = product.emoji || '🍎';
  let galleryItems = [];
  if (product.imgUrl) {
    const urls = product.imgUrl.split(',').map(s => s.trim()).filter(Boolean);
    galleryItems = [...urls];
    while (galleryItems.length < 5) {
      galleryItems.push(null);
    }
  } else {
    galleryItems = (QV_GALLERY_EMOJIS[emoji] || ['🍎', '🍎', '🌿', '📦', '🏷️']);
  }

  const mainImgEl = document.getElementById('qv-main-img');
  const thumbsEl = document.getElementById('qv-thumbs');

  function setMainImage(src, fallbackEmoji) {
    if (src && (src.startsWith('http') || src.startsWith('/'))) {
      mainImgEl.innerHTML = `<img src="${src}" alt="product" />`;
    } else {
      mainImgEl.innerHTML = `<span style="font-size:7rem;">${src || fallbackEmoji || '🍎'}</span>`;
    }
  }

  setMainImage(galleryItems[0], emoji);

  thumbsEl.innerHTML = galleryItems.map((item, i) => {
    const content = (item && (item.startsWith('http') || item.startsWith('/')))
      ? `<img src="${item}" alt="thumb ${i}" />`
      : `<span style="font-size:1.7rem;">${item || '📦'}</span>`;
    return `<div class="qv-thumb${i === 0 ? ' active' : ''}" data-idx="${i}" data-src="${item || ''}">${content}</div>`;
  }).join('');

  thumbsEl.querySelectorAll('.qv-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbsEl.querySelectorAll('.qv-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      const src = thumb.dataset.src;
      setMainImage(src || galleryItems[parseInt(thumb.dataset.idx)], emoji);
    });
  });

  // ---- Info ----
  document.getElementById('qv-category').textContent = product.categoryName || '';
  document.getElementById('qv-name').textContent = product.name || '';
  document.getElementById('qv-price').textContent = formatPrice(product.price);
  document.getElementById('qv-unit').textContent = `/ ${product.unit || 'kg'}`;
  document.getElementById('qv-origin').textContent = product.origin || '—';

  // ---- Reviews ----
  const starCount = 5;
  document.getElementById('qv-stars').textContent = '★'.repeat(starCount);

  // Description
  const descEl = document.getElementById('qv-desc');
  if (product.description && product.description.trim()) {
    descEl.textContent = product.description;
  } else {
    descEl.textContent = `${product.name} – trái cây tươi ngon, được tuyển chọn kỹ từ ${product.origin || 'vùng nguyên sản'} đảm bảo tiêu chuẩn an toàn vệ sinh thực phẩm. Giao hàng nhanh, đóng gói cẩn thận, giữ nguyên độ tươi ngon.`;
  }

  // Load Database reviews asynchronously
  loadAndRenderProductReviews(product);

  // Initialize Star Picker
  initStarPicker();

  // Show content
  loading.style.display = 'none';
  body.style.display = 'grid';
  reviews.style.display = 'block';
}

async function loadAndRenderProductReviews(product) {
  const reviewsList = document.getElementById('qv-reviews-list');
  const ratingCount = document.getElementById('qv-rating-count');
  if (!reviewsList || !product) return;

  let prodReviews = getProductReviews(product);
  try {
    const res = await fetch(`/api/products/${product.productId}/reviews`);
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        prodReviews = json.data;
      }
    }
  } catch (e) {
    console.error('Failed to load reviews from DB:', e);
  }

  if (ratingCount) ratingCount.textContent = `(${prodReviews.length} đánh giá)`;

  if (prodReviews.length === 0) {
    reviewsList.innerHTML = `<div class="qv-no-reviews">😶 Chưa có đánh giá nào cho sản phẩm này.</div>`;
  } else {
    reviewsList.innerHTML = prodReviews.map((r, i) => `
      <div class="qv-review-card" style="animation-delay:${i * 0.06}s">
        <div class="qv-review-avatar">${r.avatar || '👤'}</div>
        <div class="qv-review-content">
          <div class="qv-review-header">
            <span class="qv-review-name">${r.name || 'Khách hàng'}</span>
            <span class="qv-review-date">${r.date || 'Vừa xong'}</span>
          </div>
          <p class="qv-review-text">${r.comment}</p>
        </div>
      </div>
    `).join('');
  }
}

let _qvSelectedStars = 5;
const STAR_LABELS = {
  1: '(1/5 Rất tệ)',
  2: '(2/5 Tệ)',
  3: '(3/5 Bình thường)',
  4: '(4/5 Hài lòng)',
  5: '(5/5 Tuyệt vời)'
};

function initStarPicker() {
  const picker = document.getElementById('qv-star-picker');
  if (!picker) return;
  _qvSelectedStars = 5;
  const stars = picker.querySelectorAll('.star-item');
  const label = document.getElementById('qv-star-label');

  stars.forEach((s, idx) => {
    s.style.color = '#f59e0b';
  });
  if (label) label.textContent = STAR_LABELS[5];

  stars.forEach(star => {
    star.onclick = () => {
      _qvSelectedStars = parseInt(star.dataset.star);
      stars.forEach((s, idx) => {
        s.style.color = idx < _qvSelectedStars ? '#f59e0b' : '#cbd5e1';
      });
      if (label) label.textContent = STAR_LABELS[_qvSelectedStars] || `(${_qvSelectedStars}/5)`;
    };
  });
}

window.submitProductReview = async function () {
  if (!_qvCurrentProduct) return;
  const token = localStorage.getItem('token');
  if (!token) {
    showToast('⚠️ Bạn cần đăng nhập để gửi đánh giá!', 'error');
    return;
  }

  const input = document.getElementById('qv-review-input');
  if (!input) return;

  const comment = input.value.trim();
  if (!comment) {
    showToast('⚠️ Vui lòng nhập nội dung nhận xét!', 'error');
    return;
  }

  const user = (window.Auth && window.Auth.getUser()) || JSON.parse(localStorage.getItem('user') || '{}');
  const userAvatar = (user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('/')))
    ? `<img src="${user.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`
    : (user.avatar || '👤');

  const newReview = {
    name: user.fullName || user.email || 'Khách hàng',
    avatar: userAvatar,
    stars: _qvSelectedStars,
    comment: comment,
    date: 'Vừa xong'
  };

  // Save to Database via REST API
  try {
    await fetch(`/api/products/${_qvCurrentProduct.productId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ comment: comment, stars: _qvSelectedStars })
    });
  } catch (e) {
    console.error('Failed to save review to database:', e);
  }

  const map = getStoredReviewsMap();
  const prodId = _qvCurrentProduct.productId;
  if (!map[prodId]) {
    map[prodId] = getProductReviews(_qvCurrentProduct);
  }
  map[prodId].unshift(newReview);
  saveStoredReviewsMap(map);

  input.value = '';
  await loadAndRenderProductReviews(_qvCurrentProduct);

  showToast('🎉 Cảm ơn bạn đã gửi đánh giá sản phẩm vào hệ thống!', 'success');
};

function closeQuickView() {
  const modal = document.getElementById('quick-view-modal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function initQuickViewModal() {
  const modal = document.getElementById('quick-view-modal');
  if (!modal) return;

  document.getElementById('qv-close')?.addEventListener('click', closeQuickView);

  // Click backdrop to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeQuickView();
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeQuickView();
  });

  // Quantity controls
  document.getElementById('qv-qty-plus')?.addEventListener('click', () => {
    _qvQty = Math.min(_qvQty + 1, 99);
    document.getElementById('qv-qty').textContent = _qvQty;
  });
  document.getElementById('qv-qty-minus')?.addEventListener('click', () => {
    _qvQty = Math.max(_qvQty - 1, 1);
    document.getElementById('qv-qty').textContent = _qvQty;
  });

  // Add to cart
  document.getElementById('qv-add-cart')?.addEventListener('click', () => {
    if (_qvCurrentProduct) {
      for (let i = 0; i < _qvQty; i++) addToCart(_qvCurrentProduct);
      closeQuickView();
    }
  });
}


/* =============================
   SEARCH
   ============================= */
async function handleSearch(e) {
  if (e.key === 'Enter' || e.type === 'click') {
    const keyword = document.getElementById('search-input')?.value.trim();
    if (!keyword) return;
    showToast(`🔍 Đang tìm "${keyword}"...`, 'success');
    const results = await API.searchProducts(keyword).catch(() => null);
    // TODO: navigate to search results page
    console.log('Search results:', results);
  }
}

/* =============================
   NAVBAR SCROLL EFFECT
   ============================= */
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  }, { passive: true });
}

/* =============================
   SCROLL TO TOP
   ============================= */
function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) btn?.classList.add('show');
    else btn?.classList.remove('show');
  }, { passive: true });
  btn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* =============================
   PRODUCT CATEGORY TABS
   ============================= */
function initProductTabs() {
  document.querySelectorAll('.product-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      document.querySelectorAll('.product-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filterVal = tab.dataset.categoryFilter || tab.dataset.categoryId || '';
      await filterByCategory(filterVal);
    });
  });
}

/* =============================
   TICKER DUPLICATE for infinite scroll
   ============================= */
function initTicker() {
  const wrap = document.getElementById('ticker-wrap');
  if (!wrap) return;
  const clone = wrap.innerHTML;
  wrap.innerHTML += clone; // Duplicate for seamless loop
}

/* =============================
   USER NAVBAR STATE
   ============================= */
function initUserNavbar() {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const loginBtn = document.getElementById('btn-login');
  const registerBtn = document.getElementById('btn-register');
  const navbarActions = document.querySelector('.navbar-actions');

  if (token && userJson && navbarActions) {
    try {
      const user = JSON.parse(userJson);
      if (loginBtn) loginBtn.style.display = 'none';
      if (registerBtn) registerBtn.style.display = 'none';

      // If user is admin, change cart button to Admin dashboard button
      const cartBtn = document.getElementById('cart-btn');
      if (user.roleName === 'ADMIN' && cartBtn) {
        const adminBtn = document.createElement('button');
        adminBtn.className = 'navbar-cart-btn';
        adminBtn.id = 'cart-btn';
        adminBtn.title = 'Trang quản trị';
        adminBtn.innerHTML = '🛠️ <span style="font-size: 13px; font-weight:bold; margin-left: 2px;">Admin</span>';
        adminBtn.style.width = 'auto';
        adminBtn.style.padding = '0 14px';
        adminBtn.style.borderRadius = 'var(--radius-full)';
        adminBtn.style.display = 'inline-flex';
        adminBtn.style.alignItems = 'center';
        adminBtn.style.gap = '4px';
        adminBtn.onclick = () => {
          window.location.href = 'pages/admin/index.html';
        };
        cartBtn.replaceWith(adminBtn);
      }

      // Remove existing profile nav if any
      const existingProfile = document.getElementById('user-profile-nav');
      if (existingProfile) existingProfile.remove();

      // Create profile nav wrapper with dropdown
      const profileNav = document.createElement('div');
      profileNav.id = 'user-profile-nav';
      profileNav.className = 'user-profile-nav';
      profileNav.style.position = 'relative';
      profileNav.style.display = 'inline-block';
      profileNav.style.marginLeft = '12px';

      const avatar = user.avatar || '👤';
      const name = user.fullName || user.email;

      profileNav.innerHTML = `
        <div id="user-dropdown-trigger" style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 6px 14px; border-radius: 20px; background: #f1f5f9; transition: all 0.2s ease; border: 1.5px solid #cbd5e1; user-select: none;">
          <span style="font-size: 18px;">${avatar}</span>
          <span style="font-weight: 700; color: #1e293b; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.92rem;">${name}</span>
          <span style="font-size: 10px; color: #64748b; transition: transform 0.2s ease;" id="user-dropdown-arrow">▼</span>
        </div>
        <div id="user-dropdown-menu" style="display: none; position: absolute; right: 0; top: calc(100% + 8px); background: #ffffff; min-width: 210px; border-radius: 16px; box-shadow: 0 12px 30px -5px rgba(0,0,0,0.18), 0 8px 10px -6px rgba(0,0,0,0.08); border: 1.5px solid #e2e8f0; z-index: 9999; overflow: hidden; padding: 6px 0; animation: fadeIn 0.2s ease;">
          <div id="opt-view-profile" style="padding: 12px 18px; font-size: 0.92rem; font-weight: 600; color: #334155; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
            👤 <span>View profile</span>
          </div>
          <div id="opt-order-history" style="padding: 12px 18px; font-size: 0.92rem; font-weight: 600; color: #334155; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
            📦 <span>Lịch sử mua hàng</span>
          </div>
          <div style="height: 1px; background: #f1f5f9; margin: 4px 0;"></div>
          <div id="opt-logout" style="padding: 12px 18px; font-size: 0.92rem; font-weight: 700; color: #ef4444; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: background 0.2s;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='transparent'">
            🚪 <span>Đăng xuất</span>
          </div>
        </div>
      `;

      navbarActions.appendChild(profileNav);

      const trigger = document.getElementById('user-dropdown-trigger');
      const menu = document.getElementById('user-dropdown-menu');
      const arrow = document.getElementById('user-dropdown-arrow');

      trigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menu.style.display === 'block';
        menu.style.display = isOpen ? 'none' : 'block';
        if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
      });

      profileNav.querySelector('#opt-view-profile')?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeUserDropdown();
        window.openProfileModal();
      });

      profileNav.querySelector('#opt-order-history')?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeUserDropdown();
        window.openOrderHistoryModal();
      });

      profileNav.querySelector('#opt-logout')?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeUserDropdown();
        window.handleUserLogout();
      });

      document.addEventListener('click', () => {
        if (menu) menu.style.display = 'none';
        if (arrow) arrow.style.transform = 'rotate(0deg)';
      });
    } catch (e) {
      console.error('Error parsing user data from localStorage', e);
    }
  }
}

/* =============================
   USER PROFILE MODAL LOGIC
   ============================= */
async function openProfileModal() {
  const token = localStorage.getItem('token');
  if (!token) return;

  const alertEl = document.getElementById('profile-alert');
  if (alertEl) {
    alertEl.className = 'profile-alert hidden';
    alertEl.textContent = '';
  }

  try {
    const response = await fetch('/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const resJson = await response.json();
    if (!response.ok) {
      throw new Error(resJson.message || 'Không thể lấy thông tin cá nhân.');
    }

    const profileData = resJson.data;

    // Populate fields
    document.getElementById('profile-email').value = profileData.email;
    document.getElementById('profile-fullname').value = profileData.fullName;
    document.getElementById('profile-phone').value = profileData.phone || '';
    document.getElementById('profile-address').value = profileData.address || '';

    const avatar = profileData.avatar || '👤';
    document.getElementById('profile-avatar-input').value = avatar;
    document.getElementById('profile-avatar-display').textContent = avatar;

    // Select emoji in grid
    document.querySelectorAll('.profile-emoji-option').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.emoji === avatar);
    });

    // Reset change password inputs & section
    const currPassInput = document.getElementById('profile-curr-pass');
    const newPassInput = document.getElementById('profile-new-pass');
    const confPassInput = document.getElementById('profile-confirm-pass');
    const changePassSec = document.getElementById('change-password-section');
    if (currPassInput) currPassInput.value = '';
    if (newPassInput) newPassInput.value = '';
    if (confPassInput) confPassInput.value = '';
    if (changePassSec) changePassSec.style.display = 'none';

    // Show modal
    document.getElementById('profile-modal').classList.add('active');
  } catch (err) {
    console.error(err);
    showToast('❌ Lỗi: ' + err.message, 'error');
  }
}
window.openProfileModal = openProfileModal;


function initProfileModalEvents() {
  const modal = document.getElementById('profile-modal');
  const closeBtn = document.getElementById('profile-modal-close');
  const cancelBtn = document.getElementById('profile-cancel-btn');
  const form = document.getElementById('profile-form');

  if (!modal) return;

  // Close modal
  const closeModal = () => modal.classList.remove('active');
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  // Click outside card to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Emoji selection
  document.querySelectorAll('.profile-emoji-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.profile-emoji-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');

      const emoji = opt.dataset.emoji;
      document.getElementById('profile-avatar-input').value = emoji;
      document.getElementById('profile-avatar-display').textContent = emoji;
    });
  });

  // Toggle Change Password Form
  const btnTogglePass = document.getElementById('btn-toggle-change-password');
  const changePassSection = document.getElementById('change-password-section');
  btnTogglePass?.addEventListener('click', () => {
    const isHidden = changePassSection.style.display === 'none';
    changePassSection.style.display = isHidden ? 'flex' : 'none';
  });

  // Submit Change Password
  const btnSubmitPass = document.getElementById('btn-submit-change-password');
  btnSubmitPass?.addEventListener('click', async () => {
    const alertEl = document.getElementById('profile-alert');
    if (alertEl) {
      alertEl.className = 'profile-alert hidden';
      alertEl.textContent = '';
    }

    const currentPassword = document.getElementById('profile-curr-pass').value;
    const newPassword = document.getElementById('profile-new-pass').value;
    const confirmPassword = document.getElementById('profile-confirm-pass').value;
    const token = localStorage.getItem('token');

    if (!currentPassword) {
      showToast('❌ Vui lòng nhập mật khẩu hiện tại!', 'error');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      showToast('❌ Mật khẩu mới tối thiểu phải có 8 ký tự!', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('❌ Mật khẩu xác nhận không khớp!', 'error');
      return;
    }

    btnSubmitPass.disabled = true;
    btnSubmitPass.textContent = 'Đang xử lý...';

    try {
      const response = await fetch('/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.message || 'Thay đổi mật khẩu thất bại.');
      }

      showToast('✅ Đổi mật khẩu thành công!', 'success');
      
      // Reset inputs & hide
      document.getElementById('profile-curr-pass').value = '';
      document.getElementById('profile-new-pass').value = '';
      document.getElementById('profile-confirm-pass').value = '';
      changePassSection.style.display = 'none';

    } catch (err) {
      console.error(err);
      showToast('❌ Lỗi: ' + err.message, 'error');
    } finally {
      btnSubmitPass.disabled = false;
      btnSubmitPass.textContent = 'Xác Nhận Đổi Mật Khẩu';
    }
  });

  // Form submit
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const saveBtn = document.getElementById('profile-save-btn');
    const alertEl = document.getElementById('profile-alert');
    if (alertEl) {
      alertEl.className = 'profile-alert hidden';
      alertEl.textContent = '';
    }

    const token = localStorage.getItem('token');
    const fullName = document.getElementById('profile-fullname').value.trim();
    const phone = document.getElementById('profile-phone').value.trim();
    const address = document.getElementById('profile-address').value.trim();
    const avatar = document.getElementById('profile-avatar-input').value;

    if (!fullName) {
      if (alertEl) {
        alertEl.textContent = '❌ Họ tên không được để trống!';
        alertEl.className = 'profile-alert error';
        alertEl.style.backgroundColor = '#fdf2f2';
        alertEl.style.color = '#ef4444';
      }
      return;
    }

    // Set loading
    if (saveBtn) {
      saveBtn.classList.add('loading');
      saveBtn.disabled = true;
    }

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName, phone, address, avatar })
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.message || 'Cập nhật thất bại.');
      }

      // Update session local storage
      const updatedUser = resJson.data;
      localStorage.setItem('user', JSON.stringify({
        userId: updatedUser.userId,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        roleName: updatedUser.roleName,
        avatar: updatedUser.avatar
      }));

      // Refresh navbar state dynamically
      initUserNavbar();

      showToast('✅ Cập nhật thông tin thành công!');
      closeModal();
    } catch (err) {
      console.error(err);
      if (alertEl) {
        alertEl.textContent = '❌ Lỗi: ' + err.message;
        alertEl.className = 'profile-alert error';
        alertEl.style.backgroundColor = '#fdf2f2';
        alertEl.style.color = '#ef4444';
      }
    } finally {
      if (saveBtn) {
        saveBtn.classList.remove('loading');
        saveBtn.disabled = false;
      }
    }
  });
}

/* =============================
   INIT
   ============================= */
document.addEventListener('DOMContentLoaded', async () => {
  // Render hero
  renderHeroSlides();
  startHeroAuto();

  // Pause slider on hover
  const heroSlider = document.getElementById('hero-slider');
  heroSlider?.addEventListener('mouseenter', stopHeroAuto);
  heroSlider?.addEventListener('mouseleave', startHeroAuto);

  // Hero arrows
  document.getElementById('hero-prev')?.addEventListener('click', () => { stopHeroAuto(); prevSlide(); startHeroAuto(); });
  document.getElementById('hero-next')?.addEventListener('click', () => { stopHeroAuto(); nextSlide(); startHeroAuto(); });

  // Navbar
  initNavbarScroll();
  initUserNavbar();
  initProfileModalEvents();
  initQuickViewModal();

  // Scroll to top
  initScrollTop();

  // Ticker
  initTicker();

  // Search
  document.getElementById('search-input')?.addEventListener('keypress', handleSearch);
  document.getElementById('search-btn')?.addEventListener('click', handleSearch);

  // Load data
  await Promise.all([
    loadCategories(),
    loadFeaturedProducts(),
    loadNewProducts(),
  ]);

  // Product tabs
  initProductTabs();

  // Cart badge & modal events
  initCartModalEvents();
  updateCartBadge();
});

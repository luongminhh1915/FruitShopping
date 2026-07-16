/**
 * FruitFresh – Admin Dashboard JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // Security: ensure user is authenticated and is ADMIN
  if (!Auth.isLoggedIn()) {
    window.location.href = '../login/index.html';
    return;
  }

  const user = Auth.getUser();
  if (!user || user.roleName !== 'ADMIN') {
    window.location.href = '/';
    return;
  }

  initAdminInfo(user);
  initTabNavigation();
  initTimeIndicator();
  initLogout();
  initProductManagement();
  initUserManagement();
  initRevenueManagement();
  initOrderManagement();
});


/* ==========================================
   POPULATE ADMIN USER INFO
   ========================================== */
function initAdminInfo(user) {
  const avatarEl = document.getElementById('admin-avatar');
  const nameEl = document.getElementById('admin-name');
  if (avatarEl) avatarEl.textContent = user.avatar || '👤';
  if (nameEl) nameEl.textContent = user.fullName || user.email;
}

/* ==========================================
   TAB NAVIGATION SYSTEM
   ========================================== */
function initTabNavigation() {
  const menuButtons = document.querySelectorAll('.menu-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const headerTitle = document.getElementById('current-tab-title');

  menuButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      menuButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === `tab-${targetTab}`) {
          pane.classList.add('active');
        }
      });

      if (headerTitle) {
        const textSpan = btn.querySelector('.menu-text');
        headerTitle.textContent = textSpan ? textSpan.textContent : 'Quản trị';
      }

      if (targetTab === 'revenue') {
        renderRevenueDashboard();
      }
      if (targetTab === 'inventory') {
        loadInventory();
      }
    });
  });
}

/* ==========================================
   REAL-TIME TIME INDICATOR
   ========================================== */
function initTimeIndicator() {
  const indicator = document.getElementById('current-time-indicator');
  if (!indicator) return;

  const update = () => {
    const now = new Date();
    indicator.textContent = now.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  update();
  setInterval(update, 1000);
}

/* ==========================================
   LOGOUT
   ========================================== */
function initLogout() {
  const btn = document.getElementById('btn-logout-admin');
  if (btn) {
    btn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        Auth.logout();
      }
    });
  }
}

/* ==========================================
   PRODUCT CRUD MANAGEMENT (PREMIUM WORKSPACE)
   ========================================== */
let categoriesList = [];
let shopsList = [];
let productsList = [];

let uploadedImages = ['', '', '', '', ''];
let activeSlotIdx = 0;

window.renderUploadSlots = function () {
  const container = document.getElementById('slots-container');
  if (!container) return;

  container.innerHTML = uploadedImages.map((src, idx) => {
    if (src) {
      const isUrl = src.startsWith('http') || src.startsWith('/');
      const content = isUrl
        ? `<img src="${src}" style="width:100%;height:100%;object-fit:cover;" />`
        : `<span style="font-size: 1.5rem; display:flex;align-items:center;justify-content:center;">${src}</span>`;
      return `
        <div class="img-upload-slot" data-slot="${idx}" style="width: 50px; height: 50px; border: 1.5px solid #16a34a; border-radius: 10px; display: flex; align-items: center; justify-content: center; position: relative; cursor: pointer; background: white; overflow: hidden;">
          ${content}
          <button type="button" class="delete-slot-btn" onclick="deleteSlotImage(event, ${idx})" style="position: absolute; top: 1px; right: 1px; background: rgba(239,68,68,0.9); color: white; border: none; border-radius: 50%; width: 14px; height: 14px; font-size: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; line-height: 1;">✕</button>
        </div>
      `;
    } else {
      return `
        <div class="img-upload-slot" onclick="triggerSlotUpload(${idx})" style="width: 50px; height: 50px; border: 1.5px dashed rgba(16, 185, 129, 0.4); border-radius: 10px; display: flex; align-items: center; justify-content: center; position: relative; cursor: pointer; background: white; transition: all 0.2s;">
          <span style="font-size: 14px; color: #16a34a;">➕</span>
        </div>
      `;
    }
  }).join('');

  // Update hidden form input
  const val = uploadedImages.filter(Boolean).join(',');
  const input = document.getElementById('form-img');
  if (input) input.value = val;
};

window.triggerSlotUpload = function (idx) {
  activeSlotIdx = idx;
  const input = prompt("Nhập Emoji (ví dụ 🥭) hoặc URL ảnh nếu muốn. Để trống để tải ảnh từ máy tính:");
  if (input !== null) {
    const val = input.trim();
    if (val) {
      uploadedImages[activeSlotIdx] = val;
      renderUploadSlots();
      return;
    }
  }
  // Trigger file upload if they cancel or leave empty
  document.getElementById('form-img-file')?.click();
};

window.deleteSlotImage = function (e, idx) {
  e.stopPropagation(); // Avoid triggering upload
  uploadedImages[idx] = '';
  renderUploadSlots();
};

async function initProductManagement() {
  await Promise.all([
    loadCategories(),
    loadShops(),
    loadProducts()
  ]);

  initModalEvents();
}

async function loadCategories() {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch('/api/categories/all', { headers });
    if (res.ok) {
      const json = await res.json();
      categoriesList = (json.data || []).filter(c =>
        c.name.toLowerCase().includes('các loại') ||
        c.name.toLowerCase().includes('giỏ')
      );
      const select = document.getElementById('form-category');
      if (select) {
        select.innerHTML = '<option value="">-- Chọn danh mục --</option>' +
          categoriesList.map(c => `<option value="${c.categoryId}">${c.name}</option>`).join('');
      }
    }
  } catch (err) {
    console.error('Lỗi tải danh mục:', err);
  }
}

async function loadShops() {
  try {
    const res = await fetch('/api/products/shops');
    if (res.ok) {
      const json = await res.json();
      shopsList = json.data || [];
      const select = document.getElementById('form-shop');
      if (select) {
        select.innerHTML = '<option value="">-- Chọn cửa hàng --</option>' +
          shopsList.map(s => `<option value="${s.shopId}">${s.shopName}</option>`).join('');
      }
    }
  } catch (err) {
    console.error('Lỗi tải danh sách cửa hàng:', err);
  }
}

async function loadProducts() {
  try {
    const res = await fetch('/api/products/all');
    if (res.ok) {
      const json = await res.json();
      productsList = json.data || [];
      renderProductsTable();
    }
  } catch (err) {
    console.error('Lỗi tải sản phẩm:', err);
  }
}

function renderProductsTable() {
  const tbody = document.getElementById('product-table-body');
  if (!tbody) return;

  if (productsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#64748b;padding:24px;">Chưa có sản phẩm nào. Hãy bấm "Thêm Sản phẩm"!</td></tr>`;
    return;
  }

  tbody.innerHTML = productsList.map(p => {
    const statusBadge = p.status === 1
      ? `<span class="badge-admin badge-admin-success">Tươi ngon / Còn hàng</span>`
      : `<span class="badge-admin badge-admin-danger">Tạm hết hàng</span>`;

    const priceFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price);

    return `
      <tr>
        <td><strong>#${p.productId}</strong></td>
        <td><strong>${p.name}</strong></td>
        <td><span style="color:#16a34a;font-weight:600;">${p.categoryName || 'N/A'}</span></td>
        <td>${p.shopName || 'N/A'}</td>
        <td><strong style="color:#16a34a;">${priceFormatted}</strong></td>
        <td>${p.unit || 'kg'}</td>
        <td>📍 ${p.origin || 'N/A'}</td>
        <td>${statusBadge}</td>
        <td style="text-align: center;">
          <button class="btn-action-view" title="Xem chi tiết" onclick="quickViewProduct(${p.productId})">👁️</button>
          <button class="btn-action-edit" title="Sửa sản phẩm" onclick="editProduct(${p.productId})">✏️</button>
          <button class="btn-action-delete" title="Xóa sản phẩm" onclick="deleteProduct(${p.productId})">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

function initModalEvents() {
  const modal = document.getElementById('product-modal');
  const addBtn = document.getElementById('btn-add-product');
  const closeBtn = document.getElementById('product-modal-close');
  const cancelBtn = document.getElementById('product-modal-cancel');
  const form = document.getElementById('product-form');

  if (!modal) return;

  const openModal = () => {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    form.reset();
    document.getElementById('form-product-id').value = '';
  };

  addBtn?.addEventListener('click', () => {
    document.getElementById('product-modal-title').textContent = 'Thêm sản phẩm mới';
    uploadedImages = ['', '', '', '', ''];
    renderUploadSlots();
    openModal();
  });

  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  const fileInput = document.getElementById('form-img-file');

  fileInput?.addEventListener('change', async () => {
    if (!fileInput.files || fileInput.files.length === 0) return;
    const file = fileInput.files[0];

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Bạn cần đăng nhập trước!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const slots = document.querySelectorAll('.img-upload-slot');
      const activeSlotElement = slots[activeSlotIdx];
      if (activeSlotElement) {
        activeSlotElement.innerHTML = '<span style="font-size: 14px;">⏳</span>';
      }

      const res = await fetch('/api/products/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Tải ảnh thất bại!');
      }

      uploadedImages[activeSlotIdx] = json.data || json;
      alert('Tải ảnh thành công!');
    } catch (err) {
      console.error(err);
      alert('❌ Lỗi tải ảnh: ' + err.message);
    } finally {
      renderUploadSlots();
      fileInput.value = ''; // Reset input file
    }
  });


  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Bạn cần đăng nhập trước!');
      return;
    }

    const id = document.getElementById('form-product-id').value;
    const productData = {
      name: document.getElementById('form-name').value.trim(),
      imgUrl: document.getElementById('form-img').value.trim(),
      categoryId: parseInt(document.getElementById('form-category').value),
      shopId: parseInt(document.getElementById('form-shop').value),
      price: parseFloat(document.getElementById('form-price').value),
      unit: document.getElementById('form-unit').value.trim(),
      origin: document.getElementById('form-origin').value.trim(),
      status: parseInt(document.getElementById('form-status').value),
      description: document.getElementById('form-desc').value.trim()
    };

    const isEdit = !!id;
    const url = isEdit ? `/api/products/${id}` : '/api/products';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Thao tác thất bại');
      }

      alert(isEdit ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!');
      closeModal();
      loadProducts();
    } catch (err) {
      console.error(err);
      alert('❌ Lỗi: ' + err.message);
    }
  });
}

window.editProduct = function (id) {
  const p = productsList.find(item => item.productId === id);
  if (!p) return;

  document.getElementById('form-product-id').value = p.productId;
  document.getElementById('form-name').value = p.name || '';

  // Populate upload slots from comma-separated string
  const imgStr = p.imgUrl || '';
  const parts = imgStr.split(',').map(s => s.trim()).filter(Boolean);
  uploadedImages = ['', '', '', '', ''];
  for (let i = 0; i < Math.min(parts.length, 5); i++) {
    uploadedImages[i] = parts[i];
  }
  renderUploadSlots();

  document.getElementById('form-category').value = p.categoryId || '';
  document.getElementById('form-shop').value = p.shopId || '';
  document.getElementById('form-price').value = p.price || 0;

  const unitSelect = document.getElementById('form-unit');
  if (unitSelect && p.unit) {
    let exists = Array.from(unitSelect.options).some(opt => opt.value === p.unit);
    if (!exists) {
      const newOpt = document.createElement('option');
      newOpt.value = p.unit;
      newOpt.textContent = p.unit;
      unitSelect.appendChild(newOpt);
    }
    unitSelect.value = p.unit;
  } else if (unitSelect) {
    unitSelect.value = '1kg';
  }

  document.getElementById('form-origin').value = p.origin || '';
  document.getElementById('form-status').value = p.status !== undefined ? p.status : 1;
  document.getElementById('form-desc').value = p.description || '';

  document.getElementById('product-modal-title').textContent = 'Sửa thông tin sản phẩm';

  const modal = document.getElementById('product-modal');
  modal?.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.deleteProduct = async function (id) {
  if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

  const token = localStorage.getItem('token');
  if (!token) {
    alert('Bạn cần đăng nhập trước!');
    return;
  }

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Xóa sản phẩm thất bại');
    }

    alert('Xóa sản phẩm thành công!');
    loadProducts();
  } catch (err) {
    console.error(err);
    alert('❌ Lỗi: ' + err.message);
  }
};


/* ==========================================================================
   CUSTOMER STYLE QUICK VIEW MODAL LOGIC FOR ADMIN
   ========================================================================== */

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

window.quickViewProduct = async function (id) {
  const modal = document.getElementById('quick-view-modal');
  const loading = document.getElementById('qv-loading');
  const body = document.getElementById('qv-body');
  const reviews = document.getElementById('qv-reviews');

  if (!modal) return;

  // Reset state
  loading.style.display = 'flex';
  body.style.display = 'none';
  reviews.style.display = 'none';

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  try {
    let product = productsList.find(p => p.productId === id);
    if (!product) {
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const json = await res.json();
        product = json.data || json;
      }
    }

    if (!product) {
      throw new Error('Không tìm thấy sản phẩm!');
    }

    _qvCurrentProduct = product;
    populateQuickView(product);
  } catch (err) {
    console.error('[QuickView]', err);
    alert('❌ Không thể tải thông tin sản phẩm: ' + err.message);
    closeQuickView();
  }
};

function populateQuickView(product) {
  const loading = document.getElementById('qv-loading');
  const body = document.getElementById('qv-body');
  const reviews = document.getElementById('qv-reviews');

  const mainImgEl = document.getElementById('qv-main-img');
  const thumbsEl = document.getElementById('qv-thumbs');

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

  const priceFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price);
  document.getElementById('qv-price').textContent = priceFormatted;
  document.getElementById('qv-unit').textContent = `/ ${product.unit || 'kg'}`;
  document.getElementById('qv-origin').textContent = product.origin || '—';

  // ---- Reviews ----
  const prodReviews = getProductReviews(product);
  const starCount = 4 + Math.round(Math.random());
  document.getElementById('qv-stars').textContent = '★'.repeat(starCount) + '☆'.repeat(5 - starCount);
  document.getElementById('qv-rating-count').textContent = `(${prodReviews.length} đánh giá)`;

  // Description
  const descEl = document.getElementById('qv-desc');
  if (product.description && product.description.trim()) {
    descEl.textContent = product.description;
  } else {
    descEl.textContent = `${product.name} – trái cây tươi ngon, được tuyển chọn kỹ từ ${product.origin || 'vùng nguyên sản'} đảm bảo tiêu chuẩn an toàn vệ sinh thực phẩm. Giao hàng sạch, chất lượng cao.`;
  }

  const reviewsList = document.getElementById('qv-reviews-list');
  if (prodReviews.length === 0) {
    reviewsList.innerHTML = `<div class="qv-no-reviews">😶 Chưa có đánh giá nào cho sản phẩm này.</div>`;
  } else {
    reviewsList.innerHTML = prodReviews.map((r, i) => `
      <div class="qv-review-card" style="animation-delay:${i * 0.06}s">
        <div class="qv-review-avatar">${r.avatar}</div>
        <div class="qv-review-content">
          <div class="qv-review-header">
            <span class="qv-review-name">${r.name}</span>
            <span class="qv-review-date">${r.date}</span>
          </div>
          <p class="qv-review-text">${r.comment}</p>
        </div>
      </div>
    `).join('');
  }

  // Initialize Star Picker
  if (typeof initStarPicker === 'function') initStarPicker();

  // Show content
  loading.style.display = 'none';
  body.style.display = 'grid';
  reviews.style.display = 'block';
}

window.closeQuickView = function () {
  const modal = document.getElementById('quick-view-modal');
  if (modal) {
    modal.classList.remove('open');
  }
  document.body.style.overflow = '';
};

// Initialize quick view close triggers
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('quick-view-modal');
  if (!modal) return;

  document.getElementById('qv-close')?.addEventListener('click', window.closeQuickView);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) window.closeQuickView();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.closeQuickView();
  });
});


/* ==========================================================================
   USER MANAGEMENT LOGIC FOR ADMIN
   ========================================================================== */
let usersList = [];
let userRolesList = [];

async function initUserManagement() {
  const searchInput = document.getElementById('user-search-input');
  const roleFilter = document.getElementById('user-role-filter');

  if (searchInput) {
    searchInput.addEventListener('input', renderUsersTable);
  }
  if (roleFilter) {
    roleFilter.addEventListener('change', renderUsersTable);
  }

  await Promise.all([
    loadUserRoles(),
    loadUsers()
  ]);
}

async function loadUserRoles() {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/admin/users/roles', { headers });
    if (res.ok) {
      const json = await res.json();
      userRolesList = json.data || [];
    }
  } catch (err) {
    console.error('Lỗi tải vai trò:', err);
  }
}

async function loadUsers() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const json = await res.json();
      usersList = json.data || [];
      updateUserStats();
      renderUsersTable();
    } else {
      console.error('Lỗi lấy danh sách người dùng:', res.statusText);
    }
  } catch (err) {
    console.error('Lỗi tải danh sách người dùng:', err);
  }
}

function updateUserStats() {
  const totalEl = document.getElementById('stat-total-users');
  const customerEl = document.getElementById('stat-customer-users');
  const customerActiveEl = document.getElementById('stat-customer-active');
  const sellerEl = document.getElementById('stat-seller-users');
  const sellerActiveEl = document.getElementById('stat-seller-active');
  const adminEl = document.getElementById('stat-admin-users');

  const customers = usersList.filter(u => u.roleName === 'CUSTOMER');
  const activeCustomers = customers.filter(u => u.isActive).length;

  const sellers = usersList.filter(u => u.roleName === 'SELLER');
  const activeSellers = sellers.filter(u => u.isActive).length;

  const admins = usersList.filter(u => u.roleName === 'ADMIN');

  if (totalEl) totalEl.textContent = usersList.length;
  if (customerEl) customerEl.textContent = customers.length;
  if (customerActiveEl) customerActiveEl.textContent = `🟢 ${activeCustomers} đang hoạt động`;
  if (sellerEl) sellerEl.textContent = sellers.length;
  if (sellerActiveEl) sellerActiveEl.textContent = `🟢 ${activeSellers} đang hoạt động`;
  if (adminEl) adminEl.textContent = admins.length;
}

function renderUsersTable() {
  const tbody = document.getElementById('user-table-body');
  if (!tbody) return;

  const searchVal = (document.getElementById('user-search-input')?.value || '').toLowerCase().trim();
  const roleVal = document.getElementById('user-role-filter')?.value || '';

  const filteredUsers = usersList.filter(user => {
    const matchSearch = !searchVal ||
      (user.fullName && user.fullName.toLowerCase().includes(searchVal)) ||
      (user.email && user.email.toLowerCase().includes(searchVal)) ||
      (user.phone && user.phone.toLowerCase().includes(searchVal));

    const matchRole = !roleVal || user.roleName === roleVal;

    return matchSearch && matchRole;
  });

  if (filteredUsers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#64748b;padding:24px;">Không tìm thấy người dùng nào phù hợp.</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredUsers.map(u => {
    const avatarContent = (u.avatar && (u.avatar.startsWith('http') || u.avatar.startsWith('/')))
      ? `<img src="${u.avatar}" alt="avatar" />`
      : `<span>${u.avatar || '👤'}</span>`;

    let roleBadge = `<span class="badge-role badge-role-customer" style="background: rgba(59,130,246,0.15); color: #2563eb; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.8rem;">👤 Customer</span>`;
    if (u.roleName === 'ADMIN') {
      roleBadge = `<span class="badge-role badge-role-admin" style="background: rgba(245,158,11,0.15); color: #d97706; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.8rem;">👑 Admin</span>`;
    } else if (u.roleName === 'SELLER') {
      roleBadge = `<span class="badge-role badge-role-seller" style="background: rgba(147,51,234,0.15); color: #9333ea; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.8rem;">🏪 Seller</span>`;
    }

    const statusBadge = u.isActive
      ? `<span class="badge-admin badge-admin-success" style="background: rgba(16, 185, 129, 0.15); color: #16a34a; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.8rem;">🟢 Hoạt động</span>`
      : `<span class="badge-admin badge-admin-danger" style="background: rgba(239, 68, 68, 0.15); color: #dc2626; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.8rem;">🔴 Đã khóa</span>`;

    const toggleStatusBtn = u.isActive
      ? `<button class="btn-action-delete" title="Khóa tài khoản" onclick="toggleUserStatus(${u.userId}, false)" style="width: auto; padding: 4px 10px; font-size: 12px; font-weight: 700;">🔒 Khóa</button>`
      : `<button class="btn-action-edit" title="Mở khóa tài khoản" onclick="toggleUserStatus(${u.userId}, true)" style="width: auto; padding: 4px 10px; font-size: 12px; font-weight: 700;">🔓 Mở khóa</button>`;

    // Role switcher toggle button between SELLER and CUSTOMER
    const targetRoleName = u.roleName === 'SELLER' ? 'CUSTOMER' : 'SELLER';
    const targetRoleObj = userRolesList.find(r => r.roleName === targetRoleName);
    const targetRoleId = targetRoleObj ? targetRoleObj.roleId : (targetRoleName === 'SELLER' ? 2 : 3);
    const roleSwitchHtml = `<button class="btn-action-view" title="Chuyển vai trò sang ${targetRoleName}" onclick="changeUserRole(${u.userId}, ${targetRoleId}, '${targetRoleName}')" style="width: auto; padding: 4px 10px; font-size: 12px; font-weight: 700; background: rgba(245, 158, 11, 0.1); color: #d97706;">🔄 Sang ${targetRoleName}</button>`;

    return `
      <tr>
        <td><strong>#${u.userId}</strong></td>
        <td>
          <div class="user-profile-cell">
            <div class="user-avatar-circle">${avatarContent}</div>
            <div class="user-details">
              <span class="user-name-text">${u.fullName || 'N/A'}</span>
              <span class="user-email-text">${u.email}</span>
            </div>
          </div>
        </td>
        <td>${u.phone || '—'}</td>
        <td>${u.address || '—'}</td>
        <td>${roleBadge}</td>
        <td>${statusBadge}</td>
        <td style="text-align: center;">
          ${u.roleName === 'ADMIN' ? '<span style="color: #94a3b8; font-weight: 600;">—</span>' : `${toggleStatusBtn} ${roleSwitchHtml}`}
        </td>
      </tr>
    `;
  }).join('');
}

window.toggleUserStatus = async function (userId, isActivating) {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch(`/api/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Thao tác thất bại!');
    }

    const updatedUser = json.data;
    const targetInList = usersList.find(u => u.userId === userId);
    if (targetInList && updatedUser) {
      targetInList.isActive = updatedUser.isActive;
    }
    updateUserStats();
    renderUsersTable();
  } catch (err) {
    console.error(err);
    alert('❌ Lỗi: ' + err.message);
  }
};

window.changeUserRole = async function (userId, roleId, roleName) {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ roleId })
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Thay đổi vai trò thất bại!');
    }

    const updatedUser = json.data;
    const targetInList = usersList.find(u => u.userId === userId);
    if (targetInList && updatedUser) {
      targetInList.roleId = updatedUser.roleId;
      targetInList.roleName = updatedUser.roleName;
    }
    updateUserStats();
    renderUsersTable();
  } catch (err) {
    console.error(err);
    alert('❌ Lỗi: ' + err.message);
  }
};


/* ==========================================
   REVENUE MANAGEMENT DASHBOARD
   ========================================== */
let _revCurrentPeriod = 'ALL';

function initRevenueManagement() {
  renderRevenueDashboard();
}

function getStoredRevenueOrders() {
  try {
    const raw = localStorage.getItem('USER_ORDER_HISTORY');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { console.error(e); }

  // Default rich sample orders if empty
  return [
    {
      orderId: 'DH928401',
      date: '27/06/2026 14:20',
      address: 'Số 12 Chùa Bộc, Đống Đa, Hà Nội',
      payMethod: 'Thanh toán khi nhận hàng (COD)',
      totalPrice: '200.000 đ',
      numericTotal: 200000,
      status: 'DELIVERED',
      items: [
        { productId: 1, name: 'Sầu riêng Monthong', price: 120000, quantity: 1 },
        { productId: 2, name: 'Bơ Booth Đắk Lắk', price: 80000, quantity: 1 }
      ]
    },
    {
      orderId: 'DH812940',
      date: '20/06/2026 09:15',
      address: 'Số 12 Chùa Bộc, Đống Đa, Hà Nội',
      payMethod: 'Thanh toán Online (VNPay)',
      totalPrice: '95.000 đ',
      numericTotal: 95000,
      status: 'DELIVERED',
      items: [
        { productId: 3, name: 'Dưa Hấu Không Hạt', price: 25000, quantity: 1 },
        { productId: 4, name: 'Nho Mẫu Đơn', price: 70000, quantity: 1 }
      ]
    }
  ];
}

window.filterRevenuePeriod = function (period) {
  _revCurrentPeriod = period;
  ['ALL', 'TODAY', 'WEEK', 'MONTH'].forEach(p => {
    const btn = document.getElementById(`rev-period-${p}`);
    if (btn) {
      if (p === period) {
        btn.style.background = '#16a34a';
        btn.style.color = 'white';
        btn.style.border = 'none';
      } else {
        btn.style.background = '#fff';
        btn.style.color = '#475569';
        btn.style.border = '1px solid #cbd5e1';
      }
    }
  });
  renderRevenueDashboard();
};

async function renderRevenueDashboard() {
  const token = localStorage.getItem('token');
  const fmt = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  // --- Tải số liệu thống kê từ API (tổng doanh thu, VNPay, COD) ---
  if (token) {
    try {
      const res = await fetch(`/api/admin/revenue/stats?period=${_revCurrentPeriod}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const stats = json.data;
          const totalEl  = document.getElementById('rev-stat-total');
          const ordersEl = document.getElementById('rev-stat-orders');
          const vnpayEl  = document.getElementById('rev-stat-vnpay');
          const codEl    = document.getElementById('rev-stat-cod');
          if (totalEl)  totalEl.textContent  = fmt(stats.totalRevenue);
          if (ordersEl) ordersEl.textContent = stats.totalOrders;
          if (vnpayEl)  vnpayEl.textContent  = fmt(stats.vnpayRevenue);
          if (codEl)    codEl.textContent    = fmt(stats.codRevenue);
        }
      }
    } catch (e) {
      console.log('Revenue stats API error, will use local calculation:', e);
    }
  }

  // --- Tải danh sách đơn hàng đã thanh toán (status=3) từ DB ---
  let paidOrders = [];
  try {
    const res = await fetch('/api/orders/all', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        paidOrders = (json.data || []).filter(o => o.status === 3);
      }
    }
  } catch (e) {
    console.error('Failed to load paid orders from DB:', e);
  }

  // --- Lọc theo kỳ thời gian ---
  const now = new Date();
  const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart   = new Date(now); weekStart.setDate(weekStart.getDate() - 7);
  const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);

  const filteredOrders = paidOrders.filter(o => {
    if (_revCurrentPeriod === 'ALL') return true;
    const t = o.orderTime ? new Date(o.orderTime) : null;
    if (!t) return _revCurrentPeriod === 'ALL';
    if (_revCurrentPeriod === 'TODAY') return t >= todayStart;
    if (_revCurrentPeriod === 'WEEK')  return t >= weekStart;
    if (_revCurrentPeriod === 'MONTH') return t >= monthStart;
    return true;
  });

  // --- Tính tổng cục bộ (dự phòng khi API stats không trả về) ---
  let totalRev = 0, vnpayRev = 0, codRev = 0;
  const productSalesMap = {};

  filteredOrders.forEach(o => {
    const amt = parseFloat(o.totalPrice) || 0;
    totalRev += amt;
    if (o.payMethod && o.payMethod.toLowerCase().includes('vnpay')) {
      vnpayRev += amt;
    } else {
      codRev += amt;
    }
    (o.items || []).forEach(item => {
      const pName  = item.productName || item.name || 'Sản phẩm';
      const pQty   = item.quantity || 1;
      const pPrice = parseFloat(item.unitPrice) || parseFloat(item.price) || 0;
      const pTotal = pPrice * pQty;
      if (!productSalesMap[pName]) productSalesMap[pName] = { name: pName, qty: 0, total: 0 };
      productSalesMap[pName].qty   += pQty;
      productSalesMap[pName].total += pTotal;
    });
  });

  // Cập nhật stat cards (chỉ khi API stats chưa set)
  const totalEl  = document.getElementById('rev-stat-total');
  const ordersEl = document.getElementById('rev-stat-orders');
  const vnpayEl  = document.getElementById('rev-stat-vnpay');
  const codEl    = document.getElementById('rev-stat-cod');
  if (totalEl  && (totalEl.textContent  === '0 đ' || !token)) totalEl.textContent  = fmt(totalRev);
  if (ordersEl && (ordersEl.textContent === '0'   || !token)) ordersEl.textContent = filteredOrders.length;
  if (vnpayEl  && (vnpayEl.textContent  === '0 đ' || !token)) vnpayEl.textContent  = fmt(vnpayRev);
  if (codEl    && (codEl.textContent    === '0 đ' || !token)) codEl.textContent    = fmt(codRev);

  // --- Sản phẩm bán chạy ---
  const topListEl = document.getElementById('rev-top-products-list');
  if (topListEl) {
    const sortedProducts = Object.values(productSalesMap).sort((a, b) => b.total - a.total).slice(0, 4);
    if (sortedProducts.length === 0) {
      topListEl.innerHTML = '<div style="font-size:0.9rem; color:#64748b;">Chưa có dữ liệu thống kê sản phẩm.</div>';
    } else {
      const maxTotal = sortedProducts[0].total || 1;
      const medals = ['🥇', '🥈', '🥉', '🏅'];
      topListEl.innerHTML = sortedProducts.map((p, idx) => {
        const pct = Math.min(100, Math.round((p.total / maxTotal) * 100));
        return `
          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.9rem; font-weight:700; color:#334155; margin-bottom:4px;">
              <span>${medals[idx] || '🍎'} ${p.name} <span style="font-size:0.8rem; color:#64748b; font-weight:500;">(Đã bán: ${p.qty})</span></span>
              <span style="color:#16a34a;">${fmt(p.total)}</span>
            </div>
            <div style="background:#f1f5f9; height:8px; border-radius:4px; overflow:hidden;">
              <div style="background: linear-gradient(90deg, #16a34a, #22c55e); height:100%; width:${pct}%; border-radius:4px; transition:width 0.5s;"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // --- Render bảng nhật ký ---
  renderRevenueTable(filteredOrders);
}


window.renderRevenueTable = function (activeOrders) {
  const body = document.getElementById('revenue-table-body');
  if (!body) return;

  const searchKeyword = (document.getElementById('rev-search-input')?.value || '').toLowerCase().trim();
  const orders = activeOrders || [];

  const filtered = orders.filter(o => {
    if (!searchKeyword) return true;
    const matchId   = String(o.orderId   || '').toLowerCase().includes(searchKeyword);
    const matchName = (o.customerName    || '').toLowerCase().includes(searchKeyword);
    const matchAddr = (o.address         || '').toLowerCase().includes(searchKeyword);
    const matchPay  = (o.payMethod       || '').toLowerCase().includes(searchKeyword);
    return matchId || matchName || matchAddr || matchPay;
  });

  if (filtered.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding: 30px; color: #64748b;">
          🔍 Không tìm thấy nhật ký giao dịch nào phù hợp.
        </td>
      </tr>
    `;
    return;
  }

  const fmt = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  const fmtDate = (dt) => {
    if (!dt) return 'N/A';
    const d = new Date(dt);
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  body.innerHTML = filtered.map(o => {
    const amt       = parseFloat(o.totalPrice) || 0;
    const isVnPay   = o.payMethod && o.payMethod.toLowerCase().includes('vnpay');
    const payStyle  = isVnPay ? 'background:#e0f2fe; color:#0369a1;' : 'background:#fef3c7; color:#d97706;';
    const itemCount = (o.items || []).reduce((s, i) => s + (i.quantity || 1), 0) || 1;

    return `
      <tr>
        <td><strong style="color:#16a34a;">#${o.orderId}</strong></td>
        <td style="font-size:0.85rem; color:#64748b;">🕒 ${fmtDate(o.orderTime)}</td>
        <td style="font-size:0.85rem; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          <div style="font-weight:600; color:#1e293b;">${o.customerName || 'N/A'}</div>
          <div style="font-size:0.78rem; color:#94a3b8;">📍 ${o.address || 'N/A'}</div>
        </td>
        <td><span style="font-size:0.78rem; font-weight:700; padding:4px 10px; border-radius:12px; ${payStyle}">${o.payMethod || 'N/A'}</span></td>
        <td style="text-align:center; font-weight:700;">${itemCount} sp</td>
        <td style="font-weight:800; color:#1e293b;">${fmt(amt)}</td>
        <td style="text-align:center;"><span style="background:#dcfce7; color:#15803d; padding:4px 10px; border-radius:12px; font-size:0.78rem; font-weight:700;">✅ Thành công</span></td>
      </tr>
    `;
  }).join('');
};


/* ==========================================
   ORDER MANAGEMENT (ADMIN)
   ========================================== */
let _allAdminOrders = [];

function initOrderManagement() {
  // Load orders khi click vào tab "Quản lý Order"
  document.querySelectorAll('.menu-item').forEach(btn => {
    if (btn.getAttribute('data-tab') === 'orders') {
      btn.addEventListener('click', () => window.loadAdminOrders());
    }
  });

  // Search filter
  document.getElementById('ord-search-input')?.addEventListener('input', () => renderOrderTable(_allAdminOrders));
  // Status filter
  document.getElementById('ord-status-filter')?.addEventListener('change', () => renderOrderTable(_allAdminOrders));
}

window.loadAdminOrders = async function () {
  const tbody = document.getElementById('order-admin-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:40px; color:#94a3b8;">⏳ Đang tải...</td></tr>';

  try {
    const token = Auth.getToken();
    const res = await fetch('/api/orders/all', {
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Lỗi tải đơn hàng');

    _allAdminOrders = json.data || [];
    renderOrderTable(_allAdminOrders);
    updateOrderStats(_allAdminOrders);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:40px; color:#ef4444;">❌ ${err.message}</td></tr>`;
  }
};

function updateOrderStats(orders) {
  const prep = orders.filter(o => o.status === 1).length;
  const del = orders.filter(o => o.status === 2).length;
  const done = orders.filter(o => o.status === 3).length;
  const prepEl = document.getElementById('ord-stat-preparing');
  const delEl = document.getElementById('ord-stat-delivering');
  const doneEl = document.getElementById('ord-stat-done');
  if (prepEl) prepEl.textContent = prep;
  if (delEl) delEl.textContent = del;
  if (doneEl) doneEl.textContent = done;
}

function renderOrderTable(orders) {
  const tbody = document.getElementById('order-admin-table-body');
  if (!tbody) return;

  const keyword = (document.getElementById('ord-search-input')?.value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('ord-status-filter')?.value || '';
  const fmt = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  const fmtDate = (dt) => {
    if (!dt) return 'N/A';
    const d = new Date(dt);
    return d.toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  };

  const filtered = orders.filter(o => {
    const matchKw = !keyword ||
      (o.customerName || '').toLowerCase().includes(keyword) ||
      (o.customerEmail || '').toLowerCase().includes(keyword) ||
      (o.address || '').toLowerCase().includes(keyword);
    const matchStatus = !statusFilter || String(o.status) === statusFilter;
    return matchKw && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:40px; color:#94a3b8;">🔍 Không có đơn hàng nào.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(o => {
    const statusInfo = getOrderStatusInfo(o.status);
    const actionBtns = getOrderActionButtons(o);
    const isVnPay = o.payMethod && o.payMethod.toLowerCase().includes('vnpay');
    const payBadge = isVnPay
      ? 'background:#e0f2fe; color:#0369a1;'
      : 'background:#fef3c7; color:#d97706;';

    // Tính tổng số lượng sản phẩm
    const totalQty = (o.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
    const itemCount = (o.items || []).length;
    const qtyLabel = itemCount > 0
      ? `${totalQty} sp (${itemCount} loại)`
      : `0`;

    // Escape items JSON for onclick
    const itemsJson = JSON.stringify(o.items || []).replace(/"/g, '&quot;');

    return `
      <tr>
        <td><strong style="color:#16a34a;">#${o.orderId}</strong></td>
        <td>
          <div style="font-weight:700; color:#1e293b; font-size:0.9rem;">${o.customerName || 'N/A'}</div>
          <div style="font-size:0.78rem; color:#64748b;">${o.customerEmail || ''}</div>
        </td>
        <td style="font-size:0.83rem; color:#475569; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">📍 ${o.address || 'N/A'}</td>
        <td><span style="font-size:0.78rem; font-weight:700; padding:4px 10px; border-radius:12px; ${payBadge}">${o.payMethod || 'N/A'}</span></td>
        <td style="text-align:center;">
          ${itemCount > 0
            ? `<button onclick="showOrderItems(event, '${itemsJson}')" title="Xem danh sách sản phẩm"
                style="background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; border:none; border-radius:20px;
                       padding:5px 12px; font-size:0.8rem; font-weight:700; cursor:pointer;
                       box-shadow:0 2px 8px rgba(99,102,241,0.3); transition:all 0.2s;
                       display:inline-flex; align-items:center; gap:5px;"
                onmouseover="this.style.transform='scale(1.06)'" onmouseout="this.style.transform='scale(1)'">
                🛒 ${qtyLabel}
              </button>`
            : `<span style="color:#94a3b8; font-size:0.82rem;">0</span>`
          }
        </td>
        <td style="font-weight:800; color:#1e293b;">${fmt(o.totalPrice)}</td>
        <td style="font-size:0.8rem; color:#64748b;">${fmtDate(o.orderTime)}</td>
        <td style="text-align:center;">
          <span style="font-size:0.78rem; font-weight:700; padding:5px 12px; border-radius:20px; ${statusInfo.style}">${statusInfo.label}</span>
        </td>
        <td style="text-align:center;">${actionBtns}</td>
      </tr>
    `;
  }).join('');
}

function getOrderStatusInfo(status) {
  switch (status) {
    case 1: return { label: '📦 Đang chuẩn bị', style: 'background:#fef3c7; color:#b45309;' };
    case 2: return { label: '🚚 Đang giao hàng', style: 'background:#dbeafe; color:#1d4ed8;' };
    case 3: return { label: '✅ Đã thanh toán', style: 'background:#dcfce7; color:#15803d;' };
    default: return { label: '❓ Không xác định', style: 'background:#f1f5f9; color:#64748b;' };
  }
}

function getOrderActionButtons(o) {
  if (o.status === 1) {
    return `<button onclick="window.updateOrderStatus(${o.orderId}, 2)" style="padding:6px 14px; background:linear-gradient(135deg,#3b82f6,#1d4ed8); color:#fff; border:none; border-radius:8px; font-size:0.82rem; font-weight:700; cursor:pointer;">🚚 Giao hàng</button>`;
  }
  if (o.status === 2) {
    return `<button onclick="window.updateOrderStatus(${o.orderId}, 3)" style="padding:6px 14px; background:linear-gradient(135deg,#16a34a,#15803d); color:#fff; border:none; border-radius:8px; font-size:0.82rem; font-weight:700; cursor:pointer;">💰 Đã thanh toán</button>`;
  }
  return '<span style="color:#94a3b8; font-size:0.82rem;">—</span>';
}

window.updateOrderStatus = async function (orderId, newStatus) {
  const labels = { 2: 'Giao hàng', 3: 'Đã thanh toán' };
  if (!confirm(`Xác nhận chuyển đơn hàng #${orderId} sang trạng thái "${labels[newStatus]}"?`)) return;

  try {
    const token = Auth.getToken();
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      },
      body: JSON.stringify({ status: newStatus })
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Lỗi cập nhật');

    // Cập nhật local data
    const order = _allAdminOrders.find(o => o.orderId === orderId);
    if (order) {
      order.status = newStatus;
    }
    renderOrderTable(_allAdminOrders);
    updateOrderStats(_allAdminOrders);

    showAdminToast(`✅ Đơn hàng #${orderId} đã được cập nhật thành công!`, 'success');
  } catch (err) {
    showAdminToast(`❌ ${err.message}`, 'error');
  }
};

function showAdminToast(message, type = 'success') {
  const existing = document.getElementById('admin-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'admin-toast';
  const bg = type === 'success' ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#ef4444,#dc2626)';
  toast.style.cssText = `position:fixed; bottom:30px; right:30px; background:${bg}; color:#fff; padding:14px 22px; border-radius:14px; font-size:0.92rem; font-weight:700; z-index:99999; box-shadow:0 8px 24px rgba(0,0,0,0.2); animation:slideInRight 0.3s ease;`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

/* ======================================================
   PRODUCT LIST POPUP – Hiện danh sách sản phẩm khi click
   ====================================================== */
window.showOrderItems = function (event, itemsJsonStr) {
  // Ngăn event bubble lên document (tránh kích hoạt _closePopupOnOutsideClick)
  event.stopPropagation();

  const existing = document.getElementById('order-items-popup');
  // Dùng 40 ký tự đầu của JSON làm key nhận dạng nút
  const currentKey = itemsJsonStr.substring(0, 40);

  if (existing) {
    const wasThisButton = existing.dataset.source === currentKey;
    closeOrderItemsPopup(); // Luôn cleanup listener khi đóng popup cũ
    if (wasThisButton) return; // Toggle: cùng nút → chỉ đóng, không mở lại
  }

  let items = [];
  try { items = JSON.parse(itemsJsonStr.replace(/&quot;/g, '"')); } catch (e) {}

  const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

  const popup = document.createElement('div');
  popup.id = 'order-items-popup';
  popup.dataset.source = currentKey;

  popup.style.cssText = `
    position: fixed;
    z-index: 99999;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(99,102,241,0.15);
    border: 1.5px solid #e0e7ff;
    padding: 0;
    min-width: 320px;
    max-width: 420px;
    animation: fadeInUp 0.2s ease;
    overflow: hidden;
  `;

  // Tính vị trí popup (tránh vượt ra ngoài màn hình)
  const rect = event.currentTarget.getBoundingClientRect();
  const popupTop  = Math.min(rect.bottom + 8, window.innerHeight - 360);
  const popupLeft = Math.max(8, Math.min(rect.left, window.innerWidth - 440));
  popup.style.top  = popupTop  + 'px';
  popup.style.left = popupLeft + 'px';

  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: #fff;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 800;
    font-size: 0.9rem;
  `;
  header.innerHTML = `
    <span>🛒 Danh sách sản phẩm (${items.length} loại)</span>
    <button onclick="closeOrderItemsPopup()"
      style="background:rgba(255,255,255,0.2); border:none; color:#fff; cursor:pointer;
             border-radius:50%; width:24px; height:24px; font-size:0.9rem;
             display:flex; align-items:center; justify-content:center;">✕</button>
  `;
  popup.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.style.cssText = `padding: 12px 14px; max-height: 320px; overflow-y: auto;`;

  if (items.length === 0) {
    body.innerHTML = `<div style="text-align:center; padding:20px; color:#94a3b8; font-size:0.85rem;">Không có sản phẩm nào</div>`;
  } else {
    body.innerHTML = items.map((item, i) => {
      const img = item.productImage
        ? `<img src="${item.productImage}" style="width:40px; height:40px; border-radius:10px; object-fit:cover;">`
        : `<div style="width:40px; height:40px; border-radius:10px; background:linear-gradient(135deg,#f0fdf4,#dcfce7); display:flex; align-items:center; justify-content:center; font-size:1.2rem;">🍎</div>`;
      const subtotal  = item.subtotal  || ((item.unitPrice || 0) * (item.quantity || 1));
      const unitPrice = item.unitPrice || (item.subtotal && item.quantity ? item.subtotal / item.quantity : 0);

      return `
        <div style="display:flex; align-items:center; gap:12px; padding:10px 0;
                    ${i < items.length - 1 ? 'border-bottom: 1px solid #f1f5f9;' : ''}">
          ${img}
          <div style="flex:1; min-width:0;">
            <div style="font-weight:700; font-size:0.88rem; color:#1e293b;
                        white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${item.productName || item.name || 'Sản phẩm'}
            </div>
            <div style="font-size:0.77rem; color:#64748b; margin-top:2px;">
              SL: <strong>${item.quantity}</strong> × ${fmt(unitPrice)}
            </div>
          </div>
          <div style="font-weight:800; color:#16a34a; font-size:0.88rem; white-space:nowrap;">
            ${fmt(subtotal)}
          </div>
        </div>
      `;
    }).join('');

    // Footer tổng
    const grandTotal = items.reduce((s, it) => s + (it.subtotal || ((it.unitPrice || 0) * (it.quantity || 1))), 0);
    const totalQty   = items.reduce((s, it) => s + (it.quantity || 0), 0);
    body.innerHTML += `
      <div style="border-top:2px solid #f1f5f9; margin-top:8px; padding-top:10px;
                  display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:0.82rem; color:#64748b;">
          Tổng: <strong>${totalQty} sản phẩm</strong>
        </span>
        <span style="font-weight:800; color:#6366f1; font-size:0.95rem;">${fmt(grandTotal)}</span>
      </div>
    `;
  }

  popup.appendChild(body);
  document.body.appendChild(popup);

  // Đăng ký đóng khi click ngoài – requestAnimationFrame đảm bảo
  // listener không catch ngay click hiện tại
  requestAnimationFrame(() => {
    document.addEventListener('click', _closePopupOnOutsideClick);
  });
};

function _closePopupOnOutsideClick(e) {
  const popup = document.getElementById('order-items-popup');
  if (popup && !popup.contains(e.target)) {
    popup.remove();
    document.removeEventListener('click', _closePopupOnOutsideClick);
  }
}

window.closeOrderItemsPopup = function () {
  const popup = document.getElementById('order-items-popup');
  if (popup) popup.remove();
  document.removeEventListener('click', _closePopupOnOutsideClick);
};

/* ==========================================
   INVENTORY MANAGEMENT
   ========================================== */
let _inventoryData = [];

async function loadInventory() {
  const tbody = document.getElementById('inv-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;">⏳ Đang tải...</td></tr>';
  try {
    const res = await fetch('/api/inventory');
    _inventoryData = await res.json();
    renderInventoryTable(_inventoryData);
    updateInventoryStats(_inventoryData);
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#ef4444;">❌ Không thể tải dữ liệu kho!</td></tr>';
  }
}

function updateInventoryStats(data) {
  const total = data.length;
  const inStock = data.filter(i => i.stockStatus === 'in_stock').length;
  const low = data.filter(i => i.stockStatus === 'low_stock').length;
  const out = data.filter(i => i.stockStatus === 'out_of_stock').length;
  const el = id => document.getElementById(id);
  if (el('inv-stat-total'))    el('inv-stat-total').textContent = total;
  if (el('inv-stat-in-stock')) el('inv-stat-in-stock').textContent = inStock;
  if (el('inv-stat-low'))      el('inv-stat-low').textContent = low;
  if (el('inv-stat-out'))      el('inv-stat-out').textContent = out;
}

function renderInventoryTable(data) {
  const tbody = document.getElementById('inv-table-body');
  if (!tbody) return;
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;">📭 Chưa có dữ liệu tồn kho. Nhấn "Khởi tạo tất cả sản phẩm" để bắt đầu.</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(item => {
    const statusBadge = {
      in_stock:     `<span style="background:#dcfce7;color:#16a34a;padding:3px 10px;border-radius:20px;font-size:0.82rem;font-weight:700;">✅ Còn hàng</span>`,
      low_stock:    `<span style="background:#fef3c7;color:#d97706;padding:3px 10px;border-radius:20px;font-size:0.82rem;font-weight:700;">⚠️ Sắp hết</span>`,
      out_of_stock: `<span style="background:#fee2e2;color:#dc2626;padding:3px 10px;border-radius:20px;font-size:0.82rem;font-weight:700;">❌ Hết hàng</span>`
    }[item.stockStatus] || '';
    const imgHtml = item.productImage
      ? `<img src="${item.productImage}" style="width:40px;height:40px;object-fit:cover;border-radius:8px;margin-right:10px;vertical-align:middle;" onerror="this.style.display='none'" />`
      : '<span style="width:40px;height:40px;display:inline-flex;align-items:center;justify-content:center;background:#f1f5f9;border-radius:8px;margin-right:10px;font-size:1.2rem;">🍎</span>';
    const updatedAt = item.updatedAt ? new Date(item.updatedAt).toLocaleString('vi-VN') : 'Chưa cập nhật';
    const price = item.price ? Number(item.price).toLocaleString('vi-VN') + ' đ' : 'N/A';
    return `<tr data-product-id="${item.productId}" data-stock-status="${item.stockStatus}" data-product-name="${(item.productName||'').toLowerCase()}" data-category="${(item.categoryName||'').toLowerCase()}">
      <td><div style="display:flex;align-items:center;">${imgHtml}<span style="font-weight:600;">${item.productName}</span></div></td>
      <td>${item.categoryName || 'N/A'}</td>
      <td>${price}</td>
      <td><span style="font-size:1.1rem;font-weight:800;color:${item.quantityInStock === 0 ? '#dc2626' : item.quantityInStock <= item.lowStockThreshold ? '#d97706' : '#16a34a'}">${item.quantityInStock}</span> <span style="font-size:0.82rem;color:#94a3b8;">${item.unit || ''}</span></td>
      <td>${item.lowStockThreshold}</td>
      <td>${statusBadge}</td>
      <td style="font-size:0.82rem;color:#64748b;">${updatedAt}</td>
      <td>
        <button onclick="openInvModal(${item.productId}, '${(item.productName||'').replace(/'/g,"\\'").replace(/"/g,"&quot;")}', ${item.quantityInStock}, ${item.lowStockThreshold})" style="padding:5px 10px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.82rem;font-weight:700;margin-right:4px;">✏️ Sửa</button>
        <button onclick="adjustInventory(${item.productId}, 1)" style="padding:5px 8px;background:#10b981;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.82rem;">+1</button>
        <button onclick="adjustInventory(${item.productId}, -1)" style="padding:5px 8px;background:#f59e0b;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.82rem;margin-left:2px;">-1</button>
      </td>
    </tr>`;
  }).join('');
}

window.filterInventoryTable = function () {
  const search = (document.getElementById('inv-search-input')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('inv-status-filter')?.value || '';
  const rows = document.querySelectorAll('#inv-table-body tr[data-product-id]');
  rows.forEach(row => {
    const name = row.dataset.productName || '';
    const cat = row.dataset.category || '';
    const status = row.dataset.stockStatus || '';
    const matchSearch = !search || name.includes(search) || cat.includes(search);
    const matchStatus = !statusFilter || status === statusFilter;
    row.style.display = (matchSearch && matchStatus) ? '' : 'none';
  });
};

window.openInvModal = function (productId, productName, quantity, threshold) {
  document.getElementById('inv-modal-product-id').value = productId;
  document.getElementById('inv-modal-product-name').value = productName;
  document.getElementById('inv-modal-quantity').value = quantity;
  document.getElementById('inv-modal-threshold').value = threshold;
  const modal = document.getElementById('inv-modal');
  if (modal) { modal.style.display = 'flex'; }
};

window.closeInvModal = function () {
  const modal = document.getElementById('inv-modal');
  if (modal) modal.style.display = 'none';
};

window.saveInventory = async function () {
  const productId = parseInt(document.getElementById('inv-modal-product-id').value);
  const quantity = parseInt(document.getElementById('inv-modal-quantity').value);
  const threshold = parseInt(document.getElementById('inv-modal-threshold').value) || 10;
  if (isNaN(productId) || isNaN(quantity)) {
    alert('Vui lòng nhập số lượng hợp lệ!'); return;
  }
  try {
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantityInStock: quantity, lowStockThreshold: threshold })
    });
    const json = await res.json();
    if (json.success) {
      closeInvModal();
      await loadInventory();
      showAdminToast('✅ Đã cập nhật tồn kho thành công!', 'success');
    } else {
      alert('Lỗi: ' + json.message);
    }
  } catch (err) {
    alert('Lỗi kết nối!');
  }
};

window.adjustInventory = async function (productId, delta) {
  try {
    const res = await fetch(`/api/inventory/${productId}/adjust`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta })
    });
    const json = await res.json();
    if (json.success) {
      await loadInventory();
      showAdminToast(delta > 0 ? '📦 Đã nhập thêm hàng!' : '📤 Đã xuất hàng!', 'success');
    } else {
      alert('Lỗi: ' + json.message);
    }
  } catch (err) {
    alert('Lỗi kết nối!');
  }
};

window.initAllInventory = async function () {
  if (!confirm('Hệ thống sẽ tự động tạo bản ghi tồn kho cho tất cả sản phẩm chưa có. Tiếp tục?')) return;
  try {
    const res = await fetch('/api/inventory/init-all', { method: 'POST' });
    const json = await res.json();
    alert(json.message || 'Hoàn tất!');
    await loadInventory();
  } catch (err) {
    alert('Lỗi kết nối!');
  }
};

function showAdminToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:999999;padding:12px 20px;border-radius:12px;font-weight:700;font-size:0.95rem;color:#fff;background:${type === 'success' ? '#10b981' : '#ef4444'};box-shadow:0 8px 24px rgba(0,0,0,0.2);animation:fadeIn 0.3s ease;`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}


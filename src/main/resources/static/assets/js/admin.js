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
  document.getElementById('form-unit').value = p.unit || '';
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

const MOCK_REVIEWS = [
  { name: 'Nguyễn Thị Lan', avatar: '👩', stars: 5, comment: 'Sản phẩm tươi ngon, đóng gói cẩn thận. Giao hàng nhanh, sẽ mua lại lần sau!', date: '3 ngày trước' },
  { name: 'Trần Văn Hùng', avatar: '👨', stars: 5, comment: 'Chất lượng rất tốt, đúng như mô tả. Mua nhiều lần rồi vẫn hài lòng.', date: '1 tuần trước' },
  { name: 'Phạm Thị Mai', avatar: '👱‍♀️', stars: 4, comment: 'Trái cây tươi, vị ngọt tự nhiên. Chỉ tiếc là giao hơi lâu một chút.', date: '2 tuần trước' },
  { name: 'Lê Văn Dũng', avatar: '🧑', stars: 5, comment: 'Xuất xứ rõ ràng, vệ sinh an toàn thực phẩm. Rất tin tưởng shop!', date: '3 tuần trước' },
];

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

  // Open modal
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

  // Stars: random 4-5 from mock
  const starCount = 4 + Math.round(Math.random());
  document.getElementById('qv-stars').textContent = '★'.repeat(starCount) + '☆'.repeat(5 - starCount);
  document.getElementById('qv-rating-count').textContent = `(${MOCK_REVIEWS.length} đánh giá)`;

  // Description
  const descEl = document.getElementById('qv-desc');
  if (product.description && product.description.trim()) {
    descEl.textContent = product.description;
  } else {
    descEl.textContent = `${product.name} – trái cây tươi ngon, được tuyển chọn kỹ từ ${product.origin || 'vùng nguyên sản'} đảm bảo tiêu chuẩn an toàn vệ sinh thực phẩm. Giao hàng sạch, chất lượng cao.`;
  }

  // ---- Reviews ----
  const reviewsList = document.getElementById('qv-reviews-list');
  if (MOCK_REVIEWS.length === 0) {
    reviewsList.innerHTML = `<div class="qv-no-reviews">😶 Chưa có đánh giá nào cho sản phẩm này.</div>`;
  } else {
    reviewsList.innerHTML = MOCK_REVIEWS.map((r, i) => `
      <div class="qv-review-card" style="animation-delay:${i * 0.06}s">
        <div class="qv-review-avatar">${r.avatar}</div>
        <div class="qv-review-content">
          <div class="qv-review-header">
            <span class="qv-review-name">${r.name}</span>
            <span class="qv-review-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</span>
            <span class="qv-review-date">${r.date}</span>
          </div>
          <p class="qv-review-text">${r.comment}</p>
        </div>
      </div>
    `).join('');
  }

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
      ? `<span class="badge-admin badge-admin-success">🟢 Hoạt động</span>`
      : `<span class="badge-admin badge-admin-danger">🔴 Đã khóa</span>`;

    const toggleStatusBtn = u.isActive
      ? `<button class="btn-action-delete" title="Khóa tài khoản" onclick="toggleUserStatus(${u.userId}, false)" style="width: auto; padding: 4px 10px; font-size: 12px; font-weight: 700;">🔒 Khóa</button>`
      : `<button class="btn-action-edit" title="Mở khóa tài khoản" onclick="toggleUserStatus(${u.userId}, true)" style="width: auto; padding: 4px 10px; font-size: 12px; font-weight: 700;">🔓 Mở khóa</button>`;

    // Role switcher toggle button between SELLER and CUSTOMER
    const targetRoleName = u.roleName === 'SELLER' ? 'CUSTOMER' : 'SELLER';
    const targetRoleObj = userRolesList.find(r => r.roleName === targetRoleName);
    let roleSwitchHtml = '';
    if (targetRoleObj) {
      roleSwitchHtml = `<button class="btn-action-view" title="Chuyển vai trò sang ${targetRoleName}" onclick="changeUserRole(${u.userId}, ${targetRoleObj.roleId}, '${targetRoleName}')" style="width: auto; padding: 4px 10px; font-size: 12px; font-weight: 700; background: rgba(245, 158, 11, 0.1); color: #d97706;">🔄 Sang ${targetRoleName}</button>`;
    }

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
  const actionText = isActivating ? 'mở khóa' : 'khóa';
  if (!confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản này?`)) return;

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

    alert(`Đã ${actionText} tài khoản thành công!`);
    loadUsers();
  } catch (err) {
    console.error(err);
    alert('❌ Lỗi: ' + err.message);
  }
};

window.changeUserRole = async function (userId, roleId, roleName) {
  if (!confirm(`Bạn có chắc chắn muốn đổi vai trò tài khoản này thành ${roleName}?`)) return;

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

    alert(`Đã cập nhật vai trò người dùng thành ${roleName}!`);
    loadUsers();
  } catch (err) {
    console.error(err);
    alert('❌ Lỗi: ' + err.message);
  }
};



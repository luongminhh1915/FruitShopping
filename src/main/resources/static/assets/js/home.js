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
  body.innerHTML = items.map((item, index) => {
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

  if (totalPriceEl) totalPriceEl.textContent = formatPrice(grandTotal);
}

window.changeCartQty = function(index, delta) {
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

window.removeCartItem = function(index) {
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

  checkoutBtn?.addEventListener('click', () => {
    const items = getCartItems();
    if (items.length === 0) return;
    alert('🎉 Đặt hàng thành công! Cảm ơn bạn đã mua sắm tại FruitFresh.');
    saveCartItems([]);
    updateCartBadge();
    closeCartModal();
  });
}

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
          <div class="stars">⭐⭐⭐⭐⭐</div>
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

window.goToPage = function(page) {
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

const MOCK_REVIEWS = [
  { name: 'Nguyễn Thị Lan', avatar: '👩', stars: 5, comment: 'Sản phẩm tươi ngon, đóng gói cẩn thận. Giao hàng nhanh, sẽ mua lại lần sau!', date: '3 ngày trước' },
  { name: 'Trần Văn Hùng', avatar: '👨', stars: 5, comment: 'Chất lượng rất tốt, đúng như mô tả. Mua nhiều lần rồi vẫn hài lòng.', date: '1 tuần trước' },
  { name: 'Phạm Thị Mai', avatar: '👱‍♀️', stars: 4, comment: 'Trái cây tươi, vị ngọt tự nhiên. Chỉ tiếc là giao hơi lâu một chút.', date: '2 tuần trước' },
  { name: 'Lê Văn Dũng', avatar: '🧑', stars: 5, comment: 'Xuất xứ rõ ràng, vệ sinh an toàn thực phẩm. Rất tin tưởng shop!', date: '3 tuần trước' },
];

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

  // Stars: random 4-5 from mock
  const starCount = 4 + Math.round(Math.random());
  document.getElementById('qv-stars').textContent = '★'.repeat(starCount) + '☆'.repeat(5 - starCount);
  document.getElementById('qv-rating-count').textContent = `(${MOCK_REVIEWS.length} đánh giá)`;

  // Description
  const descEl = document.getElementById('qv-desc');
  if (product.description && product.description.trim()) {
    descEl.textContent = product.description;
  } else {
    descEl.textContent = `${product.name} – trái cây tươi ngon, được tuyển chọn kỹ từ ${product.origin || 'vùng nguyên sản'} đảm bảo tiêu chuẩn an toàn vệ sinh thực phẩm. Giao hàng nhanh, đóng gói cẩn thận, giữ nguyên độ tươi ngon.`;
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

      // Create profile nav wrapper
      const profileNav = document.createElement('div');
      profileNav.id = 'user-profile-nav';
      profileNav.className = 'user-profile-nav';
      profileNav.style.display = 'flex';
      profileNav.style.alignItems = 'center';
      profileNav.style.gap = '12px';
      profileNav.style.marginLeft = '12px';

      const avatar = user.avatar || '👤';
      const name = user.fullName || user.email;

      profileNav.innerHTML = `
        <span class="user-avatar-nav" style="font-size: 18px; cursor: pointer; user-select: none;">${avatar}</span>
        <span class="user-name-nav" style="font-weight: 600; color: var(--color-dark); max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer;">${name}</span>
        <button class="btn-logout-nav" id="btn-logout" style="font-size: 13px; font-weight: 700; color: var(--color-accent); background: #fee2e2; padding: 6px 12px; border-radius: var(--radius-full); transition: var(--transition-fast);">Đăng Xuất</button>
      `;

      navbarActions.appendChild(profileNav);

      // Add click listeners to profile trigger
      profileNav.querySelector('.user-avatar-nav').addEventListener('click', openProfileModal);
      profileNav.querySelector('.user-name-nav').addEventListener('click', openProfileModal);

      document.getElementById('btn-logout')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
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

    // Show modal
    document.getElementById('profile-modal').classList.add('active');
  } catch (err) {
    console.error(err);
    showToast('❌ Lỗi: ' + err.message, 'error');
  }
}

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

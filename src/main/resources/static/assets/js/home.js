/**
 * FruitShopping - Homepage JavaScript
 * Handles: Navbar scroll, Hero slider, Categories, Products, Cart
 */

/* =============================
   MOCK DATA (khi chưa có DB)
   ============================= */
const MOCK_CATEGORIES = [
  { categoryId: 1, name: 'Nhiệt đới',   image: null, emoji: '🥭' },
  { categoryId: 2, name: 'Nhập khẩu',   image: null, emoji: '🍇' },
  { categoryId: 3, name: 'Organic',      image: null, emoji: '🌿' },
  { categoryId: 4, name: 'Trái cây miền Nam', image: null, emoji: '🍈' },
  { categoryId: 5, name: 'Thanh long',   image: null, emoji: '🐉' },
  { categoryId: 6, name: 'Cam Quýt',     image: null, emoji: '🍊' },
  { categoryId: 7, name: 'Dưa hấu',      image: null, emoji: '🍉' },
  { categoryId: 8, name: 'Khô - Sấy',    image: null, emoji: '🍑' },
];

const MOCK_PRODUCTS = [
  { productId:1, name:'Xoài Cát Chu Đồng Tháp', price:45000, unit:'kg', origin:'Đồng Tháp', categoryName:'Nhiệt đới', imgUrl:null, emoji:'🥭' },
  { productId:2, name:'Thanh Long Ruột Đỏ Bình Thuận', price:35000, unit:'kg', origin:'Bình Thuận', categoryName:'Nhiệt đới', imgUrl:null, emoji:'🐉' },
  { productId:3, name:'Nho Mẫu Đơn Đà Lạt', price:89000, unit:'kg', origin:'Đà Lạt', categoryName:'Organic', imgUrl:null, emoji:'🍇' },
  { productId:4, name:'Dưa Hấu Không Hạt', price:25000, unit:'kg', origin:'Long An', categoryName:'Trái cây miền Nam', imgUrl:null, emoji:'🍉' },
  { productId:5, name:'Cherry Mỹ Nhập Khẩu', price:320000, unit:'hộp 500g', origin:'USA', categoryName:'Nhập khẩu', imgUrl:null, emoji:'🍒' },
  { productId:6, name:'Cam Sành Vĩnh Long', price:28000, unit:'kg', origin:'Vĩnh Long', categoryName:'Cam Quýt', imgUrl:null, emoji:'🍊' },
  { productId:7, name:'Bơ Booth Đắk Lắk 034', price:65000, unit:'kg', origin:'Đắk Lắk', categoryName:'Nhiệt đới', imgUrl:null, emoji:'🥑' },
  { productId:8, name:'Sầu Riêng Monthong Thái', price:185000, unit:'kg', origin:'Thái Lan', categoryName:'Nhập khẩu', imgUrl:null, emoji:'🌟' },
];

/* =============================
   CART STATE
   ============================= */
let cartCount = 0;

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (badge) {
    badge.textContent = cartCount;
    badge.style.display = cartCount > 0 ? 'flex' : 'none';
  }
}

function addToCart(product) {
  cartCount++;
  updateCartBadge();
  showToast(`✅ Đã thêm "${product.name}" vào giỏ hàng!`, 'success');

  // Animate cart icon
  const cartBtn = document.getElementById('cart-btn');
  if (cartBtn) {
    cartBtn.style.transform = 'scale(1.35)';
    setTimeout(() => cartBtn.style.transform = '', 300);
  }
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
  const img = product.imgUrl
    ? `<img src="${product.imgUrl}" alt="${product.name}" loading="lazy">`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:4rem;">${product.emoji || '🍎'}</div>`;

  return `
    <div class="product-card" id="product-${product.productId}">
      <div class="product-img-wrap">
        ${img}
        <div class="product-badges">
          <span class="badge badge-green">Tươi</span>
          ${product.origin === 'USA' || product.origin === 'Thái Lan' ? '<span class="badge badge-orange">Nhập khẩu</span>' : ''}
        </div>
        <div class="product-actions">
          <button class="product-action-btn" title="Yêu thích" onclick="wishlistProduct(${product.productId})">🤍</button>
          <button class="product-action-btn" title="Xem nhanh" onclick="quickView(${product.productId})">👁️</button>
        </div>
      </div>
      <div class="product-info">
        <p class="product-category">${product.categoryName || ''}</p>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-meta">
          <span class="product-origin">📍 ${product.origin || 'Việt Nam'}</span>
          <div class="stars">⭐⭐⭐⭐⭐</div>
        </div>
        <div class="product-price-row">
          <div>
            <span class="product-price">${priceFormatted}</span>
            <span class="product-unit">/${product.unit || 'kg'}</span>
          </div>
          <button class="btn-add-cart" title="Thêm vào giỏ" onclick='addToCart(${JSON.stringify(product)})'>+</button>
        </div>
      </div>
    </div>
  `;
}

/* =============================
   RENDER CATEGORY CARD
   ============================= */
function renderCategoryCard(cat) {
  const inner = cat.image
    ? `<img src="${cat.image}" alt="${cat.name}">`
    : `${cat.emoji || '🍀'}`;

  return `
    <div class="category-card" onclick="filterByCategory(${cat.categoryId})" id="cat-${cat.categoryId}">
      <div class="category-img-wrap">${inner}</div>
      <p class="category-name">${cat.name}</p>
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
async function loadCategories() {
  const container = document.getElementById('categories-grid');
  if (!container) return;

  // Show skeletons
  container.innerHTML = Array(8).fill(`
    <div style="text-align:center;">
      <div class="skeleton" style="width:100px;height:100px;border-radius:50%;margin:0 auto 12px;"></div>
      <div class="skeleton" style="width:70px;height:14px;margin:0 auto;border-radius:4px;"></div>
    </div>
  `).join('');

  let cats = await API.getCategories().catch(() => null);
  if (!cats || cats.length === 0) cats = MOCK_CATEGORIES;

  container.innerHTML = cats.map(renderCategoryCard).join('');
}

/* =============================
   LOAD PRODUCTS
   ============================= */
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

  let products = await API.getFeaturedProducts(8).catch(() => null);
  if (!products || products.length === 0) products = MOCK_PRODUCTS;

  container.innerHTML = products.map(renderProductCard).join('');
}

async function loadNewProducts() {
  const container = document.getElementById('new-products-grid');
  if (!container) return;

  let products = await API.getNewProducts(4).catch(() => null);
  if (!products || products.length === 0) products = MOCK_PRODUCTS.slice(0, 4);

  container.innerHTML = products.map(renderProductCard).join('');
}

/* =============================
   FILTER BY CATEGORY
   ============================= */
async function filterByCategory(categoryId) {
  const container = document.getElementById('featured-grid');
  if (!container) return;

  // Scroll to featured
  document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' });

  container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--color-gray-400);">Đang tải...</div>`;

  let products = await API.getProductsByCategory(categoryId, 8).catch(() => null);
  if (!products || products.length === 0) {
    products = MOCK_PRODUCTS.filter(p => p.categoryId === categoryId || true).slice(0, 4);
  }

  container.innerHTML = products.map(renderProductCard).join('');
}

/* =============================
   PRODUCT ACTION STUBS
   ============================= */
function wishlistProduct(id) { showToast('❤️ Đã thêm vào danh sách yêu thích!', 'success'); }
function quickView(id)       { showToast('🔍 Tính năng xem nhanh sẽ ra mắt sớm!', 'success'); }

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
      const categoryId = tab.dataset.categoryId;
      if (categoryId) {
        await filterByCategory(parseInt(categoryId));
      } else {
        await loadFeaturedProducts();
      }
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

  // Cart badge
  updateCartBadge();
});

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

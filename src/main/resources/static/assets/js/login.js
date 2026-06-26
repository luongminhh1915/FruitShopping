/**
 * FruitShopping – Login Flow JavaScript
 */

const API_BASE = 'http://localhost:8080/api';

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect to homepage
  if (Auth.isLoggedIn()) {
    window.location.href = '/';
    return;
  }

  initLoginToggles();
  initLoginForm();
});

/* ==========================================
   PASSWORD VISIBILITY TOGGLE
   ========================================== */
function initLoginToggles() {
  const toggleBtn = document.getElementById('toggle-login-password');
  const input = document.getElementById('login-password');
  
  if (toggleBtn && input) {
    toggleBtn.addEventListener('click', () => {
      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      toggleBtn.textContent = isPass ? '🔒' : '👁️';
    });
  }
}

/* ==========================================
   FORM HANDLING
   ========================================== */
function initLoginForm() {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');

  if (!form) return;

  // Realtime error clearing
  [emailInput, passwordInput].forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => {
      setFieldErr(input.id, '');
      hideAlert();
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    let valid = true;

    // Validate email
    if (!email) {
      setFieldErr('login-email', 'Vui lòng nhập email đăng nhập!');
      valid = false;
    } else if (!validateEmailFormat(email)) {
      setFieldErr('login-email', 'Email không đúng định dạng!');
      valid = false;
    }

    // Validate password
    if (!password) {
      setFieldErr('login-password', 'Vui lòng nhập mật khẩu!');
      valid = false;
    }

    if (!valid) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const resJson = await response.json();

      if (!response.ok) {
        throw new Error(resJson.message || 'Email hoặc mật khẩu không chính xác!');
      }

      // Successful login
      showAlert('Đăng nhập thành công! Đang chuyển hướng...', 'success');

      const authData = resJson.data || resJson;
      
      // Save session
      Auth.saveSession(authData.token, {
        userId: authData.userId,
        email: authData.email,
        fullName: authData.fullName,
        roleName: authData.roleName,
        avatar: authData.avatar
      });

      // Set cookie for API requests if needed or just redirect
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

    } catch (err) {
      console.error('[Login] Error:', err);
      showAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  });
}

/* ==========================================
   HELPERS
   ========================================== */
function validateEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setFieldErr(id, msg) {
  const el = document.getElementById(id + '-error');
  const input = document.getElementById(id);
  if (el) el.textContent = msg || '';
  if (input) input.classList.toggle('error', !!msg);
}

function showAlert(msg, type = 'error') {
  const el = document.getElementById('login-alert');
  if (!el) return;
  el.textContent = (type === 'error' ? '❌ ' : '✅ ') + msg;
  el.className = `auth-alert ${type}`;
}

function hideAlert() {
  const el = document.getElementById('login-alert');
  if (el) el.className = 'auth-alert hidden';
}

function setLoading(loading) {
  const btn = document.getElementById('login-submit-btn');
  if (!btn) return;
  btn.classList.toggle('loading', loading);
  btn.disabled = loading;
  btn.textContent = loading ? '' : 'Đăng Nhập';
}

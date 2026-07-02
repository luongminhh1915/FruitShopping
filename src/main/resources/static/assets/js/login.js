/**
 * FruitShopping – Login Flow JavaScript
 */

const API_BASE = 'http://localhost:8080/api';

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect to appropriate page
  if (Auth.isLoggedIn()) {
    const user = Auth.getUser();
    if (user && user.roleName === 'ADMIN') {
      window.location.href = '/pages/admin/index.html';
    } else {
      window.location.href = '/';
    }
    return;
  }

  initLoginToggles();
  initLoginForm();
  initForgotPasswordForm();
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

  // Toggle for forgot password fields
  const toggleForgot1 = document.getElementById('toggle-forgot-password-1');
  const inputForgot1 = document.getElementById('forgot-new-password');
  if (toggleForgot1 && inputForgot1) {
    toggleForgot1.addEventListener('click', () => {
      const isPass = inputForgot1.type === 'password';
      inputForgot1.type = isPass ? 'text' : 'password';
      toggleForgot1.textContent = isPass ? '🔒' : '👁️';
    });
  }

  const toggleForgot2 = document.getElementById('toggle-forgot-password-2');
  const inputForgot2 = document.getElementById('forgot-confirm-password');
  if (toggleForgot2 && inputForgot2) {
    toggleForgot2.addEventListener('click', () => {
      const isPass = inputForgot2.type === 'password';
      inputForgot2.type = isPass ? 'text' : 'password';
      toggleForgot2.textContent = isPass ? '🔒' : '👁️';
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
        phone: authData.phone,
        address: authData.address,
        roleName: authData.roleName,
        avatar: authData.avatar
      });

      // Redirect based on role
      setTimeout(() => {
        if (authData.roleName === 'ADMIN') {
          window.location.href = '/pages/admin/index.html';
        } else {
          window.location.href = '/';
        }
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
   FORGOT PASSWORD FLOW
   ========================================== */
function initForgotPasswordForm() {
  const loginForm = document.getElementById('login-form');
  const forgotForm = document.getElementById('forgot-password-form');
  
  const headerLogin = document.getElementById('auth-header-login');
  const headerForgot = document.getElementById('auth-header-forgot');
  
  const forgotLink = document.getElementById('forgot-password-link');
  const backToLoginLink = document.getElementById('back-to-login-link');
  
  const forgotEmailInput = document.getElementById('forgot-email');
  const sendOtpBtn = document.getElementById('forgot-send-otp-btn');
  
  const step1Box = document.getElementById('forgot-step-1');
  const step2Box = document.getElementById('forgot-step-2');
  
  const otpInput = document.getElementById('forgot-otp');
  const newPasswordInput = document.getElementById('forgot-new-password');
  const confirmPasswordInput = document.getElementById('forgot-confirm-password');

  if (!forgotForm) return;

  // Toggle Login / Forgot Form View
  forgotLink?.addEventListener('click', (e) => {
    e.preventDefault();
    hideAlert();
    loginForm.classList.add('hidden');
    forgotForm.classList.remove('hidden');
    headerLogin.classList.add('hidden');
    headerForgot.classList.remove('hidden');
    
    // Reset steps
    step1Box.classList.remove('hidden');
    step2Box.classList.add('hidden');
  });

  backToLoginLink?.addEventListener('click', (e) => {
    e.preventDefault();
    hideAlert();
    loginForm.classList.remove('hidden');
    forgotForm.classList.add('hidden');
    headerLogin.classList.remove('hidden');
    headerForgot.classList.add('hidden');
  });

  // Realtime error clearing
  [forgotEmailInput, otpInput, newPasswordInput, confirmPasswordInput].forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => {
      setFieldErr(input.id, '');
      hideAlert();
    });
  });

  // STEP 1: Gửi OTP khôi phục mật khẩu
  sendOtpBtn?.addEventListener('click', async () => {
    hideAlert();
    const email = forgotEmailInput.value.trim();
    if (!email) {
      setFieldErr('forgot-email', 'Vui lòng nhập email tài khoản!');
      return;
    }
    if (!validateEmailFormat(email)) {
      setFieldErr('forgot-email', 'Email không đúng định dạng!');
      return;
    }

    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = 'Đang gửi mã...';

    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.message || 'Lỗi gửi yêu cầu khôi phục mật khẩu!');
      }

      showAlert('Mã xác thực đã được gửi về email của bạn!', 'success');
      step1Box.classList.add('hidden');
      step2Box.classList.remove('hidden');
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      sendOtpBtn.disabled = false;
      sendOtpBtn.textContent = 'Gửi Mã Xác Thực OTP';
    }
  });

  // STEP 2: Submit đặt lại mật khẩu mới
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const email = forgotEmailInput.value.trim();
    const otpCode = otpInput.value.trim();
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    let valid = true;
    if (!otpCode || otpCode.length !== 6) {
      setFieldErr('forgot-otp', 'Vui lòng nhập đúng mã OTP 6 chữ số!');
      valid = false;
    }
    if (!newPassword || newPassword.length < 8) {
      setFieldErr('forgot-new-password', 'Mật khẩu mới tối thiểu 8 ký tự!');
      valid = false;
    }
    if (!confirmPassword) {
      setFieldErr('forgot-confirm-password', 'Vui lòng xác nhận mật khẩu mới!');
      valid = false;
    } else if (newPassword !== confirmPassword) {
      setFieldErr('forgot-confirm-password', 'Mật khẩu xác nhận không khớp!');
      valid = false;
    }

    if (!valid) return;

    const submitBtn = document.getElementById('forgot-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang xử lý...';
    }

    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode, newPassword, confirmPassword })
      });
      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.message || 'Lỗi đặt lại mật khẩu!');
      }

      showAlert('Đổi mật khẩu thành công! Đang chuyển về Đăng Nhập...', 'success');
      setTimeout(() => {
        hideAlert();
        loginForm.classList.remove('hidden');
        forgotForm.classList.add('hidden');
        headerLogin.classList.remove('hidden');
        headerForgot.classList.add('hidden');
        
        // Clear fields
        forgotEmailInput.value = '';
        otpInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
      }, 2000);
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Xác Nhận Đặt Lại Mật Khẩu';
      }
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

/**
 * FruitShopping – Register Flow JavaScript
 * Steps: 1.Form → 2.OTP → 3.Success
 */

const API_BASE = 'http://localhost:8080/api';

/* ==========================================
   STATE
   ========================================== */
let currentEmail   = '';
let currentName    = '';
let otpTimer       = null;
let resendTimer    = null;
let otpCountdown   = 600; // 10 min
let resendCountdown = 60;

/* ==========================================
   STEP SWITCHING
   ========================================== */
function showStep(step) {
  document.getElementById('step-register').classList.add('hidden');
  document.getElementById('step-otp').classList.add('hidden');
  document.getElementById('step-success').classList.add('hidden');
  document.getElementById(`step-${step}`)?.classList.remove('hidden');

  const right = document.getElementById('auth-right');
  if (right) right.scrollTop = 0;
}

/* ==========================================
   ALERT HELPERS
   ========================================== */
function showRegisterAlert(msg, type = 'error') {
  const el = document.getElementById('register-alert');
  if (!el) return;
  el.textContent = (type === 'error' ? '❌ ' : '✅ ') + msg;
  el.className = `auth-alert ${type}`;
}
function showOtpAlert(msg, type = 'error') {
  const el = document.getElementById('otp-alert');
  if (!el) return;
  el.textContent = (type === 'error' ? '❌ ' : '✅ ') + msg;
  el.className = `auth-alert ${type}`;
}
function hideAlerts() {
  ['register-alert','otp-alert'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = 'auth-alert hidden';
  });
}
function setFieldErr(id, msg) {
  const el = document.getElementById(id + '-error');
  const input = document.getElementById(id);
  if (el) el.textContent = msg || '';
  if (input) input.classList.toggle('error', !!msg);
}
function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.classList.toggle('loading', loading);
  btn.disabled = loading;
  
  if (btnId === 'register-btn') {
    btn.textContent = loading ? '' : '🚀 Đăng Ký & Nhận Mã OTP';
  } else if (btnId === 'verify-otp-btn') {
    btn.textContent = loading ? '' : '✅ Xác Nhận OTP';
  } else if (btnId === 'go-shopping-btn') {
    btn.textContent = loading ? '' : '🛒 Bắt Đầu Mua Sắm';
  }
}

/* ==========================================
   PASSWORD STRENGTH
   ========================================== */
function checkStrength(password) {
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const fill  = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');
  const wrap  = document.getElementById('password-strength');
  if (!fill || !label || !wrap) return;

  wrap.style.display = 'flex';
  if (score <= 1) {
    fill.className  = 'strength-fill weak';
    label.className = 'strength-label weak';
    label.textContent = 'Yếu';
  } else if (score <= 3) {
    fill.className  = 'strength-fill medium';
    label.className = 'strength-label medium';
    label.textContent = 'Trung bình';
  } else {
    fill.className  = 'strength-fill strong';
    label.className = 'strength-label strong';
    label.textContent = 'Mạnh 💪';
  }
}

/* ==========================================
   TOGGLE PASSWORD
   ========================================== */
function initToggles() {
  [['toggle-reg-password','reg-password'], ['toggle-reg-confirm','reg-confirm']].forEach(([btnId, inputId]) => {
    document.getElementById(btnId)?.addEventListener('click', () => {
      const inp = document.getElementById(inputId);
      const btn = document.getElementById(btnId);
      if (!inp) return;
      inp.type = inp.type === 'password' ? 'text' : 'password';
      btn.textContent = inp.type === 'password' ? '👁️' : '🙈';
    });
  });
}

/* ==========================================
   EMAIL DUPLICATE CHECK (debounced)
   ========================================== */
let emailCheckTimer = null;
function initEmailCheck() {
  const emailInput = document.getElementById('reg-email');
  const icon = document.getElementById('email-check-icon');
  if (!emailInput || !icon) return;

  emailInput.addEventListener('input', () => {
    clearTimeout(emailCheckTimer);
    const val = emailInput.value.trim();
    icon.textContent = '';
    if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return;

    icon.textContent = '⏳';
    emailCheckTimer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/check-email?email=${encodeURIComponent(val)}`);
        const body = await res.json();
        if (body.data?.exists) {
          icon.textContent = '❌';
          setFieldErr('reg-email', '⚠️ Email này đã được đăng ký!');
        } else {
          icon.textContent = '✅';
          setFieldErr('reg-email', '');
        }
      } catch { icon.textContent = ''; }
    }, 600);
  });
}

/* ==========================================
   STEP 1: SUBMIT REGISTER FORM
   ========================================== */
async function handleRegisterSubmit(e) {
  e.preventDefault();
  hideAlerts();

  const fullName = document.getElementById('reg-fullname')?.value.trim();
  const email    = document.getElementById('reg-email')?.value.trim().toLowerCase();
  const phone    = document.getElementById('reg-phone')?.value.trim();
  const password = document.getElementById('reg-password')?.value;
  const confirm  = document.getElementById('reg-confirm')?.value;
  const terms    = document.getElementById('agree-terms')?.checked;

  // Validate
  let valid = true;
  if (!fullName) { setFieldErr('reg-fullname', '⚠️ Vui lòng nhập họ tên'); valid = false; }
  else setFieldErr('reg-fullname', '');

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldErr('reg-email', '⚠️ Email không đúng định dạng'); valid = false;
  } else setFieldErr('reg-email', '');

  if (!password || password.length < 8) {
    setFieldErr('reg-password', '⚠️ Mật khẩu tối thiểu 8 ký tự'); valid = false;
  } else setFieldErr('reg-password', '');

  if (password !== confirm) {
    setFieldErr('reg-confirm', '⚠️ Mật khẩu xác nhận không khớp'); valid = false;
  } else setFieldErr('reg-confirm', '');

  if (!terms) { setFieldErr('terms', '⚠️ Bạn cần đồng ý với điều khoản'); valid = false; }
  else setFieldErr('terms', '');

  if (!valid) return;

  setLoading('register-btn', true);
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, confirmPassword: confirm, phone }),
    });
    const body = await res.json();

    if (res.ok && body.success) {
      currentEmail = email;
      currentName  = fullName;
      document.getElementById('otp-email-display').textContent = email;
      showStep('otp');
      startOtpTimer();
      startResendTimer();
      document.getElementById('otp-0')?.focus();
    } else {
      showRegisterAlert(body.message || 'Đã xảy ra lỗi. Vui lòng thử lại!');
    }
  } catch (err) {
    showRegisterAlert('Không thể kết nối server. Vui lòng thử lại!');
    console.error(err);
  } finally {
    setLoading('register-btn', false);
  }
}

/* ==========================================
   OTP INPUT HANDLING
   ========================================== */
function initOtpInputs() {
  const inputs = document.querySelectorAll('.otp-digit');

  inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g,'');
      e.target.value = val;
      e.target.classList.toggle('filled', val.length === 1);

      if (val && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
      // If all filled → auto verify
      const allFilled = [...inputs].every(i => i.value.length === 1);
      if (allFilled) setTimeout(handleVerifyOtp, 200);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && index > 0) {
        inputs[index - 1].focus();
        inputs[index - 1].value = '';
        inputs[index - 1].classList.remove('filled');
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g,'').slice(0, 6);
      pasted.split('').forEach((char, i) => {
        if (inputs[i]) { inputs[i].value = char; inputs[i].classList.add('filled'); }
      });
      if (pasted.length === 6) setTimeout(handleVerifyOtp, 200);
    });
  });
}

function getOtpValue() {
  return [...document.querySelectorAll('.otp-digit')].map(i => i.value).join('');
}

/* ==========================================
   STEP 2: VERIFY OTP
   ========================================== */
async function handleVerifyOtp() {
  const otpCode = getOtpValue();
  if (otpCode.length !== 6) {
    showOtpAlert('Vui lòng nhập đủ 6 chữ số!');
    return;
  }

  setLoading('verify-otp-btn', true);
  try {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentEmail, otpCode, otpType: 'REGISTER' }),
    });
    const body = await res.json();

    if (res.ok && body.success) {
      clearInterval(otpTimer);
      const { token, ...userInfo } = body.data;
      Auth.saveSession(token, userInfo);

      document.getElementById('success-name').textContent = userInfo.fullName || currentName;
      showStep('success');
      startSuccessRedirect();
    } else {
      showOtpAlert(body.message || 'Mã OTP không đúng!');
      document.querySelectorAll('.otp-digit').forEach(i => i.classList.add('error'));
      setTimeout(() => document.querySelectorAll('.otp-digit').forEach(i => i.classList.remove('error')), 1500);
    }
  } catch (err) {
    showOtpAlert('Không thể kết nối server!');
    console.error(err);
  } finally {
    setLoading('verify-otp-btn', false);
  }
}

/* ==========================================
   OTP COUNTDOWN TIMER (10 phút)
   ========================================== */
function startOtpTimer() {
  otpCountdown = 600;
  clearInterval(otpTimer);
  updateOtpDisplay();

  otpTimer = setInterval(() => {
    otpCountdown--;
    updateOtpDisplay();
    if (otpCountdown <= 0) {
      clearInterval(otpTimer);
      const wrap = document.getElementById('otp-timer-wrap');
      if (wrap) { wrap.innerHTML = '⏰ Mã OTP đã hết hạn. Vui lòng gửi lại.'; wrap.className = 'otp-timer expired'; }
    }
  }, 1000);
}

function updateOtpDisplay() {
  const mins = Math.floor(otpCountdown / 60).toString().padStart(2,'0');
  const secs = (otpCountdown % 60).toString().padStart(2,'0');
  const el = document.getElementById('otp-countdown');
  if (el) el.textContent = `${mins}:${secs}`;
}

/* ==========================================
   RESEND TIMER (60s cooldown)
   ========================================== */
function startResendTimer() {
  resendCountdown = 60;
  const btn  = document.getElementById('resend-otp-btn');
  const txt  = document.getElementById('resend-timer-txt');
  if (btn) btn.disabled = true;

  clearInterval(resendTimer);
  resendTimer = setInterval(() => {
    resendCountdown--;
    if (txt) txt.textContent = ` (${resendCountdown}s)`;
    if (resendCountdown <= 0) {
      clearInterval(resendTimer);
      if (btn) btn.disabled = false;
      if (txt) txt.textContent = '';
    }
  }, 1000);
}

/* ==========================================
   RESEND OTP
   ========================================== */
async function handleResendOtp() {
  try {
    const res = await fetch(`${API_BASE}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentEmail, otpType: 'REGISTER' }),
    });
    const body = await res.json();
    if (body.success) {
      showOtpAlert('Mã OTP mới đã được gửi! Kiểm tra email của bạn.', 'success');
      startOtpTimer();
      startResendTimer();
      // Reset OTP inputs
      document.querySelectorAll('.otp-digit').forEach(i => { i.value=''; i.classList.remove('filled','error'); });
      document.getElementById('otp-0')?.focus();
    }
  } catch { showOtpAlert('Không thể gửi lại OTP!'); }
}

/* ==========================================
   STEP 3: SUCCESS REDIRECT (5 giây)
   ========================================== */
function startSuccessRedirect() {
  let count = 5;
  const el = document.getElementById('redirect-countdown');
  const interval = setInterval(() => {
    count--;
    if (el) el.textContent = count;
    if (count <= 0) { clearInterval(interval); window.location.href = '/'; }
  }, 1000);
}

/* ==========================================
   INIT
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Nếu đã login → về trang chủ
  if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
    window.location.href = '/';
    return;
  }

  // Init components
  initToggles();
  initEmailCheck();
  initOtpInputs();

  // Password strength meter
  document.getElementById('reg-password')?.addEventListener('input', (e) => {
    checkStrength(e.target.value);
    if (e.target.value) setFieldErr('reg-password', '');
  });

  // Form submit
  document.getElementById('register-form')?.addEventListener('submit', handleRegisterSubmit);

  // Verify OTP button
  document.getElementById('verify-otp-btn')?.addEventListener('click', handleVerifyOtp);

  // Resend OTP
  document.getElementById('resend-otp-btn')?.addEventListener('click', handleResendOtp);

  // Back to register
  document.getElementById('back-to-register')?.addEventListener('click', () => {
    clearInterval(otpTimer);
    clearInterval(resendTimer);
    showStep('register');
  });

  // Go shopping button
  document.getElementById('go-shopping-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = '/';
  });

  // Clear errors on input
  ['reg-fullname','reg-email','reg-password','reg-confirm'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => setFieldErr(id, ''));
  });
});

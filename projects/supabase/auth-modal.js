// Chill auth modal UI
// Separate reliable login/register modal with its own visible inputs.

(function () {
  function ensureAuthModalStyles() {
    if (document.getElementById('auth-modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'auth-modal-styles';
    style.textContent = `
      .auth-section { top: 10px; right: 1.5rem; }
      .auth-card { gap: .55rem; }
      #auth-form, .auth-card > div:first-child, .auth-title, .auth-status { display: none !important; }
      .auth-modal-openers { display: flex; align-items: center; gap: .55rem; }
      .auth-modal-openers .btn, #auth-logout { min-height: 38px; padding: .45rem .95rem; font-size: .84rem; border-radius: 999px; }
      body.auth-modal-active { overflow: hidden; }
      .auth-modal-overlay { position: fixed; inset: 0; z-index: 850; display: none; align-items: center; justify-content: center; padding: 1.25rem; background: radial-gradient(circle at top left, rgba(76,175,80,.24), transparent 34%), linear-gradient(135deg, rgba(61,150,255,.82), rgba(159,42,220,.82)); backdrop-filter: blur(6px); }
      .auth-modal-overlay.open { display: flex; }
      .auth-modal-box { position: relative; width: min(100%, 420px); padding: 2rem; border-radius: 18px; background: #fff; box-shadow: 0 22px 70px rgba(0,0,0,.22); }
      .auth-modal-close { position: absolute; top: .9rem; right: .9rem; width: 34px; height: 34px; border: none; border-radius: 50%; background: var(--bg-alt,#F2F5F0); color: var(--text-muted,#6b7a67); font-size: 1.25rem; font-weight: 800; cursor: pointer; }
      .auth-modal-close:hover { background: var(--red-light,#ffebee); color: var(--red,#F44336); }
      .auth-modal-title { margin-bottom: .35rem; text-align: center; font-size: 1.75rem; font-weight: 900; color: var(--text,#1a2217); }
      .auth-modal-subtitle { margin-bottom: 1.4rem; text-align: center; color: var(--text-muted,#6b7a67); font-size: .95rem; }
      .auth-modal-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: .55rem; margin-bottom: 1.3rem; padding: .3rem; border-radius: 999px; background: var(--bg-alt,#F2F5F0); }
      .auth-modal-tab { border: none; border-radius: 999px; padding: .65rem .9rem; background: transparent; color: var(--text-muted,#6b7a67); font-family: inherit; font-weight: 800; cursor: pointer; }
      .auth-modal-tab.active { background: #fff; color: var(--green,#4CAF50); box-shadow: 0 4px 16px rgba(0,0,0,.08); }
      .auth-modal-form { display: flex; flex-direction: column; gap: .85rem; }
      .auth-modal-form label { font-weight: 800; color: var(--text,#1a2217); font-size: .9rem; }
      .auth-modal-form .input { width: 100%; min-height: 50px; padding: .8rem 1rem; font-size: .96rem; background: #fff; }
      .auth-modal-submit { width: 100%; min-height: 50px; margin-top: .35rem; border-radius: 12px; background: linear-gradient(90deg,#25b7d3,#4CAF50,#a728d8); border: none; color: #fff; font-size: 1rem; font-weight: 900; cursor: pointer; justify-content: center; }
      .auth-modal-footer { margin-top: 1.1rem; text-align: center; color: var(--text-muted,#6b7a67); font-size: .9rem; }
      .auth-modal-link, .auth-modal-forgot { border: none; background: none; color: var(--green,#4CAF50); font-family: inherit; font-weight: 800; cursor: pointer; }
      .auth-modal-forgot { align-self: flex-start; color: #2f9ad6; font-size: .92rem; font-weight: 600; }
      @media(max-width:900px) { .auth-section { position: sticky; top: 0; right: auto; z-index: 240; padding: .65rem 1rem; border-bottom: 1px solid var(--border); background: var(--bg); } .auth-card, .auth-modal-openers { justify-content: center; } }
    `;

    document.head.appendChild(style);
  }

  function ensureAuthModal() {
    ensureAuthModalStyles();

    const authCard = document.querySelector('#auth .auth-card');
    const oldForm = document.getElementById('auth-form');
    const logoutBtn = document.getElementById('auth-logout');

    if (!authCard || !oldForm) return;

    if (!document.getElementById('auth-openers')) {
      const openers = document.createElement('div');
      openers.id = 'auth-openers';
      openers.className = 'auth-modal-openers';
      openers.innerHTML = `
        <button class="btn btn-primary" type="button" onclick="openAuthModal('login')">Войти</button>
        <button class="btn btn-outline" type="button" onclick="openAuthModal('register')">Регистрация</button>
      `;
      authCard.insertBefore(openers, oldForm);
    }

    if (!document.getElementById('auth-modal')) {
      const modal = document.createElement('div');
      modal.id = 'auth-modal';
      modal.className = 'auth-modal-overlay';
      modal.innerHTML = `
        <div class="auth-modal-box">
          <button class="auth-modal-close" type="button" aria-label="Закрыть окно" onclick="closeAuthModal()">×</button>
          <h2 class="auth-modal-title" id="auth-modal-title">Вход в Chill</h2>
          <p class="auth-modal-subtitle" id="auth-modal-subtitle">Войдите, чтобы синхронизировать продукты и покупки.</p>
          <div class="auth-modal-tabs">
            <button class="auth-modal-tab active" id="auth-login-tab" type="button" onclick="setAuthMode('login')">Вход</button>
            <button class="auth-modal-tab" id="auth-register-tab" type="button" onclick="setAuthMode('register')">Регистрация</button>
          </div>
          <form class="auth-modal-form" id="auth-modal-form" onsubmit="submitAuthModal(event)">
            <label for="auth-modal-email">Email</label>
            <input id="auth-modal-email" class="input" type="email" placeholder="Введите email" autocomplete="email" required />
            <label for="auth-modal-password">Пароль</label>
            <input id="auth-modal-password" class="input" type="password" placeholder="Введите пароль" autocomplete="current-password" required />
            <button class="auth-modal-forgot" id="auth-forgot-btn" type="button" onclick="showToast('Восстановление пароля можно подключить следующим шагом.')">Забыли пароль?</button>
            <button class="btn auth-modal-submit" id="auth-modal-submit-btn" type="submit">Войти</button>
          </form>
          <p class="auth-modal-footer" id="auth-modal-footer"></p>
        </div>
      `;
      document.body.appendChild(modal);
      modal.addEventListener('click', event => {
        if (event.target.id === 'auth-modal') closeAuthModal();
      });
    }

    if (logoutBtn && logoutBtn.parentElement !== authCard) {
      authCard.appendChild(logoutBtn);
    }

    setAuthMode(window.currentAuthMode || 'login');
  }

  window.setAuthMode = function (mode) {
    window.currentAuthMode = mode;

    const isRegister = mode === 'register';
    const title = document.getElementById('auth-modal-title');
    const subtitle = document.getElementById('auth-modal-subtitle');
    const footer = document.getElementById('auth-modal-footer');
    const submitBtn = document.getElementById('auth-modal-submit-btn');
    const forgotBtn = document.getElementById('auth-forgot-btn');

    if (title) title.textContent = isRegister ? 'Регистрация в Chill' : 'Вход в Chill';
    if (subtitle) subtitle.textContent = isRegister ? 'Создайте аккаунт и получите 7 дней Pro бесплатно.' : 'Войдите, чтобы синхронизировать продукты и покупки.';
    if (submitBtn) submitBtn.textContent = isRegister ? 'Зарегистрироваться' : 'Войти';
    if (forgotBtn) forgotBtn.style.display = isRegister ? 'none' : 'inline-flex';

    document.getElementById('auth-login-tab')?.classList.toggle('active', !isRegister);
    document.getElementById('auth-register-tab')?.classList.toggle('active', isRegister);

    if (footer) {
      footer.innerHTML = isRegister
        ? 'Уже есть аккаунт? <button class="auth-modal-link" type="button" onclick="setAuthMode(\'login\')">Войти</button>'
        : 'Нет аккаунта? <button class="auth-modal-link" type="button" onclick="setAuthMode(\'register\')">Зарегистрироваться</button>';
    }
  };

  window.submitAuthModal = async function (event) {
    event.preventDefault();

    const email = document.getElementById('auth-modal-email')?.value.trim();
    const password = document.getElementById('auth-modal-password')?.value.trim();
    const oldEmail = document.getElementById('auth-email');
    const oldPassword = document.getElementById('auth-password');

    if (!email || !password) {
      showToast('Введите email и пароль');
      return;
    }

    if (oldEmail) oldEmail.value = email;
    if (oldPassword) oldPassword.value = password;

    if (window.currentAuthMode === 'register') {
      await window.signUpChill?.();
    } else {
      await window.signInChill?.();
    }
  };

  window.openAuthModal = function (mode = 'login') {
    ensureAuthModal();
    setAuthMode(mode);
    document.getElementById('auth-modal')?.classList.add('open');
    document.body.classList.add('auth-modal-active');
    setTimeout(() => document.getElementById('auth-modal-email')?.focus(), 50);
  };

  window.closeAuthModal = function () {
    document.getElementById('auth-modal')?.classList.remove('open');
    document.body.classList.remove('auth-modal-active');
  };

  window.refreshAuthModalVisibility = function (isLoggedIn) {
    ensureAuthModal();

    const openers = document.getElementById('auth-openers');
    const logoutBtn = document.getElementById('auth-logout');

    if (openers) openers.style.display = isLoggedIn ? 'none' : 'flex';
    if (logoutBtn) logoutBtn.style.display = isLoggedIn ? 'inline-flex' : 'none';

    if (isLoggedIn) closeAuthModal();
  };

  function initAuthModal() {
    ensureAuthModal();

    window.chillSupabase?.getSession?.().then(session => {
      window.refreshAuthModalVisibility(Boolean(session?.user));
    }).catch(() => {
      window.refreshAuthModalVisibility(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthModal);
  } else {
    initAuthModal();
  }
})();

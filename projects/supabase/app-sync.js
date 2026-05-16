// Chill Supabase synchronization layer

(function () {
  if (!window.chillSupabase) {
    console.error('Supabase client not found');
    return;
  }

  // Load profile UI layer dynamically
  const profileScript = document.createElement('script');
  profileScript.src = 'supabase/profile-ui.js';
  document.head.appendChild(profileScript);

  // Load paywall layer dynamically
  const paywallScript = document.createElement('script');
  paywallScript.src = 'supabase/paywall.js';
  document.head.appendChild(paywallScript);

  const supabaseApi = window.chillSupabase;

  async function hasPremiumAccessOrShowPaywall() {
    const session = await supabaseApi.getSession();

    if (!session?.user) return true;

    if (!window.chillPaywall) return true;

    const result = await window.chillPaywall.refreshPaywall();

    if (!result.hasAccess) {
      window.chillPaywall.showPaywall();
      showToast('Пробный период закончился. Активируйте Premium.');
      return false;
    }

    return true;
  }

  function showAuthError(error, fallbackMessage) {
    console.error(error);

    const msg = String(error?.message || '').toLowerCase();

    if (msg.includes('email not confirmed') || msg.includes('confirm') || msg.includes('confirmed')) {
      showToast('Email не подтверждён. Я могу отключить подтверждение или подтвердить аккаунт в Supabase.');
      return;
    }

    if (msg.includes('invalid login credentials')) {
      showToast('Неверный email или пароль');
      return;
    }

    if (msg.includes('password')) {
      showToast('Пароль должен быть минимум 6 символов');
      return;
    }

    if (msg.includes('already') || msg.includes('registered')) {
      showToast('Такой email уже зарегистрирован');
      return;
    }

    if (msg.includes('email')) {
      showToast('Проверьте правильность email');
      return;
    }

    showToast(fallbackMessage);
  }

  async function refreshAuthUI() {
    const session = await supabaseApi.getSession();

    const authStatus = document.getElementById('auth-status');
    const authForm = document.getElementById('auth-form');
    const logoutBtn = document.getElementById('auth-logout');

    if (session?.user) {
      authStatus.textContent = `Вы вошли как ${session.user.email}. Данные синхронизируются через Supabase ☁️`;
      authForm.style.display = 'none';
      logoutBtn.style.display = 'inline-flex';

      await syncProductsFromCloud();
      await syncShoppingFromCloud();

      render();

      if (window.renderChillProfile) {
        await window.renderChillProfile();
      }

      if (window.chillPaywall) {
        await window.chillPaywall.refreshPaywall();
      }
    } else {
      authStatus.textContent = 'Гостевой режим: данные хранятся только в этом браузере.';
      authForm.style.display = 'flex';
      logoutBtn.style.display = 'none';

      const profileCard = document.getElementById('profile-card');
      if (profileCard) {
        profileCard.style.display = 'none';
      }

      if (window.chillPaywall) {
        await window.chillPaywall.refreshPaywall();
      }
    }
  }

  async function syncProductsFromCloud() {
    const cloudProducts = await supabaseApi.getProducts();

    products = Array.isArray(cloudProducts)
      ? cloudProducts.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          expiryDate: p.expiry_date,
          price: p.price,
          addedAt: p.created_at
        }))
      : [];
  }

  async function syncShoppingFromCloud() {
    const cloudShopping = await supabaseApi.getShoppingItems();

    shopping = Array.isArray(cloudShopping)
      ? cloudShopping.map(item => ({
          id: item.id,
          name: item.name,
          bought: item.bought
        }))
      : [];
  }

  window.signUpChill = async function () {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();

    if (!email || !password) {
      showToast('Введите email и пароль');
      return;
    }

    const { data, error } = await supabaseApi.signUp(email, password);

    if (error) {
      showAuthError(error, 'Ошибка регистрации');
      return;
    }

    if (data?.session) {
      showToast('Регистрация успешна, вы вошли в аккаунт 🚀');
    } else {
      showToast('Регистрация успешна! Теперь войдите в аккаунт.');
    }

    await refreshAuthUI();
  };

  window.signInChill = async function () {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();

    if (!email || !password) {
      showToast('Введите email и пароль');
      return;
    }

    const { error } = await supabaseApi.signIn(email, password);

    if (error) {
      showAuthError(error, 'Неверный email или пароль');
      return;
    }

    showToast('Вход выполнен 🚀');
    await refreshAuthUI();
  };

  window.signOutChill = async function () {
    await supabaseApi.signOut();
    showToast('Вы вышли из аккаунта');
    await refreshAuthUI();
  };

  const originalAddProduct = window.addProduct;
  window.addProduct = async function () {
    const session = await supabaseApi.getSession();

    if (!session?.user) {
      originalAddProduct();
      return;
    }

    if (!(await hasPremiumAccessOrShowPaywall())) return;

    const name = document.getElementById('add-name').value.trim();
    const category = document.getElementById('add-category').value;
    const expiryDate = document.getElementById('add-expiry').value;
    const priceRaw = document.getElementById('add-price').value;
    const price = priceRaw ? Number(priceRaw) : 0;

    if (!name || !expiryDate) {
      showToast('Заполни название и срок годности');
      return;
    }

    await supabaseApi.addProduct({
      name,
      category,
      expiry_date: expiryDate,
      price
    });

    await syncProductsFromCloud();
    closeModal();
    render();

    if (window.renderChillProfile) {
      await window.renderChillProfile();
    }

    showToast(`✓ ${name} сохранён в облаке`);
  };

  const originalMarkEaten = window.markEaten;
  window.markEaten = async function (id) {
    const session = await supabaseApi.getSession();

    if (!session?.user) {
      originalMarkEaten(id);
      return;
    }

    if (!(await hasPremiumAccessOrShowPaywall())) return;

    const product = products.find(x => x.id === id);

    if (!product) return;

    await supabaseApi.markProductEaten(product);

    products = products.filter(x => x.id !== id);
    eaten.push({
      id: uid(),
      name: product.name,
      category: product.category,
      price: product.price || CATEGORY_PRICE[product.category] || 100,
      eatenAt: new Date().toISOString()
    });

    if (!shopping.find(s => s.name.toLowerCase() === product.name.toLowerCase())) {
      await supabaseApi.addShoppingItem({
        name: product.name,
        category: product.category || 'other',
        quantity: '1'
      });
      await syncShoppingFromCloud();
    }

    await syncProductsFromCloud();
    render();

    if (window.renderChillProfile) {
      await window.renderChillProfile();
    }

    showToast(`✓ ${product.name} съеден и больше не вернётся в холодильник`);
  };

  const originalAddManualShopping = window.addManualShopping;
  window.addManualShopping = async function () {
    const session = await supabaseApi.getSession();

    if (!session?.user) {
      originalAddManualShopping();
      return;
    }

    if (!(await hasPremiumAccessOrShowPaywall())) return;

    const input = document.getElementById('shopping-input');
    const name = input.value.trim();

    if (!name) return;

    await supabaseApi.addShoppingItem({
      name,
      category: 'other',
      quantity: '1'
    });

    input.value = '';

    await syncShoppingFromCloud();
    renderShopping();

    if (window.renderChillProfile) {
      await window.renderChillProfile();
    }

    showToast('Товар сохранён в Supabase');
  };

  document.addEventListener('DOMContentLoaded', async () => {
    await refreshAuthUI();
  });
})();

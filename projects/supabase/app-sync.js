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

  const supabaseApi = window.chillSupabase;

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
    } else {
      authStatus.textContent = 'Гостевой режим: данные хранятся только в этом браузере.';
      authForm.style.display = 'flex';
      logoutBtn.style.display = 'none';

      const profileCard = document.getElementById('profile-card');
      if (profileCard) {
        profileCard.style.display = 'none';
      }
    }
  }

  async function syncProductsFromCloud() {
    const cloudProducts = await supabaseApi.getProducts();

    if (Array.isArray(cloudProducts) && cloudProducts.length > 0) {
      products = cloudProducts.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        expiryDate: p.expiry_date,
        price: p.price,
        addedAt: p.created_at
      }));
    }
  }

  async function syncShoppingFromCloud() {
    const cloudShopping = await supabaseApi.getShoppingItems();

    if (Array.isArray(cloudShopping) && cloudShopping.length > 0) {
      shopping = cloudShopping.map(item => ({
        id: item.id,
        name: item.name,
        bought: item.bought
      }));
    }
  }

  window.signUpChill = async function () {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();

    if (!email || !password) {
      showToast('Введите email и пароль');
      return;
    }

    const { error } = await supabaseApi.signUp(email, password);

    if (error) {
      console.error(error);
      showToast('Ошибка регистрации');
      return;
    }

    showToast('Регистрация успешна! Проверьте email.');
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
      console.error(error);
      showToast('Неверный email или пароль');
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

  const originalAddManualShopping = window.addManualShopping;
  window.addManualShopping = async function () {
    const session = await supabaseApi.getSession();

    if (!session?.user) {
      originalAddManualShopping();
      return;
    }

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

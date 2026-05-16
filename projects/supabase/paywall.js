// Chill Paywall UI and access control

(function () {
  if (!window.chillSupabase) return;

  const api = window.chillSupabase;
  let currentSubscription = null;
  let premiumAccess = true;

  function ensurePaywall() {
    if (document.getElementById('paywall-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'paywall-overlay';
    overlay.className = 'paywall-overlay';
    overlay.style.display = 'none';

    overlay.innerHTML = `
      <div class="paywall-card">
        <div class="paywall-badge">Premium</div>
        <h2>Пробный период закончился</h2>
        <p class="paywall-subtitle">
          Продолжите пользоваться Chill Premium, чтобы сохранять продукты, покупки и аналитику в облаке.
        </p>

        <div class="paywall-price">
          <span class="paywall-price-main">199 ₽</span>
          <span class="paywall-price-period">/ месяц</span>
        </div>

        <ul class="paywall-features">
          <li>☁️ Облачное хранение продуктов</li>
          <li>🛒 Список покупок</li>
          <li>👨‍🍳 Рецепты из остатков</li>
          <li>📊 Аналитика кухни</li>
          <li>📱 Синхронизация между устройствами</li>
        </ul>

        <button class="btn btn-primary btn-block" id="activate-premium-btn">
          Активировать Premium в тестовом режиме
        </button>

        <p class="paywall-note">
          MVP-режим: реальная оплата через Stripe будет подключена позже.
        </p>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('activate-premium-btn').addEventListener('click', async () => {
      await activatePremiumTestMode();
    });
  }

  function setPremiumSectionsLocked(isLocked) {
    const premiumSectionIds = ['fridge', 'recipes', 'shopping', 'analytics'];

    premiumSectionIds.forEach(id => {
      const section = document.getElementById(id);
      if (!section) return;
      section.classList.toggle('premium-locked', isLocked);
    });
  }

  function showPaywall() {
    ensurePaywall();
    const overlay = document.getElementById('paywall-overlay');
    overlay.style.display = 'flex';
    setPremiumSectionsLocked(true);
  }

  function hidePaywall() {
    ensurePaywall();
    const overlay = document.getElementById('paywall-overlay');
    overlay.style.display = 'none';
    setPremiumSectionsLocked(false);
  }

  async function refreshPaywall() {
    const session = await api.getSession();

    if (!session?.user) {
      currentSubscription = null;
      premiumAccess = true;
      hidePaywall();
      return { hasAccess: true, subscription: null };
    }

    currentSubscription = await api.getSubscription();
    premiumAccess = api.hasPremiumAccess(currentSubscription);

    if (premiumAccess) {
      hidePaywall();
      updateTrialBadge();
    } else {
      showPaywall();
    }

    return {
      hasAccess: premiumAccess,
      subscription: currentSubscription
    };
  }

  function updateTrialBadge() {
    const authStatus = document.getElementById('auth-status');
    if (!authStatus || !currentSubscription) return;

    if (currentSubscription.status === 'trialing') {
      const daysLeft = api.getTrialDaysLeft(currentSubscription);
      authStatus.textContent += ` Trial: осталось ${daysLeft} дн.`;
    }

    if (currentSubscription.status === 'active') {
      authStatus.textContent += ' Premium активен ✨';
    }
  }

  async function activatePremiumTestMode() {
    const btn = document.getElementById('activate-premium-btn');

    try {
      btn.disabled = true;
      btn.textContent = 'Активируем...';

      currentSubscription = await api.activatePremiumTestMode();
      premiumAccess = true;

      hidePaywall();

      if (window.renderChillProfile) {
        await window.renderChillProfile();
      }

      showToast('Premium активирован в тестовом режиме ✨');
    } catch (error) {
      console.error(error);
      showToast('Не удалось активировать Premium');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Активировать Premium в тестовом режиме';
    }
  }

  window.chillPaywall = {
    refreshPaywall,
    hasAccess: () => premiumAccess,
    getSubscription: () => currentSubscription,
    showPaywall
  };

  document.addEventListener('DOMContentLoaded', () => {
    ensurePaywall();
    setTimeout(refreshPaywall, 1200);
  });
})();

// Chill Paywall UI and access control

(function () {
  if (!window.chillSupabase) return;

  const api = window.chillSupabase;
  let currentSubscription = null;
  let premiumAccess = true;

  function ensurePaywallStyles() {
    if (document.getElementById('paywall-styles')) return;

    const style = document.createElement('style');
    style.id = 'paywall-styles';
    style.textContent = `
      .paywall-overlay {
        position: fixed;
        inset: 0;
        z-index: 900;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        background: rgba(26, 34, 23, .56);
        backdrop-filter: blur(8px);
      }

      .paywall-card {
        width: min(100%, 460px);
        padding: 2rem;
        border-radius: 22px;
        background: var(--card-bg, #fff);
        border: 1px solid var(--border, #e8ece6);
        box-shadow: 0 18px 60px rgba(0,0,0,.22);
        text-align: center;
      }

      .paywall-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: .35rem .85rem;
        margin-bottom: 1rem;
        border-radius: 999px;
        background: var(--green-light, #e8f5e9);
        color: var(--green, #4CAF50);
        font-weight: 800;
        font-size: .82rem;
        text-transform: uppercase;
        letter-spacing: .04em;
      }

      .paywall-card h2 {
        margin-bottom: .75rem;
        font-size: 1.8rem;
        line-height: 1.15;
      }

      .paywall-subtitle {
        color: var(--text-muted, #6b7a67);
        margin-bottom: 1.3rem;
      }

      .paywall-price {
        margin: 1.2rem 0;
      }

      .paywall-price-main {
        font-size: 2.4rem;
        font-weight: 900;
        color: var(--green, #4CAF50);
      }

      .paywall-price-period {
        color: var(--text-muted, #6b7a67);
        font-weight: 700;
      }

      .paywall-features {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: .65rem;
        margin: 1.4rem 0;
        text-align: left;
      }

      .paywall-features li {
        padding: .75rem .9rem;
        border-radius: 12px;
        background: var(--bg-alt, #F2F5F0);
        font-weight: 600;
      }

      .paywall-note {
        margin-top: 1rem;
        color: var(--text-muted, #6b7a67);
        font-size: .84rem;
      }

      .premium-locked {
        filter: blur(2px);
        opacity: .55;
        pointer-events: none;
        user-select: none;
      }
    `;

    document.head.appendChild(style);
  }

  function ensurePaywall() {
    ensurePaywallStyles();

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

    if (currentSubscription.status === 'trialing' && !authStatus.textContent.includes('Trial:')) {
      const daysLeft = api.getTrialDaysLeft(currentSubscription);
      authStatus.textContent += ` Trial: осталось ${daysLeft} дн.`;
    }

    if (currentSubscription.status === 'active' && !authStatus.textContent.includes('Premium активен')) {
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

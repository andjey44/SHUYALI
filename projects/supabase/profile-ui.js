// Chill profile UI

(function () {
  if (!window.chillSupabase) return;

  const api = window.chillSupabase;

  function ensureProfileCard() {
    if (document.getElementById('profile-card')) return;

    const authSection = document.getElementById('auth');

    const profile = document.createElement('div');
    profile.id = 'profile-card';
    profile.className = 'profile-card';
    profile.style.display = 'none';

    profile.innerHTML = `
      <div class="profile-avatar-wrap">
        <div class="profile-avatar" id="profile-avatar">👤</div>
      </div>

      <div class="profile-content">
        <h3 id="profile-name">Пользователь Chill</h3>
        <p id="profile-email">email@example.com</p>

        <div class="profile-stats">
          <div class="profile-stat">
            <span class="profile-stat-value" id="profile-products-count">0</span>
            <span class="profile-stat-label">Продуктов</span>
          </div>

          <div class="profile-stat">
            <span class="profile-stat-value" id="profile-shopping-count">0</span>
            <span class="profile-stat-label">Покупок</span>
          </div>
        </div>

        <div class="profile-actions">
          <button class="btn btn-outline" id="profile-refresh-btn">Обновить профиль</button>
        </div>
      </div>
    `;

    authSection.appendChild(profile);

    document.getElementById('profile-refresh-btn').addEventListener('click', async () => {
      await renderProfile();
      showToast('Профиль обновлён');
    });
  }

  async function renderProfile() {
    ensureProfileCard();

    const session = await api.getSession();
    const profileCard = document.getElementById('profile-card');

    if (!session?.user) {
      profileCard.style.display = 'none';
      return;
    }

    const profile = await api.getProfile();

    profileCard.style.display = 'flex';

    document.getElementById('profile-name').textContent =
      profile?.full_name || 'Пользователь Chill';

    document.getElementById('profile-email').textContent =
      profile?.email || session.user.email;

    document.getElementById('profile-products-count').textContent =
      Array.isArray(products) ? products.length : 0;

    document.getElementById('profile-shopping-count').textContent =
      Array.isArray(shopping) ? shopping.length : 0;

    const avatar = document.getElementById('profile-avatar');

    if (profile?.full_name) {
      avatar.textContent = profile.full_name
        .split(' ')
        .map(x => x[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    } else {
      avatar.textContent = '👤';
    }
  }

  window.renderChillProfile = renderProfile;

  document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(renderProfile, 1000);
  });
})();

'use strict';

const CATEGORIES = [
  { value: 'vegetables', label: 'Овощи',    emoji: '🥦' },
  { value: 'dairy',      label: 'Молочка',  emoji: '🥛' },
  { value: 'meat',       label: 'Мясо',     emoji: '🥩' },
  { value: 'groceries',  label: 'Бакалея',  emoji: '🌾' },
  { value: 'other',      label: 'Другое',   emoji: '📦' },
];

const RECIPES = [
  { name:'Омлет',             emoji:'🥚', ingredients:['Яйца','Молоко'],                  keywords:['яйц','молок'] },
  { name:'Блины',             emoji:'🥞', ingredients:['Молоко','Яйца','Мука'],            keywords:['молок','яйц','мук'] },
  { name:'Жаркое из курицы',  emoji:'🍗', ingredients:['Куриное филе','Картошка','Лук'],   keywords:['кур','картош','лук'] },
  { name:'Паста с томатами',  emoji:'🍝', ingredients:['Паста','Помидоры','Чеснок'],       keywords:['паст','помидор','томат','чеснок'] },
  { name:'Суп-пюре',          emoji:'🥣', ingredients:['Картошка','Морковь','Лук'],        keywords:['картош','морков','лук'] },
  { name:'Жаркое',            emoji:'🥩', ingredients:['Мясо','Лук','Картошка'],           keywords:['мяс','говяд','свинин','лук'] },
  { name:'Овощной салат',     emoji:'🥗', ingredients:['Помидоры','Огурцы','Перец'],       keywords:['помидор','огурц','перец','томат'] },
  { name:'Тосты с сыром',     emoji:'🧀', ingredients:['Хлеб','Сыр'],                      keywords:['хлеб','сыр','тост'] },
  { name:'Фруктовый салат',   emoji:'🍎', ingredients:['Яблоки','Бананы','Апельсины'],     keywords:['яблок','банан','апельсин','фрукт'] },
  { name:'Яичница',           emoji:'🍳', ingredients:['Яйца','Масло'],                    keywords:['яйц','масл'] },
];

const KEYS = { products:'kitchen_products', shopping:'shopping_list', eaten:'eaten_products' };

// ── Storage ──
function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}
function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

// ── Helpers ──
function getStatus(expiryDate) {
  const today = new Date(); today.setHours(0,0,0,0);
  const exp   = new Date(expiryDate); exp.setHours(0,0,0,0);
  const diff  = Math.ceil((exp - today) / 86400000);
  if (diff <= 1) return 'red';
  if (diff <= 5) return 'yellow';
  return 'green';
}
function daysUntil(expiryDate) {
  const today = new Date(); today.setHours(0,0,0,0);
  const exp   = new Date(expiryDate); exp.setHours(0,0,0,0);
  return Math.ceil((exp - today) / 86400000);
}
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day:'numeric', month:'short' });
}
function addDays(date, n) {
  const d = new Date(date); d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Demo data ──
function createDemoProducts() {
  const today = new Date();
  return [
    { id:uid(), name:'Молоко',       category:'dairy',      expiryDate:addDays(today,1),  addedAt:new Date().toISOString() },
    { id:uid(), name:'Куриное филе', category:'meat',       expiryDate:addDays(today,3),  addedAt:new Date().toISOString() },
    { id:uid(), name:'Помидоры',     category:'vegetables', expiryDate:addDays(today,7),  addedAt:new Date().toISOString() },
    { id:uid(), name:'Яйца',         category:'groceries',  expiryDate:addDays(today,14), addedAt:new Date().toISOString() },
    { id:uid(), name:'Картошка',     category:'vegetables', expiryDate:addDays(today,20), addedAt:new Date().toISOString() },
  ];
}

// ── State ──
let products = [], shopping = [], eaten = [], activeFilter = 'all';

// ── Toast ──
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  document.getElementById('toast-text').textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// ── Modal ──
function openModal()  { document.getElementById('modal').classList.add('open'); document.getElementById('add-name').focus(); }
function closeModal() { document.getElementById('modal').classList.remove('open'); document.getElementById('add-form').reset(); }

// ── Render: Products ──
function getStatusLabel(expiryDate) {
  const d = daysUntil(expiryDate);
  if (d < 0) return 'Просрочен';
  if (d === 0) return 'Сегодня';
  if (d === 1) return 'Завтра';
  return `Через ${d} дн.`;
}

function renderProducts() {
  const refreshed = products.map(p => ({ ...p, status: getStatus(p.expiryDate) }));
  const sorted    = [...refreshed].sort((a,b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  const visible   = activeFilter === 'all' ? sorted : sorted.filter(p => p.category === activeFilter);
  const urgent    = sorted.filter(p => p.status === 'red');

  const banner = document.getElementById('urgent-banner');
  const bannerText = document.getElementById('urgent-text');
  if (urgent.length > 0) {
    bannerText.textContent = `⚠️ Скоро испортится! ${urgent.length} ${urgent.length===1?'продукт требует':'продукта требуют'} внимания: ${urgent.map(u=>u.name).join(', ')}`;
    banner.style.display = 'block';
  } else { banner.style.display = 'none'; }

  document.getElementById('fridge-count').textContent = `${products.length} продукт${products.length===1?'':'ов'} внутри`;

  const grid = document.getElementById('products-grid');
  if (visible.length === 0) {
    grid.innerHTML = '<div class="empty-state">🛒 Похоже, пора в магазин! Добавь продукты</div>';
    return;
  }
  grid.innerHTML = visible.map(p => {
    const cat = CATEGORIES.find(c => c.value === p.category) || CATEGORIES[4];
    return `<div class="product-card border-${p.status}">
      <div class="product-emoji">${cat.emoji}</div>
      <div class="product-info">
        <div class="product-name">${escHtml(p.name)}</div>
        <div class="product-meta">
          <span class="badge badge-${p.status}">${getStatusLabel(p.expiryDate)}</span>
          <span class="product-date">📅 ${formatDate(p.expiryDate)}</span>
        </div>
      </div>
      <div class="product-actions">
        <button class="btn btn-eat" onclick="markEaten('${p.id}')">Съел ✓</button>
        <button class="btn btn-delete" onclick="deleteProduct('${p.id}')" title="Удалить">✕</button>
      </div>
    </div>`;
  }).join('');
}

// ── Render: Recipes ──
function renderRecipes(matched) {
  const container = document.getElementById('recipes-result');
  if (!matched || matched.length === 0) {
    container.innerHTML = '<div class="empty-state">Не нашлось подходящих рецептов. Добавь больше продуктов!</div>';
    return;
  }
  container.innerHTML = `<div class="recipes-grid">${matched.map(r => `
    <div class="recipe-card">
      <div class="recipe-header"><span class="recipe-emoji">${r.emoji}</span><h3 class="recipe-name">${escHtml(r.name)}</h3></div>
      <div class="recipe-ingredients">
        ${r.ingredients.map(ing => {
          const has = !r.missing.includes(ing);
          return `<div class="ingredient ${has?'has':'miss'}">${has?'✓':'✕'} ${escHtml(ing)}
            ${!has?`<button class="add-to-list" onclick="addMissing('${escHtml(ing)}')">+ в список</button>`:''}
          </div>`;
        }).join('')}
      </div>
      ${r.missing.length > 0 ? `<button class="btn btn-outline btn-sm" onclick="addAllMissing(${JSON.stringify(r.missing)})">Добавить всё недостающее в список покупок</button>` : ''}
    </div>`).join('')}</div>`;
}

// ── Render: Shopping ──
function renderShopping() {
  const badge = document.getElementById('shopping-count');
  badge.style.display = shopping.length > 0 ? 'inline-flex' : 'none';
  badge.textContent   = shopping.length;

  const list = document.getElementById('shopping-list');
  if (shopping.length === 0) {
    list.innerHTML = '<div class="empty-state">Список покупок пуст! Добавь продукты вручную или они появятся автоматически 🛒</div>';
    return;
  }
  list.innerHTML = `<ul class="shopping-list">${shopping.map(s => `
    <li class="shopping-item ${s.bought?'bought':''}">
      <label class="shopping-check">
        <input type="checkbox" ${s.bought?'checked':''} onchange="toggleBought('${s.id}')">
        <span class="shopping-name">${escHtml(s.name)}</span>
      </label>
      <button class="shopping-del" onclick="removeShoppingItem('${s.id}')">✕</button>
    </li>`).join('')}</ul>`;
}

// ── Render: Stats ──
function renderStats() {
  document.getElementById('stat-saved').textContent = `${eaten.length * 50} ₽`;
  document.getElementById('stat-waste').textContent = products.filter(p => daysUntil(p.expiryDate) < 0).length;
  const counts = {};
  eaten.forEach(e => { counts[e.category] = (counts[e.category]||0)+1; });
  const top = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('stat-fav').textContent = top
    ? (CATEGORIES.find(c=>c.value===top[0]) ? `${CATEGORIES.find(c=>c.value===top[0]).emoji} ${CATEGORIES.find(c=>c.value===top[0]).label}` : top[0])
    : '—';
}

function render() { renderProducts(); renderShopping(); renderStats(); }

// ── Actions: Products ──
function addProduct() {
  const name = document.getElementById('add-name').value.trim();
  const category = document.getElementById('add-category').value;
  const expiryDate = document.getElementById('add-expiry').value;
  if (!name || !expiryDate) { showToast('Заполни название и срок годности'); return; }
  products.push({ id:uid(), name, category, expiryDate, status:getStatus(expiryDate), addedAt:new Date().toISOString() });
  save(KEYS.products, products);
  closeModal(); render();
  showToast(`✓ ${name} добавлен в холодильник`);
}

function markEaten(id) {
  const p = products.find(x => x.id === id); if (!p) return;
  products = products.filter(x => x.id !== id);
  eaten.push({ id:uid(), name:p.name, category:p.category, eatenAt:new Date().toISOString() });
  save(KEYS.products, products); save(KEYS.eaten, eaten);
  if (!shopping.find(s => s.name.toLowerCase() === p.name.toLowerCase())) {
    shopping.push({ id:uid(), name:p.name, bought:false });
    save(KEYS.shopping, shopping);
  }
  render(); showToast(`✓ ${p.name} съеден! Добавлен в список покупок`);
}

function deleteProduct(id) {
  products = products.filter(x => x.id !== id);
  save(KEYS.products, products); render(); showToast('Продукт удалён');
}

// ── Actions: Recipes ──
function findRecipes() {
  if (products.length === 0) { showToast('Добавь продукты в холодильник сначала!'); return; }
  const names  = products.map(p => p.name.toLowerCase());
  const urgent = products.filter(p => getStatus(p.expiryDate) === 'red');
  const matched = RECIPES.map(r => {
    const score   = r.keywords.filter(kw => names.some(n => n.includes(kw))).length;
    const missing = r.ingredients.filter(ing => !r.keywords.some(kw => names.some(n => n.includes(kw))));
    const isUrgent = urgent.some(u => r.keywords.some(kw => u.name.toLowerCase().includes(kw)));
    return { ...r, score, missing, isUrgent };
  }).filter(r => r.score > 0)
    .sort((a,b) => { if(a.isUrgent&&!b.isUrgent)return -1; if(!a.isUrgent&&b.isUrgent)return 1; return b.score-a.score; })
    .slice(0, 3);
  renderRecipes(matched);
  document.getElementById('recipes-result').scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function addMissing(name) {
  if (shopping.find(s => s.name.toLowerCase() === name.toLowerCase())) { showToast(`${name} уже в списке`); return; }
  shopping.push({ id:uid(), name, bought:false });
  save(KEYS.shopping, shopping); renderShopping(); renderStats();
  showToast(`${name} добавлен в список покупок`);
}

function addAllMissing(names) {
  let added = 0;
  names.forEach(name => {
    if (!shopping.find(s => s.name.toLowerCase() === name.toLowerCase())) {
      shopping.push({ id:uid(), name, bought:false }); added++;
    }
  });
  if (added > 0) { save(KEYS.shopping, shopping); renderShopping(); renderStats(); }
  showToast(added > 0 ? `Добавлено ${added} позиц. в список покупок` : 'Всё уже в списке');
}

// ── Actions: Shopping ──
function addManualShopping() {
  const input = document.getElementById('shopping-input');
  const name  = input.value.trim();
  if (!name) return;
  if (shopping.find(s => s.name.toLowerCase() === name.toLowerCase())) { showToast('Уже есть в списке'); return; }
  shopping.push({ id:uid(), name, bought:false });
  save(KEYS.shopping, shopping); input.value = ''; renderShopping(); renderStats();
}

function toggleBought(id) {
  shopping = shopping.map(s => s.id===id ? {...s, bought:!s.bought} : s);
  save(KEYS.shopping, shopping); renderShopping();
}

function removeShoppingItem(id) {
  shopping = shopping.filter(s => s.id !== id);
  save(KEYS.shopping, shopping); renderShopping(); renderStats();
}

function clearBought() {
  shopping = shopping.filter(s => !s.bought);
  save(KEYS.shopping, shopping); renderShopping(); renderStats();
  showToast('Купленные товары удалены');
}

function shareList() {
  if (shopping.length === 0) { showToast('Список пуст'); return; }
  const text = 'Список покупок:\n' + shopping.map(s => `${s.bought?'☑':'☐'} ${s.name}`).join('\n');
  navigator.clipboard.writeText(text)
    .then(() => showToast('Список скопирован в буфер обмена 📋'))
    .catch(() => showToast('Не удалось скопировать'));
}

// ── Filter ──
function setFilter(val) {
  activeFilter = val;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === val));
  renderProducts();
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  products = load(KEYS.products);
  shopping = load(KEYS.shopping);
  eaten    = load(KEYS.eaten);

  if (products.length === 0) { products = createDemoProducts(); save(KEYS.products, products); }

  document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', () => setFilter(btn.dataset.filter)));
  document.getElementById('add-form').addEventListener('submit', e => { e.preventDefault(); addProduct(); });
  document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  document.getElementById('shopping-input').addEventListener('keydown', e => { if (e.key === 'Enter') addManualShopping(); });
  document.getElementById('toast-close').addEventListener('click', () => document.getElementById('toast').classList.remove('show'));
  document.getElementById('add-expiry').min = new Date().toISOString().split('T')[0];

  render();
});

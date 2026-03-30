'use strict';

/* ─────────────────────────────────────────────
   Constants & Config
───────────────────────────────────────────── */
const CATEGORIES = [
  { value: 'vegetables', label: 'Овощи',   emoji: '🥦' },
  { value: 'dairy',      label: 'Молочка', emoji: '🥛' },
  { value: 'meat',       label: 'Мясо',    emoji: '🥩' },
  { value: 'groceries',  label: 'Бакалея', emoji: '🌾' },
  { value: 'other',      label: 'Другое',  emoji: '📦' },
];

// Default price per category (₽) — used for savings estimation
const CATEGORY_PRICE = {
  dairy: 90, vegetables: 70, meat: 320, groceries: 110, other: 150,
};

// Default expiry days per category — pre-filled after barcode scan
const CATEGORY_DEFAULT_DAYS = {
  dairy: 7, vegetables: 10, meat: 4, groceries: 180, other: 14,
};

// Open Food Facts category → our category mapping
const OFF_CATEGORY_MAP = [
  { keywords: ['dairy','milk','cheese','yogurt','cream'], value: 'dairy' },
  { keywords: ['meat','fish','poultry','seafood','beef','pork','chicken'], value: 'meat' },
  { keywords: ['vegetable','fruit','produce','salad'], value: 'vegetables' },
  { keywords: ['cereal','pasta','grain','flour','bread','rice','legume'], value: 'groceries' },
];

const RECIPES = [
  {
    name: 'Омлет', emoji: '🥚',
    ingredients: ['Яйца', 'Молоко', 'Масло'],
    keywords: ['яйц', 'молок', 'масл'],
    time: 10, diet: ['vegetarian', 'glutenfree', 'quick'],
  },
  {
    name: 'Блины', emoji: '🥞',
    ingredients: ['Молоко', 'Яйца', 'Мука'],
    keywords: ['молок', 'яйц', 'мук'],
    time: 30, diet: ['vegetarian', 'quick'],
  },
  {
    name: 'Жаркое из курицы', emoji: '🍗',
    ingredients: ['Куриное филе', 'Картошка', 'Лук'],
    keywords: ['кур', 'картош', 'лук'],
    time: 45, diet: ['glutenfree'],
  },
  {
    name: 'Паста с томатами', emoji: '🍝',
    ingredients: ['Паста', 'Помидоры', 'Чеснок'],
    keywords: ['паст', 'помидор', 'томат', 'чеснок'],
    time: 25, diet: ['vegetarian', 'quick'],
  },
  {
    name: 'Суп-пюре', emoji: '🥣',
    ingredients: ['Картошка', 'Морковь', 'Лук'],
    keywords: ['картош', 'морков', 'лук'],
    time: 40, diet: ['vegetarian', 'glutenfree'],
  },
  {
    name: 'Жаркое', emoji: '🥩',
    ingredients: ['Мясо', 'Лук', 'Картошка'],
    keywords: ['мяс', 'говяд', 'свинин', 'лук'],
    time: 50, diet: ['glutenfree'],
  },
  {
    name: 'Овощной салат', emoji: '🥗',
    ingredients: ['Помидоры', 'Огурцы', 'Перец'],
    keywords: ['помидор', 'огурц', 'перец', 'томат'],
    time: 10, diet: ['vegetarian', 'glutenfree', 'quick'],
  },
  {
    name: 'Тосты с сыром', emoji: '🧀',
    ingredients: ['Хлеб', 'Сыр'],
    keywords: ['хлеб', 'сыр', 'тост'],
    time: 5, diet: ['vegetarian', 'quick'],
  },
  {
    name: 'Фруктовый салат', emoji: '🍎',
    ingredients: ['Яблоки', 'Бананы', 'Апельсины'],
    keywords: ['яблок', 'банан', 'апельсин', 'фрукт'],
    time: 10, diet: ['vegetarian', 'glutenfree', 'quick'],
  },
  {
    name: 'Яичница', emoji: '🍳',
    ingredients: ['Яйца', 'Масло'],
    keywords: ['яйц', 'масл'],
    time: 5, diet: ['vegetarian', 'glutenfree', 'quick'],
  },
  {
    name: 'Куриный суп', emoji: '🍲',
    ingredients: ['Куриное филе', 'Морковь', 'Картошка', 'Лук'],
    keywords: ['кур', 'морков', 'картош', 'лук'],
    time: 60, diet: ['glutenfree'],
  },
  {
    name: 'Рис с овощами', emoji: '🍚',
    ingredients: ['Рис', 'Морковь', 'Лук'],
    keywords: ['рис', 'морков', 'лук'],
    time: 30, diet: ['vegetarian', 'glutenfree', 'quick'],
  },
];

const KEYS = {
  products:  'kitchen_products',
  shopping:  'shopping_list',
  eaten:     'eaten_products',
  wasted:    'wasted_products',
  likes:     'recipe_likes',
  views:     'recipe_views',
};

/* ─────────────────────────────────────────────
   Storage helpers
───────────────────────────────────────────── */
function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}
function loadObj(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
}
function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

/* ─────────────────────────────────────────────
   Date helpers
───────────────────────────────────────────── */
function getStatus(expiryDate) {
  const diff = daysUntil(expiryDate);
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
function isoWeek(dateStr) {
  const d = new Date(dateStr);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
}
function monthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ─────────────────────────────────────────────
   Demo data
───────────────────────────────────────────── */
function createDemoProducts() {
  const today = new Date();
  return [
    { id:uid(), name:'Молоко',       category:'dairy',      expiryDate:addDays(today,1),  price:85,  addedAt:new Date().toISOString() },
    { id:uid(), name:'Куриное филе', category:'meat',       expiryDate:addDays(today,3),  price:300, addedAt:new Date().toISOString() },
    { id:uid(), name:'Помидоры',     category:'vegetables', expiryDate:addDays(today,7),  price:60,  addedAt:new Date().toISOString() },
    { id:uid(), name:'Яйца',         category:'groceries',  expiryDate:addDays(today,14), price:90,  addedAt:new Date().toISOString() },
    { id:uid(), name:'Картошка',     category:'vegetables', expiryDate:addDays(today,20), price:50,  addedAt:new Date().toISOString() },
  ];
}

/* ─────────────────────────────────────────────
   App state
───────────────────────────────────────────── */
let products    = [];
let shopping    = [];
let eaten       = [];
let wasted      = [];
let recipeLikes = {};
let recipeViews = {};
let activeFilter = 'all';
let activeDiet   = 'all';

// Chart instances
let chartWeekly = null, chartCategories = null, chartSavings = null;

/* ─────────────────────────────────────────────
   Toast
───────────────────────────────────────────── */
let toastTimer = null;
function showToast(msg) {
  const el  = document.getElementById('toast');
  document.getElementById('toast-text').textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

/* ─────────────────────────────────────────────
   Modal — Add product
───────────────────────────────────────────── */
function openModal() {
  document.getElementById('modal').classList.add('open');
  document.getElementById('add-name').focus();
}
function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.getElementById('add-form').reset();
}

/* ─────────────────────────────────────────────
   Barcode Scanner (Улучшение 1)
───────────────────────────────────────────── */
let barcodeStream   = null;
let barcodeDetector = null;
let barcodeInterval = null;

async function startBarcodeScanner() {
  if (!('BarcodeDetector' in window)) {
    showToast('Ваш браузер не поддерживает сканер. Попробуйте Chrome 83+');
    openModal();
    return;
  }
  try {
    barcodeStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
    });
    const video = document.getElementById('barcode-video');
    video.srcObject = barcodeStream;
    document.getElementById('camera-modal').classList.add('open');
    document.getElementById('scan-status').textContent = 'Наведи камеру на штрихкод...';

    barcodeDetector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
    barcodeInterval = setInterval(async () => {
      try {
        const barcodes = await barcodeDetector.detect(video);
        if (barcodes.length > 0) {
          clearInterval(barcodeInterval);
          document.getElementById('scan-status').textContent = '✓ Штрихкод найден! Загружаем данные...';
          await fetchProductByBarcode(barcodes[0].rawValue);
        }
      } catch { /* ignore frame errors */ }
    }, 400);
  } catch {
    showToast('Не удалось получить доступ к камере');
    openModal();
  }
}

function closeCameraModal() {
  if (barcodeStream) { barcodeStream.getTracks().forEach(t => t.stop()); barcodeStream = null; }
  clearInterval(barcodeInterval);
  document.getElementById('camera-modal').classList.remove('open');
}

async function fetchProductByBarcode(barcode) {
  closeCameraModal();
  try {
    const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await res.json();

    if (data.status === 1 && data.product) {
      const p    = data.product;
      const name = p.product_name_ru || p.product_name_en || p.product_name || '';
      const tags = (p.categories_tags || []).map(c => c.toLowerCase());

      let category = 'other';
      for (const entry of OFF_CATEGORY_MAP) {
        if (entry.keywords.some(kw => tags.some(t => t.includes(kw)))) {
          category = entry.value; break;
        }
      }

      document.getElementById('add-name').value     = name;
      document.getElementById('add-category').value = category;
      document.getElementById('add-expiry').value   = addDays(new Date(), CATEGORY_DEFAULT_DAYS[category] || 7);
      openModal();
      showToast(name ? `✓ Найден: ${name}` : 'Продукт найден. Проверь название');
    } else {
      showToast(`Продукт (${barcode}) не найден в базе. Введи вручную`);
      openModal();
    }
  } catch {
    showToast('Ошибка сети. Введи продукт вручную');
    openModal();
  }
}

/* ─────────────────────────────────────────────
   Render — Products
───────────────────────────────────────────── */
function getStatusLabel(expiryDate) {
  const d = daysUntil(expiryDate);
  if (d < 0)   return 'Просрочен';
  if (d === 0) return 'Сегодня';
  if (d === 1) return 'Завтра';
  return `Через ${d} дн.`;
}

function renderProducts() {
  const refreshed = products.map(p => ({ ...p, status: getStatus(p.expiryDate) }));
  const sorted    = [...refreshed].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  const visible   = activeFilter === 'all' ? sorted : sorted.filter(p => p.category === activeFilter);
  const urgent    = sorted.filter(p => p.status === 'red');

  // Banner
  const banner = document.getElementById('urgent-banner');
  if (urgent.length > 0) {
    document.getElementById('urgent-text').textContent =
      `⚠️ Скоро испортится! ${urgent.length} ${urgent.length === 1 ? 'продукт требует' : 'продукта требуют'} внимания: ${urgent.map(u => u.name).join(', ')}`;
    banner.style.display = 'block';
  } else {
    banner.style.display = 'none';
  }

  document.getElementById('fridge-count').textContent =
    `${products.length} продукт${products.length === 1 ? '' : 'ов'} внутри`;

  const grid = document.getElementById('products-grid');
  if (visible.length === 0) {
    grid.innerHTML = '<div class="empty-state">🛒 Похоже, пора в магазин! Добавь продукты</div>';
    return;
  }

  grid.innerHTML = `<div class="products-grid">${visible.map(p => {
    const cat = CATEGORIES.find(c => c.value === p.category) || CATEGORIES[4];
    return `
      <div class="product-card border-${p.status}">
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
  }).join('')}</div>`;
}

/* ─────────────────────────────────────────────
   Recipe scoring (Улучшение 2)
───────────────────────────────────────────── */
function scoreRecipe(r, names, urgentNames) {
  if (activeDiet !== 'all') {
    if (activeDiet === 'quick'       && r.time > 30)                 return -1;
    if (activeDiet === 'vegetarian'  && !r.diet.includes('vegetarian')) return -1;
    if (activeDiet === 'glutenfree'  && !r.diet.includes('glutenfree')) return -1;
  }

  const matchCount = r.keywords.filter(kw => names.some(n => n.includes(kw))).length;
  if (matchCount === 0) return -1;

  const likeBonus    = recipeLikes[r.name] ? 8 : 0;
  const urgencyBonus = r.keywords.some(kw => urgentNames.some(n => n.includes(kw))) ? 12 : 0;
  const matchScore   = matchCount * 3;
  const speedBonus   = r.time <= 15 ? 2 : r.time <= 30 ? 1 : 0;

  return matchScore + likeBonus + urgencyBonus + speedBonus;
}

function findRecipes() {
  if (products.length === 0) {
    showToast('Добавь продукты в холодильник сначала!');
    return;
  }
  const names       = products.map(p => p.name.toLowerCase());
  const urgentNames = products.filter(p => getStatus(p.expiryDate) === 'red').map(p => p.name.toLowerCase());

  const scored = RECIPES.map(r => {
    const sc = scoreRecipe(r, names, urgentNames);
    if (sc < 0) return null;
    const missing = r.ingredients.filter(ing =>
      !r.keywords.some(kw => names.some(n => n.includes(kw)))
    );
    const isUrgent = r.keywords.some(kw => urgentNames.some(n => n.includes(kw)));
    return { ...r, score: sc, missing, isUrgent };
  })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  // Track views
  scored.forEach(r => { recipeViews[r.name] = (recipeViews[r.name] || 0) + 1; });
  save(KEYS.views, recipeViews);

  renderRecipes(scored);
  document.getElementById('recipes-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ─────────────────────────────────────────────
   Render — Recipes
───────────────────────────────────────────── */
function renderRecipes(matched) {
  const container = document.getElementById('recipes-result');
  if (!matched || matched.length === 0) {
    container.innerHTML = activeDiet === 'all'
      ? '<div class="empty-state">Не нашлось рецептов. Добавь больше продуктов!</div>'
      : '<div class="empty-state">Нет рецептов для выбранного фильтра. Попробуй другой.</div>';
    return;
  }
  container.innerHTML = `<div class="recipes-grid">${matched.map(r => {
    const liked = recipeLikes[r.name];
    const tags  = [];
    if (r.isUrgent)              tags.push('<span class="recipe-tag urgent">🔥 Срочный</span>');
    if (r.diet.includes('quick')) tags.push(`<span class="recipe-tag">⚡ ${r.time} мин</span>`);
    if (r.diet.includes('vegetarian')) tags.push('<span class="recipe-tag">🥦 Вегетарианское</span>');
    if (r.diet.includes('glutenfree')) tags.push('<span class="recipe-tag">🌾 Без глютена</span>');

    return `
      <div class="recipe-card">
        <div class="recipe-header">
          <span class="recipe-emoji">${r.emoji}</span>
          <h3 class="recipe-name">${escHtml(r.name)}</h3>
          <button class="btn-like ${liked ? 'liked' : ''}" onclick="toggleLike('${escHtml(r.name)}')" title="${liked ? 'Убрать лайк' : 'Нравится'}">
            ${liked ? '❤️' : '🤍'}
          </button>
        </div>
        ${tags.length ? `<div class="recipe-meta">${tags.join('')}</div>` : ''}
        <div class="recipe-ingredients">
          ${r.ingredients.map(ing => {
            const has = !r.missing.includes(ing);
            return `<div class="ingredient ${has ? 'has' : 'miss'}">
              ${has ? '✓' : '✕'} ${escHtml(ing)}
              ${!has ? `<button class="add-to-list" onclick="addMissing('${escHtml(ing)}')">+ в список</button>` : ''}
            </div>`;
          }).join('')}
        </div>
        ${r.missing.length > 0 ? `
          <div class="recipe-footer">
            <button class="btn btn-outline btn-sm" onclick='addAllMissing(${JSON.stringify(r.missing)})'>
              Добавить всё недостающее
            </button>
          </div>` : ''}
      </div>`;
  }).join('')}</div>`;
}

/* ─────────────────────────────────────────────
   Render — Shopping
───────────────────────────────────────────── */
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
    <li class="shopping-item ${s.bought ? 'bought' : ''}">
      <label class="shopping-check">
        <input type="checkbox" ${s.bought ? 'checked' : ''} onchange="toggleBought('${s.id}')">
        <span class="shopping-name">${escHtml(s.name)}</span>
      </label>
      <button class="shopping-del" onclick="removeShoppingItem('${s.id}')">✕</button>
    </li>`).join('')}</ul>`;
}

/* ─────────────────────────────────────────────
   Render — Stats
───────────────────────────────────────────── */
function renderStats() {
  const totalSaved = eaten.reduce((sum, e) => sum + (e.price || CATEGORY_PRICE[e.category] || 100), 0);
  document.getElementById('stat-saved').textContent  = `${totalSaved} ₽`;
  document.getElementById('stat-waste').textContent  = wasted.length;
  document.getElementById('stat-eaten').textContent  = eaten.length;

  const counts = {};
  eaten.forEach(e => { counts[e.category] = (counts[e.category] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  let fav = '—';
  if (top) {
    const cat = CATEGORIES.find(c => c.value === top[0]);
    fav = cat ? `${cat.emoji} ${cat.label}` : top[0];
  }
  document.getElementById('stat-fav').textContent = fav;
}

/* ─────────────────────────────────────────────
   Analytics charts (Улучшение 3)
───────────────────────────────────────────── */
const CHART_COLORS = {
  green:  '#4CAF50',
  orange: '#FF9800',
  red:    '#F44336',
  blue:   '#2196F3',
  purple: '#9C27B0',
};

function getLast6Weeks() {
  const weeks = [];
  const now   = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    weeks.push({ label: `Нед. ${isoWeek(d.toISOString())}`, year: d.getFullYear(), week: isoWeek(d.toISOString()) });
  }
  return weeks;
}

function getLast6Months() {
  const months  = [];
  const now     = new Date();
  const ruMonth = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: `${ruMonth[d.getMonth()]} ${d.getFullYear()}`, key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` });
  }
  return months;
}

function renderWeeklyChart() {
  const weeks      = getLast6Weeks();
  const ctx        = document.getElementById('chart-weekly').getContext('2d');
  const eatenByW   = {};
  const wastedByW  = {};
  const addedByW   = {};

  eaten.forEach(e => {
    const k = `${new Date(e.eatenAt).getFullYear()}-${isoWeek(e.eatenAt)}`;
    eatenByW[k] = (eatenByW[k] || 0) + 1;
  });
  wasted.forEach(w => {
    const k = `${new Date(w.wastedAt).getFullYear()}-${isoWeek(w.wastedAt)}`;
    wastedByW[k] = (wastedByW[k] || 0) + 1;
  });
  products.forEach(p => {
    const k = `${new Date(p.addedAt).getFullYear()}-${isoWeek(p.addedAt)}`;
    addedByW[k] = (addedByW[k] || 0) + 1;
  });

  const labels   = weeks.map(w => w.label);
  const eatData  = weeks.map(w => eatenByW[`${w.year}-${w.week}`] || 0);
  const wastData = weeks.map(w => wastedByW[`${w.year}-${w.week}`] || 0);
  const addData  = weeks.map(w => addedByW[`${w.year}-${w.week}`] || 0);

  if (chartWeekly) chartWeekly.destroy();
  chartWeekly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Добавлено',  data: addData,  backgroundColor: CHART_COLORS.blue + 'aa' },
        { label: 'Съедено',    data: eatData,  backgroundColor: CHART_COLORS.green + 'aa' },
        { label: 'Выброшено',  data: wastData, backgroundColor: CHART_COLORS.red + 'aa' },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    },
  });
}

function renderCategoryChart() {
  const ctx     = document.getElementById('chart-categories').getContext('2d');
  const counts  = {};
  products.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });

  const entries = CATEGORIES.filter(c => counts[c.value]);
  if (entries.length === 0) {
    if (chartCategories) { chartCategories.destroy(); chartCategories = null; }
    return;
  }

  const palette = [CHART_COLORS.green, CHART_COLORS.blue, CHART_COLORS.orange, CHART_COLORS.red, CHART_COLORS.purple];

  if (chartCategories) chartCategories.destroy();
  chartCategories = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: entries.map(c => `${c.emoji} ${c.label}`),
      datasets: [{
        data: entries.map(c => counts[c.value] || 0),
        backgroundColor: palette,
        borderWidth: 2,
        borderColor: '#fff',
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      cutout: '60%',
    },
  });
}

function renderSavingsChart() {
  const months = getLast6Months();
  const ctx    = document.getElementById('chart-savings').getContext('2d');

  const byMonth = {};
  eaten.forEach(e => {
    const mk = monthKey(e.eatenAt);
    byMonth[mk] = (byMonth[mk] || 0) + (e.price || CATEGORY_PRICE[e.category] || 100);
  });

  let cumulative = 0;
  const data = months.map(m => {
    cumulative += (byMonth[m.key] || 0);
    return cumulative;
  });

  if (chartSavings) chartSavings.destroy();
  chartSavings = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months.map(m => m.label),
      datasets: [{
        label: 'Экономия ₽',
        data,
        borderColor: CHART_COLORS.green,
        backgroundColor: CHART_COLORS.green + '22',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: CHART_COLORS.green,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

function renderAnalytics() {
  renderStats();
  renderWeeklyChart();
  renderCategoryChart();
  renderSavingsChart();
}

/* ─────────────────────────────────────────────
   Render all
───────────────────────────────────────────── */
function render() {
  renderProducts();
  renderShopping();
  renderAnalytics();
}

/* ─────────────────────────────────────────────
   Actions — Products
───────────────────────────────────────────── */
function addProduct() {
  const name       = document.getElementById('add-name').value.trim();
  const category   = document.getElementById('add-category').value;
  const expiryDate = document.getElementById('add-expiry').value;
  const priceRaw   = document.getElementById('add-price').value;
  const price      = priceRaw ? Number(priceRaw) : CATEGORY_PRICE[category] || 100;

  if (!name || !expiryDate) { showToast('Заполни название и срок годности'); return; }

  products.push({ id: uid(), name, category, expiryDate, price, addedAt: new Date().toISOString() });
  save(KEYS.products, products);
  closeModal();
  render();
  showToast(`✓ ${name} добавлен в холодильник`);
}

function markEaten(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  products = products.filter(x => x.id !== id);
  eaten.push({ id: uid(), name: p.name, category: p.category, price: p.price || CATEGORY_PRICE[p.category] || 100, eatenAt: new Date().toISOString() });
  save(KEYS.products, products);
  save(KEYS.eaten, eaten);

  if (!shopping.find(s => s.name.toLowerCase() === p.name.toLowerCase())) {
    shopping.push({ id: uid(), name: p.name, bought: false });
    save(KEYS.shopping, shopping);
  }
  render();
  showToast(`✓ ${p.name} съеден! Добавлен в список покупок`);
}

function deleteProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  products = products.filter(x => x.id !== id);

  // Track as wasted if expired
  if (daysUntil(p.expiryDate) < 0) {
    wasted.push({ id: uid(), name: p.name, category: p.category, price: p.price || CATEGORY_PRICE[p.category] || 100, wastedAt: new Date().toISOString() });
    save(KEYS.wasted, wasted);
    showToast(`Продукт удалён (просрочен — засчитано как потеря)`);
  } else {
    showToast('Продукт удалён');
  }

  save(KEYS.products, products);
  render();
}

/* ─────────────────────────────────────────────
   Actions — Recipe likes (Улучшение 2)
───────────────────────────────────────────── */
function toggleLike(name) {
  recipeLikes[name] = !recipeLikes[name];
  save(KEYS.likes, recipeLikes);
  const container = document.getElementById('recipes-result');
  if (container.querySelector('.recipes-grid')) {
    const btn = [...container.querySelectorAll('.btn-like')].find(b => {
      const card = b.closest('.recipe-card');
      return card && card.querySelector('.recipe-name')?.textContent === name;
    });
    if (btn) {
      btn.textContent = recipeLikes[name] ? '❤️' : '🤍';
      btn.classList.toggle('liked', !!recipeLikes[name]);
    }
  }
  showToast(recipeLikes[name] ? `❤️ ${name} добавлен в избранное` : `${name} убран из избранного`);
}

/* ─────────────────────────────────────────────
   Actions — Diet filter
───────────────────────────────────────────── */
function setDietFilter(val) {
  activeDiet = val;
  document.querySelectorAll('.diet-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.diet === val);
  });
  const container = document.getElementById('recipes-result');
  if (container.innerHTML.trim()) findRecipes();
}

/* ─────────────────────────────────────────────
   Actions — Recipes
───────────────────────────────────────────── */
function addMissing(name) {
  if (shopping.find(s => s.name.toLowerCase() === name.toLowerCase())) {
    showToast(`${name} уже в списке покупок`); return;
  }
  shopping.push({ id: uid(), name, bought: false });
  save(KEYS.shopping, shopping);
  renderShopping();
  showToast(`${name} добавлен в список покупок`);
}

function addAllMissing(names) {
  let added = 0;
  names.forEach(name => {
    if (!shopping.find(s => s.name.toLowerCase() === name.toLowerCase())) {
      shopping.push({ id: uid(), name, bought: false });
      added++;
    }
  });
  if (added > 0) { save(KEYS.shopping, shopping); renderShopping(); }
  showToast(added > 0 ? `Добавлено ${added} позиц. в список покупок` : 'Всё уже в списке');
}

/* ─────────────────────────────────────────────
   Actions — Shopping
───────────────────────────────────────────── */
function addManualShopping() {
  const input = document.getElementById('shopping-input');
  const name  = input.value.trim();
  if (!name) return;
  if (shopping.find(s => s.name.toLowerCase() === name.toLowerCase())) {
    showToast('Уже есть в списке'); return;
  }
  shopping.push({ id: uid(), name, bought: false });
  save(KEYS.shopping, shopping);
  input.value = '';
  renderShopping();
}

function toggleBought(id) {
  shopping = shopping.map(s => s.id === id ? { ...s, bought: !s.bought } : s);
  save(KEYS.shopping, shopping);
  renderShopping();
}

function removeShoppingItem(id) {
  shopping = shopping.filter(s => s.id !== id);
  save(KEYS.shopping, shopping);
  renderShopping();
}

function clearBought() {
  shopping = shopping.filter(s => !s.bought);
  save(KEYS.shopping, shopping);
  renderShopping();
  showToast('Купленные товары удалены');
}

function shareList() {
  if (shopping.length === 0) { showToast('Список пуст'); return; }
  const text = 'Список покупок Chill:\n' + shopping.map(s => `${s.bought ? '☑' : '☐'} ${s.name}`).join('\n');
  navigator.clipboard.writeText(text)
    .then(() => showToast('Список скопирован в буфер обмена 📋'))
    .catch(() => showToast('Не удалось скопировать'));
}

/* ─────────────────────────────────────────────
   Filter
───────────────────────────────────────────── */
function setFilter(val) {
  activeFilter = val;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === val);
  });
  renderProducts();
}

/* ─────────────────────────────────────────────
   Utility
───────────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ─────────────────────────────────────────────
   Init
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Load state
  products    = load(KEYS.products);
  shopping    = load(KEYS.shopping);
  eaten       = load(KEYS.eaten);
  wasted      = load(KEYS.wasted);
  recipeLikes = loadObj(KEYS.likes);
  recipeViews = loadObj(KEYS.views);

  // Seed demo data
  if (products.length === 0) {
    products = createDemoProducts();
    save(KEYS.products, products);
  }

  // Category filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });

  // Diet filter buttons
  document.querySelectorAll('.diet-btn').forEach(btn => {
    btn.addEventListener('click', () => setDietFilter(btn.dataset.diet));
  });

  // Add product form
  document.getElementById('add-form').addEventListener('submit', e => {
    e.preventDefault();
    addProduct();
  });

  // Modal close on overlay click
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target.id === 'modal') closeModal();
  });
  document.getElementById('camera-modal').addEventListener('click', e => {
    if (e.target.id === 'camera-modal') closeCameraModal();
  });

  // Shopping input enter key
  document.getElementById('shopping-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') addManualShopping();
  });

  // Toast close
  document.getElementById('toast-close').addEventListener('click', () => {
    document.getElementById('toast').classList.remove('show');
  });

  // Min date for expiry
  document.getElementById('add-expiry').min = new Date().toISOString().split('T')[0];

  render();
});

// Chill cloud recipes catalog
// Loads recipes from Supabase and shows top-10 recipes for every selected filter.

(function () {
  if (!window.chillSupabase?.client) return;

  const client = window.chillSupabase.client;
  let cloudRecipes = [];

  function mapRecipe(row) {
    return {
      id: row.id,
      name: row.name,
      emoji: row.emoji || '🍽️',
      ingredients: row.ingredients || [],
      keywords: row.keywords || [],
      time: row.time_minutes || 30,
      diet: row.diet || [],
      category: row.category || 'home',
      difficulty: row.difficulty || 'easy',
      source: row.source || 'Chill catalog'
    };
  }

  async function loadCloudRecipes() {
    const { data, error } = await client
      .from('recipes')
      .select('*')
      .eq('is_active', true)
      .order('time_minutes', { ascending: true });

    if (error) {
      console.error(error);
      showToast('Не удалось загрузить рецепты из базы');
      return [];
    }

    cloudRecipes = (data || []).map(mapRecipe);
    return cloudRecipes;
  }

  function getAvailableRecipes() {
    if (cloudRecipes.length > 0) return cloudRecipes;
    if (typeof RECIPES !== 'undefined') return RECIPES;
    return [];
  }

  function recipeMatchesDiet(recipe) {
    const diet = Array.isArray(recipe.diet) ? recipe.diet : [];

    if (activeDiet === 'all') return true;
    if (activeDiet === 'quick') return recipe.time <= 30 || diet.includes('quick');
    if (activeDiet === 'vegetarian') return diet.includes('vegetarian');
    if (activeDiet === 'glutenfree') return diet.includes('glutenfree');

    return true;
  }

  function getProductNames() {
    return Array.isArray(products) ? products.map(p => String(p.name || '').toLowerCase()) : [];
  }

  function getUrgentNames() {
    return Array.isArray(products)
      ? products
          .filter(p => getStatus(p.expiryDate) === 'red')
          .map(p => String(p.name || '').toLowerCase())
      : [];
  }

  function getRecipeScore(recipe, names, urgentNames) {
    const keywords = (recipe.keywords || []).map(kw => String(kw).toLowerCase());

    const matchCount = keywords.filter(kw =>
      names.some(name => name.includes(kw) || kw.includes(name))
    ).length;

    const urgencyBonus = keywords.some(kw =>
      urgentNames.some(name => name.includes(kw) || kw.includes(name))
    ) ? 20 : 0;

    const likeBonus = recipeLikes[recipe.name] ? 10 : 0;
    const viewBonus = Math.min(recipeViews[recipe.name] || 0, 8);
    const matchBonus = matchCount * 6;
    const speedBonus = recipe.time <= 15 ? 4 : recipe.time <= 30 ? 3 : recipe.time <= 45 ? 1 : 0;

    return matchBonus + urgencyBonus + likeBonus + viewBonus + speedBonus;
  }

  function getMissingIngredients(recipe, names) {
    if (names.length === 0) return recipe.ingredients || [];

    return (recipe.ingredients || []).filter(ingredient => {
      const ingredientLower = String(ingredient).toLowerCase();
      const ingredientStem = ingredientLower.slice(0, 5);

      return !names.some(name =>
        name.includes(ingredientLower) ||
        ingredientLower.includes(name) ||
        name.includes(ingredientStem)
      );
    });
  }

  function getTopRecipes(limit = 10) {
    const recipes = getAvailableRecipes().filter(recipeMatchesDiet);
    const names = getProductNames();
    const urgentNames = getUrgentNames();

    return recipes
      .map(recipe => {
        const score = getRecipeScore(recipe, names, urgentNames);
        const missing = getMissingIngredients(recipe, names);
        const isUrgent = (recipe.keywords || []).some(kw =>
          urgentNames.some(name => name.includes(String(kw).toLowerCase()))
        );

        return {
          ...recipe,
          score,
          missing,
          isUrgent
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.time - b.time;
      })
      .slice(0, limit);
  }

  async function renderTopRecipes({ scroll = false, notify = false } = {}) {
    if (cloudRecipes.length === 0) {
      await loadCloudRecipes();
    }

    const recipes = getTopRecipes(10);

    if (recipes.length === 0) {
      document.getElementById('recipes-result').innerHTML =
        '<div class="empty-state">Для этого фильтра пока нет рецептов. Попробуй другой фильтр.</div>';
      return;
    }

    recipes.forEach(recipe => {
      recipeViews[recipe.name] = (recipeViews[recipe.name] || 0) + 1;
    });
    save(KEYS.views, recipeViews);

    renderRecipes(recipes);

    if (notify) {
      const filterName = activeDiet === 'all'
        ? 'всех рецептов'
        : activeDiet === 'vegetarian'
          ? 'вегетарианских рецептов'
          : activeDiet === 'quick'
            ? 'быстрых рецептов'
            : 'рецептов без глютена';

      showToast(`Показали топ-10 ${filterName}`);
    }

    if (scroll) {
      document.getElementById('recipes-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  window.findRecipes = async function () {
    await renderTopRecipes({ scroll: true, notify: true });
  };

  function attachDietHandlers() {
    document.querySelectorAll('.diet-btn').forEach(button => {
      button.addEventListener('click', async () => {
        setTimeout(() => renderTopRecipes({ scroll: false, notify: false }), 0);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await loadCloudRecipes();
    attachDietHandlers();
    await renderTopRecipes({ scroll: false, notify: false });
  });
})();

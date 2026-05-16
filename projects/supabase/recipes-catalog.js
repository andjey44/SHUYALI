// Chill cloud recipes catalog
// Loads recipes from Supabase and replaces the old local-only recipe search.

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

    // Fallback to the old hardcoded catalog if Supabase is temporarily unavailable.
    if (typeof RECIPES !== 'undefined') return RECIPES;

    return [];
  }

  function recipeMatchesDiet(recipe) {
    if (activeDiet === 'all') return true;
    if (activeDiet === 'quick') return recipe.time <= 30 || recipe.diet.includes('quick');
    return recipe.diet.includes(activeDiet);
  }

  function scoreCloudRecipe(recipe, names, urgentNames) {
    if (!recipeMatchesDiet(recipe)) return -1;

    if (names.length === 0) return 1;

    const matchCount = recipe.keywords.filter(kw =>
      names.some(name => name.includes(kw.toLowerCase()))
    ).length;

    if (matchCount === 0) return -1;

    const likeBonus = recipeLikes[recipe.name] ? 8 : 0;
    const urgencyBonus = recipe.keywords.some(kw =>
      urgentNames.some(name => name.includes(kw.toLowerCase()))
    ) ? 12 : 0;
    const speedBonus = recipe.time <= 15 ? 2 : recipe.time <= 30 ? 1 : 0;

    return matchCount * 3 + likeBonus + urgencyBonus + speedBonus;
  }

  window.findRecipes = async function () {
    if (cloudRecipes.length === 0) {
      await loadCloudRecipes();
    }

    const recipes = getAvailableRecipes();

    if (recipes.length === 0) {
      document.getElementById('recipes-result').innerHTML =
        '<div class="empty-state">Рецепты пока не загружены. Попробуйте обновить страницу.</div>';
      return;
    }

    const names = products.map(p => p.name.toLowerCase());
    const urgentNames = products
      .filter(p => getStatus(p.expiryDate) === 'red')
      .map(p => p.name.toLowerCase());

    let matched;

    if (products.length === 0) {
      matched = recipes
        .filter(recipeMatchesDiet)
        .slice(0, 8)
        .map(recipe => ({ ...recipe, score: 1, missing: recipe.ingredients, isUrgent: false }));

      showToast('Показали общий каталог рецептов. Добавьте продукты, чтобы получить подборку.');
    } else {
      matched = recipes
        .map(recipe => {
          const score = scoreCloudRecipe(recipe, names, urgentNames);
          if (score < 0) return null;

          const missing = recipe.ingredients.filter(ingredient => {
            const ingredientLower = ingredient.toLowerCase();
            return !names.some(name =>
              name.includes(ingredientLower) ||
              recipe.keywords.some(kw => ingredientLower.includes(kw.toLowerCase()) && name.includes(kw.toLowerCase()))
            );
          });

          const isUrgent = recipe.keywords.some(kw =>
            urgentNames.some(name => name.includes(kw.toLowerCase()))
          );

          return { ...recipe, score, missing, isUrgent };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
    }

    matched.forEach(recipe => {
      recipeViews[recipe.name] = (recipeViews[recipe.name] || 0) + 1;
    });
    save(KEYS.views, recipeViews);

    renderRecipes(matched);
    document.getElementById('recipes-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  document.addEventListener('DOMContentLoaded', async () => {
    await loadCloudRecipes();

    const container = document.getElementById('recipes-result');
    if (container && !container.innerHTML.trim()) {
      const recipes = getAvailableRecipes().slice(0, 6).map(recipe => ({
        ...recipe,
        missing: recipe.ingredients,
        isUrgent: false,
        score: 1
      }));

      renderRecipes(recipes);
    }
  });
})();

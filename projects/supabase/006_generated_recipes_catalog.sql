-- Generated expanded recipe catalog for Chill
-- Adds 100 extra recipes by combining base product types with common side ingredients.

with base_recipes(base_name, emoji, category, ingredients, keywords, diet, base_time) as (
  values
    ('Куриная сковородка', '🍗', 'main', array['Курица','Лук','Морковь']::text[], array['кур','куриц','лук','морков']::text[], array['glutenfree']::text[], 30),
    ('Мясное рагу', '🥩', 'main', array['Мясо','Лук','Морковь']::text[], array['мяс','лук','морков']::text[], array['glutenfree']::text[], 40),
    ('Фарш на ужин', '🥘', 'main', array['Фарш','Лук','Морковь']::text[], array['фарш','лук','морков']::text[], array['glutenfree']::text[], 30),
    ('Рыбное блюдо', '🐟', 'seafood', array['Рыба','Лимон','Зелень']::text[], array['рыб','лимон','зелень']::text[], array['glutenfree']::text[], 25),
    ('Овощное блюдо', '🥦', 'vegetarian', array['Овощи','Лук','Морковь']::text[], array['овощ','лук','морков']::text[], array['vegetarian','glutenfree']::text[], 25),
    ('Картофельное блюдо', '🥔', 'side', array['Картошка','Масло','Соль']::text[], array['картош','картоф','масл']::text[], array['vegetarian','glutenfree']::text[], 30),
    ('Паста домашняя', '🍝', 'grains', array['Паста','Сыр','Масло']::text[], array['паст','макарон','сыр']::text[], array['vegetarian']::text[], 20),
    ('Рисовое блюдо', '🍚', 'grains', array['Рис','Лук','Морковь']::text[], array['рис','лук','морков']::text[], array['vegetarian','glutenfree']::text[], 25),
    ('Гречневое блюдо', '🥣', 'grains', array['Гречка','Лук','Масло']::text[], array['греч','лук','масл']::text[], array['vegetarian','glutenfree']::text[], 25),
    ('Яичный завтрак', '🍳', 'breakfast', array['Яйца','Молоко','Масло']::text[], array['яйц','молок','масл']::text[], array['vegetarian','glutenfree','quick']::text[], 10),
    ('Творожный завтрак', '🍓', 'breakfast', array['Творог','Йогурт','Мёд']::text[], array['творог','йогурт','мед','мёд']::text[], array['vegetarian','glutenfree','quick']::text[], 10),
    ('Сырная закуска', '🧀', 'snack', array['Сыр','Хлеб','Зелень']::text[], array['сыр','хлеб','зелень']::text[], array['vegetarian','quick']::text[], 10),
    ('Салат быстрый', '🥗', 'salad', array['Огурцы','Помидоры','Зелень']::text[], array['огурц','помидор','томат','зелень']::text[], array['vegetarian','glutenfree','quick']::text[], 10),
    ('Суп домашний', '🍲', 'soup', array['Картошка','Морковь','Лук']::text[], array['картош','морков','лук']::text[], array['vegetarian','glutenfree']::text[], 40),
    ('Запеканка', '🥧', 'bake', array['Яйца','Сыр','Молоко']::text[], array['яйц','сыр','молок']::text[], array['vegetarian']::text[], 40),
    ('Боул', '🍚', 'main', array['Рис','Огурцы','Зелень']::text[], array['рис','огурц','зелень']::text[], array['vegetarian','glutenfree','quick']::text[], 20),
    ('Лаваш ролл', '🌯', 'snack', array['Лаваш','Сыр','Огурцы']::text[], array['лаваш','сыр','огурц']::text[], array['quick']::text[], 15),
    ('Фасолевое блюдо', '🫘', 'main', array['Фасоль','Лук','Помидоры']::text[], array['фасол','лук','помидор']::text[], array['vegetarian','glutenfree']::text[], 30),
    ('Нутовое блюдо', '🧆', 'main', array['Нут','Лук','Помидоры']::text[], array['нут','лук','помидор']::text[], array['vegetarian','glutenfree']::text[], 35),
    ('Фруктовый десерт', '🍎', 'dessert', array['Яблоки','Банан','Йогурт']::text[], array['яблок','банан','йогурт']::text[], array['vegetarian','glutenfree','quick']::text[], 10)
),
add_ons(add_name, ingredient, keyword, extra_time) as (
  values
    ('с грибами', 'Грибы', 'гриб', 10),
    ('с брокколи', 'Брокколи', 'броккол', 8),
    ('с кукурузой', 'Кукуруза', 'кукуруз', 5),
    ('со шпинатом', 'Шпинат', 'шпинат', 5),
    ('с томатами', 'Помидоры', 'помидор', 5)
)
insert into public.recipes (name, emoji, category, ingredients, keywords, diet, time_minutes, difficulty, source)
select
  base_name || ' ' || add_name as name,
  emoji,
  category,
  array_append(ingredients, ingredient),
  array_append(keywords, keyword),
  case when base_time + extra_time <= 30 and not ('quick' = any(diet)) then array_append(diet, 'quick') else diet end,
  base_time + extra_time,
  case when base_time + extra_time <= 30 then 'easy' else 'medium' end,
  'Chill generated recipe combinations'
from base_recipes
cross join add_ons
on conflict (name) do update
set emoji = excluded.emoji,
    category = excluded.category,
    ingredients = excluded.ingredients,
    keywords = excluded.keywords,
    diet = excluded.diet,
    time_minutes = excluded.time_minutes,
    difficulty = excluded.difficulty,
    source = excluded.source,
    is_active = true,
    updated_at = now();

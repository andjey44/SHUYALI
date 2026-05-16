-- Chill recipes catalog
-- Public recipe catalog used by the Recipes tab.

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  emoji text not null default '🍽️',
  category text not null default 'home',
  ingredients text[] not null default '{}',
  keywords text[] not null default '{}',
  diet text[] not null default '{}',
  time_minutes integer not null default 30 check (time_minutes > 0),
  difficulty text not null default 'easy' check (difficulty in ('easy', 'medium', 'hard')),
  source text default 'Chill curated catalog',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recipes enable row level security;

create index if not exists idx_recipes_is_active on public.recipes(is_active);
create index if not exists idx_recipes_time_minutes on public.recipes(time_minutes);
create index if not exists idx_recipes_category on public.recipes(category);

drop policy if exists "Anyone can read active recipes" on public.recipes;

create policy "Anyone can read active recipes"
on public.recipes for select
to anon, authenticated
using (is_active = true);

drop trigger if exists set_recipes_updated_at on public.recipes;
create trigger set_recipes_updated_at
before update on public.recipes
for each row execute function public.set_updated_at();

insert into public.recipes (name, emoji, category, ingredients, keywords, diet, time_minutes, difficulty, source)
values
('Омлет с молоком', '🥚', 'breakfast', array['Яйца','Молоко','Масло','Соль'], array['яйц','молок','масл'], array['vegetarian','glutenfree','quick'], 10, 'easy', 'Curated from common home recipes'),
('Блины на молоке', '🥞', 'breakfast', array['Молоко','Яйца','Мука','Сахар','Масло'], array['молок','яйц','мук','сахар'], array['vegetarian','quick'], 30, 'medium', 'Curated from common home recipes'),
('Сырники', '🧀', 'breakfast', array['Творог','Яйца','Мука','Сахар'], array['творог','яйц','мук','сырник'], array['vegetarian'], 25, 'medium', 'Curated from common home recipes'),
('Овощной салат', '🥗', 'salad', array['Помидоры','Огурцы','Перец','Зелень','Масло'], array['помидор','томат','огурц','перец','зелень'], array['vegetarian','glutenfree','quick'], 10, 'easy', 'Curated from common home recipes'),
('Греческий салат', '🥗', 'salad', array['Помидоры','Огурцы','Сыр','Маслины','Масло'], array['помидор','огурц','сыр','маслин'], array['vegetarian','glutenfree','quick'], 15, 'easy', 'Curated from common home recipes'),
('Паста с томатами', '🍝', 'main', array['Паста','Помидоры','Чеснок','Сыр','Масло'], array['паст','макарон','помидор','томат','чеснок','сыр'], array['vegetarian','quick'], 25, 'easy', 'Inspired by public recipe catalogs'),
('Рис с овощами', '🍚', 'main', array['Рис','Морковь','Лук','Перец','Масло'], array['рис','морков','лук','перец'], array['vegetarian','glutenfree','quick'], 30, 'easy', 'Curated from common home recipes'),
('Куриный суп', '🍲', 'soup', array['Курица','Картошка','Морковь','Лук','Зелень'], array['кур','куриц','картош','морков','лук'], array['glutenfree'], 60, 'medium', 'Curated from common home recipes'),
('Суп-пюре из овощей', '🥣', 'soup', array['Картошка','Морковь','Лук','Сливки'], array['картош','морков','лук','сливк'], array['vegetarian','glutenfree'], 40, 'easy', 'Curated from common home recipes'),
('Жаркое с мясом', '🥩', 'main', array['Мясо','Картошка','Лук','Морковь'], array['мяс','говяд','свинин','картош','лук','морков'], array['glutenfree'], 55, 'medium', 'Curated from common home recipes'),
('Курица с картошкой', '🍗', 'main', array['Курица','Картошка','Лук','Специи'], array['кур','куриц','картош','лук'], array['glutenfree'], 45, 'easy', 'Curated from common home recipes'),
('Тушёная капуста', '🥬', 'main', array['Капуста','Морковь','Лук','Томатная паста'], array['капуст','морков','лук','томат'], array['vegetarian','glutenfree'], 35, 'easy', 'Curated from common home recipes'),
('Картофельное пюре', '🥔', 'side', array['Картошка','Молоко','Масло','Соль'], array['картош','картоф','молок','масл'], array['vegetarian','glutenfree'], 30, 'easy', 'Curated from common home recipes'),
('Тосты с сыром', '🧀', 'snack', array['Хлеб','Сыр','Масло'], array['хлеб','сыр','тост','масл'], array['vegetarian','quick'], 7, 'easy', 'Curated from common home recipes'),
('Фруктовый салат', '🍎', 'dessert', array['Яблоки','Бананы','Апельсины','Йогурт'], array['яблок','банан','апельсин','йогурт','фрукт'], array['vegetarian','glutenfree','quick'], 10, 'easy', 'Curated from common home recipes'),
('Овсяная каша', '🥣', 'breakfast', array['Овсянка','Молоко','Банан','Мёд'], array['овсян','молок','банан','мед','мёд'], array['vegetarian','quick'], 12, 'easy', 'Curated from common home recipes'),
('Гречка с грибами', '🍄', 'main', array['Гречка','Грибы','Лук','Масло'], array['греч','гриб','лук','масл'], array['vegetarian','glutenfree'], 35, 'easy', 'Curated from common home recipes'),
('Яичница с помидорами', '🍳', 'breakfast', array['Яйца','Помидоры','Масло','Зелень'], array['яйц','помидор','томат','масл','зелень'], array['vegetarian','glutenfree','quick'], 10, 'easy', 'Curated from common home recipes'),
('Салат с курицей', '🥗', 'salad', array['Курица','Огурцы','Сыр','Йогурт'], array['кур','куриц','огурц','сыр','йогурт'], array['glutenfree','quick'], 20, 'easy', 'Curated from common home recipes'),
('Паста с курицей', '🍝', 'main', array['Паста','Курица','Сливки','Сыр'], array['паст','макарон','кур','куриц','сливк','сыр'], array['quick'], 30, 'medium', 'Inspired by public recipe catalogs')
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

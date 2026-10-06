-- =====================================================================
-- Proyecto: Sistema de Inventario de Disfraces
-- Archivo : supabase_schema.sql
-- Fase    : 1 - Base de Datos (Semana 1)
-- Uso     : Supabase Dashboard -> SQL Editor -> New query -> pegar -> Run
-- =====================================================================


-- =====================================================================
-- 0. EXTENSIONES
-- =====================================================================
create extension if not exists pgcrypto;   -- gen_random_uuid()

-- NOTA: pg_cron NO se crea aqui. Se habilita en Supabase desde:
--   Dashboard -> Database -> Extensions -> buscar "pg_cron" -> Enable
-- Solo es necesario para las tareas programadas de la Fase 6.
-- create extension if not exists pg_cron;


-- =====================================================================
-- 1. TABLAS
-- =====================================================================

-- 1.1 PROFILES (perfil de usuario del sistema)
create table if not exists public.profiles (
    id         uuid primary key references auth.users (id) on delete cascade,
    email      text,
    full_name  text,
    role       text not null default 'vendedor'
                check (role in ('admin', 'vendedor', 'consulta')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 1.2 CATEGORIES (jerarquia de tematicas)
create table if not exists public.categories (
    id         uuid primary key default gen_random_uuid(),
    name       text not null,
    slug       text unique,
    parent_id  uuid references public.categories (id) on delete set null,
    created_at timestamptz not null default now()
);

-- 1.3 PRODUCTS (cada disfraz)
create table if not exists public.products (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    description text,
    image_url   text,               -- foto principal (URL publica de Storage)
    price       numeric(12, 2),      -- precio de referencia en soles
    category_id uuid references public.categories (id) on delete set null,
    active      boolean not null default true,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- Salvaguarda por si la tabla ya existia sin la columna price
alter table public.products add column if not exists price numeric(12, 2);

-- 1.4 VARIANTS (talla + genero + tela + stock)
create table if not exists public.variants (
    id             uuid primary key default gen_random_uuid(),
    product_id     uuid not null references public.products (id) on delete cascade,
    size           text,                       -- S, M, L, XL, 4, 6, 8...
    gender         text
                    check (gender in ('niño', 'niña', 'hombre', 'mujer', 'unisex')),
    fabric_quality text,                       -- economica, estandar, premium
    sku            text unique,
    stock_quantity integer not null default 0 check (stock_quantity >= 0),
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

-- 1.5 PRODUCT_IMAGES (fotos adicionales)
create table if not exists public.product_images (
    id         uuid primary key default gen_random_uuid(),
    product_id uuid not null references public.products (id) on delete cascade,
    image_url  text not null,
    is_primary boolean not null default false,
    position   integer not null default 0,
    created_at timestamptz not null default now()
);

-- 1.6 TAGS (etiquetas flexibles)
create table if not exists public.tags (
    id         uuid primary key default gen_random_uuid(),
    name       text not null unique,
    created_at timestamptz not null default now()
);

-- 1.7 PRODUCT_TAGS (N:M producto <-> tag)
create table if not exists public.product_tags (
    product_id uuid not null references public.products (id) on delete cascade,
    tag_id     uuid not null references public.tags (id) on delete cascade,
    primary key (product_id, tag_id)
);

-- 1.8 SALES (ventas)
create table if not exists public.sales (
    id           uuid primary key default gen_random_uuid(),
    sale_date    date not null default current_date,
    total_amount numeric(12, 2) not null default 0,
    customer     text,
    user_id      uuid references public.profiles (id) on delete set null,
    created_at   timestamptz not null default now()
);

-- 1.9 SALE_ITEMS (detalle de venta)
create table if not exists public.sale_items (
    id         uuid primary key default gen_random_uuid(),
    sale_id    uuid not null references public.sales (id) on delete cascade,
    variant_id uuid not null references public.variants (id) on delete restrict,
    quantity   integer not null check (quantity > 0),
    unit_price numeric(12, 2) not null default 0,
    created_at timestamptz not null default now()
);


-- =====================================================================
-- 2. INDICES
-- =====================================================================
create index if not exists idx_products_category   on public.products (category_id);
create index if not exists idx_variants_product    on public.variants (product_id);
create index if not exists idx_variants_size       on public.variants (size);
create index if not exists idx_variants_gender     on public.variants (gender);
create index if not exists idx_images_product      on public.product_images (product_id);
create index if not exists idx_sales_user          on public.sales (user_id);
create index if not exists idx_sales_date          on public.sales (sale_date);
create index if not exists idx_sale_items_sale     on public.sale_items (sale_id);
create index if not exists idx_sale_items_variant  on public.sale_items (variant_id);


-- =====================================================================
-- 3. FUNCIONES Y TRIGGERS
-- =====================================================================

-- 3.1 updated_at automatico
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
    before update on public.profiles
    for each row execute function public.set_updated_at();

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated
    before update on public.products
    for each row execute function public.set_updated_at();

drop trigger if exists trg_variants_updated on public.variants;
create trigger trg_variants_updated
    before update on public.variants
    for each row execute function public.set_updated_at();

-- 3.2 Crear perfil automaticamente al registrar usuario en Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email, full_name, role)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data ->> 'full_name', ''),
        'vendedor'
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- 3.3 Restar stock al insertar en sale_items
--     Usa FOR UPDATE para evitar condiciones de carrera y valida stock.
create or replace function public.restar_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_stock integer;
begin
    select stock_quantity
      into v_stock
      from public.variants
     where id = new.variant_id
       for update;

    if not found then
        raise exception 'La variante % no existe', new.variant_id;
    end if;

    if v_stock < new.quantity then
        raise exception 'Stock insuficiente para la variante %: disponible %, solicitado %',
            new.variant_id, v_stock, new.quantity;
    end if;

    update public.variants
       set stock_quantity = stock_quantity - new.quantity,
           updated_at     = now()
     where id = new.variant_id;

    return new;
end;
$$;

drop trigger if exists trg_restar_stock on public.sale_items;
create trigger trg_restar_stock
    after insert on public.sale_items
    for each row execute function public.restar_stock();

-- 3.4 Devolver stock al eliminar un sale_item (revierte la operacion)
create or replace function public.devolver_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.variants
       set stock_quantity = stock_quantity + old.quantity,
           updated_at     = now()
     where id = old.variant_id;

    return old;
end;
$$;

drop trigger if exists trg_devolver_stock on public.sale_items;
create trigger trg_devolver_stock
    after delete on public.sale_items
    for each row execute function public.devolver_stock();

-- 3.5 Recalcular total de la venta al cambiar sus items
create or replace function public.recalcular_total_venta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_sale_id uuid := coalesce(new.sale_id, old.sale_id);
begin
    update public.sales
       set total_amount = coalesce(
            (select sum(quantity * unit_price)
               from public.sale_items
              where sale_id = v_sale_id), 0)
     where id = v_sale_id;

    return null;
end;
$$;

drop trigger if exists trg_recalcular_total on public.sale_items;
create trigger trg_recalcular_total
    after insert or update or delete on public.sale_items
    for each row execute function public.recalcular_total_venta();


-- 3.6 Helper de rol admin (SECURITY DEFINER evita recursion en RLS)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
    select exists (
        select 1 from public.profiles
         where id = auth.uid() and role = 'admin'
    );
$$;


-- =====================================================================
-- 4. ROW LEVEL SECURITY (RLS)
--    Lectura publica, escritura autenticada.
-- =====================================================================
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.variants       enable row level security;
alter table public.product_images enable row level security;
alter table public.tags           enable row level security;
alter table public.product_tags   enable row level security;
alter table public.sales          enable row level security;
alter table public.sale_items     enable row level security;

-- 4.1 Catalogos: lectura publica (anon + authenticated)
drop policy if exists "lectura publica categories" on public.categories;
create policy "lectura publica categories"
    on public.categories for select to anon, authenticated using (true);

drop policy if exists "lectura publica products" on public.products;
create policy "lectura publica products"
    on public.products for select to anon, authenticated using (true);

drop policy if exists "lectura publica variants" on public.variants;
create policy "lectura publica variants"
    on public.variants for select to anon, authenticated using (true);

drop policy if exists "lectura publica product_images" on public.product_images;
create policy "lectura publica product_images"
    on public.product_images for select to anon, authenticated using (true);

drop policy if exists "lectura publica tags" on public.tags;
create policy "lectura publica tags"
    on public.tags for select to anon, authenticated using (true);

drop policy if exists "lectura publica product_tags" on public.product_tags;
create policy "lectura publica product_tags"
    on public.product_tags for select to anon, authenticated using (true);

-- 4.2 Catalogos: escritura solo autenticados
drop policy if exists "escritura auth categories" on public.categories;
create policy "escritura auth categories"
    on public.categories for all to authenticated using (true) with check (true);

drop policy if exists "escritura auth products" on public.products;
create policy "escritura auth products"
    on public.products for all to authenticated using (true) with check (true);

drop policy if exists "escritura auth variants" on public.variants;
create policy "escritura auth variants"
    on public.variants for all to authenticated using (true) with check (true);

drop policy if exists "escritura auth product_images" on public.product_images;
create policy "escritura auth product_images"
    on public.product_images for all to authenticated using (true) with check (true);

drop policy if exists "escritura auth tags" on public.tags;
create policy "escritura auth tags"
    on public.tags for all to authenticated using (true) with check (true);

drop policy if exists "escritura auth product_tags" on public.product_tags;
create policy "escritura auth product_tags"
    on public.product_tags for all to authenticated using (true) with check (true);

-- 4.3 Profiles: cada usuario ve y edita su propio perfil; los admin ven todo
drop policy if exists "perfil propio select" on public.profiles;
create policy "perfil propio select"
    on public.profiles for select to authenticated
    using (id = auth.uid() or public.is_admin());

drop policy if exists "perfil propio update" on public.profiles;
create policy "perfil propio update"
    on public.profiles for update to authenticated
    using (id = auth.uid())
    with check (id = auth.uid());

-- 4.4 Ventas: solo usuarios autenticados
drop policy if exists "ventas auth select" on public.sales;
create policy "ventas auth select"
    on public.sales for select to authenticated using (true);

drop policy if exists "ventas auth insert" on public.sales;
create policy "ventas auth insert"
    on public.sales for insert to authenticated with check (true);

drop policy if exists "ventas auth update" on public.sales;
create policy "ventas auth update"
    on public.sales for update to authenticated using (true) with check (true);

drop policy if exists "ventas auth delete" on public.sales;
create policy "ventas auth delete"
    on public.sales for delete to authenticated using (true);

drop policy if exists "items auth select" on public.sale_items;
create policy "items auth select"
    on public.sale_items for select to authenticated using (true);

drop policy if exists "items auth insert" on public.sale_items;
create policy "items auth insert"
    on public.sale_items for insert to authenticated with check (true);

drop policy if exists "items auth update" on public.sale_items;
create policy "items auth update"
    on public.sale_items for update to authenticated using (true) with check (true);

drop policy if exists "items auth delete" on public.sale_items;
create policy "items auth delete"
    on public.sale_items for delete to authenticated using (true);


-- =====================================================================
-- 5. REALTIME
-- =====================================================================
do $$
begin
    if not exists (select 1 from pg_publication_tables
                    where pubname = 'supabase_realtime'
                      and schemaname = 'public' and tablename = 'variants') then
        alter publication supabase_realtime add table public.variants;
    end if;
    if not exists (select 1 from pg_publication_tables
                    where pubname = 'supabase_realtime'
                      and schemaname = 'public' and tablename = 'products') then
        alter publication supabase_realtime add table public.products;
    end if;
    if not exists (select 1 from pg_publication_tables
                    where pubname = 'supabase_realtime'
                      and schemaname = 'public' and tablename = 'sales') then
        alter publication supabase_realtime add table public.sales;
    end if;
end $$;

-- Replicar el valor completo (UPDATE) en los eventos
alter table public.variants replica identity full;
alter table public.products replica identity full;


-- =====================================================================
-- 6. STORAGE (bucket publico de fotos)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('disfraces', 'disfraces', true)
on conflict (id) do update set public = true;

drop policy if exists "disfraces lectura publica" on storage.objects;
create policy "disfraces lectura publica"
    on storage.objects for select to anon, authenticated
    using (bucket_id = 'disfraces');

drop policy if exists "disfraces escritura auth" on storage.objects;
create policy "disfraces escritura auth"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'disfraces');

drop policy if exists "disfraces update auth" on storage.objects;
create policy "disfraces update auth"
    on storage.objects for update to authenticated
    using (bucket_id = 'disfraces') with check (bucket_id = 'disfraces');

drop policy if exists "disfraces delete auth" on storage.objects;
create policy "disfraces delete auth"
    on storage.objects for delete to authenticated
    using (bucket_id = 'disfraces');


-- =====================================================================
-- 7. DATOS SEMILLA (categorias base del proyecto)
-- =====================================================================
insert into public.categories (name, slug) values
    ('Superheroes', 'superheroes'),
    ('Profesiones', 'profesiones'),
    ('Series',      'series'),
    ('Peliculas',   'peliculas'),
    ('Halloween',   'halloween')
on conflict (slug) do nothing;


-- =====================================================================
-- 8. VERIFICACION RAPIDA
-- =====================================================================
-- select table_name from information_schema.tables
--   where table_schema = 'public' order by table_name;
-- select id, name, public from storage.buckets;
-- select schemaname, tablename, rowsecurity from pg_tables
--   where schemaname = 'public' order by tablename;
-- =====================================================================
-- FIN
-- =====================================================================

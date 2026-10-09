-- =====================================================================
-- Proyecto: Sistema de Inventario de Disfraces
-- Migration: stock_movements (historial de entradas/salidas de stock)
-- Uso: Supabase Dashboard -> SQL Editor -> New query -> pegar -> Run
-- =====================================================================


-- =====================================================================
-- 1. TABLA
-- =====================================================================
-- cantidad_movimiento es con signo: positivo = ingresa, negativo = sale.
create table if not exists public.stock_movements (
    id                  uuid primary key default gen_random_uuid(),
    variant_id          uuid not null references public.variants (id) on delete cascade,
    tipo_movimiento     text not null
                        check (tipo_movimiento in ('Entrada', 'Salida', 'Venta', 'Devolucion', 'Ajuste')),
    cantidad_movimiento integer not null,
    fecha_movimiento    timestamptz not null default now(),
    referencia          text,                 -- sale id, motivo, etc.
    user_id             uuid references public.profiles (id) on delete set null,
    created_at          timestamptz not null default now()
);


-- =====================================================================
-- 2. INDICES
-- =====================================================================
create index if not exists idx_movements_variant on public.stock_movements (variant_id);
create index if not exists idx_movements_fecha   on public.stock_movements (fecha_movimiento desc);


-- =====================================================================
-- 3. TRIGGERS: registrar automaticamente los movimientos de venta
-- =====================================================================
-- 3.1 Venta: al insertar un sale_item se descuenta stock (restar_stock).
--     Aqui se registra el movimiento con cantidad negativa.
create or replace function public.registrar_movimiento_venta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.stock_movements
        (variant_id, tipo_movimiento, cantidad_movimiento, referencia)
    values
        (new.variant_id, 'Venta', -new.quantity, 'sale:' || new.sale_id::text);
    return new;
end;
$$;

drop trigger if exists trg_movimiento_venta on public.sale_items;
create trigger trg_movimiento_venta
    after insert on public.sale_items
    for each row execute function public.registrar_movimiento_venta();

-- 3.2 Devolucion: al eliminar un sale_item se devuelve stock (devolver_stock).
create or replace function public.registrar_movimiento_devolucion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.stock_movements
        (variant_id, tipo_movimiento, cantidad_movimiento, referencia)
    values
        (old.variant_id, 'Devolucion', old.quantity, 'sale:' || old.sale_id::text);
    return old;
end;
$$;

drop trigger if exists trg_movimiento_devolucion on public.sale_items;
create trigger trg_movimiento_devolucion
    after delete on public.sale_items
    for each row execute function public.registrar_movimiento_devolucion();


-- =====================================================================
-- 4. ROW LEVEL SECURITY
--    Lectura publica, escritura autenticada (igual que variants).
-- =====================================================================
alter table public.stock_movements enable row level security;

drop policy if exists "lectura publica stock_movements" on public.stock_movements;
create policy "lectura publica stock_movements"
    on public.stock_movements for select to anon, authenticated using (true);

drop policy if exists "escritura auth stock_movements" on public.stock_movements;
create policy "escritura auth stock_movements"
    on public.stock_movements for all to authenticated using (true) with check (true);


-- =====================================================================
-- FIN
-- =====================================================================

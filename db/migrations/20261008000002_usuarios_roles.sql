-- =====================================================================
-- Proyecto: Sistema de Inventario de Disfraces
-- Migration: usuarios y roles (modulo de gestion de usuarios)
-- Uso: Supabase Dashboard -> SQL Editor -> New query -> pegar -> Run
-- =====================================================================


-- =====================================================================
-- 1. TABLAS
-- =====================================================================

-- 1.1 ROL (roles y permisos por menu)
create table if not exists public.rol (
    id          uuid primary key default gen_random_uuid(),
    nombre      text not null unique,
    descripcion text,
    permisos    jsonb not null default '{}'::jsonb,   -- { catalogo, ventas, reportes, usuarios }
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- 1.2 USUARIO (usuarios del sistema; contrasena en hash bcrypt)
create table if not exists public.usuario (
    usuario_id          uuid primary key default gen_random_uuid(),
    nombre              text not null,
    rol                 text not null references public.rol (nombre) on update cascade,
    estado              integer not null default 1 check (estado in (0, 1)),  -- 1 activo, 0 inactivo
    contrasena          text,                       -- hash bcrypt
    fecha_creacion      timestamptz not null default now(),
    fecha_actualizacion timestamptz not null default now(),
    fecha_eliminacion   timestamptz
);


-- =====================================================================
-- 2. INDICES
-- =====================================================================
create index if not exists idx_usuario_rol    on public.usuario (rol);
create index if not exists idx_usuario_estado on public.usuario (estado);
create index if not exists idx_usuario_elim   on public.usuario (fecha_eliminacion);


-- =====================================================================
-- 3. TRIGGERS updated_at
-- =====================================================================
drop trigger if exists trg_rol_updated on public.rol;
create trigger trg_rol_updated
    before update on public.rol
    for each row execute function public.set_updated_at();

create or replace function public.set_fecha_actualizacion()
returns trigger
language plpgsql
as $$
begin
    new.fecha_actualizacion = now();
    return new;
end;
$$;

drop trigger if exists trg_usuario_actualizado on public.usuario;
create trigger trg_usuario_actualizado
    before update on public.usuario
    for each row execute function public.set_fecha_actualizacion();


-- =====================================================================
-- 4. ROW LEVEL SECURITY (modulo interno: solo autenticados)
-- =====================================================================
alter table public.rol     enable row level security;
alter table public.usuario enable row level security;

drop policy if exists "rol auth" on public.rol;
create policy "rol auth"
    on public.rol for all to authenticated using (true) with check (true);

drop policy if exists "usuario auth" on public.usuario;
create policy "usuario auth"
    on public.usuario for all to authenticated using (true) with check (true);


-- =====================================================================
-- 5. DATOS SEMILLA (roles base)
-- =====================================================================
insert into public.rol (nombre, descripcion, permisos) values
    ('admin',      'Acceso total al sistema',
        '{"catalogo":true,"ventas":true,"reportes":true,"usuarios":true}'::jsonb),
    ('supervisor', 'Gestiona catalogo, ventas y reportes',
        '{"catalogo":true,"ventas":true,"reportes":true,"usuarios":false}'::jsonb),
    ('vendedor',   'Registra ventas y consulta el catalogo',
        '{"catalogo":true,"ventas":true,"reportes":false,"usuarios":false}'::jsonb)
on conflict (nombre) do nothing;


-- =====================================================================
-- FIN
-- =====================================================================

-- =====================================================================
-- Proyecto: Sistema de Inventario de Disfraces
-- Migration: unificar usuarios en Supabase Auth + profiles
--   - profiles pasa a ser la fuente unica de perfil/rol/estado
--   - roles admin / supervisor / vendedor
-- Uso: Supabase Dashboard -> SQL Editor -> New query -> pegar -> Run
-- =====================================================================


-- =====================================================================
-- 1. COLUMNAS NUEVAS EN profiles
-- =====================================================================
alter table public.profiles add column if not exists estado integer not null default 1
    check (estado in (0, 1));                    -- 1 activo, 0 inactivo
alter table public.profiles add column if not exists fecha_eliminacion timestamptz;


-- =====================================================================
-- 2. AMPLIAR EL CHECK DE role (agrega supervisor)
-- =====================================================================
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
    check (role in ('admin', 'supervisor', 'vendedor'));


-- =====================================================================
-- 3. RELACION CON LA TABLA rol (integridad referencial)
-- =====================================================================
alter table public.profiles drop constraint if exists profiles_role_fkey;
alter table public.profiles add constraint profiles_role_fkey
    foreign key (role) references public.rol (nombre) on update cascade on delete restrict;


-- =====================================================================
-- 4. ASIGNACION DE ROLES / NOMBRES POR CORREO
-- =====================================================================
update public.profiles
   set role = 'admin', full_name = 'yesin.camarena', estado = 1, fecha_eliminacion = null
 where email = 'yesin.camarena@gmail.com';

update public.profiles
   set role = 'supervisor', full_name = 'boris.camarena', estado = 1, fecha_eliminacion = null
 where email = 'corp.dayamo@gmail.com';

update public.profiles
   set role = 'vendedor', full_name = 'rosa.elvira', estado = 1, fecha_eliminacion = null
 where email = 'elvira.comr@gmail.com';

-- correo extra: se desactiva
update public.profiles
   set estado = 0, fecha_eliminacion = now()
 where email = 'disfraces.rosaelvira@gmail.com';


-- =====================================================================
-- 5. NUEVOS REGISTROS: guardar nombre y estado por defecto
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email, full_name, role, estado)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data ->> 'full_name', ''),
        'vendedor',
        1
    )
    on conflict (id) do nothing;
    return new;
end;
$$;


-- =====================================================================
-- 6. VERIFICACION RAPIDA
-- =====================================================================
-- select email, full_name, role, estado from public.profiles order by role;


-- =====================================================================
-- FIN
-- =====================================================================

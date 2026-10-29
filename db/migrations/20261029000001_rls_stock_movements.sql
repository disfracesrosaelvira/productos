-- Seguridad: el kardex (stock_movements) no debe ser legible con la anon key,
-- que va en el navegador. El backend consulta con la service_role (bypassa RLS),
-- asi que basta con permitir SELECT solo a usuarios autenticados.
--
-- Ejecutar en Supabase -> SQL Editor.

alter table public.stock_movements enable row level security;

-- Elimina cualquier politica de lectura (o ALL) que hoy permita leer a anon.
do $$
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'stock_movements'
      and cmd in ('SELECT', 'ALL')
  loop
    execute format('drop policy %I on public.stock_movements', p.policyname);
  end loop;
end $$;

create policy "movimientos_lectura_autenticada"
  on public.stock_movements
  for select
  to authenticated
  using (true);

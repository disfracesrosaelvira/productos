-- =====================================================================
-- Proyecto: Sistema de Inventario de Disfraces
-- Migration: precio por variante (talla)
--   Permite un precio distinto por talla. Si es NULL, se usa el precio
--   de referencia del producto.
-- Uso: Supabase Dashboard -> SQL Editor -> New query -> pegar -> Run
-- =====================================================================

alter table public.variants add column if not exists price numeric(12, 2);

-- =====================================================================
-- FIN
-- =====================================================================

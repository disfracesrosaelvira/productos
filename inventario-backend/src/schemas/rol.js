import { z } from 'zod';

export const MENUS = ['catalogo', 'ventas', 'reportes', 'usuarios'];

export const crearRol = z.object({
  nombre: z.string().trim().min(2).max(50),
  descripcion: z.string().trim().max(255).nullish(),
  permisos: z.record(z.boolean()).default({}),
});

export const actualizarRol = crearRol.partial().refine(
  (v) => Object.keys(v).length > 0,
  'Debe enviar al menos un campo',
);

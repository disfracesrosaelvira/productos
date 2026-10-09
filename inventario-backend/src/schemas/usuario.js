import { z } from 'zod';

export const crearUsuario = z.object({
  email: z.string().trim().email().max(200),
  nombre: z.string().trim().min(2).max(120),
  rol: z.string().trim().min(2).max(50),
  estado: z.number().int().min(0).max(1).default(1),
  contrasena: z.string().min(6).max(100),
});

export const actualizarUsuario = z
  .object({
    email: z.string().trim().email().max(200).optional(),
    nombre: z.string().trim().min(2).max(120).optional(),
    rol: z.string().trim().min(2).max(50).optional(),
    estado: z.number().int().min(0).max(1).optional(),
    contrasena: z.string().min(6).max(100).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Debe enviar al menos un campo');

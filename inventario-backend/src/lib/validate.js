import { AppError } from './errors.js';

/**
 * Valida `data` contra un schema de zod.
 * Lanza AppError(400) con los detalles si falla.
 */
export function validate(schema, data) {
  const resultado = schema.safeParse(data);
  if (!resultado.success) {
    throw new AppError('Datos invalidos', 400, resultado.error.flatten());
  }
  return resultado.data;
}

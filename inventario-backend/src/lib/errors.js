export class AppError extends Error {
  constructor(message, statusCode = 400, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const noEncontrado = (recurso = 'Recurso') =>
  new AppError(`${recurso} no encontrado`, 404);

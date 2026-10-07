import Model from '../db/index';

export class IncidenciaMueblesService {
  incidenciaMueblesInput = Model.collection('incidencia_muebles_input');

  constructor() {}

  public async saveIncidenciaMueblesInput(data: any) {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('Datos inválidos para guardar');
      }
    
      data.forEach((item: any) => {
        if (typeof item.created_at === 'string') {
          item.created_at = new Date(item.created_at);
        }
      });
      
      // Mostrar los campos y los datos que se están guardando en la consola
    
      const result = await this.incidenciaMueblesInput.insertMany(data);
      return { success: true, message: 'Operación con éxito' };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al guardar los datos de incidencia Muebles:', error.message);
      } else {
        console.error('Error al guardar los datos de incidencia Muebles:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }
}
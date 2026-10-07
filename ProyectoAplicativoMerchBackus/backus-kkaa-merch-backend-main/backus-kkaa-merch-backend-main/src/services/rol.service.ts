import Model from '../db/index';
import { RolModel } from '../models/rol.model';

export class RolService {

  constructor() { }

  public async getRoles(filterTable: string | undefined) {
    try {
      let query = {};
      if (filterTable) {
        const filters = JSON.parse(filterTable);
        filters.forEach((filter: { key: string, values: string[] }) => {
          query[filter.key] = { $in: filter.values };
        });
      }

      const result = await RolModel.find(query);
      return result ;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al listar los roles:', error.message);
      } else {
        console.error('Error al listar los roles:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }

  public async getRolesFilters() {
    try {
      const nombre = await RolModel.distinct('nombre');

      return { 
        nombre,
       };
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  public async insertRol(rol: any) {
    try {
      const newRol = new RolModel(rol);
      const result = await newRol.save();
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al insertar el rol:', error.message);
      } else {
        console.error('Error al insertar el rol:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }
  
  public async updateRol(id: string, rol: any) {
    try {
      const result = await RolModel.findByIdAndUpdate(id, rol, { new: true });
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al actualizar el rol:', error.message);
      } else {
        console.error('Error al actualizar el rol:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }
  
  public async deleteRol(id: string) {
    try {
      const result = await RolModel.deleteOne({ _id: id });
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al eliminar el rol:', error.message);
      } else {
        console.error('Error al eliminar el rol:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }
}
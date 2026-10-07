import { EstructuraComercial, EstructuraComercialModel } from '../models/estructuraComercial.model';
import Model from '../db/index';
export class EstructuraComercialService {
  estructura_comercial = Model.collection('estructura_comercial');
  constructor() {}

  public async saveEstructuraComercial(data: EstructuraComercial) {
    try {
      data.fecha_creacion = new Date(new Date().toUTCString());
      delete data['_id'];
      const result = await this.estructura_comercial.insertOne(data);
      return { success: true, result };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al guardar los datos de saveEstructuraComercial:', error.message);
      } else {
        console.error('Error al guardar los datos de saveEstructuraComercial:', String(error));
      }
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  public async getEstructuraComercial(pageIndex: number, pageSize: number, filterTable: string | undefined) {
    try {
      let query = {}

      if (filterTable) {
        const filters = JSON.parse(filterTable);
        filters.forEach((filter: { key: string, values: string[] }) => {
          query[filter.key] = { $in: filter.values };
        });
      }

      const options = {
        page: pageIndex || 1,
        limit: pageSize || 10,
        sort: { fecha_creacion: -1 },
        lean: true, // Obtener documentos como JSON puro
        leanWithId: false // Asegurarse de que `leanWithId` no añada `_id` a `id`  
      };

      const data = await EstructuraComercialModel.paginate(query, options);
      return { ...data };
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  public async getEstructuraComercialFilters() {
    try {
      // const poc = await EstructuraComercialModel.distinct('poc');
      // const poc_nombre = await EstructuraComercialModel.distinct('poc_nombre');
      const nombre_sv = await EstructuraComercialModel.distinct('nombre_sv');
      const nombre_bdr = await EstructuraComercialModel.distinct('nombre_bdr');
      const documento_sv = await EstructuraComercialModel.distinct('documento_sv');
      const poc_tipo = await EstructuraComercialModel.distinct('poc_tipo');
      const usuario_id_creacion = await EstructuraComercialModel.distinct('usuario_id_creacion');
      // const poc = await this.estructura_comercial.distinct('poc');
      // const poc_nombre = await this.estructura_comercial.distinct('poc_nombre');
      // const poc_tipo = await this.estructura_comercial.distinct('poc_tipo');
      // const usuario_id_creacion = await this.estructura_comercial.distinct('usuario_id_creacion');

      return { 
        nombre_sv,
        nombre_bdr,
        documento_sv,
        poc_tipo,
        usuario_id_creacion,
       };
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  public async getEstructuraComercialById(id: string): Promise<EstructuraComercial | null> {
    try {   
      const estructuraComercial = await EstructuraComercialModel.findById(id).exec();
      return estructuraComercial;
    } catch (error) {
      console.error('Error al obtener la estructura comercial por ID:', error);
      return null;
    }
  }

  public async updateEstructuraComercial(id: string, data: EstructuraComercial) {
    try {
      const result = await EstructuraComercialModel.findByIdAndUpdate(
        id,
        {
          ...data,
          fecha_actualizacion: new Date(new Date().toUTCString()),
        },
        { new: true } // Para devolver el documento actualizado
      );

      if (!result) {
        throw new Error('Estructura comercial no encontrada');
      }
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al actualizar el usuario:', error.message);
      } else {
        console.error('Error al actualizar el usuario:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }

  //buscar los document_sv por el id de la estructura comercial
  public async getEstructuraComercialByDocumentoSv(documento_sv: string) {
    try {
      const result = await this.estructura_comercial.find({ documento_sv: documento_sv }).toArray();
      return result;
    } catch (error) {
      console.error('Error al obtener los documentos de SV por ID de la estructura comercial:', error);
      return null;
    }
  }

  //buscar los document_sv por el id de la estructura comercial
  public async getEstructuraComercialByDocumentoBdr(documento_bdr: string) {
    try {
      const result = await this.estructura_comercial.find({ documento_bdr: documento_bdr }).toArray();
      return result;
    } catch (error) {
      console.error('Error al obtener los documentos de SV por ID de la estructura comercial:', error);
      return null;
    }
  }

}

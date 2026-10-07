import Model from '../db/index';
import { ADLS_SAS_TOKEN_USER } from '../config';
import { Sku, SkuModel } from '../models/sku.model';
import { subHours } from 'date-fns';
import { ExhibicionAdicionalModel } from '../models/exhibicionAdicional.model';
import { ExhibicionCompetenciaModel } from '../models/exhibicionCompetencia.model';
import { PrecioModel } from '../models/precio.model';
import { StockModel } from '../models/stock.model';

export class SkuService {
  sku = Model.collection('sku');
  productos = Model.collection('sku');
  precioInput = Model.collection('precio');

  constructor() {}

  public async getMarca(response: any) {
    const { empresa_id } = response;
    try {
      const marcasUnicas = await this.sku.distinct('marca', {empresa_id: empresa_id, competencia: 0, estado: 1});
      return { listMarcas: marcasUnicas};
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener los getMarca:', error.message);
      } else {
        console.error('Error al obtener los getMarca:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  } 

  public async getMarcaCompetencia(response: any) {
    const { empresa_id } = response;
    try {
      const marcas = await this.sku.distinct('marca', { empresa_id: empresa_id, competencia:1, estado:1 });
      return { listMarcas: marcas};
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener los getMarcaCompetencia:', error.message);
      } else {
        console.error('Error al obtener los getMarcaCompetencia:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  } 

  public async getProductosCompetencia(response: any) {
    const { empresa_id } = response;
    // const marca = ['Amstel', 'Heineken', 'Tres Cruces', 'Pum Pum']
    try {
      // const productos = await this.sku.find({ empresa_id: empresa_id, marca: { $in: marca } }).project({ descripcion: 1, empresa_id: 1, sku: 1, marca: 1, imagen:1 }).toArray();
      // const productos = await this.sku.distinct('descripcion', { empresa_id: empresa_id, competencia:1, estado:1 });
      const productos = await this.sku.aggregate([
        {
          $match: { empresa_id: empresa_id, competencia: 1, estado: 1 }
        },
        {
          $group: {
            _id: { descripcion: "$descripcion", imagen: "$imagen", sku: "$sku" },
            descripcion: { $first: "$descripcion" },
            imagen: { $first: "$imagen" },
            sku: { $first: "$sku" },
            marca: { $first: "$marca" }
          }
        },
        {
          $project: {
            _id: 0,
            descripcion: 1,
            imagen: 1,
            sku: 1,
            marca: 1
          }
        }
      ]).toArray();
      return { listProductos: productos.map((producto: any) => ({...producto, imagen: `${producto.imagen}?${ADLS_SAS_TOKEN_USER}`}))};
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener los getMarcaCompetencia:', error.message);
      } else {
        console.error('Error al obtener los getMarcaCompetencia:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }

  public async saveSku(data: Sku) {
    try {
      const existingSku = await this.sku.findOne({ sku: data.sku });
      if (existingSku) {
        return { success: false, error: 'El SKU ya existe en la base de datos' };
      }
      data.fecha_creacion = new Date(new Date().toUTCString());
      delete data['_id'];
      delete data['fecha_actualizacion'];
      delete data['usuario_id_actualizacion'];
      const pocSKUIDMayor = await this.sku.findOne({}, { sort: { sku: -1 } });
      data.sku = pocSKUIDMayor?.sku + 1;
      const result = await this.sku.insertOne(data);
      return { success: true, result };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al guardar los datos de saveSKU:', error.message);
      } else {
        console.error('Error al guardar los datos de saveSKU:', String(error));
      }
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  public async getSkus(pageIndex: number, pageSize: number, filterTable: string | undefined) {
    try {
      let query = {};
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
        lean: true,
        leanWithId: true
      };
  
      const data = await SkuModel.paginate(query, options);
      data.docs = data?.docs?.map((sku: any) => (
        { 
          ...sku,
          fecha_creacion: subHours(sku.fecha_creacion, 5),
          fecha_actualizacion: sku.fecha_actualizacion ? subHours(sku.fecha_actualizacion, 5) : null, 
          imagen: `${sku.imagen}?${ADLS_SAS_TOKEN_USER}`
        }
      ));
      return { ...data };
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  public async getSkusFilters() {
    try {
      const sku = await SkuModel.distinct('sku');
      const descripcion = await SkuModel.distinct('descripcion');
      const categoria = await SkuModel.distinct('categoria');
      const linea = await SkuModel.distinct('linea');
      const marca = await SkuModel.distinct('marca');
      const empresa_id = await SkuModel.distinct('empresa_id');
      const usuario_id_creacion = await SkuModel.distinct('usuario_id_creacion');
      const usuario_id_actualizacion = await SkuModel.distinct('usuario_id_actualizacion');

      return { 
        sku,
        descripcion,
        categoria,
        linea,
        marca,
        empresa_id,
        usuario_id_creacion,
        usuario_id_actualizacion,
       };
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  public async getSkuById(id: string): Promise<Sku | null> {
    try {   
      const result = await SkuModel.findById(id).exec();
      if (result) {
        return { ...result.toObject(), imagen: `${result.imagen}?${ADLS_SAS_TOKEN_USER}` };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error al obtener la sku por ID:', error);
      return null;
    }
  }

  public async updateSku(id: string, data: Sku) {
    try {
      const originalSku = await SkuModel.findById(id);
      if (!originalSku) {
        return { success: false, error: 'SKU no encontrado' };
      }
  
      // Actualizar el SKU
      const result = await SkuModel.findByIdAndUpdate(
        id,
        {
          ...data,
          fecha_actualizacion: new Date(new Date().toUTCString())
        },
        { new: true }
      );
    // Propagar cambios a otras colecciones
    await this.propagateSkuChanges(originalSku, result);

      if (!result) {
        throw new Error('Sku no encontrada');
      }
      return { success: true, result };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al actualizar el sku:', error.message);
      } else {
        console.error('Error al actualizar el sku:', String(error));
      }
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  private async propagateSkuChanges(originalSku: Sku, updatedSku: any) {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const baseFilter = {
      "skus.sku": updatedSku.sku,
      fecha_creacion: { $gte: sixtyDaysAgo }
    };
    
    const updateFields: any = {};
  
    if (updatedSku.descripcion !== originalSku.descripcion) {
      updateFields["skus.$.descripcion"] = updatedSku.descripcion;
    }
  
    if (updatedSku.imagen !== originalSku.imagen) {
      updateFields["skus.$.imagen"] = updatedSku.imagen;
    }
  
    if (Object.keys(updateFields).length > 0) {
      const exhibicionUpdate = {
        filter: baseFilter,
        update: { $set: updateFields }
      };
  
      const precioUpdate = updateFields["skus.$.descripcion"] ? {
        filter: baseFilter,
        update: { $set: { "skus.$.descripcion": updatedSku.descripcion } }
      } : null;
    
      const stockUpdate = updateFields["skus.$.descripcion"] ? {
        filter: baseFilter,
        update: { $set: { "skus.$.descripcion": updatedSku.descripcion } }
      } : null;
  
      // Ejecutar las operaciones en paralelo
      await Promise.all([
        ExhibicionAdicionalModel.updateMany(exhibicionUpdate.filter, exhibicionUpdate.update),
        ExhibicionCompetenciaModel.updateMany(exhibicionUpdate.filter, exhibicionUpdate.update),
        precioUpdate ? PrecioModel.updateMany(precioUpdate.filter, precioUpdate.update) : Promise.resolve(),
        stockUpdate ? StockModel.updateMany(stockUpdate.filter, stockUpdate.update) : Promise.resolve()
      ]);
    }
  }

  public async getSkusOffline() {
    try {
      // const data = await SkuModel.find({}, { _id: 0 });
      const data = await SkuModel.find({estado: 1});
      return data;
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

}

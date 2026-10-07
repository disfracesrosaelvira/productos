import { query } from 'express';
import Model from '../db/index';

export class ConfigService {
  config_values = Model.collection('config_value');

  constructor() {}


  public async configValues(codigo) {
    try {
      // Convertir el string en un array de strings
      let query = {}
      if (codigo) {
        query = { codigo: { $in: codigo.split(',') } };
      }

      const result = await this.config_values.find(query).project({ _id: 0, codigo: 1, valor: 1 }).toArray();
      // Convertir la cadena JSON en un objeto JSON
      result.forEach(doc => {
        if (typeof doc.valor === 'string') {
          try {
            // Reemplazar las comillas simples que rodean los nombres de las propiedades y los valores de las cadenas
            const jsonString = doc.valor.replace(/'([^']+)':/g, '"$1":').replace(/: '([^']+)'/g, ': "$1"');
            doc.valor = JSON.parse(jsonString);
          } catch (error) {
            console.error('Error al parsear JSON:', error);
          }
        }
      });
      return { success: true, result };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al guardar los datos de frente:', error.message);
      } else {
        console.error('Error al guardar los datos de frente:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }

  public async saveConfigValues(data: any) {
    try {
      const doc = await this.config_values.findOne({ codigo: data.key });
      let valorArray = JSON.parse(doc?.valor);
      if (data.key === 'tipo_exhibiciones') {
        const lastElement = valorArray[valorArray.length - 1];
        valorArray.push({ code: (parseInt(lastElement.code) + 1).toString(), label: data.value, value: data.value });
      } else if (data.key === 'tipo_exhibicion_homologado_contraprestada') {
        const lastElement = valorArray[valorArray.length - 1];
        valorArray.push({ code: (parseInt(lastElement.code) + 1).toString(), label: data.value, value: data.value });
      } else if (data.key === 'tipo_zonas') {
        const lastElement = valorArray[valorArray.length - 1];
        valorArray.push({ code: (parseInt(lastElement.code) + 1).toString(), label: data.value, value: data.value });
      } else if (data.key === 'tipo_mueble_recojo') {
        const lastElement = valorArray[valorArray.length - 1];
        valorArray.push({ code: (parseInt(lastElement.code) + 1).toString(), label: data.value, value: data.value });
      } else if (data.key === 'mecanica_promocional') {
        const lastElement = valorArray[valorArray.length - 1];
        valorArray.push({ code: (parseInt(lastElement.code) + 1).toString(), label: data.value, value: data.value });
      } else if (data.key === 'tipo_mueble') {
        const lastElement = valorArray[valorArray.length - 1];
        valorArray.push({ code: (parseInt(lastElement.code) + 1).toString(), label: data.value, value: data.value });
      } else if (data.key === 'tipo_incidencia_competencia') {
        const lastElement = valorArray[valorArray.length - 1];
        valorArray.push({ code: (parseInt(lastElement.code) + 1).toString(), label: data.value, value: data.value });
      } else if (data.key === 'motivo_recojo') {
        const lastElement = valorArray[valorArray.length - 1];
        valorArray.push({ code: (parseInt(lastElement.code) + 1).toString(), label: data.value, value: data.value });
      } else if (data.key === 'tipo_mantenimiento') {
        const lastElement = valorArray[valorArray.length - 1];
        valorArray.push({ code: (parseInt(lastElement.code) + 1).toString(), label: data.value, value: data.value });
      } else if (data.key === 'sku_linea_marca') {
        valorArray.forEach(item => {
          if (item.linea === data.item.linea && item.empresa_id === data.item.empresa_id && item.competencia === data.item.competencia) {
            item.marcas.push(data.value);
          }
        });
      } else if (data.key === 'sku_linea_categorias') {
        valorArray.forEach(item => {
          if (item.linea === data.item.linea && item.empresa_id === data.item.empresa_id && item.competencia === data.item.competencia) {
            item.categorias.push(data.value);
          }
        });
      }
      const nuevoValorString = JSON.stringify(valorArray);
      const result = this.config_values.updateOne(
        { codigo: data.key },
        { $set: { valor: nuevoValorString } }
      );
      return { success: true, result };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al guardar los datos de saveConfigValue:', error.message);
      } else {
        console.error('Error al guardar los datos de saveConfigValue:', String(error));
      }
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  public async createSkuLineaMarcaOrCategorias(data: any) {
    try {
      const doc = await this.config_values.findOne({ codigo: data.key });
      let valorArray = JSON.parse(doc?.valor);
      
      if (data.key === 'sku_linea_marca') {
        valorArray.push(data.value);
      } else if (data.key === 'sku_linea_categorias') {
        valorArray.push(data.value);
      }
      const nuevoValorString = JSON.stringify(valorArray);
      const result = this.config_values.updateOne(
        { codigo: data.key },
        { $set: { valor: nuevoValorString } }
      );
      return { success: true, result };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al guardar los datos de saveConfigValue:', error.message);
      } else {
        console.error('Error al guardar los datos de saveConfigValue:', String(error));
      }
      return { success: false, error: 'Error interno del servidor' };
    }
  }
}
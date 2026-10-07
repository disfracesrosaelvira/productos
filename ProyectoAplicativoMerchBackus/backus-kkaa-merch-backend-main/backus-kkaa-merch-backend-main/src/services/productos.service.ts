import Model from '../db/index';

export class ProductosService {
  productos = Model.collection('productos')
  constructor( ) {
  }

  public async getProductos(response:any) {
    try {

      const {app,sucursal,marca} = response

      // Realizar la búsqueda de todas las productos
      const productos = await this.productos.find({app,sucursal,marca}).toArray();

      // Enviar la respuesta al cliente
      return {listProductos: productos}
    } catch (error) {
      // Manejar cualquier error
      console.error('Error al obtener las productos:', error);
      return { error: 'Error interno del servidor' }
    }
  }
  
}
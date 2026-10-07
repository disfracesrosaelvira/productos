import { Request, Response } from 'express';
import { ProductosService } from '../services/productos.service';

import { handleHttpError } from '../utils/handleError';

export default class ProductosController {
  productosService = new ProductosService()
  constructor() {
  } 
  
  getProductos = async (req: Request, res: Response) => {
    try {
      const {app,sucursal,categoria} = req.params;
      const listProductos = await this.productosService.getProductos({app,sucursal,categoria});
      res.status(200).json(listProductos);
    } catch (error) {
      handleHttpError(res, (error instanceof Error) ? error.message : 'Se produjo un error desconocido');
    }
  }
  
}
import { subHours } from 'date-fns';
import Model from '../db/index';
import { HttpException } from '../exceptions/httpException';
import { UsuarioModel } from '../models/usuario.model';
import { hash } from 'bcrypt';
// import * as CryptoJS from 'crypto-js';
import { SECRET_KEY } from '../config';

export class UsuarioService {
  userModel = Model.collection("usuario");
  constructor() { }

  public async getUsuarios(pageIndex: String, pageSize: String, filterTable: string | undefined) {
    try {
      let query = {};
      if (filterTable) {
        const filters = JSON.parse(filterTable);
        filters.forEach((filter: { key: string, values: string[] }) => {
          query[filter.key] = { $in: filter.values };
        });
      }
      const result = await UsuarioModel.paginate(query, { select: '-password', page: Number(pageIndex), limit: Number(pageSize), lean: true, leanWithId: true, sort: { fecha_creacion: -1 }});
      
      result.docs = result?.docs?.map((usuario: any) => (
        { 
          ...usuario,
          fecha_creacion: subHours(usuario.fecha_creacion, 5),
          fecha_actualizacion: subHours(usuario.fecha_actualizacion, 5),
          fecha_eliminacion: subHours(usuario.fecha_eliminacion, 5)
        }
      ));
      return result ;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al listar los usuarios:', error.message);
      } else {
        console.error('Error al listar los usuarios:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }

  public async getUsuariosOffline() {
    try {
      const result: any = await this.userModel.find({estado:1}).toArray();
      // const resultString = JSON.stringify(result);
      // const encrypted = CryptoJS.AES.encrypt(resultString, SECRET_KEY as string).toString();
      // return encrypted ;
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al listar los usuarios:', error.message);
      } else {
        console.error('Error al listar los usuarios:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }

  public async getUsuariosFilters() {
    try {
      const usuario_id = await UsuarioModel.distinct('usuario_id');
      const nombre = await UsuarioModel.distinct('nombre');
      return { 
        usuario_id,
        nombre
       };
    } catch (error: unknown) {
      throw new Error('Error interno del servidor');
    }
  }

  public async insertUsuario(usuario: any) {
    try {
      const findUser = await UsuarioModel.findOne({ usuario_id: usuario.usuario_id });
      if (findUser) {
        return { success: false, error: `El código ${usuario.usuario_id} ya existe` };
      }

      const hashedPassword = await hash(usuario.contraseña, 10);

      const newUsuario = new UsuarioModel({...usuario, contraseña: hashedPassword});
      const result = await newUsuario.save();
      return { sucess: true, result }
      
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al insertar el usuario:', error.message);
      } else {
        console.error('Error al insertar el usuario:', String(error));
      }
      return { success: false, error: 'Error interno del servidor' };
    }
  }
  
  public async updateUsuario(id: string, usuario: any) {
    try {
      if (!usuario.contraseña || usuario.contraseña.trim() === '') {
        delete usuario.contraseña; // Elimina la propiedad contraseña si está vacía
      }else{
        const hashedPassword = await hash(usuario.contraseña, 10);
        usuario.contraseña = hashedPassword;
      }
      usuario['fecha_actualizacion'] = new Date(new Date().toUTCString());
      const result = await UsuarioModel.findByIdAndUpdate(id, usuario, { new: true });
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
  
  public async deleteUsuario(id: string) {
    try {
      // const result = await UsuarioModel.deleteOne({ _id: id });
      const query = { estado : 0, fecha_eliminacion: new Date(new Date().toUTCString()) }
      const result = await UsuarioModel.findByIdAndUpdate(id, query, { new: true });
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al eliminar el usuario:', error.message);
      } else {
        console.error('Error al eliminar el usuario:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }

  public async getUsuarioByUserId(usuario_id: string) {
    try {
      const user: any = await this.userModel.findOne({ usuario_id: usuario_id });

      if (!user) throw new HttpException(409, `Usuario no encontrado`);
    
      if (user.estado==0) throw new HttpException(409, `Usuario desactivado`);

      return user;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al obtener el usuario:', error.message);
      } else {
        console.error('Error al obtener el usuario:', String(error));
      }
      return { error: 'Error interno del servidor' };
    }
  }
}
import { Document, PaginateModel, Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

export interface Usuario  {
  usuario_id: string;
  nombre: string;
  rol: string;
  estado: number;
  usuario_id_creacion: string;
  contraseña: string;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  fecha_eliminacion: Date;
}

const UsuarioSchema = new Schema<Usuario>(
  {
    usuario_id: { type: String },
    nombre: { type: String },
    rol: { type: String },
    estado: { type: Number },
    usuario_id_creacion: { type: String },
    contraseña: { type: String },
    fecha_creacion: { type: Date },
    fecha_actualizacion: { type: Date },
    fecha_eliminacion: { type: Date }
  },
  {
    collection: 'usuario',
    versionKey: false,
  },
);

UsuarioSchema.plugin(paginate);

interface UsuarioDocument extends Document, Usuario {}

export const UsuarioModel = model<Usuario, PaginateModel<UsuarioDocument>>('usuario', UsuarioSchema);

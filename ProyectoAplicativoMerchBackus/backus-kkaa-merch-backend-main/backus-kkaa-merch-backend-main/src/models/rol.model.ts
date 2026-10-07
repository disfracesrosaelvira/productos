import { Document, PaginateModel, Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

export interface Rol  {
  nombre: string;
  descripcion: string;
  permisos: any;
  created_at: Date;
  updated_at: Date;
}

const rolSchema = new Schema<Rol>(
  {
    nombre: { type: String },
    descripcion: { type: String },
    permisos: { type: Object },
    created_at: { type: Date },
    updated_at: { type: Date },
  },
  {
    collection: 'rol',
    timestamps: true,
  },
);

rolSchema.plugin(paginate);

interface RolDocument extends Document, Rol {}

export const RolModel = model<Rol, PaginateModel<RolDocument>>('rol', rolSchema);

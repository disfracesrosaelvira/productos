import { Document, PaginateModel, Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

export interface Sku {
  sku: number;
  descripcion: string;
  categoria: string;
  linea: string;
  marca: string;
  imagen: string;
  nombre_imagen: string;
  empresa_id: string;
  estado: number;
  competencia: number;
  usuario_id_creacion: string;
  usuario_id_actualizacion?: string;
  fecha_creacion: Date;
  fecha_actualizacion?: Date;
}

const skuSchema = new Schema<Sku>(
  {
    sku: { type: Number, required: true },
    descripcion: { type: String, required: true },
    categoria: { type: String, required: true },
    linea: { type: String, required: true },
    marca: { type: String, required: true },
    imagen: { type: String, required: true },
    nombre_imagen: { type: String, required: true },
    empresa_id: { type: String, required: true },
    estado: { type: Number, required: true },
    competencia: { type: Number, required: true },
    usuario_id_creacion: { type: String, required: true },
    usuario_id_actualizacion: { type: String},
    fecha_creacion: { type: Date, required: true },
    fecha_actualizacion: { type: Date },
  },
  {
    collection: 'sku',
    timestamps: false,
  },
);

skuSchema.plugin(paginate);

interface SkuDocument extends Document, Sku {}

export const SkuModel = model<Sku, PaginateModel<SkuDocument>>('sku', skuSchema);

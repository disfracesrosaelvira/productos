import { Document, PaginateModel, Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

export interface ExhibicionAdicional {
  zona: string;
  tipo_exhibicion: string;
  fecha_inicio_vigencia: Date;
  fecha_fin_vigencia: Date;
  fecha_ultimo_relevo: Date;
  // imagenes: any;
  validaciones: any;
  latitud: string;
  longitud: string;
  cantidad: number;
  poc: any;
  usuario: any;
  empresa_id: string;
  // usuario_id: string;
  offline: number;
  skus: any;
  fecha_creacion: Date;
  fecha_eliminacion: Date;
  cadena: string;
  gerencia: string;
  region: string;
  tipo_mueble: number;
}

const exhibicionAdicionalSchema = new Schema<ExhibicionAdicional>(
  {
    zona: { type: String },
    tipo_exhibicion: { type: String },
    fecha_inicio_vigencia: { type: Date },
    fecha_fin_vigencia: { type: Date },
    fecha_ultimo_relevo: { type: Date },
    validaciones: { type: Array },
    latitud: { type: String },
    longitud: { type: String },
    cantidad: { type: Number },
    poc: { type: Object },
    offline: { type: Number},
    usuario: { type: Object },
    empresa_id: { type: String },
    fecha_creacion: { type: Date },
    fecha_eliminacion: { type: Date },
    skus: {type: Array },
    cadena: {type: String},
    gerencia: {type: String},
    region: {type: String},
    tipo_mueble: {type: Number}
  },
  {
    collection: 'exhibicion_adicional',
    timestamps: false,
  },
);

exhibicionAdicionalSchema.plugin(paginate);

interface ExhibicionAdicionalDocument extends Document, ExhibicionAdicional {}

export const ExhibicionAdicionalModel = model<ExhibicionAdicional, PaginateModel<ExhibicionAdicionalDocument>>('exhibicion_adicional', exhibicionAdicionalSchema);

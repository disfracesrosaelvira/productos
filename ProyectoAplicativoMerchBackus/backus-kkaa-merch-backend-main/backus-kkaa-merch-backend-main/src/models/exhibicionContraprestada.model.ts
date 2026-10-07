import { Document, PaginateModel, Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

export interface ExhibicionContraprestada {
  empresa_id: string;
  // poc: number;
  // poc_nombre: string;
  usuario: any;
  poc: any;
  zona: string;
  tienda: string;
  campaña: string;
  fecha_inicio: string;
  fecha_fin: string;
  marca: string;
  skus: string;
  vigente: boolean;
  cadena: string;
  gerencia: string;
  region: string;
  fecha_ultimo_relevo: Date;
}

const exhibicionContraprestadaSchema = new Schema<ExhibicionContraprestada>(
  {
    empresa_id: { type: String },
    poc: { type: Object },
    usuario: { type: String },
    zona: { type: String },
    tienda: { type: String },
    campaña: { type: String },
    fecha_inicio: { type: String },
    fecha_fin: { type: String },
    marca: { type: String },
    skus: { type: String },
    vigente: { type: Boolean },
    cadena: {type: String},
    gerencia: {type: String},
    region: {type: String},
    fecha_ultimo_relevo: { type: Date },
  },
  {
    collection: 'exhibicion_contraprestada',
    timestamps: false,
  },
);

exhibicionContraprestadaSchema.plugin(paginate);

interface ExhibicionContraprestadaDocument extends Document, ExhibicionContraprestada {}

export const ExhibicionContraprestadaModel = model<ExhibicionContraprestada, PaginateModel<ExhibicionContraprestadaDocument>>('exhibicion_contraprestada', exhibicionContraprestadaSchema);

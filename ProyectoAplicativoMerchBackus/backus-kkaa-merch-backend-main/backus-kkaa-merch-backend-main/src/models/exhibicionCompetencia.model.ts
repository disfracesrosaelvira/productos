import { Document, PaginateModel, Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

export interface ExhibicionCompetencia {
  zona: string;
  tipo_exhibicion: string;
  productos: any;
  contraprestada: boolean;
  validaciones: any;
  latitud: string;
  longitud: string;
  fecha_inicio_vigencia: Date;
  fecha_fin_vigencia: Date;
  fecha_ultimo_relevo: Date;
  poc: any;
  empresa_id: string;
  usuario: any;
  skus: any;
  fecha_creacion: Date;
  fecha_eliminacion: Date;
  offline: number;
  cadena: string;
  gerencia: string;
  region: string;
}

const exhibicionCompetenciaSchema = new Schema<ExhibicionCompetencia>(
  {
    zona: { type: String },
    tipo_exhibicion: { type: String },
    productos: { type: Array },
    contraprestada: { type: Boolean },
    validaciones: { type: Array },
    latitud: { type: String },
    longitud: { type: String },
    fecha_inicio_vigencia: { type: Date },
    fecha_fin_vigencia: { type: Date },
    fecha_ultimo_relevo: { type: Date },
    poc: { type: Object },
    empresa_id: { type: String },
    usuario: { type: Object },
    fecha_creacion: { type: Date },
    fecha_eliminacion: { type: Date },
    offline: { type: Number },
    skus: {type: Array },
    cadena: {type: String},
    gerencia: {type: String},
    region: {type: String}
  },
  {
    collection: 'exhibicion_competencia',
    timestamps: false,
  },
);

exhibicionCompetenciaSchema.plugin(paginate);

interface ExhibicionCompetenciaDocument extends Document, ExhibicionCompetencia {}

export const ExhibicionCompetenciaModel = model<ExhibicionCompetencia, PaginateModel<ExhibicionCompetenciaDocument>>('exhibicion_competencia', exhibicionCompetenciaSchema);

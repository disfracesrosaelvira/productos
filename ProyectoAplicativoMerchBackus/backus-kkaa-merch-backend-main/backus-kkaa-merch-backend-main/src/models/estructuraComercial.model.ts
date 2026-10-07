import { Document, PaginateModel, Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

export interface EstructuraComercial {
  poc: number;
  poc_nombre: string;
  poc_cadena: string;
  poc_backus: string;
  poc_nombre_planning: string;
  poc_tipo: string;
  documento_sv: string;
  nombre_sv: string;
  documento_bdr: string;
  nombre_bdr: string;
  estado: number;
  usuario_id_creacion: string;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  usuario_id_actualizacion: string;
}

const estructuraComercialSchema = new Schema<EstructuraComercial>(
  {
    poc: { type: Number, required: true },
    poc_nombre: { type: String, required: true },
    poc_cadena: { type: String, required: true },
    poc_backus: { type: String, required: true },
    poc_nombre_planning: { type: String, required: true },
    poc_tipo: { type: String, required: true },
    documento_sv: { type: String, required: true },
    nombre_sv: { type: String, required: true },
    documento_bdr: { type: String, required: true },
    nombre_bdr: { type: String, required: true },
    estado: { type: Number, required: true },
    usuario_id_creacion: { type: String },
    fecha_creacion: { type: Date },
    fecha_actualizacion: { type: Date },
    usuario_id_actualizacion: { type: String },
  },
  {
    collection: 'estructura_comercial',
    timestamps: false,
  },
);

estructuraComercialSchema.plugin(paginate);

interface estructuraComercialDocument extends Document, EstructuraComercial {}

export const EstructuraComercialModel = model<EstructuraComercial, PaginateModel<estructuraComercialDocument>>('estructura_comercial', estructuraComercialSchema);

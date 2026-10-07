import { Document, PaginateModel, Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

export interface Poc {
  poc: number;
  nombre: string;
  nombre_planning: string;
  tipo: string;
  documento_sv: string;
  nombre_sv: string;
  poc_cadena: string;
  poc_backus: string;
  estado: number;
  usuario_id_creacion: string;
  cadena: string;
  gerencia: string;
  region: string;
  usuario_id_actualizacion?: string;
  fecha_creacion: Date;
  poc_livetrade: string;
  fecha_actualizacion?: Date;
}

const pocSchema = new Schema<Poc>(
  {
    poc: { type: Number, required: true, unique: true },
    nombre: { type: String, required: true },
    nombre_planning: { type: String, required: true },
    tipo: { type: String, required: true },
    documento_sv: { type: String, required: true },
    nombre_sv: { type: String, required: true },
    poc_cadena: { type: String, required: true },
    poc_backus: { type: String, required: true },
    estado: { type: Number, required: true },
    usuario_id_creacion: { type: String, required: true },
    usuario_id_actualizacion: { type: String },
    fecha_creacion: { type: Date, required: true },
    poc_livetrade: { type: String, required: true },
    fecha_actualizacion: { type: Date },
    cadena: {type: String},
    gerencia: {type: String},
    region: {type: String}
  },
  {
    collection: 'poc',
    timestamps: false,
  },
);

pocSchema.plugin(paginate);

interface PocDocument extends Document, Poc {}

export const PocModel = model<Poc, PaginateModel<PocDocument>>('poc', pocSchema);
import { Document, PaginateModel, Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import { IDicImagen, IDicPoc, IDicSku, IDicUsuario } from './dictionary.model';

export interface Frente {
  frente_id: string;
  frente_total: number;
  skus: IDicSku[];
  imagenes: IDicImagen[];
  latitud: number;
  longitud: number;
  empresa_id: string;
  poc: IDicPoc;
  usuario: IDicUsuario;
  fecha_creacion: Date;
}

const imagenSchema = new Schema<IDicImagen>({
    nombre: { type: String, required: true },
    imagen_url: { type: String, required: true },
    fecha_creacion: { type: String, required: true }
});

const skuSchema = new Schema<IDicSku>({
  marca: { type: String, required: true },
  cantidad: { type: Number, required: true },
});

const pocSchema = new Schema<IDicPoc>({
  poc: { type: Number, required: true },
  nombre: { type: String, required: true },
  poc_cadena: { type: String, required: true },
  poc_backus: { type: String, required: true },
  nombre_planning: { type: String, required: true },
  tipo: { type: String, required: true },
  documento_sv: { type: String, required: true },
  nombre_sv: { type: String, required: true },
  cadena: {type: String},
  gerencia: {type: String},
  region: {type: String}
});

const usuarioSchema = new Schema<IDicUsuario>({
  usuario_id: { type: String, required: true },
  nombre: { type: String, required: true },
  rol: { type: String, required: true },
});

const frenteSchema = new Schema<Frente>(
  {
    frente_id: { type: String, required: true },
    frente_total: { type: Number, required: true },
    skus: { type: [skuSchema], required: true },
    latitud: { type: Number, required: true },
    longitud: { type: Number, required: true },
    imagenes: { type: [imagenSchema], required: true },
    empresa_id: { type: String, required: true },
    poc: { type: pocSchema, required: true },
    usuario: { type: usuarioSchema, required: true },
    fecha_creacion: { type: Date }
  },
  {
    collection: 'frente',
    timestamps: false,
  },
);

frenteSchema.plugin(paginate);

interface FrenteDocument extends Document, Frente {}

export const FrenteModel = model<Frente, PaginateModel<FrenteDocument>>('frente', frenteSchema);

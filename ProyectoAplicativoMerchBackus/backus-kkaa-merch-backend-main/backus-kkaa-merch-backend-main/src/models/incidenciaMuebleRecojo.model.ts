import { Document, PaginateModel, Schema, model } from "mongoose";
import paginate from "mongoose-paginate-v2";
import { IDicImagen, IDicPoc, IDicUsuario } from "./dictionary.model";

export interface Imagen {
  nombre: string;
  url: string;
  fecha_creacion: string;
}

export interface IncidenciaMuebleRecojo {
  marca: string;
  tipo_mueble: string;
  motivo_recojo: string;
  imagenes: IDicImagen[];
  latitud: Number;
  longitud: Number;
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

const incidenciaMuebleRecojoSchema = new Schema<IncidenciaMuebleRecojo>(
  {
    marca: { type: String, required: true },
    tipo_mueble: { type: String, required: true },
    motivo_recojo: { type: String, required: true },
    imagenes: { type: [imagenSchema], required: true },
    latitud: { type: Number, required: true },
    longitud: { type: Number, required: true },
    empresa_id: { type: String, required: true },
    poc: { type: pocSchema, required: true },
    usuario: { type: usuarioSchema, required: true },
    fecha_creacion: { type: Date, required: true },
  },
  {
    collection: "incidencia_mueble_recojo",
    timestamps: false,
  }
);

incidenciaMuebleRecojoSchema.plugin(paginate);

interface IncidenciaMuebleRecojoDocument extends Document, IncidenciaMuebleRecojo {}

export const IncidenciaMuebleRecojoModel = model<
  IncidenciaMuebleRecojo,
  PaginateModel<IncidenciaMuebleRecojoDocument>
>("incidencia_mueble_recojo", incidenciaMuebleRecojoSchema);

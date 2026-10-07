import { Document, PaginateModel, Schema, model } from "mongoose";
import paginate from "mongoose-paginate-v2";
import { IDicPoc, IDicUsuario } from "./dictionary.model";

export interface IncidenciaMuebleAsignacion {
  marca: string;
  tipo_mueble: string;
  latitud: Number;
  longitud: Number;
  empresa_id: string;
  poc: IDicPoc;
  usuario: IDicUsuario;
  fecha_creacion: Date;
}

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


const incidenciaMuebleAsignacionSchema = new Schema<IncidenciaMuebleAsignacion>(
  {
    marca: { type: String, required: true },
    tipo_mueble: { type: String, required: true },
    latitud: { type: Number, required: true },
    longitud: { type: Number, required: true },
    empresa_id: { type: String, required: true },
    poc: { type: pocSchema, required: true },
    usuario: { type: usuarioSchema, required: true },
    fecha_creacion: { type: Date, required: true }
  },
  {
    collection: "incidencia_mueble_asignacion",
    timestamps: false,
  }
);

incidenciaMuebleAsignacionSchema.plugin(paginate);

interface IncidenciaMuebleAsignacionciaDocument extends Document, IncidenciaMuebleAsignacion {}

export const IncidenciaMuebleAsignacionModel = model<
  IncidenciaMuebleAsignacion,
  PaginateModel<IncidenciaMuebleAsignacionciaDocument>
>("incidencia_mueble_asignacion", incidenciaMuebleAsignacionSchema);

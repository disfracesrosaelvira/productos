import { Document, PaginateModel, Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import { IDicImagen, IDicPoc, IDicSkuPrice, IDicUsuario } from './dictionary.model';

export interface Precio {
    precio_id: string;
    skus: IDicSkuPrice[];
    latitud: Number;
    longitud: Number;
    imagen_url: string;
    empresa_id: string;
    poc: IDicPoc;
    usuario: IDicUsuario;
    fecha_creacion: Date;
}

const skuSchema = new Schema<IDicSkuPrice>({
  sku: { type: Number, required: true },
  descripcion: { type: String, required: true },
  marca: { type: String, required: true },
  pvp_regular: { type: Number, required: true },
  selected_mecanica: { type: String, required: true },
  pvp_promocional: { type: Number, required: true },
  pvp_adicional: { type: Number, required: true },
  imagen_url: { type: String, required: true },
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

const precioSchema = new Schema<Precio>(
  {
    precio_id: { type: String, required: true },
    skus: { type: [skuSchema], required: true },
    latitud: { type: Number, required: true },
    longitud: { type: Number, required: true },
    empresa_id: { type: String, required: true },
    poc: { type: pocSchema, required: true },
    usuario: { type: usuarioSchema, required: true },
    fecha_creacion: { type: Date }
  },
  {
    collection: 'precio',
    timestamps: false,
  },
);

precioSchema.plugin(paginate);

interface PrecioDocument extends Document, Precio {}

export const PrecioModel = model<Precio, PaginateModel<PrecioDocument>>('precio', precioSchema);

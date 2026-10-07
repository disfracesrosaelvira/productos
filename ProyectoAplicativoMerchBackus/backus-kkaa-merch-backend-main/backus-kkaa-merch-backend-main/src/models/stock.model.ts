import { Document, PaginateModel, Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import { IDicPoc, IDicSkuStock, IDicUsuario } from './dictionary.model';

export interface Stock {
  stock_id: string;
  skus: IDicSkuStock[];
  latitud: number;
  longitud: Number;
  poc: IDicPoc;
  usuario: IDicUsuario;
  empresa_id: string;
  fecha_creacion: Date;
}

const skuSchema = new Schema<IDicSkuStock>({
  sku: { type: Number, required: true },
  descripcion: { type: String, required: true },
  gondola_stock: { type: Number, required: true },
  exhibicion_stock: { type: Number, required: true },
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

const stockSchema = new Schema<Stock>(
  {
    stock_id: { type: String, required: true },
    skus: { type: [skuSchema], required: true },
    latitud: { type: Number, required: true },
    longitud: { type: Number, required: true },
    poc: { type: pocSchema, required: true },
    usuario: { type: usuarioSchema, required: true },
    empresa_id: { type: String, required: true },
    fecha_creacion: { type: Date },
  },
  {
    collection: 'stock',
    timestamps: false,
  },
);

stockSchema.plugin(paginate);

interface StockDocument extends Document, Stock {}

export const StockModel = model<Stock, PaginateModel<StockDocument>>('stock', stockSchema);

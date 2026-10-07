import mongoose, { Document, Schema } from 'mongoose';

export interface ISucursal extends Document {
  app: string;
  list: string[];
}

const SucursalSchema: Schema = new Schema({
  app: { type: String, required: true },
  list: [{ type: String, required: true }],
});

// Especifica el nombre de la colección 'sucursales'
const SucursalModel = mongoose.model<ISucursal>('Sucursal', SucursalSchema, 'sucursales');
    
export default SucursalModel;
import mongoose from 'mongoose';
//import {connect} from 'mongoose';
import { DB_URI } from '../config';

/*export async function connectToMongoDB() {
  try {
    await connect(DB_URI as string);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}*/

// @ts-ignore
mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conexión establecida con éxito a la base de datos de MongoDB.'))
  .catch((err: any) => {
    console.error('No se pudo conectar a la base de datos de MongoDB:', err);
    process.exit(1); // Salir del proceso con un código de error
  });

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('Error en la conexión a la base de datos:', err);
});

export default db;
import 'dotenv/config';

function required(nombre) {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre} (ver .env.example)`);
  }
  return valor;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  supabaseUrl: required('SUPABASE_URL'),
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
  supabaseServiceKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  bucket: process.env.SUPABASE_BUCKET ?? 'disfraces',
  imgMaxSize: Number(process.env.IMG_MAX_SIZE ?? 1600),
  imgQuality: Number(process.env.IMG_QUALITY ?? 80),
};

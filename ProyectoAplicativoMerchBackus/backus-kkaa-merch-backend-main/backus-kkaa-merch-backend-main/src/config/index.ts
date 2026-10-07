import dotenv from 'dotenv';

const NODE_ENV = process.env.NODE_ENV
if (NODE_ENV === 'local') {
  dotenv.config({ path: ".env.local" });
}
console.log(`env: ${NODE_ENV}`);

export const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, PORT, SECRET_KEY, LOG_FORMAT, LOG_DIR, ORIGIN, SAS_TOKEN, DB_URI, ADLS_HOST, ADLS_CONTAINER, ADLS_SAS_TOKEN, ADLS_SAS_TOKEN_USER } = process.env;

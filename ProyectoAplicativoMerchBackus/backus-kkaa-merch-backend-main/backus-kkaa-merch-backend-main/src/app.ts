import express from 'express';
import { setRoutesAuth } from './routes/auth.routes';
import { setRoutesSucursales } from './routes/sucursales.routes';
import { setRoutesProductos } from './routes/productos.routes';
import { setRoutesEncuestas } from './routes/encuestas.routes';
import { setRoutesUpdateFiles } from './routes/uploadFiles.routes';
import { json, urlencoded } from 'body-parser';
import { PORT } from './config';
import cors from 'cors';
import logger from './utils/logger';
import { setRoutesPrecio } from './routes/precio.routes';
import { setRoutesExhibicion } from './routes/exhibicion.routes';
import { setRoutesFrente } from './routes/frente.routes';
import { setRoutesIncidencia } from './routes/incidencia.routes';
import { setRoutesStock } from './routes/stock.routes';
import { setRoutesConfig } from './routes/config.routes';
import { setRoutesSKU } from './routes/sku.routes';
import { setRoutesDownloadFiles } from './routes/downloadFiles.routes';
import { setRoutesRol } from './routes/rol.routes';
import { setRoutesUpload } from './routes/upload.routes';
import { setRoutesPocs } from './routes/pocs.routes';
import { setRoutesUsuario } from './routes/usuario.routes';
import { setRoutesEstructuraComercial } from './routes/estructuraComercial.routes';

//import { connectToMongoDB } from './db';

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API de backus-kkaa-merch',
      version: '1.0.0',
      description: 'Documentación de la API de backus-kkaa-merch',
    },
    basePath: "/api/v1",
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.routes.ts'], // Rutas donde se encuentran tus definiciones de ruta
};

const app = express();

// Habilita CORS para todas las rutas
app.use(cors());
// app.use(json());
// app.use(urlencoded({ extended: true }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Inicializar Swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

// Servir la documentación de Swagger con Swagger-ui-express
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Configura las rutas
setRoutesAuth(app)
setRoutesSucursales(app)
setRoutesPrecio(app)
setRoutesExhibicion(app)
setRoutesFrente(app)
setRoutesIncidencia(app)
setRoutesStock(app)
setRoutesConfig(app)
setRoutesSKU(app)
setRoutesDownloadFiles(app)
setRoutesRol(app)
setRoutesUsuario(app)
setRoutesUpload(app)
setRoutesProductos(app)
setRoutesEncuestas(app)
setRoutesUpdateFiles(app)
setRoutesPocs(app)
setRoutesEstructuraComercial(app)
logger.info(`Se cargo las rutas`);

// Manejo de errores
app.use((err:any, req:any, res:any, next:any) => {
  logger.error(err.message);
  res.status(500).send('Ocurrió un error');
});

/*async function startApp() {
  //await connectToMongoDB();
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}
startApp();*/

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

export default app;
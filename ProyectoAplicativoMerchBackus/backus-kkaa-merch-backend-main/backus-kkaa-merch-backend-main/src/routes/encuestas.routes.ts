import express, { Router } from "express";
import EncuestasController from "../controllers/encuestas.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export const setRoutesEncuestas = (app: express.Application) => {
  const encuestasController: EncuestasController = new EncuestasController();

  // Crea un nuevo router
  const router: Router = express.Router();

  // Define las rutas en el router
  /**
   * @swagger
   * tags:
   *   - name: Encuestas
   *     description: Rutas de CRUD Encuestas
   */
  /**
   * @swagger
   * /api/v1/encuestasPrecio/{app}/{sucursal}/{categoria}:
   *   post:
   *     summary: Guarda una encuesta precio que se pertenece al app , sucursal y categoria definidas con sus caracteristicas.
   *     description: Guarda una encuesta precio que se pertenece al app , sucursal y categoria definidas con sus caracteristicas.
   *     tags: [Encuestas]
   *     parameters:
   *       - in: path
   *         name: app
   *         required: true
   *         schema:
   *           type: string
   *           example: BACKUS
   *         description: Nombre de la aplicación.
   *       - in: path
   *         name: sucursal
   *         required: true
   *         schema:
   *           type: string
   *           example: VEGA TDA SANTA CLARA
   *         description: Nombre de la sucursal.
   *       - in: path
   *         name: categoria
   *         required: true
   *         schema:
   *           type: string
   *           example: Artesanales y RTDs
   *         description: Nombre de la categoria.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               pvpRegular:
   *                 type: number
   *                 example: 3
   *                 description: pvp regular del producto.
   *               mecanicaProvicional:
   *                 type: string
   *                 example: 2x
   *                 description: mecanica provicional del producto.
   *               fotoPrecios:
   *                 type: string
   *                 example: https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.catalogosofertas.com.pe%2Ftiendas%2Ffreshmart%2Fofertas%2Fcerveza-barbarian-magic-quinua-pils-4pack-botella-330-ml-unidad-oferta-9780585%2F&psig=AOvVaw0Xz1tGjByPnQZO3N2dnk5Z&ust=1714099342919000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCIjrqJ6s3IUDFQAAAAAdAAAAABAE
   *                 description: imagen de precio del producto.
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: OK
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   */
  router.post(
    "/encuestasPrecio/:app/:sucursal/:categoria",
    authMiddleware,
    encuestasController.encuestasPrecioSave
  );

  /**
   * @swagger
   * /api/v1/encuestasPrecio/{app}/{sucursal}/{categoria}:
   *   get:
   *     summary: Obtiene todas los Encuestas que se pertenece al app y sucursal definidas
   *     description: Obtiene todas los Encuestas que se pertenece al app y sucursal definidas.
   *     tags: [Encuestas]
   *     parameters:
   *       - in: path
   *         name: app
   *         required: true
   *         schema:
   *           type: string
   *           example: BACKUS
   *         description: Nombre de la aplicación.
   *       - in: path
   *         name: sucursal
   *         required: true
   *         schema:
   *           type: string
   *           example: VEGA TDA SANTA CLARA
   *         description: Nombre de la sucursal.
   *       - in: path
   *         name: categoria
   *         required: true
   *         schema:
   *           type: string
   *           example: Artesanales y RTDs
   *         description: Nombre de la categoria.
   *     responses:
   *       200:
   *         description: OK
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 listEncuestaPrecios:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       _id:
   *                         type: string
   *                         description: ID de la encuesta de precios.
   *                       app:
   *                         type: string
   *                         description: Nombre de la aplicación.
   *                       sucursal:
   *                         type: string
   *                         description: Nombre de la sucursal.
   *                       categoria:
   *                         type: string
   *                         description: Nombre de la categoría.
   *                       tipo:
   *                         type: string
   *                         description: Tipo de la encuesta.
   *                       pvpRegular:
   *                         type: string
   *                         description: Precio regular.
   *                       mecanicaProvicional:
   *                         type: number
   *                         description: Mecánica provisional.
   *                       fotoPrecios:
   *                         type: string
   *                         description: URL de la foto de precios.
   */

  router.get(
    "/encuestasPrecio/:app/:sucursal/:categoria",
    authMiddleware,
    encuestasController.getEncuestasPrecio
  );

  /**
   * @swagger
   * /api/v1/editarEncuestaPrecio/{id}:
   *   put:
   *     summary: edita una encuesta de precio.
   *     description: edita una encuesta de precio.
   *     tags: [Encuestas]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           example: 663089893a145432d45a2fb2
   *         description: id de la encuesta de precio.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               pvpRegular:
   *                 type: number
   *                 example: "0"
   *               mecanicaProvicional:
   *                 type: string
   *                 example: "2x"
   *               fotoPrecios:
   *                 type: string
   *                 example: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.wong.pe%2Fpack-x3-sixpack-cerveza-corona-botella-330ml-1012623%2Fp%3Fidsku%3D39280375&psig=AOvVaw27SwHui41JhMe_Z-dZEoL4&ust=1714543715440000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCJDTkNCj6YUDFQAAAAAdAAAAABAE"
   *     responses:
   *       200:
   *         description: OK
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   */
  router.put(
    "/encuestasPrecio/:id",
    authMiddleware,
    encuestasController.updateEncuestasPrecio
  );
  router.post(
    "/encuestasFrentes/:app/:sucursal/:categoria",
    authMiddleware,
    encuestasController.encuestasFrentesSave
  );

  /**
   * @swagger
   * /api/v1/encuestasFrentes/{app}/{sucursal}/{categoria}:
   *   get:
   *     summary: Obtiene todas los Encuestas que se pertenece al app y sucursal definidas
   *     description: Obtiene todas los Encuestas que se pertenece al app y sucursal definidas.
   *     tags: [Encuestas]
   *     parameters:
   *       - in: path
   *         name: app
   *         required: true
   *         schema:
   *           type: string
   *           example: BACKUS
   *         description: Nombre de la aplicación.
   *       - in: path
   *         name: sucursal
   *         required: true
   *         schema:
   *           type: string
   *           example: VEGA TDA SANTA CLARA
   *         description: Nombre de la sucursal.
   *       - in: path
   *         name: categoria
   *         required: true
   *         schema:
   *           type: string
   *           example: Artesanales y RTDs
   *         description: Nombre de la categoria.
   *     responses:
   *       200:
   *         description: OK
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 listEncuestaOsa:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       _id:
   *                         type: string
   *                         description: ID de la encuesta.
   *                       app:
   *                         type: string
   *                         description: Nombre de la aplicación.
   *                       sucursal:
   *                         type: string
   *                         description: Nombre de la sucursal.
   *                       categoria:
   *                         type: string
   *                         description: Nombre de la categoría.
   *                       frentesTotales:
   *                         type: number
   *                         description: frentes que se tiene el producto.
   *                       frentesTotalesPorMarca:
   *                         type: number
   *                         description: frentes totales pormarca que se tiene el producto.
   *                       foto:
   *                         type: string
   *                         description: foto del frente que se tiene el producto.
   *                       panogramaImplementado:
   *                         type: boolean
   *                         description: frentes totales pormarca que se tiene el producto.
   *                       medidasGondolas:
   *                         type: object
   *                         properties:
   *                           alto:
   *                             type: number
   *                             description: altura de gondola en cm.
   *                           largo:
   *                             type: number
   *                             description: largo de gondola en cm.
   *                           profundidad:
   *                             type: number
   *                             description: profundidad de gondola en cm.
   *                           bande:
   *                             type: number
   *                             description: profundidad de gondola en cm.
   */
  router.get(
    "/encuestasFrentes/:app/:sucursal/:categoria",
    authMiddleware,
    encuestasController.getEncuestasFrentes
  );

  /**
   * @swagger
   * /api/v1/encuestasFrentes/{id}:
   *   put:
   *     summary: edita una encuesta frentes.
   *     description: edita una encuesta frentes.
   *     tags: [Encuestas]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           example: 663089893a145432d45a2fb2
   *         description: id de la encuesta frentes.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               frentesTotales:
   *                 type: number
   *                 example: 1
   *                 description: frentes que se tiene el producto.
   *               frentesTotalesPorMarca:
   *                 type: number
   *                 example: 2
   *                 description: frentes totales pormarca que se tiene el producto.
   *               foto:
   *                 type: string
   *                 example: https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.catalogosofertas.com.pe%2Ftiendas%2Ffreshmart%2Fofertas%2Fcerveza-barbarian-magic-quinua-pils-4pack-botella-330-ml-unidad-oferta-9780585%2F&psig=AOvVaw0Xz1tGjByPnQZO3N2dnk5Z&ust=1714099342919000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCIjrqJ6s3IUDFQAAAAAdAAAAABAE
   *                 description: foto del frente que se tiene el producto.
   *               panogramaImplementado:
   *                 type: boolean
   *                 example: true
   *                 description: frentes totales pormarca que se tiene el producto.
   *               medidasGondolas:
   *                 type: object
   *                 properties:
   *                   alto:
   *                    type: number
   *                    example: 5
   *                    description: altura de gondola en cm.
   *                   largo:
   *                    type: number
   *                    example: 4
   *                    description: largo de gondola en cm.
   *                   profundidad:
   *                    type: number
   *                    example: 3
   *                    description: profundidad de gondola en cm.
   *                   bande:
   *                    type: number
   *                    example: 3
   *                    description: profundidad de gondola en cm.
   *     responses:
   *       200:
   *         description: OK
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   */
  router.put(
    "/encuestasFrentes/:id",
    authMiddleware,
    encuestasController.updateEncuestaFrentes
  );

  /**
   * @swagger
   * /api/v1/encuestasExhibiciones/{app}/{sucursal}:
   *   get:
   *     summary: Obtiene todas los Encuestas Excibicones que se pertenece al app y sucursal definidas
   *     description: Obtiene todas los Encuestas Excibicones que se pertenece al app y sucursal definidas.
   *     tags: [Encuestas]
   *     parameters:
   *       - in: path
   *         name: app
   *         required: true
   *         schema:
   *           type: string
   *           example: BACKUS
   *         description: Nombre de la aplicación.
   *       - in: path
   *         name: sucursal
   *         required: true
   *         schema:
   *           type: string
   *           example: VEGA TDA SANTA CLARA
   *         description: Nombre de la sucursal.
   *     responses:
   *       200:
   *         description: Respuesta exitosa
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     _id:
   *                       type: object
   *                       properties:
   *                         $oid:
   *                           type: string
   *                           example: "663089893a145432d45a2fb2"
   *                     app:
   *                       type: string
   *                       example: "BACKUS"
   *                     sucursal:
   *                       type: string
   *                       example: "VEGA TDA SANTA CLARA"
   *                     producto:
   *                       type: string
   *                       example: "Barbarian Magic Quinua_La Nena - bot - 330ml - 4p"
   *                     tipo:
   *                       type: string
   *                       example: "exibiciones"
   *                     fechaInicio:
   *                       type: string
   *                       format: date-time
   *                       example: "2024-05-05T00:00:00"
   *                     fechaFin:
   *                       type: string
   *                       format: date-time
   *                       example: "2024-05-12T23:59:59"
   *                     lisatExibiciones:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                             example: "6a6b8f1d-7a49-4c01-9d12-d962c35ac82d"
   *                           zona:
   *                             type: string
   *                             example: "Bebidas No Alcohólicas"
   *                           tipoExibicion:
   *                             type: string
   *                             example: "lateral"
   *                           fechaInicio:
   *                             type: string
   *                             format: date-time
   *                             example: "2024-05-05T00:00:00"
   *                           fechaFin:
   *                             type: string
   *                             format: date-time
   *                             example: "2024-05-06T00:00:00"
   *                           productos:
   *                             type: array
   *                             items:
   *                               type: string
   *                               example: "Corono - bot - 330ml -6p"
   *                           contraprestada:
   *                             type: boolean
   *                             example: true
   *                           foto:
   *                             type: string
   *                             format: uri
   *                             example: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.wong.pe%2Fpack-x3-sixpack-cerveza-corona-botella-330ml-1012623%2Fp%3Fidsku%3D39280375&psig=AOvVaw27SwHui41JhMe_Z-dZEoL4&ust=1714543715440000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCJDTkNCj6YUDFQAAAAAdAAAAABAE"
   */
  router.get(
    "/encuestasExhibiciones/:app/:sucursal",
    authMiddleware,
    encuestasController.getEncuestasExhibiciones
  );

  /**
   * @swagger
   * /api/v1/editarExhibiciones/{id}:
   *   put:
   *     summary: edita una exhibicion de la encuesta proporciada.
   *     description: edita una exhibicion de la encuesta proporciada.
   *     tags: [Encuestas]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           example: 663089893a145432d45a2fb2
   *         description: id de la encuesta de exhibicion.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               idExhibicion:
   *                 type: string
   *                 example: 6a6b8f1d-7a49-4c01-9d12-d962c35ac82d
   *                 description: id de la exhibicion de la encuesta.
   *               zona:
   *                 type: string
   *                 example: "Bebidas No Alcohólicas"
   *               tipoExibicion:
   *                 type: string
   *                 example: "lateral"
   *               fechaInicio:
   *                 type: string
   *                 format: date-time
   *                 example: "2024-05-05T00:00:00"
   *               fechaFin:
   *                 type: string
   *                 format: date-time
   *                 example: "2024-05-06T00:00:00"
   *               productos:
   *                 type: array
   *                 items:
   *                   type: string
   *                   example: "Corono - bot - 330ml -6p"
   *               contraprestada:
   *                 type: boolean
   *                 example: true
   *               foto:
   *                 type: string
   *                 format: uri
   *                 example: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.wong.pe%2Fpack-x3-sixpack-cerveza-corona-botella-330ml-1012623%2Fp%3Fidsku%3D39280375&psig=AOvVaw27SwHui41JhMe_Z-dZEoL4&ust=1714543715440000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCJDTkNCj6YUDFQAAAAAdAAAAABAE"
   *     responses:
   *       200:
   *         description: OK
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   */
  router.put(
    "/editarExhibiciones/:id",
    authMiddleware,
    encuestasController.updateEncuestasExhibiciones
  );

  /**
   * @swagger
   * /api/v1/encuestasIncidencias/{app}/{sucursal}:
   *   get:
   *     summary: Obtiene todas los Encuestas Incidencias que se pertenece al app y sucursal definidas
   *     description: Obtiene todas los Encuestas Incidencias que se pertenece al app y sucursal definidas.
   *     tags: [Encuestas]
   *     parameters:
   *       - in: path
   *         name: app
   *         required: true
   *         schema:
   *           type: string
   *           example: BACKUS
   *         description: Nombre de la aplicación.
   *       - in: path
   *         name: sucursal
   *         required: true
   *         schema:
   *           type: string
   *           example: VEGA TDA SANTA CLARA
   *         description: Nombre de la sucursal.
   *     responses:
   *       200:
   *         description: Respuesta exitosa
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 app:
   *                   type: string
   *                   example: "BACKUS"
   *                 sucursal:
   *                   type: string
   *                   example: "VEGA TDA SANTA CLARA"
   *                 tipo:
   *                   type: string
   *                   example: "incidencias"
   *                 fechaInicio:
   *                   type: string
   *                   format: date-time
   *                   example: "2024-05-05T00:00:00"
   *                 fechaFin:
   *                   type: string
   *                   format: date-time
   *                   example: "2024-05-12T23:59:59"
   *                 competencia:
   *                   type: object
   *                   properties:
   *                     activaciones:
   *                       type: boolean
   *                       example: false
   *                     foto:
   *                       type: string
   *                       example: ""
   *                     impulso:
   *                       type: boolean
   *                       example: false
   *                     muestreoDegustacion:
   *                       type: boolean
   *                       example: false
   *                     packs:
   *                       type: boolean
   *                       example: false
   *                     sampling:
   *                       type: boolean
   *                       example: false
   *                     ventaCruzada:
   *                       type: boolean
   *                       example: false
   *                     materialesVisibilidad:
   *                       type: boolean
   *                       example: false
   *                 relacionamiento:
   *                   type: object
   *                   properties:
   *                     gerenteTienda:
   *                       type: string
   *                       example: ""
   *                     jefeSeccion:
   *                       type: string
   *                       example: ""
   *                     jefeTienda:
   *                       type: string
   *                       example: ""
   *                     personalSeguridad:
   *                       type: string
   *                       example: ""
   *                 muebles:
   *                   type: object
   *                   properties:
   *                     asignacion:
   *                       type: array
   *                       items: {}
   *                     mantenimiento:
   *                       type: array
   *                       items: {}
   *                     recojo:
   *                       type: array
   *                       items: {}
   */
  router.get(
    "/encuestasIncidencias/:app/:sucursal",
    authMiddleware,
    encuestasController.getEncuestasIncidencias
  );

  /**
   * @swagger
   * /api/v1/editarIncidencias/{id}:
   *   put:
   *     summary: edita una incidencia de la encuesta proporcionada.
   *     description: edita una incidencia de la encuesta proporcionada.
   *     tags: [Encuestas]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           example: "663089893a145432d45a2fb2"
   *         description: id de la encuesta de incidencia.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               competencia:
   *                 type: object
   *                 properties:
   *                   activaciones:
   *                     type: boolean
   *                   foto:
   *                     type: string
   *                   impulso:
   *                     type: boolean
   *                   muestreoDegustacion:
   *                     type: boolean
   *                   packs:
   *                     type: boolean
   *                   sampling:
   *                     type: boolean
   *                   ventaCruzada:
   *                     type: boolean
   *                   materialesVisibilidad:
   *                     type: boolean
   *               relacionamiento:
   *                 type: object
   *                 properties:
   *                   gerenteTienda:
   *                     type: string
   *                   jefeSeccion:
   *                     type: string
   *                   jefeTienda:
   *                     type: string
   *                   personalSeguridad:
   *                     type: string
   *               muebles:
   *                 type: object
   *                 properties:
   *                   asignacion:
   *                     type: array
   *                     items: {}
   *                   mantenimiento:
   *                     type: array
   *                     items: {}
   *                   recojo:
   *                     type: array
   *                     items: {}
   *     responses:
   *       200:
   *         description: OK
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   */
  router.put(
    "/editarIncidencias/:id",
    authMiddleware,
    encuestasController.updateEncuestasIncidencias
  );

  /**
   * @swagger
   * /api/v1/encuestasStock/{app}/{sucursal}:
   *   get:
   *     summary: Obtiene todas los Encuestas stock que se pertenece al app y sucursal definidas
   *     description: Obtiene todas los Encuestas stock que se pertenece al app y sucursal definidas.
   *     tags: [Encuestas]
   *     parameters:
   *       - in: path
   *         name: app
   *         required: true
   *         schema:
   *           type: string
   *           example: BACKUS
   *         description: Nombre de la aplicación.
   *       - in: path
   *         name: sucursal
   *         required: true
   *         schema:
   *           type: string
   *           example: VEGA TDA SANTA CLARA
   *         description: Nombre de la sucursal.
   *     responses:
   *       200:
   *         description: Respuesta exitosa
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 app:
   *                   type: string
   *                   example: "BACKUS"
   *                 sucursal:
   *                   type: string
   *                   example: "VEGA TDA SANTA CLARA"
   *                 tipo:
   *                   type: string
   *                   example: "stock"
   *                 fechaInicio:
   *                   type: string
   *                   format: date-time
   *                   example: "2024-05-05T00:00:00"
   *                 fechaFin:
   *                   type: string
   *                   format: date-time
   *                   example: "2024-05-12T23:59:59"
   *                 productos:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       almacen:
   *                         type: integer
   *                         example: 0
   *                       exhibiciones:
   *                         type: integer
   *                         example: 0
   *                       gondola:
   *                         type: integer
   *                         example: 0
   *                       nombreProducto:
   *                         type: string
   *                         example: "Barbarian Ipa_Red Ale_Lima_Chaski Porter-Bot-330ml - 4p"
   */
  router.get(
    "/editaStock/:app/:sucursal",
    authMiddleware,
    encuestasController.getEncuestasStock
  );

  /**
   * @swagger
   * /api/v1/editaStock/{id}:
   *   put:
   *     summary: edita una stock de la encuesta proporcionada.
   *     description: edita una stock de la encuesta proporcionada.
   *     tags: [Encuestas]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           example: "663089893a145432d45a2fb2"
   *         description: id de la encuesta de stock.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               productos:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     almacen:
   *                       type: integer
   *                       example: 0
   *                     exhibiciones:
   *                       type: integer
   *                       example: 0
   *                     gondola:
   *                       type: integer
   *                       example: 0
   *                     nombreProducto:
   *                       type: string
   *                       example: "Barbarian Ipa_Red Ale_Lima_Chaski Porter-Bot-330ml - 4p"
   *     responses:
   *       200:
   *         description: OK
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   */
  router.put(
    "/editarStock/:id",
    authMiddleware,
    encuestasController.updateEncuestasStock
  );
  app.use("/api/v1", router);
};
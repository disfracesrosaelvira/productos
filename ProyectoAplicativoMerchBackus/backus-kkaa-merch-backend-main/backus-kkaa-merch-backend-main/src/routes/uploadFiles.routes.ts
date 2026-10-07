import express, { Router, Request, Response } from "express";
import UploadFilesController from "../controllers/uploadFiles.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import multer from "multer";

export const setRoutesUpdateFiles = (app: express.Application) => {
  const upload = multer();
  const uploadFiles: UploadFilesController = new UploadFilesController();

  // Crea un nuevo router
  const router: Router = express.Router();

  // Define las rutas en el router

  /**
   * @swagger
   * tags:
   *   - name: UploadFiles
   *     description: Rutas de CRUD subida de archivos
   */

  /**
   * @swagger
   * /api/v1/uploadFiles:
   *   post:
   *     summary: Subir archivo Excel
   *     description: Subir un archivo Excel con las encuestas de la semana.
   *     tags: [UploadFiles]
   *     consumes:
   *       - multipart/form-data
   *     parameters:
   *       - in: formData
   *         name: file
   *         description: Archivo Excel a subir
   *         required: true
   *         type: file
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Archivo Excel recibido y procesado correctamente.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Archivo Excel recibido y procesado correctamente.
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: object
   *                       properties:
   *                         acknowledged:
   *                           type: boolean
   *                           example: true
   *                         insertedCount:
   *                           type: integer
   *                           example: 2
   *                         insertedIds:
   *                           type: object
   *                           properties:
   *                             "0":
   *                               type: string
   *                               example: "662c96f9557e1efc6625c48e"
   *                             "1":
   *                               type: string
   *                               example: "662c96f9557e1efc6625c48f"
   */
  router.post( "/uploadFiles",  authMiddleware, upload.single("file"), (req: Request, res: Response) => { uploadFiles.upEncuestas(req, res); } );
  //subir fotos de precio
  router.post( "/photo-price/upload", authMiddleware, upload.single("file"), (req: Request, res: Response) => { uploadFiles.photoPriceUpload(req, res); } );
  //subir fotos all
  router.post("/photo/upload",authMiddleware,upload.single("file"),(req: Request, res: Response) => {uploadFiles.photoUpload(req, res);} );
  //eliminar fotos
  router.delete( "/photo/delete", authMiddleware, uploadFiles.photoDelete );

  app.use("/api/v1", router);
};

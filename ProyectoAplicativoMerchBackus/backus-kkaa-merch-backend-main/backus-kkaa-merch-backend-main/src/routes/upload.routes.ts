import express, { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import UploadController from '../controllers/upload.controller';
import multer from 'multer';

export const setRoutesUpload = (app: express.Application) => {
  const uploadController = new UploadController();
  const upload = multer();
  const router: Router = express.Router();

  router.post('/upload-data', authMiddleware, uploadController.uploadFile);
  router.post("/upload-data/file", authMiddleware, upload.single('file'), uploadController.processDataUpload);
  app.use('/api/v1', router);
}
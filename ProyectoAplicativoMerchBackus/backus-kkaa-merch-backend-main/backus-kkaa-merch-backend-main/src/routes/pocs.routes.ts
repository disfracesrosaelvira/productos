import express, { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import PocsController from '../controllers/pocs.controller';
import multer from "multer";

export const setRoutesPocs = (app: express.Application) => {
  const upload = multer();
  const pocsController = new PocsController();

  const router: Router = express.Router();

  // Define las rutas en el router
  router.post('/pocs', authMiddleware, pocsController.savePoc);
  router.get('/pocs', authMiddleware, pocsController.getPocs);
  router.get('/pocs/relevos', authMiddleware, pocsController.getPocsRelevos);
  router.get('/pocs/filters', authMiddleware, pocsController.getPocsFilters);
  router.get('/pocs/filters-dashboard', authMiddleware, pocsController.getFiltersDashboard);
  router.get('/pocs/check-name', authMiddleware, pocsController.getCheckName);
  router.get('/pocs/check-poc-cadena', authMiddleware, pocsController.getCheckPocCadena);
  router.get('/pocs/check-poc-backus', authMiddleware, pocsController.getCheckPocBackus);
  router.get('/pocs/check-name-planning', authMiddleware, pocsController.getCheckNamePlanning);
  router.get('/pocs/list-supervisors', authMiddleware, pocsController.getSupervisors);
  router.get('/pocs-no-paginate', authMiddleware, pocsController.getPocsNoPaginate);
  router.get('/pocs/:id', authMiddleware, pocsController.getPocById);
  router.patch('/pocs/update-supervisor/:nombre_sv', authMiddleware, pocsController.updateSupervisor);
  router.patch('/pocs/:id', authMiddleware, pocsController.updatePoc);
  router.post("/pocs/upload-excel-pocs-massive-load", authMiddleware, upload.single('file'), pocsController.uploadExcelPocsMassiveLoad);
  router.post("/pocs/varify-excel-pocs-massive-load", authMiddleware, upload.single('file'), pocsController.varifyExcelPocsMassiveLoad);


  app.use('/api/v1', router);
};

import express, { Router, Request, Response } from "express";
import { authMiddleware } from '../middlewares/auth.middleware';
import ExhibicionController from '../controllers/exhibicion.controller';
import multer from 'multer';

export const setRoutesExhibicion = (app: express.Application) => {
  const upload = multer();
  const exhibicionController = new ExhibicionController();

  const router: Router = express.Router();

  // Exhibiciones Contraprestadas
  router.get('/exhibicion/contraprestada', authMiddleware, exhibicionController.getExhibicionesContraprestadas);
  router.get('/exhibicion/contraprestada/filters', authMiddleware, exhibicionController.getFiltersContraprestada); //asas
  router.get('/exhibicion/contraprestada/monthly-supervisor-vigente-counts', authMiddleware, exhibicionController.getExhibitionContraMonthlySupervisorVigenteCounts);
  router.get('/exhibicion/contraprestada/counts-by-type-month-and-week', authMiddleware, exhibicionController.getExhibitionContraprestadaCountsByTypeMonthAndWeek);
  router.get('/exhibicion/contraprestada/counts-by-brand-month-and-week', authMiddleware, exhibicionController.getExhibitionContraprestadaCountsByBrandMonthAndWeek);
  router.get('/exhibicion/contraprestada/counts-by-brand-and-description-month-and-week', authMiddleware, exhibicionController.getExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek);
  router.get('/exhibicion/contraprestada-offline', authMiddleware, exhibicionController.getExhibicionesContraprestadasOffline);
  router.get('/exhibicion/contraprestada/alertas-vigente', authMiddleware, exhibicionController.getExhibicionesContraprestadasAlertasVigente);
  router.post("/exhibicion/contraprestada/bulk-upload",  authMiddleware, exhibicionController.exhibicionesContraprestadasBullUpload);
  router.post("/exhibicion/contraprestada/validate-records-database",  authMiddleware, upload.single("file"), (req: Request, res: Response) => { exhibicionController.exhibicionesContraprestadaValidateRecordsDatabse(req, res);});
  router.put("/exhibicion/contraprestada/:id",  authMiddleware, upload.single("file"), (req: Request, res: Response) => { exhibicionController.updateExhibicionesContraprestadas(req, res);} );

  // Exhibiciones Adicionales
  router.post('/exhibicion/save', authMiddleware, upload.single("file"),(req: Request, res: Response) => { exhibicionController.saveExhibicion(req, res);} );
  router.get('/exhibicion/adicionales', authMiddleware, exhibicionController.getExhibicionesAdionales);
  router.get('/exhibicion/adicionales/filters', authMiddleware, exhibicionController.getFiltersAdicional); //asas
  router.get('/exhibicion/adicional/counts-by-type-month-and-week', authMiddleware, exhibicionController.getExhibitionAdditionalCountsByTypeMonthAndWeek);
  router.get('/exhibicion/adicional/counts-by-brand-month-and-week', authMiddleware, exhibicionController.getExhibitionAdditionalCountsByBrandMonthAndWeek);
  router.get('/exhibicion/adicional/counts-by-brand-and-description-month-and-week', authMiddleware, exhibicionController.getExhibitionAdditionalCountsByBrandAndDescriptionByMonthAndWeek);
  router.get('/exhibicion/adicional/vigentes', authMiddleware, exhibicionController.getExhibicionesAdionalesVigente);
  router.get('/exhibicion/adicional/renovables', authMiddleware, exhibicionController.getExhibicionesAdionalesRenovable);
  router.get('/exhibicion/adicional/renovables-offline', authMiddleware, exhibicionController.getExhibicionesAdionalesRenovableOffline);
  router.get('/exhibicion/adicional/productos', authMiddleware, exhibicionController.getProductoAllAdicional);
  router.put("/exhibicion/upload-img",  authMiddleware, upload.single("file"), (req: Request, res: Response) => { exhibicionController.uploadFile(req, res);} );
  router.delete( "/exhibicion/adicional/delete", authMiddleware, exhibicionController.deleteExhibicionAdicional);
  router.patch('/exhibicion/adicional/update/:id', authMiddleware, exhibicionController.updateExhibicionAdicional);
  
  // Exhibiciones Competencia
  router.post('/exhibicion/competencia', authMiddleware, exhibicionController.saveExhibicionCompetencia);
  router.get('/exhibicion/competencias', authMiddleware, exhibicionController.getExhibicionesCompetencia);
  router.get('/exhibicion/competencias/filters', authMiddleware, exhibicionController.getFiltersCompetencia); //asas
  router.get('/exhibicion/competencia/counts-by-type-month-and-week', authMiddleware, exhibicionController.getExhibitionCompetenciaCountsByTypeMonthAndWeek);
  router.get('/exhibicion/competencia/counts-by-brand-month-and-week', authMiddleware, exhibicionController.getExhibitionCompetenciaCountsByBrandMonthAndWeek);
  router.get('/exhibicion/competencia/counts-by-brand-and-description-month-and-week', authMiddleware, exhibicionController.getExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek);
  router.get('/exhibicion/competencia/vigentes', authMiddleware, exhibicionController.getExhibicionesCompetenciaVigente);
  router.get('/exhibicion/competencia/renovables', authMiddleware, exhibicionController.getExhibicionesCompetenciaRenovable);
  router.get('/exhibicion/competencia/renovables-offline', authMiddleware, exhibicionController.getExhibicionesCompetenciaRenovableOffline);
  router.get('/exhibicion/competencia/productos', authMiddleware, exhibicionController.getProductoAllCompetencia);
  router.delete( "/exhibicion/competencia/delete", authMiddleware, exhibicionController.deleteExhibicionCompetencia);
  router.patch('/exhibicion/competencia/update/:id', authMiddleware, exhibicionController.updateExhibicionCompetencia);

  app.use('/api/v1', router);
};

import express, { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import IncidenciaController from '../controllers/incidencia.controller';

export const setRoutesIncidencia = (app: express.Application) => {
  const incidenciaController = new IncidenciaController();

  const router: Router = express.Router();

  // Incidencia Competencia
  router.post('/incidencia/competencia', authMiddleware, incidenciaController.saveCompetencia);
  router.get('/incidencia/competencias', authMiddleware, incidenciaController.getIncidenciaCompetencia);

  // Incidencia Muebles Asignacion
  router.post('/incidencia/mueble/asignacion', authMiddleware, incidenciaController.saveMuebleAsignacion);
  router.get('/incidencia/mueble/asignaciones', authMiddleware, incidenciaController.getIncidenciaMuebleAsignacion);
  
  // Incidencia Muebles Mantenimiento
  router.post('/incidencia/mueble/mantenimiento', authMiddleware, incidenciaController.saveMuebleMantenimiento);
  router.get('/incidencia/mueble/mantenimientos', authMiddleware, incidenciaController.getIncidenciaMuebleMantenimiento);
  
  // Incidencia Muebles Recojos
  router.post('/incidencia/mueble/recojo', authMiddleware, incidenciaController.saveMuebleRecojo);
  router.get('/incidencia/mueble/recojos', authMiddleware, incidenciaController.getIncidenciaMuebleRecojo);
  
  app.use('/api/v1', router);
};

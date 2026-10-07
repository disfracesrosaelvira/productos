import express, { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import DownloadFilesController from "../controllers/downloadFiles.controller";
export const setRoutesDownloadFiles = (app: express.Application) => {
  const downloadFiles: DownloadFilesController = new DownloadFilesController();
  // Crea un nuevo router
  const router: Router = express.Router();

  router.get( "/download/precio", authMiddleware, downloadFiles.downloadExcelFilePrecio);
  router.get( "/download/adicional", authMiddleware, downloadFiles.downloadExcelFileAdicional);
  router.get( "/download/contraprestada", authMiddleware, downloadFiles.downloadExcelFileContraprestada);
  router.get( "/download/competencia", authMiddleware, downloadFiles.downloadExcelFileCompetencia);
  router.get( "/download/frente", authMiddleware, downloadFiles.downloadExcelFileFrente);
  router.get( "/download/incidences", authMiddleware, downloadFiles.downloadExcelFileIncidences);
  router.get( "/download/stock", authMiddleware, downloadFiles.downloadExcelFileStock);
  router.get( "/download/sku", authMiddleware, downloadFiles.downloadExcelFileSku);
  router.get( "/download/poc", authMiddleware, downloadFiles.downloadExcelFilePoc);
  router.get( "/download/commercial-structure", authMiddleware, downloadFiles.downloadExcelFileEstructureComercial);
  router.get( "/download/usuario", authMiddleware, downloadFiles.downloadExcelFileUsuario);
  router.get( "/download/precio/averages-by-brand-and-description-month-and-week", authMiddleware, downloadFiles.downloadExcelFilePrecioAveragesByBrandAndDescriptionByMonthAndWeek);
  router.get( "/download/precio/counts-by-brand-and-description-month-and-week", authMiddleware, downloadFiles.downloadExcelFilePrecioCountsByBrandAndDescriptionByMonthAndWeek);
  router.get( "/download/precio/stores-with-promotional-price", authMiddleware, downloadFiles.downloadExcelFilePrecioStoresWithProductsPromotional);
  router.get( "/download/frente/counts-by-brand-month-and-week", authMiddleware, downloadFiles.downloadExcelFileFrenteCountsByBrandMonthAndWeek);
  router.get( "/download/stock/average-by-description-month-and-week", authMiddleware, downloadFiles.downloadExcelFileStockAverageByDescriptionMonthAndWeek);
  router.get( "/download/stock/separate-average-by-description-month-and-week", authMiddleware, downloadFiles.downloadExcelFileStockSeparateAverageByDescriptionMonthAndWeek);

  router.get( "/download/exhibicion/competencia/counts-by-type-month-and-week", authMiddleware, downloadFiles.downloadExcelFileExhibitionCompetenciaCountsByTypeMonthAndWeek);
  router.get( "/download/exhibicion/competencia/counts-by-brand-month-and-week", authMiddleware, downloadFiles.downloadExcelFileExhibitionCompetenciaCountsByBrandMonthAndWeek);
  router.get( "/download/exhibicion/competencia/counts-by-brand-and-description-month-and-week", authMiddleware, downloadFiles.downloadExcelFileExhibitionCompetenciaCountsByBrandAndDescriptionByMonthAndWeek);
  router.get( "/download/exhibicion/adicional/counts-by-type-month-and-week", authMiddleware, downloadFiles.downloadExcelFileExhibitionAdicionalCountsByTypeMonthAndWeek);
  router.get( "/download/exhibicion/adicional/counts-by-brand-month-and-week", authMiddleware, downloadFiles.downloadExcelFileExhibitionAdicionalCountsByBrandMonthAndWeek);
  router.get( "/download/exhibicion/adicional/counts-by-brand-and-description-month-and-week", authMiddleware, downloadFiles.downloadExcelFileExhibitionAdicionalCountsByBrandAndDescriptionByMonthAndWeek);
  router.get( "/download/exhibicion/contraprestada/counts-by-type-month-and-week", authMiddleware, downloadFiles.downloadExcelFileExhibitionContraprestadaCountsByTypeMonthAndWeek);
  router.get( "/download/exhibicion/contraprestada/counts-by-brand-month-and-week", authMiddleware, downloadFiles.downloadExcelFileExhibitionContraprestadaCountsByBrandMonthAndWeek);
  router.get( "/download/exhibicion/contraprestada/counts-by-brand-and-description-month-and-week", authMiddleware, downloadFiles.downloadExcelFileExhibitionContraprestadaCountsByBrandAndDescriptionByMonthAndWeek);
  router.get( "/download/exhibicion/contraprestada/monthly-supervisor-vigente-counts", authMiddleware, downloadFiles.downloadExcelFileExhibitionContraprestadaMonthlySupervisorVigenteCounts);
  router.get( "/download/excel-plantilla", authMiddleware, downloadFiles.downloadExcelPlantilla);
  router.get( "/download/backup", authMiddleware, downloadFiles.generateBackup);
  app.use("/api/v1", router);
};

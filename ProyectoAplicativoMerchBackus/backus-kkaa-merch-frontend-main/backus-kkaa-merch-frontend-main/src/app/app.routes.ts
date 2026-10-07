import { Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './guard/auth.guard';
import { AppBackusComponent } from './pages/app-backus/app-backus.component';
import { ClienteComponent } from './pages/cliente/cliente.component';
import { MenuPrecioComponent } from './pages/encuesta/menu-precio/menu-precio.component';
import { MenuExhibicionesComponent } from './pages/encuesta/menu-exhibiciones/menu-exhibiciones.component';
// import { AdminComponent } from './pages/admin/admin.component';
import { EncuestaPrecioComponent } from './pages/encuesta/menu-precio/encuesta-precio/encuesta-precio.component';
import { FrentesComponent } from './pages/encuesta/frentes/frentes.component';
import { MenuIncidenciasComponent } from './pages/encuesta/menu-incidencias/menu-incidencias.component';
import { StockComponent } from './pages/encuesta/stock/stock.component';
import { IncidenciasMueblesComponent } from './pages/encuesta/menu-incidencias/incidencias-muebles/incidencias-muebles.component';
import { IncidenciasCompetenciaComponent } from './pages/encuesta/menu-incidencias/incidencias-competencia/incidencias-competencia.component';
import { MenuComponent } from './pages/menu/menu.component';
import { HomeComponent } from './pages/home/home.component';
import { IncidenciasNuevoComponent } from './pages/encuesta/menu-incidencias/incidencias-nuevo/incidencias-nuevo.component';
import { ExhibicionesContraprestadasComponent } from './pages/encuesta/menu-exhibiciones/exhibiciones-contraprestadas/exhibiciones-contraprestadas.component';
import { ExhibicionesCompetenciaComponent } from './pages/encuesta/menu-exhibiciones/exhibiciones-competencia/exhibiciones-competencia.component';
import { ExhibicionesAdicionalesComponent } from './pages/encuesta/menu-exhibiciones/exhibiciones-adicionales/exhibiciones-adicionales.component';
import { AppPernodComponent } from './pages/app-pernod/app-pernod.component';
import { IncidenciasMantenimientoComponent } from './pages/encuesta/menu-incidencias/incidencias-mantenimiento/incidencias-mantenimiento.component';
import { IncidenciasRecojoComponent } from './pages/encuesta/menu-incidencias/incidencias-recojo/incidencias-recojo.component';
import { IncidenciasAsignacionComponent } from './pages/encuesta/menu-incidencias/incidencias-asignacion/incidencias-asignacion.component';
import { UsersComponent } from './pages/users/users.component';
import { PriceReportsComponent } from './pages/reports/price-reports/price-reports.component';
import { StockReportsComponent } from './pages/reports/stock-reports/stock-reports.component';
import { FrenteReportsComponent } from './pages/reports/frente-reports/frente-reports.component';
import { IncidenceReportsComponent } from './pages/reports/incidence-reports/incidence-reports.component';
import Constantes from './shared/constants/contants';
import { ExhibitionContraprestadaUploadComponent } from './pages/carga/exhibiciones-contraprestada-upload/exhibiciones-contraprestada-upload.component';
import { ExhibitionReportsComponent } from './pages/reports/exhibition-reports/exhibition-reports.component';
import { SkuReportsComponent } from './pages/reports/sku-reports/sku-reports.component';
import { PocReportsComponent } from './pages/reports/poc-reports/poc-reports.component';
import { CommercialStructureReportsComponent } from '@pages/reports/commercial-structure-reports/commercial-structure-reports.component';
import { ExhibitionCompetenciaDashboardComponent } from '@pages/reports/exhibition-competencia-dashboard/exhibition-competencia-dashboard.component';
import { ExhibitionDashboardComponent } from '@pages/reports/exhibition-dashboard/exhibition-dashboard.component';
import { ConfigValueReportsComponent } from '@pages/reports/config-value-reports/config-value-reports.component';
import { PrecioDashboardComponent } from '@pages/reports/precio-dashboard/precio-dashboard.component';
import { FrenteDashboardComponent } from '@pages/reports/frente-dashboard/frente-dashboard.component';
import { StockDashboardComponent } from '@pages/reports/stock-dashboard/stock-dashboard.component';
import { PocsRelevosComponent } from '@pages/reports/pocs-relevos/pocs-relevos.component';
import { DatabaseCopyCollectionsComponent } from '@pages/reports/database-copy-collections/database-copy-collections.component';
// import { FrentesPernodComponent } from '@pages/encuesta/pernod/frentes/frentes.component';

export const routes: Routes = [
  {
    path: Constantes.ROUTES._LOGIN,
    component: LoginComponent,
  },
  { path: '', redirectTo: Constantes.ROUTES._HOME, pathMatch: 'full' },
  {
    path: '',
    component: MenuComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: Constantes.ROUTES._HOME, pathMatch: 'full' },
      { path: Constantes.ROUTES._HOME, component: HomeComponent, canActivate: [AuthGuard] },
      // reports
      { path: Constantes.ROUTES.REPORTS._EXHIBITION, component: ExhibitionReportsComponent, canActivate: [AuthGuard] },
      { path: Constantes.ROUTES.REPORTS._PRICE, component: PriceReportsComponent, canActivate: [AuthGuard] },
      { path: Constantes.ROUTES.REPORTS._FRENTE, component: FrenteReportsComponent, canActivate: [AuthGuard] },
      { path: Constantes.ROUTES.REPORTS._INCIDENCE, component: IncidenceReportsComponent, canActivate: [AuthGuard] },
      { path: Constantes.ROUTES.REPORTS._STOCK, component: StockReportsComponent, canActivate: [AuthGuard] },
      { path: Constantes.ROUTES.REPORTS._SKU, component: SkuReportsComponent, canActivate: [AuthGuard] },
      { path: Constantes.ROUTES.REPORTS._POC, component: PocReportsComponent, canActivate: [AuthGuard] },
      { path: Constantes.ROUTES.REPORTS._ESTRUCTURA_COMERCIAL, component: CommercialStructureReportsComponent, canActivate: [AuthGuard] },
      { path: Constantes.ROUTES.REPORTS._EXHIBITION_DASHBOARD, component: ExhibitionDashboardComponent, canActivate: [AuthGuard] },
      { path: Constantes.ROUTES.REPORTS._EXHIBITION_COMPETENCIA_DASHBOARD, component: ExhibitionCompetenciaDashboardComponent, canActivate: [AuthGuard] },
      { path: Constantes.ROUTES.REPORTS._PRECIO_DASHBOARD, component: PrecioDashboardComponent, canActivate: [AuthGuard] },
      { path: Constantes.ROUTES.REPORTS._FRENTE_DASHBOARD, component: FrenteDashboardComponent, canActivate: [AuthGuard] },
      { path: Constantes.ROUTES.REPORTS._STOCK_DASHBOARD, component: StockDashboardComponent, canActivate: [AuthGuard] },
      { path: Constantes.ROUTES.REPORTS._CONFIG_VALUE, component: ConfigValueReportsComponent, canActivate: [AuthGuard] },
      { path: Constantes.ROUTES.REPORTS._POCS_RELEVADOS, component: PocsRelevosComponent, canActivate: [AuthGuard] },
      { path: Constantes.ROUTES.REPORTS._BACKUP, component: DatabaseCopyCollectionsComponent, canActivate: [AuthGuard] },
      // reports
      //Uploads
      { path: Constantes.ROUTES.UPLOAD._CONTRAPRESTADA, component: ExhibitionContraprestadaUploadComponent, canActivate: [AuthGuard] },
      //
      { path: Constantes.ROUTES._USERS, component: UsersComponent, canActivate: [AuthGuard] },
      { path: Constantes.ROUTES._ADMIN, component: HomeComponent, canActivate: [AuthGuard] },
      {
        path: Constantes.ROUTES.APP.BK,
        component: AppBackusComponent,
        canActivate: [AuthGuard],
        children: [
          { path: Constantes.ROUTES._CLIENTE_BK, component: ClienteComponent, canActivate: [AuthGuard] },
          {
            path: Constantes.ROUTES._ENCUESTA,
            children: [
              {
                path: Constantes.ROUTES.ENCUESTA._PRECIO,
                component: MenuPrecioComponent,
                canActivate: [AuthGuard],
                children: [
                  { path: Constantes.ROUTES.ENCUESTA.PRECIO.DETALLE, component: EncuestaPrecioComponent, canActivate: [AuthGuard] },
                ]
              },
              {
                path: Constantes.ROUTES.ENCUESTA._EXHIBICIONES,
                component: MenuExhibicionesComponent,
                canActivate: [AuthGuard],
                children: [
                  { path: Constantes.ROUTES.ENCUESTA.EXHIBICIONES.CONTRAPRESTADAS, component: ExhibicionesContraprestadasComponent, canActivate: [AuthGuard] },
                  { path: Constantes.ROUTES.ENCUESTA.EXHIBICIONES.ADICIONALES, component: ExhibicionesAdicionalesComponent, canActivate: [AuthGuard] },
                  { path: Constantes.ROUTES.ENCUESTA.EXHIBICIONES.COMPETENCIA, component: ExhibicionesCompetenciaComponent, canActivate: [AuthGuard] },
                ]
              },
              { path: Constantes.ROUTES.ENCUESTA._FRENTES, component: FrentesComponent, canActivate: [AuthGuard] },
              {
                path: Constantes.ROUTES.ENCUESTA._INCIDENCIA,
                component: MenuIncidenciasComponent,
                canActivate: [AuthGuard],
                children: [
                  { path: Constantes.ROUTES.ENCUESTA.INCIDENCIA.COMPETENCIA, component: IncidenciasCompetenciaComponent, canActivate: [AuthGuard] },
                  { path: Constantes.ROUTES.ENCUESTA.INCIDENCIA.MUEBLES, component: IncidenciasMueblesComponent, canActivate: [AuthGuard] },
                  {
                    path: Constantes.ROUTES.ENCUESTA.INCIDENCIA.NUEVO,
                    component: IncidenciasNuevoComponent,
                    canActivate: [AuthGuard],
                    children: [
                      { path: Constantes.ROUTES.ENCUESTA.INCIDENCIA.MANTENIMIENTO, component: IncidenciasMantenimientoComponent, canActivate: [AuthGuard] },
                      { path: Constantes.ROUTES.ENCUESTA.INCIDENCIA.RECOJO, component: IncidenciasRecojoComponent, canActivate: [AuthGuard] },
                      { path: Constantes.ROUTES.ENCUESTA.INCIDENCIA.ASIGNACION, component: IncidenciasAsignacionComponent, canActivate: [AuthGuard] },
                    ]
                  },
                ]
              },
              { path: Constantes.ROUTES.ENCUESTA._STOCK, component: StockComponent, canActivate: [AuthGuard] }
            ]
          },
        ]
      },
      {
        path: Constantes.ROUTES.APP.PERNORP,
        component: AppPernodComponent,
        canActivate: [AuthGuard],
        children: [
          { path: Constantes.ROUTES._CLIENTE_BK, component: ClienteComponent, canActivate: [AuthGuard] },
          {
            path: Constantes.ROUTES._ENCUESTA,
            children: [
              {
                path: Constantes.ROUTES.ENCUESTA._PRECIO,
                component: MenuPrecioComponent,
                canActivate: [AuthGuard],
                children: [
                  { path: Constantes.ROUTES.ENCUESTA.PRECIO.DETALLE, component: EncuestaPrecioComponent, canActivate: [AuthGuard] },
                ]
              },
              {
                path: Constantes.ROUTES.ENCUESTA._EXHIBICIONES,
                component: MenuExhibicionesComponent,
                canActivate: [AuthGuard],
                children: [
                  { path: Constantes.ROUTES.ENCUESTA.EXHIBICIONES.CONTRAPRESTADAS, component: ExhibicionesContraprestadasComponent, canActivate: [AuthGuard] },
                  { path: Constantes.ROUTES.ENCUESTA.EXHIBICIONES.ADICIONALES, component: ExhibicionesAdicionalesComponent, canActivate: [AuthGuard] },
                  { path: Constantes.ROUTES.ENCUESTA.EXHIBICIONES.COMPETENCIA, component: ExhibicionesCompetenciaComponent, canActivate: [AuthGuard] },
                ]
              },
              // { path: Constantes.ROUTES.ENCUESTA._FRENTES, component: FrentesPernodComponent, canActivate: [AuthGuard] },
              { path: Constantes.ROUTES.ENCUESTA._FRENTES, component: FrentesComponent, canActivate: [AuthGuard] },
              {
                path: Constantes.ROUTES.ENCUESTA._INCIDENCIA,
                component: MenuIncidenciasComponent,
                canActivate: [AuthGuard],
                children: [
                  { path: Constantes.ROUTES.ENCUESTA.INCIDENCIA.COMPETENCIA, component: IncidenciasCompetenciaComponent, canActivate: [AuthGuard] },
                  { path: Constantes.ROUTES.ENCUESTA.INCIDENCIA.MUEBLES, component: IncidenciasMueblesComponent, canActivate: [AuthGuard] },
                  {
                    path: Constantes.ROUTES.ENCUESTA.INCIDENCIA.NUEVO,
                    component: IncidenciasNuevoComponent,
                    canActivate: [AuthGuard],
                    children: [
                      { path: Constantes.ROUTES.ENCUESTA.INCIDENCIA.MANTENIMIENTO, component: IncidenciasMantenimientoComponent, canActivate: [AuthGuard] },
                      { path: Constantes.ROUTES.ENCUESTA.INCIDENCIA.RECOJO, component: IncidenciasRecojoComponent, canActivate: [AuthGuard] },
                      { path: Constantes.ROUTES.ENCUESTA.INCIDENCIA.ASIGNACION, component: IncidenciasAsignacionComponent, canActivate: [AuthGuard] },
                    ]
                  },
                ]
              },
              { path: Constantes.ROUTES.ENCUESTA._STOCK, component: StockComponent, canActivate: [AuthGuard] }
            ]
          },
        ]
      }
    ],
  },
  {
    path: '',
    redirectTo: Constantes.ROUTES._LOGIN,
    pathMatch: 'full',
  },

  {
    path: '**',
    redirectTo: Constantes.ROUTES._ADMIN
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }

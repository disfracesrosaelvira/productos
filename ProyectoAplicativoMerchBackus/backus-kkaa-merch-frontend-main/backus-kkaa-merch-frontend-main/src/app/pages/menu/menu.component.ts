import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { MenuService } from './menu.service';
import Constantes from '../../shared/constants/contants';
import { SharedDataService } from '../app-backus/shared-data.service';
import { NetworkService } from '@shared/services/network.service';
import { environment } from 'src/app/environments/environment';
import { UtilService } from '@shared/services/util.service';
import { AuthService } from '@shared/services/auth.service';
import { ProgressService } from '../../shared/services/progress.service';
import { StoreOfflineService } from '@shared/services/offline.service';
import { SyncService } from '@shared/services/sync.service';
import { NzModalModule } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzProgressModule,
    NzDividerModule,
    NzDropDownModule,
    RouterModule,
    NzLayoutModule,
    NzPageHeaderModule,
    NzSpaceModule,
    NzIconModule,
    NzAvatarModule,
    NzDrawerModule,
    NzButtonModule,
    NzModalModule,
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent {
  selectMenu: string = '';
  user: any = {};
  selectUser: any = {};
  loadingOffline = false;
  disableBtnSync = false;
  isCollapsed: boolean = false;
  entityName: string = '';
  entityId = localStorage.getItem('empresa_id');
  empresa_id: any = localStorage.getItem('empresa_id') || 'BK';
  routeCliente: any =
    this.empresa_id == 'BK'
      ? Constantes.ROUTES.APP.BK
      : Constantes.ROUTES.APP.PERNORP;
  private worker: Worker | undefined;
  private workerUser: Worker | undefined;
  progressOffline = 0;
  countCompletedSku = 0;
  countCompletedPoc = 0;
  countCompletedConfigValue = 0;
  countCompletedExhiContraprestada = 0;
  countCompletedExhiAdicionalRenovacion = 0;
  countCompletedExhiCompetenciaRenovacion = 0;
  isOnline = true;
  totalSync = 0;
  encuestasRegistradas: any[] = [];
  encuestasRegistradasActivas: any[] = [];
  isSaveEncuesta: boolean = false;
  isCompletePoc: boolean = false;
  isCompleteSku: boolean = false;
  isCompleteConfigValue: boolean = false;
  isCompleteUser: boolean = false;
  isCompleteExhiContraprestada: boolean = false;
  isCompleteEncuestaFrente: boolean = false;
  isCompleteEncuestaStock: boolean = false;
  isCompleteEncuestaPrecio: boolean = false;
  isCompleteEncuestaExhiAdicional: boolean = false;
  isCompleteEncuestaExhiCompetencia: boolean = false;
  isCompleteExhiCompetenciaRenovacion: boolean = false;
  isCompleteExhiAdicionalRenovacion: boolean = false;

  isCompleteEncuestaExhiAdicionalRenovacion: boolean = false;
  isCompleteEncuestaExhiCompetenciaRenovacion: boolean = false;

  isCompleteEncuestaInciCompetencia: boolean = false;
  isCompleteEncuestaInciMuebleAsignacion: boolean = false;
  isCompleteEncuestaInciMuebleRecojo: boolean = false;
  isCompleteEncuestaInciMuebleMantenimiento: boolean = false;
  isModalDownloadVisible = false;
  isModalUploadVisible = false;

  constructor(
    private menuService: MenuService,
    private router: Router,
    private sharedDataService: SharedDataService,
    private notification: NzNotificationService,
    private networkService: NetworkService,
    private utilService: UtilService,
    private authService: AuthService,
    private progressService: ProgressService,
    private offlineService: StoreOfflineService,
    private syncService: SyncService
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const route = event.urlAfterRedirects.slice(1).split('/')[0];
        if (route === 'app-backus') {
          this.entityName = 'Backus';
        } else if (route === 'app-pernod') {
          this.entityName = 'Pernod';
        } else {
          this.entityName = '';
        }
      }
    });

    this.selectUser = this.utilService.getUserFromLocalStorage();
  }

  ngOnInit() {
    this.selectMenu = '';
    this.selectMenu = this.menuService.typeApp;
    const userStorage = localStorage.getItem('user');
    this.user = userStorage ? JSON.parse(userStorage) : null;

    this.networkService.isOnline.subscribe(async (isOnline) => {
      console.log('isOnline', isOnline);
      this.isOnline = isOnline;
      // if (this.isOnline) {
        this.encuestasRegistradas = await this.utilService.getTotalEncuestas();
        this.encuestasRegistradasActivas = this.encuestasRegistradas.filter(
          (encuesta: any) => encuesta.total > 0
        );
        console.log('array de encuestas', this.encuestasRegistradas);
        this.totalSync = this.encuestasRegistradas.reduce(
          (acumulador, objetoActual) => acumulador + objetoActual.total,
          0
        );
      // }
    });

    this.progressService.progress$.subscribe((progress) => {
      this.progressOffline = progress;
    });

    this.progressService.isSaveEncuesta$.subscribe(async (isSaveEncuesta) => {
      if (isSaveEncuesta) {
        this.isSaveEncuesta = isSaveEncuesta;
        this.encuestasRegistradas = await this.utilService.getTotalEncuestas();
        this.encuestasRegistradasActivas = this.encuestasRegistradas.filter(
          (encuesta: any) => encuesta.total > 0
        );
        this.totalSync  = this.encuestasRegistradas.reduce(
          (acumulador, objetoActual) => acumulador + objetoActual.total,
          0
        );
      }
    });

    this.progressService.isCompleteSku$.subscribe((isCompleteSku) => {
      this.isCompleteSku = isCompleteSku;
    });

    this.progressService.countCompletedSku$.subscribe((countCompletedSku) => {
      console.log('countCompletedSku', countCompletedSku);
      this.countCompletedSku = countCompletedSku;
    });

    this.progressService.isCompletePoc$.subscribe((isCompletePoc) => {
      this.isCompletePoc = isCompletePoc;
    });
    this.progressService.countCompletedPoc$.subscribe((countCompletedPoc) => {
      this.countCompletedPoc = countCompletedPoc;
    });

    this.progressService.isCompleteUser$.subscribe((isCompleteUser) => {
      this.isCompleteUser = isCompleteUser;
    });

    this.progressService.isCompleteExhiContraprestada$.subscribe(
      (isCompleteExhiContraprestada) => {
        this.isCompleteExhiContraprestada = isCompleteExhiContraprestada;
      }
    );

    this.progressService.countCompletedExhiContraprestada$.subscribe(
      (countCompletedExhiContraprestada) => {
        this.countCompletedExhiContraprestada =
          countCompletedExhiContraprestada;
      }
    );

    this.progressService.isCompleteConfigValue$.subscribe(
      (isCompleteConfigValue) => {
        this.isCompleteConfigValue = isCompleteConfigValue;
      }
    );
    this.progressService.countCompletedConfigValue$.subscribe(
      (countCompletedConfigValue) => {
        this.countCompletedConfigValue = countCompletedConfigValue;
      }
    );

    this.progressService.isCompleteEncuestaFrente$.subscribe(
      (isCompleteEncuestaFrente) => {
        this.isCompleteEncuestaFrente = isCompleteEncuestaFrente;
      }
    );

    this.progressService.isCompleteEncuestaStock$.subscribe(
      (isCompleteEncuestaStock) => {
        this.isCompleteEncuestaStock = isCompleteEncuestaStock;
      }
    );

    this.progressService.isCompleteEncuestaPrecio$.subscribe(
      (isCompleteEncuestaPrecio) => {
        this.isCompleteEncuestaPrecio = isCompleteEncuestaPrecio;
      }
    );

    this.progressService.isCompleteEncuestaExhiAdicional$.subscribe(
      (isCompleteEncuestaExhiAdicional) => {
        this.isCompleteEncuestaExhiAdicional = isCompleteEncuestaExhiAdicional;
      }
    );

    this.progressService.isCompleteEncuestaExhiCompetencia$.subscribe(
      (isCompleteEncuestaExhiCompetencia) => {
        this.isCompleteEncuestaExhiCompetencia =
          isCompleteEncuestaExhiCompetencia;
      }
    );

    this.progressService.isCompleteEncuestaInciCompetencia$.subscribe(
      (isCompleteEncuestaInciCompetencia) => {
        this.isCompleteEncuestaInciCompetencia =
          isCompleteEncuestaInciCompetencia;
      }
    );

    this.progressService.isCompleteEncuestaInciMuebleAsignacion$.subscribe(
      (isCompleteEncuestaInciMuebleAsignacion) => {
        this.isCompleteEncuestaInciMuebleAsignacion =
          isCompleteEncuestaInciMuebleAsignacion;
      }
    );

    this.progressService.isCompleteEncuestaInciMuebleRecojo$.subscribe(
      (isCompleteEncuestaInciMuebleRecojo) => {
        this.isCompleteEncuestaInciMuebleRecojo =
          isCompleteEncuestaInciMuebleRecojo;
      }
    );

    this.progressService.isCompleteEncuestaInciMuebleMantenimiento$.subscribe(
      (isCompleteEncuestaInciMuebleMantenimiento) => {
        this.isCompleteEncuestaInciMuebleMantenimiento =
          isCompleteEncuestaInciMuebleMantenimiento;
      }
    );

    this.progressService.isCompleteEncuestaExhiAdicionalRenovacion$.subscribe(
      (isCompleteEncuestaExhiAdicionalRenovacion) => {
        this.isCompleteEncuestaExhiAdicionalRenovacion =
          isCompleteEncuestaExhiAdicionalRenovacion;
      }
    );

    this.progressService.countCompletedExhiAdicionalRenovacion$.subscribe(
      (countCompletedExhiAdicionalRenovacion) => {
        this.countCompletedExhiAdicionalRenovacion =
          countCompletedExhiAdicionalRenovacion;
      }
    );

    this.progressService.isCompleteExhiAdicionalRenovacion$.subscribe(
      (isCompleteExhiAdicionalRenovacion) => {
        this.isCompleteExhiAdicionalRenovacion =
          isCompleteExhiAdicionalRenovacion;
      }
    );

    this.progressService.isCompleteExhiCompetenciaRenovacion$.subscribe(
      (isCompleteExhiCompetenciaRenovacion) => {
        this.isCompleteExhiCompetenciaRenovacion =
          isCompleteExhiCompetenciaRenovacion;
      }
    );

    this.progressService.isCompleteEncuestaExhiCompetenciaRenovacion$.subscribe(
      (isCompleteEncuestaExhiCompetenciaRenovacion) => {
        this.isCompleteEncuestaExhiCompetenciaRenovacion =
          isCompleteEncuestaExhiCompetenciaRenovacion;
      }
    );

    this.progressService.countCompletedExhiCompetenciaRenovacion$.subscribe(
      (countCompletedExhiCompetenciaRenovacion) => {
        this.countCompletedExhiCompetenciaRenovacion =
          countCompletedExhiCompetenciaRenovacion;
      }
    );

    this.progressService.responseService$.subscribe((responseService) => {
      if (responseService.isError) {
        this.handleOkMiddle();
        this.notification.create('error', 'Mensaje', responseService.message);
      }
    });

    // this.loadConfigWorker();
    // this.loadSkuWorker();
    // this.loadConfigWorkerUser();
    // this.loadConfigValueWorker();
  }

  // Nota: Los workers son para trabajar en segundo plano, para no bloquear la interfaz de usuario
  // Queda el código comentado para futuras referencias
  // loadConfigWorker() {
  //   if (typeof Worker !== 'undefined') {
  //     this.worker = new Worker(new URL('./../../store-list.worker', import.meta.url));
  //     this.worker.onmessage = ({ data }) => {};
  //     this.worker.onerror = (error) => {
  //       console.error('Error in worker:', error);
  //     };
  //     const params = {
  //       rol: this.selectUser?.rol,
  //       user_id: this.selectUser?.usuario_id,
  //       token: this.authService.getToken(),
  //       backendUrl: environment.backendUrl,
  //     };

  //     this.worker.postMessage(params);
  //   } else {
  //     console.log('Web Workers are not supported in this environment.');
  //   }
  // }

  // loadConfigWorkerUser() {
  //   if (typeof Worker !== 'undefined') {
  //     this.workerUser = new Worker(new URL('./../../user-list.worker', import.meta.url));
  //     this.workerUser.onmessage = ({ data }) => {
  //       console.log('Mensaje del worker user:', data);
  //     };
  //     this.workerUser.onerror = (error) => {
  //       console.error('Error in worker:', error);
  //     };
  //     const params = {
  //       token: this.authService.getToken(),
  //       backendUrl: environment.backendUrl,
  //     };

  //     this.workerUser.postMessage(params);
  //   } else {
  //     console.log('Web Workers are not supported in this environment.');
  //   }
  // }

  // loadConfigValueWorker() {
  //   if (typeof Worker !== 'undefined') {
  //     this.worker = new Worker(new URL('./../../config-value-list.worker', import.meta.url));
  //     this.worker.onmessage = ({ data }) => {
  //       console.log('Worker response-loadConfigValueWorker:', data);
  //     };
  //     this.worker.onerror = (error) => {
  //       console.error('Error in worker:', error);
  //     };
  //     const params = {
  //       token: this.authService.getToken(),
  //       backendUrl: environment.backendUrl,
  //     };

  //     this.worker.postMessage(params);
  //   } else {
  //     console.log('Web Workers are not supported in this environment.');
  //   }
  // }

  // loadSkuWorker() {
  //   if (typeof Worker !== 'undefined') {
  //     this.worker = new Worker(new URL('./../../skus-list.worker', import.meta.url));
  //     this.worker.onmessage = ({ data }) => {
  //       console.log('Worker response-loadSkuWorker:', data);
  //     };
  //     this.worker.onerror = (error) => {
  //       console.error('Error in worker:', error);
  //     };
  //     const params = {
  //       token: this.authService.getToken(),
  //       backendUrl: environment.backendUrl,
  //     };

  //     this.worker.postMessage(params);
  //   } else {
  //     console.log('Web Workers are not supported in this environment.');
  //   }
  // }

  ngOnDestroy() {
    if (this.worker) {
      this.worker.terminate();
    }
  }

  // Metodo para que el Collapse se oculte al inicio
  inicioHidenSideBar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  async syncOffline() {
    this.loadingOffline = true;
    try {
      if (this.totalSync > 0) {
        this.isModalUploadVisible = true;
        await this.syncService.syncDataOffline();
        const encuestasRegistradas = await this.utilService.getTotalEncuestas();
        const totalEncuestas = encuestasRegistradas.reduce(
          (acumulador, objetoActual) => acumulador + objetoActual.total,
          0
        );
        this.totalSync = totalEncuestas;
      } else {
        this.isModalDownloadVisible = true;
        const response = await this.menuService.syncOffline();
        if (!response.success) {
          console.error(response.message);
          this.notification.create(
            'error',
            'Mensaje',
            'Error al sincronizar la información'
          );
        } 
      }
    } catch (error) {
      console.error('Error al sincronizar la información:', error);
    }
    // this.loadingOffline = false;
  }

  get title(): string {
    return `Bienvenido ${this.user?.userName} 👋`;
  }

  logout() {
    localStorage.clear();
    this.router.navigate([`${Constantes.ROUTES._LOGIN}`]);
  }

  navigate(link: string) {
    switch (link) {
      case 'home':
        this.router.navigate([`${Constantes.ROUTES._HOME}`]);
        break;
      case 'precio':
        this.router.navigate([`/${Constantes.ROUTES.REPORTS._PRICE}`]);
        break;
      case 'exhibiciones':
        this.router.navigate([`/${Constantes.ROUTES.REPORTS._EXHIBITION}`]);
        break;
      case 'precio-dashboard':
          this.router.navigate([`/${Constantes.ROUTES.REPORTS._PRECIO_DASHBOARD}`]);
          break;
      case 'exhibiciones-dashboard':
        this.router.navigate([`/${Constantes.ROUTES.REPORTS._EXHIBITION_DASHBOARD}`]);
        break;
      case 'exhibiciones-competencia-dashboard':
        this.router.navigate([`/${Constantes.ROUTES.REPORTS._EXHIBITION_COMPETENCIA_DASHBOARD}`]);
        break;
      case 'frente-dashboard':
        this.router.navigate([`/${Constantes.ROUTES.REPORTS._FRENTE_DASHBOARD}`]);
        break;
      case 'stock-dashboard':
        this.router.navigate([`/${Constantes.ROUTES.REPORTS._STOCK_DASHBOARD}`]);
        break;
      // case 'exhibiciones-contraprestada-dashboard':
      //   this.router.navigate([`/${Constantes.ROUTES.REPORTS._EXHIBITION_CONTRAPRESTADA_DASHBOARD}`]);
      //   break;
      case 'frentes':
        this.router.navigate([`/${Constantes.ROUTES.REPORTS._FRENTE}`]);
        break;
      case 'incidencias':
        this.router.navigate([`/${Constantes.ROUTES.REPORTS._INCIDENCE}`]);
        break;
      case 'stock':
        this.router.navigate([`/${Constantes.ROUTES.REPORTS._STOCK}`]);
        break;
      case 'sku':
        this.router.navigate([`/${Constantes.ROUTES.REPORTS._SKU}`]);
        break;
      case 'poc':
        this.router.navigate([`/${Constantes.ROUTES.REPORTS._POC}`]);
        break;
      case 'estructura-comercial':
        this.router.navigate([
          `/${Constantes.ROUTES.REPORTS._ESTRUCTURA_COMERCIAL}`,
        ]);
        break;
      case 'usuarios':
        this.router.navigate([`${Constantes.ROUTES._USERS}`]);
        break;
      case 'config-value':
        this.router.navigate([`${Constantes.ROUTES.REPORTS._CONFIG_VALUE}`]);
        break;
      case 'pocs-relevados':
        this.router.navigate([`${Constantes.ROUTES.REPORTS._POCS_RELEVADOS}`]);
        break;
      case 'backup':
        this.router.navigate([`${Constantes.ROUTES.REPORTS._BACKUP}`]);
        break;
      default:
        // Manejo de caso por defecto si es necesario
        break;
    }
  }

  navigateHome() {
    const url = this.router.url;
    this.empresa_id = localStorage.getItem('empresa_id') || 'BK';
    this.routeCliente =
      this.empresa_id == 'BK'
        ? Constantes.ROUTES.APP.BK
        : Constantes.ROUTES.APP.PERNORP;
    // /app-backus/cliente-backus
    if (url === '/app-backus' || url === '/app-pernod') {
      this.router.navigate([`/${Constantes.ROUTES._HOME}`]);
    } else if (url === '/app-backus/cliente' || url === '/app-pernod/cliente') {
      this.router.navigate([`/${Constantes.ROUTES._HOME}`]);
    } else if (url === '/app-backus/home' || url === '/app-pernod/home') {
      this.router.navigate([`/${Constantes.ROUTES._HOME}`]);
    } else {
      this.router.navigate([
        `/` + this.routeCliente + `/${Constantes.ROUTES._CLIENTE_BK}`,
      ]);
    }
    // this.sharedDataService.changeSelectedDetallPriceOk(false);
    // this.sharedDataService.changeSelectedMarca('');
    // if (this.entityId == 'BK') {
    //   this.router.navigate([`/` + this.routeCliente + `/${Constantes.ROUTES._CLIENTE_BK}`]);
    // } else if (this.entityId === 'PD') {
    //   this.router.navigate([`${Constantes.ROUTES.APP.PERNORP}`]);
    // } else {
    //   this.router.navigate([`/${Constantes.ROUTES._HOME}`]);
    // }
  }

  isAdmin(): boolean {
    const rol = localStorage.getItem('rol') || '';
    // return rol === 'admin' || rol === 'backoffice';
    return rol === 'admin';
  }

  formatFunction = (percent: number) => `${percent}%`;

  handleOkMiddle(): void {
    this.isModalDownloadVisible = false;
    this.isModalUploadVisible = false;
    this.progressService.resetProgress();
    this.loadingOffline = false;
  }

  valueCompleteDownload(table: string): string {
    let value = '';
    switch (table) {
      case 'sku':
        value =
          this.countCompletedSku > 0 ? this.countCompletedSku.toString() : '';
        break;
      case 'poc':
        value =
          this.countCompletedPoc > 0 ? this.countCompletedPoc.toString() : '';
        break;
      case 'config_value':
        value =
          this.countCompletedConfigValue > 0
            ? this.countCompletedConfigValue.toString()
            : '';
        break;
      case 'exhibicion_contraprestada':
        value =
          this.countCompletedExhiContraprestada > 0
            ? this.countCompletedExhiContraprestada.toString()
            : '';
        break;
      case 'exhibicion_adicional_renovacion':
        value =
          this.countCompletedExhiAdicionalRenovacion > 0
            ? this.countCompletedExhiAdicionalRenovacion.toString()
            : '';
        break;
      case 'exhibicion_competencia_renovacion':
        value =
          this.countCompletedExhiCompetenciaRenovacion > 0
            ? this.countCompletedExhiCompetenciaRenovacion.toString()
            : '';
        break;
      default:
        value = '0';
    }
    return value;
  }
  isCompleteUpload(table: any): boolean {
    let isComplete = false;
    switch (table) {
      case 'exhibicion_adicional':
        isComplete = this.isCompleteEncuestaExhiAdicional;
        break;
      case 'exhibicion_competencia':
        isComplete = this.isCompleteEncuestaExhiCompetencia;
        break;
      case 'exhibicion_adicional_renovable':
        isComplete = this.isCompleteEncuestaExhiAdicionalRenovacion;
        break;
      case 'exhibicion_competencia_renovable':
        isComplete = this.isCompleteEncuestaExhiCompetenciaRenovacion;
        break;
      case 'precio':
        isComplete = this.isCompleteEncuestaPrecio;
        break;
      case 'frente':
        isComplete = this.isCompleteEncuestaFrente;
        break;
      case 'stock':
        isComplete = this.isCompleteEncuestaStock;
        break;
      case 'incidencia_competencia':
        isComplete = this.isCompleteEncuestaInciCompetencia;
        break;
      case 'incidencia_mueble_asignacion':
        isComplete = this.isCompleteEncuestaInciMuebleAsignacion;
        break;
      case 'incidencia_mueble_mantenimiento':
        isComplete = this.isCompleteEncuestaInciMuebleMantenimiento;
        break;
      case 'incidencia_mueble_recojo':
        isComplete = this.isCompleteEncuestaInciMuebleRecojo;
        break;
      default:
        isComplete = false;
        break;
    }
    return isComplete;
  }
  setFixedToNumber(colum: string) {
    if (colum) {
      return parseInt(colum).toLocaleString('en-US', {});
    }
    return 0;
  }
}

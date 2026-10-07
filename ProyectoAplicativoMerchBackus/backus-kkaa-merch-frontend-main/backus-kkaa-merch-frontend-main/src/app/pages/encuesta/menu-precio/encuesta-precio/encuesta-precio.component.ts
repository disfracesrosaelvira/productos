import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { v4 as uuidv4 } from 'uuid';

import { SharedDataService } from '../../../app-backus/shared-data.service';
import { EncuestaPrecioService } from './encuesta-precio.service';

import { format } from 'date-fns';
import { NzIconModule } from 'ng-zorro-antd/icon';
// import { MenuExhibicionesService } from '../../menu-exhibiciones/menu-exhibiciones.service';
import { UploadService } from '../../../../shared/services/upload.service';
import Constantes from '../../../../shared/constants/contants';
import { IInformationTable, ILocationStorage, IPocStorage, IUserStorage } from '@pages/dto/dictionary.dto';
import { UtilService } from '@shared/services/util.service';
import { SharedService } from '@shared/services/shared.service';
import { SkuService } from '@shared/services/offline/sku.service';
import { ConfigValueService } from '@shared/services/offline/config_value.service';
import { StoreOfflineService } from '@shared/services/offline.service';
import {environment} from "../../../../environments/environment";
import { ProgressService } from '@shared/services/progress.service';

@Component({
  selector: 'app-encuesta-precio',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    CommonModule,
    NzCollapseModule,
    NzSelectModule,
    NzModalModule,
    NzCardModule,
    NzInputModule,
    NzButtonModule,
    NzSpinModule,
    NzIconModule,
    NzSwitchModule
  ],
  templateUrl: './encuesta-precio.component.html',
  styleUrl: './encuesta-precio.component.scss',
})
export class EncuestaPrecioComponent {
  switchActivated: boolean = false;
  isCollapsed: boolean = false;
  otherComponentsEnabled = false;
  // toggleActivado = false;
  colapsable = true;
  spiner = false;
  selectedSucursal: any = [];
  selectedMarca: any = [];
  selectedMecanica = null;
  guardarHabilitado = true;
  locationActivated = false;
  showLocationModal = false;
  empresa_id =localStorage.getItem('empresa_id') || 'BK';
  routeCliente:any = this.empresa_id =='BK'?Constantes.ROUTES.APP.BK:Constantes.ROUTES.APP.PERNORP;

  productos: any[] = [];
  productosFiltrados: any[] = [];
  dataSucursales: string[] = [];
  searchTerm = '';
  filteredItems: any[] = [];
  loading = false;
  codigoValues: string = 'mecanica_promocional';

  mecanicaOptions: any[] = [];
  pvpRegular: number | null = null;
  pvpPromocional: string = '';
  pvpAdicional: string = '';

  inputErrors: { [key: string]: boolean } = {
    regular: false,
    promocional: false,
    adicional: false,
  };
  selectPoc: IPocStorage | null = null;
  selectUser: IUserStorage | null = null;
  selectLocation: ILocationStorage | null = null;
  table = 'precio';
  nameContainer = 'precio';
  informationTable!: IInformationTable;

  constructor(
    private encuestaPrecioService: EncuestaPrecioService,
    private modalService: NzModalService,
    private sharedDataService: SharedDataService,
    private router: Router,
    private uploadService: UploadService,
    // private _menuExhibicionesService: MenuExhibicionesService,
    private utilService: UtilService,
    private sharedService: SharedService,
    private skuService: SkuService,
    private configValueService: ConfigValueService,
    private offlineService: StoreOfflineService,
    private progressService: ProgressService,
  ) {
    this.selectPoc = this.utilService.getPocFromLocalStorage();
    this.selectUser = this.utilService.getUserFromLocalStorage();
    this.selectLocation = this.utilService.getLocationFromLocalStorage();
  }

  ngOnInit() {
    this.sharedDataService.currentSelectedSucursal.subscribe((sucursal) => {
      this.selectedSucursal = sucursal;
    });
    this.sharedDataService.currentSelectedMarca.subscribe((marca) => {
      this.selectedMarca = marca;
      if (this.selectedMarca) {
        this.loadData();
      }
    });
  }

  async validateRecord() {
    let productosValidos: (boolean | null)[] = [];
    this.productos.forEach((item) => {
      let fields = []
      // if(item.selectedMecanica !== 'Sin Mecanica'){
      //   fields = [item.pvpRegular, item.selectedMecanica, item.pvpPromocional, item.file ];
      // }else{
      //   fields = [ item.pvpRegular,item.selectedMecanica, item.file];
      // }
      if (item.selectedMecanica == 'Sin Mecanica' || item.selectedMecanica == null) {
        fields = [ item.pvpRegular, item.imagen_url ]; // si no le selecciona que al final se envie con el valor de sin Mecanica
        // fields = [ item.pvpRegular, item.selectedMecanica, item.file];
      } else {
        fields = [item.pvpRegular, item.selectedMecanica, item.pvpPromocional, item.imagen_url ];
        // producto.inputErrors.promocional = parseFloat(producto.pvpPromocional) >= parseFloat(producto.pvpRegular);
        // producto.inputErrors.adicionalPromocional = parseFloat(producto.pvpAdicional) >= parseFloat(producto.pvpPromocional);
      }
      let allFilled;
      let noneFilled;
      if (item.selectedMecanica == 'Sin Mecanica' || item.selectedMecanica == null) {
        allFilled = fields.every(field => field !== null && field !== undefined && field !== '' && field != 0);
        noneFilled = fields.every(field => field === null || field === undefined || field === '' || field == 0);
        if (allFilled) {
          if (item.pvpAdicional && item.pvpRegular) {
            allFilled = parseFloat(item.pvpAdicional) < parseFloat(item.pvpRegular);
          }
        }
      } else {
        allFilled = fields.every(field => field !== null && field !== undefined && field !== '' && field != 0);
        noneFilled = fields.every(field => field === null || field === undefined || field === '' || field == 0);
        if(allFilled) {
          if (item.pvpPromocional && item.pvpRegular) {
            allFilled = parseFloat(item.pvpPromocional) < parseFloat(item.pvpRegular);
            if (item.pvpAdicional && item.pvpPromocional) {
              allFilled = parseFloat(item.pvpAdicional) < parseFloat(item.pvpPromocional);
            }
          }
        }

      }
      // if (allFilled) {
      //   item.recordExists = true;
      //   productosValidos.push(true);
      // } else {
      //   item.recordExists = false;
      // }

      if (allFilled) {
        item.recordExists = true;
      } else if (noneFilled) {
        item.recordExists = null;
      } else {
        item.recordExists = false;
      }
      productosValidos.push(item.recordExists);
    });
    // if (productosValidos)
    if (productosValidos.every(item => item == null)) {
      this.guardarHabilitado = true;
    } else {
      this.guardarHabilitado =  productosValidos.includes(false)
    }
  }

  async loadData(): Promise<void> {
    try {
      if(navigator.onLine) {
        this.loading = true;
        const data = await this.encuestaPrecioService.getProductos(
          this.empresa_id,
          this.selectedMarca
        );

        if (data && data.listProductos) {
          const productosFiltradosCategoria = data.listProductos;
          const productosFiltrados = productosFiltradosCategoria.filter(
            (producto: any) =>
              producto.descripcion &&
              producto.descripcion.trim() !== '' &&
              producto.descripcion.trim() !== '-'
          );

          // Asigna los productos filtrados al arreglo this.productos
          this.productos = productosFiltrados.map((producto: any) => ({
            codeParent: uuidv4(),
            sku: producto.sku,
            nombre: producto.descripcion,
            marca: producto.marca,
            foto: producto.foto, // Add the foto field here
            toggleActivado: false,
            pvpRegular: '',
            pvpPromocional: '',
            pvpAdicional: '',
            inputErrors: {
              regular: false,
              promocional: false,
              adicional: false,
            },
            selectedMecanica: null,
            recordExists: null,
            imagen_url: '',
            namePhoteStorage: '',
            isOffline: false,
          }));
          this.loading = false;
          console.log('Productos cargados:', this.productos);
        } else {
          this.loading = false;
          console.error(
            'Error: La respuesta del servicio no contiene la lista de productos'
          );
        }
        this.sharedService.configurationValues(this.codigoValues).then((response) => {
          if (response.success) {
            this.mecanicaOptions = response?.result?.filter((item: any) => item.codigo == Constantes.CONFIG_VALUES.MECANICA_PROMOCIONAL).map((item: any) => item.valor)[0];
          }
        }).catch((error) => {
          console.error('Error al cargar los datos:', error);
        });
      } else {
        const productosXMarcaCompetencia = await this.skuService.getProductosPorMarca(this.empresa_id, this.selectedMarca, 1);
        this.productos = productosXMarcaCompetencia.map((producto: any) => ({
          codeParent: uuidv4(),
          sku: producto.sku,
          nombre: producto.descripcion,
          marca: producto.marca,
          foto: producto.imagen, // Add the foto field here
          toggleActivado: false,
          pvpRegular: '',
          pvpPromocional: '',
          pvpAdicional: '',
          inputErrors: {
            regular: false,
            promocional: false,
            adicional: false,
          },
          selectedMecanica: null,
          recordExists: null,
          imagen_url: '',
          namePhoteStorage: '',
          isOffline: true,
        }));
        this.loading = false;
      }
      console.log("lo que tiene this.productos", this.productos)
      this.mecanicaOptions = await this.configValueService.getValoresSinOrder(Constantes.CONFIG_VALUES.MECANICA_PROMOCIONAL);
      console.log('mecanicaOptions offline', this.mecanicaOptions);
    } catch (error) {
      this.loading = false;
      console.error('Error al cargar los datos:', error);
    }


  }

  // filterProductsByCategory(): void {
  //   if (this.selectedMarca) {
  //     this.productosFiltrados = this.productos.filter(
  //       (producto) => producto.marca === this.selectedMarca
  //     );
  //   }
  // }

  validateNumberInput(event: KeyboardEvent) {
    const key = event.key;
    const regex = /^[0-9]*\.?[0-9]*$/;
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Allow backspace, delete, tab, escape, enter, and . (for decimals)
    const specialKeys = ['Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter', '.'];

    if (specialKeys.indexOf(key) !== -1) {
      return;
    }

    // Prevent default action if the input is not a number or dot
    if (!regex.test(key)) {
      event.preventDefault();
    }

    if (event.key === '.' && value.includes('.')) {
      event.preventDefault();
    }

    if (value.includes('.')) {
      const [integer, decimal] = value.split('.');
      if (decimal.length >= 2 && event.key !== 'Backspace') {
        event.preventDefault();
      }
    }

    if (!/^\d*\.?\d*$/.test(value + event.key)) {
      event.preventDefault();
    }
  }

  validatePvpAdicional(producto: any): void {
    if (producto.pvpAdicional && producto.pvpPromocional) {
      producto.inputErrors.adicionalPromocional = parseFloat(producto.pvpAdicional) >= parseFloat(producto.pvpPromocional);
    } else {
      producto.inputErrors.adicionalPromocional = false;
    }

    if (producto.pvpAdicional && producto.pvpRegular) {
      producto.inputErrors.adicionalRegular = parseFloat(producto.pvpAdicional) >= parseFloat(producto.pvpRegular);
    } else {
      producto.inputErrors.adicionalRegular = false;
    }
  }

  validatePvpPromocional(producto: any): void {
    if (producto.pvpPromocional && producto.pvpRegular) {
      producto.inputErrors.promocional = parseFloat(producto.pvpPromocional) >= parseFloat(producto.pvpRegular);
    } else {
      producto.inputErrors.promocional = false;
    }
    if (producto.selectedMecanica == 'Sin Mecanica') {
      producto.pvpPromocional = '';
    }
    this.validatePvpAdicional(producto);
  }

  validatePvpRegular(producto: any): void {
    if (producto.pvpRegular) {
      this.validatePvpPromocional(producto);
      this.validatePvpAdicional(producto);
    }
  }

  formatDecimal(event: any, producto: any, field: string): void {
    let value = parseFloat(producto[field]).toFixed(2);
    if (!isNaN(value as any)) {
      producto[field] = value;
    }
    if (field === 'pvpRegular') {
      this.validatePvpRegular(producto);
    } else if (field === 'pvpPromocional') {
      this.validatePvpPromocional(producto);
    } else if (field === 'pvpAdicional') {
      this.validatePvpAdicional(producto);
    }
  }

  changeOption() {
    this.otherComponentsEnabled = false;
    this.router.navigate([this.routeCliente]);
  }

  changeOptionGondola() {
    this.otherComponentsEnabled = false;
    this.router.navigate([
      `/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA.PRECIO_DETALLE}`,
    ]);
  }

  inicioHidenSideBar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  validateGondola() {
    if (!this.selectedSucursal) {
      this.router.navigate([
        `/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA._PRECIO}`,
      ]);
    }
  }

  navigateToMenuPrecio() {
    this.sharedDataService.changeSelectedDetallPriceOk(true);
    this.router.navigate([
      `/` + this.routeCliente + `/${Constantes.ROUTES._ENCUESTA}/${Constantes.ROUTES.ENCUESTA._PRECIO}`,
    ]);
  }

  preventCollapse(event: Event): void {
    event.stopPropagation();
  }

  onFileChange(event: any, producto: any): void {
    const file = event.target.files[0];

    // Para lectura de la imagen
    const reader = new FileReader();
    reader.onload = (e) => {
      producto.imagenUrl = e.target ? e.target.result : null;
    };
    reader.readAsDataURL(file);

    const photoNameExtension = file.name;
    const lastDotIndex = photoNameExtension.lastIndexOf('.');
    producto.photoFullName = photoNameExtension;
    producto.photoName = photoNameExtension.substring(0, lastDotIndex);
    producto.photoExtension = 'webp'; // Cambiamos la extensión a WebP
    producto.file = file;

    this.uploadService.compressAndConvertToWebP(file).then(webpBlob => {
      const webpFile = new File([webpBlob], `${producto.photoName}.webp`, { type: 'image/webp' });
      this.guardarImagen(webpFile, producto);
    }).catch(error => {
      console.error('Error al comprimir y convertir la imagen:', error);
    });
  }



  async guardarImagen(file: any, producto: any): Promise<void> {
    const latitude = localStorage.getItem('latitude');
    const longitude = localStorage.getItem('longitude');
    const user = localStorage.getItem('user');
    const uuid = uuidv4();
    producto._id = uuid;
    this.informationTable = this.utilService.getInformationTable(this.table);
    if(navigator.onLine) {
      const formData = new FormData();
      try {
        this.loading = true;
        if (user) {
          formData.append('user', JSON.parse(user).userId);
        }
        formData.append('table', this.table);
        formData.append('uuid', uuid);
        formData.append('nameContainer', this.nameContainer);
        formData.append('data', JSON.stringify({
          latitude: latitude,
          longitude: longitude,
        }));
        formData.append('file', file);
        const response = await this.uploadService.uploadPhoto(formData);
        if (response) {
          producto.imagen_url = response.data.imgUrl;
          producto.namePhoteStorage = response.data.nameFile;
          producto.offline = 0;
        }
        await this.validateRecord();
        this.loading = false;
        await this.offlineService.addDocument(`${environment.tb_index_imagen}`, {
          _id: uuid,
          codeParent: producto.codeParent,
          table: this.table,
          foto_nombre_extension: producto.photoFullName,
          // nameStore: this.table,
          // id_store: producto.codeParent,
          nameContainer: this.nameContainer,
          data: {
            latitud: latitude,
            longitud: longitude,
          },
          name_file: producto.namePhoteStorage,
          imagen_url: producto.imagen_url,
          isOffline: false,
          stateUploadAzure: true,
        });

      } catch (error) {
        this.loading = false;
        console.error(`Error al guardar la imagen}:`, error);
      }
    } else {
      let imageBase64 = '';
      await this.utilService.convertirArchivoABase64(file).then(base64 => {
        // console.log('Imagen en base64:', base64);
        imageBase64 = base64; // Aquí tienes tu imagen en base64
      }).catch(error => {
        // console.error("Error al convertir el archivo a base64", error);
      });
      // console.log('this.table:', this.table);
      // this.informationTable = this.utilService.getInformationTable(this.table);
      const dataToStore = {
        _id: uuid,
        codeParent: producto.codeParent,
        table: this.table,
        foto_nombre_extension: producto.photoFullName,
        // nameStore: this.table,
        // id_store: producto.codeParent,
        nameContainer: this.nameContainer,
        data: {
          latitud: latitude,
          longitud: longitude,
        },
        file: imageBase64, // Aquí solo se guarda el nombre del archivo para el ejemplo
        isOffline: true,
        // imagen_url: producto.photoFullName,
        stateUploadAzure: false,
        // fecha_creacion: new Date().toUTCString()
        imagen_url: '',
        name_file: '',
        fecha_creacion: new Date().toUTCString()
      };
      producto.imagen_url = producto.photoFullName;
      producto.offline = 1;

      try {
        await this.offlineService.addDocument(`${environment.tb_index_imagen}`, dataToStore);
        console.log('Imagen guardada en offlinfasade: ', dataToStore);
        await this.validateRecord();
      } catch (error) {
        console.error(`Error al guardar imagen:`, error);
      }

    }
  }

  async clearImage(producto: any): Promise<void> {
    const inputToClear = document.getElementById(`foto-${producto.photoName}`) as HTMLInputElement;
    if (inputToClear) {
      inputToClear.value = '';
    }
    if(navigator.onLine && producto.offline == false) {
      await this.uploadService.deletePhoto(producto.namePhoteStorage, this.nameContainer).then((response) => {
        console.log('response =>', response);
        producto.photoName = '';
        producto.imagen_url = '';
        producto.imageUrl = null;
        producto.file = null;
        this.validateRecord();
      }).catch((error) => {
        console.log('error | removeItemImg =>', error);
      });
    }
    await this.offlineService.deleteDocumentById(`${environment.tb_index_imagen}`, producto._id).then(() => {
      console.log('Imagen eliminada en offlinfasade');
      producto.photoName = '';
      producto.imagen_url = '';
      producto.imageUrl = null;
      producto.file = null;
      this.validateRecord();
    }).catch((error) => {
      console.error('Error al eliminar la imagen:', error);
    });
  }

  async activateLocationAndSave(): Promise<void> {
    this.showLocationModal = false;

    try {
      const activated = await this.reactivateLocationIfNeeded();
      if (activated) {
        // Si se activa la ubicación, proceder con el guardado
        this.guardarProductos();
      } else {
        // Manejo de caso donde no se puede activar la ubicación
        console.error('No se pudo activar la ubicación.');
      }
    } catch (error) {
      console.error('Error al intentar activar la ubicación:', error);
    }
  }

  cancelSave(): void {
    this.showLocationModal = false;
  }

  // activateComponent(): void {
  //   this.switchActivated = !this.switchActivated;
  //   if (!this.switchActivated) {
  //     this.resetProductos();
  //   }
  // }

  // activateToggle(producto: any): void {
  //   producto.toggleActivado = !producto.toggleActivado;
  //   if (!producto.toggleActivado) {
  //     producto.pvpRegular = '';
  //     producto.pvpPromocional = '';
  //     producto.pvpAdicional = '';
  //     producto.selectedMecanica = null;
  //     producto.recordExists = null;
  //   }
  //   this.clearImage(producto);
  //   this.validateProductos();
  // }

  // resetProductos(): void {
  //   this.productos.forEach(producto => {
  //     producto.toggleActivado = false;
  //     producto.pvpRegular = '';
  //     producto.pvpPromocional = '';
  //     producto.pvpAdicional = '';
  //     producto.selectedMecanica = null;
  //   });
  // }

  validateSelectMecanica(producto: any) {
    if (producto.selectedMecanica == null || producto.selectedMecanica === '') {
      return false;
    }
    if (producto.selectedMecanica === 'Sin Mecanica') {
      return false;
    }
    return true;
  }

  // toggleCollapse(): void {
  //   this.isCollapsed = !this.isCollapsed;
  // }

  toggleModal(): void {
    this.showLocationModal = !this.showLocationModal;
  }


  async reactivateLocationIfNeeded(): Promise<boolean> {
    return new Promise((resolve) => {
      const storedLocationActivated = localStorage.getItem('locationActivated');
      const locationActivated = storedLocationActivated === 'true';
      if (locationActivated) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  async guardarProductos(): Promise<void> {
    // const productosToSave = this.productos.filter(producto => producto.toggleActivado);
    // const productosActivadosIncompletos = this.productos.filter((producto) => producto.recordExists==false);
    // const productosActivadosIncompletos = this.productos.filter((producto) => producto.recordExists == true);
    // console.log('productosActivadosIncompletos', productosActivadosIncompletos)
    // if (productosActivadosIncompletos.length > 0) {
    //   this.modalService.warning({
    //     nzTitle: '¡Advertencia!',
    //     nzContent: 'Tienes productos con Campos Incompletos.',
    //   });
    //   return;
    // }
    let isOffline = false;
    const productosActivados = this.productos.filter((producto) => producto.recordExists==true);

    if (productosActivados.length === 0) {
      this.modalService.warning({
        nzTitle: '¡Advertencia!',
        nzContent: 'No hay productos activados para guardar.',
      });
      return;
    }

    this.loading = true;
    let skus: any = [];

    try {
      for (const producto of productosActivados) {
        const data = {
          sku: producto.sku,
          descripcion: producto.nombre,
          marca: producto.marca,
          pvp_regular: producto.pvpRegular,
          selected_mecanica: producto.selectedMecanica ? producto.selectedMecanica : 'Sin Mecanica',
          pvp_promocional: producto.pvpPromocional,
          pvp_adicional: producto.pvpAdicional,
          imagen_url: producto.imagen_url,
          offline: producto.offline,
          codeParent: producto.codeParent, // eliminar en el backend si se envia con internet
        } as any;
        // if(productosActivados.some((producto: any) => producto.offline == true)) {data.codeParent = producto.codeParent;}
        localStorage.setItem('encuesta-precio-create', JSON.stringify(data));
        console.log(`Producto ${producto.nombre} guardado exitosamente`);
        skus.push(data);
      }
      let request: any = {
        precio_id: uuidv4(),
        skus: skus,
        latitud: this.selectLocation?.latitude || 0 ,
        longitud: this.selectLocation?.longitude || 0,
        poc: this.selectPoc || {},
        usuario: this.selectUser || {},
        empresa_id:this.empresa_id,
        // fecha_creacion: new Date().toISOString(),
        fecha_creacion: new Date().toUTCString(),
      }
      // !this.uploadFiles.some((file: any) => file.isOffline == true)
      
      if(navigator.onLine && !productosActivados.some((producto: any) => producto.offline == true)) {
        try {
          for (const producto of productosActivados) {
            //eliminamos las imagenes
            await this.offlineService.deleteDocumentById(`${environment.tb_index_imagen}`, producto._id);
          }
        } catch (error) {
          console.error('Error al eliminar documentos:', error);
        }

        request.offline = 0;
        await this.encuestaPrecioService.savePrecioInput(request);
      } else {
        request.offline = 1;
        isOffline = true;
        const dataToStore = {
          codeParent: request.precio_id,
          table: this.table,
          nameStore: this.table,
          // id_store: request.precio_id,
          nameContainer: this.nameContainer,
          data: request,
          isOffline: true,
          stateUploadAzure: false,
        };
        try {
          await this.offlineService.addDocument(this.informationTable.nameBDIndex, dataToStore, this.informationTable.nameCollectionEncuestas);
          console.log('Encuesta de precio guardada en offlinfasade:', dataToStore);
          if(navigator.onLine){
            // !Permite actualizar el total de encuestas guardadas en offline
            this.progressService.updateIsSaveEncuesta(true);
          }
        } catch (error) {
          console.error(`Error al guardar la encuesta de precio en offlinfasade}:`, error);
        }
      }
      // Mostrar el mensaje de éxito solo una vez después de guardar todos los productos
      this.loading = false;
      this.navigateToMenuPrecio();
      let messageModal = '';
      skus.forEach((element: any) => {
        messageModal += `<p>${element.descripcion} (${element.selected_mecanica == 'Sin Mecanica' ? 'Sin Mecanica' : 'Con Mecanica'})</p>`;
      });
      this.modalService.success({
        nzTitle: `Guardado Exitoso ${isOffline ? 'Offline' : ''}`,
        nzContent: `
        <div>
          ${messageModal}
        </div>
        `,
      });
    } catch (error) {
      this.loading = false;
      console.error('Error al guardar los productos:', error);
      this.modalService.error({
        nzTitle: 'Error',
        nzContent: 'Ocurrió un error al guardar los datos.',
      });
    }
  }
}

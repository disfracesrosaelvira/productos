import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';

import Constantes from '@shared/constants/contants';
import { SharedService } from '@shared/services/shared.service';
import { ConfigValueReportsService } from './config-value-reports.service';

@Component({
  selector: 'app-config-value-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NzListModule, NzCollapseModule, NzInputModule, NzButtonModule, NzModalModule, NzSelectModule],
  templateUrl: './config-value-reports.component.html',
  styleUrl: './config-value-reports.component.scss'
})
export class ConfigValueReportsComponent {
  loading: boolean = false;
  codigoValues: string = 'tipo_exhibiciones,tipo_zonas,tipo_mueble_recojo,mecanica_promocional,tipo_mueble,tipo_incidencia_competencia,motivo_recojo,tipo_mantenimiento,sku_linea_marca,sku_linea_categorias,tipo_exhibicion_homologado_contraprestada';
  dataTipoExhibiciones: any = {};
  dataZonas: any = {};
  dataTipoMuebleRecogo: any = {};
  dataMecanicaPromocional: any = {};
  dataTipoMueble: any = {}; //
  dataTipoIncidenciaCompetencia: any = {};
  dataMotivoRecojo: any = {};
  dataTipoMantenimiento: any = {};
  dataSkuLineaMarca: any = {};
  dataSkuLineaCategorias: any = {};
  dataTipoExhibicionHomologadoContraprestada: any = {};
  addConfigValue: any = {
    tipo_exhibiciones: { value: '' },
    tipo_zonas: { value: '' },
    tipo_mueble_recojo: { value: '' },
    mecanica_promocional: { value: '' },
    tipo_mueble: { value: '' },
    tipo_incidencia_competencia: { value: '' },
    motivo_recojo: { value: '' },
    tipo_mantenimiento: { value: '' },
    sku_linea_marca: { value: '' },
    sku_linea_categorias: { value: '' },
    tipo_exhibicion_homologado_contraprestada: { value: '' },
  }
  // start para crear sku_linea_marca o sku_linea_categorias (para el primer orden -> agregar la linea)
  isCreateModalVisible = false;
  newLineForm: FormGroup;
  skuLineaMarcaOrCategorias: string = '';
  // end para crear sku_linea_marca o sku_linea_categorias

  constructor(
    private fb: FormBuilder,
    private sharedService: SharedService,
    private configValueReportsService: ConfigValueReportsService,
    private notification: NzNotificationService,
  ) {
    this.newLineForm = this.fb.group({
      linea: [null, Validators.required],
      empresa_id: [null, [Validators.required]],
      competencia: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.dataLoading();

  }

  async dataLoading() {
    try {
      const response = await this.sharedService.configurationValues(this.codigoValues);
      if (response.success) {
        this.dataTipoExhibiciones = response.result.find((element: any) => element.codigo === Constantes.CONFIG_VALUES.TIPO_EXHIBICIONES);
        this.dataZonas = response.result.find((element: any) => element.codigo === Constantes.CONFIG_VALUES.TIPO_ZONAS);
        this.dataTipoMuebleRecogo = response.result.find((element: any) => element.codigo === Constantes.CONFIG_VALUES.TIPO_MUEBLE_RECOJO);
        this.dataMecanicaPromocional = response.result.find((element: any) => element.codigo === Constantes.CONFIG_VALUES.MECANICA_PROMOCIONAL);
        this.dataTipoMueble = response.result.find((element: any) => element.codigo === Constantes.CONFIG_VALUES.TIPO_MUEBLE);
        this.dataTipoIncidenciaCompetencia = response.result.find((element: any) => element.codigo === Constantes.CONFIG_VALUES.TIPO_INCIDENCIA_COMPETENCIA);
        this.dataMotivoRecojo = response.result.find((element: any) => element.codigo === Constantes.CONFIG_VALUES.MOTIVO_RECOJO);
        this.dataTipoMantenimiento = response.result.find((element: any) => element.codigo === Constantes.CONFIG_VALUES.TIPO_MANTENIMIENTO);
        this.dataSkuLineaMarca = response.result.find((element: any) => element.codigo === Constantes.CONFIG_VALUES.SKU_LINEA_MARCA);
        this.dataSkuLineaCategorias = response.result.find((element: any) => element.codigo === Constantes.CONFIG_VALUES.SKU_LINEA_CATEGORIAS);
        this.dataTipoExhibicionHomologadoContraprestada = response.result.find((element: any) => element.codigo === Constantes.CONFIG_VALUES.TIPO_EXHIBICION_HOMOLOGADO_CONTRAPRESTADA);
      }
      // console.log('response', response)
    } catch (error) {
      console.error('Error al cargar los datos:', error);
    }
  }

  handleSaveChanges(key: string, item?: any) {
    console.log('item', item)
    const newData = {
      key: key,
      value: this.addConfigValue[key].value,
      item: item || null
    }
    this.configValueReportsService.createConfigValue(newData).subscribe({
      next: () => {
        this.dataLoading();
        this.notification.create('success', 'Creado', 'Se Creo correctamente');
        this.addConfigValue[key].value = '';
      },
      error: (error) => {
        console.error('Error al crear:', error);
        this.notification.create('error', 'Error', 'No se pudo guardar en la base de datos');
      }
    });
  }

  handleCreateLine() {
    if (this.newLineForm.valid) {
      let newLine;
      if (this.skuLineaMarcaOrCategorias === 'sku_linea_marca') {
        newLine = {
          // ...this.newLineForm.value,
          linea: this.newLineForm.value.linea,
          marcas: [], // Inicia con un array vacío de marcas
          empresa_id: this.newLineForm.value.empresa_id,
          estado: 1,
          competencia: this.newLineForm.value.competencia
        };
      }
      if (this.skuLineaMarcaOrCategorias === 'sku_linea_categorias') {
        newLine = {
          // ...this.newLineForm.value,
          competencia: this.newLineForm.value.competencia,
          linea: this.newLineForm.value.linea,
          categorias: [], // Inicia con un array vacío de categorias
          empresa_id: this.newLineForm.value.empresa_id,
        };
      }
      this.configValueReportsService.createSkuLineaMarcaOrCategorias({
        key: this.skuLineaMarcaOrCategorias,
        value: newLine,
      }).subscribe({
        next: () => {
          this.dataLoading();
          this.notification.create('success', 'Creado', 'Nueva línea agregada correctamente');
          this.closeCreateModal();
        },
        error: (error) => {
          console.error('Error al agregar nueva línea:', error);
          this.notification.create('error', 'Error', 'No se pudo agregar la nueva línea');
        },
      });
    }
  }

  openCreateModal(key: string) {
    this.isCreateModalVisible = true;
    this.skuLineaMarcaOrCategorias = key;
    this.newLineForm.reset();
  }

  closeCreateModal() {
    this.isCreateModalVisible = false;
    this.newLineForm.reset();
  }
}

// const marca_marca_y_linea_homologadas = 
// [
//   {"label": "Pilsen Callao", "value": { "marca_homologada" :"Pilsen Callao", "linea_homologada": "Cervezas"}},
//   {"label": "Corona", "value": { "marca_homologada" :"Corona", "linea_homologada": "Cervezas"}},
//   {"label": "Mike's", "value": { "marca_homologada" :"Mikes", "linea_homologada": "RTD"}},
//   {"label": "Beats", "value": { "marca_homologada" :"Beats", "linea_homologada": "RTD"}},
//   {"label": "San Mateo", "value": { "marca_homologada" :"Nabs", "linea_homologada": "NABs"}},
//   {"label": "Guaraná", "value": { "marca_homologada" :"Nabs", "linea_homologada": "NABs"}},
//   {"label": "Budweiser", "value": { "marca_homologada" :"Budweiser", "linea_homologada": "Cervezas"}},
//   {"label": "Cusqueña", "value": { "marca_homologada" :"Cusqueña", "linea_homologada": "Cervezas"}},
//   {"label": "Cusqueña Kero", "value": { "marca_homologada" :"Cusqueña Kero", "linea_homologada": "Cervezas"}},
//   {"label": "Pilsen Callao / Corona / Cusqueña", "value": { "marca_homologada" :"Multimarca Cerveza", "linea_homologada": "Cervezas"}},
//   {"label": "Cristal", "value": { "marca_homologada" :"Cristal", "linea_homologada": "Cervezas"}},
//   {"label": "Stella / Corona / Cusqueña  / Pilsen Callao", "value": { "marca_homologada" :"Multimarca", "linea_homologada": "Cervezas"}},
//   {"label": "Corona / Cusqueña  / Pilsen Callao / Stella", "value": { "marca_homologada" :"Multimarca", "linea_homologada": "Cervezas"}},
//   {"label": "Corona / Pilsen Callao / Mikes", "value": { "marca_homologada" :"Multimarca", "linea_homologada": "por_homologar_linea"}},
//   {"label": "Corona / Budweiser / Cusqueña / Pilsen Callao / Cristal", "value": { "marca_homologada" :"Multimarca", "linea_homologada": "Cervezas"}},
//   {"label": "Corona / Mikes / Cusqueña / Pilsen Callao", "value": { "marca_homologada" :"Multimarca", "linea_homologada": "Cervezas"}},
//   {"label": "San Mateo / Guarana", "value": { "marca_homologada" :"Multimarca NABS", "linea_homologada": "NABs"}},
//   {"label": "Multimarca", "value": { "marca_homologada" :"Multimarca", "linea_homologada": "por_homologar_linea"}},
//   {"label": "Pilsen Callao / Cusqueña", "value": { "marca_homologada" :"Multimarca Cerveza", "linea_homologada": "Cervezas"}},
//   {"label": "Golden", "value": { "marca_homologada" :"Golden", "linea_homologada": "Cervezas"}},
//   {"label": "Stella Artois / Budweiser", "value": { "marca_homologada" :"Multimarca", "linea_homologada": "Cervezas"}},
//   {"label": "Guarana", "value": { "marca_homologada" :"Nabs", "linea_homologada": "NABs"}},
//   {"label": "Multimarca (Beats, Corona, Cusqueña, Pilsen Callao)", "value": { "marca_homologada" :"por_homologar_marca", "linea_homologada": "por_homologar_linea"}},
//   {"label": "Multimarca (Corona, Stella, Cusqueña, Pilsen)", "value": { "marca_homologada" :"Multimarca", "linea_homologada": "Cervezas"}},
//   {"label": "San Mateo/Guaraná", "value": { "marca_homologada" :"Multimarca NABS", "linea_homologada": "NABs"}},
//   {"label": "Corona/CSQ/Pilsen Callao", "value": { "marca_homologada" :"Multimarca Cerveza", "linea_homologada": "Cervezas"}},
//   {"label": "Budweiser/Stella", "value": { "marca_homologada" :"Multimarca", "linea_homologada": "Cervezas"}},
//   {"label": "Stella Artois", "value": { "marca_homologada" :"Stella Artois", "linea_homologada": "Cervezas"}},
//   {"label": "Arequipeña", "value": { "marca_homologada" :"Arequipeña", "linea_homologada": "Cervezas"}},
//   {"label": "Mikes", "value": { "marca_homologada" :"Mikes", "linea_homologada": "RTD"}},
//   {"label": "Guaraná / Viva", "value": { "marca_homologada" :"Nabs", "linea_homologada": "NABs"}},
//   {"label": "No Definida", "value": { "marca_homologada" :"Multimarca", "linea_homologada": "por_homologar_linea"}},
//   {"label": "NABS", "value": { "marca_homologada" :"Nabs", "linea_homologada": "NABS"}},
//   {"label": "Ballantines y Something Special", "value": { "marca_homologada" :"Ballantines y Something Special", "linea_homologada": "Por_homologar_linea"}},
//   {"label": "Absolut y Beffeater", "value": { "marca_homologada" :"Absolut Y Beffeater", "linea_homologada": "Por_homologar_linea"}},
//   {"label": "Olmeca y Havana Club", "value": { "marca_homologada" :"Olmeca y Havana Club", "linea_homologada": "Por_homologar_linea"}},
//   {"label": "Chivas", "value": { "marca_homologada" :"Chivas", "linea_homologada": "Whisky"}},
//   {"label": "Pilsen Trujillo", "value": { "marca_homologada" :"Pilsen Trujillo", "linea_homologada": "Cervezas"}},
//   {"label": "Something Special", "value": { "marca_homologada" :"Something Special", "linea_homologada": "Por_homologar_linea"}},
//   {"label": "Ballantines", "value": { "marca_homologada" :"Ballantines", "linea_homologada": "Whisky"}},
//   {"label": "Absolut", "value": { "marca_homologada" :"Absolut", "linea_homologada": "Vodka"}},
//   {"label": "Barbarian", "value": { "marca_homologada" :"Barbarian", "linea_homologada": "Cervezas"}},
//   {"label": "Beefeater", "value": { "marca_homologada" :"Beefeater", "linea_homologada": "Gin"}},
//   {"label": "Ballantines, Something Special y Passport", "value": { "marca_homologada" :"Ballantines, Something Special y Passport", "linea_homologada": "Por_homologar_linea"}},
//   {"label": "Chivas Y Something Special", "value": { "marca_homologada" :"Chivas Y Something Special", "linea_homologada": "Whisky"}},
//   {"label": "Stella Artois/Budweiser", "value": { "marca_homologada" :"Multimarca", "linea_homologada": "Cervezas"}},
//   {"label": "NABS San Mateo", "value": { "marca_homologada" :"Multimarca NABS", "linea_homologada": "NABs"}},
//   {"label": "NABS Guaraná", "value": { "marca_homologada" :"Multimarca NABS", "linea_homologada": "NABs"}},
//   {"label": "Pilsen", "value": { "marca_homologada" :"Pilsen Callao", "linea_homologada": "Cervezas"}},
//   {"label": "Cristal Copa América", "value": { "marca_homologada" :"Cristal", "linea_homologada": "Cervezas"}},
//   {"label": "Beefeater y Absolut", "value": { "marca_homologada" :"Beefeater y Absolut", "linea_homologada": "Por_homologar_linea"}},
//   {"label": "San Juan", "value": { "marca_homologada" :"San Juan", "linea_homologada": "Cervezas"}}
// ]
// const skus_linea_homologadas = 
// [
//   {"label": "Pilsen Callao", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Corona", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Mikes", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Beats", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "San Mateo", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Guaraná", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Budweiser", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Cusqueña", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Cusqueña Kero", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Pilsen Callao / Corona / Cusqueña", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Cristal", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Stella / Corona / Cusqueña  / Pilsen Callao", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Corona / Cusqueña  / Pilsen Callao / Stella", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Corona / Pilsen Callao / Mikes", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Corona / Budweiser / Cusqueña / Pilsen Callao / Cristal", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Corona / Mikes / Cusqueña / Pilsen Callao", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "San Mateo / Guarana", "value": { "sku_homologado": "NABs"}},
//   {"label": "Multimarca", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Pilsen Callao / Cusqueña", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Golden", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Stella Artois / Budweiser", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Guarana", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Multimarca (Beats, Corona, Cusqueña, Pilsen Callao)", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Multimarca (Corona, Stella, Cusqueña, Pilsen)", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "San Mateo/Guaraná", "value": { "sku_homologado": "NABs"}},
//   {"label": "Mike's", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Corona/CSQ/Pilsen Callao", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Budweiser/Stella", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Stella Artois", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "No Definida", "value": { "sku_homologado": "Multimarca"}},
//   {"label": "Arequipeña", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Nabs", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Cusqueña Cerveza Caja X24 Bt 310 Ml, Cusqueña Cerveza Trigo Pk 6 La 355 Ml", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Cusqueña Cerveza Pk 6 La 355 Ml (Trigo, Dorada, Malta)", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Pilsen Cerveza Pk 12 Lt 355 Ml", "value": { "sku_homologado": "Pilsen Callao - Lat - 355ml - 12p"}},
//   {"label": "Pilsen Cerveza Pk 6 La 473 Ml", "value": { "sku_homologado": "Pilsen Callao - Lat - 473ml - 6p"}},
//   {"label": "Ballantines Y Something Special (700Ml Y 1Lt)", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Absolut (700 Y 1Lt) Y Beefeater(700Ml, 1Lt Y Pink)", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Corona Cerveza Mini Extra Pk 6 Bt 210 Ml, Corona Cerveza Mini Extra Pk 24 Bt 210 Ml", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Ballantines Y Something (700Ml Y 1Lt)", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Olmeca Y Havana Especial", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Cristal Cerveza Caja X24 Bt 305 Ml", "value": { "sku_homologado": "Cristal - Bot - 305ml - 24p"}},
//   {"label": "Chivas12 (700Ml Y 1Lt)", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Pilsen Trujillo Pk 6 Lt 355 Ml", "value": { "sku_homologado": "Pilsen Trujillo - Lat - 355ml - 6p"}},
//   {"label": "Chivas 12 (700 Y 1L)", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Cusq 355 / 310", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Cristal 355 / 473", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Six Pack Botella", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Something Special", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Twelve Pack", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Cusqueña ", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Familia Chivas", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Ballantines", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Botella 2.5Ml", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Chivas 12 Y 13", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Ss Y Ball", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Something Y Ballantines", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Twelve Pack ", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Twelve Pack / Six Pack", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Stella", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Ballantines, Something Special", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Ballantines Y Something Special", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Absolut (700 Y 1Lt)", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Barbarian: Peso Pumpkin", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Beefeater Familia", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Ballantines, Something Special Y Passport", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Beefeater", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Chivas Familia", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Chivas 12 , 13, Ss Y Ball", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Ball Y Ss", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Beefeater Y Absolut", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Pilsen Trujillo", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Cerveza Cristal Lata X 355 Ml Trmble X 6 Und", "value": { "sku_homologado": "Cristal - Lat - 355ml - 6p"}},
//   {"label": "Guaraná Variedades", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Pilsen", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Pc305", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Cusqueñas", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Csq Trigo 310", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Six Pack Cerveza Pilsen Bt X 305Ml", "value": { "sku_homologado": "Pilsen Callao - Bot - 305ml - 6p"}},
//   {"label": "Cerveza Cusquena Trigo Botella 310Ml X 6Und", "value": { "sku_homologado": "Cusqueña Trigo - Bot - 310ml - 6p"}},
//   {"label": "Chivas Regal 12", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Stella Artois Bot X 330 Ml Six Pack", "value": { "sku_homologado": "Stella - Bot - 330ml - 6p"}},
//   {"label": "Six Pack Cerveza Cusqueña Trigo Lt X 355Ml", "value": { "sku_homologado": "Cusqueña Trigo - Lat - 355ml - 6p"}},
//   {"label": "6 Pack Cerveza Corona Bt 0.3L", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "6 Pack Cerveza Pilsen Callao Lt 473 Ml", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Cerveza Pilsen Callao Lata 269Ml X 6Und", "value": { "sku_homologado": "Pilsen Callao - Lat - 269ml - 6p"}},
//   {"label": "Cerveza Nr Pilsen Twelve Lata X355Ml", "value": { "sku_homologado": "Pilsen Callao - Lat - 355ml - 12p"}},
//   {"label": "Cerv Barbarian Artesn Pilsener Magic Qnua 330Mlx4", "value": { "sku_homologado": "Barbarian Magic Quinua La Nena - Bot - 330ml - 4p"}},
//   {"label": "Cerveza Corona Extra Lata 355Ml X 6Und", "value": { "sku_homologado": "Corona - Lat - 355ml - 6p"}},
//   {"label": "Something Special/Ballantines", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Stella Artois 330 Bot", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Cusqueña 310 Variedades", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Corona 355Ml 6Pk Bt", "value": { "sku_homologado": "Corona - Bot - 355ml - 6p"}},
//   {"label": "San Mateo 2.5L  / 600 Cg Y Sg / Bd 7L", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Chivas Familia Y Packs", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Barbarian", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Six Pack 600Ml", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Beefeater Dry Y Sabores", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Familia Beefeater", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "PILSEN CERVEZA PK 6 LT 355 ML", "value": { "sku_homologado": "Pilsen Callao - Lat - 355ml - 6p"}},
//   {"label": "CORONA CERVEZA EXTRA PK 6 BT 330 ML", "value": { "sku_homologado": "Corona - Bot - 330ml - 6p"}},
//   {"label": "SIX PACK CERVEZA CUSQUEÑA DORADA LT X 355ML.", "value": { "sku_homologado": "Cusqueña Dorada - Lat - 355ml - 6p"}},
//   {"label": "GUARANA VITAMINIZADA X 3010ML", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "AGUA MINERAL SAN MATEO SIN GAS BIDON X 7 LITRO", "value": { "sku_homologado": "San Mateo - Bidón - 7Lts - unit"}},
//   {"label": "-", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Stella Artois/Budweiser", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "NABS San Mateo", "value": { "sku_homologado": "NABs"}},
//   {"label": "NABS Guaraná", "value": { "sku_homologado": "NABs"}},
//   {"label": "Pilsen ", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Stella ", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "CERVEZA CRISTAL LATA X 355 ML TRMBLE X 12 UND", "value": { "sku_homologado": "Cristal - Lat - 355ml - 12p"}},
//   {"label": "SIX PACK CERVEZA CRISTAL 473 ML", "value": { "sku_homologado": "Cristal - Lat - 473ml - 6p"}},
//   {"label": "SIX PACK CERVEZA CORONITA BT 210 ML", "value": { "sku_homologado": "Corona - Bot - 210ml - 6p"}},
//   {"label": "Ballantines, Something Special y PaSPort", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Cristal Copa América", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Beefeater Sabores/ Absolut", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Beefeater Sabores Y Dry", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Pilsen-Twelve Pack", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Pilsen-Six Pack Botella", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Pilsen-Twelve Pack", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Corona-Six Pack Botella", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "San Mateo--", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Stella Artois-Six Pack Botella", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Cusqueña-Six Pack Botella", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Pilsen-Twelve Pack / Six Pack", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "Cristal Cerveza Pk 6 Lt 473 Ml", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "San Mateo-Botella 2.5Ml", "value": { "sku_homologado": "San Mateo - Bot - 2.5Lts - unit"}},
//   {"label": "San Mateo-Six Pack 600Ml", "value": { "sku_homologado": "San Mateo - Bot - 600ml - unit"}},
//   {"label": "San Juan", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "CORONA CERVEZA MINI EXTRA PK 6 BT 210 ML", "value": { "sku_homologado": "Corona - Bot - 210ml - 6p"}},
//   {"label": "Mikes Blueberry", "value": { "sku_homologado": "por_homologar_sku"}},
//   {"label": "CERVEZA CUSQUENA NEGRA BOTELLA 310ML X 6UND", "value": { "sku_homologado": "Cusqueña Malta - Bot - 310ml - 6p"}},
//   {"label": "CORONA CERO SIN ALCOHOL 355 ML PACK X6", "value": { "sku_homologado": "Corona Cero - Bot - 355ml - 6p"}},
//   {"label": "SIX PACK CERVEZA CUSQUEÑA NEGRA LT X 355ML", "value": { "sku_homologado": "Cusqueña Malta - Lat - 355ml - 6p"}},
//   {"label": "CERVEZA SAN JUAN LATA X 355 ML TRMBLE X 6 UND", "value": { "sku_homologado": "San Juan - Lat - 355ml - 6p"}},
//   {"label": "CHIVAS 18", "value": { "sku_homologado": "por_homologar_sku"}}
// ]
// const skus = [
//   {label: "PILSEN CERVEZA PK 6 LT 355 ML", value: { sku_homologado: "Pilsen Callao - Lat - 355ml - 6p"}},
//   {label: "CORONA CERVEZA EXTRA PK 6 BT 330 ML", value: { sku_homologado: "Corona - Bot - 330ml - 6p"}},
//   {label: "PILSEN CERVEZA PK 12 LT 355 ML", value: { sku_homologado: "Pilsen Callao - Lat - 355ml - 12p"}},
//   {label: "PILSEN CERVEZA PK 6 LA 473 ML", value: { sku_homologado: "Pilsen Callao - Lat - 473ml - 6p"}},
//   {label: "CORONA CERVEZA MINI EXTRA PK 6 BT 210 ML", value: { sku_homologado: "Corona - Bot - 210ml - 6p"}},
//   {label: "CRISTAL CERVEZA CAJA X24 BT 305 ML", value: { sku_homologado: "Cristal - Bot - 305ml - 24p"}},
//   {label: "PILSEN TRUJILLO PK 6 LT 355 ML", value: { sku_homologado: "Pilsen Trujillo - Lat - 355ml - 6p"}},
//   {label: "CERVEZA NR PILSEN TWELVE LATA X355ML", value: { sku_homologado: "Pilsen Callao - Lat - 355ml - 12p"}},
//   {label: "CERVEZA CRISTAL LATA X 355 ML TRMBLE X 12 UND", value: { sku_homologado: "Cristal - Lat - 355ml - 12p"}},
//   {label: "STELLA ARTOIS BOT X 330 ML SIX PACK", value: { sku_homologado: "Stella - Bot - 330ml - 6p"}},
//   {label: "CERVEZA CUSQUENA TRIGO BOTELLA 310ML X 6UND", value: { sku_homologado: "Cusqueña Trigo - Bot - 310ml - 6p"}},
//   {label: "CERVEZA PILSEN CALLAO LATA 269ML X 6UND", value: { sku_homologado: "Pilsen Callao - Lat - 269ml - 6p"}},
//   {label: "SIX PACK CERVEZA CUSQUEÑA DORADA LT X 355ML.", value: { sku_homologado: "Cusqueña Dorada - Lat - 355ml - 6p"}},
//   {label: "SIX PACK CERVEZA CUSQUEÑA TRIGO LT X 355ML", value: { sku_homologado: "Cusqueña Trigo - Lat - 355ml - 6p"}},
//   {label: "AGUA MINERAL SAN MATEO SIN GAS BIDON X 7 LITRO", value: { sku_homologado: "San Mateo - Bidón - 7Lts - unit"}},
//   {label: "SIX PACK CERVEZA PILSEN BT X 305ML", value: { sku_homologado: "Pilsen Callao - Bot - 305ml - 6p"}},
//   {label: "CERVEZA CUSQUENA NEGRA BOTELLA 310ML X 6UND", value: { sku_homologado: "Cusqueña Malta - Bot - 310ml - 6p"}},
//   {label: "CERVEZA CRISTAL LATA X 355 ML TRMBLE X 6 UND", value: { sku_homologado: "Cristal - Lat - 355ml - 6p"}},
//   {label: "CORONA CERO SIN ALCOHOL 355 ML PACK X6", value: { sku_homologado: "Corona Cero - Bot - 355ml - 6p"}},
//   {label: "SIX PACK CERVEZA CUSQUEÑA NEGRA LT X 355ML", value: { sku_homologado: "Cusqueña Malta - Lat - 355ml - 6p"}},
//   {label: "CERVEZA SAN JUAN LATA X 355 ML TRMBLE X 6 UND", value: { sku_homologado: "San Juan - Lat - 355ml - 6p"}},
//   {label: "Corona 355ml 6pk BT ", value: { sku_homologado: "Corona - Bot - 355ml - 6p"}}
// ]

// db.exhibicion_contraprestada.updateMany(
//   {
//     fecha_creacion: {
//       $gte: ISODate("2024-11-03T00:00:00.000Z"),
//       $lt: ISODate("2024-11-06T00:00:00.000Z")
//     }
//   },
//   [
//     {
//       $set: {
//         marca_homologada: {
//           $let: {
//             vars: {
//               match: {
//                 $arrayElemAt: [
//                   {
//                     $filter: {
//                       input: marcas,
//                       cond: { $eq: [ { $toLower: "$$this.label" }, { $toLower: "$marca" } ] }
//                     }
//                   },
//                   0
//                 ]
//               }
//             },
//             in: { $ifNull: ["$$match.value.marca_homologada", "por_homologar_marca"] }
//           }
//         },
//         linea_homologada: {
//           $let: {
//             vars: {
//               match: {
//                 $arrayElemAt: [
//                   {
//                     $filter: {
//                       input: marcas,
//                       cond: { $eq: [ { $toLower: "$$this.label" }, { $toLower: "$marca" } ] }
//                     }
//                   },
//                   0
//                 ]
//               }
//             },
//             in: { $ifNull: ["$$match.value.linea_homologada", "por_homologar_linea"] }
//           }
//         },
//         sku_homologado: {
//           $let: {
//             vars: {
//               match: {
//                 $arrayElemAt: [
//                   {
//                     $filter: {
//                       input: skus,
//                       cond: { $eq: [ { $toLower: "$$this.label" }, { $toLower: "$skus" } ] }
//                     }
//                   },
//                   0
//                 ]
//               }
//             },
//             in: { $ifNull: ["$$match.value.sku_homologado", "por_homologar_sku"] }
//           }
//         }
//       }
//     }
//   ]
// );

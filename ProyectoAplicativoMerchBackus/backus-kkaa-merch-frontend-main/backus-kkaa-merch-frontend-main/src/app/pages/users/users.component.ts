import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTreeModule } from 'ng-zorro-antd/tree';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { FlatTreeControl } from '@angular/cdk/tree';
import { NzTreeFlatDataSource, NzTreeFlattener } from 'ng-zorro-antd/tree-view';
import { NzTreeViewModule } from 'ng-zorro-antd/tree-view';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzModalModule } from 'ng-zorro-antd/modal';

import { MenuService } from '../menu/menu.service';
import { UserService } from './users.service';
import { NzListModule } from 'ng-zorro-antd/list';
import { RolService } from './rol.service';
import { parse } from 'uuid';
import es from '@angular/common/locales/es';
import { StoreOfflineService } from '@shared/services/offline.service';
import {
  FormControl,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { SpinnerLoadingComponent } from '@shared/components/spinner-loading/spinner-loading.component';
import { FilterTableCommercialEstructureReportsComponent } from '@shared/components/filter-table-commercial-estructure-reports/filter-table-commercial-estructure-reports.component';
import { DateService } from '@shared/services/date.service';

interface TreeNode {
  name: string;
  key: string;
  children?: TreeNode[];
}

interface FlatNode {
  expandable: boolean;
  name: string;
  key: string;
  level: number;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    NzDrawerModule,
    ReactiveFormsModule,
    FormsModule,
    FilterTableCommercialEstructureReportsComponent,
    NzTabsModule,
    NzSwitchModule,
    NzInputModule,
    NzFormModule,
    NzButtonModule,
    NzDividerModule,
    NzTableModule,
    NzPaginationModule,
    NzListModule,
    NzAvatarModule,
    NzPopconfirmModule,
    NzSelectModule,
    NzSwitchModule,
    NzLayoutModule,
    NzTreeViewModule,
    NzToolTipModule,
    NzIconModule,
    NzTreeModule,
    NzTypographyModule,
    NzImageModule,
    NzCollapseModule,
    SpinnerLoadingComponent,
    NzModalModule,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent {
  passwordVisible = false;
  loading = false;
  user: any = localStorage.getItem('user');
  user_id = this.user ? JSON.parse(this.user).userId : '0';
  userName = this.user ? JSON.parse(this.user).userName : '-';
  isEditUser: boolean = false;
  visibleRol = false;
  visibleUser = false;
  pageIndexRoles: number = 1;
  pageSizeRoles: number = 10;
  pageIndexUsers: number = 1;
  pageSizeUsers: number = 10;
  pageTotalUsers: number = 0;
  loadingRoles: boolean = false;
  loadingUsers: boolean = false;
  rol: FormGroup<any>;
  userForm: FormGroup<any>;
  roles: any[] = [];
  users: any[] = [];
  menus: { nombre: string; activo: boolean; permisos: Array<any> }[] = [];
  listMenus: Array<{
    nombre: string;
    activo: boolean;
    permisos?: Array<{}>;
  }> = [
    {
      nombre: 'HOME',
      activo: true,
      permisos: [
        {
          id: 'btn_backus',
          nombre: 'BTN BACKUS',
          estado: true,
        },
        {
          id: 'btn_precio',
          nombre: 'BTN PRECIO',
          estado: true,
        },
        {
          id: 'btn_precio_cambiar',
          nombre: 'BTN PRECIO CAMBIAR',
          estado: true,
        },
        {
          id: 'btn_precio_switch',
          nombre: 'BTN PRECIO SWITCH',
          estado: true,
        },
        {
          id: 'btn_precio_photo',
          nombre: 'BTN PRECIO PHOTO',
          estado: true,
        },
        {
          id: 'btn_exhibiciones_cambiar',
          nombre: 'BTN EXHIBICIONES CAMBIAR',
          estado: true,
        },
        {
          id: 'btn_exhibiciones_contra',
          nombre: 'BTN EXHIBICIONES CONTRA',
          estado: true,
        },
        {
          id: 'btn_exhibiciones_contra_alertas',
          nombre: 'BTN EXHIBICIONES CONTRA ALERTAS',
          estado: true,
        },
        {
          id: 'btn_exhibiciones_contra_vigentes',
          nombre: 'BTN_EXHIBICIONES CONTRA VIGENTES',
          estado: true,
        },
        {
          id: 'btn_exhibiciones_adicional',
          nombre: 'BTN EXHIBICIONES ADICIONAL',
          estado: true,
        },
        {
          id: 'btn_exhibiciones_adicional_creacion',
          nombre: 'BTN_EXHIBICIONES ADICIONAL CREACIÓN',
          estado: true,
        },
        {
          id: 'btn_exhibiciones_adicional_creacion_photo',
          nombre: 'BTN_EXHIBICIONES ADICIONAL CREACIÓN PHOTO',
          estado: true,
        },
        {
          id: 'btn_exhibiciones_adicional_vigentes',
          nombre: 'BTN_EXHIBICIONES ADICIONAL VIGENTES',
          estado: true,
        },
        {
          id: 'btn_exhibiciones_adicional_renovables',
          nombre: 'BTN_EXHIBICIONES ADICIONAL RENOVABLES',
          estado: true,
        },
        {
          id: 'btn_exhibiciones_competencia',
          nombre: 'BTN EXHIBICIONES COMPETENCIA',
          estado: true,
        },
        {
          id: 'btn_exhibiciones_competencia_creacion',
          nombre: 'BTN EXHIBICIONES COMPETENCIA CREACION',
          estado: true,
        },
        {
          id: 'btn_exhibiciones_competencia_creacion photo',
          nombre: 'BTN EXHIBICIONES COMPETENCIA CREACION PHOTO',
          estado: true,
        },
        {
          id: 'btn_exhibiciones_competencia_vigentes',
          nombre: 'BTN EXHIBICIONES COMPETENCIA VIGENTES',
          estado: true,
        },
        {
          id: 'btn_exhibiciones_competencia_renovables',
          nombre: 'BTN EXHIBICIONES COMPETENCIA RENOVABLES',
          estado: true,
        },
        {
          id: 'btn_frentes',
          nombre: 'BTN FRENTES',
          estado: true,
        },
        {
          id: 'btn_frentes_photo',
          nombre: 'BTN FRENTES PHOTO',
          estado: true,
        },
        {
          id: 'btn_incidencias',
          nombre: 'BTN INCIDENCIAS',
          estado: true,
        },
        {
          id: 'btn_incidencias_competencia',
          nombre: 'BTN INCIDENCIAS COMPETENCIAS',
          estado: true,
        },
        {
          id: 'btn_incidencias_competencia_photo',
          nombre: 'BTN INCIDENCIAS COMPETENCIAS PHOTO',
          estado: true,
        },
        {
          id: 'btn_incidencias_muebles',
          nombre: 'BTN INCIDENCIAS MUEBLES',
          estado: true,
        },
        {
          id: 'btn_incidencias_muebles_nuevo',
          nombre: 'BTN INCIDENCIAS MUEBLES NUEVO',
          estado: true,
        },
        {
          id: 'btn_incidencias_muebles_asignacion',
          nombre: 'BTN INCIDENCIAS MUEBLES ASIGNACION',
          estado: true,
        },
        {
          id: 'btn_incidencias_muebles_recojo',
          nombre: 'BTN INCIDENCIAS MUEBLES RECOJO',
          estado: true,
        },
        {
          id: 'btn_incidencias_muebles_mantenimiento',
          nombre: 'BTN INCIDENCIAS MUEBLES MANTENIMIENTO',
          estado: true,
        },
        {
          id: 'btn_incidencias_stock',
          nombre: 'BTN INCIDENCIAS STOCK',
          estado: true,
        },
      ],
    },
    {
      nombre: 'PRECIO',
      activo: true,
      permisos: [
        {
          id: 'btn_precio_xls',
          nombre: 'BTN PRECIO XLS',
          estado: true,
        },
      ],
    },
    {
      nombre: 'EXHIBICIONES',
      activo: true,
      permisos: [
        {
          id: 'btn_exhibiciones_adicional',
          nombre: 'BTN EXHIBICIONES ADICIONAL',
          estado: true,
        },
        {
          id: 'btn_exhibiciones_competencia',
          nombre: 'BTN EXHIBICIONES COMPENTENCIA',
          estado: true,
        },
        {
          id: 'btn_exhibiciones_contraprestada',
          nombre: 'BTN EXHIBICIONES CONTRAPRESTADA',
          estado: true,
        },
      ],
    },
    {
      nombre: 'FRENTES',
      activo: true,
      permisos: [
        {
          id: 'btn_frentes_xls',
          nombre: 'BTN FRENTES XLS',
          estado: true,
        },
      ],
    },
    {
      nombre: 'INCIDENCIAS',
      activo: true,
      permisos: [
        {
          id: 'btn_incidencias_competencia',
          nombre: 'BTN INCIDENCIAS COMPETENCIA',
          estado: true,
        },
        {
          id: 'btn_incidencias_mueble_asignacion',
          nombre: 'BTN INCIDENCIAS MUEBLE ASIGNACION',
          estado: true,
        },
        {
          id: 'btn_incidencias_mueble_mantenimiento',
          nombre: 'BTN INCIDENCIAS MUEBLE MANTEMIENTO',
          estado: true,
        },
        {
          id: 'btn_incidencias_mueble_recojo',
          nombre: 'BTN INCIDENCIAS MUEBLE RECOJO',
          estado: true,
        },
      ],
    },
    {
      nombre: 'STOCK',
      activo: true,
      permisos: [
        {
          id: 'btn_stock_xls',
          nombre: 'BTN STOCK XLS',
          estado: true,
        },
      ],
    },
    {
      nombre: 'SKU',
      activo: true,
      permisos: [
        {
          id: 'btn_sku_xls',
          nombre: 'BTN SKU XLS',
          estado: true,
        },
      ],
    },
    {
      nombre: 'POC',
      activo: true,
      permisos: [
        {
          id: 'btn_poc_xls',
          nombre: 'BTN POC XLS',
          estado: true,
        },
      ],
    },
    {
      nombre: 'USUARIOS',
      activo: true,
      permisos: [
        {
          id: 'btn_usuarios_xls',
          nombre: 'BTN USUARIOS XLS',
          estado: true,
        },
      ],
    },
  ];

  treeData: TreeNode[] = [];

  // filtros
  columnFiltersRoles: any = {
    nombre: [],
  };
  filtersRoles: any = {
    nombre: { data: [], isRemoveFilter: true },
  };
  // usuario id, nombre, rol, estado
  columnFiltersUsers: any = {
    usuario_id: [],
    nombre: [],
    rol: [],
    estado: [],
  };
  filtersUsers: any = {
    usuario_id: { data: [], isRemoveFilter: true },
    nombre: { data: [], isRemoveFilter: true },
    rol: { data: [], isRemoveFilter: true },
    estado: { data: [], isRemoveFilter: true },
  };
  //filtros

  private transformer = (node: TreeNode, level: number): FlatNode => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode =
      existingNode && existingNode.key === node.key
        ? existingNode
        : {
            expandable: node?.children?.length == 0,
            name: node.name,
            level,
            key: node.key,
          };
    flatNode.name = node.name;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  };

  flatNodeMap = new Map<FlatNode, TreeNode>();
  nestedNodeMap = new Map<TreeNode, FlatNode>();
  selectListSelection = new SelectionModel<FlatNode>(true);

  treeControl = new FlatTreeControl<FlatNode>(
    (node) => node.level,
    (node) => node.expandable
  );
  treeFlattener = new NzTreeFlattener(
    this.transformer,
    (node) => node.level,
    (node) => node.expandable,
    (node) => node.children
  );

  dataSource = new NzTreeFlatDataSource(this.treeControl, this.treeFlattener);

  constructor(
    private router: Router,
    private menuService: MenuService,
    private rolService: RolService,
    private userService: UserService,
    private fb: NonNullableFormBuilder,
    private notification: NzNotificationService,
    private dateService: DateService,
    private StoreofflineService: StoreOfflineService
  ) {
    this.rol = new FormGroup(
      {
        _id: new FormControl(''),
        nombre: new FormControl('', [Validators.required]),
        descripcion: new FormControl<string>(''),
        activo: new FormControl<boolean>(true),
      },
      {}
    );

    this.userForm = new FormGroup(
      {
        _id: new FormControl(''),
        usuario_id: new FormControl('', [Validators.required]),
        usuario_id_creacion: new FormControl(''),
        nombre: new FormControl('', [Validators.required]),
        contraseña: new FormControl<string>(''),
        estado: new FormControl<boolean>(true),
        rol: new FormControl<string>('', [Validators.required]),
      },
      {}
    );
  }

  ngOnInit() {
    this.getRoles();
    this.getUsers();
    this.loadFiltersRoles();
    this.loadFiltersUsers();
  }

  async getRoles(): Promise<void> {
    this.loadingRoles = true;
    try {
      let filters = [];
      for (const key in this.filtersRoles) {
        if (
          !this.filtersRoles[key].isRemoveFilter &&
          this.filtersRoles[key].data.length != 0
        ) {
          filters.push({ key, values: this.filtersRoles[key].data });
        }
      }
      const roles = await this.rolService.getRoles(
        this.pageIndexRoles,
        this.pageSizeRoles,
        filters
      );
      this.loadingRoles = false;
      this.roles = JSON.parse(JSON.stringify(roles));
    } catch (error) {
      this.loadingRoles = false;
      this.notification.create('error', 'Error', 'Error al obtener los roles');
      console.error('Error al obtener los roles:', error);
    }
  }

  async getUsers(): Promise<void> {
    this.loadingUsers = true;
    try {
      let filters = [];
      for (const key in this.filtersUsers) {
        if (
          !this.filtersUsers[key].isRemoveFilter &&
          this.filtersUsers[key].data.length != 0
        ) {
          filters.push({ key, values: this.filtersUsers[key].data });
        }
      }
      const data = await this.userService.getUsuarios(
        this.pageIndexUsers,
        this.pageSizeUsers,
        filters
      );
      this.loadingUsers = false;
      this.users = data?.docs;
      this.pageTotalUsers = data?.totalDocs;
    } catch (error) {
      this.loadingUsers = false;
      this.notification.create(
        'error',
        'Error',
        'Error al obtener los usuarios'
      );
      console.error('Error al obtener los usuarios:', error);
    }
  }

  loadFiltersRoles() {
    this.rolService.getFilters().subscribe({
      next: (filters) => {
        const filterName = filters.nombre.map((item: string) => ({
          text: item,
          value: item,
          selected: false,
        }));
        this.columnFiltersRoles.nombre = filterName;
      },
      error: (error) => {
        console.error('Error al cargar filtros:', error);
      },
    });
  }
  loadFiltersUsers() {
    this.userService.getFilters().subscribe({
      next: (filters) => {
        this.columnFiltersUsers.usuario_id = filters.usuario_id.map(
          (item: string) => ({ text: item, value: item, selected: false })
        );
        this.columnFiltersUsers.nombre = filters.nombre.map((item: string) => ({
          text: item,
          value: item,
          selected: false,
        }));
        this.columnFiltersUsers.rol = [
          { text: 'Administrador', value: 'admin', selected: false },
          { text: 'Backoffice', value: 'backoffice', selected: false },
          { text: 'Supervisor', value: 'supervisor', selected: false },
          { text: 'BDR', value: 'bdr', selected: false },
        ];
        this.columnFiltersUsers.estado = [
          { text: 'Activo', value: '1', selected: false },
          { text: 'Desactivado', value: '0', selected: false },
        ];
      },
      error: (error) => {
        console.error('Error al cargar filtros:', error);
      },
    });
  }

  async handleFilter(
    { selectedFilterItems, filterItems, isRemoveFilter }: any,
    table: string,
    column: string
  ) {
    if (table == 'roles') {
      if (column === 'nombre') {
        this.filtersRoles.nombre.data = selectedFilterItems;
        this.filtersRoles.nombre.isRemoveFilter = isRemoveFilter;
      }
      this.getRoles();
    } else {
      if (column === 'usuario-id') {
        this.filtersUsers.usuario_id.data = selectedFilterItems;
        this.filtersUsers.usuario_id.isRemoveFilter = isRemoveFilter;
      } else if (column === 'nombre') {
        this.filtersUsers.nombre.data = selectedFilterItems;
        this.filtersUsers.nombre.isRemoveFilter = isRemoveFilter;
      } else if (column === 'rol') {
        this.filtersUsers.rol.data = selectedFilterItems;
        this.filtersUsers.rol.isRemoveFilter = isRemoveFilter;
      } else if (column === 'estado') {
        this.filtersUsers.estado.data = selectedFilterItems;
        this.filtersUsers.estado.isRemoveFilter = isRemoveFilter;
      }
      this.getUsers();
    }
  }

  hasChild = (_: number, node: FlatNode): boolean => node.expandable;
  hasNoContent = (_: number, node: FlatNode): boolean => node.name === '';
  trackBy = (_: number, node: FlatNode): string => `${node.key}-${node.name}`;

  delete(node: FlatNode): void {
    const originNode = this.flatNodeMap.get(node);

    const dfsParentNodes = (): TreeNode[] => {
      const stack = [...this.treeData];
      const parents = [];
      while (stack.length > 0) {
        const n = stack.pop()!;
        if (n.children) {
          if (n.children.find((e) => e === originNode)) {
            parents.push(n);
          }

          for (let i = n.children.length - 1; i >= 0; i--) {
            stack.push(n.children[i]);
          }
        }
      }
      return parents;
    };

    const parentNodes = dfsParentNodes();
    parentNodes.forEach((parentNode) => {
      if (parentNode && parentNode.children) {
        parentNode.children = parentNode.children.filter(
          (e) => e !== originNode
        );
      }
    });

    this.dataSource.setData(this.treeData);
  }
  addNewNode(node: FlatNode): void {
    const parentNode = this.flatNodeMap.get(node);
    if (parentNode) {
      parentNode.children = parentNode.children || [];
      parentNode.children.push({
        name: '',
        key: `${parentNode.key}-${parentNode.children.length}`,
        children: [],
      });
      this.dataSource.setData(this.treeData);
      this.treeControl.expand(node);
    }
  }

  saveNode(node: FlatNode, value: string): void {
    const nestedNode = this.flatNodeMap.get(node);
    if (nestedNode) {
      nestedNode.name = value;
      this.dataSource.setData(this.treeData);
    }
  }

  prepareNewRol(): void {
    this.visibleRol = true;
    this.rol.reset({
      id: '',
      nombre: '',
      descripcion: '',
      permisos: [],
      activo: true,
    });

    this.menus = JSON.parse(JSON.stringify(this.listMenus));
  }

  prepareNewUser(): void {
    this.isEditUser = false;
    this.visibleUser = true;
    this.userForm.reset({
      _id: '',
      usuario_id: '',
      nombre: '',
      usuario_id_creacion: '',
      contraseña: '',
      estado: true,
      rol: '',
    });
    const usuarioIdControl = this.userForm.get('usuario_id');
    if (usuarioIdControl) {
      // Paso 2: Habilita el FormControl
      usuarioIdControl.enable();
    }
  }

  convertArrayToMap(
    array: any[],
    map: Map<string, any> = new Map()
  ): Map<string, any> {
    array.forEach((item) => {
      map.set(item.key, item);
      if (item.children && item.children.length > 0) {
        this.convertArrayToMap(item.children, map);
      }
    });
    return map;
  }

  addItemMenu(e?: MouseEvent): void {
    e?.preventDefault();
    this.menus.push({
      nombre: ``,
      activo: true,
      permisos: [],
    });
  }

  updateMenuName(newName: any, index: number): void {
    this.menus[index].nombre = String(newName).toUpperCase();

    this.updateTreeData();
  }

  removeItemMenu(index: any, e: MouseEvent): void {
    e.preventDefault();
    const deletedItem = this.menus.splice(index, 1);
  }

  updateTreeData() {
    // Paso 1: Crear un mapa de los datos actuales en treeData
    const treeDataMap = new Map(
      this.treeData.map((item, index) => [String(index), item])
    );

    // Paso 2: Iterar sobre this.menus para actualizar o agregar elementos
    this.menus.forEach((menu, index) => {
      const key = `${index}`;
      if (treeDataMap.has(key)) {
        // Paso 3a: Actualizar el elemento existente si es necesario
        const existingItem: any = treeDataMap.get(key);
        // Aquí puedes actualizar las propiedades de existingItem si es necesario
        existingItem.name = menu.nombre;
      } else {
        // Paso 3b: Agregar el nuevo elemento al mapa
        const newItem = {
          key: key,
          name: menu.nombre,
          estado: true,
          children: [],
        };
        treeDataMap.set(key, newItem);
      }
    });

    // Paso 4: Generar el nuevo treeData a partir del mapa
    this.treeData = Array.from(treeDataMap.values());

    // Paso 5: Actualizar dataSource y expandir el árbol
    console.log('treeData', this.treeData);
    this.dataSource.setData(this.treeData);
    this.treeControl.expandAll();
  }

  deletedTreeData(index: number) {
    // Paso 1: Verificar si el índice es válido
    if (index >= 0 && index < this.treeData.length) {
      // Paso 2: Quitar el elemento en el índice dado
      this.treeData.splice(index, 1);

      // Paso 3: Actualizar dataSource con el nuevo treeData
      this.dataSource.setData(this.treeData);

      // Paso 4: Expandir el árbol (opcional)
      this.treeControl.expandAll();
    }
  }

  closeDrawRol(): void {
    this.visibleRol = false;
  }

  closeDrawUser(): void {
    this.visibleUser = false;
  }

  async saveRol() {
    this.loading = true;
    const parseRol = this.rol.value;
    const rolId = parseRol._id;
    delete parseRol._id;

    parseRol.permisos = JSON.parse(JSON.stringify(this.menus));
    // Validar los datos del rol antes de intentar insertarlo
    if (!this.validateRol(parseRol)) {
      this.loading = false;
      this.notification.error('!Error¡', 'Los datos del rol no son válidos', {
        nzDuration: 0,
      });
      return;
    }

    try {
      if (rolId) {
        const result = await this.rolService.updateRol(rolId, parseRol);
      } else {
        const result = await this.rolService.insertRol(parseRol);
      }
      this.notification.success('!Exitoso¡', 'Rol agregado con éxito', {
        nzDuration: 0,
      });
      this.getRoles();
      this.loading = false;
    } catch (error) {
      this.loading = false;
      this.notification.error('!Error¡', 'Error al agregar el rol', {
        nzDuration: 0,
      });
      console.error('Error al agregar el rol:', error);
    }

    this.closeDrawRol();
  }

  async saveUser() {
    this.loading = true;
    const parseUser = this.userForm.value;
    console.log('Usuario-userForm', this.userForm);
    console.log('Usuario a guardar:', parseUser);
    const userId = parseUser._id;
    delete parseUser._id;
    parseUser.usuario_id_creacion = this.user_id;
    // Validar los datos del rol antes de intentar insertarlo
    if (!this.validateUser(parseUser)) {
      this.loading = false;
      this.notification.error(
        '!Error¡',
        'Los datos del usuario no son válidos',
        { nzDuration: 0 }
      );
      return;
    }
    console.log('Usuario a guardar:', parseUser);
    try {
      if (navigator.onLine) {
        if (userId) {
          const result = await this.userService.updateUsuario(
            userId,
            parseUser
          );
          this.notification.success(
            '!Exitoso¡',
            'Usuario actulizado con éxito',
            { nzDuration: 0 }
          );
        } else {
          parseUser.fecha_creacion = new Date();
          const result = await this.userService.insertUsuario(parseUser);
          this.notification.success('!Exitoso¡', 'Usuario agregado con éxito', {
            nzDuration: 0,
          });
        }
      } else {
        await this.StoreofflineService.addDocument('data', parseUser);
      }

      this.loadingUsers = true;
      this.getUsers();
      this.closeDrawUser();
      this.loading = false;
    } catch (error) {
      this.loading = false;
      this.notification.error('!Error¡', 'Error al agregar el usuario', {
        nzDuration: 0,
      });
      this.closeDrawUser();
      console.error('Error al agregar el usuario:', error);
    }

    this.closeDrawRol();
  }

  validateRol(rol: any): boolean {
    // Agrega aquí las validaciones necesarias para los datos del rol
    // Por ejemplo, puedes verificar que el nombre del rol no esté vacío
    if (!rol.nombre) {
      return false;
    }

    // Si todas las validaciones pasan, devuelve true
    return true;
  }

  validateUser(user: any): boolean {
    console.log('Usuario', user);
    if (!user.nombre) {
      return false;
    }

    if (!user.usuario_id) {
      return false;
    }

    if (!this.isEditUser) {
      return user.estado;
    }

    if (!user.rol) {
      return false;
    }

    // if (!user.password) {
    //   return false;
    // }
    // Si todas las validaciones pasan, devuelve true
    return true;
  }

  handleChangeStore(menuApp: string) {
    console.log('menuApp', menuApp);
    this.menuService.typeApp = menuApp;
  }

  prepareDataTree(permisos: any): any {
    return permisos.map((permiso: any) => {
      let children = [];
      if (permiso.children && permiso.children.length > 0) {
        children = this.prepareDataTree(permiso.children);
      }
      return {
        title: permiso.nombre, // cambia a la propiedad que quieras usar para el título
        key: permiso.id, // cambia a la propiedad que quieras usar para la clave
        children: children,
      };
    });
  }

  openEditRol(rol: any): void {
    this.visibleRol = true;
    this.rol.patchValue(rol);
    this.menus = JSON.parse(JSON.stringify(rol.permisos));
  }

  prepareEditUser(user: any): void {
    this.isEditUser = true;
    // const usuarioIdControl = this.userForm.get('usuario_id');
    // if (usuarioIdControl) {
    //   usuarioIdControl.disable();
    // }
    // this.userForm.reset({
    //   _id: user._id,
    //   usuario_id: '',
    //   usuario_id_creacion: '',
    //   nombre: '',
    //   contraseña: '',
    //   estado: true,
    //   rol: ''
    // });
    // this.userForm.patchValue({...user, contraseña: ''});
    console.log('Usuario a editar:', user);
    const usuarioIdControl = this.userForm.get('usuario_id');
    const wasDisabled = usuarioIdControl && usuarioIdControl.disabled;
    if (wasDisabled) {
      usuarioIdControl.enable();
    }

    // Aplicar patchValue
    this.userForm.patchValue({
      _id: user._id || '',
      usuario_id: user.usuario_id || '',
      usuario_id_creacion: user.usuario_id_creacion || '',
      nombre: user.nombre || '',
      contraseña: '', // Restablecer contraseña explícitamente
      estado: user.estado || true,
      rol: user.rol || '',
    });

    // Volver a deshabilitar el control si estaba deshabilitado anteriormente
    if (wasDisabled) {
      usuarioIdControl.disable();
    }

    this.visibleUser = true;
    console.log('Usuario a editar:', this.userForm.value);
  }

  deleteUser(idUser: any): void {
    this.userService.deleteUsuario(idUser).then(() => {
      this.getUsers();
    });
  }

  expandSet = new Set<number>();
  onExpandChange(id: number, checked: boolean): void {
    if (checked) {
      this.expandSet.add(id);
    } else {
      this.expandSet.delete(id);
    }
  }

  onSwitchChange(event: any, item: any): void {
    // Actualiza el estado del ítem basado en el valor del switch
    item.estado = event;
    console.log('Estado actualizado:', item.estado);
    // Aquí puedes agregar lógica adicional, como actualizar el estado en el backend
  }

  handlePaginationUsers(pageIndex: number) {
    this.pageIndexUsers = pageIndex;
    this.getUsers();
  }

  exportExcel(): void {
    this.loading = true;
    this.userService.exportExcel().subscribe({
      next: (blob: Blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download =
          this.dateService.generateFormattedDateForExport() +
          '-usuario' +
          '.xlsx';
        a.click();
        URL.revokeObjectURL(objectUrl);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al Exportar:', error);
        this.loading = false;
      },
    });
  }
}

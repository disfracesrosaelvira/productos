const Constantes = {
  EXCEL_VALID_HEADERS: {
    exhibicion: {
      // contraprestada: ['empresa_id', 'poc_nombre', 'zona', 'tienda', 'campaña', 'fecha_inicio', 'fecha_fin', 'marca', 'skus', 'vigencia_fecha_inicio', 'vigencia_fecha_fin'],
      contraprestada: ['empresa_id', 'poc_nombre', 'zona', 'tipo_exhibicion_homologado', 'tipo_exhibicion', 'correlativo', 'tienda', 'campaña', 'fecha_inicio', 'fecha_fin', 'marca', 'skus', 'vigencia_fecha_inicio', 'vigencia_fecha_fin', 'fecha_de_carga'],
    },
  },
  NAME_CONTAINER_PANTILLA_FOR_ENTITY: {
    exhibicion_contraprestada: 'plantilla/exhibicion/contraprestada',
  },
  NAME_PANTILLA_FOR_ENTITY: {
    exhibicion_contraprestada:  'exhibicion contraprestada plantilla.xlsx',
  },
  // Nombre de las columnas fecha para cada entidad  
  NAME_COLUMNS_FECHA_FOR_ENTITY: {
    exhibicion: {
      contraprestada: `fecha`
    }
  },
  // Nombre de las columnas fecha para cada entidad  
  FORMATO_DATE_FOR_ENTITY_AND_TYPE_ENTITY: {
    exhibicion: {
      contraprestada: `dd/MM/yyyy`
    }
  },
  ESTRUCTURA_COMERCIAL_TYPE:{supervisor:'supervisor',bdr:'bdr'}
  
};

export default Constantes;

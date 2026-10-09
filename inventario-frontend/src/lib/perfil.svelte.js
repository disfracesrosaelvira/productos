import { supabase } from './supabase.js'

let perfil = $state(null)
let cargando = $state(false)

export async function cargarPerfil(userId) {
  if (!userId) {
    perfil = null
    return
  }
  cargando = true
  try {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, role, estado')
      .eq('id', userId)
      .maybeSingle()

    let permisos = {}
    if (data?.role) {
      const { data: rol } = await supabase
        .from('rol')
        .select('permisos')
        .eq('nombre', data.role)
        .maybeSingle()
      permisos = rol?.permisos ?? {}
    }
    perfil = data ? { ...data, permisos } : null
  } finally {
    cargando = false
  }
}

export function limpiarPerfil() {
  perfil = null
}

export const perfilActual = {
  get datos() {
    return perfil
  },
  get cargando() {
    return cargando
  },
  get rol() {
    return perfil?.role ?? null
  },
  get nombre() {
    return perfil?.full_name ?? ''
  },
  permite(menu) {
    if (!perfil) return false
    if (perfil.role === 'admin') return true
    return !!perfil.permisos?.[menu]
  },
}

import { MODO_PUBLICO } from './config.js'
import { supabase } from './supabase.js'

let sesion = $state(null)
let cargando = $state(true)

if (MODO_PUBLICO) {
  // El catálogo público no usa autenticación ni Supabase.
  cargando = false
} else {
  supabase.auth.getSession().then(({ data }) => {
    sesion = data.session
    cargando = false
  })

  supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
    sesion = nuevaSesion
    cargando = false
  })
}

export const auth = {
  get sesion() {
    return sesion
  },
  get usuario() {
    return sesion?.user ?? null
  },
  get cargando() {
    return cargando
  },
  get autenticado() {
    return !!sesion
  },
  async login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  },
  async logout() {
    await supabase.auth.signOut()
  },
}

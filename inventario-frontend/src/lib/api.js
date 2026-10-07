import { supabase } from './supabase.js'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function cabecerasAuth() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}), ...(await cabecerasAuth()) }
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const texto = await res.text()
  let data = null
  try {
    data = texto ? JSON.parse(texto) : null
  } catch {
    data = texto
  }
  if (!res.ok) {
    throw new Error(data?.error || `Error ${res.status}`)
  }
  return data
}

export const api = {
  base: BASE,

  // --- productos ---
  listarProductos: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v != null),
    ).toString()
    return request(`/products${qs ? `?${qs}` : ''}`)
  },
  obtenerProducto: (id) => request(`/products/${id}`),
  crearProducto: (body) => request('/products', { method: 'POST', body: JSON.stringify(body) }),
  actualizarProducto: (id, body) =>
    request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  eliminarProducto: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  subirImagen: (id, file, primary = false) => {
    const fd = new FormData()
    fd.append('file', file)
    return request(`/products/${id}/images?primary=${primary}`, { method: 'POST', body: fd })
  },
  eliminarImagen: (id, imageId) => request(`/products/${id}/images/${imageId}`, { method: 'DELETE' }),

  // --- variantes ---
  listarVariantes: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v != null),
    ).toString()
    return request(`/variants${qs ? `?${qs}` : ''}`)
  },
  crearVariante: (body) => request('/variants', { method: 'POST', body: JSON.stringify(body) }),
  actualizarVariante: (id, body) =>
    request(`/variants/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  eliminarVariante: (id) => request(`/variants/${id}`, { method: 'DELETE' }),

  // --- ventas ---
  crearVenta: (body) => request('/sales', { method: 'POST', body: JSON.stringify(body) }),
  listarVentas: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v != null),
    ).toString()
    return request(`/sales${qs ? `?${qs}` : ''}`)
  },

  // --- reportes ---
  bajoStock: (threshold = 3) => request(`/reports/low-stock?threshold=${threshold}`),
  resumenVentas: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v != null),
    ).toString()
    return request(`/reports/sales-summary${qs ? `?${qs}` : ''}`)
  },
  masVendidos: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v != null),
    ).toString()
    return request(`/reports/top-products${qs ? `?${qs}` : ''}`)
  },
}

// categorias: lectura directa (RLS publica)
export async function listarCategorias() {
  const { data, error } = await supabase.from('categories').select('id, name, slug').order('name')
  if (error) throw new Error(error.message)
  return data
}

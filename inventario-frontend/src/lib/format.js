export const soles = (n) => `S/ ${Number(n || 0).toFixed(2)}`

export const fecha = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

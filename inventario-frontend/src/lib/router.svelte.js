function rutaActual() {
  const hash = window.location.hash.replace(/^#/, '')
  return hash || '/'
}

let ruta = $state(rutaActual())

window.addEventListener('hashchange', () => {
  ruta = rutaActual()
})

export function navegar(path) {
  window.location.hash = path
}

export const router = {
  get ruta() {
    return ruta
  },
}

import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// base='/' en local; en GitHub Pages se pasa VITE_BASE=/<repo>/
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [
    svelte(),
    tailwindcss(),
    {
      name: 'titulo-modo-publico',
      transformIndexHtml(html) {
        if (process.env.VITE_MODO_PUBLICO === 'true') {
          return html.replace(
            '<title>Sistema de Inventario de Disfraces</title>',
            '<title>Disfraces Rosa Elvira</title>',
          )
        }
        return html
      },
    },
  ],
})

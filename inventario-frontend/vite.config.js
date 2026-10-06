import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// base='/' en local; en GitHub Pages se pasa VITE_BASE=/<repo>/
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [svelte(), tailwindcss()],
})

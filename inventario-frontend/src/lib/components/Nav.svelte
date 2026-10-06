<script>
  import { auth } from '../auth.svelte.js'
  import { router, navegar } from '../router.svelte.js'

  const enlaces = [
    { path: '/', texto: 'Catálogo' },
    { path: '/ventas', texto: 'Ventas' },
    { path: '/reportes', texto: 'Reportes' },
  ]
</script>

<header class="bg-slate-900 text-white sticky top-0 z-20">
  <div class="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2">
    <button class="font-semibold mr-2" onclick={() => navegar('/')}>👗 Inventario</button>
    <nav class="flex gap-1">
      {#each enlaces as e}
        <button
          class="px-3 py-1.5 rounded text-sm {router.ruta === e.path ? 'bg-slate-700' : 'hover:bg-slate-800'}"
          onclick={() => navegar(e.path)}>{e.texto}</button>
      {/each}
    </nav>
    <div class="ml-auto flex items-center gap-3 text-sm">
      <span class="hidden sm:inline text-slate-300">{auth.usuario?.email ?? ''}</span>
      <button
        class="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600"
        onclick={() => auth.logout()}>Salir</button>
    </div>
  </div>
</header>

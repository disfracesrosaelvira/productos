<script>
  import { auth } from '../auth.svelte.js'
  import { router, navegar } from '../router.svelte.js'
  import { cargarPerfil, limpiarPerfil, perfilActual } from '../perfil.svelte.js'
  import UsuariosDrawer from './UsuariosDrawer.svelte'

  const todos = [
    { path: '/', texto: 'Catálogo', menu: 'catalogo' },
    { path: '/ventas', texto: 'Ventas', menu: 'ventas' },
    { path: '/reportes', texto: 'Reportes', menu: 'reportes' },
  ]
  const enlaces = $derived(todos.filter((e) => perfilActual.permite(e.menu)))

  let menuAbierto = $state(false)

  $effect(() => {
    const usuario = auth.usuario
    if (usuario) cargarPerfil(usuario.id)
    else limpiarPerfil()
  })
</script>

<header class="bg-slate-900 text-white sticky top-0 z-20">
  <div class="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2">
    {#if perfilActual.permite('usuarios')}
      <button
        class="p-2 rounded hover:bg-slate-800"
        aria-label="Abrir menú de usuarios"
        title="Usuarios y roles"
        onclick={() => (menuAbierto = true)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    {/if}
    <button class="font-semibold mr-2" onclick={() => navegar('/')}>👗 Inventario</button>
    <nav class="flex gap-1">
      {#each enlaces as e}
        <button
          class="px-3 py-1.5 rounded text-sm {router.ruta === e.path ? 'bg-slate-700' : 'hover:bg-slate-800'}"
          onclick={() => navegar(e.path)}>{e.texto}</button>
      {/each}
    </nav>
    <div class="ml-auto flex items-center gap-2 text-sm">
      <span class="hidden sm:inline text-slate-300">{perfilActual.nombre || auth.usuario?.email || ''}</span>
      {#if perfilActual.rol}
        <span class="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-200">{perfilActual.rol}</span>
      {/if}
      <button
        class="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600"
        onclick={() => auth.logout()}>Salir</button>
    </div>
  </div>
</header>

<UsuariosDrawer abierto={menuAbierto} oncerrar={() => (menuAbierto = false)} />

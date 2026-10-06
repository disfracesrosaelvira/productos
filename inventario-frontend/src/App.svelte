<script>
  import { auth } from './lib/auth.svelte.js'
  import { router } from './lib/router.svelte.js'
  import Nav from './lib/components/Nav.svelte'
  import Login from './routes/Login.svelte'
  import Catalogo from './routes/Catalogo.svelte'
  import Detalle from './routes/Detalle.svelte'
  import Editar from './routes/Editar.svelte'
  import Ventas from './routes/Ventas.svelte'
  import Reportes from './routes/Reportes.svelte'

  function match(ruta) {
    const partes = ruta.split('/').filter(Boolean)
    if (partes.length === 0) return { vista: 'catalogo' }
    const [a, b, c] = partes
    if (a === 'ventas') return { vista: 'ventas' }
    if (a === 'reportes') return { vista: 'reportes' }
    if (a === 'producto') {
      if (b === 'nuevo') return { vista: 'editar', id: null }
      if (b && c === 'editar') return { vista: 'editar', id: b }
      if (b) return { vista: 'detalle', id: b }
    }
    if (a === 'login') return { vista: 'catalogo' }
    return { vista: 'catalogo' }
  }

  const actual = $derived(match(router.ruta))
</script>

{#if auth.cargando}
  <div class="min-h-screen flex items-center justify-center text-slate-500">Cargando…</div>
{:else if !auth.autenticado}
  <Login />
{:else}
  <Nav />
  <main class="pb-12">
    {#if actual.vista === 'catalogo'}
      <Catalogo />
    {:else if actual.vista === 'detalle'}
      {#key actual.id}<Detalle id={actual.id} />{/key}
    {:else if actual.vista === 'editar'}
      {#key actual.id}<Editar id={actual.id} />{/key}
    {:else if actual.vista === 'ventas'}
      <Ventas />
    {:else if actual.vista === 'reportes'}
      <Reportes />
    {/if}
  </main>
{/if}

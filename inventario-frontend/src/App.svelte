<script>
  import { auth } from './lib/auth.svelte.js'
  import { MODO_PUBLICO } from './lib/config.js'
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
  // En modo público solo se permite catálogo y detalle; el resto redirige al catálogo.
  const vista = $derived(
    MODO_PUBLICO && actual.vista !== 'detalle' ? { vista: 'catalogo' } : actual,
  )
</script>

{#if MODO_PUBLICO}
  <Nav />
  <main class="pb-12">
    {#if vista.vista === 'detalle'}
      {#key vista.id}<Detalle id={vista.id} />{/key}
    {:else}
      <Catalogo />
    {/if}
  </main>
{:else if auth.cargando}
  <div class="min-h-screen flex items-center justify-center text-slate-500">Cargando…</div>
{:else if !auth.autenticado}
  <Login />
{:else}
  <Nav />
  <main class="pb-12">
    {#if vista.vista === 'catalogo'}
      <Catalogo />
    {:else if vista.vista === 'detalle'}
      {#key vista.id}<Detalle id={vista.id} />{/key}
    {:else if vista.vista === 'editar'}
      {#key vista.id}<Editar id={vista.id} />{/key}
    {:else if vista.vista === 'ventas'}
      <Ventas />
    {:else if vista.vista === 'reportes'}
      <Reportes />
    {/if}
  </main>
{/if}

<script>
  import { onMount } from 'svelte'
  import { api, listarCategorias } from '../lib/api.js'
  import { navegar } from '../lib/router.svelte.js'
  import { supabase } from '../lib/supabase.js'
  import { soles } from '../lib/format.js'

  let productos = $state([])
  let categorias = $state([])
  let cargando = $state(true)
  let error = $state('')

  let q = $state('')
  let categoria = $state('')
  let genero = $state('')

  let mostrarSugerencias = $state(false)
  let indiceActivo = $state(-1)

  const sugerencias = $derived(
    q.trim() === ''
      ? []
      : productos
          .filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()))
          .slice(0, 8),
  )

  const totalStock = (p) => (p.variants ?? []).reduce((s, v) => s + (v.stock_quantity || 0), 0)

  async function cargar() {
    cargando = true
    error = ''
    try {
      const res = await api.listarProductos({ q, category: categoria, gender: genero, pageSize: 100 })
      productos = res.data
    } catch (e) {
      error = e.message
    } finally {
      cargando = false
    }
  }

  function buscar(evento) {
    evento.preventDefault()
    mostrarSugerencias = false
    cargar()
  }

  function limpiar() {
    q = ''
    categoria = ''
    genero = ''
    mostrarSugerencias = false
    cargar()
  }

  function seleccionarSugerencia(p) {
    mostrarSugerencias = false
    indiceActivo = -1
    navegar(`/producto/${p.id}`)
  }

  function cerrarSugerencias() {
    setTimeout(() => {
      mostrarSugerencias = false
      indiceActivo = -1
    }, 150)
  }

  function teclaBusqueda(evento) {
    if (!mostrarSugerencias || sugerencias.length === 0) return
    if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      indiceActivo = (indiceActivo + 1) % sugerencias.length
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      indiceActivo = (indiceActivo - 1 + sugerencias.length) % sugerencias.length
    } else if (evento.key === 'Enter' && indiceActivo >= 0) {
      evento.preventDefault()
      seleccionarSugerencia(sugerencias[indiceActivo])
    } else if (evento.key === 'Escape') {
      mostrarSugerencias = false
      indiceActivo = -1
    }
  }

  onMount(async () => {
    try {
      categorias = await listarCategorias()
    } catch {
      /* ignora */
    }
    await cargar()

    const canal = supabase
      .channel('catalogo')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'variants' }, cargar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, cargar)
      .subscribe()

    return () => supabase.removeChannel(canal)
  })
</script>

<div class="max-w-6xl mx-auto p-4 space-y-4">
  <div class="flex items-center justify-between gap-3 flex-wrap">
    <h1 class="text-xl font-semibold">Catálogo de disfraces</h1>
    <button
      class="rounded bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800"
      onclick={() => navegar('/producto/nuevo')}>+ Nuevo producto</button>
  </div>

  <form class="bg-white rounded-lg shadow p-3 flex gap-2 flex-wrap items-center" onsubmit={buscar}>
    <div class="relative flex-1 min-w-[12rem]">
      <input
        bind:value={q}
        oninput={() => {
          indiceActivo = -1
          mostrarSugerencias = true
        }}
        onfocus={() => (mostrarSugerencias = true)}
        onblur={cerrarSugerencias}
        onkeydown={teclaBusqueda}
        placeholder="Buscar por nombre…"
        autocomplete="off"
        class="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      {#if mostrarSugerencias && sugerencias.length > 0}
        <ul
          class="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded border border-slate-200 bg-white shadow-lg">
          {#each sugerencias as p, i (p.id)}
            <li>
              <button
                type="button"
                class="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 {i === indiceActivo
                  ? 'bg-slate-100'
                  : ''}"
                onmousedown={(evento) => {
                  evento.preventDefault()
                  seleccionarSugerencia(p)
                }}>
                <span class="font-medium">{p.name}</span>
                {#if p.categories}
                  <span class="text-xs text-slate-500"> · {p.categories.name}</span>
                {/if}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    <select bind:value={categoria} onchange={cargar}
      class="rounded border border-slate-300 px-2 py-2 text-sm">
      <option value="">Todas las categorías</option>
      {#each categorias as c}
        <option value={c.slug}>{c.name}</option>
      {/each}
    </select>
    <select bind:value={genero} onchange={cargar}
      class="rounded border border-slate-300 px-2 py-2 text-sm">
      <option value="">Todos los géneros</option>
      <option value="niño">Niño</option>
      <option value="niña">Niña</option>
      <option value="hombre">Hombre</option>
      <option value="mujer">Mujer</option>
      <option value="unisex">Unisex</option>
    </select>
    <button type="button" class="rounded bg-slate-700 text-white px-4 py-2 text-sm hover:bg-slate-600"
      onclick={cargar}>Buscar</button>
    <button type="button" class="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
      onclick={limpiar}>Limpiar filtros</button>
  </form>

  {#if error}
    <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>
  {/if}

  {#if cargando}
    <p class="text-slate-500">Cargando…</p>
  {:else if productos.length === 0}
    <p class="text-slate-500">No hay productos.</p>
  {:else}
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {#each productos as p (p.id)}
        <button
          class="bg-white rounded-lg shadow overflow-hidden text-left hover:shadow-md transition"
          onclick={() => navegar(`/producto/${p.id}`)}>
          <div class="aspect-square bg-slate-100 overflow-hidden">
            {#if p.image_url}
              <img src={p.image_url} alt={p.name} class="w-full h-full object-cover" loading="lazy" />
            {:else}
              <div class="w-full h-full flex items-center justify-center text-slate-400 text-3xl">👗</div>
            {/if}
          </div>
          <div class="p-3 space-y-1">
            <p class="font-medium text-sm leading-tight line-clamp-2">{p.name}</p>
            {#if p.categories}
              <span class="inline-block text-[11px] bg-slate-100 text-slate-600 rounded px-2 py-0.5">
                {p.categories.name}
              </span>
            {/if}
            <div class="flex items-center justify-between pt-1">
              <span class="font-semibold">{soles(p.price)}</span>
              <span class="text-xs {totalStock(p) > 0 ? 'text-emerald-600' : 'text-red-500'}">
                {totalStock(p)} und.
              </span>
            </div>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

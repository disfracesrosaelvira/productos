<script>
  import { onMount } from 'svelte'
  import imageCompression from 'browser-image-compression'
  import { api, listarCategorias } from '../lib/api.js'
  import { navegar } from '../lib/router.svelte.js'

  let { id } = $props()
  const esNuevo = $derived(!id)

  let form = $state({ name: '', description: '', price: '', category_id: '', active: true })
  let categorias = $state([])
  let guardando = $state(false)
  let subiendo = $state(false)
  let error = $state('')

  onMount(async () => {
    categorias = await listarCategorias().catch(() => [])
    if (!esNuevo) {
      try {
        const p = await api.obtenerProducto(id)
        form = {
          name: p.name,
          description: p.description ?? '',
          price: p.price ?? '',
          category_id: p.category_id ?? '',
          active: p.active,
        }
      } catch (e) {
        error = e.message
      }
    }
  })

  async function guardar(evento) {
    evento.preventDefault()
    error = ''
    guardando = true
    try {
      const body = {
        name: form.name,
        description: form.description || null,
        price: form.price === '' ? null : Number(form.price),
        category_id: form.category_id || null,
        active: form.active,
      }
      const prod = esNuevo ? await api.crearProducto(body) : await api.actualizarProducto(id, body)
      navegar(`/producto/${prod.id}`)
    } catch (e) {
      error = e.message
    } finally {
      guardando = false
    }
  }

  async function subirImagen(evento) {
    const file = evento.target.files?.[0]
    if (!file) return
    subiendo = true
    error = ''
    try {
      const comprimido = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      })
      await api.subirImagen(id, comprimido, false)
      error = ''
    } catch (e) {
      error = e.message
    } finally {
      subiendo = false
      evento.target.value = ''
    }
  }
</script>

<div class="max-w-2xl mx-auto p-4 space-y-4">
  <button class="text-sm text-slate-600 hover:underline" onclick={() => navegar('/')}>← Volver</button>
  <h1 class="text-xl font-semibold">{esNuevo ? 'Nuevo producto' : 'Editar producto'}</h1>

  {#if error}
    <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>
  {/if}

  <form class="bg-white rounded-lg shadow p-4 space-y-4" onsubmit={guardar}>
    <label class="block">
      <span class="text-sm font-medium">Nombre</span>
      <input required bind:value={form.name}
        class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
    </label>

    <label class="block">
      <span class="text-sm font-medium">Descripción</span>
      <textarea bind:value={form.description} rows="3"
        class="mt-1 w-full rounded border border-slate-300 px-3 py-2"></textarea>
    </label>

    <div class="grid grid-cols-2 gap-4">
      <label class="block">
        <span class="text-sm font-medium">Precio (S/)</span>
        <input type="number" step="0.01" min="0" bind:value={form.price}
          class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
      </label>
      <label class="block">
        <span class="text-sm font-medium">Categoría</span>
        <select bind:value={form.category_id}
          class="mt-1 w-full rounded border border-slate-300 px-3 py-2">
          <option value="">Sin categoría</option>
          {#each categorias as c}
            <option value={c.id}>{c.name}</option>
          {/each}
        </select>
      </label>
    </div>

    <label class="flex items-center gap-2 text-sm">
      <input type="checkbox" bind:checked={form.active} /> Activo
    </label>

    <button type="submit" disabled={guardando}
      class="rounded bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 disabled:opacity-60">
      {guardando ? 'Guardando…' : 'Guardar'}
    </button>
  </form>

  {#if !esNuevo}
    <div class="bg-white rounded-lg shadow p-4 space-y-2">
      <h2 class="font-medium">Agregar foto</h2>
      <p class="text-xs text-slate-500">Se comprime en el navegador y se sube al servidor.</p>
      <input type="file" accept="image/*" onchange={subirImagen} disabled={subiendo} />
      {#if subiendo}<p class="text-sm text-slate-500">Subiendo…</p>{/if}
    </div>
  {/if}
</div>

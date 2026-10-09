<script>
  import { onMount, onDestroy } from 'svelte'
  import ImagePicker from '../lib/components/ImagePicker.svelte'
  import { api, listarCategorias } from '../lib/api.js'
  import { navegar } from '../lib/router.svelte.js'

  let { id } = $props()
  const esNuevo = $derived(!id)

  const TALLAS = ['S', 'M', '0', '4', '6', '8', '10', '14', '16']
  const GENEROS = [
    { valor: 'hombre', texto: 'Hombre' },
    { valor: 'mujer', texto: 'Mujer' },
    { valor: 'unisex', texto: 'Unisex' },
  ]
  const TELAS = [
    { valor: 'polinan', texto: 'Polinan' },
    { valor: 'poliestress', texto: 'Poliestress' },
    { valor: 'poliestress forrado', texto: 'Poliestress forrado' },
    { valor: 'polar', texto: 'Polar' },
    { valor: 'alicrado', texto: 'Alicrado' },
    { valor: 'raso', texto: 'Raso' },
    { valor: 'latex', texto: 'Látex' },
    { valor: 'sermat', texto: 'Sermat' },
  ]

  let form = $state({ name: '', price: '', category_id: '', active: true })
  let talla = $state('')
  let genero = $state('')
  let cantidad = $state(1)
  let conComentario = $state(false)
  let comentario = $state('')
  let tela = $state('')

  let categorias = $state([])
  let fotosExistentes = $state([])
  let pendientes = $state([])
  let variantes = $state([])
  let editandoId = $state(null)
  let stockEdit = $state(0)
  let guardandoStock = $state(false)
  let guardando = $state(false)
  let error = $state('')

  onMount(async () => {
    categorias = await listarCategorias().catch(() => [])
    if (!esNuevo) {
      try {
        const p = await api.obtenerProducto(id)
        form = {
          name: p.name,
          price: p.price ?? '',
          category_id: p.category_id ?? '',
          active: p.active,
        }
        conComentario = !!p.description
        comentario = p.description ?? ''
        fotosExistentes = p.product_images ?? []
        variantes = await api.listarVariantes({ product_id: id })
      } catch (e) {
        error = e.message
      }
    }
  })

  async function cargarVariantes() {
    variantes = await api.listarVariantes({ product_id: id })
  }

  function editarStock(v) {
    editandoId = v.id
    stockEdit = v.stock_quantity
  }

  function cancelarEdicion() {
    editandoId = null
  }

  async function guardarStock(v) {
    const delta = Number(stockEdit) - v.stock_quantity
    if (!Number.isInteger(delta) || delta === 0) {
      editandoId = null
      return
    }
    guardandoStock = true
    error = ''
    try {
      await api.ajustarStock(v.id, delta)
      await cargarVariantes()
      editandoId = null
    } catch (e) {
      error = e.message
    } finally {
      guardandoStock = false
    }
  }

  onDestroy(() => {
    for (const f of pendientes) URL.revokeObjectURL(f.url)
  })

  async function guardar(evento) {
    evento.preventDefault()
    error = ''
    if (esNuevo && pendientes.length === 0) {
      error = 'Agrega al menos 1 foto (de 1 a 3).'
      return
    }
    guardando = true
    try {
      const body = {
        name: form.name,
        description: conComentario ? comentario || null : null,
        price: form.price === '' ? null : Number(form.price),
        category_id: form.category_id || null,
        active: form.active,
      }
      const prod = esNuevo ? await api.crearProducto(body) : await api.actualizarProducto(id, body)

      if (talla || genero || tela) {
        await api.crearVariante({
          product_id: prod.id,
          size: talla || null,
          gender: genero || null,
          fabric_quality: tela || null,
          stock_quantity: Number(cantidad) || 0,
        })
      }

      for (const foto of pendientes) {
        await api.subirImagen(prod.id, foto.file, false)
      }
      for (const f of pendientes) URL.revokeObjectURL(f.url)
      pendientes = []

      navegar(`/producto/${prod.id}`)
    } catch (e) {
      error = e.message
    } finally {
      guardando = false
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

    {#if !esNuevo}
      <fieldset class="border border-slate-200 rounded-lg p-3 space-y-3">
        <legend class="text-xs font-medium text-slate-500 px-1">Tallas / variantes (editar stock)</legend>
        {#if variantes.length === 0}
          <p class="text-sm text-slate-500">Sin tallas registradas.</p>
        {:else}
          <div class="overflow-hidden rounded-lg border border-slate-200">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th class="px-3 py-2">SKU</th>
                  <th class="px-3 py-2">Talla</th>
                  <th class="px-3 py-2">Género</th>
                  <th class="px-3 py-2">Tela</th>
                  <th class="px-3 py-2 text-right">Stock</th>
                  <th class="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {#each variantes as v (v.id)}
                  <tr class="border-t border-slate-100">
                    <td class="px-3 py-2 font-mono text-xs">{v.sku}</td>
                    <td class="px-3 py-2">{v.size ?? '—'}</td>
                    <td class="px-3 py-2">{v.gender ?? '—'}</td>
                    <td class="px-3 py-2">{v.fabric_quality ?? '—'}</td>
                    <td class="px-3 py-2 text-right">
                      {#if editandoId === v.id}
                        <input type="number" min="0" bind:value={stockEdit}
                          class="w-20 rounded border border-slate-300 px-2 py-1 text-right" />
                      {:else}
                        <span class={v.stock_quantity > 0 ? '' : 'text-red-500'}>{v.stock_quantity}</span>
                      {/if}
                    </td>
                    <td class="px-3 py-2 text-right whitespace-nowrap">
                      {#if editandoId === v.id}
                        <button type="button" disabled={guardandoStock}
                          class="text-emerald-600 hover:underline"
                          onclick={() => guardarStock(v)}>Guardar</button>
                        <button type="button" disabled={guardandoStock}
                          class="ml-2 text-slate-500 hover:underline"
                          onclick={cancelarEdicion}>Cancelar</button>
                      {:else}
                        <button type="button" title="Editar stock" aria-label="Editar stock"
                          class="text-slate-600 hover:text-slate-900"
                          onclick={() => editarStock(v)}>✏️</button>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </fieldset>
    {/if}

    <fieldset class="border border-slate-200 rounded-lg p-3 space-y-3">
      <legend class="text-xs font-medium text-slate-500 px-1">Agregar nueva variante (talla / género / stock)</legend>
      <div class="grid grid-cols-3 gap-4">
        <label class="block">
          <span class="text-sm font-medium">Talla</span>
          <select bind:value={talla}
            class="mt-1 w-full rounded border border-slate-300 px-3 py-2">
            <option value="">Selecciona talla</option>
            {#each TALLAS as t}
              <option value={t}>{t}</option>
            {/each}
          </select>
        </label>
        <label class="block">
          <span class="text-sm font-medium">Género</span>
          <select bind:value={genero}
            class="mt-1 w-full rounded border border-slate-300 px-3 py-2">
            <option value="">Selecciona género</option>
            {#each GENEROS as g}
              <option value={g.valor}>{g.texto}</option>
            {/each}
          </select>
        </label>
        <label class="block">
          <span class="text-sm font-medium">Cantidad</span>
          <input type="number" min="0" bind:value={cantidad}
            class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
      </div>

      <label class="block">
        <span class="text-sm font-medium">Tela (opcional)</span>
        <select bind:value={tela}
          class="mt-1 w-full rounded border border-slate-300 px-3 py-2">
          <option value="">Sin especificar</option>
          {#each TELAS as t}
            <option value={t.valor}>{t.texto}</option>
          {/each}
        </select>
      </label>
    </fieldset>

    <div class="space-y-2">
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" bind:checked={conComentario} />
        Agregar comentario (opcional)
      </label>
      {#if conComentario}
        <textarea bind:value={comentario} rows="3" placeholder="Escribe un comentario…"
          class="w-full rounded border border-slate-300 px-3 py-2"></textarea>
      {/if}
    </div>

    <label class="flex items-center gap-2 text-sm">
      <input type="checkbox" bind:checked={form.active} /> Activo
    </label>

    <div class="border-t border-slate-100 pt-4 space-y-3">
      <div>
        <h2 class="font-medium">Fotos</h2>
        <p class="text-xs text-slate-500">
          Toma fotos con la cámara o súbelas desde la galería (entre 1 y 3). Se comprimen automáticamente antes de subir.
          {#if esNuevo}Se guardarán al crear el producto.{/if}
        </p>
      </div>

      {#if fotosExistentes.length > 0}
        <div>
          <p class="text-xs text-slate-500 mb-1">Ya guardadas:</p>
          <div class="grid grid-cols-4 gap-2">
            {#each fotosExistentes as img (img.id)}
              <img src={img.image_url} alt="" class="aspect-square w-full object-cover rounded border border-slate-200" />
            {/each}
          </div>
        </div>
      {/if}

      <ImagePicker bind:archivos={pendientes} deshabilitado={guardando} />
    </div>

    <button type="submit" disabled={guardando}
      class="rounded bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 disabled:opacity-60">
      {guardando
        ? 'Guardando…'
        : esNuevo
          ? (pendientes.length ? 'Crear y subir fotos' : 'Crear producto')
          : (pendientes.length ? 'Guardar y subir fotos' : 'Guardar')}
    </button>
  </form>
</div>

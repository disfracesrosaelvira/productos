<script>
  import { onMount, onDestroy } from 'svelte'
  import ImagePicker from '../lib/components/ImagePicker.svelte'
  import { api, listarCategorias } from '../lib/api.js'
  import { navegar } from '../lib/router.svelte.js'
  import { soles } from '../lib/format.js'

  let { id } = $props()
  const esNuevo = $derived(!id)

  const TALLAS = ['0', '2', '4', '6', '8', '10', '12', '14', '16', 'S', 'M', 'L']
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
  let genero = $state('')
  let tela = $state('')
  let tallasSel = $state([])
  let filas = $state({})
  let cantidadComun = $state(1)
  let conComentario = $state(false)
  let comentario = $state('')

  let categorias = $state([])
  let fotosExistentes = $state([])
  let pendientes = $state([])
  let variantes = $state([])
  let editandoId = $state(null)
  let stockEdit = $state(0)
  let precioEdit = $state('')
  let guardandoStock = $state(false)
  let guardando = $state(false)
  let error = $state('')

  const tallasOrdenadas = $derived(TALLAS.filter((t) => tallasSel.includes(t)))
  const estaSel = (t) => tallasSel.includes(t)

  function numeroONull(valor) {
    if (valor === '' || valor === null || valor === undefined) return null
    const n = Number(valor)
    return Number.isFinite(n) ? n : null
  }

  function toggleTalla(t) {
    if (estaSel(t)) {
      tallasSel = tallasSel.filter((x) => x !== t)
    } else {
      tallasSel = [...tallasSel, t]
      if (!filas[t]) filas[t] = { cantidad: 1, precio: form.price === '' ? '' : form.price }
    }
  }

  function seleccionarTodasTallas() {
    for (const t of TALLAS) if (!estaSel(t)) toggleTalla(t)
  }

  function limpiarTallas() {
    tallasSel = []
    filas = {}
  }

  function aplicarPrecioATodas() {
    for (const t of tallasSel) filas[t].precio = form.price
  }

  function aplicarCantidadATodas() {
    const n = Number(cantidadComun) || 0
    for (const t of tallasSel) filas[t].cantidad = n
  }

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
    precioEdit = v.price ?? ''
  }

  function cancelarEdicion() {
    editandoId = null
  }

  async function guardarStock(v) {
    const cantidadNueva = Number(stockEdit)
    const precioNuevo = numeroONull(precioEdit)
    const body = {}
    if (Number.isInteger(cantidadNueva) && cantidadNueva !== v.stock_quantity) {
      body.stock_quantity = cantidadNueva
    }
    if (precioNuevo !== (v.price ?? null)) body.price = precioNuevo

    if (Object.keys(body).length === 0) {
      editandoId = null
      return
    }
    guardandoStock = true
    error = ''
    try {
      await api.actualizarVariante(v.id, body)
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

      for (const t of tallasOrdenadas) {
        const fila = filas[t] ?? {}
        await api.crearVariante({
          product_id: prod.id,
          size: t,
          gender: genero || null,
          fabric_quality: tela || null,
          price: numeroONull(fila.precio),
          stock_quantity: Number(fila.cantidad) || 0,
        })
      }
      tallasSel = []
      filas = {}

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
        <legend class="text-xs font-medium text-slate-500 px-1">Tallas / variantes (stock y precio)</legend>
        {#if variantes.length === 0}
          <p class="text-sm text-slate-500">Sin tallas registradas.</p>
        {:else}
          <ul class="space-y-2">
            {#each variantes as v (v.id)}
              <li class="rounded-lg border border-slate-200 bg-white p-3">
                {#if editandoId === v.id}
                  <div class="space-y-3">
                    <div class="flex items-center justify-between gap-2">
                      <p class="font-medium">Talla {v.size ?? '—'}</p>
                      <p class="text-xs font-mono text-slate-400 truncate">{v.sku}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      <label class="block text-sm">
                        <span class="text-slate-500">Precio (S/)</span>
                        <input type="number" step="0.01" min="0" bind:value={precioEdit}
                          class="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
                      </label>
                      <label class="block text-sm">
                        <span class="text-slate-500">Stock</span>
                        <input type="number" min="0" bind:value={stockEdit}
                          class="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
                      </label>
                    </div>
                    <div class="flex gap-2">
                      <button type="button" disabled={guardandoStock}
                        class="rounded bg-emerald-600 text-white px-3 py-1.5 text-sm hover:bg-emerald-500 disabled:opacity-60"
                        onclick={() => guardarStock(v)}>Guardar</button>
                      <button type="button" disabled={guardandoStock}
                        class="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                        onclick={cancelarEdicion}>Cancelar</button>
                    </div>
                  </div>
                {:else}
                  <div class="flex items-center gap-3">
                    <div class="flex-1 min-w-0">
                      <p class="font-medium">Talla {v.size ?? '—'}</p>
                      <p class="text-xs font-mono text-slate-400 truncate">{v.sku}</p>
                      {#if v.gender || v.fabric_quality}
                        <p class="text-xs text-slate-500">
                          {[v.gender, v.fabric_quality].filter(Boolean).join(' · ')}
                        </p>
                      {/if}
                    </div>
                    <div class="text-right shrink-0">
                      <p class="text-sm font-medium">
                        {v.price == null ? (form.price ? soles(form.price) : '—') : soles(v.price)}
                      </p>
                      <p class="text-xs {v.stock_quantity > 0 ? 'text-slate-500' : 'text-red-500'}">
                        Stock: {v.stock_quantity}
                      </p>
                    </div>
                    <button type="button" title="Editar stock y precio" aria-label="Editar stock y precio"
                      class="shrink-0 p-2 rounded hover:bg-slate-100 text-slate-600"
                      onclick={() => editarStock(v)}>✏️</button>
                  </div>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </fieldset>
    {/if}

    <fieldset class="border border-slate-200 rounded-lg p-3 space-y-3">
      <legend class="text-xs font-medium text-slate-500 px-1">
        {esNuevo ? 'Tallas del producto (elige una o varias)' : 'Agregar tallas'}
      </legend>

      <div class="grid grid-cols-2 gap-4">
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
          <span class="text-sm font-medium">Tela (opcional)</span>
          <select bind:value={tela}
            class="mt-1 w-full rounded border border-slate-300 px-3 py-2">
            <option value="">Sin especificar</option>
            {#each TELAS as t}
              <option value={t.valor}>{t.texto}</option>
            {/each}
          </select>
        </label>
      </div>

      <div>
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">Tallas</span>
          <div class="flex gap-3 text-xs">
            <button type="button" class="text-slate-600 hover:underline"
              onclick={seleccionarTodasTallas}>Seleccionar todas</button>
            <button type="button" class="text-slate-600 hover:underline"
              onclick={limpiarTallas}>Limpiar</button>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 mt-2">
          {#each TALLAS as t}
            <button type="button"
              class="px-3 py-1.5 rounded-full border text-sm {estaSel(t)
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-slate-300 text-slate-700 hover:bg-slate-100'}"
              onclick={() => toggleTalla(t)}>{t}</button>
          {/each}
        </div>
      </div>

      {#if tallasSel.length > 0}
        <div class="space-y-2">
          {#each tallasOrdenadas as t (t)}
            <div class="flex items-end gap-2">
              <span class="w-10 shrink-0 pb-1.5 text-sm font-medium">{t}</span>
              <label class="flex-1 min-w-0">
                <span class="block text-xs text-slate-500">Precio (S/)</span>
                <input type="number" step="0.01" min="0" bind:value={filas[t].precio}
                  class="mt-0.5 w-full rounded border border-slate-300 px-2 py-1" />
              </label>
              <label class="flex-1 min-w-0">
                <span class="block text-xs text-slate-500">Cantidad</span>
                <input type="number" min="0" bind:value={filas[t].cantidad}
                  class="mt-0.5 w-full rounded border border-slate-300 px-2 py-1" />
              </label>
              <button type="button" class="shrink-0 p-1.5 text-slate-400 hover:text-red-600"
                aria-label="Quitar talla" onclick={() => toggleTalla(t)}>✕</button>
            </div>
          {/each}
        </div>

        <div class="flex flex-wrap items-end gap-3 text-sm">
          <button type="button"
            class="rounded border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
            onclick={aplicarPrecioATodas}>
            Usar precio base (S/ {form.price || '0'}) en todas
          </button>
          <div class="flex items-end gap-2">
            <label class="flex flex-col">
              <span class="text-xs text-slate-500">Cantidad para todas</span>
              <input type="number" min="0" bind:value={cantidadComun}
                class="w-20 rounded border border-slate-300 px-2 py-1" />
            </label>
            <button type="button"
              class="rounded border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
              onclick={aplicarCantidadATodas}>Aplicar</button>
          </div>
        </div>
      {:else}
        <p class="text-sm text-slate-500">
          Selecciona una o varias tallas para asignar su precio y cantidad.
        </p>
      {/if}
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

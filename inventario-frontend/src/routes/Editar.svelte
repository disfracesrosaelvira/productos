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

  let form = $state({ name: '', price: '', category_id: '', active: true })
  let talla = $state('')
  let genero = $state('')
  let cantidad = $state(1)
  let conComentario = $state(false)
  let comentario = $state('')
  let conTela = $state(false)
  let tela = $state('')

  let categorias = $state([])
  let fotosExistentes = $state([])
  let pendientes = $state([])
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
      } catch (e) {
        error = e.message
      }
    }
  })

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

      if (talla || genero || (conTela && tela)) {
        await api.crearVariante({
          product_id: prod.id,
          size: talla || null,
          gender: genero || null,
          fabric_quality: conTela ? tela || null : null,
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

    <fieldset class="border border-slate-200 rounded-lg p-3 space-y-3">
      <legend class="text-xs font-medium text-slate-500 px-1">Variante (talla / género / stock)</legend>
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

      <div class="space-y-2">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" bind:checked={conTela} />
          Comentar calidad de la tela (opcional)
        </label>
        {#if conTela}
          <input bind:value={tela} placeholder="Ej: polinan, raso, bordado…"
            class="w-full rounded border border-slate-300 px-3 py-2" />
        {/if}
      </div>
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

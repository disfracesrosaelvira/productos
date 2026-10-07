<script>
  import imageCompression from 'browser-image-compression'

  // archivos: array bindeable de { file, url, bytes, original }
  let { archivos = $bindable([]), maxFotos = 3, deshabilitado = false } = $props()

  let inputCamara
  let inputGaleria
  let comprimiendo = $state(false)
  let aviso = $state('')

  const opciones = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.82,
  }

  const lleno = $derived(archivos.length >= maxFotos)

  async function procesar(evento) {
    const lista = Array.from(evento.target.files ?? [])
    evento.target.value = ''
    if (lista.length === 0) return

    const disponibles = maxFotos - archivos.length
    if (disponibles <= 0) {
      aviso = `Ya alcanzaste el máximo de ${maxFotos} fotos.`
      return
    }
    const seleccion = lista.slice(0, disponibles)
    aviso =
      lista.length > disponibles
        ? `Solo se agregaron ${disponibles} foto(s); el máximo es ${maxFotos}.`
        : ''

    comprimiendo = true
    try {
      for (const file of seleccion) {
        if (!file.type.startsWith('image/')) continue
        const comprimido = await imageCompression(file, opciones)
        archivos = [
          ...archivos,
          {
            file: comprimido,
            url: URL.createObjectURL(comprimido),
            bytes: comprimido.size,
            original: file.size,
          },
        ]
      }
    } catch (error) {
      aviso = `No se pudo procesar la imagen: ${error.message}`
    } finally {
      comprimiendo = false
    }
  }

  function quitar(i) {
    const copia = [...archivos]
    URL.revokeObjectURL(copia[i].url)
    copia.splice(i, 1)
    archivos = copia
  }

  const kb = (n) => `${Math.round(n / 1024)} KB`
</script>

<div class="space-y-3">
  <div class="flex gap-2 flex-wrap items-center">
    <button
      type="button"
      class="rounded bg-slate-700 text-white px-3 py-2 text-sm hover:bg-slate-600 disabled:opacity-50"
      disabled={deshabilitado || comprimiendo || lleno}
      onclick={() => inputCamara.click()}>
      📷 Tomar foto
    </button>
    <button
      type="button"
      class="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
      disabled={deshabilitado || comprimiendo || lleno}
      onclick={() => inputGaleria.click()}>
      🖼️ Subir desde galería
    </button>
    {#if comprimiendo}
      <span class="text-sm text-slate-500">Comprimiendo…</span>
    {/if}
    <span class="text-xs text-slate-500 sm:ml-auto">{archivos.length}/{maxFotos} fotos</span>
  </div>

  <!-- capture="environment" abre la cámara trasera en el móvil -->
  <input
    bind:this={inputCamara}
    type="file"
    accept="image/*"
    capture="environment"
    class="hidden"
    onchange={procesar} />
  <input
    bind:this={inputGaleria}
    type="file"
    accept="image/*"
    multiple
    class="hidden"
    onchange={procesar} />

  {#if aviso}
    <p class="text-sm text-red-600">{aviso}</p>
  {/if}

  {#if archivos.length > 0}
    <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {#each archivos as a, i}
        <div class="relative">
          <img src={a.url} alt="" class="aspect-square w-full object-cover rounded border border-slate-200" />
          <button
            type="button"
            class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white leading-none hover:bg-black/80"
            onclick={() => quitar(i)}
            aria-label="Quitar">×</button>
          <span class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">
            {kb(a.bytes)}
          </span>
        </div>
      {/each}
    </div>
    <p class="text-xs text-slate-500">
      {archivos.length} de {maxFotos} foto(s) comprimida(s) y lista(s) para subir.
    </p>
  {/if}
</div>

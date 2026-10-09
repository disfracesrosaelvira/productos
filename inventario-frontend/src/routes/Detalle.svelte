<script>
  import { onMount } from 'svelte'
  import { api } from '../lib/api.js'
  import { navegar } from '../lib/router.svelte.js'
  import { supabase } from '../lib/supabase.js'
  import { soles, fecha } from '../lib/format.js'
  import Lightbox from '../lib/components/Lightbox.svelte'

  let { id } = $props()

  let producto = $state(null)
  let principal = $state('')
  let zoomSrc = $state(null)
  let cargando = $state(true)
  let error = $state('')
  let movimientos = $state([])

  const variantes = $derived(producto?.variants ?? [])
  const generos = $derived([...new Set(variantes.map((v) => v.gender).filter(Boolean))])
  const telas = $derived([...new Set(variantes.map((v) => v.fabric_quality).filter(Boolean))])
  const generoUniforme = $derived(generos.length === 1)
  const telaUniforme = $derived(telas.length === 1)

  async function cargar() {
    try {
      producto = await api.obtenerProducto(id)
      const imgs = producto.product_images ?? []
      const prim = imgs.find((i) => i.is_primary) ?? imgs[0]
      principal = prim?.image_url ?? producto.image_url ?? ''
      movimientos = await api.listarMovimientos({ product_id: id }).catch(() => [])
    } catch (e) {
      error = e.message
    } finally {
      cargando = false
    }
  }

  async function eliminar() {
    if (!confirm('¿Eliminar este producto y sus variantes?')) return
    try {
      await api.eliminarProducto(id)
      navegar('/')
    } catch (e) {
      error = e.message
    }
  }

  onMount(async () => {
    await cargar()
    const canal = supabase
      .channel(`producto-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'variants', filter: `product_id=eq.${id}` },
        cargar,
      )
      .subscribe()
    return () => supabase.removeChannel(canal)
  })
</script>

<div class="max-w-5xl mx-auto p-4 space-y-4">
  <button class="text-sm text-slate-600 hover:underline" onclick={() => navegar('/')}>← Volver</button>

  {#if cargando}
    <p class="text-slate-500">Cargando…</p>
  {:else if error}
    <p class="text-red-600">{error}</p>
  {:else if producto}
    <div class="grid md:grid-cols-2 gap-6">
      <div class="space-y-3">
        <div class="relative aspect-square bg-slate-100 rounded-lg overflow-hidden">
          {#if principal}
            <button type="button" class="w-full h-full" title="Ampliar imagen"
              onclick={() => (zoomSrc = principal)}>
              <img src={principal} alt={producto.name} class="w-full h-full object-contain" />
            </button>
            <button type="button"
              class="absolute top-2 right-2 rounded-full bg-white/90 px-3 py-1 text-sm shadow hover:bg-white"
              onclick={() => (zoomSrc = principal)}>🔍 Ampliar</button>
          {:else}
            <div class="w-full h-full flex items-center justify-center text-5xl text-slate-300">👗</div>
          {/if}
        </div>
        <div class="flex gap-2 flex-wrap">
          {#each producto.product_images ?? [] as img (img.id)}
            <button
              class="w-16 h-16 rounded overflow-hidden border-2 {img.image_url === principal ? 'border-slate-900' : 'border-transparent'}"
              onclick={() => (principal = img.image_url)}>
              <img src={img.image_url} class="w-full h-full object-cover" alt="" />
            </button>
          {/each}
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <h1 class="text-2xl font-semibold">{producto.name}</h1>
          {#if generos.length || telas.length}
            <p class="text-sm text-slate-500 mt-1">
              {#if generos.length}{generos.join(' / ')}{/if}{#if generos.length && telas.length} · {/if}{#if telas.length}tela {telas.join(' / ')}{/if}
            </p>
          {/if}
          {#if producto.categories}
            <span class="inline-block text-xs bg-slate-100 text-slate-600 rounded px-2 py-0.5 mt-1">
              {producto.categories.name}
            </span>
          {/if}
          <p class="text-xl font-bold mt-2">{soles(producto.price)}</p>
          {#if producto.description}
            <p class="text-slate-600 text-sm mt-2">{producto.description}</p>
          {/if}
        </div>

        <div>
          <h2 class="font-medium mb-2">Tallas / variantes</h2>
          <div class="overflow-hidden rounded-lg border border-slate-200">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th class="px-3 py-2">SKU</th>
                  <th class="px-3 py-2">Talla</th>
                  {#if !generoUniforme}<th class="px-3 py-2">Género</th>{/if}
                  {#if !telaUniforme}<th class="px-3 py-2">Tela</th>{/if}
                  <th class="px-3 py-2 text-right">Stock</th>
                </tr>
              </thead>
              <tbody>
                {#each variantes as v (v.id)}
                  <tr class="border-t border-slate-100">
                    <td class="px-3 py-2 font-mono text-xs">{v.sku}</td>
                    <td class="px-3 py-2">{v.size ?? '—'}</td>
                    {#if !generoUniforme}<td class="px-3 py-2">{v.gender ?? '—'}</td>{/if}
                    {#if !telaUniforme}<td class="px-3 py-2">{v.fabric_quality ?? '—'}</td>{/if}
                    <td class="px-3 py-2 text-right {v.stock_quantity > 0 ? '' : 'text-red-500'}">
                      {v.stock_quantity}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 class="font-medium mb-2">Movimientos de stock</h2>
          {#if movimientos.length === 0}
            <p class="text-sm text-slate-500">Sin movimientos registrados.</p>
          {:else}
            <div class="overflow-hidden rounded-lg border border-slate-200">
              <table class="w-full text-sm">
                <thead class="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th class="px-3 py-2">Variante</th>
                    <th class="px-3 py-2">Tipo movimiento</th>
                    <th class="px-3 py-2 text-right">Cantidad</th>
                    <th class="px-3 py-2">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {#each movimientos as m (m.id)}
                    <tr class="border-t border-slate-100">
                      <td class="px-3 py-2">{m.variants?.sku ?? '—'} · {m.variants?.size ?? '—'}</td>
                      <td class="px-3 py-2">{m.tipo_movimiento}</td>
                      <td class="px-3 py-2 text-right {m.cantidad_movimiento < 0 ? 'text-red-500' : 'text-emerald-600'}">
                        {m.cantidad_movimiento > 0 ? '+' : ''}{m.cantidad_movimiento}
                      </td>
                      <td class="px-3 py-2">{fecha(m.fecha_movimiento)}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>

        <div class="flex gap-2">
          <button
            class="rounded bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800"
            onclick={() => navegar(`/producto/${id}/editar`)}>Editar</button>
          <button
            class="rounded border border-red-300 text-red-600 px-4 py-2 text-sm hover:bg-red-50"
            onclick={eliminar}>Eliminar</button>
        </div>
      </div>
    </div>
  {/if}

  <Lightbox bind:src={zoomSrc} alt={producto?.name ?? ''} />
</div>

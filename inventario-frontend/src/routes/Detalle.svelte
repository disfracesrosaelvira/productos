<script>
  import { onMount } from 'svelte'
  import { api } from '../lib/api.js'
  import { navegar } from '../lib/router.svelte.js'
  import { supabase } from '../lib/supabase.js'
  import { soles } from '../lib/format.js'

  let { id } = $props()

  let producto = $state(null)
  let principal = $state('')
  let cargando = $state(true)
  let error = $state('')

  async function cargar() {
    try {
      producto = await api.obtenerProducto(id)
      const imgs = producto.product_images ?? []
      const prim = imgs.find((i) => i.is_primary) ?? imgs[0]
      principal = prim?.image_url ?? producto.image_url ?? ''
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
        <div class="aspect-square bg-slate-100 rounded-lg overflow-hidden">
          {#if principal}
            <img src={principal} alt={producto.name} class="w-full h-full object-cover" />
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
                  <th class="px-3 py-2">Género</th>
                  <th class="px-3 py-2">Tela</th>
                  <th class="px-3 py-2 text-right">Stock</th>
                </tr>
              </thead>
              <tbody>
                {#each producto.variants ?? [] as v (v.id)}
                  <tr class="border-t border-slate-100">
                    <td class="px-3 py-2 font-mono text-xs">{v.sku}</td>
                    <td class="px-3 py-2">{v.size ?? '—'}</td>
                    <td class="px-3 py-2">{v.gender ?? '—'}</td>
                    <td class="px-3 py-2">{v.fabric_quality ?? '—'}</td>
                    <td class="px-3 py-2 text-right {v.stock_quantity > 0 ? '' : 'text-red-500'}">
                      {v.stock_quantity}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
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
</div>

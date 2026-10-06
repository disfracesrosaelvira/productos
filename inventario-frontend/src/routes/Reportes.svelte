<script>
  import { onMount } from 'svelte'
  import { api } from '../lib/api.js'
  import { soles } from '../lib/format.js'

  let bajoStock = $state({ data: [], threshold: 3 })
  let resumen = $state(null)
  let top = $state([])
  let from = $state('')
  let to = $state('')
  let error = $state('')

  async function cargar() {
    error = ''
    try {
      bajoStock = await api.bajoStock(3)
      resumen = await api.resumenVentas({ from, to })
      top = (await api.masVendidos({ from, to, limit: 10 })).data
    } catch (e) {
      error = e.message
    }
  }

  onMount(cargar)
</script>

<div class="max-w-6xl mx-auto p-4 space-y-6">
  <h1 class="text-xl font-semibold">Reportes</h1>

  {#if error}<p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>{/if}

  <div class="bg-white rounded-lg shadow p-4 flex gap-3 flex-wrap items-end">
    <label class="text-sm">
      Desde
      <input type="date" bind:value={from} class="block mt-1 rounded border border-slate-300 px-3 py-2" />
    </label>
    <label class="text-sm">
      Hasta
      <input type="date" bind:value={to} class="block mt-1 rounded border border-slate-300 px-3 py-2" />
    </label>
    <button class="rounded bg-slate-700 text-white px-4 py-2 text-sm hover:bg-slate-600" onclick={cargar}>
      Aplicar
    </button>
  </div>

  {#if resumen}
    <div class="grid sm:grid-cols-2 gap-4">
      <div class="bg-white rounded-lg shadow p-4">
        <p class="text-sm text-slate-500">Ventas en el periodo</p>
        <p class="text-3xl font-bold">{resumen.total_ventas}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <p class="text-sm text-slate-500">Monto total</p>
        <p class="text-3xl font-bold">{soles(resumen.monto_total)}</p>
      </div>
    </div>
  {/if}

  <div class="grid lg:grid-cols-2 gap-6">
    <div class="bg-white rounded-lg shadow p-4">
      <h2 class="font-medium mb-2">🔴 Bajo stock (≤ {bajoStock.threshold})</h2>
      {#if bajoStock.data.length === 0}
        <p class="text-sm text-slate-500">Todo con stock suficiente.</p>
      {:else}
        <ul class="divide-y divide-slate-100 text-sm">
          {#each bajoStock.data as v (v.id)}
            <li class="py-2 flex justify-between gap-2">
              <span>{v.products?.name} · {v.size ?? '—'}</span>
              <span class="font-semibold text-red-500">{v.stock_quantity}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <div class="bg-white rounded-lg shadow p-4">
      <h2 class="font-medium mb-2">🏆 Más vendidos</h2>
      {#if top.length === 0}
        <p class="text-sm text-slate-500">Sin ventas en el periodo.</p>
      {:else}
        <ul class="divide-y divide-slate-100 text-sm">
          {#each top as t (t.product_id)}
            <li class="py-2 flex justify-between gap-2">
              <span>{t.nombre}</span>
              <span><b>{t.unidades}</b> und. · {soles(t.monto)}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</div>

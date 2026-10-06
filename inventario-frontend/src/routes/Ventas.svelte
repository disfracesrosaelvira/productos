<script>
  import { onMount } from 'svelte'
  import { api } from '../lib/api.js'
  import { soles, fecha } from '../lib/format.js'

  let variantes = $state([])
  let ventas = $state([])
  let carrito = $state([])
  let cliente = $state('')
  let seleccion = $state('')
  let cantidad = $state(1)
  let error = $state('')
  let ok = $state('')
  let guardando = $state(false)

  const total = $derived(carrito.reduce((s, i) => s + i.quantity * i.unit_price, 0))

  async function cargar() {
    try {
      variantes = await api.listarVariantes()
      const r = await api.listarVentas({ pageSize: 10 })
      ventas = r.data
    } catch (e) {
      error = e.message
    }
  }

  onMount(cargar)

  function agregar() {
    const v = variantes.find((x) => x.id === seleccion)
    if (!v) return
    carrito = [
      ...carrito,
      {
        variant_id: v.id,
        etiqueta: `${v.products?.name ?? ''} · ${v.size ?? ''} ${v.gender ?? ''}`.trim(),
        quantity: Number(cantidad),
        unit_price: Number(v.products?.price ?? 0),
        stock: v.stock_quantity,
      },
    ]
    seleccion = ''
    cantidad = 1
  }

  function quitar(i) {
    carrito = carrito.filter((_, idx) => idx !== i)
  }

  async function registrar() {
    error = ''
    ok = ''
    guardando = true
    try {
      await api.crearVenta({
        customer: cliente || null,
        items: carrito.map(({ variant_id, quantity, unit_price }) => ({ variant_id, quantity, unit_price })),
      })
      ok = 'Venta registrada y stock actualizado.'
      carrito = []
      cliente = ''
      await cargar()
    } catch (e) {
      error = e.message
    } finally {
      guardando = false
    }
  }
</script>

<div class="max-w-6xl mx-auto p-4 space-y-4">
  <h1 class="text-xl font-semibold">Registrar venta</h1>

  {#if error}<p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>{/if}
  {#if ok}<p class="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">{ok}</p>{/if}

  <div class="grid lg:grid-cols-2 gap-4">
    <div class="bg-white rounded-lg shadow p-4 space-y-3">
      <h2 class="font-medium">Agregar producto</h2>
      <select bind:value={seleccion} class="w-full rounded border border-slate-300 px-3 py-2 text-sm">
        <option value="">Selecciona una variante…</option>
        {#each variantes as v (v.id)}
          <option value={v.id} disabled={v.stock_quantity <= 0}>
            {v.products?.name} · {v.size ?? '—'} · {v.gender ?? '—'} (stock {v.stock_quantity})
          </option>
        {/each}
      </select>
      <div class="flex gap-2 items-center">
        <label class="text-sm flex items-center gap-2">
          Cantidad
          <input type="number" min="1" bind:value={cantidad}
            class="w-24 rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <button class="rounded bg-slate-700 text-white px-4 py-2 text-sm hover:bg-slate-600"
          onclick={agregar}>Agregar</button>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-4 space-y-3">
      <h2 class="font-medium">Carrito ({carrito.length})</h2>
      {#if carrito.length === 0}
        <p class="text-sm text-slate-500">Sin items.</p>
      {:else}
        <ul class="divide-y divide-slate-100">
          {#each carrito as item, i}
            <li class="py-2 flex items-center justify-between gap-2 text-sm">
              <span class="flex-1">{item.etiqueta}</span>
              <span>{item.quantity} × {soles(item.unit_price)}</span>
              <button class="text-red-500 hover:underline" onclick={() => quitar(i)}>quitar</button>
            </li>
          {/each}
        </ul>
        <label class="block text-sm">
          Cliente (opcional)
          <input bind:value={cliente} class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <div class="flex items-center justify-between">
          <span class="font-semibold">Total: {soles(total)}</span>
          <button class="rounded bg-emerald-600 text-white px-4 py-2 text-sm hover:bg-emerald-500 disabled:opacity-60"
            disabled={guardando} onclick={registrar}>
            {guardando ? 'Registrando…' : 'Registrar venta'}
          </button>
        </div>
      {/if}
    </div>
  </div>

  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="font-medium mb-2">Últimas ventas</h2>
    {#if ventas.length === 0}
      <p class="text-sm text-slate-500">Aún no hay ventas.</p>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-left text-slate-500">
            <tr>
              <th class="px-3 py-2">Fecha</th>
              <th class="px-3 py-2">Cliente</th>
              <th class="px-3 py-2">Items</th>
              <th class="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {#each ventas as v (v.id)}
              <tr class="border-t border-slate-100">
                <td class="px-3 py-2">{fecha(v.created_at)}</td>
                <td class="px-3 py-2">{v.customer ?? '—'}</td>
                <td class="px-3 py-2">{(v.sale_items ?? []).length}</td>
                <td class="px-3 py-2 text-right">{soles(v.total_amount)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

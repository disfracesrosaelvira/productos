<script>
  let { src = $bindable(null), alt = '' } = $props()

  let zoom = $state(1)

  $effect(() => {
    if (src) zoom = 1
  })

  function cerrar() {
    src = null
  }
  const acercar = () => (zoom = Math.min(4, Math.round((zoom + 0.5) * 10) / 10))
  const alejar = () => (zoom = Math.max(1, Math.round((zoom - 0.5) * 10) / 10))
  const tecla = (e) => {
    if (src && e.key === 'Escape') cerrar()
  }
</script>

<svelte:window onkeydown={tecla} />

{#if src}
  <div class="fixed inset-0 z-50 bg-black/85 flex flex-col">
    <button
      type="button"
      class="absolute inset-0 w-full h-full cursor-default"
      aria-label="Cerrar imagen"
      onclick={cerrar}></button>

    <div class="relative flex items-center justify-between p-3">
      <span class="text-white/80 text-sm">{Math.round(zoom * 100)}%</span>
      <div class="flex gap-2">
        <button type="button" class="w-10 h-10 rounded-full bg-white/90 text-xl leading-none" onclick={alejar} aria-label="Alejar">−</button>
        <button type="button" class="w-10 h-10 rounded-full bg-white/90 text-xl leading-none" onclick={acercar} aria-label="Acercar">+</button>
        <button type="button" class="w-10 h-10 rounded-full bg-white/90 text-xl leading-none" onclick={cerrar} aria-label="Cerrar">✕</button>
      </div>
    </div>

    <div class="relative flex-1 overflow-auto flex items-start justify-center p-4">
      <img
        {src}
        {alt}
        style="max-width: {zoom * 92}vw; max-height: {zoom * 88}vh;"
        class="block" />
    </div>
  </div>
{/if}

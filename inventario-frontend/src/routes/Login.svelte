<script>
  import { auth } from '../lib/auth.svelte.js'
  import { navegar } from '../lib/router.svelte.js'

  let email = $state('')
  let password = $state('')
  let error = $state('')
  let cargando = $state(false)

  async function entrar(evento) {
    evento.preventDefault()
    error = ''
    cargando = true
    try {
      await auth.login(email, password)
      navegar('/')
    } catch (e) {
      error = e.message
    } finally {
      cargando = false
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center p-4">
  <form
    class="w-full max-w-sm bg-white rounded-xl shadow-lg p-8 space-y-4"
    onsubmit={entrar}>
    <div class="text-center mb-2">
      <div class="text-3xl">👗</div>
      <h1 class="text-lg font-semibold mt-1">Inventario de Disfraces</h1>
      <p class="text-sm text-slate-500">Inicia sesión para continuar</p>
    </div>

    {#if error}
      <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>
    {/if}

    <label class="block">
      <span class="text-sm font-medium">Correo</span>
      <input
        type="email"
        required
        bind:value={email}
        class="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
        placeholder="tu@correo.com" />
    </label>

    <label class="block">
      <span class="text-sm font-medium">Contraseña</span>
      <input
        type="password"
        required
        bind:value={password}
        class="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
        placeholder="••••••••" />
    </label>

    <button
      type="submit"
      disabled={cargando}
      class="w-full rounded bg-slate-900 text-white py-2 font-medium hover:bg-slate-800 disabled:opacity-60">
      {cargando ? 'Ingresando…' : 'Ingresar'}
    </button>
  </form>
</div>

<script>
  import { api } from '../api.js'
  import { fecha } from '../format.js'

  let { abierto = false, oncerrar = () => {} } = $props()

  const MENUS = [
    { clave: 'catalogo', texto: 'Catálogo' },
    { clave: 'ventas', texto: 'Ventas' },
    { clave: 'reportes', texto: 'Reportes' },
    { clave: 'usuarios', texto: 'Usuarios' },
  ]
  const permisosVacios = () => ({ catalogo: false, ventas: false, reportes: false, usuarios: false })

  let vista = $state('usuarios')
  let usuarios = $state([])
  let roles = $state([])
  let cargando = $state(false)
  let error = $state('')
  let aviso = $state('')

  // formulario usuario
  let formUsuario = $state(false)
  let editandoUsuarioId = $state(null)
  let uEmail = $state('')
  let emailOriginal = $state('')
  let uNombre = $state('')
  let uRol = $state('')
  let uEstado = $state(1)
  let uContrasena = $state('')
  let guardandoUsuario = $state(false)

  // formulario rol
  let formRol = $state(false)
  let editandoRolId = $state(null)
  let rNombre = $state('')
  let rDescripcion = $state('')
  let rPermisos = $state(permisosVacios())
  let guardandoRol = $state(false)

  async function cargar() {
    cargando = true
    error = ''
    try {
      const [us, rs] = await Promise.all([api.listarUsuarios(), api.listarRoles()])
      usuarios = us
      roles = rs
      if (!uRol && rs.length) uRol = rs[0].nombre
    } catch (e) {
      error = e.message
    } finally {
      cargando = false
    }
  }

  $effect(() => {
    if (abierto) cargar()
  })

  function cerrar() {
    oncerrar()
  }

  function alTeclear(evento) {
    if (evento.key === 'Escape' && abierto) cerrar()
  }

  // ---- usuarios ----
  function nuevoUsuario() {
    formUsuario = true
    editandoUsuarioId = null
    uEmail = ''
    emailOriginal = ''
    uNombre = ''
    uRol = roles[0]?.nombre ?? ''
    uEstado = 1
    uContrasena = ''
    error = ''
  }

  function editarUsuario(u) {
    formUsuario = true
    editandoUsuarioId = u.id
    uEmail = u.email ?? ''
    emailOriginal = u.email ?? ''
    uNombre = u.nombre
    uRol = u.rol
    uEstado = u.estado
    uContrasena = ''
    error = ''
  }

  function cancelarUsuario() {
    formUsuario = false
    editandoUsuarioId = null
  }

  async function guardarUsuario(evento) {
    evento.preventDefault()
    error = ''
    guardandoUsuario = true
    try {
      const body = { nombre: uNombre, rol: uRol, estado: uEstado }
      if (uContrasena) body.contrasena = uContrasena
      if (editandoUsuarioId) {
        if (uEmail && uEmail !== emailOriginal) body.email = uEmail
        await api.actualizarUsuario(editandoUsuarioId, body)
        aviso = 'Usuario actualizado.'
      } else {
        await api.crearUsuario({ ...body, email: uEmail, contrasena: uContrasena })
        aviso = 'Usuario creado.'
      }
      cancelarUsuario()
      await cargar()
    } catch (e) {
      error = e.message
    } finally {
      guardandoUsuario = false
    }
  }

  async function toggleEstado(u) {
    error = ''
    try {
      await api.actualizarUsuario(u.id, { estado: u.estado ? 0 : 1 })
      await cargar()
    } catch (e) {
      error = e.message
    }
  }

  async function eliminarUsuario(u) {
    if (!confirm(`¿Eliminar al usuario "${u.nombre}"?`)) return
    error = ''
    try {
      await api.eliminarUsuario(u.id)
      aviso = 'Usuario eliminado.'
      await cargar()
    } catch (e) {
      error = e.message
    }
  }

  // ---- roles ----
  function nuevoRol() {
    formRol = true
    editandoRolId = null
    rNombre = ''
    rDescripcion = ''
    rPermisos = permisosVacios()
    error = ''
  }

  function editarRol(r) {
    formRol = true
    editandoRolId = r.id
    rNombre = r.nombre
    rDescripcion = r.descripcion ?? ''
    rPermisos = { ...permisosVacios(), ...(r.permisos ?? {}) }
    error = ''
  }

  function cancelarRol() {
    formRol = false
    editandoRolId = null
  }

  async function guardarRol(evento) {
    evento.preventDefault()
    error = ''
    guardandoRol = true
    try {
      const body = { nombre: rNombre, descripcion: rDescripcion || null, permisos: rPermisos }
      if (editandoRolId) {
        await api.actualizarRol(editandoRolId, body)
        aviso = 'Rol actualizado.'
      } else {
        await api.crearRol(body)
        aviso = 'Rol creado.'
      }
      cancelarRol()
      await cargar()
    } catch (e) {
      error = e.message
    } finally {
      guardandoRol = false
    }
  }

  async function eliminarRol(r) {
    if (!confirm(`¿Eliminar el rol "${r.nombre}"?`)) return
    error = ''
    try {
      await api.eliminarRol(r.id)
      aviso = 'Rol eliminado.'
      await cargar()
    } catch (e) {
      error = e.message
    }
  }
</script>

<svelte:window onkeydown={alTeclear} />

{#if abierto}
  <div class="fixed inset-0 z-40">
    <button
      type="button"
      class="absolute inset-0 w-full bg-black/40 cursor-default"
      aria-label="Cerrar menú"
      onclick={cerrar}></button>
    <aside class="absolute left-0 top-0 h-full w-full max-w-md bg-slate-50 shadow-2xl flex flex-col">
      <header class="bg-slate-900 text-white px-4 h-14 flex items-center gap-2 shrink-0">
        <span class="text-lg">🧑‍🤝‍🧑</span>
        <h2 class="font-semibold">Usuarios y roles</h2>
        <button class="ml-auto p-2 rounded hover:bg-slate-800" aria-label="Cerrar" onclick={cerrar}>✕</button>
      </header>

      <div class="flex gap-1 bg-white border-b border-slate-200 px-2 pt-2 shrink-0">
        <button
          class="px-3 py-2 text-sm rounded-t {vista === 'usuarios'
            ? 'font-medium text-slate-900 border-b-2 border-slate-900'
            : 'text-slate-500 hover:text-slate-700'}"
          onclick={() => (vista = 'usuarios')}>Usuarios</button>
        <button
          class="px-3 py-2 text-sm rounded-t {vista === 'roles'
            ? 'font-medium text-slate-900 border-b-2 border-slate-900'
            : 'text-slate-500 hover:text-slate-700'}"
          onclick={() => (vista = 'roles')}>Roles</button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        {#if error}
          <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>
        {/if}
        {#if aviso}
          <p class="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">{aviso}</p>
        {/if}

        {#if cargando}
          <p class="text-slate-500 text-sm">Cargando…</p>
        {:else if vista === 'usuarios'}
          <div class="flex items-center justify-between">
            <h3 class="font-medium text-sm">Usuarios ({usuarios.length})</h3>
            <button
              class="rounded bg-slate-900 text-white px-3 py-1.5 text-sm hover:bg-slate-800"
              onclick={nuevoUsuario}>+ Nuevo usuario</button>
          </div>

          {#if formUsuario}
            <form class="bg-white rounded-lg border border-slate-200 p-3 space-y-3" onsubmit={guardarUsuario}>
              <p class="font-medium text-sm">{editandoUsuarioId ? 'Editar usuario' : 'Nuevo usuario'}</p>
              <label class="block text-sm">
                Correo
                <input type="email" required bind:value={uEmail}
                  class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
              </label>
              <label class="block text-sm">
                Nombre
                <input required bind:value={uNombre}
                  class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
              </label>
              <label class="block text-sm">
                Rol
                <select bind:value={uRol}
                  class="mt-1 w-full rounded border border-slate-300 px-3 py-2">
                  {#each roles as r}
                    <option value={r.nombre}>{r.nombre}</option>
                  {/each}
                </select>
              </label>
              <label class="block text-sm">
                Contraseña {editandoUsuarioId ? '(vacío = mantener)' : ''}
                <input type="password" bind:value={uContrasena} required={!editandoUsuarioId}
                  class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={uEstado === 1}
                  onchange={(e) => (uEstado = e.currentTarget.checked ? 1 : 0)} />
                Activo
              </label>
              <div class="flex gap-2">
                <button type="submit" disabled={guardandoUsuario}
                  class="rounded bg-slate-900 text-white px-3 py-1.5 text-sm hover:bg-slate-800 disabled:opacity-60">
                  {guardandoUsuario ? 'Guardando…' : 'Guardar'}
                </button>
                <button type="button" onclick={cancelarUsuario}
                  class="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">Cancelar</button>
              </div>
            </form>
          {/if}

          {#if usuarios.length === 0}
            <p class="text-sm text-slate-500">Sin usuarios registrados.</p>
          {:else}
            <ul class="space-y-2">
              {#each usuarios as u (u.id)}
                <li class="bg-white rounded-lg border border-slate-200 p-3">
                  <p class="font-medium">{u.nombre}</p>
                  <p class="text-xs text-slate-500 break-all">{u.email}</p>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs bg-slate-100 text-slate-600 rounded px-2 py-0.5">{u.rol}</span>
                    <span class="text-xs rounded px-2 py-0.5 {u.estado
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-600'}">
                      {u.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p class="text-xs text-slate-400 mt-1">Creado: {fecha(u.fecha_creacion)}</p>
                  <div class="flex gap-3 mt-2 text-sm">
                    <button class="text-slate-700 hover:underline" onclick={() => editarUsuario(u)}>Editar</button>
                    <button class="text-slate-700 hover:underline" onclick={() => toggleEstado(u)}>
                      {u.estado ? 'Desactivar' : 'Activar'}
                    </button>
                    <button class="text-red-600 hover:underline" onclick={() => eliminarUsuario(u)}>Eliminar</button>
                  </div>
                </li>
              {/each}
            </ul>
          {/if}
        {:else}
          <div class="flex items-center justify-between">
            <h3 class="font-medium text-sm">Roles ({roles.length})</h3>
            <button
              class="rounded bg-slate-900 text-white px-3 py-1.5 text-sm hover:bg-slate-800"
              onclick={nuevoRol}>+ Nuevo rol</button>
          </div>

          {#if formRol}
            <form class="bg-white rounded-lg border border-slate-200 p-3 space-y-3" onsubmit={guardarRol}>
              <p class="font-medium text-sm">{editandoRolId ? 'Editar rol' : 'Nuevo rol'}</p>
              <label class="block text-sm">
                Nombre
                <input required bind:value={rNombre}
                  class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
              </label>
              <label class="block text-sm">
                Descripción
                <input bind:value={rDescripcion}
                  class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
              </label>
              <div>
                <span class="text-sm font-medium">Permisos por menú</span>
                <div class="grid grid-cols-2 gap-2 mt-1">
                  {#each MENUS as m}
                    <label class="flex items-center gap-2 text-sm">
                      <input type="checkbox" bind:checked={rPermisos[m.clave]} />
                      {m.texto}
                    </label>
                  {/each}
                </div>
              </div>
              <div class="flex gap-2">
                <button type="submit" disabled={guardandoRol}
                  class="rounded bg-slate-900 text-white px-3 py-1.5 text-sm hover:bg-slate-800 disabled:opacity-60">
                  {guardandoRol ? 'Guardando…' : 'Guardar'}
                </button>
                <button type="button" onclick={cancelarRol}
                  class="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">Cancelar</button>
              </div>
            </form>
          {/if}

          {#if roles.length === 0}
            <p class="text-sm text-slate-500">Sin roles registrados.</p>
          {:else}
            <ul class="space-y-2">
              {#each roles as r (r.id)}
                <li class="bg-white rounded-lg border border-slate-200 p-3">
                  <div class="flex items-center gap-2">
                    <p class="font-medium flex-1">{r.nombre}</p>
                    <button class="text-sm text-slate-700 hover:underline" onclick={() => editarRol(r)}>Editar</button>
                    <button class="text-sm text-red-600 hover:underline" onclick={() => eliminarRol(r)}>Eliminar</button>
                  </div>
                  {#if r.descripcion}
                    <p class="text-xs text-slate-500 mt-1">{r.descripcion}</p>
                  {/if}
                  <div class="flex flex-wrap gap-1 mt-2">
                    {#each MENUS as m}
                      <span
                        class="text-[11px] rounded px-2 py-0.5 {r.permisos?.[m.clave]
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-400'}">
                        {m.texto}
                      </span>
                    {/each}
                  </div>
                </li>
              {/each}
            </ul>
          {/if}
        {/if}
      </div>
    </aside>
  </div>
{/if}

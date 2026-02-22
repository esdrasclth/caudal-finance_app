'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import FormTransaccion from '../components/FormTransaccion'
import AppLayout from '../components/AppLayout'
import FormEditarTransaccion from '../components/FormEditarTransaccion'

export default function Transacciones() {
  const router = useRouter()
  const [transacciones, setTransacciones] = useState<any[]>([])
  const [filtradas, setFiltradas] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [transaccionEditar, setTransaccionEditar] = useState<any>(null)
  const [transaccionSeleccionada, setTransaccionSeleccionada] = useState<any>(null)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroMes, setFiltroMes] = useState(
    new Date().toISOString().slice(0, 7)
  )

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
    }
    checkUser()
  }, [router])

  useEffect(() => {
    cargarDatos()
  }, [filtroMes])

  useEffect(() => {
    aplicarFiltros()
  }, [busqueda, filtroTipo, filtroCategoria, transacciones])

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Cargar transacciones del mes seleccionado
    const inicioMes = `${filtroMes}-01`
    const finMes = new Date(
      parseInt(filtroMes.slice(0, 4)),
      parseInt(filtroMes.slice(5, 7)),
      0
    ).toISOString().split('T')[0]

const { data: trans, error } = await supabase
  .from('transactions')
  .select(`
    *,
    categories(nombre, icono, color),
    wallets:wallets!transactions_wallet_id_fkey(nombre, color)
  `)
  .eq('user_id', user.id)
  .gte('fecha', inicioMes)
  .lte('fecha', finMes)
  .order('fecha', { ascending: false })
  .order('created_at', { ascending: false })

  if (error) {
  console.error('Error real:', error)
  setTransacciones([])
  setFiltradas([])
  setLoading(false)
  return
}

    setTransacciones(trans || [])
    setFiltradas(trans || [])

    // Cargar categorías para el filtro
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${user.id},es_sistema.eq.true`)

    setCategorias(cats || [])
    setLoading(false)
  }

  const aplicarFiltros = () => {
    let resultado = [...transacciones]

    if (busqueda) {
      resultado = resultado.filter(t =>
        t.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
        t.categories?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
      )
    }

    if (filtroTipo !== 'todos') {
      resultado = resultado.filter(t => t.tipo === filtroTipo)
    }

    if (filtroCategoria !== 'todas') {
      resultado = resultado.filter(t => t.category_id === filtroCategoria)
    }

    setFiltradas(resultado)
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta transacción?')) return
    await supabase.from('transactions').delete().eq('id', id)
    cargarDatos()
  }

  const handleMesChange = (mes: string) => {
    setFiltroMes(mes)
  }

  const formatMonto = (n: number) =>
    new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(n)

  // Agrupar por fecha
  const transaccionesPorFecha = filtradas.reduce((acc: any, t) => {
    const fecha = t.fecha
    if (!acc[fecha]) acc[fecha] = []
    acc[fecha].push(t)
    return acc
  }, {})

  const totalIngresos = filtradas
    .filter(t => t.tipo === 'ingreso')
    .reduce((acc, t) => acc + Number(t.monto), 0)

  const totalGastos = filtradas
    .filter(t => t.tipo === 'gasto')
    .reduce((acc, t) => acc + Number(t.monto), 0)

  const formatFechaGrupo = (fecha: string) => {
    const hoy = new Date().toISOString().split('T')[0]
    const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (fecha === hoy) return 'Hoy'
    if (fecha === ayer) return 'Ayer'
    return new Date(fecha + 'T12:00:00').toLocaleDateString('es-HN', {
      weekday: 'long', day: 'numeric', month: 'long'
    })
  }

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <span className="text-4xl">💧</span>
          <p className="mt-3 text-teal-400 animate-pulse">Cargando...</p>
        </div>
      </main>
    )
  }

  return (
    <AppLayout>

      <div className="max-w-4xl px-6 py-8 mx-auto">

        {/* Selector de mes */}
        <div className="flex items-center justify-between mb-6">
          <input
            type="month"
            value={filtroMes}
            onChange={(e) => handleMesChange(e.target.value)}
            className="bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-500 transition-colors"
          />
          <div className="flex gap-4 text-sm">
            <span className="font-medium text-green-400">
              +L {formatMonto(totalIngresos)}
            </span>
            <span className="font-medium text-red-400">
              -L {formatMonto(totalGastos)}
            </span>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-4 mb-6 space-y-3 border bg-slate-800/50 border-slate-700 rounded-2xl">

          {/* Búsqueda */}
          <div className="relative">
            <span className="absolute -translate-y-1/2 left-4 top-1/2 text-slate-400">
              🔍
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por descripción o categoría..."
              className="w-full bg-slate-900/50 border border-slate-600 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-teal-500 transition-colors text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">

            {/* Filtro tipo */}
            <div className="flex gap-1 p-1 bg-slate-900/50 rounded-xl">
              {[
                { valor: 'todos', label: 'Todos' },
                { valor: 'gasto', label: '💸 Gastos' },
                { valor: 'ingreso', label: '💰 Ingresos' }
              ].map(op => (
                <button
                  key={op.valor}
                  onClick={() => setFiltroTipo(op.valor)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${filtroTipo === op.valor
                      ? 'bg-teal-500 text-white'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {op.label}
                </button>
              ))}
            </div>

            {/* Filtro categoría */}
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="px-3 py-2 text-sm text-white transition-colors border bg-slate-900/50 border-slate-600 rounded-xl focus:outline-none focus:border-teal-500"
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icono} {cat.nombre}
                </option>
              ))}
            </select>

          </div>

          {/* Contador resultados */}
          <p className="text-xs text-slate-500">
            {filtradas.length} {filtradas.length === 1 ? 'transacción' : 'transacciones'} encontradas
            {(busqueda || filtroTipo !== 'todos' || filtroCategoria !== 'todas') && (
              <button
                onClick={() => {
                  setBusqueda('')
                  setFiltroTipo('todos')
                  setFiltroCategoria('todas')
                }}
                className="ml-2 text-teal-400 hover:text-teal-300"
              >
                Limpiar filtros
              </button>
            )}
          </p>
        </div>

        {/* Lista agrupada por fecha */}
        {filtradas.length === 0 ? (
          <div className="p-12 text-center border bg-slate-800/50 border-slate-700 rounded-2xl">
            <span className="block mb-4 text-5xl">📋</span>
            <p className="text-slate-400">No hay transacciones</p>
            <p className="mt-1 text-sm text-slate-500">
              {busqueda || filtroTipo !== 'todos' || filtroCategoria !== 'todas'
                ? 'Prueba con otros filtros'
                : 'Agrega tu primera transacción con el botón +'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(transaccionesPorFecha)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([fecha, trans]: [string, any]) => {

                const totalDia = trans.reduce((acc: number, t: any) =>
                  t.tipo === 'ingreso' ? acc + Number(t.monto) : acc - Number(t.monto), 0
                )

                return (
                  <div key={fecha}>

                    {/* Header del día */}
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium capitalize text-slate-400">
                        {formatFechaGrupo(fecha)}
                      </p>
                      <span className={`text-sm font-semibold ${totalDia >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                        {totalDia >= 0 ? '+' : ''}L {formatMonto(totalDia)}
                      </span>
                    </div>

                    {/* Transacciones del día */}
                    <div className="space-y-2">
                      {trans.map((t: any) => (
                        <div
                          key={t.id}
                          onClick={() => setTransaccionSeleccionada(t)}
                          className="flex items-center justify-between p-4 transition-all border bg-slate-800/50 border-slate-700 hover:border-slate-500 rounded-xl group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {t.categories?.icono || '💸'}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {t.descripcion || t.categories?.nombre}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-slate-500">
                                  {t.categories?.nombre}
                                </span>
                                <span className="text-xs text-slate-700">·</span>
                                <span className="text-xs text-slate-500">
                                  {t.wallets?.nombre}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`font-semibold ${t.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'
                              }`}>
                              {t.tipo === 'ingreso' ? '+' : '-'}L {formatMonto(Number(t.monto))}
                            </span>
                            <div className="flex gap-1 transition-opacity opacity-0 group-hover:opacity-100">
                              <button
                                onClick={() => handleEliminar(t.id)}
                                className="p-1 text-sm transition-colors text-slate-500 hover:text-red-400"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>
        )}

      </div>

      {transaccionSeleccionada && (
        <FormEditarTransaccion
          transaccion={transaccionSeleccionada}
          onClose={() => setTransaccionSeleccionada(null)}
          onSuccess={() => {
            setTransaccionSeleccionada(null)
            cargarDatos()
          }}
        />
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed flex items-center justify-center text-2xl text-white transition-all bg-teal-500 rounded-full shadow-lg bottom-8 right-8 hover:bg-teal-400 w-14 h-14 shadow-teal-500/25 hover:scale-110"
      >
        +
      </button>

      {showForm && (
        <FormTransaccion
          onClose={() => setShowForm(false)}
          onSuccess={cargarDatos}
        />
      )}

    </AppLayout>
  )
}
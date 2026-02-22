'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import AppLayout from '../components/AppLayout'
import GraficaGastos from '../components/GraficaGastos'
import GraficaMensual from '../components/GraficaMensual'
import FormTransaccion from '../components/FormTransaccion'

export default function Dashboard() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [transacciones, setTransacciones] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [resumen, setResumen] = useState({ ingresos: 0, gastos: 0 })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      setUsuario(profile)
      cargarTransacciones()
    }
    init()
  }, [router])

  const cargarTransacciones = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const inicioMes = new Date()
    inicioMes.setDate(1)
    const inicioStr = inicioMes.toISOString().split('T')[0]

    const { data } = await supabase
      .from('transactions')
      .select('*, categories(nombre, icono, color)')
      .eq('user_id', user.id)
      .gte('fecha', inicioStr)
      .order('fecha', { ascending: false })

    setTransacciones(data || [])

    const ingresos = (data || [])
      .filter(t => t.tipo === 'ingreso')
      .reduce((sum, t) => sum + Number(t.monto), 0)
    const gastos = (data || [])
      .filter(t => t.tipo === 'gasto')
      .reduce((sum, t) => sum + Number(t.monto), 0)
    setResumen({ ingresos, gastos })
  }

  const formatMonto = (n: number) =>
    new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(n)

  const saludo = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const mesNombre = new Date().toLocaleDateString('es-HN', {
    month: 'long', year: 'numeric'
  })

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-slate-500 text-sm mb-1 capitalize">{mesNombre}</p>
          <h1 className="text-3xl font-bold text-white">
            {saludo()}, {usuario?.nombre?.split(' ')[0]} 👋
          </h1>
        </div>

        {/* Cards resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-green-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 text-sm">Ingresos</p>
              <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center text-sm">
                💰
              </div>
            </div>
            <p className="text-2xl font-bold text-green-400">
              L {formatMonto(resumen.ingresos)}
            </p>
            <p className="text-slate-600 text-xs mt-1">Este mes</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-red-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 text-sm">Gastos</p>
              <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center text-sm">
                💸
              </div>
            </div>
            <p className="text-2xl font-bold text-red-400">
              L {formatMonto(resumen.gastos)}
            </p>
            <p className="text-slate-600 text-xs mt-1">Este mes</p>
          </div>

          <div className="bg-slate-900 border border-teal-500/20 rounded-2xl p-6 hover:border-teal-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 text-sm">Saldo neto</p>
              <div className="w-8 h-8 bg-teal-500/10 rounded-lg flex items-center justify-center text-sm">
                📊
              </div>
            </div>
            <p className={`text-2xl font-bold ${
              resumen.ingresos - resumen.gastos >= 0
                ? 'text-teal-400' : 'text-red-400'
            }`}>
              L {formatMonto(resumen.ingresos - resumen.gastos)}
            </p>
            <p className="text-slate-600 text-xs mt-1">Ingresos - Gastos</p>
          </div>

        </div>

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-1">Gastos por categoría</h2>
            <p className="text-slate-500 text-xs mb-4">Distribución del mes</p>
            <GraficaGastos transacciones={transacciones} />
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
  <h2 className="text-white font-semibold mb-1">Movimientos diarios</h2>
  <p className="text-slate-500 text-xs mb-4">Ingresos vs Gastos</p>
  <GraficaMensual transacciones={transacciones} />
</div>
        </div>

        {/* Últimas transacciones */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-white font-semibold">Últimas transacciones</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                {transacciones.length} este mes
              </p>
            </div>
            <button
              onClick={() => router.push('/transacciones')}
              className="text-teal-400 hover:text-teal-300 text-sm transition-colors"
            >
              Ver todas →
            </button>
          </div>

          {transacciones.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-4xl block mb-3">📋</span>
              <p className="text-slate-500 text-sm">
                Toca + para agregar tu primera transacción
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {transacciones.slice(0, 6).map(t => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3.5 hover:bg-slate-800/50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-lg">
                      {t.categories?.icono || '💸'}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium leading-none">
                        {t.descripcion || t.categories?.nombre}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        {t.categories?.nombre} · {new Date(t.fecha + 'T12:00:00')
                          .toLocaleDateString('es-HN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${
                    t.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {t.tipo === 'ingreso' ? '+' : '-'}L {formatMonto(Number(t.monto))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Botón flotante */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-24 lg:bottom-8 right-6 lg:right-8 w-14 h-14 bg-teal-500 hover:bg-teal-400 text-white rounded-full text-2xl shadow-lg shadow-teal-500/30 transition-all hover:scale-110 flex items-center justify-center z-40"
      >
        +
      </button>

      {showForm && (
        <FormTransaccion
          onClose={() => setShowForm(false)}
          onSuccess={cargarTransacciones}
        />
      )}
    </AppLayout>
  )
}
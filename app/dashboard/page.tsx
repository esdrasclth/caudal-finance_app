'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import AppLayout from '../components/AppLayout'
import GraficaGastos from '../components/GraficaGastos'
import GraficaMensual from '../components/GraficaMensual'
import FormTransaccion from '../components/FormTransaccion'
import { SkeletonStats, SkeletonChart, SkeletonList } from '../components/Skeleton'

export default function Dashboard() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [transacciones, setTransacciones] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [resumen, setResumen] = useState({ ingresos: 0, gastos: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      setUsuario(profile)
      await cargarTransacciones()
      setLoading(false)
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

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-6xl p-6 mx-auto space-y-6 lg:p-8">
          <div className="space-y-2">
            <div className="w-32 h-3 rounded bg-slate-800 animate-pulse" />
            <div className="w-56 h-8 rounded bg-slate-800 animate-pulse" />
          </div>
          <SkeletonStats cols={3} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SkeletonChart />
            <SkeletonChart />
          </div>
          <SkeletonList items={6} />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-6xl p-6 mx-auto lg:p-8">

        {/* Header */}
        <div className="mb-8">
          <p className="mb-1 text-sm capitalize text-slate-500">{mesNombre}</p>
          <h1 className="text-3xl font-bold text-white">
            {saludo()}, {usuario?.nombre?.split(' ')[0]} 👋
          </h1>
        </div>

        {/* Cards resumen */}
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-3">
          <div className="p-6 transition-all border bg-slate-900 border-slate-800 rounded-2xl hover:border-green-500/30">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">Ingresos</p>
              <div className="flex items-center justify-center w-8 h-8 text-sm rounded-lg bg-green-500/10">💰</div>
            </div>
            <p className="text-2xl font-bold text-green-400">L {formatMonto(resumen.ingresos)}</p>
            <p className="mt-1 text-xs text-slate-600">Este mes</p>
          </div>

          <div className="p-6 transition-all border bg-slate-900 border-slate-800 rounded-2xl hover:border-red-500/30">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">Gastos</p>
              <div className="flex items-center justify-center w-8 h-8 text-sm rounded-lg bg-red-500/10">💸</div>
            </div>
            <p className="text-2xl font-bold text-red-400">L {formatMonto(resumen.gastos)}</p>
            <p className="mt-1 text-xs text-slate-600">Este mes</p>
          </div>

          <div className="p-6 transition-all border bg-slate-900 border-teal-500/20 rounded-2xl hover:border-teal-500/40">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">Saldo neto</p>
              <div className="flex items-center justify-center w-8 h-8 text-sm rounded-lg bg-teal-500/10">📊</div>
            </div>
            <p className={`text-2xl font-bold ${resumen.ingresos - resumen.gastos >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
              L {formatMonto(resumen.ingresos - resumen.gastos)}
            </p>
            <p className="mt-1 text-xs text-slate-600">Ingresos - Gastos</p>
          </div>
        </div>

        {/* Gráficas */}
        <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
          <div className="p-6 border bg-slate-900 border-slate-800 rounded-2xl">
            <h2 className="mb-1 font-semibold text-white">Gastos por categoría</h2>
            <p className="mb-4 text-xs text-slate-500">Distribución del mes</p>
            <GraficaGastos transacciones={transacciones} />
          </div>
          <div className="flex flex-col p-6 border bg-slate-900 border-slate-800 rounded-2xl">
            <h2 className="mb-1 font-semibold text-white">Movimientos diarios</h2>
            <p className="mb-4 text-xs text-slate-500">Ingresos vs Gastos</p>
            <GraficaMensual transacciones={transacciones} />
          </div>
        </div>

        {/* Últimas transacciones */}
        <div className="p-6 border bg-slate-900 border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-white">Últimas transacciones</h2>
              <p className="text-slate-500 text-xs mt-0.5">{transacciones.length} este mes</p>
            </div>
            <button
              onClick={() => router.push('/transacciones')}
              className="text-sm text-teal-400 transition-colors hover:text-teal-300"
            >
              Ver todas →
            </button>
          </div>

          {transacciones.length === 0 ? (
            <div className="py-10 text-center">
              <span className="block mb-3 text-4xl">📋</span>
              <p className="text-sm text-slate-500">Toca + para agregar tu primera transacción</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transacciones.slice(0, 6).map(t => (
                <div key={t.id} className="flex items-center justify-between p-3.5 hover:bg-slate-800/50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center text-lg w-9 h-9 bg-slate-800 rounded-xl">
                      {t.categories?.icono || '💸'}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none text-white">
                        {t.descripcion || t.categories?.nombre}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {t.categories?.nombre} · {new Date(t.fecha + 'T12:00:00')
                          .toLocaleDateString('es-HN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${t.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>
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
        className="fixed z-40 flex items-center justify-center text-2xl text-white transition-all bg-teal-500 rounded-full shadow-lg bottom-24 lg:bottom-8 right-6 lg:right-8 w-14 h-14 hover:bg-teal-400 shadow-teal-500/30 hover:scale-110"
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
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import FormPresupuesto from '../components/FormPresupuesto'
import AppLayout from '../components/AppLayout'

export default function Presupuesto() {
  const router = useRouter()
  const [presupuestos, setPresupuestos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [presupuestoEditar, setPresupuestoEditar] = useState<any>(null)

  const mesActual = new Date().getMonth() + 1
  const añoActual = new Date().getFullYear()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      cargarPresupuestos()
    }
    checkUser()
  }, [router])

  const cargarPresupuestos = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Cargar presupuestos del mes actual
    const { data: budgets } = await supabase
      .from('budgets')
      .select('*, categories(nombre, icono, color)')
      .eq('user_id', user.id)
      .eq('mes', mesActual)
      .eq('año', añoActual)

    // Para cada presupuesto calcular cuánto se ha gastado
    const presupuestosConGasto = await Promise.all(
      (budgets || []).map(async (budget) => {
        const inicioMes = `${añoActual}-${String(mesActual).padStart(2, '0')}-01`
        const { data: trans } = await supabase
          .from('transactions')
          .select('monto')
          .eq('user_id', user.id)
          .eq('category_id', budget.category_id)
          .eq('tipo', 'gasto')
          .gte('fecha', inicioMes)

        const gastado = (trans || []).reduce((acc, t) => acc + Number(t.monto), 0)
        const porcentaje = Math.min((gastado / budget.monto_limite) * 100, 100)

        return { ...budget, gastado, porcentaje }
      })
    )

    setPresupuestos(presupuestosConGasto)
    setLoading(false)
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este presupuesto?')) return
    await supabase.from('budgets').delete().eq('id', id)
    cargarPresupuestos()
  }

  const formatMonto = (n: number) =>
    new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(n)

  const totalPresupuestado = presupuestos.reduce((acc, p) => acc + Number(p.monto_limite), 0)
  const totalGastado = presupuestos.reduce((acc, p) => acc + p.gastado, 0)

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl">💧</span>
          <p className="text-teal-400 mt-3 animate-pulse">Cargando...</p>
        </div>
      </main>
    )
  }

  return (
    <AppLayout>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Resumen general */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-slate-400 text-xs mb-1">Presupuestado</p>
              <p className="text-xl font-bold text-white">
                L {formatMonto(totalPresupuestado)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Gastado</p>
              <p className="text-xl font-bold text-red-400">
                L {formatMonto(totalGastado)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Disponible</p>
              <p className={`text-xl font-bold ${
                totalPresupuestado - totalGastado >= 0
                  ? 'text-teal-400' : 'text-red-400'
              }`}>
                L {formatMonto(totalPresupuestado - totalGastado)}
              </p>
            </div>
          </div>

          {/* Barra de progreso general */}
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                totalGastado / totalPresupuestado > 1 ? 'bg-red-500' :
                totalGastado / totalPresupuestado > 0.8 ? 'bg-yellow-500' :
                'bg-teal-500'
              }`}
              style={{
                width: `${Math.min((totalGastado / totalPresupuestado) * 100 || 0, 100)}%`
              }}
            />
          </div>
          <p className="text-slate-500 text-xs mt-2">
            {totalPresupuestado > 0
              ? `${Math.round((totalGastado / totalPresupuestado) * 100)}% del presupuesto total usado`
              : 'Sin presupuesto configurado'}
          </p>
        </div>

        {/* Lista de presupuestos */}
        {presupuestos.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 text-center">
            <span className="text-5xl mb-4 block">🎯</span>
            <p className="text-slate-400 mb-2">No hay presupuestos este mes</p>
            <p className="text-slate-500 text-sm mb-6">
              Crea tu primer presupuesto con el botón +
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {presupuestos.map(p => {
              const sobrePasado = p.gastado > p.monto_limite
              const advertencia = p.porcentaje >= 80 && !sobrePasado

              return (
                <div
                  key={p.id}
                  className={`bg-slate-800/50 border rounded-2xl p-6 transition-all ${
                    sobrePasado ? 'border-red-500/50' :
                    advertencia ? 'border-yellow-500/50' :
                    'border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {p.categories?.icono || '📦'}
                      </span>
                      <div>
                        <p className="text-white font-medium">
                          {p.categories?.nombre}
                        </p>
                        <p className="text-slate-500 text-xs">
                          L {formatMonto(p.gastado)} de L {formatMonto(p.monto_limite)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {sobrePasado && (
                        <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-lg">
                          Sobrepasado
                        </span>
                      )}
                      {advertencia && (
                        <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2 py-1 rounded-lg">
                          ⚠️ {Math.round(p.porcentaje)}%
                        </span>
                      )}
                      <button
                        onClick={() => { setPresupuestoEditar(p); setShowForm(true) }}
                        className="text-slate-500 hover:text-teal-400 transition-colors"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleEliminar(p.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full bg-slate-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        sobrePasado ? 'bg-red-500' :
                        advertencia ? 'bg-yellow-500' :
                        'bg-teal-500'
                      }`}
                      style={{ width: `${p.porcentaje}%` }}
                    />
                  </div>

                  <div className="flex justify-between mt-2">
                    <span className="text-slate-500 text-xs">
                      {Math.round(p.porcentaje)}% usado
                    </span>
                    <span className={`text-xs font-medium ${
                      sobrePasado ? 'text-red-400' : 'text-teal-400'
                    }`}>
                      {sobrePasado
                        ? `L ${formatMonto(p.gastado - p.monto_limite)} sobrepasado`
                        : `L ${formatMonto(p.monto_limite - p.gastado)} restante`
                      }
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Botón flotante */}
      <button
        onClick={() => { setPresupuestoEditar(null); setShowForm(true) }}
        className="fixed bottom-8 right-8 bg-teal-500 hover:bg-teal-400 text-white rounded-full w-14 h-14 text-2xl shadow-lg shadow-teal-500/25 transition-all hover:scale-110 flex items-center justify-center"
      >
        +
      </button>

      {showForm && (
        <FormPresupuesto
          presupuesto={presupuestoEditar}
          onClose={() => { setShowForm(false); setPresupuestoEditar(null) }}
          onSuccess={cargarPresupuestos}
        />
      )}

    </AppLayout>
  )
}
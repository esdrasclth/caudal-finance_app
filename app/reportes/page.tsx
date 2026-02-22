'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import AppLayout from '../components/AppLayout'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'

export default function Reportes() {
  const router = useRouter()
  const [transacciones, setTransacciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('3') // meses hacia atrás

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      cargarDatos(periodo)
    }
    checkUser()
  }, [router])

  useEffect(() => {
    cargarDatos(periodo)
  }, [periodo])

  const cargarDatos = async (meses: string) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const inicio = new Date()
    inicio.setMonth(inicio.getMonth() - parseInt(meses))
    inicio.setDate(1)
    const inicioStr = inicio.toISOString().split('T')[0]

    const { data } = await supabase
      .from('transactions')
      .select('*, categories(nombre, icono, color)')
      .eq('user_id', user.id)
      .gte('fecha', inicioStr)
      .order('fecha', { ascending: true })

    setTransacciones(data || [])
    setLoading(false)
  }

  const formatMonto = (n: number) =>
    new Intl.NumberFormat('es-HN', { minimumFractionDigits: 0 }).format(n)

  const formatMontoCompleto = (n: number) =>
    new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(n)

  // ── Datos para gráfica de línea (evolución mensual) ──
  const evolucionMensual = (() => {
    const meses: any = {}
    transacciones.forEach(t => {
      const mes = t.fecha.slice(0, 7)
      if (!meses[mes]) meses[mes] = { mes, ingresos: 0, gastos: 0, ahorro: 0 }
      if (t.tipo === 'ingreso') meses[mes].ingresos += Number(t.monto)
      if (t.tipo === 'gasto') meses[mes].gastos += Number(t.monto)
    })
    return Object.values(meses).map((m: any) => ({
      ...m,
      ahorro: m.ingresos - m.gastos,
      label: new Date(m.mes + '-01').toLocaleDateString('es-HN', {
        month: 'short', year: '2-digit'
      })
    }))
  })()

  // ── Top categorías de gastos ──
  const topCategorias = (() => {
    const cats: any = {}
    transacciones
      .filter(t => t.tipo === 'gasto')
      .forEach(t => {
        const nombre = t.categories?.nombre || 'Sin categoría'
        const icono = t.categories?.icono || '📦'
        if (!cats[nombre]) cats[nombre] = { nombre, icono, total: 0, count: 0 }
        cats[nombre].total += Number(t.monto)
        cats[nombre].count += 1
      })
    return Object.values(cats)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 6)
  })()

  // ── Datos para dona de categorías ──
  const COLORES = ['#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899']

  // ── Totales generales ──
  const totalIngresos = transacciones
    .filter(t => t.tipo === 'ingreso')
    .reduce((acc, t) => acc + Number(t.monto), 0)

  const totalGastos = transacciones
    .filter(t => t.tipo === 'gasto')
    .reduce((acc, t) => acc + Number(t.monto), 0)

  const ahorro = totalIngresos - totalGastos
  const tasaAhorro = totalIngresos > 0
    ? ((ahorro / totalIngresos) * 100).toFixed(1)
    : '0'

  const promedioGastoMensual = evolucionMensual.length > 0
    ? totalGastos / evolucionMensual.length
    : 0

  // ── Día de la semana con más gastos ──
  const gastosPorDia = (() => {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const totales = Array(7).fill(0)
    transacciones
      .filter(t => t.tipo === 'gasto')
      .forEach(t => {
        const dia = new Date(t.fecha + 'T12:00:00').getDay()
        totales[dia] += Number(t.monto)
      })
    return dias.map((nombre, i) => ({ nombre, total: totales[i] }))
  })()

  const diaMasGasto = gastosPorDia.reduce(
    (max, d) => d.total > max.total ? d : max,
    { nombre: '-', total: 0 }
  )

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-teal-400 animate-pulse">Calculando reportes...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-6xl p-6 mx-auto lg:p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Reportes</h1>
            <p className="mt-1 text-sm text-slate-500">Análisis de tus finanzas</p>
          </div>

          {/* Selector de período */}
          <div className="flex p-1 border bg-slate-900 border-slate-800 rounded-xl">
            {[
              { valor: '1', label: '1M' },
              { valor: '3', label: '3M' },
              { valor: '6', label: '6M' },
              { valor: '12', label: '1A' },
            ].map(op => (
              <button
                key={op.valor}
                onClick={() => setPeriodo(op.valor)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${periodo === op.valor
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                  : 'text-slate-500 hover:text-white'
                  }`}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
          <div className="p-5 border bg-slate-900 border-slate-800 rounded-2xl">
            <p className="mb-2 text-xs text-slate-500">Total ingresos</p>
            <p className="text-xl font-bold text-green-400">
              L {formatMonto(totalIngresos)}
            </p>
          </div>
          <div className="p-5 border bg-slate-900 border-slate-800 rounded-2xl">
            <p className="mb-2 text-xs text-slate-500">Total gastos</p>
            <p className="text-xl font-bold text-red-400">
              L {formatMonto(totalGastos)}
            </p>
          </div>
          <div className="p-5 border bg-slate-900 border-slate-800 rounded-2xl">
            <p className="mb-2 text-xs text-slate-500">Tasa de ahorro</p>
            <p className={`text-xl font-bold ${parseFloat(tasaAhorro) >= 0 ? 'text-teal-400' : 'text-red-400'
              }`}>
              {tasaAhorro}%
            </p>
          </div>
          <div className="p-5 border bg-slate-900 border-slate-800 rounded-2xl">
            <p className="mb-2 text-xs text-slate-500">Gasto promedio/mes</p>
            <p className="text-xl font-bold text-white">
              L {formatMonto(promedioGastoMensual)}
            </p>
          </div>
        </div>

        {/* Evolución mensual */}
        <div className="p-6 mb-6 border bg-slate-900 border-slate-800 rounded-2xl">
          <h2 className="mb-1 font-semibold text-white">Evolución mensual</h2>
          <p className="mb-6 text-xs text-slate-500">Ingresos, gastos y ahorro por mes</p>
          {evolucionMensual.length === 0 ? (
            <p className="py-8 text-sm text-center text-slate-500">Sin datos para mostrar</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={evolucionMensual}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#1E293B' }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#1E293B' }} tickFormatter={(v) => `L${formatMonto(v)}`} width={75} />
                <Tooltip
                  formatter={(value: number | undefined, name: string | undefined) => [
                    `L ${formatMontoCompleto(Number(value) || 0)}`,
                    name === 'ingresos' ? '💰 Ingresos' : name === 'gastos' ? '💸 Gastos' : '💧 Ahorro'
                  ]}
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '12px', color: '#F1F5F9' }}
                />
                <Legend formatter={(v) => v === 'ingresos' ? '💰 Ingresos' : v === 'gastos' ? '💸 Gastos' : '💧 Ahorro'} wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }} />
                <Line type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} />
                <Line type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', r: 4 }} />
                <Line type="monotone" dataKey="ahorro" stroke="#0D9488" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#0D9488', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">

          {/* Top categorías */}
          <div className="p-6 border bg-slate-900 border-slate-800 rounded-2xl">
            <h2 className="mb-1 font-semibold text-white">Top categorías de gasto</h2>
            <p className="mb-4 text-xs text-slate-500">Las que más consumen tu dinero</p>
            {topCategorias.length === 0 ? (
              <p className="py-8 text-sm text-center text-slate-500">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {(topCategorias as any[]).map((cat: any, i: number) => {
                  const porcentaje = totalGastos > 0
                    ? (cat.total / totalGastos) * 100
                    : 0
                  return (
                    <div key={cat.nombre}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{cat.icono}</span>
                          <span className="text-sm text-slate-300">{cat.nombre}</span>
                          <span className="text-xs text-slate-600">({cat.count})</span>
                        </div>
                        <span className="text-sm font-medium text-white">
                          L {formatMonto(cat.total)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${porcentaje}%`,
                            backgroundColor: COLORES[i % COLORES.length]
                          }}
                        />
                      </div>
                      <p className="text-slate-600 text-xs mt-0.5">
                        {porcentaje.toFixed(1)}% del total
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Gastos por día de la semana */}
          <div className="p-6 border bg-slate-900 border-slate-800 rounded-2xl">
            <h2 className="mb-1 font-semibold text-white">Gastos por día</h2>
            <p className="mb-4 text-xs text-slate-500">
              Día con más gastos: <span className="font-medium text-teal-400">{diaMasGasto.nombre}</span>
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={gastosPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="nombre" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#1E293B' }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={{ stroke: '#1E293B' }} tickFormatter={(v) => `L${formatMonto(v)}`} width={65} />
                <Tooltip
                  formatter={(value: number | undefined) => [`L ${formatMontoCompleto(Number(value) || 0)}`, 'Gastos']}
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '12px', color: '#F1F5F9' }}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {gastosPorDia.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.nombre === diaMasGasto.nombre ? '#0D9488' : '#1E3A5F'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* Insight automático */}
        <div className="p-6 border bg-teal-500/5 border-teal-500/20 rounded-2xl">
          <p className="mb-3 font-semibold text-teal-400">💡 Análisis automático</p>
          <div className="space-y-2">
            {parseFloat(tasaAhorro) >= 20 && (
              <p className="text-sm text-slate-300">
                ✅ Excelente — estás ahorrando el <span className="font-medium text-teal-400">{tasaAhorro}%</span> de tus ingresos. Sigue así.
              </p>
            )}
            {parseFloat(tasaAhorro) >= 0 && parseFloat(tasaAhorro) < 20 && (
              <p className="text-sm text-slate-300">
                ⚠️ Tu tasa de ahorro es <span className="font-medium text-yellow-400">{tasaAhorro}%</span>. Lo ideal es ahorrar al menos el 20% de tus ingresos.
              </p>
            )}
            {parseFloat(tasaAhorro) < 0 && (
              <p className="text-sm text-slate-300">
                🚨 Estás gastando más de lo que ganas. Considera revisar tus gastos en <span className="font-medium text-red-400">{(topCategorias[0] as any)?.nombre || 'tus categorías principales'}</span>.
              </p>
            )}
            {topCategorias.length > 0 && (
              <p className="text-sm text-slate-300">
                📊 Tu mayor gasto es en <span className="font-medium text-white">{(topCategorias[0] as any).icono} {(topCategorias[0] as any).nombre}</span> con <span className="font-medium text-red-400">L {formatMontoCompleto((topCategorias[0] as any).total)}</span> en el período.
              </p>
            )}
            {diaMasGasto.total > 0 && (
              <p className="text-sm text-slate-300">
                📅 Gastas más los <span className="font-medium text-white">{diaMasGasto.nombre}</span>.
              </p>
            )}
            {transacciones.length === 0 && (
              <p className="text-sm text-slate-400">
                No hay suficientes datos para el período seleccionado.
              </p>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
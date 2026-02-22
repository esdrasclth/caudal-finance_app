'use client'

import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Props {
  transacciones: any[]
}

export default function GraficaMensual({ transacciones }: Props) {
  const ingresos = transacciones
    .filter(t => t.tipo === 'ingreso')
    .reduce((sum, t) => sum + Number(t.monto), 0)

  const gastos = transacciones
    .filter(t => t.tipo === 'gasto')
    .reduce((sum, t) => sum + Number(t.monto), 0)

  const datos = [
  { nombre: 'Ingresos', valor: ingresos, fill: '#10B981' },
  { nombre: 'Gastos', valor: gastos, fill: '#EF4444' },
]

  const formatMonto = (n: number) =>
    new Intl.NumberFormat('es-HN', { minimumFractionDigits: 0 }).format(n)

  if (ingresos === 0 && gastos === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="mb-3 text-4xl">📈</span>
        <p className="text-sm text-slate-400">Sin datos para mostrar</p>
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={datos} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
  <XAxis
    dataKey="nombre"
    tick={{ fill: '#94A3B8', fontSize: 13 }}
    axisLine={{ stroke: '#1E293B' }}
  />
  <YAxis
    tick={{ fill: '#64748B', fontSize: 11 }}
    axisLine={{ stroke: '#1E293B' }}
    tickFormatter={(v) => `L${formatMonto(v)}`}
    width={75}
  />
  <Tooltip
    formatter={(value: number | undefined) => [`L ${formatMonto(Number(value) || 0)}`]}
    contentStyle={{
      backgroundColor: '#1E293B',
      border: '1px solid #334155',
      borderRadius: '12px',
      color: '#F1F5F9'
    }}
  />
  <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
    {datos.map((entry, index) => (
      <Cell key={index} fill={entry.fill} />
    ))}
  </Bar>
</BarChart>
</ResponsiveContainer>
    </div>
  )
}
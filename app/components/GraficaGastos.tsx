'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  transacciones: any[]
}

export default function GraficaGastos({ transacciones }: Props) {
  const datos = transacciones
    .filter(t => t.tipo === 'gasto' && t.categories?.nombre !== 'Transferencia')
    .reduce((acc: any[], t) => {
      const nombre = t.categories?.nombre || 'Sin categoría'
      const icono = t.categories?.icono || '💸'
      const key = nombre

      const existing = acc.find(a => a.key === key)
      if (existing) {
        existing.valor += Number(t.monto)
      } else {
        acc.push({
          key,
          nombre: `${icono} ${nombre}`,
          valor: Number(t.monto)
        })
      }
      return acc
    }, [])
    .sort((a, b) => b.valor - a.valor)

  const COLORES = [
    '#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B',
    '#EF4444', '#EC4899', '#10B981', '#6366F1'
  ]

  const formatMonto = (n: number) =>
    new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(n)

  if (datos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="mb-3 text-4xl">📊</span>
        <p className="text-sm text-slate-400">Sin datos para mostrar</p>
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={datos}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="valor"
          >
            {datos.map((_, index) => (
              <Cell key={index} fill={COLORES[index % COLORES.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`L ${formatMonto(value)}`, 'Monto']}
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '12px',
              color: '#F1F5F9'
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Leyenda */}
      <div className="mt-2 space-y-2">
        {datos.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="flex-shrink-0 w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORES[index % COLORES.length] }}
              />
              <span className="text-sm text-slate-300">{item.nombre}</span>
            </div>
            <span className="text-sm font-medium text-white">
              L {formatMonto(item.valor)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
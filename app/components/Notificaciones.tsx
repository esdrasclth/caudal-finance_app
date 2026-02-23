'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

interface Notificacion {
  id: string
  tipo: 'advertencia' | 'peligro'
  titulo: string
  mensaje: string
  href: string
}

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [mostrar, setMostrar] = useState(false)
  const router = useRouter()

  useEffect(() => {
    cargarNotificaciones()
  }, [])

  const cargarNotificaciones = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const mesActual = new Date().getMonth() + 1
    const añoActual = new Date().getFullYear()
    const inicioMes = `${añoActual}-${String(mesActual).padStart(2, '0')}-01`

    // Cargar presupuestos del mes
    const { data: budgets } = await supabase
      .from('budgets')
      .select('*, categories(nombre, icono)')
      .eq('user_id', user.id)
      .eq('mes', mesActual)
      .eq('año', añoActual)

    if (!budgets || budgets.length === 0) return

    const nuevasNotificaciones: Notificacion[] = []

    for (const budget of budgets) {
      const { data: trans } = await supabase
        .from('transactions')
        .select('monto')
        .eq('user_id', user.id)
        .eq('category_id', budget.category_id)
        .eq('tipo', 'gasto')
        .gte('fecha', inicioMes)

      const gastado = (trans || []).reduce((acc, t) => acc + Number(t.monto), 0)
      const porcentaje = (gastado / budget.monto_limite) * 100
      const icono = budget.categories?.icono || '📦'
      const nombre = budget.categories?.nombre || 'Categoría'

      if (porcentaje >= 100) {
        nuevasNotificaciones.push({
          id: budget.id,
          tipo: 'peligro',
          titulo: `${icono} Presupuesto sobrepasado`,
          mensaje: `${nombre}: gastaste L ${gastado.toFixed(2)} de L ${Number(budget.monto_limite).toFixed(2)}`,
          href: '/presupuesto'
        })
      } else if (porcentaje >= 80) {
        nuevasNotificaciones.push({
          id: budget.id,
          tipo: 'advertencia',
          titulo: `${icono} Presupuesto al ${Math.round(porcentaje)}%`,
          mensaje: `${nombre}: te quedan L ${(Number(budget.monto_limite) - gastado).toFixed(2)}`,
          href: '/presupuesto'
        })
      }
    }

    // Verificar deudas vencidas
    const { data: deudas } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id)
      .eq('completada', false)
      .lt('fecha_limite', new Date().toISOString().split('T')[0])

    for (const deuda of deudas || []) {
      nuevasNotificaciones.push({
        id: 'deuda-' + deuda.id,
        tipo: 'peligro',
        titulo: '🤝 Deuda vencida',
        mensaje: `${deuda.nombre}: venció el ${new Date(deuda.fecha_limite + 'T12:00:00').toLocaleDateString('es-HN')}`,
        href: '/deudas'
      })
    }

    // Verificar tarjetas con pago próximo
    const { data: tarjetas } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('tipo', 'credito')
      .eq('activo', true)

    const hoy = new Date()
    const diaHoy = hoy.getDate()

    for (const tarjeta of tarjetas || []) {
      if (!tarjeta.fecha_pago) continue

      const diaPago = tarjeta.fecha_pago
      let diasParaPago = diaPago - diaHoy
      if (diasParaPago < 0) {
        const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
        diasParaPago = diasEnMes - diaHoy + diaPago
      }

      if (diasParaPago <= 5) {
        nuevasNotificaciones.push({
          id: 'tarjeta-' + tarjeta.id,
          tipo: diasParaPago <= 2 ? 'peligro' : 'advertencia',
          titulo: `💳 Pago próximo — ${tarjeta.nombre}`,
          mensaje: diasParaPago === 0
            ? '¡Hoy es tu fecha de pago!'
            : `Faltan ${diasParaPago} días para tu fecha de pago (día ${diaPago})`,
          href: '/carteras'
        })
      }
    }

    setNotificaciones(nuevasNotificaciones)
  }

  const cantidad = notificaciones.length

  return (
    <div className="relative">

      {/* Botón campana */}
      <button
        onClick={() => setMostrar(!mostrar)}
        className="relative p-2 transition-colors text-slate-400 hover:text-white"
      >
        <span className="text-xl">🔔</span>
        {cantidad > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {cantidad > 9 ? '9+' : cantidad}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {mostrar && (
        <>
          {/* Overlay para cerrar */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMostrar(false)}
          />

          <div className="absolute right-0 z-50 overflow-hidden border shadow-xl top-12 w-80 bg-slate-800 border-slate-700 rounded-2xl">

            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
              <span className="text-xs text-slate-500">{cantidad} alertas</span>
            </div>

            {cantidad === 0 ? (
              <div className="p-6 text-center">
                <span className="block mb-2 text-3xl">✅</span>
                <p className="text-sm text-slate-400">Todo en orden</p>
                <p className="mt-1 text-xs text-slate-500">
                  No tienes alertas pendientes
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-80">
                {notificaciones.map(n => (
                  <button
                    key={n.id}
                    onClick={() => {
                      setMostrar(false)
                      router.push(n.href)
                    }}
                    className={`w-full text-left p-4 border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors ${n.tipo === 'peligro' ? 'border-l-2 border-l-red-500' : 'border-l-2 border-l-yellow-500'
                      }`}
                  >
                    <p className="text-sm font-medium text-white">{n.titulo}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{n.mensaje}</p>
                    <p className={`text-xs mt-1 font-medium ${n.tipo === 'peligro' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                      {n.tipo === 'peligro' ? '🚨 Atención requerida' : '⚠️ Revisar'}
                    </p>
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 border-t border-slate-700">
              <button
                onClick={() => { setMostrar(false); router.push('/presupuesto') }}
                className="w-full text-xs text-center text-teal-400 transition-colors hover:text-teal-300"
              >
                Ver todos los presupuestos →
              </button>
            </div>

          </div>
        </>
      )}
    </div>
  )
}
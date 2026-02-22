'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  cartera?: any
  onClose: () => void
  onSuccess: () => void
}

const TIPOS = [
  { valor: 'efectivo', label: 'Efectivo', icono: '💵' },
  { valor: 'banco', label: 'Banco', icono: '🏦' },
  { valor: 'credito', label: 'Tarjeta crédito', icono: '💳' },
  { valor: 'ahorro', label: 'Ahorros', icono: '🏆' },
]

const COLORES = [
  '#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B',
  '#EF4444', '#EC4899', '#10B981', '#F97316'
]

export default function FormCartera({ cartera, onClose, onSuccess }: Props) {
  const [nombre, setNombre] = useState(cartera?.nombre || '')
  const [tipo, setTipo] = useState(cartera?.tipo || 'efectivo')
  const [saldoInicial, setSaldoInicial] = useState(cartera?.saldo_inicial?.toString() || '0')
  const [color, setColor] = useState(cartera?.color || '#0D9488')
  const [creditoLimite, setCreditoLimite] = useState(cartera?.credito_limite?.toString() || '')
  const [fechaCorte, setFechaCorte] = useState(cartera?.fecha_corte?.toString() || '1')
  const [fechaPago, setFechaPago] = useState(cartera?.fecha_pago?.toString() || '15')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const esEdicion = !!cartera
  const esTarjeta = tipo === 'credito'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload: any = {
      user_id: user.id,
      nombre,
      tipo,
      color,
      activo: true,
      moneda: 'HNL',
    }

    if (esTarjeta) {
      payload.credito_limite = parseFloat(creditoLimite) || 0
      payload.fecha_corte = parseInt(fechaCorte) || 1
      payload.fecha_pago = parseInt(fechaPago) || 15
    }

    if (esEdicion) {
      const { error } = await supabase
        .from('wallets')
        .upsert({ id: cartera.id, saldo_inicial: cartera.saldo_inicial, ...payload })
      if (error) { setError('Error al actualizar: ' + error.message); setLoading(false); return }
    } else {
      payload.saldo_inicial = parseFloat(saldoInicial) || 0
      const { error } = await supabase.from('wallets').insert(payload)
      if (error) { setError('Error al crear: ' + error.message); setLoading(false); return }
    }

    onSuccess()
    onClose()
  }

  const dias = Array.from({ length: 31 }, (_, i) => i + 1)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm sm:items-center">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">
            {esEdicion ? 'Editar cartera' : 'Nueva cartera'}
          </h2>
          <button onClick={onClose} className="text-xl text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Nombre */}
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: GASCARD, Cuenta Atlántida"
              required
              className="w-full px-4 py-3 text-white transition-colors border bg-slate-900/50 border-slate-600 placeholder-slate-500 rounded-xl focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS.map(t => (
                <button
                  key={t.valor}
                  type="button"
                  onClick={() => setTipo(t.valor)}
                  className={`p-3 rounded-xl text-sm text-left transition-all border ${
                    tipo === t.valor
                      ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                      : 'border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <span className="mr-2 text-lg">{t.icono}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Saldo inicial — solo en creación y no tarjeta */}
          {!esEdicion && !esTarjeta && (
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-300">Saldo inicial</label>
              <div className="relative">
                <span className="absolute -translate-y-1/2 left-4 top-1/2 text-slate-400">L</span>
                <input
                  type="number"
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full py-3 pl-8 pr-4 text-white transition-colors border bg-slate-900/50 border-slate-600 placeholder-slate-500 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {/* Configuración especial tarjeta de crédito */}
          {esTarjeta && (
            <div className="p-4 space-y-4 border bg-blue-500/5 border-blue-500/20 rounded-xl">
              <p className="text-sm font-medium text-blue-400">💳 Configuración de tarjeta</p>

              {/* Límite de crédito */}
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-300">
                  Límite de crédito
                </label>
                <div className="relative">
                  <span className="absolute -translate-y-1/2 left-4 top-1/2 text-slate-400">L</span>
                  <input
                    type="number"
                    value={creditoLimite}
                    onChange={(e) => setCreditoLimite(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full py-3 pl-8 pr-4 text-white transition-colors border bg-slate-900/50 border-slate-600 placeholder-slate-500 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Fecha de corte */}
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-300">
                  Día de corte
                  <span className="ml-1 font-normal text-slate-500">
                    (día del mes en que cierra el período)
                  </span>
                </label>
                <select
                  value={fechaCorte}
                  onChange={(e) => setFechaCorte(e.target.value)}
                  className="w-full px-4 py-3 text-white transition-colors border bg-slate-900/50 border-slate-600 rounded-xl focus:outline-none focus:border-teal-500"
                >
                  {dias.map(d => (
                    <option key={d} value={d}>Día {d}</option>
                  ))}
                </select>
              </div>

              {/* Fecha de pago */}
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-300">
                  Día de pago
                  <span className="ml-1 font-normal text-slate-500">
                    (día límite para pagar sin intereses)
                  </span>
                </label>
                <select
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                  className="w-full px-4 py-3 text-white transition-colors border bg-slate-900/50 border-slate-600 rounded-xl focus:outline-none focus:border-teal-500"
                >
                  {dias.map(d => (
                    <option key={d} value={d}>Día {d}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Color */}
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">Color</label>
            <div className="flex flex-wrap gap-3">
              {COLORES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 text-sm text-red-400 border bg-red-500/10 border-red-500/30 rounded-xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 font-medium transition-all border rounded-xl border-slate-600 text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-3 font-medium text-white transition-all bg-teal-500 rounded-xl hover:bg-teal-400 disabled:bg-teal-800"
            >
              {loading ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Crear'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
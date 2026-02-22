'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  deuda?: any
  onClose: () => void
  onSuccess: () => void
}

export default function FormDeuda({ deuda, onClose, onSuccess }: Props) {
  const [nombre, setNombre] = useState(deuda?.nombre || '')
  const [descripcion, setDescripcion] = useState(deuda?.descripcion || '')
  const [tipo, setTipo] = useState<'debo' | 'me_deben'>(deuda?.tipo || 'debo')
  const [montoTotal, setMontoTotal] = useState(deuda?.monto_total?.toString() || '')
  const [montoPagado, setMontoPagado] = useState(deuda?.monto_pagado?.toString() || '0')
  const [fechaLimite, setFechaLimite] = useState(deuda?.fecha_limite || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const esEdicion = !!deuda

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      nombre,
      descripcion,
      tipo,
      monto_total: parseFloat(montoTotal),
      monto_pagado: parseFloat(montoPagado) || 0,
      fecha_limite: fechaLimite || null,
      completada: deuda?.completada || false
    }

    if (esEdicion) {
      const { error } = await supabase
        .from('debts')
        .upsert({ id: deuda.id, ...payload })
      if (error) { setError('Error al actualizar'); setLoading(false); return }
    } else {
      const { error } = await supabase
        .from('debts')
        .insert(payload)
      if (error) { setError('Error al crear: ' + error.message); setLoading(false); return }
    }

    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm sm:items-center">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">
            {esEdicion ? 'Editar deuda' : 'Nueva deuda'}
          </h2>
          <button onClick={onClose} className="text-xl text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/50 rounded-xl">
            <button
              type="button"
              onClick={() => setTipo('debo')}
              className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                tipo === 'debo'
                  ? 'bg-red-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              💸 Yo debo
            </button>
            <button
              type="button"
              onClick={() => setTipo('me_deben')}
              className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                tipo === 'me_deben'
                  ? 'bg-green-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              💰 Me deben
            </button>
          </div>

          {/* Nombre */}
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">
              {tipo === 'debo' ? '¿A quién le debes?' : '¿Quién te debe?'}
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Banco Atlántida, Juan Pérez"
              required
              className="w-full px-4 py-3 text-white transition-colors border bg-slate-900/50 border-slate-600 placeholder-slate-500 rounded-xl focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">
              Descripción
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Préstamo personal, Celular"
              className="w-full px-4 py-3 text-white transition-colors border bg-slate-900/50 border-slate-600 placeholder-slate-500 rounded-xl focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Monto total */}
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">
              Monto total
            </label>
            <div className="relative">
              <span className="absolute -translate-y-1/2 left-4 top-1/2 text-slate-400">L</span>
              <input
                type="number"
                value={montoTotal}
                onChange={(e) => setMontoTotal(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
                className="w-full py-3 pl-8 pr-4 text-white transition-colors border bg-slate-900/50 border-slate-600 placeholder-slate-500 rounded-xl focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Monto pagado */}
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">
              Monto ya pagado
            </label>
            <div className="relative">
              <span className="absolute -translate-y-1/2 left-4 top-1/2 text-slate-400">L</span>
              <input
                type="number"
                value={montoPagado}
                onChange={(e) => setMontoPagado(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full py-3 pl-8 pr-4 text-white transition-colors border bg-slate-900/50 border-slate-600 placeholder-slate-500 rounded-xl focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Fecha límite */}
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">
              Fecha límite <span className="font-normal text-slate-500">(opcional)</span>
            </label>
            <input
              type="date"
              value={fechaLimite}
              onChange={(e) => setFechaLimite(e.target.value)}
              className="w-full px-4 py-3 text-white transition-colors border bg-slate-900/50 border-slate-600 rounded-xl focus:outline-none focus:border-teal-500"
            />
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
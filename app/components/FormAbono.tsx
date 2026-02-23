'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  deuda: any
  onClose: () => void
  onSuccess: () => void
}

export default function FormAbono({ deuda, onClose, onSuccess }: Props) {
  const [monto, setMonto] = useState('')
  const [walletId, setWalletId] = useState('')
  const [wallets, setWallets] = useState<any[]>([])
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [nota, setNota] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarWallets()
  }, [])

  const cargarWallets = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('activo', true)
    setWallets(data || [])
    if (data && data.length > 0) setWalletId(data[0].id)
  }

  const pendiente = Number(deuda.monto_total) - Number(deuda.monto_pagado)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const montoNum = parseFloat(monto)
    if (montoNum <= 0) { setError('El monto debe ser mayor a 0'); setLoading(false); return }
    if (montoNum > pendiente) { setError(`El monto no puede superar el pendiente de L ${pendiente.toFixed(2)}`); setLoading(false); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Registrar el abono en debt_payments
    const { error: e1 } = await supabase.from('debt_payments').insert({
      debt_id: deuda.id,
      user_id: user.id,
      wallet_id: walletId,
      monto: montoNum,
      fecha,
      nota
    })

    if (e1) { setError('Error al registrar abono'); setLoading(false); return }

    // 2. Actualizar monto_pagado en la deuda
    const nuevoPagado = Number(deuda.monto_pagado) + montoNum
    const completada = nuevoPagado >= Number(deuda.monto_total)

    await supabase.from('debts').update({
      monto_pagado: nuevoPagado,
      completada
    }).eq('id', deuda.id)

    // 3. Buscar o crear categoría de pago de deuda
    let { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('nombre', 'Pago de deuda')
      .eq('es_sistema', true)
      .limit(1)

    let catId = cat?.[0]?.id
    if (!catId) {
      const { data: newCat } = await supabase.from('categories').insert({
        nombre: 'Pago de deuda',
        tipo: 'gasto',
        icono: '🤝',
        color: '#6366F1',
        es_sistema: true,
        user_id: user.id
      }).select().single()
      catId = newCat?.id
    }

    // 4. Registrar transacción en movimientos
    await supabase.from('transactions').insert({
      user_id: user.id,
      wallet_id: walletId,
      category_id: catId,
      monto: montoNum,
      tipo: 'gasto',
      descripcion: `Abono: ${deuda.nombre}${nota ? ' — ' + nota : ''}`,
      fecha
    })

    onSuccess()
    onClose()
  }

  const formatMonto = (n: number) =>
    new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(n)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md overflow-y-auto border bg-slate-800 border-slate-700 rounded-2xl max-h-[90vh]">

        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Registrar abono</h2>
            <p className="text-xs text-slate-400 mt-0.5">{deuda.nombre}</p>
          </div>
          <button onClick={onClose} className="text-xl text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Resumen de la deuda */}
        <div className="p-4 mx-6 mt-4 border bg-slate-900/50 border-slate-700 rounded-xl">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Total deuda</p>
              <p className="font-medium text-white">L {formatMonto(Number(deuda.monto_total))}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Pagado</p>
              <p className="font-medium text-teal-400">L {formatMonto(Number(deuda.monto_pagado))}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-500">Pendiente</p>
              <p className="text-lg font-semibold text-red-400">L {formatMonto(pendiente)}</p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3">
            <div
              className="h-1.5 bg-teal-500 rounded-full"
              style={{ width: `${Math.min((Number(deuda.monto_pagado) / Number(deuda.monto_total)) * 100, 100)}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Monto */}
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">Monto del abono</label>
            <div className="relative">
              <span className="absolute text-lg font-medium -translate-y-1/2 left-4 top-1/2 text-slate-400">L</span>
              <input
                type="number"
                inputMode="decimal"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
                autoFocus
                className="w-full py-4 pl-10 pr-4 text-2xl font-bold text-white transition-colors border bg-slate-900/50 border-slate-600 placeholder-slate-700 rounded-xl focus:outline-none focus:border-teal-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setMonto(pendiente.toFixed(2))}
              className="mt-2 text-xs text-teal-400 hover:text-teal-300"
            >
              Pagar todo (L {formatMonto(pendiente)}) →
            </button>
          </div>

          {/* Cartera */}
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">Desde cartera</label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              required
              className="w-full px-4 py-3 text-white transition-colors border bg-slate-900/50 border-slate-600 rounded-xl focus:outline-none focus:border-teal-500"
            >
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.nombre}</option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-4 py-3 text-white transition-colors border bg-slate-900/50 border-slate-600 rounded-xl focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Nota */}
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">
              Nota <span className="font-normal text-slate-500">(opcional)</span>
            </label>
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej: Cuota mensual"
              className="w-full px-4 py-3 text-white transition-colors border bg-slate-900/50 border-slate-600 placeholder-slate-500 rounded-xl focus:outline-none focus:border-teal-500"
            />
          </div>

          {error && (
            <div className="px-4 py-3 text-sm text-red-400 border bg-red-500/10 border-red-500/30 rounded-xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="py-3 font-medium transition-all border rounded-xl border-slate-600 text-slate-400 hover:text-white">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="py-3 font-medium text-white transition-all bg-teal-500 rounded-xl hover:bg-teal-400 disabled:opacity-50">
              {loading ? 'Registrando...' : '💳 Registrar abono'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
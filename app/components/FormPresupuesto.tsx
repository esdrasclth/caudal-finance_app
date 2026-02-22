'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  presupuesto?: any
  onClose: () => void
  onSuccess: () => void
}

export default function FormPresupuesto({ presupuesto, onClose, onSuccess }: Props) {
  const [categorias, setCategorias] = useState<any[]>([])
  const [categoriaId, setCategoriaId] = useState(presupuesto?.category_id || '')
  const [montoLimite, setMontoLimite] = useState(
    presupuesto?.monto_limite?.toString() || ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const mesActual = new Date().getMonth() + 1
  const añoActual = new Date().getFullYear()
  const esEdicion = !!presupuesto

  useEffect(() => {
    cargarCategorias()
  }, [])

  const cargarCategorias = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${user.id},es_sistema.eq.true`)
      .eq('tipo', 'gasto')
      .order('nombre')

    setCategorias(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!categoriaId) {
      setError('Selecciona una categoría')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (esEdicion) {
      const { error } = await supabase
        .from('budgets')
        .update({ monto_limite: parseFloat(montoLimite) })
        .eq('id', presupuesto.id)
      if (error) { setError('Error al actualizar'); setLoading(false); return }
    } else {
      // Verificar si ya existe presupuesto para esa categoría este mes
      const { data: existing } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', user.id)
        .eq('category_id', categoriaId)
        .eq('mes', mesActual)
        .eq('año', añoActual)
        .single()

      if (existing) {
        setError('Ya tienes un presupuesto para esta categoría este mes')
        setLoading(false)
        return
      }

      const { error } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          category_id: categoriaId,
          monto_limite: parseFloat(montoLimite),
          mes: mesActual,
          año: añoActual
        })
      if (error) { setError('Error al crear'); setLoading(false); return }
    }

    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">

        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">
            {esEdicion ? 'Editar presupuesto' : 'Nuevo presupuesto'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Categoría */}
          {!esEdicion && (
            <div>
              <label className="text-slate-300 text-sm font-medium block mb-2">
                Categoría
              </label>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {categorias.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoriaId(cat.id)}
                    className={`p-2.5 rounded-xl text-xs text-center transition-all border ${
                      categoriaId === cat.id
                        ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                        : 'border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-lg mb-1">{cat.icono || '📦'}</div>
                    <div className="leading-tight">{cat.nombre}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {esEdicion && (
            <div className="flex items-center gap-3 bg-slate-900/50 rounded-xl p-4">
              <span className="text-2xl">{presupuesto.categories?.icono}</span>
              <div>
                <p className="text-white font-medium">{presupuesto.categories?.nombre}</p>
                <p className="text-slate-500 text-xs">Categoría seleccionada</p>
              </div>
            </div>
          )}

          {/* Monto límite */}
          <div>
            <label className="text-slate-300 text-sm font-medium block mb-2">
              Límite mensual
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">L</span>
              <input
                type="number"
                value={montoLimite}
                onChange={(e) => setMontoLimite(e.target.value)}
                placeholder="0.00"
                min="1"
                step="0.01"
                required
                className="w-full bg-slate-900/50 border border-slate-600 text-white placeholder-slate-500 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 transition-all font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-teal-800 text-white font-medium transition-all"
            >
              {loading ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Crear'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
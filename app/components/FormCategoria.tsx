'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  categoria?: any
  categoriaParent?: any
  tipo: 'gasto' | 'ingreso'
  onClose: () => void
  onSuccess: () => void
}

const ICONOS = [
  '🍔','🍕','🍜','☕','🥤','🛒','🚗','🚌','✈️','🏠','💡','💧',
  '📱','💻','🎮','🎬','🎵','📚','🏥','💊','👕','👟','💄','🐾',
  '💰','💳','📈','🏦','💸','🎁','🏋️','⚽','🌴','🎓','🔧','🧹',
  '🍺','🍷','🎂','🛍️','🚿','⚡','📦','🏷️','💼','🌐','🔑','🎯'
]

const COLORES = [
  '#0D9488','#3B82F6','#8B5CF6','#F59E0B','#EF4444',
  '#EC4899','#10B981','#F97316','#06B6D4','#84CC16',
  '#6366F1','#E11D48','#0EA5E9','#D97706','#7C3AED',
]

export default function FormCategoria({
  categoria, categoriaParent, tipo, onClose, onSuccess
}: Props) {
  const [nombre, setNombre] = useState(categoria?.nombre || '')
  const [icono, setIcono] = useState(categoria?.icono || '📦')
  const [color, setColor] = useState(categoria?.color || '#0D9488')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const esEdicion = !!categoria
  const esSubcategoria = !!categoriaParent

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (esEdicion) {
      const { error } = await supabase
        .from('categories')
        .update({ nombre, icono, color })
        .eq('id', categoria.id)
      if (error) { setError('Error al actualizar'); setLoading(false); return }
    } else {
      const { error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          nombre,
          icono,
          color,
          tipo: esSubcategoria ? categoriaParent.tipo : tipo,
          parent_id: esSubcategoria ? categoriaParent.id : null,
          es_sistema: false
        })
      if (error) { setError('Error al crear'); setLoading(false); return }
    }

    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {esEdicion ? 'Editar categoría' :
               esSubcategoria ? `Subcategoría de ${categoriaParent.nombre}` :
               'Nueva categoría'}
            </h2>
            {esSubcategoria && (
              <p className="text-slate-500 text-xs mt-0.5">
                {categoriaParent.icono} {categoriaParent.nombre}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Preview */}
          <div className="flex items-center justify-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: color + '30', border: `2px solid ${color}50` }}
            >
              {icono}
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="text-slate-300 text-sm font-medium block mb-2">
              Nombre
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Comida rápida, Uber, Netflix"
              required
              className="w-full bg-slate-900/50 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          {/* Selector de ícono */}
          <div>
            <label className="text-slate-300 text-sm font-medium block mb-2">
              Ícono
            </label>
            <div className="grid grid-cols-8 gap-2 max-h-36 overflow-y-auto bg-slate-900/50 rounded-xl p-3">
              {ICONOS.map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcono(i)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                    icono === i
                      ? 'bg-teal-500/20 ring-2 ring-teal-500'
                      : 'hover:bg-slate-700'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Selector de color */}
          <div>
            <label className="text-slate-300 text-sm font-medium block mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="grid grid-cols-2 gap-3">
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
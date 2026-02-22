'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import AppLayout from '../components/AppLayout'
import FormCategoria from '../components/FormCategoria'

export default function Categorias() {
  const router = useRouter()
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [categoriaEditar, setCategoriaEditar] = useState<any>(null)
  const [categoriaParent, setCategoriaParent] = useState<any>(null)
  const [filtroTipo, setFiltroTipo] = useState<'gasto' | 'ingreso'>('gasto')

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      cargarCategorias()
    }
    checkUser()
  }, [router])

  const cargarCategorias = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${user.id},es_sistema.eq.true`)
      .order('nombre')

    setCategorias(data || [])
    setLoading(false)
  }

  const handleEliminar = async (id: string) => {
    // Verificar si tiene subcategorías
    const tieneHijos = categorias.some(c => c.parent_id === id)
    if (tieneHijos) {
      alert('Esta categoría tiene subcategorías. Elimínalas primero.')
      return
    }
    if (!confirm('¿Eliminar esta categoría?')) return
    await supabase.from('categories').delete().eq('id', id)
    cargarCategorias()
  }

  // Categorías principales (sin parent)
  const principales = categorias.filter(
    c => !c.parent_id && c.tipo === filtroTipo
  )

  // Subcategorías de una categoría
  const subCategorias = (parentId: string) =>
    categorias.filter(c => c.parent_id === parentId)

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-teal-400 animate-pulse">Cargando...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Categorías</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Organiza tus transacciones con categorías y subcategorías personalizadas
          </p>
        </div>

        {/* Tabs Gasto / Ingreso */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 mb-6 w-fit">
          <button
            onClick={() => setFiltroTipo('gasto')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              filtroTipo === 'gasto'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            💸 Gastos
          </button>
          <button
            onClick={() => setFiltroTipo('ingreso')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              filtroTipo === 'ingreso'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            💰 Ingresos
          </button>
        </div>

        {/* Lista de categorías */}
        {principales.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <span className="text-5xl block mb-4">🏷️</span>
            <p className="text-slate-400">No hay categorías de {filtroTipo}s aún</p>
            <p className="text-slate-500 text-sm mt-1">
              Crea tu primera categoría con el botón +
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {principales.map(cat => (
              <div key={cat.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

                {/* Categoría principal */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: cat.color + '25' }}
                    >
                      {cat.icono || '📦'}
                    </div>
                    <div>
                      <p className="text-white font-medium">{cat.nombre}</p>
                      <p className="text-slate-500 text-xs">
                        {subCategorias(cat.id).length} subcategorías
                        {cat.es_sistema && ' · Sistema'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Agregar subcategoría */}
                    <button
                      onClick={() => {
                        setCategoriaParent(cat)
                        setCategoriaEditar(null)
                        setShowForm(true)
                      }}
                      className="text-xs text-teal-400 hover:text-teal-300 border border-teal-500/30 hover:border-teal-500/60 px-2 py-1 rounded-lg transition-all"
                    >
                      + Sub
                    </button>
                    <button
                      onClick={() => {
                        setCategoriaEditar(cat)
                        setCategoriaParent(null)
                        setShowForm(true)
                      }}
                      className="text-slate-500 hover:text-teal-400 transition-colors p-1"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleEliminar(cat.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Subcategorías */}
                {subCategorias(cat.id).length > 0 && (
                  <div className="border-t border-slate-800">
                    {subCategorias(cat.id).map((sub, idx) => (
                      <div
                        key={sub.id}
                        className={`flex items-center justify-between px-4 py-3 ${
                          idx < subCategorias(cat.id).length - 1
                            ? 'border-b border-slate-800/50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 ml-6">
                          <div className="w-1 h-1 bg-slate-600 rounded-full" />
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                            style={{ backgroundColor: sub.color + '25' }}
                          >
                            {sub.icono || '📦'}
                          </div>
                          <p className="text-slate-300 text-sm">{sub.nombre}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setCategoriaEditar(sub)
                              setCategoriaParent(null)
                              setShowForm(true)
                            }}
                            className="text-slate-500 hover:text-teal-400 transition-colors p-1 text-sm"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleEliminar(sub.id)}
                            className="text-slate-500 hover:text-red-400 transition-colors p-1 text-sm"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Botón flotante */}
      <button
        onClick={() => {
          setCategoriaEditar(null)
          setCategoriaParent(null)
          setShowForm(true)
        }}
        className="fixed bottom-24 lg:bottom-8 right-6 lg:right-8 w-14 h-14 bg-teal-500 hover:bg-teal-400 text-white rounded-full text-2xl shadow-lg shadow-teal-500/30 transition-all hover:scale-110 flex items-center justify-center z-40"
      >
        +
      </button>

      {showForm && (
        <FormCategoria
          categoria={categoriaEditar}
          categoriaParent={categoriaParent}
          tipo={filtroTipo}
          onClose={() => {
            setShowForm(false)
            setCategoriaEditar(null)
            setCategoriaParent(null)
          }}
          onSuccess={cargarCategorias}
        />
      )}
    </AppLayout>
  )
}
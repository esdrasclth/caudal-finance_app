'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      let { data: profile } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

      if (!profile) {
        const nombre = user.user_metadata?.nombre ||
          user.email?.split('@')[0] || 'Usuario'
        await supabase.from('profiles')
          .insert({ id: user.id, nombre, moneda_default: 'HNL' })
        const { data: np } = await supabase
          .from('profiles').select('*').eq('id', user.id).single()
        profile = np
      }

      setUsuario(profile)
      setLoading(false)
    }
    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3">
            💧
          </div>
          <p className="text-teal-400 animate-pulse text-sm">Cargando Caudal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar usuario={usuario} />
      {/* Contenido con margen para el sidebar en desktop */}
      <main className="lg:ml-64 pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  )
}
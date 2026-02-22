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
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Session encontrada:', !!session)
      console.log('Session data:', session?.user?.email)

      if (!session) { router.push('/login'); return }

      const user = session.user

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
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 text-2xl bg-teal-500 rounded-xl">
            💧
          </div>
          <p className="text-sm text-teal-400 animate-pulse">Cargando Caudal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar usuario={usuario} />
      {/* Contenido con margen para el sidebar en desktop */}
      <main className="pb-20 lg:ml-64 lg:pb-0">
        {children}
      </main>
    </div>
  )
}
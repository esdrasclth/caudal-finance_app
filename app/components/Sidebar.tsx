'use client'

import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import Notificaciones from './Notificaciones'

const NAV_ITEMS = [
  { href: '/dashboard', icono: '⊞', label: 'Dashboard' },
  { href: '/transacciones', icono: '↕', label: 'Transacciones' },
  { href: '/presupuesto', icono: '◎', label: 'Presupuestos' },
  { href: '/carteras', icono: '◈', label: 'Carteras' },
  { href: '/categorias', icono: '🏷', label: 'Categorías' },
  { href: '/exportar', icono: '📄', label: 'Exportar' },
  { href: '/deudas', icono: '🤝', label: 'Deudas' },
  { href: '/reportes', icono: '📊', label: 'Reportes' },
  { href: '/perfil', icono: '⚙️', label: 'Configuración' },
]

export default function Sidebar({ usuario }: { usuario: any }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="fixed top-0 left-0 flex-col hidden w-64 min-h-screen border-r lg:flex bg-slate-900 border-slate-800">

        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center text-lg bg-teal-500 w-9 h-9 rounded-xl">
              💧
            </div>
            <div>
              <p className="text-lg font-bold leading-none text-white">Caudal</p>
              <p className="text-xs text-slate-500">Finanzas Personales</p>
            </div>
          </div>
        </div>

        {/* Usuario */}
<div className="p-4 mx-3 mt-4 border bg-slate-800/50 rounded-xl border-slate-700">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-teal-400 rounded-lg bg-teal-500/20">
        {usuario?.nombre?.charAt(0).toUpperCase()}
      </div>
      <div className="overflow-hidden">
        <p className="text-sm font-medium text-white truncate">
          {usuario?.nombre}
        </p>
        <p className="text-xs text-slate-500">Cuenta activa</p>
      </div>
    </div>
    <Notificaciones />
  </div>
</div>

        {/* Navegación */}
        <nav className="flex-1 p-4 mt-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const activo = pathname === item.href
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activo
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span className="text-lg">{item.icono}</span>
                {item.label}
                {activo && (
                  <div className="ml-auto w-1.5 h-1.5 bg-teal-400 rounded-full" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Cerrar sesión */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full gap-3 px-4 py-3 text-sm transition-all rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/5"
          >
            <span>⎋</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Bottom Nav Mobile */}
<nav className="fixed bottom-0 left-0 right-0 z-50 border-t lg:hidden bg-slate-900/95 backdrop-blur border-slate-800">
  <div className="flex overflow-x-auto scrollbar-hide">
    {NAV_ITEMS.map(item => {
      const activo = pathname === item.href
      return (
        <button
          key={item.href}
          onClick={() => router.push(item.href)}
          className={`flex-shrink-0 flex flex-col items-center gap-1 py-3 px-3 text-xs transition-all ${
            activo ? 'text-teal-400' : 'text-slate-500'
          }`}
        >
          <span className="text-xl">{item.icono}</span>
          <span className="whitespace-nowrap">{item.label}</span>
        </button>
      )
    })}
  </div>
</nav>
    </>
  )
}
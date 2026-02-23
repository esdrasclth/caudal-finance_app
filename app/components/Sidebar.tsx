'use client'

import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import Notificaciones from './Notificaciones'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', icono: '⊞', label: 'Dashboard' },
  { href: '/transacciones', icono: 'svg', label: 'Movimientos' },
  { href: '/presupuesto', icono: '◎', label: 'Presupuestos' },
  { href: '/carteras', icono: '◈', label: 'Carteras' },
  { href: '/categorias', icono: '🏷', label: 'Categorías' },
  { href: '/exportar', icono: '📄', label: 'Exportar' },
  { href: '/deudas', icono: '🤝', label: 'Deudas' },
  { href: '/reportes', icono: '📊', label: 'Reportes' },
  { href: '/perfil', icono: '⚙️', label: 'Configuración' },
]

const IconoMovimientos = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 16V4m0 0L3 8m4-4l4 4" />
    <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
  </svg>
)

function MasMenu({ pathname, router }: { pathname: string, router: any }) {
  const [abierto, setAbierto] = useState(false)

  const MAS_ITEMS = [
    { href: '/categorias', icono: '🏷️', label: 'Categorías' },
    { href: '/deudas', icono: '🤝', label: 'Deudas' },
    { href: '/reportes', icono: '📊', label: 'Reportes' },
    { href: '/exportar', icono: '📄', label: 'Exportar' },
    { href: '/perfil', icono: '⚙️', label: 'Configuración' },
  ]

  const algunoActivo = MAS_ITEMS.some(i => i.href === pathname)

  return (
    <>
      {abierto && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setAbierto(false)} />
      )}

      {abierto && (
        <div className="fixed z-50 w-48 overflow-hidden border shadow-xl bottom-16 right-2 bg-slate-800 border-slate-700 rounded-2xl">
          {MAS_ITEMS.map(item => {
            const activo = pathname === item.href
            return (
              <button
                key={item.href}
                onClick={() => { router.push(item.href); setAbierto(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-slate-700/50 last:border-0 ${activo ? 'bg-teal-500/10 text-teal-400' : 'text-slate-300 hover:bg-slate-700/50'
                  }`}
              >
                <span className="text-lg">{item.icono}</span>
                {item.label}
                {activo && <div className="ml-auto w-1.5 h-1.5 bg-teal-400 rounded-full" />}
              </button>
            )
          })}
        </div>
      )}

      <button
        onClick={() => setAbierto(!abierto)}
        className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs transition-all ${algunoActivo || abierto ? 'text-teal-400' : 'text-slate-500'
          }`}
      >
        <span className={`text-xl transition-transform ${abierto ? 'rotate-45' : ''}`}>⊕</span>
        <span className="text-[10px]">Más</span>
        {algunoActivo && !abierto && <div className="w-1 h-1 bg-teal-400 rounded-full" />}
      </button>
    </>
  )
}

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
            <div className="flex items-center justify-center text-lg bg-teal-500 w-9 h-9 rounded-xl">💧</div>
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
                <p className="text-sm font-medium text-white truncate">{usuario?.nombre}</p>
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activo
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
              >
                <span className="text-lg">
                  {item.icono === 'svg' ? <IconoMovimientos /> : item.icono}
                </span>
                {item.label}
                {activo && <div className="ml-auto w-1.5 h-1.5 bg-teal-400 rounded-full" />}
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
        <div className="flex items-center">
          {[
            { href: '/dashboard', icono: '⊞', label: 'Inicio' },
            { href: '/transacciones', icono: 'svg', label: 'Movimientos' },
            { href: '/presupuesto', icono: '◎', label: 'Presupuesto' },
            { href: '/carteras', icono: '◈', label: 'Carteras' },
          ].map(item => {
            const activo = pathname === item.href
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs transition-all ${activo ? 'text-teal-400' : 'text-slate-500'
                  }`}
              >
                <span className={`${activo ? 'scale-110' : ''} transition-transform flex items-center justify-center`}>
                  {item.icono === 'svg' ? <IconoMovimientos /> : <span className="text-xl">{item.icono}</span>}
                </span>
                <span className="text-[10px]">{item.label}</span>
                {activo && <div className="w-1 h-1 bg-teal-400 rounded-full" />}
              </button>
            )
          })}
          <MasMenu pathname={pathname} router={router} />
        </div>
      </nav>
    </>
  )
}
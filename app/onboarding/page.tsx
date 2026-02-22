'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

const PASOS = [
  {
    icono: '💧',
    titulo: '¡Bienvenido a Caudal!',
    descripcion: 'Tu app de finanzas personales. Simple, rápida y diseñada para Centroamérica.',
    detalle: 'En menos de 2 minutos estarás listo para controlar tu dinero.',
    color: 'teal'
  },
  {
    icono: '◈',
    titulo: 'Crea tus carteras',
    descripcion: 'Agrega tus cuentas de banco, efectivo y tarjetas de crédito.',
    detalle: 'Caudal calcula tu saldo automáticamente en base a tus movimientos.',
    color: 'blue'
  },
  {
    icono: '↕',
    titulo: 'Registra tus movimientos',
    descripcion: 'Anota tus gastos e ingresos diarios en segundos.',
    detalle: 'Usa el botón + en cualquier pantalla para agregar una transacción rápidamente.',
    color: 'green'
  },
  {
    icono: '◎',
    titulo: 'Controla tus presupuestos',
    descripcion: 'Define cuánto quieres gastar por categoría cada mes.',
    detalle: 'Caudal te avisará cuando estés cerca del límite.',
    color: 'purple'
  },
  {
    icono: '📊',
    titulo: 'Analiza tus finanzas',
    descripcion: 'Reportes automáticos con gráficas y análisis de tus hábitos.',
    detalle: 'Descubre en qué gastas más y cómo mejorar tu ahorro.',
    color: 'yellow'
  },
  {
    icono: '🚀',
    titulo: '¡Todo listo!',
    descripcion: 'Estás a punto de tomar control de tus finanzas.',
    detalle: 'Empieza creando tu primera cartera.',
    color: 'teal'
  }
]

const COLORES: any = {
  teal: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30', btn: 'bg-teal-500 hover:bg-teal-400' },
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', btn: 'bg-blue-500 hover:bg-blue-400' },
  green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', btn: 'bg-green-500 hover:bg-green-400' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', btn: 'bg-purple-500 hover:bg-purple-400' },
  yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', btn: 'bg-yellow-500 hover:bg-yellow-400' },
}

export default function Onboarding() {
  const [paso, setPaso] = useState(0)
  const router = useRouter()
  const total = PASOS.length
  const actual = PASOS[paso]
  const color = COLORES[actual.color]

  const siguiente = async () => {
    if (paso < total - 1) {
      setPaso(paso + 1)
    } else {
      // Marcar onboarding como completado
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ onboarding_completado: true })
          .eq('id', user.id)
      }
      router.push('/carteras')
    }
  }

  const saltar = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ onboarding_completado: true })
        .eq('id', user.id)
    }
    router.push('/dashboard')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950">

      {/* Logo */}
      <div className="flex items-center gap-2 mb-12">
        <div className="flex items-center justify-center text-lg bg-teal-500 w-9 h-9 rounded-xl">
          💧
        </div>
        <span className="text-lg font-bold text-white">Caudal</span>
      </div>

      {/* Card principal */}
      <div className="w-full max-w-sm">

        {/* Icono */}
        <div className={`w-24 h-24 ${color.bg} border ${color.border} rounded-3xl flex items-center justify-center text-5xl mx-auto mb-8 transition-all duration-300`}>
          {actual.icono}
        </div>

        {/* Contenido */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-2xl font-bold text-white">
            {actual.titulo}
          </h1>
          <p className="mb-3 text-base text-slate-300">
            {actual.descripcion}
          </p>
          <p className="text-sm text-slate-500">
            {actual.detalle}
          </p>
        </div>

        {/* Indicadores de progreso */}
        <div className="flex justify-center gap-2 mb-8">
          {PASOS.map((_, i) => (
            <button
              key={i}
              onClick={() => setPaso(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === paso
                  ? `w-6 ${color.btn.split(' ')[0]}`
                  : i < paso
                  ? 'w-2 bg-slate-600'
                  : 'w-2 bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Botón siguiente */}
        <button
          onClick={siguiente}
          className={`w-full py-4 rounded-2xl text-white font-semibold text-base transition-all ${color.btn} mb-3`}
        >
          {paso === total - 1 ? '¡Empezar ahora! 🚀' : 'Siguiente →'}
        </button>

        {/* Saltar */}
        {paso < total - 1 && (
          <button
            onClick={saltar}
            className="w-full py-3 text-sm transition-colors text-slate-500 hover:text-slate-300"
          >
            Saltar introducción
          </button>
        )}

      </div>

      {/* Paso actual */}
      <p className="mt-8 text-xs text-slate-700">
        {paso + 1} de {total}
      </p>

    </div>
  )
}
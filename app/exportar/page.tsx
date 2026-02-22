'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import AppLayout from '../components/AppLayout'

export default function Exportar() {
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7))
  const [loadingExcel, setLoadingExcel] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id
  }

  const exportarExcel = async () => {
    setLoadingExcel(true)
    setMensaje('')
    const userId = await getUserId()
    if (!userId) return

    try {
      const url = `http://localhost:8000/exportar/excel?user_id=${userId}&mes=${mes}`
      const response = await fetch(url)

      if (!response.ok) {
        setMensaje('No hay transacciones para exportar')
        setLoadingExcel(false)
        return
      }

      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `Caudal_${mes}.xlsx`
      link.click()
      setMensaje('✅ Excel descargado exitosamente')
    } catch (error) {
      setMensaje('❌ Error: Verifica que el backend esté corriendo en puerto 8000')
    }
    setLoadingExcel(false)
  }

  const exportarPdf = async () => {
    setLoadingPdf(true)
    setMensaje('')
    const userId = await getUserId()
    if (!userId) return

    try {
      const url = `http://localhost:8000/exportar/pdf?user_id=${userId}&mes=${mes}`
      const response = await fetch(url)
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `Caudal_${mes}.pdf`
      link.click()
      setMensaje('✅ PDF descargado exitosamente')
    } catch (error) {
      setMensaje('❌ Error: Verifica que el backend esté corriendo en puerto 8000')
    }
    setLoadingPdf(false)
  }

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  const nombreMes = () => {
    const [año, m] = mes.split('-')
    return `${MESES[parseInt(m) - 1]} ${año}`
  }

  return (
    <AppLayout>
      <div className="max-w-2xl p-6 mx-auto lg:p-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Exportar datos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Descarga tus transacciones en Excel o PDF — gratis, sin límites
          </p>
        </div>

        {/* Selector de mes */}
        <div className="p-6 mb-6 border bg-slate-900 border-slate-800 rounded-2xl">
          <label className="block mb-3 text-sm font-medium text-slate-300">
            Selecciona el mes a exportar
          </label>
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="w-full px-4 py-3 text-white transition-colors border bg-slate-800 border-slate-700 rounded-xl focus:outline-none focus:border-teal-500"
          />
          <p className="mt-2 text-sm font-medium text-teal-400">
            📅 {nombreMes()}
          </p>
        </div>

        {/* Botones de exportar */}
        <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2">

          {/* Excel */}
          <button
            onClick={exportarExcel}
            disabled={loadingExcel}
            className="p-6 text-left transition-all border bg-slate-900 border-slate-800 hover:border-green-500/50 rounded-2xl group disabled:opacity-50"
          >
            <div className="flex items-center justify-center w-12 h-12 mb-4 text-2xl transition-colors bg-green-500/10 rounded-xl group-hover:bg-green-500/20">
              📊
            </div>
            <p className="mb-1 font-semibold text-white">Exportar Excel</p>
            <p className="text-xs text-slate-500">
              Archivo .xlsx con todas las transacciones y resumen del mes
            </p>
            <div className="flex items-center gap-2 mt-4 text-sm font-medium text-green-400">
              {loadingExcel ? (
                <span className="animate-pulse">Generando...</span>
              ) : (
                <span>Descargar .xlsx →</span>
              )}
            </div>
          </button>

          {/* PDF */}
          <button
            onClick={exportarPdf}
            disabled={loadingPdf}
            className="p-6 text-left transition-all border bg-slate-900 border-slate-800 hover:border-red-500/50 rounded-2xl group disabled:opacity-50"
          >
            <div className="flex items-center justify-center w-12 h-12 mb-4 text-2xl transition-colors bg-red-500/10 rounded-xl group-hover:bg-red-500/20">
              📄
            </div>
            <p className="mb-1 font-semibold text-white">Exportar PDF</p>
            <p className="text-xs text-slate-500">
              Reporte profesional con resumen y detalle de transacciones
            </p>
            <div className="flex items-center gap-2 mt-4 text-sm font-medium text-red-400">
              {loadingPdf ? (
                <span className="animate-pulse">Generando...</span>
              ) : (
                <span>Descargar .pdf →</span>
              )}
            </div>
          </button>

        </div>

        {/* Mensaje de estado */}
        {mensaje && (
          <div className={`rounded-xl px-4 py-3 text-sm ${
            mensaje.includes('✅')
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {mensaje}
          </div>
        )}

        {/* Nota */}
        <div className="p-4 mt-6 border bg-teal-500/5 border-teal-500/20 rounded-xl">
          <p className="mb-1 text-xs font-medium text-teal-400">💡 Nota</p>
          <p className="text-xs text-slate-400">
            El backend Python debe estar corriendo en <span className="font-mono text-white">localhost:8000</span> para que la exportación funcione. Ejecuta <span className="font-mono text-white">uvicorn main:app --reload</span> en la carpeta <span className="font-mono text-white">caudal-backend</span>.
          </p>
        </div>

      </div>
    </AppLayout>
  )
}
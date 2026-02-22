import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center">
      <div className="text-center px-6">

        {/* Logo */}
        <div className="mb-6">
          <span className="text-8xl">💧</span>
        </div>

        {/* Título */}
        <h1 className="text-6xl font-bold text-white mb-3">
          Caudal
        </h1>
        <p className="text-teal-300 text-xl mb-2">Finanzas Personales</p>
        <p className="text-slate-400 text-base mb-12 italic">
          Tu dinero, en flujo
        </p>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="bg-teal-500 hover:bg-teal-400 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 text-lg"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="border border-teal-500 hover:bg-teal-500/10 text-teal-300 font-semibold px-8 py-3 rounded-xl transition-all duration-200 text-lg"
          >
            Crear cuenta
          </Link>
        </div>

        {/* Stack */}
        <div className="mt-16 flex gap-3 justify-center flex-wrap">
          {['Next.js', 'Supabase', 'FastAPI'].map((tech) => (
            <span
              key={tech}
              className="text-xs text-slate-500 border border-slate-700 px-3 py-1 rounded-full"
            >
              {tech}
            </span>
          ))}
        </div>

      </div>
    </main>
  )
}
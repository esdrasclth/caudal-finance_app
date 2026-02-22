import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Caudal - Finanzas Personales',
  description: 'Tu dinero, en flujo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
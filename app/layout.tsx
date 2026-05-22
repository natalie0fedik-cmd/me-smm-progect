import type { Metadata } from 'next'
import { Unbounded, Space_Grotesk } from 'next/font/google'
import './globals.css'

const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-head',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Brand Dashboard',
  description: 'Персональний дашборд бренду',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${unbounded.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SMM Стратег — управління проєктами',
  description: 'Платформа для SMM-спеціалістів: стратегія, контент, аналітика та просування',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  )
}

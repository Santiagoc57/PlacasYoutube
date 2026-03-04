import type React from "react"
import "@/app/globals.css"
import { Lexend } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"

const lexend = Lexend({ subsets: ["latin"] })

export const metadata = {
  title: "Generador de Portadas para YouTube",
  description: "Aplicación para generar portadas de partidos de baloncesto para YouTube",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={lexend.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

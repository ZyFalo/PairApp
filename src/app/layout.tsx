import type { Metadata, Viewport } from "next"
import { DM_Sans, Fraunces } from "next/font/google"
import "./globals.css"

/**
 * Fraunces para lo íntimo: serif variable con ejes de suavidad (SOFT) y de
 * irregularidad orgánica (WONK). Se lee como algo escrito, no impreso por
 * una máquina — que es justo lo que pide §8.2.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--fuente-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
})

/** DM Sans para la interfaz: geométrica y cálida, con más carácter que las de sistema. */
const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--fuente-dm-sans",
})

export const metadata: Metadata = {
  title: "PairApp",
  description: "Para decir lo que normalmente se calla.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "PairApp" },
}

export const viewport: Viewport = {
  // La barra del navegador acompaña al fondo, de día y de noche
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f2ea" },
    { media: "(prefers-color-scheme: dark)", color: "#17130f" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

/** Envoltorio de toda la app. */
export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}

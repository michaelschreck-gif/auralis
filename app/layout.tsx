import type { Metadata } from "next"
import { Inter, Fraunces, Manrope } from "next/font/google"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

// Schrift der Tool-Oberfläche (Dashboard, Settings) – die Webseite nutzt weiter Fraunces/Inter.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal"],
})

export const metadata: Metadata = {
  title: "Halo — AI Visibility Monitoring",
  description: "Understand how AI systems perceive your personal brand.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}

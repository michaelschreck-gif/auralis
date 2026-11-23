import type { Metadata } from "next"
import { headers } from "next/headers"
import { isLocale } from "@/lib/i18n/site"
import { Inter, Manrope } from "next/font/google"
import localFont from "next/font/local"
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

// Fraunces wird lokal ausgeliefert (variable Schrift, normal + kursiv, Achsen wght + opsz).
// Grund: Der Google-Fonts-Download beim Vercel-Build scheiterte sporadisch, seit auch die Kursive geladen wird.
// Lizenz: SIL Open Font License, siehe app/fonts/Fraunces-OFL.txt.
const fraunces = localFont({
  variable: "--font-fraunces",
  display: "swap",
  src: [
    { path: "./fonts/fraunces-latin-standard-normal.woff2", style: "normal", weight: "100 900" },
    { path: "./fonts/fraunces-latin-standard-italic.woff2", style: "italic", weight: "100 900" },
  ],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://digital-halo.de"),
  title: "Halo — AI Visibility Monitoring",
  description: "Understand how AI systems perceive your personal brand.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Gesetzt von proxy.ts (/en, /fr bzw. ?lang= auf Login/Registrierung); sonst Deutsch.
  const h = (await headers()).get("x-halo-lang")
  const lang = h && isLocale(h) ? h : "de"
  return (
    <html lang={lang} className={`${inter.variable} ${fraunces.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}

"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { Locale } from "@/lib/i18n/site"
import { de } from "./dict/de"
import { en } from "./dict/en"
import { fr } from "./dict/fr"
import type { SiteDict } from "./dict/types"

export const SITE_DICTS: Record<Locale, SiteDict> = { de, en, fr }

const DictContext = createContext<SiteDict>(de)

export function SiteDictProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <DictContext.Provider value={SITE_DICTS[locale]}>{children}</DictContext.Provider>
}

/** Texte der Startseite in der aktuellen Sprache. */
export function useT(): SiteDict {
  return useContext(DictContext)
}

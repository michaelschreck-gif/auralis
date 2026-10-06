// lib/auralis/errors.ts
// Übersetzt technische Fehler (Anbieter-API, Guthaben, Limits) in Texte, die
// Kunden sehen dürfen. Details bleiben in Logs und im Job-Eintrag.
// Reine Funktion, keine Imports.

export function publicErrorMessage(raw: string | null | undefined): string {
  const msg = (raw ?? "").toLowerCase()
  if (!msg) return "Die Messung ist fehlgeschlagen. Bitte versuche es später erneut."

  if (/credit|billing|insufficient|quota|no credits|payment/.test(msg)) {
    return "Die Messung ist gerade vorübergehend nicht verfügbar. Wir kümmern uns darum — bitte versuche es später erneut."
  }
  if (/429|rate.?limit|too many requests|overloaded|529/.test(msg)) {
    return "Die KI-Anbieter sind gerade stark ausgelastet. Bitte versuche es in ein paar Minuten erneut."
  }
  if (/api key|unauthori[sz]ed|401|403|missing/.test(msg)) {
    return "Die Messung ist gerade nicht eingerichtet. Bitte melde dich beim Support."
  }
  if (/timeout|timed out|zeitüberschreitung|no complete measurement round/.test(msg)) {
    return "Die Messung hat zu lange gedauert. Bitte versuche es erneut."
  }
  return "Die Messung ist fehlgeschlagen. Bitte versuche es später erneut."
}

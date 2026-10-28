import { jsonError } from "@/lib/api-auth"

// Die Wettbewerber-Endpunkte wurden entfernt (Halo bewertet keine Dritten mehr).
// 410 Gone statt 404, damit bestehende Integrationen eine klare Meldung bekommen.
function gone() {
  return jsonError(
    "Die Wettbewerber-Endpunkte wurden entfernt. Halo vergleicht keine Personen mehr miteinander.",
    "ENDPOINT_REMOVED",
    410,
  )
}

export const GET = gone
export const POST = gone
export const DELETE = gone

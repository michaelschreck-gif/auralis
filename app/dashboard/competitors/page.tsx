import { redirect } from "next/navigation"

// Die Wettbewerber-Funktion wurde durch „Impulse“ ersetzt (Personen, die die KI
// zu den eigenen Themen nennt — ohne Ranking und ohne Scores für Dritte).
export default function CompetitorsRedirect() {
  redirect("/dashboard/impulse")
}

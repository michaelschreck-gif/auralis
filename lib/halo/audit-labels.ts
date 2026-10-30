/** Lesbare Namen der Admin-Aktionen im audit_log. */
export const AUDIT_LABELS: Record<string, string> = {
  "user.admin.grant": "Admin-Recht gegeben",
  "user.admin.revoke": "Admin-Recht entzogen",
  "user.ban": "Nutzer gesperrt",
  "user.unban": "Nutzer entsperrt",
  "user.delete": "Nutzer gelöscht",
  "user.invite": "Nutzer eingeladen",
  "user.invite.resend": "Einladung erneut gesendet",
  "user.password_reset": "Passwort-Mail gesendet",
  "users.export": "Nutzerliste exportiert",
  "account.delete": "Konto gelöscht",
  "account.rename": "Konto umbenannt",
  "person.measure": "Messung gestartet",
  "gold.sample.add": "Prüfset ergänzt",
  "brief.test": "Test-Wochenbrief gesendet",
}

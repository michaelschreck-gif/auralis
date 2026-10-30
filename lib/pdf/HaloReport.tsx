/**
 * PDF-Report einer Person: Halo Score, drei Säulen, Verlauf, Themen,
 * Google-Kurzbild und offene Maßnahmen. @react-pdf/renderer (Node-Runtime,
 * kein Headless-Browser); gerendert von /api/persons/[id]/pdf.
 */

import { Circle, Document, Line, Page, Polyline, StyleSheet, Svg, Text, View } from "@react-pdf/renderer"
import type { HaloScore, HistoryPoint } from "@/lib/halo/score"

export type HaloReportProps = {
  personName: string
  context: string | null
  halo: HaloScore
  trend: number | null
  history: HistoryPoint[]
  topics: { name: string; ai: number | null; delta: number | null }[]
  google: { aboutYou: number; total: number; knowledgePanel: boolean; aiOverview: boolean } | null
  actions: { title: string; impact: string | null }[]
  generatedAt: Date
}

const C = {
  ink: "#0E1916",
  body: "#3A3632",
  muted: "#9A9089",
  accent: "#FA5935",
  bg: "#FAF8F3",
  border: "#E9E1D3",
  good: "#1F6B3A",
  bad: "#C8431F",
}

const s = StyleSheet.create({
  page: { padding: 44, paddingBottom: 60, fontSize: 10, fontFamily: "Helvetica", color: C.body },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 20 },
  brand: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.ink },
  meta: { fontSize: 8, color: C.muted },
  eyebrow: { fontSize: 8, color: C.accent, fontFamily: "Helvetica-Bold", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  h1: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.ink },
  sub: { fontSize: 10, color: C.muted, marginTop: 2 },
  h2: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.ink, marginTop: 18, marginBottom: 8 },
  scoreRow: { flexDirection: "row", alignItems: "center", marginTop: 16, padding: 14, borderWidth: 1, borderColor: C.border, borderRadius: 8 },
  scoreValue: { fontSize: 40, fontFamily: "Helvetica-Bold", color: C.ink, marginRight: 16 },
  band: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.ink },
  small: { fontSize: 8, color: C.muted, marginTop: 2 },
  pillar: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 10, marginRight: 8 },
  pillarLabel: { fontSize: 7, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 },
  pillarValue: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.ink, marginTop: 3 },
  barTrack: { height: 3, backgroundColor: C.border, borderRadius: 2, marginTop: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderTopWidth: 1, borderTopColor: C.border },
  footer: { position: "absolute", bottom: 26, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: C.muted, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8 },
})

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })
}

function History({ points }: { points: HistoryPoint[] }) {
  if (points.length < 2) {
    return <Text style={s.small}>Der Verlauf erscheint, sobald an zwei Tagen gemessen wurde.</Text>
  }
  const W = 500, H = 110, P = 20
  const t0 = new Date(points[0].date).getTime()
  const span = new Date(points[points.length - 1].date).getTime() - t0 || 1
  const x = (d: string) => P + ((new Date(d).getTime() - t0) / span) * (W - 2 * P)
  const y = (v: number) => H - P - (v / 100) * (H - 2 * P)
  return (
    <View>
      <Svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        {[0, 25, 50, 75, 100].map(v => (
          <Line key={v} x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke="#F0EAE0" strokeWidth={0.6} />
        ))}
        <Polyline points={points.map(p => `${x(p.date).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ")} stroke={C.accent} strokeWidth={1.5} fill="none" />
        {points.map((p, i) => (
          <Circle key={i} cx={x(p.date)} cy={y(p.score)} r={2} fill="white" stroke={C.accent} strokeWidth={1} />
        ))}
      </Svg>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={s.small}>{fmtDate(points[0].date)}</Text>
        <Text style={s.small}>{fmtDate(points[points.length - 1].date)}</Text>
      </View>
    </View>
  )
}

function delta(v: number | null) {
  if (v === null || v === 0) return null
  // Ohne Pfeile: die Standardschrift (Helvetica) kennt ▲/▼ nicht.
  return <Text style={{ color: v > 0 ? C.good : C.bad }}>{v > 0 ? `+${v}` : `−${Math.abs(v)}`}</Text>
}

export function HaloReport(p: HaloReportProps) {
  const { halo } = p
  return (
    <Document title={`Halo Report – ${p.personName}`} author="Halo">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brand}>DigitalHalo</Text>
          <Text style={s.meta}>Halo Report · {fmtDate(p.generatedAt)}</Text>
        </View>

        <Text style={s.eyebrow}>Halo Score</Text>
        <Text style={s.h1}>{p.personName}</Text>
        {p.context && <Text style={s.sub}>{p.context}</Text>}

        <View style={s.scoreRow}>
          <Text style={s.scoreValue}>{halo.score ?? "–"}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.band}>
              {halo.band?.label ?? "Noch nicht gemessen"} {delta(p.trend)}
            </Text>
            {halo.measuredAt && (
              <Text style={s.small}>
                Gemessen am {fmtDate(halo.measuredAt)}
                {halo.modelsTotal > 0 && ` · ${halo.modelsOk} von ${halo.modelsTotal} KI-Modellen haben geantwortet`}
              </Text>
            )}
            {halo.coverage < 1 && halo.score !== null && (
              <Text style={s.small}>Nicht gemessene Säulen zählen nicht mit; ihr Gewicht wird auf die gemessenen verteilt.</Text>
            )}
          </View>
        </View>

        <View style={{ flexDirection: "row", marginTop: 12 }}>
          {halo.pillars.map((pl, i) => (
            <View key={pl.key} style={[s.pillar, i === halo.pillars.length - 1 ? { marginRight: 0 } : {}]}>
              <Text style={s.pillarLabel}>{pl.label} · {Math.round(pl.weight * 100)} %</Text>
              <Text style={s.pillarValue}>{pl.value ?? "–"}</Text>
              {pl.value === null ? (
                <Text style={s.small}>nicht gemessen</Text>
              ) : (
                <View style={s.barTrack}>
                  <View style={{ width: `${pl.value}%`, height: 3, backgroundColor: C.accent, borderRadius: 2 }} />
                </View>
              )}
            </View>
          ))}
        </View>

        <Text style={s.h2}>Verlauf</Text>
        <History points={p.history} />

        <Text style={s.h2}>Themen – KI-Sichtbarkeit</Text>
        {p.topics.length === 0 ? (
          <Text style={s.small}>Keine aktiven Themen.</Text>
        ) : (
          p.topics.map(t => (
            <View key={t.name} style={s.row}>
              <Text style={{ color: C.ink }}>{t.name}</Text>
              <Text>
                {t.ai === null ? "noch nicht gemessen" : `${t.ai}`} {delta(t.delta)}
              </Text>
            </View>
          ))
        )}

        {p.google && (
          <>
            <Text style={s.h2}>Google – was man findet, wenn man dich googelt</Text>
            <View style={s.row}>
              <Text>Treffer über dich (erste 10 bei der Suche nach deinem Namen)</Text>
              <Text style={{ color: C.ink }}>{p.google.aboutYou} von {p.google.total}</Text>
            </View>
            <View style={s.row}>
              <Text>Knowledge Panel</Text>
              <Text style={{ color: C.ink }}>{p.google.knowledgePanel ? "ja" : "nein"}</Text>
            </View>
            <View style={s.row}>
              <Text>Genannt in Googles KI-Übersicht</Text>
              <Text style={{ color: C.ink }}>{p.google.aiOverview ? "ja" : "nein"}</Text>
            </View>
          </>
        )}

        {p.actions.length > 0 && (
          <>
            <Text style={s.h2}>Nächste Schritte</Text>
            {p.actions.map((a, i) => (
              <View key={i} style={s.row}>
                <Text style={{ color: C.ink, flex: 1 }}>{i + 1}. {a.title}</Text>
                {a.impact && <Text style={s.small}>{a.impact}</Text>}
              </View>
            ))}
          </>
        )}

        <View style={s.footer} fixed>
          <Text>DigitalHalo · digital-halo.de · Werte aus echten Antworten von KI-Systemen und Google-Suchen</Text>
          <Text render={({ pageNumber, totalPages }) => `Seite ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

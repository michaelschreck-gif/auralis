/**
 * PDF-Report-Komponente für die Auralis-Sichtbarkeits-Analyse (Sprint 16).
 *
 * Verwendet @react-pdf/renderer (kein Headless-Browser, läuft in Node-Runtime).
 * Wird vom Route-Handler unter /api/reports/[reportId]/pdf gerendert und als
 * application/pdf zurückgegeben.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Rect,
  Polyline,
  Circle,
  Line,
} from "@react-pdf/renderer"
import type { MasterScores } from "@/lib/auralis/master-scores"

export type HistoryPoint = { date: string; score: number }

export type AuralisReportProps = {
  userName: string
  reportCreatedAt: string
  masters: MasterScores
  mentionRate: number
  averagePosition: number | null
  topics: string[]
  history: HistoryPoint[]
  recommendations?: { title: string; impact: string; category: string }[]
  competitors?: { name: string; score: number | null }[]
}

const COLORS = {
  ink:       "#0f172a",
  body:      "#475569",
  muted:     "#94a3b8",
  primary:   "#4F6EF7",
  geo:       "#378ADD",
  thought:   "#7F77DD",
  authority: "#1D9E75",
  positive:  "#10b981",
  warning:   "#f59e0b",
  bgLight:   "#f8f9fb",
  border:    "#e5e7eb",
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: COLORS.body,
  },
  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 24,
  },
  brandBlock: { flexDirection: "row", alignItems: "center" },
  brandSquare: {
    width: 22,
    height: 22,
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  brandSquareText: { color: "white", fontSize: 12, fontFamily: "Helvetica-Bold" },
  brandName: { color: COLORS.ink, fontSize: 14, fontFamily: "Helvetica-Bold" },
  headerMeta: { fontSize: 9, color: COLORS.muted },
  // Section
  sectionEyebrow: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  h1: { fontSize: 20, color: COLORS.ink, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  h2: { fontSize: 14, color: COLORS.ink, fontFamily: "Helvetica-Bold", marginBottom: 8, marginTop: 14 },
  // KPIs
  kpiRow: { flexDirection: "row", marginTop: 14, marginBottom: 18 },
  kpiCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
  },
  kpiLabel: { fontSize: 7, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  kpiValue: { fontSize: 22, fontFamily: "Helvetica-Bold", color: COLORS.ink },
  kpiUnit: { fontSize: 9, color: COLORS.muted, marginLeft: 2 },
  kpiBand: { fontSize: 9, marginTop: 3, color: COLORS.body },
  bar: { height: 3, backgroundColor: COLORS.border, borderRadius: 2, marginTop: 6 },
  // Topic chips
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  chip: {
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 5,
    marginBottom: 5,
    fontSize: 9,
    color: COLORS.body,
  },
  // Recommendation list
  recoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  recoIndex: { width: 18, fontSize: 9, color: COLORS.muted, fontFamily: "Helvetica-Bold" },
  recoTitle: { flex: 1, fontSize: 10, color: COLORS.ink },
  recoBadge: {
    fontSize: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "Helvetica-Bold",
  },
  // Competitor list
  compRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  compName: { flex: 1, fontSize: 10, color: COLORS.ink },
  compScore: { fontSize: 11, fontFamily: "Helvetica-Bold", color: COLORS.primary, width: 50, textAlign: "right" },
  // Footer
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    fontSize: 8,
    color: COLORS.muted,
  },
})

function HistoryChart({ points }: { points: HistoryPoint[] }) {
  if (points.length < 2) {
    return (
      <View style={{ height: 80, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 9, color: COLORS.muted }}>
          Noch kein Score-Verlauf verfügbar.
        </Text>
      </View>
    )
  }
  const W = 460
  const H = 110
  const PAD = 24
  const minT = new Date(points[0].date).getTime()
  const maxT = new Date(points[points.length - 1].date).getTime() || minT + 1
  const span = maxT - minT || 1
  const xOf = (d: string) => PAD + ((new Date(d).getTime() - minT) / span) * (W - 2 * PAD)
  const yOf = (s: number) => H - PAD - (s / 100) * (H - 2 * PAD)
  const polyPoints = points.map(p => `${xOf(p.date).toFixed(1)},${yOf(p.score).toFixed(1)}`).join(" ")
  return (
    <View style={{ marginTop: 6 }}>
      <Svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => (
          <Line
            key={v}
            x1={PAD}
            x2={W - PAD}
            y1={yOf(v)}
            y2={yOf(v)}
            stroke="#f1f5f9"
            strokeWidth={0.6}
          />
        ))}
        <Polyline
          points={polyPoints}
          stroke={COLORS.primary}
          strokeWidth={1.5}
          fill="none"
        />
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={xOf(p.date)}
            cy={yOf(p.score)}
            r={2}
            fill="white"
            stroke={COLORS.primary}
            strokeWidth={1}
          />
        ))}
      </Svg>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
        <Text style={{ fontSize: 7, color: COLORS.muted }}>
          {new Date(points[0].date).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
        </Text>
        <Text style={{ fontSize: 7, color: COLORS.muted }}>
          {new Date(points[points.length - 1].date).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "short",
          })}
        </Text>
      </View>
    </View>
  )
}

function impactColor(impact: string): { bg: string; color: string } {
  const i = impact.toLowerCase()
  if (i.includes("high") || i.includes("hohe")) return { bg: "#d1fae5", color: "#065f46" }
  if (i.includes("medium") || i.includes("mittlere")) return { bg: "#fef3c7", color: "#92400e" }
  return { bg: "#f1f5f9", color: "#475569" }
}

export function AuralisReport(props: AuralisReportProps) {
  const { userName, reportCreatedAt, masters, mentionRate, averagePosition, topics, history, recommendations, competitors } = props
  const dateStr = new Date(reportCreatedAt).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.brandBlock}>
            <View style={styles.brandSquare}>
              <Text style={styles.brandSquareText}>A</Text>
            </View>
            <Text style={styles.brandName}>Auralis</Text>
          </View>
          <Text style={styles.headerMeta}>Sichtbarkeits-Report · {dateStr}</Text>
        </View>

        {/* Headline */}
        <Text style={styles.sectionEyebrow}>KI-Sichtbarkeits-Report</Text>
        <Text style={styles.h1}>{userName}</Text>

        {/* KPI row */}
        <View style={styles.kpiRow}>
          {[
            { l: "Aura Score™",        v: masters.aura.value,               c: COLORS.primary,   b: masters.aura.band.label },
            { l: "GEO",                v: masters.geo.value,                c: COLORS.geo,       b: masters.geo.band.label },
            { l: "Thought Leadership", v: masters.thoughtLeadership.value,  c: COLORS.thought,   b: masters.thoughtLeadership.band.label },
            { l: "Digitale Autorität", v: masters.digitalAuthority.value,   c: COLORS.authority, b: masters.digitalAuthority.band.label },
          ].map((k, i, a) => (
            <View
              key={k.l}
              style={[styles.kpiCard, i === a.length - 1 ? { marginRight: 0 } : {}]}
            >
              <Text style={styles.kpiLabel}>{k.l}</Text>
              <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                <Text style={[styles.kpiValue, { color: k.c }]}>{k.v}</Text>
                <Text style={styles.kpiUnit}>/100</Text>
              </View>
              <Text style={styles.kpiBand}>{k.b}</Text>
              <View style={styles.bar}>
                <View
                  style={{
                    width: `${k.v}%`,
                    height: 3,
                    backgroundColor: k.c,
                    borderRadius: 2,
                  }}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Quick stats */}
        <View style={{ flexDirection: "row", marginBottom: 6 }}>
          <View style={{ marginRight: 24 }}>
            <Text style={styles.kpiLabel}>Erwähnungsrate</Text>
            <Text style={{ fontSize: 12, color: COLORS.ink, fontFamily: "Helvetica-Bold" }}>{mentionRate}%</Text>
          </View>
          <View style={{ marginRight: 24 }}>
            <Text style={styles.kpiLabel}>Durchschnittliche Position</Text>
            <Text style={{ fontSize: 12, color: COLORS.ink, fontFamily: "Helvetica-Bold" }}>
              {averagePosition !== null ? `Ø ${averagePosition.toFixed(1)}` : "—"}
            </Text>
          </View>
          <View>
            <Text style={styles.kpiLabel}>Stärkste Dimension</Text>
            <Text style={{ fontSize: 12, color: COLORS.ink, fontFamily: "Helvetica-Bold" }}>
              {masters.strongest.shortLabel} ({masters.strongest.value})
            </Text>
          </View>
        </View>

        {/* Topics */}
        <Text style={styles.h2}>Überwachte Themen</Text>
        <View style={styles.chipRow}>
          {topics.length === 0 ? (
            <Text style={{ fontSize: 9, color: COLORS.muted }}>Keine Themen hinterlegt.</Text>
          ) : (
            topics.map(t => (
              <Text key={t} style={styles.chip}>
                {t}
              </Text>
            ))
          )}
        </View>

        {/* History */}
        <Text style={styles.h2}>Score-Verlauf (30 Tage)</Text>
        <HistoryChart points={history} />

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <>
            <Text style={styles.h2}>Top-Empfehlungen</Text>
            <View>
              {recommendations.slice(0, 5).map((r, i) => {
                const c = impactColor(r.impact)
                return (
                  <View key={i} style={styles.recoItem}>
                    <Text style={styles.recoIndex}>{i + 1}.</Text>
                    <Text style={styles.recoTitle}>{r.title}</Text>
                    <Text
                      style={[
                        styles.recoBadge,
                        { backgroundColor: c.bg, color: c.color },
                      ]}
                    >
                      {r.impact}
                    </Text>
                  </View>
                )
              })}
            </View>
          </>
        )}

        {/* Competitors */}
        {competitors && competitors.length > 0 && (
          <>
            <Text style={styles.h2}>Wettbewerber</Text>
            <View>
              {competitors.slice(0, 5).map((c, i) => (
                <View key={i} style={styles.compRow}>
                  <Text style={styles.compName}>{c.name}</Text>
                  <Text style={styles.compScore}>{c.score != null ? `${c.score}/100` : "—"}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Auralis · Operated by Entrenous · auralis-plum.vercel.app</Text>
          <Text render={({ pageNumber, totalPages }) => `Seite ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

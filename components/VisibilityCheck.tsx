"use client"

import { useState } from "react"
import DashboardShell from "@/components/DashboardShell"
import type { VisibilityReport, QueryResult } from "@/lib/auralis/analyzer"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Schedule {
  id: string
  name: string
  query: string
  language: string
}

export interface VisibilityCheckProps {
  userName?: string
  defaultLanguage?: "de" | "en"
  schedules?: Schedule[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hue(s: number) {
  return s >= 70 ? "#3dcfb0" : s >= 45 ? "#d4a84b" : "#e05555"
}

function scoreLabel(s: number) {
  return s >= 70 ? "Strong Visibility" : s >= 45 ? "Moderate" : "Low Visibility"
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const PlusIcon = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)

const EyeIcon = (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/>
  </svg>
)

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const c = hue(score)
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}/>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-light" style={{ color: c }}>{score}</span>
      </div>
    </div>
  )
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, background: color }}/>
    </div>
  )
}

function ResultCard({ result }: { result: QueryResult }) {
  const [open, setOpen] = useState(false)
  const { signal } = result
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex gap-3">
        <div className="mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs"
          style={{ background: signal.mentioned ? "rgba(61,207,176,0.12)" : "rgba(224,85,85,0.10)",
                   color: signal.mentioned ? "#3dcfb0" : "#e05555" }}>
          {signal.mentioned ? "✓" : "–"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs text-neutral-500 uppercase tracking-wider">
              {result.queryType.replace("_", " ")}
            </span>
            {signal.mentioned && signal.position && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                #{signal.position}
              </span>
            )}
            {signal.sentiment !== "not_mentioned" && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: signal.sentiment === "positive" ? "rgba(61,207,176,0.10)" : "rgba(255,255,255,0.05)",
                         color: signal.sentiment === "positive" ? "#3dcfb0" : "#7a7e8e" }}>
                {signal.sentiment}
              </span>
            )}
          </div>
          {signal.contextSnippet
            ? <p className="text-sm text-neutral-400 leading-relaxed line-clamp-2">…{signal.contextSnippet}…</p>
            : <p className="text-sm text-neutral-600 italic">Not mentioned in this response.</p>
          }
          <button onClick={() => setOpen(v => !v)}
            className="mt-2 text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
            {open ? "Hide details ↑" : "See full query ↓"}
          </button>
          {open && (
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-xs text-neutral-600 uppercase tracking-wider mb-1">Query sent to AI</p>
                <p className="text-xs text-neutral-400 bg-white/[0.03] rounded-lg p-3 leading-relaxed">{result.prompt}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 uppercase tracking-wider mb-1">AI response</p>
                <p className="text-xs text-neutral-400 bg-white/[0.03] rounded-lg p-3 leading-relaxed whitespace-pre-wrap">{result.rawResponse}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, unit, color, sub }: {
  label: string; value: string; unit: string; color: string; sub?: string
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
      <p className="text-xs text-neutral-600 uppercase tracking-wider mb-3">{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-light leading-none" style={{ color }}>{value}</span>
        <span className="text-xs text-neutral-600 mb-0.5">{unit}</span>
      </div>
      {sub && <p className="text-xs mt-1.5" style={{ color }}>{sub}</p>}
    </div>
  )
}

function AiModelRow({ name, score, locked }: { name: string; score: number | null; locked: boolean }) {
  const initial = name[0] ?? "?"
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
        <span className="text-xs text-neutral-500">{initial}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-neutral-400">{name}</span>
          {locked
            ? <span className="text-xs text-neutral-700">🔒 Pro</span>
            : score != null
              ? <span className="text-xs" style={{ color: hue(score) }}>{score}</span>
              : null
          }
        </div>
        <div className="h-0.5 bg-white/[0.05] rounded-full overflow-hidden">
          {!locked && score != null && (
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${score}%`, background: hue(score) }}/>
          )}
        </div>
      </div>
    </div>
  )
}

function ReportView({ report }: { report: VisibilityReport }) {
  return (
    <div className="space-y-6 pb-8">
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Aura Score" value={String(report.overallScore)} unit="/ 100"
          color={hue(report.overallScore)} sub={scoreLabel(report.overallScore)}/>
        <MetricCard label="Mention Rate" value={`${report.mentionRate}%`} unit="of queries" color="#3dcfb0"/>
        <MetricCard label="Avg Position" value={report.averagePosition ? `#${report.averagePosition}` : "—"} unit="in lists" color="#7b6ef6"/>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <p className="text-xs text-neutral-600 uppercase tracking-wider mb-5">Score Breakdown</p>
        <div className="grid grid-cols-2 gap-5">
          {[
            { label: "Presence",        value: report.scoreBreakdown.presenceScore,       color: "#3dcfb0" },
            { label: "Position",        value: report.scoreBreakdown.positionScore,       color: "#7b6ef6" },
            { label: "Context Quality", value: report.scoreBreakdown.contextScore,        color: "#d4a84b" },
            { label: "Topic Alignment", value: report.scoreBreakdown.topicAlignmentScore, color: "#3dcfb0" },
          ].map(({ label, value, color }) => (
            <div key={label} className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500">{label}</span>
                <span style={{ color }}>{value}</span>
              </div>
              <Bar value={value} color={color}/>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <p className="text-xs text-neutral-600 uppercase tracking-wider mb-4">AI Model Breakdown</p>
        <div className="space-y-4">
          <AiModelRow name="Claude Sonnet" score={report.overallScore} locked={false}/>
          <AiModelRow name="GPT-4o"        score={null}                locked/>
          <AiModelRow name="Perplexity"    score={null}                locked/>
          <AiModelRow name="Gemini Pro"    score={null}                locked/>
        </div>
      </div>

      {(report.dominantTopics.length > 0 || report.narratives.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {report.dominantTopics.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-xs text-neutral-600 uppercase tracking-wider mb-3">Topics AI associates with you</p>
              <div className="flex flex-wrap gap-2">
                {report.dominantTopics.map(t => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-full border border-teal-500/20 bg-teal-500/5 text-teal-400">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {report.narratives.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-xs text-neutral-600 uppercase tracking-wider mb-3">How AI describes you</p>
              <div className="space-y-1.5">
                {report.narratives.slice(0, 4).map((n, i) => (
                  <p key={i} className="text-xs text-neutral-400 leading-relaxed">"{n}"</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <p className="text-xs text-neutral-600 uppercase tracking-wider mb-3">
          Query Results ({report.queryResults.length})
        </p>
        <div className="space-y-3">
          {report.queryResults.map(r => (
            <ResultCard key={r.queryId} result={r}/>
          ))}
        </div>
      </div>

      <p className="text-xs text-neutral-700 text-center">
        Analyzed {new Date(report.queriedAt).toLocaleString()}
      </p>
    </div>
  )
}

// ─── Topics panel ─────────────────────────────────────────────────────────────

function TopicsPanel({
  schedules,
  reports,
  selectedId,
  showCustom,
  onSelect,
  onToggleCustom,
}: {
  schedules: Schedule[]
  reports: Record<string, VisibilityReport>
  selectedId: string | null
  showCustom: boolean
  onSelect: (id: string) => void
  onToggleCustom: () => void
}) {
  return (
    <>
      {schedules.length === 0 && (
        <p className="text-xs text-neutral-600 text-center mt-10 px-4">
          No tracked topics yet.
        </p>
      )}
      {schedules.map(s => {
        const score = reports[s.id]?.overallScore
        const active = !showCustom && selectedId === s.id
        return (
          <button key={s.id}
            onClick={() => onSelect(s.id)}
            className={`w-full text-left px-4 py-4 border-b border-white/[0.04] transition-all ${
              active ? "bg-amber-400/[0.04]" : "hover:bg-white/[0.02]"
            }`}
            style={{ borderLeft: `2px solid ${active ? "#d4a84b" : "transparent"}` }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-white truncate pr-2 leading-tight">{s.query}</span>
              {score != null && (
                <span className="text-xs font-light flex-shrink-0" style={{ color: hue(score) }}>
                  {score}
                </span>
              )}
            </div>
            <div className="h-0.5 bg-white/[0.05] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: score != null ? `${score}%` : "0%",
                         background: score != null ? hue(score) : "transparent" }}/>
            </div>
            <p className="text-xs text-neutral-600 mt-1.5 truncate">
              {s.language === "en" ? "🇬🇧" : "🇩🇪"} {s.name}
            </p>
          </button>
        )
      })}

      <div className="p-3">
        <button onClick={onToggleCustom}
          className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-colors ${
            showCustom ? "bg-amber-400/10 text-amber-400" : "text-neutral-600 hover:text-neutral-400 hover:bg-white/[0.03]"
          }`}>
          {PlusIcon}
          Custom check
        </button>
      </div>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VisibilityCheck({
  userName = "",
  defaultLanguage = "de",
  schedules = [],
}: VisibilityCheckProps) {
  const [selectedId, setSelectedId] = useState<string | null>(schedules[0]?.id ?? null)
  const [reports, setReports] = useState<Record<string, VisibilityReport>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCustom, setShowCustom] = useState(schedules.length === 0)
  const [customName, setCustomName] = useState(userName)
  const [customTopic, setCustomTopic] = useState("")
  const [customLang, setCustomLang] = useState<"de" | "en">(defaultLanguage)

  const selected = schedules.find(s => s.id === selectedId) ?? null
  const scheduleReport = selectedId ? (reports[selectedId] ?? null) : null
  const customReport = reports["__custom"] ?? null
  const activeReport = showCustom ? customReport : scheduleReport

  async function callApi(name: string, topic: string, lang: "de" | "en", key: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/visibility-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, topics: [topic], language: lang }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Request failed")
      setReports(prev => ({ ...prev, [key]: data as VisibilityReport }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  function runScheduleCheck() {
    if (!selected || !userName) return
    const lang = selected.language === "en" ? "en" : "de"
    callApi(userName, selected.query, lang, selected.id)
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customName.trim() || !customTopic.trim()) return
    callApi(customName, customTopic, customLang, "__custom")
  }

  const panel = (
    <TopicsPanel
      schedules={schedules}
      reports={reports}
      selectedId={selectedId}
      showCustom={showCustom}
      onSelect={id => { setSelectedId(id); setShowCustom(false) }}
      onToggleCustom={() => setShowCustom(v => !v)}
    />
  )

  return (
    <DashboardShell
      userName={userName}
      panelHeader="Topics"
      panelCount={`${schedules.length} ${schedules.length === 1 ? "topic" : "topics"}`}
      panelContent={panel}
    >
      {/* Custom check */}
      {showCustom && (
        <div className="p-8 max-w-xl">
          <h2 className="text-lg font-light text-white mb-1">Custom Check</h2>
          <p className="text-neutral-500 text-sm mb-6">
            One-time analysis — not saved as a tracked topic.
          </p>
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-500 uppercase tracking-wider">Full Name</label>
                <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                  placeholder="Max Mustermann"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 transition-colors"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-500 uppercase tracking-wider">Topic</label>
                <input type="text" value={customTopic} onChange={e => setCustomTopic(e.target.value)}
                  placeholder="AI Strategie"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 transition-colors"/>
              </div>
            </div>
            <div className="flex gap-2">
              {(["de", "en"] as const).map(lang => (
                <button key={lang} type="button" onClick={() => setCustomLang(lang)}
                  className="px-4 py-2 rounded-lg text-sm border transition-colors"
                  style={{ borderColor: customLang === lang ? "rgba(212,168,75,0.4)" : "rgba(255,255,255,0.08)",
                           background: customLang === lang ? "rgba(212,168,75,0.08)" : "transparent",
                           color: customLang === lang ? "#d4a84b" : "#7a7e8e" }}>
                  {lang === "de" ? "🇩🇪 DE" : "🇬🇧 EN"}
                </button>
              ))}
            </div>
            <button type="submit"
              disabled={loading || !customName.trim() || !customTopic.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{ background: "rgba(212,168,75,0.12)", border: "1px solid rgba(212,168,75,0.25)", color: "#d4a84b" }}>
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border border-amber-400/40 border-t-amber-400 rounded-full animate-spin"/>
                  Analyzing…
                </>
              ) : "Run Visibility Check →"}
            </button>
          </form>
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
          {customReport && <div className="mt-8"><ReportView report={customReport}/></div>}
        </div>
      )}

      {/* Schedule view */}
      {!showCustom && selected && (
        <div className="p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-xl font-light text-white">{selected.query}</h2>
              <p className="text-neutral-500 text-sm mt-0.5">{selected.name}</p>
            </div>
            <button onClick={runScheduleCheck}
              disabled={loading || !userName}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 flex-shrink-0 ml-4"
              style={{ background: "rgba(212,168,75,0.12)", border: "1px solid rgba(212,168,75,0.25)", color: "#d4a84b" }}>
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border border-amber-400/40 border-t-amber-400 rounded-full animate-spin"/>
                  Analyzing…
                </>
              ) : "Run Visibility Check →"}
            </button>
          </div>

          {error && <p className="mb-6 text-sm text-red-400">{error}</p>}

          {!scheduleReport && !loading && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5 text-neutral-600">
                {EyeIcon}
              </div>
              <p className="text-neutral-500 text-sm max-w-xs leading-relaxed">
                Hit <span style={{ color: "#d4a84b" }}>Run Visibility Check</span> to see how AI systems
                perceive <strong className="text-neutral-300">{userName || "you"}</strong> for{" "}
                <strong className="text-neutral-300">{selected.query}</strong>.
              </p>
            </div>
          )}

          {scheduleReport && <ReportView report={scheduleReport}/>}
        </div>
      )}

      {!showCustom && !selected && (
        <div className="flex items-center justify-center h-full">
          <p className="text-neutral-600 text-sm">Select a topic to analyze.</p>
        </div>
      )}
    </DashboardShell>
  )
}

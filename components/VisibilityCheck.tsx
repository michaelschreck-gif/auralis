// components/VisibilityCheck.tsx
// The main UI component for the Auralis AI Visibility Check.
// Handles form input, API call, loading state, and result display.
// Uses Tailwind CSS — drop into any Next.js app with Tailwind configured.

"use client"

import { useState } from "react"
import type { VisibilityReport, QueryResult } from "@/lib/auralis/analyzer"

// ─── Sub-components ────────────────────────────────────────────────────────

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 70 ? "#3dcfb0"
    : score >= 45 ? "#d4a84b"
    : "#e05555"

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-light" style={{ color, lineHeight: 1 }}>{score}</span>
        <span className="text-xs text-neutral-500 mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  )
}

function QueryResultCard({ result }: { result: QueryResult }) {
  const [expanded, setExpanded] = useState(false)
  const { signal } = result

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-start gap-3">
        {/* Mention indicator */}
        <div
          className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs"
          style={{
            background: signal.mentioned ? "rgba(61,207,176,0.12)" : "rgba(224,85,85,0.10)",
            color: signal.mentioned ? "#3dcfb0" : "#e05555",
          }}
        >
          {signal.mentioned ? "✓" : "–"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-neutral-500 uppercase tracking-wider">
              {result.queryType.replace("_", " ")}
            </span>
            {signal.mentioned && signal.position && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                Position #{signal.position}
              </span>
            )}
            {signal.sentiment !== "not_mentioned" && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: signal.sentiment === "positive" ? "rgba(61,207,176,0.10)" : "rgba(255,255,255,0.05)",
                  color: signal.sentiment === "positive" ? "#3dcfb0" : "#7a7e8e",
                }}
              >
                {signal.sentiment}
              </span>
            )}
          </div>

          {/* Context snippet */}
          {signal.contextSnippet && (
            <p className="text-sm text-neutral-400 leading-relaxed line-clamp-2">
              …{signal.contextSnippet}…
            </p>
          )}
          {!signal.mentioned && (
            <p className="text-sm text-neutral-600 italic">Not mentioned in this response.</p>
          )}

          {/* Expand to see full prompt + response */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="mt-2 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            {expanded ? "Hide details ↑" : "See full query ↓"}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-xs text-neutral-600 uppercase tracking-wider mb-1">Query sent to AI</p>
                <p className="text-xs text-neutral-400 bg-white/[0.03] rounded-lg p-3 leading-relaxed">
                  {result.prompt}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 uppercase tracking-wider mb-1">AI response</p>
                <p className="text-xs text-neutral-400 bg-white/[0.03] rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                  {result.rawResponse}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function VisibilityCheck() {
  const [name, setName] = useState("")
  const [topicsInput, setTopicsInput] = useState("")
  const [language, setLanguage] = useState<"de" | "en">("de")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<VisibilityReport | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !topicsInput.trim()) return

    setLoading(true)
    setError(null)
    setReport(null)

    try {
      const topics = topicsInput
        .split(",")
        .map(t => t.trim())
        .filter(Boolean)

      const res = await fetch("/api/visibility-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), topics, language }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Request failed")
      }

      const data: VisibilityReport = await res.json()
      setReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = (s: number) =>
    s >= 70 ? "#3dcfb0" : s >= 45 ? "#d4a84b" : "#e05555"

  const scoreLabel = (s: number) =>
    s >= 70 ? "Strong Visibility" : s >= 45 ? "Moderate Visibility" : "Low Visibility"

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white font-sans p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-5 h-5 rounded-full bg-gradient-radial from-amber-400 to-amber-800" />
            <span className="text-amber-400 font-light tracking-widest text-sm uppercase">
              Auralis
            </span>
          </div>
          <h1 className="text-2xl font-light text-white mt-3 leading-tight">
            AI Visibility Check
          </h1>
          <p className="text-neutral-500 text-sm mt-2 leading-relaxed">
            Analyze how AI systems perceive a person — are they mentioned, in what context,
            and for which topics?
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-500 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Max Körner"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-neutral-500 uppercase tracking-wider">
              Topics / Areas of Expertise
            </label>
            <input
              type="text"
              value={topicsInput}
              onChange={e => setTopicsInput(e.target.value)}
              placeholder="e.g. AI Strategy, Digital Transformation, Leadership"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 transition-colors"
            />
            <p className="text-xs text-neutral-600">Separate multiple topics with commas</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="space-y-1.5 flex-1">
              <label className="text-xs text-neutral-500 uppercase tracking-wider">Language</label>
              <div className="flex gap-2">
                {(["de", "en"] as const).map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className="px-4 py-2 rounded-lg text-sm border transition-colors"
                    style={{
                      borderColor: language === lang ? "rgba(212,168,75,0.4)" : "rgba(255,255,255,0.08)",
                      background: language === lang ? "rgba(212,168,75,0.08)" : "transparent",
                      color: language === lang ? "#d4a84b" : "#7a7e8e",
                    }}
                  >
                    {lang === "de" ? "🇩🇪 Deutsch" : "🇬🇧 English"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim() || !topicsInput.trim()}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "rgba(212,168,75,0.12)",
              border: "1px solid rgba(212,168,75,0.25)",
              color: "#d4a84b",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
                Analyzing AI visibility…
              </span>
            ) : (
              "Run Visibility Check →"
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {report && (
          <div className="space-y-6">

            {/* Score overview */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="flex items-center gap-6">
                <ScoreRing score={report.overallScore} size={96} />
                <div className="flex-1">
                  <div className="text-lg font-light" style={{ color: scoreColor(report.overallScore) }}>
                    {scoreLabel(report.overallScore)}
                  </div>
                  <div className="text-neutral-500 text-sm mt-1">
                    {report.personName} · {report.topics.join(", ")}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
                    <span>
                      Mentioned in{" "}
                      <strong className="text-white">{report.mentionRate}%</strong> of queries
                    </span>
                    {report.averagePosition && (
                      <span>
                        Avg. position{" "}
                        <strong className="text-white">#{report.averagePosition}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Score breakdown */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                {[
                  { label: "Presence", value: report.scoreBreakdown.presenceScore, color: "#3dcfb0" },
                  { label: "Position", value: report.scoreBreakdown.positionScore, color: "#7b6ef6" },
                  { label: "Context quality", value: report.scoreBreakdown.contextScore, color: "#d4a84b" },
                  { label: "Topic alignment", value: report.scoreBreakdown.topicAlignmentScore, color: "#3dcfb0" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">{label}</span>
                      <span style={{ color }}>{value}</span>
                    </div>
                    <ScoreBar value={value} color={color} />
                  </div>
                ))}
              </div>
            </div>

            {/* Topics & Narratives */}
            {(report.dominantTopics.length > 0 || report.narratives.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {report.dominantTopics.length > 0 && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="text-xs text-neutral-600 uppercase tracking-wider mb-3">
                      Topics AI associates with you
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {report.dominantTopics.map(topic => (
                        <span
                          key={topic}
                          className="text-xs px-2.5 py-1 rounded-full border border-teal-500/20 bg-teal-500/5 text-teal-400"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {report.narratives.length > 0 && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="text-xs text-neutral-600 uppercase tracking-wider mb-3">
                      How AI describes you
                    </p>
                    <div className="space-y-1.5">
                      {report.narratives.slice(0, 4).map((n, i) => (
                        <p key={i} className="text-xs text-neutral-400 leading-relaxed">
                          "{n}"
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Individual query results */}
            <div>
              <p className="text-xs text-neutral-600 uppercase tracking-wider mb-3">
                Query results ({report.queryResults.length} queries)
              </p>
              <div className="space-y-3">
                {report.queryResults.map(result => (
                  <QueryResultCard key={result.queryId} result={result} />
                ))}
              </div>
            </div>

            {/* Timestamp */}
            <p className="text-xs text-neutral-700 text-center">
              Analysis completed {new Date(report.queriedAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

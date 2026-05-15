import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/DashboardShell"

const MODELS = [
  {
    name: "Claude Sonnet",
    slug: "claude",
    description: "Anthropic's reasoning model — powers your Auralis checks.",
    active: true,
    color: "#4F6EF7",
  },
  {
    name: "GPT-4o",
    slug: "gpt4o",
    description: "OpenAI's flagship model, widely used in enterprise search.",
    active: false,
    color: "#10b981",
  },
  {
    name: "Perplexity",
    slug: "perplexity",
    description: "Real-time web-connected AI used for brand discovery.",
    active: false,
    color: "#8b5cf6",
  },
  {
    name: "Gemini Pro",
    slug: "gemini",
    description: "Google's multimodal model, powering AI Overviews in Search.",
    active: false,
    color: "#ef4444",
  },
  {
    name: "Google AI Overview",
    slug: "aio",
    description: "Generative search results shown above Google SERP.",
    active: false,
    color: "#f59e0b",
  },
]

function ModelCard({
  name,
  description,
  active,
  color,
  score,
}: {
  name: string
  description: string
  active: boolean
  color: string
  score: number | null
}) {
  const initial = name[0] ?? "?"
  return (
    <div className={`rounded-xl border p-6 transition-all ${
      active
        ? "border-gray-100 bg-white shadow-sm"
        : "border-gray-100 bg-[#f8f9fb] opacity-70"
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold"
            style={{ background: `${color}18`, color }}
          >
            {initial}
          </div>
          <div>
            <p className="text-sm text-[#0f172a] font-medium">{name}</p>
            <p className="text-xs text-[#64748b] mt-0.5">{description}</p>
          </div>
        </div>
        {active ? (
          <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 border border-green-100 font-medium">
            Active
          </span>
        ) : (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-[#94a3b8]">
            🔒 Pro
          </span>
        )}
      </div>

      {active && (
        <div className="space-y-3 mt-5 pt-5 border-t border-gray-100">
          {score != null ? (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748b]">Visibility Score</span>
                <span className="font-semibold" style={{ color }}>{score} / 100</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${score}%`, background: color }}
                />
              </div>
              <p className="text-xs text-[#94a3b8]">
                Based on your most recent visibility check.
              </p>
            </>
          ) : (
            <p className="text-xs text-[#94a3b8]">
              Run a visibility check on the{" "}
              <a href="/dashboard" className="text-[#4F6EF7] hover:underline font-medium">
                overview page
              </a>{" "}
              to see your score here.
            </p>
          )}
        </div>
      )}

      {!active && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-[#94a3b8]">
            Available on Solo & Executive plans.
          </p>
        </div>
      )}
    </div>
  )
}

export default async function AiVisibilityPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, { data: latestReport }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("visibility_reports")
      .select("visibility_score")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  ])

  const score = latestReport?.visibility_score ?? null

  const panel = (
    <div className="py-2">
      {MODELS.map(m => (
        <div key={m.slug}
          className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 hover:bg-gray-50 transition-colors">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold"
            style={{ background: `${m.color}18`, color: m.color }}
          >
            {m.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#0f172a] truncate font-medium">{m.name}</p>
          </div>
          {m.active
            ? <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"/>
            : <span className="text-xs text-[#94a3b8]">🔒</span>
          }
        </div>
      ))}
    </div>
  )

  return (
    <DashboardShell
      userName={profile?.full_name ?? ""}
      panelHeader="AI Models"
      panelContent={panel}
    >
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-[#0f172a]">AI Visibility Breakdown</h1>
          <p className="text-[#64748b] text-sm mt-1">
            How each AI system perceives your personal brand.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {MODELS.map(m => (
            <ModelCard
              key={m.slug}
              name={m.name}
              description={m.description}
              active={m.active}
              color={m.color}
              score={m.active ? (typeof score === "number" ? Math.round(score) : null) : null}
            />
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-gray-100 bg-[#f8f9fb] p-5">
          <p className="text-xs text-[#64748b] uppercase tracking-wider mb-2 font-medium">What this means</p>
          <p className="text-sm text-[#64748b] leading-relaxed">
            AI Visibility measures how prominently your name and expertise appear in responses from AI systems.
            A higher score means AI assistants are more likely to recommend you when someone asks about your topics.
            Pro plans unlock multi-model tracking across GPT-4o, Perplexity, Gemini, and Google AI Overviews.
          </p>
        </div>
      </div>
    </DashboardShell>
  )
}

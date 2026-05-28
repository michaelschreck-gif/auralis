/**
 * GET /badge/[slug]
 *
 * Liefert einen SVG-Embeddable-Badge für ein Public Profile.
 * Beispiel: <img src="https://auralis-plum.vercel.app/badge/elon-musk" alt="Aura Score" />
 *
 * Caching: 5 Minuten Edge-Cache + 1h stale-while-revalidate, damit Embedding
 * auf fremden Websites nicht jedes Mal die DB hämmert.
 */

import { createSupabaseServiceClient } from "@/lib/supabase/client"
import { computeMasterScores } from "@/lib/auralis/master-scores"
import type { VisibilityReport } from "@/lib/auralis/analyzer"

export const dynamic = "force-dynamic"

const BADGE_W = 280
const BADGE_H = 100

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function renderBadge(opts: {
  name: string
  score: number | null
  band: string | null
}): string {
  const { name, score, band } = opts
  const safeName = escapeXml(name.slice(0, 30))
  const safeBand = band ? escapeXml(band) : ""
  const scoreText = score != null ? String(score) : "—"
  const scoreColor = score == null
    ? "#94a3b8"
    : score >= 76 ? "#0F6E56"
    : score >= 51 ? "#0C447C"
    : score >= 26 ? "#854F0B"
    : "#791F1F"

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BADGE_W}" height="${BADGE_H}" viewBox="0 0 ${BADGE_W} ${BADGE_H}" role="img" aria-label="Aura Score for ${safeName}">
  <style>
    .label { font: 600 9px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; letter-spacing: 0.05em; text-transform: uppercase; fill: #94a3b8; }
    .name  { font: 700 14px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; fill: #0f172a; }
    .score { font: 800 32px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; fill: ${scoreColor}; }
    .out   { font: 500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; fill: #94a3b8; }
    .band  { font: 600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; fill: #475569; }
    .brand { font: 700 9px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; letter-spacing: 0.05em; text-transform: uppercase; fill: #4F6EF7; }
  </style>

  <!-- Card -->
  <rect x="0.5" y="0.5" width="${BADGE_W - 1}" height="${BADGE_H - 1}" rx="12" fill="#ffffff" stroke="#e5e7eb"/>

  <!-- Brand block (left) -->
  <rect x="12" y="14" width="36" height="36" rx="8" fill="#4F6EF7"/>
  <text x="30" y="38" text-anchor="middle" fill="white" font-family="-apple-system, system-ui, sans-serif" font-weight="800" font-size="18">A</text>

  <!-- Labels -->
  <text x="58" y="24" class="label">Aura Score™</text>
  <text x="58" y="42" class="name">${safeName}</text>

  <!-- Score (right) -->
  <text x="${BADGE_W - 18}" y="44" text-anchor="end" class="score">${scoreText}</text>
  <text x="${BADGE_W - 18}" y="60" text-anchor="end" class="out">/ 100</text>

  <!-- Bottom strip with band + brand -->
  <line x1="14" y1="74" x2="${BADGE_W - 14}" y2="74" stroke="#f1f5f9" stroke-width="1"/>
  <text x="14" y="90" class="band">${safeBand || "—"}</text>
  <text x="${BADGE_W - 14}" y="90" text-anchor="end" class="brand">powered by auralis</text>
</svg>`
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params

  const supabase = createSupabaseServiceClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, public_slug, public_profile_enabled")
    .eq("public_slug", slug)
    .eq("public_profile_enabled", true)
    .maybeSingle()

  if (!profile) {
    // Fallback: leeres Badge mit "Profil nicht gefunden"
    const svg = renderBadge({ name: "Profil nicht gefunden", score: null, band: null })
    return new Response(svg, {
      status: 404,
      headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
    })
  }

  const { data: report } = await supabase
    .from("visibility_reports")
    .select("raw_data")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const rawReport = report?.raw_data as unknown as VisibilityReport | null
  const masters = rawReport ? computeMasterScores(rawReport) : null

  const svg = renderBadge({
    name: profile.full_name ?? slug,
    score: masters?.aura.value ?? null,
    band: masters?.aura.band.label ?? null,
  })

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // Edge-Cache 5 min, dann stale-while-revalidate 1h.
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  })
}

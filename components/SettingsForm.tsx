"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

interface Schedule {
  id: string
  name: string
  query: string
  frequency: string
  language: string
}

interface Props {
  userId: string
  initialName: string
  initialEmail: string
  initialLanguage: string
  initialTimezone: string
  plan: string
  schedules: Schedule[]
}

export default function SettingsForm({
  userId,
  initialName,
  initialEmail,
  initialLanguage,
  initialTimezone,
  plan,
  schedules: initialSchedules,
}: Props) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [language, setLanguage] = useState(initialLanguage)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [schedules, setSchedules] = useState(initialSchedules)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  async function saveProfile() {
    setSaving(true)
    setSaved(false)
    setError(null)
    const supabase = createSupabaseBrowserClient()
    const { error: err } = await supabase
      .from("profiles")
      .update({ full_name: name.trim(), language: language as "de" | "en" })
      .eq("id", userId)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function updateScheduleFrequency(id: string, frequency: string) {
    const supabase = createSupabaseBrowserClient()
    await supabase.from("monitoring_schedules").update({ frequency: frequency as "daily" | "weekly" | "monthly" }).eq("id", id)
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, frequency } : s))
  }

  async function deleteSchedule(id: string) {
    setDeletingId(id)
    const supabase = createSupabaseBrowserClient()
    await supabase.from("monitoring_schedules").delete().eq("id", id)
    setSchedules(prev => prev.filter(s => s.id !== id))
    setDeletingId(null)
  }

  async function deleteAccount() {
    const supabase = createSupabaseBrowserClient()
    await supabase.from("profiles").delete().eq("id", userId)
    await supabase.auth.signOut()
    router.push("/")
  }

  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 transition-colors"
  const labelCls = "text-xs text-neutral-500 uppercase tracking-wider"

  return (
    <div className="p-8 max-w-2xl space-y-10">

      {/* Profile */}
      <section className="space-y-5">
        <div>
          <h2 className="text-base font-medium text-white">Profile</h2>
          <p className="text-xs text-neutral-600 mt-0.5">How AI sees you in visibility checks.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className={labelCls}>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls}/>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Email</label>
            <input type="email" value={initialEmail} disabled
              className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-neutral-600 cursor-not-allowed"/>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>AI Query Language</label>
            <div className="flex gap-2">
              {(["de", "en"] as const).map(lang => (
                <button key={lang} onClick={() => setLanguage(lang)}
                  className="px-4 py-2.5 rounded-xl text-sm border transition-colors"
                  style={{
                    borderColor: language === lang ? "rgba(212,168,75,0.4)" : "rgba(255,255,255,0.08)",
                    background: language === lang ? "rgba(212,168,75,0.08)" : "transparent",
                    color: language === lang ? "#d4a84b" : "#7a7e8e",
                  }}>
                  {lang === "de" ? "🇩🇪 Deutsch" : "🇬🇧 English"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button onClick={saveProfile} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
          style={{ background: "rgba(212,168,75,0.12)", border: "1px solid rgba(212,168,75,0.25)", color: "#d4a84b" }}>
          {saving ? (
            <><span className="w-3.5 h-3.5 border border-amber-400/40 border-t-amber-400 rounded-full animate-spin"/> Saving…</>
          ) : saved ? "Saved ✓" : "Save Changes"}
        </button>
      </section>

      {/* Monitoring Topics */}
      <section className="space-y-5">
        <div>
          <h2 className="text-base font-medium text-white">Monitoring Topics</h2>
          <p className="text-xs text-neutral-600 mt-0.5">Topics tracked by scheduled AI visibility checks.</p>
        </div>

        {schedules.length === 0 && (
          <p className="text-sm text-neutral-600">No active topics. Go to the dashboard to add one.</p>
        )}

        <div className="space-y-3">
          {schedules.map(s => (
            <div key={s.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{s.query}</p>
                <p className="text-xs text-neutral-600 mt-0.5">{s.name}</p>
              </div>
              <select
                value={s.frequency}
                onChange={e => updateScheduleFrequency(s.id, e.target.value)}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-neutral-300 focus:outline-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <button
                onClick={() => deleteSchedule(s.id)}
                disabled={deletingId === s.id}
                className="text-xs text-neutral-700 hover:text-red-400 transition-colors disabled:opacity-40"
              >
                {deletingId === s.id ? "…" : "Remove"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Plan */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-medium text-white">Plan</h2>
          <p className="text-xs text-neutral-600 mt-0.5">Your current subscription.</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-white capitalize">{plan}</p>
            <p className="text-xs text-neutral-600 mt-0.5">
              {plan === "free" ? "1 visibility check per month" : "Unlimited checks"}
            </p>
          </div>
          {plan === "free" && (
            <span className="text-xs px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400">
              Upgrade →
            </span>
          )}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-medium text-red-400">Danger Zone</h2>
          <p className="text-xs text-neutral-600 mt-0.5">Irreversible actions.</p>
        </div>

        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)}
            className="px-5 py-2.5 rounded-xl text-sm border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-colors">
            Delete Account
          </button>
        ) : (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3">
            <p className="text-sm text-red-300">
              This will permanently delete your profile, all topics, and all visibility reports. Are you sure?
            </p>
            <div className="flex gap-3">
              <button onClick={deleteAccount}
                className="px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                Yes, delete everything
              </button>
              <button onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

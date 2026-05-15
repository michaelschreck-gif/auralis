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
    await supabase
      .from("monitoring_schedules")
      .update({ frequency: frequency as "daily" | "weekly" | "monthly" })
      .eq("id", id)
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

  const inputCls = "w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#4F6EF7] focus:ring-1 focus:ring-[#4F6EF7]/20 transition-colors"
  const labelCls = "text-xs text-[#64748b] font-medium uppercase tracking-wider"

  return (
    <div className="p-8 max-w-2xl space-y-10">

      {/* Profile */}
      <section id="profile" className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-[#0f172a]">Profile</h2>
          <p className="text-xs text-[#64748b] mt-0.5">How AI sees you in visibility checks.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className={labelCls}>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls}/>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Email</label>
            <input
              type="email"
              value={initialEmail}
              disabled
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-[#94a3b8] cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>AI Query Language</label>
            <div className="flex gap-2">
              {(["de", "en"] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className="px-4 py-2.5 rounded-lg text-sm border font-medium transition-colors"
                  style={{
                    borderColor: language === lang ? "#4F6EF7" : "#e2e8f0",
                    background: language === lang ? "#eff2ff" : "white",
                    color: language === lang ? "#4F6EF7" : "#64748b",
                  }}
                >
                  {lang === "de" ? "🇩🇪 Deutsch" : "🇬🇧 English"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={saveProfile}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[#4F6EF7] hover:bg-blue-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <span className="w-3.5 h-3.5 border border-blue-300 border-t-white rounded-full animate-spin"/>
              Saving…
            </>
          ) : saved ? "Saved ✓" : "Save Changes"}
        </button>
      </section>

      {/* Monitoring Topics */}
      <section id="topics" className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-[#0f172a]">Monitoring Topics</h2>
          <p className="text-xs text-[#64748b] mt-0.5">Topics tracked by scheduled AI visibility checks.</p>
        </div>

        {schedules.length === 0 && (
          <p className="text-sm text-[#64748b]">No active topics. Go to the dashboard to add one.</p>
        )}

        <div className="space-y-3">
          {schedules.map(s => (
            <div key={s.id} className="rounded-xl border border-gray-100 bg-white shadow-sm p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#0f172a] font-medium truncate">{s.query}</p>
                <p className="text-xs text-[#94a3b8] mt-0.5">{s.name}</p>
              </div>
              <select
                value={s.frequency}
                onChange={e => updateScheduleFrequency(s.id, e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-[#64748b] focus:outline-none focus:border-[#4F6EF7] transition-colors"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <button
                onClick={() => deleteSchedule(s.id)}
                disabled={deletingId === s.id}
                className="text-xs text-[#94a3b8] hover:text-red-500 transition-colors disabled:opacity-40"
              >
                {deletingId === s.id ? "…" : "Remove"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Plan */}
      <section id="plan" className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[#0f172a]">Plan</h2>
          <p className="text-xs text-[#64748b] mt-0.5">Your current subscription.</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-[#0f172a] font-medium capitalize">{plan}</p>
            <p className="text-xs text-[#64748b] mt-0.5">
              {plan === "free" ? "1 visibility check per month" : "Unlimited checks"}
            </p>
          </div>
          {plan === "free" && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-[#4F6EF7] border border-blue-100 font-medium cursor-pointer hover:bg-blue-100 transition-colors">
              Upgrade →
            </span>
          )}
        </div>
      </section>

      {/* Danger Zone */}
      <section id="danger" className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-red-500">Danger Zone</h2>
          <p className="text-xs text-[#64748b] mt-0.5">Irreversible actions.</p>
        </div>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-5 py-2.5 rounded-lg text-sm border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition-colors font-medium"
          >
            Delete Account
          </button>
        ) : (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 space-y-3">
            <p className="text-sm text-red-600">
              This will permanently delete your profile, all topics, and all visibility reports. Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={deleteAccount}
                className="px-4 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
              >
                Yes, delete everything
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm text-[#64748b] hover:text-[#0f172a] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

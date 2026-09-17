import Link from "next/link"
import WaitlistForm from "@/components/WaitlistForm"

export const metadata = {
  title: "Warteliste – Halo",
  description: "Trage dich auf die Warteliste ein und erfahre als Erster, wenn Halo für dich verfügbar ist.",
}

export default function WartelistePage() {
  return (
    <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full rounded-3xl border border-[#E9E1D3] bg-white shadow-[0_24px_70px_-30px_rgba(14,25,22,0.18)] overflow-hidden grid grid-cols-1 md:grid-cols-2">

        {/* Left: brand panel */}
        <div className="hidden md:flex flex-col justify-between bg-[#0E1916] p-11">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/brand/combinationmark-white.svg" alt="Halo" className="h-[22px] w-auto" />
          </Link>

          <div className="mt-10">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#F7B49B]">
              AI Visibility Monitoring
            </span>
            <h3 className="font-[family-name:var(--font-display)] font-normal text-white text-[26px] leading-snug mt-3 max-w-[19rem]">
              Sieh dich, wie KI dich sieht.
            </h3>
            <p className="text-[#FBCBB8] text-sm leading-relaxed mt-3 max-w-[19rem]">
              Dein Halo Score™ zeigt in Echtzeit, wie ChatGPT, Claude, Perplexity und Gemini
              über dich sprechen.
            </p>

            <div className="mt-7 rounded-2xl bg-white/[0.04] border border-white/10 p-4">
              <div className="flex items-center gap-3.5">
                <svg width="64" height="64" viewBox="0 0 96 96" className="flex-shrink-0" role="img" aria-label="Halo Score 75">
                  <circle cx="48" cy="48" r="38" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="10" />
                  <circle cx="48" cy="48" r="38" fill="none" stroke="#F7B49B" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray="179 239" transform="rotate(-90 48 48)" />
                  <text x="48" y="46" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="700" fontFamily="sans-serif">75</text>
                  <text x="48" y="62" textAnchor="middle" fill="#FBCBB8" fontSize="10" fontFamily="sans-serif">/ 100</text>
                </svg>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#FBCBB8]">Halo Score™</div>
                  <div className="text-white font-semibold text-sm mt-0.5">Starke Reputation</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3.5">
                <div className="rounded-lg p-2" style={{ background: "#FDE7E0" }}>
                  <div className="text-[10px]" style={{ color: "#7A2A12" }}>GEO</div>
                  <div className="text-[15px] font-bold tabular-nums" style={{ color: "#7A2A12" }}>72</div>
                </div>
                <div className="rounded-lg p-2" style={{ background: "#E8EEEE" }}>
                  <div className="text-[10px]" style={{ color: "#1C2A2A" }}>T. L.</div>
                  <div className="text-[15px] font-bold tabular-nums" style={{ color: "#1C2A2A" }}>41</div>
                </div>
                <div className="rounded-lg p-2" style={{ background: "#E6E8E7" }}>
                  <div className="text-[10px]" style={{ color: "#5E6563" }}>Aut.</div>
                  <div className="text-[15px] font-bold tabular-nums" style={{ color: "#5E6563" }}>63</div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[#FBCBB8]/70 text-xs">
            © {new Date().getFullYear()} Halo · Halo UG (haftungsbeschränkt) i. G.
          </p>
        </div>

        {/* Right: waitlist form */}
        <div className="p-8 sm:p-11 flex flex-col justify-center">
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#FA5935]">
              Bald verfügbar
            </span>
            <h3 className="font-[family-name:var(--font-display)] font-normal text-2xl text-[#0E1916] mt-2">
              Auf die Warteliste
            </h3>
            <p className="text-[#6B625A] text-sm mt-1 leading-relaxed">
              Halo ist aktuell noch nicht frei zugänglich. Trag dich mit deiner E-Mail ein
              und wir melden uns, sobald du dabei sein kannst.
            </p>
          </div>

          <WaitlistForm source="warteliste-page" />

          <p className="text-center text-xs text-[#9A9089] mt-6">
            Kein Spam · Keine Kreditkarte · Du kannst dich jederzeit wieder abmelden.
          </p>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#E9E1D3]" />
            <span className="text-xs text-[#9A9089]">oder</span>
            <div className="flex-1 h-px bg-[#E9E1D3]" />
          </div>

          <p className="text-center text-xs text-[#9A9089]">
            Schon ein Konto?{" "}
            <Link href="/login" className="text-[#C8431F] hover:underline font-medium">
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

/** Platzhalter für Bereiche, die im Neuaufbau noch folgen (docs/neuaufbau-plan.md). */
export default function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <div className="max-w-3xl">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#0E1916]">{title}</h1>
      <div className="mt-8 rounded-2xl border border-dashed border-[#E9E1D3] bg-white p-8">
        <p className="text-sm text-[#6B625A]">{text}</p>
        <p className="text-xs text-[#9A9089] mt-3">Dieser Bereich wird gerade neu gebaut.</p>
      </div>
    </div>
  )
}

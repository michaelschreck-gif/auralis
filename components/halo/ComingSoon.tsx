/** Platzhalter für Bereiche, die im Neuaufbau noch folgen (docs/neuaufbau-plan.md). */
export default function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <div className="max-w-3xl">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--h-text)]">{title}</h1>
      <div className="mt-8 rounded-2xl border border-dashed border-[var(--h-line)] bg-[var(--h-card)] p-8">
        <p className="text-sm text-[var(--h-muted)]">{text}</p>
        <p className="text-xs text-[var(--h-dim)] mt-3">Dieser Bereich wird gerade neu gebaut.</p>
      </div>
    </div>
  )
}

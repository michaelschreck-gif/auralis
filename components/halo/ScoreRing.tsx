/** Halo-Score als Ring (0–100). Reines SVG, auch in Server-Komponenten nutzbar. */
export default function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = 40
  const circumference = 2 * Math.PI * r
  const filled = (Math.max(0, Math.min(100, score)) / 100) * circumference
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`Halo Score ${score} von 100`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="#F0EAE0" strokeWidth="9" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="#FA5935"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="#0E1916" fontSize="26" fontWeight="700">
        {score}
      </text>
    </svg>
  )
}

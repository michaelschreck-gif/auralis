/**
 * Prüfset-Auswertung: vergleicht die automatische Erkennung mit den
 * Bewertungen von Hand (Tabelle gold_answers).
 *
 *   Nennung     Trefferquote (Precision), Vollständigkeit (Recall), Genauigkeit
 *   Platz       exakt / höchstens 1 daneben, nur wo beide „genannt“ sagen
 *   Tonalität   Übereinstimmung + Verwechslungstabelle, nur wo beide „genannt“ sagen
 *
 * Die Erkennung wird übergeben (in der App: analyzer.extractMentionSignal),
 * damit die Auswertung ohne weitere Imports testbar bleibt.
 */

export type GoldSentiment = "positive" | "neutral" | "negative"

export type GoldItem = {
  id: string
  targetName: string
  prompt: string
  response: string
  labelMentioned: boolean
  labelPosition: number | null
  labelSentiment: GoldSentiment | null
}

export type Detection = {
  mentioned: boolean
  position: number | null
  /** "not_mentioned", wenn nicht genannt. */
  sentiment: GoldSentiment | "not_mentioned"
}

export type Detector = (response: string, targetName: string, prompt: string) => Detection

export type MismatchKind = "false_positive" | "false_negative" | "position" | "sentiment"

export type Mismatch = {
  id: string
  kind: MismatchKind
  expected: string
  detected: string
}

export type GoldEvaluation = {
  total: number
  mention: {
    truePositive: number
    falsePositive: number
    falseNegative: number
    trueNegative: number
    /** Anteil der erkannten Nennungen, die stimmen (null ohne erkannte Nennung). */
    precision: number | null
    /** Anteil der echten Nennungen, die erkannt wurden (null ohne echte Nennung). */
    recall: number | null
    accuracy: number | null
  }
  position: { compared: number; exact: number; withinOne: number; meanAbsError: number | null }
  sentiment: {
    compared: number
    agree: number
    /** confusion[erwartet][erkannt] */
    confusion: Record<GoldSentiment, Record<GoldSentiment, number>>
  }
  mismatches: Mismatch[]
}

const SENTIMENTS: GoldSentiment[] = ["positive", "neutral", "negative"]

const ratio = (a: number, b: number): number | null => (b > 0 ? Math.round((a / b) * 1000) / 1000 : null)

export function evaluateGold(items: GoldItem[], detect: Detector): GoldEvaluation {
  let tp = 0, fp = 0, fn = 0, tn = 0
  let posCompared = 0, posExact = 0, posWithinOne = 0, posErrorSum = 0
  let sentCompared = 0, sentAgree = 0
  const confusion = Object.fromEntries(
    SENTIMENTS.map(e => [e, Object.fromEntries(SENTIMENTS.map(d => [d, 0]))]),
  ) as GoldEvaluation["sentiment"]["confusion"]
  const mismatches: Mismatch[] = []

  for (const item of items) {
    const d = detect(item.response, item.targetName, item.prompt)

    if (item.labelMentioned && d.mentioned) tp++
    else if (!item.labelMentioned && d.mentioned) {
      fp++
      mismatches.push({ id: item.id, kind: "false_positive", expected: "nicht genannt", detected: "genannt" })
    } else if (item.labelMentioned && !d.mentioned) {
      fn++
      mismatches.push({ id: item.id, kind: "false_negative", expected: "genannt", detected: "nicht genannt" })
    } else tn++

    if (!item.labelMentioned || !d.mentioned) continue

    if (item.labelPosition !== null) {
      posCompared++
      const err = d.position === null ? null : Math.abs(d.position - item.labelPosition)
      if (err === 0) posExact++
      if (err !== null && err <= 1) posWithinOne++
      // Nicht erkannter Platz zählt als Fehler in Höhe des erwarteten Platzes.
      posErrorSum += err ?? item.labelPosition
      if (err !== 0) {
        mismatches.push({ id: item.id, kind: "position", expected: `Platz ${item.labelPosition}`, detected: d.position === null ? "kein Platz" : `Platz ${d.position}` })
      }
    }

    if (item.labelSentiment !== null && d.sentiment !== "not_mentioned") {
      sentCompared++
      confusion[item.labelSentiment][d.sentiment]++
      if (item.labelSentiment === d.sentiment) sentAgree++
      else mismatches.push({ id: item.id, kind: "sentiment", expected: item.labelSentiment, detected: d.sentiment })
    }
  }

  return {
    total: items.length,
    mention: {
      truePositive: tp,
      falsePositive: fp,
      falseNegative: fn,
      trueNegative: tn,
      precision: ratio(tp, tp + fp),
      recall: ratio(tp, tp + fn),
      accuracy: ratio(tp + tn, items.length),
    },
    position: {
      compared: posCompared,
      exact: posExact,
      withinOne: posWithinOne,
      meanAbsError: posCompared ? Math.round((posErrorSum / posCompared) * 10) / 10 : null,
    },
    sentiment: { compared: sentCompared, agree: sentAgree, confusion },
    mismatches,
  }
}

/** Zufällige Auswahl von n Elementen, je zur Hälfte aus `preferred` und dem Rest (für eine ausgewogene Stichprobe). */
export function balancedSample<T>(items: T[], n: number, preferred: (item: T) => boolean, random: () => number = Math.random): T[] {
  const shuffle = (arr: T[]) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
  const yes = shuffle(items.filter(preferred))
  const no = shuffle(items.filter(i => !preferred(i)))
  const half = Math.ceil(n / 2)
  const pickYes = yes.slice(0, Math.max(half, n - no.length))
  const pickNo = no.slice(0, n - pickYes.length)
  return shuffle([...pickYes, ...pickNo]).slice(0, n)
}

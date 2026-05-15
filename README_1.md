# Auralis — AI Visibility Check

## Was ist das?

Das Kernfeature von Auralis: Ein System, das analysiert wie KI-Systeme eine Person wahrnehmen.

## Dateistruktur

```
auralis/
├── app/
│   └── api/
│       └── visibility-check/
│           └── route.ts          ← Next.js API Route (POST endpoint)
├── lib/
│   └── auralis/
│       ├── queries.ts            ← Query-Generator für AI-Abfragen
│       └── analyzer.ts           ← Signal-Extraktion & Scoring
└── components/
    └── VisibilityCheck.tsx       ← React UI Komponente
```

## Setup in Next.js

### 1. Dependencies installieren

```bash
npm install @anthropic-ai/sdk
```

### 2. Environment Variable setzen

In `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Dateien in dein Projekt kopieren

Kopiere die Dateien in die entsprechenden Verzeichnisse deines Next.js Projekts.
Das Projekt muss den `app/` Router verwenden (Next.js 13+).

### 4. Komponente einbinden

```tsx
// app/page.tsx oder app/check/page.tsx
import VisibilityCheck from "@/components/VisibilityCheck"

export default function Page() {
  return <VisibilityCheck />
}
```

### 5. Tailwind CSS

Die Komponente nutzt Tailwind. Stelle sicher dass Tailwind konfiguriert ist:
```bash
npm install tailwindcss
```

## Wie es funktioniert

1. Nutzer gibt Name + Themen ein
2. `generateVisibilityQueries()` erstellt 5 strukturierte Abfragen
3. Jede Abfrage geht an Claude — simuliert wie ein echter User fragt
4. `extractMentionSignal()` analysiert ob die Person genannt wird
5. `buildVisibilityReport()` berechnet den Aura Score (0–100)

### Aura Score Berechnung

| Dimension | Gewichtung | Was wird gemessen |
|---|---|---|
| Presence Score | 35% | In wieviel % der Abfragen erscheint die Person? |
| Position Score | 25% | Wie früh / prominent in den Listen? |
| Context Score | 25% | Wie positiv / autoritär wird die Person beschrieben? |
| Topic Alignment | 15% | Stimmen die KI-Themen mit den gewünschten Themen überein? |

## Nächste Schritte / Erweiterungen

- [ ] Parallele Abfragen an GPT-4 und Gemini (via deren APIs)
- [ ] Supabase: Ergebnisse speichern und Trends über Zeit tracken
- [ ] pgvector: Embeddings der Antworten für semantisches Clustering
- [ ] Competitor Comparison: Gleiche Queries für Wettbewerber ausführen
- [ ] Scheduled Analysis: Tägliche Cron-Jobs für Monitoring
- [ ] Export: PDF Report mit den Ergebnissen

## Hinweis zur Produkt-Logik

Das "Claude befragt Claude" Pattern ist ein MVP-Shortcut.
In der Produktion solltest du echte Abfragen an alle KI-Systeme senden.
Die Architektur (queries.ts → route.ts → analyzer.ts) ist bereits
so gebaut, dass du pro System eine eigene API-Verbindung einbauen kannst.

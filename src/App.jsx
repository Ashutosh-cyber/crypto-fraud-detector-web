import { useEffect, useState } from 'react'
import InputForm, { USER_FIELDS } from './components/InputForm.jsx'
import ResultsPanel from './components/ResultsPanel.jsx'
import HowItWorks from './components/HowItWorks.jsx'

// In production the API is same-origin under /api (Vercel rewrite).
// For local dev, set VITE_API_BASE=http://127.0.0.1:8000 (see .env.development).
const API_BASE = import.meta.env.VITE_API_BASE ?? ''

const emptyForm = Object.fromEntries(USER_FIELDS.map((f) => [f.key, '']))

function Header({ onHelp }) {
  return (
    <header className="border-b border-edge/70 bg-base/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M16 2 L28 9 V23 L16 30 L4 23 V9 Z" stroke="#00e5ff" strokeWidth="2" fill="#0d1117" />
          <path d="M11 16 h10 M16 11 v10" stroke="#00e5ff" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="2.5" fill="#00e5ff" />
        </svg>
        <div className="flex-1">
          <h1 className="font-mono text-lg font-bold text-white text-glow sm:text-xl">
            Bitcoin Wallet Fraud Detector
          </h1>
          <p className="font-mono text-xs text-muted">
            Powered by LightGBM · Elliptic++ Dataset
          </p>
        </div>
        <button
          onClick={onHelp}
          className="rounded-md border border-cyan/40 px-3 py-1.5 font-mono text-xs text-cyan transition hover:bg-cyan/10 hover:shadow-cyan-soft"
        >
          How it works
        </button>
      </div>
    </header>
  )
}

export default function App() {
  const [values, setValues] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [allDefaults, setAllDefaults] = useState(false)
  const [examples, setExamples] = useState([])
  const [activeExample, setActiveExample] = useState(null) // {id, kind, title} or null
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/api/examples`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setExamples)
      .catch(() => setExamples([]))
  }, [])

  const handleChange = (key, val) => {
    // Any manual edit drops example mode -> back to manual prediction.
    setActiveExample(null)
    setValues((prev) => ({ ...prev, [key]: val }))
  }

  const runPredict = async (body, meta) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`${API_BASE}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResult({ ...data, _example: meta ?? null })
      setAllDefaults(Boolean(data.used_all_defaults))
    } catch {
      setError('Analysis failed. Please check your inputs or try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (activeExample) {
      runPredict({ example_id: activeExample.id }, activeExample)
      return
    }
    const payload = {}
    for (const f of USER_FIELDS) {
      const raw = values[f.key]
      if (raw !== '' && raw !== null && raw !== undefined && !Number.isNaN(Number(raw))) {
        payload[f.key] = Number(raw)
      }
    }
    runPredict(payload, null)
  }

  const handlePickExample = (ex) => {
    // Fill the visible fields for transparency, mark example mode, and run.
    const filled = { ...emptyForm }
    for (const f of USER_FIELDS) {
      if (ex.user_values[f.key] !== undefined) filled[f.key] = String(ex.user_values[f.key])
    }
    setValues(filled)
    const meta = { id: ex.id, kind: ex.kind, title: ex.title }
    setActiveExample(meta)
    runPredict({ example_id: ex.id }, meta)
  }

  const handleReset = () => {
    setValues(emptyForm)
    setResult(null)
    setError(null)
    setAllDefaults(false)
    setActiveExample(null)
  }

  return (
    <div className="min-h-full">
      <Header onHelp={() => setHelpOpen(true)} />
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <InputForm
          values={values}
          onChange={handleChange}
          onSubmit={handleSubmit}
          loading={loading}
          apiBase={API_BASE}
          examples={examples}
          onPickExample={handlePickExample}
        />
        <ResultsPanel
          result={result}
          error={error}
          allDefaults={allDefaults}
          onReset={handleReset}
        />
      </main>
      <HowItWorks open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}

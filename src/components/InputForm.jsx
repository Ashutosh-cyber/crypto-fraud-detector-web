import { useEffect, useState } from 'react'
import { featureName, featureDesc } from '../featureInfo.js'

// The 8 human-interpretable fields the user is most likely to know.
// `help` is always-visible plain English; `tip` is the extra hover detail.
// Order and keys match the backend's USER_FIELDS.
export const USER_FIELDS = [
  {
    key: 'fees_min',
    label: 'Smallest Transaction Fee',
    unit: 'satoshis',
    example: 226,
    help: 'The lowest fee this wallet ever paid to send Bitcoin.',
    tip: 'Fraudulent wallets often pay unusually low fees to move money cheaply and quickly.',
  },
  {
    key: 'fees_max',
    label: 'Largest Transaction Fee',
    unit: 'satoshis',
    example: 5000,
    help: 'The highest fee this wallet ever paid in a single transaction.',
    tip: 'A normal wallet usually has at least one larger fee from a busy-network transaction.',
  },
  {
    key: 'fees_total',
    label: 'Total Fees Ever Paid',
    unit: 'satoshis',
    example: 12400,
    help: 'All the fees this wallet has paid, added together.',
    tip: 'Sum of every transaction fee across the wallet\'s whole history.',
  },
  {
    key: 'transacted_w_address_total',
    label: 'Number of Wallets It Dealt With',
    unit: 'wallets',
    example: 14,
    help: 'How many different wallets it has sent money to or received money from.',
    tip: 'Fraud wallets often interact with very few addresses. Genuine users tend to have more.',
  },
  {
    key: 'lifetime_in_blocks',
    label: 'How Long the Wallet Has Existed',
    unit: 'blocks',
    example: 3200,
    help: 'The wallet\'s age in Bitcoin "blocks". One block is roughly 10 minutes, so 3,200 blocks ≈ 22 days.',
    tip: 'Number of blocks between the wallet\'s first and last activity. Short-lived wallets are more suspicious.',
  },
  {
    key: 'num_timesteps_appeared_in',
    label: 'How Many Periods It Was Active',
    unit: '2-week periods',
    example: 2,
    help: 'How many 2-week periods the wallet did anything at all. "2" means it was active for about a month.',
    tip: 'Most fraud wallets appear in only one or two periods, then go quiet.',
  },
  {
    key: 'first_sent_block',
    label: 'When It First Sent Bitcoin',
    unit: 'block number',
    example: 480210,
    help: 'The block number when this wallet first sent Bitcoin. (A block is a numbered batch of transactions — higher number = more recent.)',
    tip: 'Block height at which the wallet first sent funds. Leave blank if unknown.',
  },
  {
    key: 'first_received_block',
    label: 'When It First Received Bitcoin',
    unit: 'block number',
    example: 479850,
    help: 'The block number when this wallet first received Bitcoin.',
    tip: 'Block height at which the wallet first received funds. Leave blank if unknown.',
  },
]

const GLOSSARY = [
  {
    term: 'Satoshi',
    def: 'The smallest unit of Bitcoin. 1 BTC = 100,000,000 satoshis. Fees are tiny, so they\'re counted in satoshis.',
  },
  {
    term: 'Block',
    def: 'A batch of Bitcoin transactions, created about every 10 minutes. Each has a number (its "height").',
  },
  {
    term: '2-week period',
    def: 'This dataset groups activity into 2-week chunks called "time steps". It\'s just a way to measure time.',
  },
]

function Tooltip({ text }) {
  return (
    <span className="group relative ml-1.5 inline-flex">
      <span
        className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-cyan/50 text-[10px] font-bold text-cyan/80"
        aria-label={text}
      >
        i
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-md border border-cyan/30 bg-panel-2 px-3 py-2 text-xs leading-snug text-gray-300 opacity-0 shadow-cyan-soft transition-opacity duration-150 group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  )
}

function HelpBanner() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-6 rounded-md border border-cyan/25 bg-cyan/5 px-4 py-3">
      <p className="text-sm text-gray-300">
        <span className="font-mono text-cyan">ℹ</span> Not sure what to enter?{' '}
        <span className="text-gray-400">
          Every field is optional — fill in only what you know and we'll use typical values for the
          rest. Or just press
        </span>{' '}
        <span className="font-mono text-cyan">Fill example wallet</span>{' '}
        <span className="text-gray-400">to see how it works.</span>
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-2 font-mono text-xs text-cyan/80 underline-offset-4 hover:underline"
      >
        {open ? 'Hide' : 'New to these terms?'}
      </button>
      {open && (
        <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {GLOSSARY.map((g) => (
            <div key={g.term} className="rounded border border-edge/60 bg-base/40 p-2.5">
              <dt className="font-mono text-xs font-bold text-cyan/80">{g.term}</dt>
              <dd className="mt-1 text-[11px] leading-snug text-muted">{g.def}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

function AutoFilledPanel({ metadata }) {
  return (
    <div>
      <h3 className="font-mono text-sm font-medium text-muted">Filled in Automatically</h3>
      <p className="mb-3 mt-1 text-[11px] leading-snug text-muted/70">
        These are advanced wallet features most people won't know. We set them to typical values so
        you don't have to. Hover any item for a plain-English explanation.
      </p>
      {!metadata && <p className="text-xs text-muted/70">Loading…</p>}
      <div className="space-y-3">
        {metadata &&
          Object.entries(metadata.auto_filled).map(([category, items]) => (
            <div key={category} className="rounded-md border border-edge/60 bg-base/40 p-3">
              <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-cyan/60">
                {category}
              </div>
              <ul className="space-y-1">
                {items.map((it) => (
                  <li
                    key={it.feature}
                    className="group relative flex cursor-help items-center justify-between gap-2 text-[11px] text-muted/90"
                  >
                    <span className="truncate">{featureName(it.feature)}</span>
                    <span className="shrink-0 font-mono text-muted/60">
                      {formatDefault(it.default)}
                    </span>
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute bottom-full right-0 z-20 mb-1.5 w-60 rounded-md border border-cyan/30 bg-panel-2 px-3 py-2 text-[11px] leading-snug text-gray-300 opacity-0 shadow-cyan-soft transition-opacity duration-150 group-hover:opacity-100"
                    >
                      <span className="block font-mono text-cyan/80">{featureName(it.feature)}</span>
                      {featureDesc(it.feature)}
                      <span className="mt-1 block font-mono text-[10px] text-muted/60">
                        default ≈ {formatDefault(it.default)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </div>
  )
}

function ExampleButtons({ examples, onPick, disabled }) {
  if (!examples || examples.length === 0) return null
  const genuine = examples.filter((e) => e.kind === 'genuine')
  const fraud = examples.filter((e) => e.kind === 'fraud')

  const Btn = ({ ex }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onPick(ex)}
      title={ex.blurb}
      className={`rounded border px-3 py-1.5 font-mono text-xs transition disabled:opacity-50 ${
        ex.kind === 'fraud'
          ? 'border-illicit/50 text-illicit hover:bg-illicit/10'
          : 'border-licit/50 text-licit hover:bg-licit/10'
      }`}
    >
      {ex.kind === 'fraud' ? '⚠ ' : '✓ '}
      {ex.title}
    </button>
  )

  return (
    <div className="mb-6 rounded-md border border-edge/70 bg-base/40 p-4">
      <p className="mb-3 text-sm text-gray-300">
        <span className="font-mono text-cyan">▸</span> Try a real wallet from the dataset and see
        which quantities signal fraud:
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-licit/70">
            Genuine wallets
          </div>
          <div className="flex flex-wrap gap-2">
            {genuine.map((ex) => (
              <Btn key={ex.id} ex={ex} />
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-illicit/70">
            Fraudulent wallets
          </div>
          <div className="flex flex-wrap gap-2">
            {fraud.map((ex) => (
              <Btn key={ex.id} ex={ex} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function formatDefault(v) {
  if (v === 0) return '0'
  if (Math.abs(v) > 0 && Math.abs(v) < 0.001) return v.toExponential(2)
  if (Number.isInteger(v)) return String(v)
  return v.toFixed(4)
}

export default function InputForm({
  values,
  onChange,
  onSubmit,
  loading,
  apiBase,
  examples,
  onPickExample,
}) {
  const [metadata, setMetadata] = useState(null)

  useEffect(() => {
    fetch(`${apiBase}/api/metadata`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setMetadata)
      .catch(() => setMetadata(null))
  }, [apiBase])

  return (
    <section className="rounded-xl border border-cyan/30 bg-panel shadow-cyan-soft">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge/70 px-6 py-4">
        <h2 className="font-mono text-lg font-medium text-gray-100">
          <span className="text-cyan">&gt;</span> Wallet Feature Input
        </h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
        className="px-6 py-6"
      >
        <HelpBanner />
        <ExampleButtons examples={examples} onPick={onPickExample} disabled={loading} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left column: manual inputs */}
          <div className="space-y-5">
            {USER_FIELDS.map((f) => (
              <div key={f.key}>
                <label
                  htmlFor={f.key}
                  className="flex items-center text-sm font-medium text-gray-200"
                >
                  {f.label}
                  <Tooltip text={f.tip} />
                </label>
                <p className="mb-1.5 mt-0.5 text-[11px] leading-snug text-muted">{f.help}</p>
                <div className="relative">
                  <input
                    id={f.key}
                    type="number"
                    step="any"
                    inputMode="decimal"
                    placeholder={`e.g. ${f.example}`}
                    value={values[f.key] ?? ''}
                    onChange={(e) => onChange(f.key, e.target.value)}
                    className="w-full rounded-md border border-edge bg-base px-3 py-2 pr-24 font-mono text-sm text-gray-100 placeholder-muted/50 outline-none transition focus:border-cyan focus:shadow-cyan-soft"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-wide text-muted/60">
                    {f.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Right column: read-only defaults */}
          <AutoFilledPanel metadata={metadata} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-8 w-full rounded-md border border-cyan/60 bg-cyan/10 py-3 font-mono text-sm font-bold uppercase tracking-wider text-cyan transition hover:bg-cyan/20 hover:shadow-cyan-glow focus:shadow-cyan-glow disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Analysing…' : 'Analyse Wallet'}
        </button>
      </form>
    </section>
  )
}

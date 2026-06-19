import ShapChart from './ShapChart.jsx'
import { featureName, featureDesc } from '../featureInfo.js'

function formatActual(v) {
  if (v === 0) return '0'
  if (Math.abs(v) > 0 && Math.abs(v) < 0.001) return v.toExponential(2)
  if (Number.isInteger(v)) return String(v)
  return v.toFixed(4)
}

export default function ResultsPanel({ result, error, allDefaults, onReset }) {
  // Hidden until there's something to show.
  if (!result && !error) return null

  const isIllicit = result?.verdict === 'Illicit'
  const accent = isIllicit ? 'illicit' : 'licit'
  const pct = result ? (result.fraud_probability * 100).toFixed(1) : '0.0'

  return (
    <section className="animate-fade-slide-up rounded-xl border border-edge bg-panel p-6 shadow-cyan-soft">
      {error ? (
        <p className="text-center font-mono text-sm text-illicit">{error}</p>
      ) : (
        <>
          {result._example && (
            <div
              className={`mb-5 rounded-md border px-4 py-2 text-center font-mono text-xs ${
                result._example.kind === 'fraud'
                  ? 'border-illicit/40 bg-illicit/5 text-illicit/90'
                  : 'border-licit/40 bg-licit/5 text-licit/90'
              }`}
            >
              Showing a real {result._example.kind} wallet from the dataset ({result._example.title}).
              Edit any field above to switch back to your own input.
            </div>
          )}

          {allDefaults && !result._example && (
            <div className="mb-5 rounded-md border border-cyan/30 bg-cyan/5 px-4 py-2 text-center font-mono text-xs text-cyan/80">
              No inputs provided. All features set to training medians.
            </div>
          )}

          {/* Verdict badge */}
          <div
            className={`flex items-center justify-center gap-3 rounded-lg border py-5 ${
              isIllicit
                ? 'border-illicit/50 bg-illicit/10 text-illicit'
                : 'border-licit/50 bg-licit/10 text-licit'
            }`}
          >
            <span className="text-2xl">{isIllicit ? '⚠' : '✓'}</span>
            <span className="font-mono text-xl font-bold uppercase tracking-wider">
              {isIllicit ? 'Fraudulent Wallet' : 'Legitimate Wallet'}
            </span>
          </div>

          {/* Confidence bar */}
          <div className="mt-6">
            <div className="mb-1.5 flex items-center justify-between font-mono text-sm">
              <span className="text-gray-300">Fraud Probability</span>
              <span className={isIllicit ? 'text-illicit' : 'text-licit'}>{pct}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-base">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${pct}%`,
                  backgroundColor: isIllicit ? '#ff4444' : '#00c853',
                }}
              />
            </div>
          </div>

          {/* SHAP chart */}
          <div className="mt-8">
            <h3 className="mb-1 font-mono text-base font-medium text-gray-100">
              What Drove This Decision
            </h3>
            <p className="mb-4 font-mono text-xs text-muted">
              Feature Contributions (SHAP Values)
            </p>
            <ShapChart features={result.top_features} />
            <p className="mt-3 text-xs text-muted">
              Red bars increase fraud likelihood. Green bars decrease it. Bar length shows
              strength of influence.
            </p>
          </div>

          {/* Actual-values table */}
          <div className="mt-8">
            <h4 className="mb-3 font-mono text-sm font-medium text-gray-300">
              Feature Values Used
            </h4>
            <div className="overflow-hidden rounded-md border border-edge">
              <table className="w-full text-left text-xs">
                <thead className="bg-base/60 font-mono text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Feature</th>
                    <th className="px-3 py-2 text-right font-medium">Value</th>
                    <th className="px-3 py-2 text-right font-medium">Source</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {result.top_features.map((f, i) => (
                    <tr key={f.feature} className={i % 2 ? 'bg-base/20' : ''}>
                      <td className="px-3 py-2">
                        <span className="group relative cursor-help text-gray-300">
                          {featureName(f.feature)}
                          <span
                            role="tooltip"
                            className="pointer-events-none absolute bottom-full left-0 z-20 mb-1.5 w-60 rounded-md border border-cyan/30 bg-panel-2 px-3 py-2 text-[11px] leading-snug text-gray-300 opacity-0 shadow-cyan-soft transition-opacity duration-150 group-hover:opacity-100"
                          >
                            {featureDesc(f.feature)}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-gray-400">
                        {formatActual(f.actual_value)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                            f.source === 'User Input'
                              ? 'bg-cyan/15 text-cyan'
                              : f.source === 'Example'
                                ? 'bg-cyan/10 text-cyan/80'
                                : 'bg-edge/50 text-muted'
                          }`}
                        >
                          {f.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={onReset}
            className="mt-6 font-mono text-sm text-muted underline-offset-4 transition hover:text-cyan hover:underline"
          >
            Reset
          </button>
        </>
      )}
    </section>
  )
}

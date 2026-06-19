// "How it works" overlay — plain-English explanation of the whole pipeline.
export default function HowItWorks({ open, onClose }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-xl border border-cyan/30 bg-panel p-6 shadow-cyan-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-mono text-lg font-bold text-white text-glow">How this works</h2>
          <button
            onClick={onClose}
            className="rounded border border-edge px-2 py-1 font-mono text-xs text-muted hover:border-cyan hover:text-cyan"
          >
            ✕ Close
          </button>
        </div>

        <div className="space-y-5 text-sm leading-relaxed text-gray-300">
          <section>
            <h3 className="mb-1 font-mono text-sm font-semibold text-cyan">In one sentence</h3>
            <p>
              You describe a Bitcoin wallet, and a machine-learning model trained on thousands of
              real wallets estimates how likely it is to be involved in illegal activity — then
              shows you exactly which details drove that decision.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-mono text-sm font-semibold text-cyan">The model</h3>
            <p>
              It’s a <span className="text-gray-100">LightGBM</span> classifier (a fast, accurate
              type of decision-tree model) trained on the public{' '}
              <span className="text-gray-100">Elliptic++</span> Bitcoin dataset. On unseen test
              wallets it reaches <span className="text-gray-100">96.2% ROC-AUC</span>, meaning it
              separates legitimate from illicit wallets very reliably.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-mono text-sm font-semibold text-cyan">What you enter</h3>
            <p>
              The model looks at <span className="text-gray-100">39 features</span> of a wallet. To
              keep things simple we ask you for the <span className="text-gray-100">8 easiest to
              understand</span> (fees, how many wallets it dealt with, how long it was active,
              etc.). The other 31 are advanced statistics, so we fill them with{' '}
              <span className="text-gray-100">typical values</span> automatically. Every field is
              optional.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-mono text-sm font-semibold text-cyan">The verdict & probability</h3>
            <p>
              The model outputs a <span className="text-gray-100">fraud probability</span> from 0 to
              100%. Above 50% we label the wallet{' '}
              <span className="text-illicit">Fraudulent</span>; otherwise{' '}
              <span className="text-licit">Legitimate</span>.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-mono text-sm font-semibold text-cyan">
              “What drove this decision” (SHAP)
            </h3>
            <p>
              <span className="text-gray-100">SHAP values</span> break the prediction down feature by
              feature. <span className="text-illicit">Red bars</span> are details that pushed the
              wallet <em>toward</em> fraud; <span className="text-licit">green bars</span> pushed it{' '}
              <em>toward</em> legitimate. Longer bars = stronger influence. This is how you learn
              which wallet quantities act as fraud signals.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-mono text-sm font-semibold text-cyan">Try the examples</h3>
            <p>
              Use the <span className="text-licit">Genuine</span> and{' '}
              <span className="text-illicit">Fraud</span> example buttons to load real wallets from
              the dataset and compare their signals side by side.
            </p>
          </section>

          <section className="rounded-md border border-edge/60 bg-base/40 p-3 text-xs text-muted">
            <p>
              <span className="font-semibold text-gray-300">Note:</span> This is a research /
              educational demo built on a dissertation project, not a financial-advice or compliance
              tool. Full technical details are in the project’s{' '}
              <span className="font-mono text-cyan">README.md</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

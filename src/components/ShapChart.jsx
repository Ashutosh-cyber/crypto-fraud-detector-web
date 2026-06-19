import { featureName } from '../featureInfo.js'

// Plain-SVG diverging horizontal bar chart of SHAP contributions.
// Positive (toward fraud) -> red bars to the right.
// Negative (toward legit) -> green bars to the left.
const ILLICIT = '#ff4444'
const LICIT = '#00c853'

export default function ShapChart({ features }) {
  if (!features || features.length === 0) return null

  const rowH = 34
  const labelW = 250 // left gutter for feature names
  const valueW = 70 // right gutter for numeric value
  const chartW = 360 // width of the bar plotting area
  const width = labelW + chartW + valueW
  const height = features.length * rowH + 16
  const centerX = labelW + chartW / 2

  const maxAbs = Math.max(...features.map((f) => Math.abs(f.shap_value))) || 1
  const scale = (chartW / 2 - 6) / maxAbs

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        className="min-w-[680px]"
        role="img"
        aria-label="SHAP feature contribution chart"
      >
        {/* vertical zero line */}
        <line
          x1={centerX}
          y1={4}
          x2={centerX}
          y2={height - 4}
          stroke="#30363d"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />

        {features.map((f, i) => {
          const y = 8 + i * rowH
          const barLen = Math.abs(f.shap_value) * scale
          const positive = f.shap_value >= 0
          const color = positive ? ILLICIT : LICIT
          const barX = positive ? centerX : centerX - barLen
          return (
            <g key={f.feature}>
              {/* feature name (left) */}
              <text
                x={labelW - 10}
                y={y + rowH / 2}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-gray-300"
                style={{ fontSize: '11px' }}
              >
                {featureName(f.feature)}
                <title>{f.feature}</title>
              </text>

              {/* bar */}
              <rect
                x={barX}
                y={y + 5}
                width={Math.max(barLen, 1)}
                height={rowH - 14}
                rx="2"
                fill={color}
                opacity="0.85"
              >
                <title>{`${f.feature}: ${f.shap_value.toFixed(4)}`}</title>
              </rect>

              {/* signed value (right) */}
              <text
                x={width - 8}
                y={y + rowH / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fill={color}
                style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {f.shap_value >= 0 ? '+' : ''}
                {f.shap_value.toFixed(3)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

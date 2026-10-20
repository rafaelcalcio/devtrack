export interface BarChartDatum {
  label: string;
  value: number;
  hint?: string;
}

export interface BarChartProps {
  data: BarChartDatum[];
  color?: string;
  emptyMessage?: string;
  formatValue?: (value: number) => string;
}

const VIEW_WIDTH = 620;
const VIEW_HEIGHT = 210;
const PADDING = { top: 16, right: 12, bottom: 34, left: 34 };

export function BarChart({
  data,
  color = 'var(--primary)',
  emptyMessage = 'Sem dados suficientes para o gráfico.',
  formatValue = (value) => String(value),
}: BarChartProps) {
  if (data.length === 0) {
    return <p className="text-muted">{emptyMessage}</p>;
  }

  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const plotWidth = VIEW_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = VIEW_HEIGHT - PADDING.top - PADDING.bottom;
  const slot = plotWidth / data.length;
  const barWidth = Math.max(6, slot * 0.55);

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label="Gráfico de barras"
      style={{ width: '100%', height: 'auto' }}
    >
      {[0, 0.5, 1].map((ratio) => {
        const y = PADDING.top + plotHeight - plotHeight * ratio;

        return (
          <g key={ratio}>
            <line
              x1={PADDING.left}
              x2={VIEW_WIDTH - PADDING.right}
              y1={y}
              y2={y}
              stroke="var(--border)"
              strokeDasharray={ratio === 0 ? undefined : '4 4'}
            />
            <text x={4} y={y + 4} fontSize={10} fill="var(--text-subtle)">
              {formatValue(maxValue * ratio)}
            </text>
          </g>
        );
      })}

      {data.map((item, index) => {
        const height = (item.value / maxValue) * plotHeight;
        const x = PADDING.left + slot * index + (slot - barWidth) / 2;
        const y = PADDING.top + plotHeight - height;

        return (
          <g key={`${item.label}-${index}`}>
            <title>{`${item.label}: ${formatValue(item.value)}`}</title>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(item.value > 0 ? 3 : 0, height)}
              rx={4}
              fill={color}
              opacity={item.value === 0 ? 0.25 : 1}
            />
            <text
              x={x + barWidth / 2}
              y={VIEW_HEIGHT - 12}
              fontSize={10}
              textAnchor="middle"
              fill="var(--text-subtle)"
            >
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

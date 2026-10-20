export interface DonutChartDatum {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  data: DonutChartDatum[];
  centerLabel?: string;
  centerValue?: string;
  emptyMessage?: string;
}

const SIZE = 180;
const RADIUS = 68;
const STROKE = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  emptyMessage = 'Sem dados para exibir.',
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total <= 0) {
    return <p className="text-muted">{emptyMessage}</p>;
  }

  const segments = data.map((item, index) => {
    const dash = (item.value / total) * CIRCUMFERENCE;
    const previousDash = data
      .slice(0, index)
      .reduce((sum, other) => sum + (other.value / total) * CIRCUMFERENCE, 0);

    return { item, dash, offset: previousDash };
  });

  return (
    <div className="donut">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        role="img"
        aria-label="Gráfico de rosca"
      >
        <g transform={`translate(${SIZE / 2} ${SIZE / 2}) rotate(-90)`}>
          <circle
            r={RADIUS}
            fill="none"
            stroke="var(--surface-hover)"
            strokeWidth={STROKE}
          />
          {segments.map(({ item, dash, offset }) => (
            <circle
              key={item.label}
              r={RADIUS}
              fill="none"
              stroke={item.color}
              strokeWidth={STROKE}
              strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
              strokeDashoffset={-offset}
            >
              <title>{`${item.label}: ${item.value}`}</title>
            </circle>
          ))}
        </g>
        {centerValue ? (
          <text
            x={SIZE / 2}
            y={SIZE / 2}
            textAnchor="middle"
            fontSize={26}
            fontWeight={650}
            fill="var(--text)"
          >
            {centerValue}
          </text>
        ) : null}
        {centerLabel ? (
          <text
            x={SIZE / 2}
            y={SIZE / 2 + 20}
            textAnchor="middle"
            fontSize={11}
            fill="var(--text-subtle)"
          >
            {centerLabel}
          </text>
        ) : null}
      </svg>

      <ul className="donut__legend">
        {data.map((item) => (
          <li key={item.label}>
            <span className="donut__legend-dot" style={{ backgroundColor: item.color }} aria-hidden="true" />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { classNames } from '../../utils/format';

export interface ProgressBarProps {
  value: number;
  label?: string;
  showMeta?: boolean;
  color?: string;
  className?: string;
}

export function ProgressBar({
  value,
  label,
  showMeta = true,
  color,
  className,
}: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div className={classNames('progress', className)}>
      {showMeta ? (
        <div className="progress__meta">
          <span>{label ?? 'Progresso'}</span>
          <span>{safeValue}%</span>
        </div>
      ) : null}
      <div
        className="progress__track"
        role="progressbar"
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progresso'}
      >
        <div
          className="progress__bar"
          style={{ width: `${safeValue}%`, backgroundColor: color ?? 'var(--primary)' }}
        />
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';
import { classNames } from '../../utils/format';

export type StatTone = 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: StatTone;
}

export function StatCard({ label, value, hint, icon, tone = 'primary' }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-card__top">
        {icon ? <span className={`stat-card__icon stat-card__icon--${tone}`}>{icon}</span> : null}
        <span className="stat-card__label">{label}</span>
      </div>
      <strong className={classNames('stat-card__value')}>{value}</strong>
      {hint ? <span className="stat-card__hint">{hint}</span> : null}
    </article>
  );
}

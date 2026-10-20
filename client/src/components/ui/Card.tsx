import type { ReactNode } from 'react';
import { classNames } from '../../utils/format';

export interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return <section className={classNames('card', className)}>{children}</section>;
}

export interface CardHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function CardHeader({ title, description, actions }: CardHeaderProps) {
  return (
    <header className="card__header">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="card__header-actions">{actions}</div> : null}
    </header>
  );
}

export interface CardBodyProps {
  children: ReactNode;
  flush?: boolean;
  className?: string;
}

export function CardBody({ children, flush = false, className }: CardBodyProps) {
  return <div className={classNames('card__body', flush && 'card__body--flush', className)}>{children}</div>;
}

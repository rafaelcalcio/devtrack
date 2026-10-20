import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/States';

export function NotFoundPage() {
  return (
    <div className="page">
      <Card>
        <EmptyState
          icon={<Compass size={22} aria-hidden="true" />}
          title="Página não encontrada"
          description="O endereço acessado não existe no DevTrack. Use o menu lateral para continuar."
          actionLabel="Ir para o dashboard"
          onAction={() => {
            window.location.assign('/');
          }}
        />
      </Card>

      <p style={{ textAlign: 'center' }}>
        <Link className="button button--secondary" to="/">
          Voltar ao início
        </Link>
      </p>
    </div>
  );
}

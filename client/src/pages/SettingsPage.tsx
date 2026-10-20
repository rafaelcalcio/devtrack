import { Database, Info, Monitor, Moon, Palette, Save, Sun, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { TextInput } from '../components/ui/Form';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';

type Density = 'comfortable' | 'compact';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useLocalStorage('devtrack:displayName', 'Desenvolvedor');
  const [density, setDensity] = useLocalStorage<Density>('devtrack:density', 'comfortable');
  const [nameDraft, setNameDraft] = useState(displayName);

  useEffect(() => {
    document.documentElement.dataset.density = density;
  }, [density]);

  const handleSaveName = () => {
    setDisplayName(nameDraft.trim() || 'Desenvolvedor');
    showToast('Preferências salvas neste navegador.');
  };

  return (
    <div className="page">
      <div className="settings-grid">
        <div className="page">
          <Card>
            <CardHeader
              title="Perfil"
              description="Informações exibidas na interface (salvas apenas neste navegador)"
            />
            <CardBody>
              <div className="form">
                <TextInput
                  label="Nome de exibição"
                  value={nameDraft}
                  hint="Usado na interface e nas mensagens de boas-vindas."
                  onChange={(event) => setNameDraft(event.target.value)}
                />

                <div className="page__toolbar">
                  <Button icon={<Save size={16} aria-hidden="true" />} onClick={handleSaveName}>
                    Salvar preferências
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Aparência" description="Tema e densidade da interface" />
            <CardBody>
              <div className="form">
                <div className="field">
                  <span className="field__label">
                    <Palette size={14} aria-hidden="true" /> Tema
                  </span>
                  <div className="theme-options">
                    <button
                      type="button"
                      className="theme-option"
                      aria-pressed={theme === 'light'}
                      onClick={() => setTheme('light')}
                    >
                      <span
                        className="theme-option__preview"
                        style={{
                          background: 'linear-gradient(135deg, #ffffff 0%, #f4f5fb 60%, #5b5bd6 100%)',
                        }}
                        aria-hidden="true"
                      />
                      <span className="theme-option__label">
                        <Sun size={14} aria-hidden="true" /> Claro
                      </span>
                    </button>

                    <button
                      type="button"
                      className="theme-option"
                      aria-pressed={theme === 'dark'}
                      onClick={() => setTheme('dark')}
                    >
                      <span
                        className="theme-option__preview"
                        style={{
                          background: 'linear-gradient(135deg, #0e1017 0%, #171b25 60%, #8b8bf0 100%)',
                        }}
                        aria-hidden="true"
                      />
                      <span className="theme-option__label">
                        <Moon size={14} aria-hidden="true" /> Escuro
                      </span>
                    </button>
                  </div>
                </div>

                <div className="field">
                  <span className="field__label">
                    <Monitor size={14} aria-hidden="true" /> Densidade
                  </span>
                  <div className="theme-options">
                    <button
                      type="button"
                      className="theme-option"
                      aria-pressed={density === 'comfortable'}
                      onClick={() => setDensity('comfortable')}
                    >
                      <span className="theme-option__preview" style={{ height: 32 }} aria-hidden="true" />
                      <span className="theme-option__label">Confortável</span>
                    </button>
                    <button
                      type="button"
                      className="theme-option"
                      aria-pressed={density === 'compact'}
                      onClick={() => setDensity('compact')}
                    >
                      <span
                        className="theme-option__preview"
                        style={{ height: 22 }}
                        aria-hidden="true"
                      />
                      <span className="theme-option__label">Compacta</span>
                    </button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Sobre" description="Informações do aplicativo" />
          <CardBody>
            <div className="info-list">
              <div className="info-list__item">
                <dt>Versão</dt>
                <dd>1.0.0</dd>
              </div>
              <div className="info-list__item">
                <dt>Usuário</dt>
                <dd>{displayName}</dd>
              </div>
              <div className="info-list__item">
                <dt>Persistência</dt>
                <dd>SQLite local</dd>
              </div>
            </div>

            <div className="inline-alert" style={{ marginTop: 16, backgroundColor: 'var(--info-soft)', color: 'var(--info)' }}>
              <Info size={18} aria-hidden="true" />
              <span>
                Esta é uma versão local para um único usuário. Não existe autenticação: qualquer
                pessoa com acesso ao computador e ao banco de dados tem acesso aos registros.
              </span>
            </div>

            <div className="info-list" style={{ marginTop: 16 }}>
              <div className="info-list__item">
                <dt>
                  <User size={14} aria-hidden="true" /> Sessão
                </dt>
                <dd>Local</dd>
              </div>
              <div className="info-list__item">
                <dt>
                  <Database size={14} aria-hidden="true" /> Banco
                </dt>
                <dd>server/data/devtrack.db</dd>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

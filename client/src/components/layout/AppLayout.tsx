import { ChartNoAxesColumn, Menu, Moon, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { findNavItem, NAV_ITEMS } from '../../config/navigation';
import { useTheme } from '../../hooks/useTheme';

export function AppLayout() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const page = findNavItem(location.pathname);

  return (
    <div className="app-shell">
      <aside className={`sidebar${menuOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <span className="sidebar__logo" aria-hidden="true">
            <ChartNoAxesColumn size={20} />
          </span>
          <span className="sidebar__brand-text">
            <strong>DevTrack</strong>
            <span>Produtividade para devs</span>
          </span>
        </div>

        <nav className="sidebar__nav" aria-label="Navegação principal">
          <span className="sidebar__section-title">Menu</span>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <strong>Versão local</strong>
          Aplicação de usuário único, sem autenticação. Os dados ficam salvos no seu
          computador, em um banco SQLite local.
        </div>
      </aside>

      {menuOpen ? (
        <button
          type="button"
          className="sidebar__backdrop"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div className="app-main">
        <header className="app-header">
          <button
            type="button"
            className="icon-button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>

          <div className="app-header__title">
            <h1>{page.title}</h1>
            <p>{page.description}</p>
          </div>

          <div className="app-header__actions">
            <button
              type="button"
              className="icon-button"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
              title={theme === 'light' ? 'Tema escuro' : 'Tema claro'}
            >
              {theme === 'light' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
            </button>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

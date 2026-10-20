import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { CalendarPage } from './pages/CalendarPage';
import { DashboardPage } from './pages/DashboardPage';
import { GoalsPage } from './pages/GoalsPage';
import { KanbanPage } from './pages/KanbanPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SettingsPage } from './pages/SettingsPage';
import { StudiesPage } from './pages/StudiesPage';
import { TasksPage } from './pages/TasksPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="projetos" element={<ProjectsPage />} />
        <Route path="projetos/:id" element={<ProjectDetailPage />} />
        <Route path="tarefas" element={<TasksPage />} />
        <Route path="quadro" element={<KanbanPage />} />
        <Route path="estudos" element={<StudiesPage />} />
        <Route path="metas" element={<GoalsPage />} />
        <Route path="calendario" element={<CalendarPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

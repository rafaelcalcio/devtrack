import {
  BookOpen,
  CalendarDays,
  FolderKanban,
  KanbanSquare,
  LayoutDashboard,
  ListTodo,
  Settings,
  Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Visão geral da sua produtividade',
  },
  {
    to: '/projetos',
    label: 'Projetos',
    icon: FolderKanban,
    title: 'Projetos',
    description: 'Organize os projetos em andamento',
  },
  {
    to: '/tarefas',
    label: 'Tarefas',
    icon: ListTodo,
    title: 'Tarefas',
    description: 'Acompanhe e conclua suas tarefas',
  },
  {
    to: '/quadro',
    label: 'Quadro',
    icon: KanbanSquare,
    title: 'Quadro Kanban',
    description: 'Visualize e mova tarefas entre etapas',
  },
  {
    to: '/estudos',
    label: 'Estudos',
    icon: BookOpen,
    title: 'Estudos',
    description: 'Registre e acompanhe seu tempo de estudo',
  },
  {
    to: '/metas',
    label: 'Metas',
    icon: Target,
    title: 'Metas',
    description: 'Defina e acompanhe suas metas pessoais e profissionais',
  },
  {
    to: '/calendario',
    label: 'Calendário',
    icon: CalendarDays,
    title: 'Calendário',
    description: 'Prazos de tarefas, projetos e metas em um único lugar',
  },
  {
    to: '/configuracoes',
    label: 'Configurações',
    icon: Settings,
    title: 'Configurações',
    description: 'Preferências de perfil e interface',
  },
];

export function findNavItem(pathname: string): NavItem {
  const match = NAV_ITEMS.find((item) => {
    if (item.to === '/') {
      return pathname === '/';
    }

    return pathname.startsWith(item.to);
  });

  return (
    match ?? {
      to: '/',
      label: 'Página não encontrada',
      icon: LayoutDashboard,
      title: 'Página não encontrada',
      description: 'O endereço acessado não existe',
    }
  );
}

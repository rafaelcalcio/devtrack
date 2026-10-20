import type { Db } from '../db/connection.js';
import { addDays, toISODate, todayISO } from '../lib/dates.js';
import { toGoal, toTask, type GoalRow, type TaskRow } from '../lib/mappers.js';
import type { Activity, CountByStatus, Goal, Task } from '../types.js';
import { createActivityService } from './activity.service.js';
import { calculateProgress } from './project.service.js';

export interface DashboardSummary {
  totals: {
    projects: number;
    activeProjects: number;
    tasks: number;
    pendingTasks: number;
    completedTasks: number;
    overdueTasks: number;
    studyMinutes: number;
    activeGoals: number;
  };
  overallProgress: number;
  tasksByStatus: CountByStatus[];
  tasksByPriority: Array<{ priority: string; count: number }>;
  projectsProgress: Array<{
    id: number;
    name: string;
    color: string;
    progress: number;
    totalTasks: number;
    completedTasks: number;
  }>;
  recentActivities: Activity[];
  upcomingGoals: Goal[];
  tasksDueSoon: Task[];
  productivity: Array<{ date: string; completed: number }>;
  studyByDay: Array<{ date: string; minutes: number }>;
}

export interface CalendarItem {
  id: string;
  type: 'task' | 'project' | 'goal';
  title: string;
  date: string;
  color: string;
  referenceId: number;
}

export interface CalendarMonth {
  month: string;
  items: CalendarItem[];
}

const PRODUCTIVITY_DAYS = 14;
const STUDY_DAYS = 7;

export function createDashboardService(db: Db) {
  const activity = createActivityService(db);
  const today = todayISO();

  function lastDays(count: number): string[] {
    const todayDate = new Date();
    const days: string[] = [];

    for (let index = count - 1; index >= 0; index -= 1) {
      days.push(toISODate(addDays(todayDate, -index)));
    }

    return days;
  }

  function summary(): DashboardSummary {
    const totalsRow = db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM projects) AS projects,
           (SELECT COUNT(*) FROM projects WHERE status = 'active') AS active_projects,
           (SELECT COUNT(*) FROM tasks) AS tasks,
           (SELECT COUNT(*) FROM tasks WHERE status <> 'done') AS pending_tasks,
           (SELECT COUNT(*) FROM tasks WHERE status = 'done') AS completed_tasks,
           (SELECT COUNT(*) FROM tasks
              WHERE status <> 'done' AND due_date IS NOT NULL AND due_date < ?) AS overdue_tasks,
           (SELECT COALESCE(SUM(duration_minutes), 0) FROM study_sessions) AS study_minutes,
           (SELECT COUNT(*) FROM goals WHERE status = 'active') AS active_goals`,
      )
      .get(today) as {
      projects: number;
      active_projects: number;
      tasks: number;
      pending_tasks: number;
      completed_tasks: number;
      overdue_tasks: number;
      study_minutes: number;
      active_goals: number;
    };

    const tasksByStatus = db
      .prepare(`SELECT status, COUNT(*) AS count FROM tasks GROUP BY status ORDER BY count DESC`)
      .all() as CountByStatus[];

    const tasksByPriority = db
      .prepare(
        `SELECT priority, COUNT(*) AS count FROM tasks
         GROUP BY priority
         ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`,
      )
      .all() as Array<{ priority: string; count: number }>;

    const projectRows = db
      .prepare(
        `SELECT p.id, p.name, p.color,
           (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS total_tasks,
           (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') AS completed_tasks
         FROM projects p
         ORDER BY p.updated_at DESC`,
      )
      .all() as Array<{
      id: number;
      name: string;
      color: string;
      total_tasks: number;
      completed_tasks: number;
    }>;

    const projectsProgress = projectRows.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      totalTasks: row.total_tasks,
      completedTasks: row.completed_tasks,
      progress: calculateProgress(row.total_tasks, row.completed_tasks),
    }));

    const overallProgress =
      projectsProgress.length > 0
        ? Math.round(
            projectsProgress.reduce((sum, project) => sum + project.progress, 0) /
              projectsProgress.length,
          )
        : 0;

    const productivityRows = db
      .prepare(
        `SELECT substr(completed_at, 1, 10) AS date, COUNT(*) AS completed
         FROM tasks
         WHERE status = 'done' AND completed_at IS NOT NULL
         GROUP BY date
         ORDER BY date ASC`,
      )
      .all() as Array<{ date: string; completed: number }>;

    const productivityMap = new Map(productivityRows.map((row) => [row.date, row.completed]));

    const productivity = lastDays(PRODUCTIVITY_DAYS).map((date) => ({
      date,
      completed: productivityMap.get(date) ?? 0,
    }));

    const studyRows = db
      .prepare(
        `SELECT studied_on AS date, SUM(duration_minutes) AS minutes
         FROM study_sessions
         GROUP BY studied_on
         ORDER BY studied_on ASC`,
      )
      .all() as Array<{ date: string; minutes: number }>;

    const studyMap = new Map(studyRows.map((row) => [row.date, row.minutes]));

    const studyByDay = lastDays(STUDY_DAYS).map((date) => ({
      date,
      minutes: studyMap.get(date) ?? 0,
    }));

    const goalRows = db
      .prepare(
        `SELECT * FROM goals
         WHERE status = 'active' AND due_date IS NOT NULL
         ORDER BY due_date ASC
         LIMIT 5`,
      )
      .all() as GoalRow[];

    const taskRows = db
      .prepare(
        `SELECT t.*, p.name AS project_name, p.color AS project_color
         FROM tasks t
         LEFT JOIN projects p ON p.id = t.project_id
         WHERE t.status <> 'done' AND t.due_date IS NOT NULL
         ORDER BY t.due_date ASC
         LIMIT 6`,
      )
      .all() as TaskRow[];

    return {
      totals: {
        projects: totalsRow.projects,
        activeProjects: totalsRow.active_projects,
        tasks: totalsRow.tasks,
        pendingTasks: totalsRow.pending_tasks,
        completedTasks: totalsRow.completed_tasks,
        overdueTasks: totalsRow.overdue_tasks,
        studyMinutes: totalsRow.study_minutes,
        activeGoals: totalsRow.active_goals,
      },
      overallProgress,
      tasksByStatus,
      tasksByPriority,
      projectsProgress,
      recentActivities: activity.recent(8),
      upcomingGoals: goalRows.map(toGoal),
      tasksDueSoon: taskRows.map((row) => toTask(row, today)),
      productivity,
      studyByDay,
    };
  }

  function calendar(month: string): CalendarMonth {
    const monthPattern = /^\d{4}-\d{2}$/;
    const safeMonth = monthPattern.test(month) ? month : todayISO().slice(0, 7);
    const start = `${safeMonth}-01`;
    const end = `${safeMonth}-31`;

    const items: CalendarItem[] = [];

    const taskRows = db
      .prepare(
        `SELECT t.id, t.title, t.due_date, p.color AS color
         FROM tasks t
         LEFT JOIN projects p ON p.id = t.project_id
         WHERE t.due_date IS NOT NULL AND t.due_date BETWEEN ? AND ?`,
      )
      .all(start, end) as Array<{ id: number; title: string; due_date: string; color: string | null }>;

    for (const row of taskRows) {
      items.push({
        id: `task-${row.id}`,
        type: 'task',
        title: row.title,
        date: row.due_date,
        color: row.color ?? '#64748b',
        referenceId: row.id,
      });
    }

    const projectRows = db
      .prepare(
        `SELECT id, name, color, start_date, due_date
         FROM projects
         WHERE (start_date IS NOT NULL AND start_date BETWEEN ? AND ?)
            OR (due_date IS NOT NULL AND due_date BETWEEN ? AND ?)`,
      )
      .all(start, end, start, end) as Array<{
      id: number;
      name: string;
      color: string;
      start_date: string | null;
      due_date: string | null;
    }>;

    for (const row of projectRows) {
      if (row.start_date && row.start_date >= start && row.start_date <= end) {
        items.push({
          id: `project-start-${row.id}`,
          type: 'project',
          title: `Início: ${row.name}`,
          date: row.start_date,
          color: row.color,
          referenceId: row.id,
        });
      }

      if (row.due_date && row.due_date >= start && row.due_date <= end) {
        items.push({
          id: `project-due-${row.id}`,
          type: 'project',
          title: `Prazo: ${row.name}`,
          date: row.due_date,
          color: row.color,
          referenceId: row.id,
        });
      }
    }

    const goalRows = db
      .prepare(
        `SELECT id, title, due_date FROM goals
         WHERE due_date IS NOT NULL AND due_date BETWEEN ? AND ?`,
      )
      .all(start, end) as Array<{ id: number; title: string; due_date: string }>;

    for (const row of goalRows) {
      items.push({
        id: `goal-${row.id}`,
        type: 'goal',
        title: row.title,
        date: row.due_date,
        color: '#f59e0b',
        referenceId: row.id,
      });
    }

    items.sort((a, b) => a.date.localeCompare(b.date));

    return { month: safeMonth, items };
  }

  return { summary, calendar };
}

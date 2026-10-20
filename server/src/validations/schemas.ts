import { z } from 'zod';
import {
  GOAL_SCOPES,
  GOAL_STATUSES,
  PRIORITIES,
  PROJECT_STATUSES,
  TASK_STATUSES,
} from '../types.js';

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.');

export const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Informe uma cor hexadecimal válida (ex.: #6366f1).');

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === '' ? undefined : value))
    .optional();

export const optionalDate = dateStringSchema
  .nullish()
  .transform((value) => value ?? null);

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('Identificador inválido.'),
});

const enumField = <T extends readonly [string, ...string[]]>(values: T, label: string) =>
  z.enum(values, {
    message: `Valor inválido para ${label}. Use um destes: ${values.join(', ')}.`,
  });

const projectShape = {
  name: z.string().trim().min(1, 'Informe o nome do projeto.').max(120, 'Nome muito longo.'),
  description: optionalText(2000),
  category: optionalText(60),
  status: enumField(PROJECT_STATUSES, 'status do projeto').optional(),
  priority: enumField(PRIORITIES, 'prioridade').optional(),
  color: hexColorSchema.optional(),
  startDate: optionalDate,
  dueDate: optionalDate,
};

const projectDatesAreValid = (data: { startDate?: string | null; dueDate?: string | null }): boolean =>
  !data.startDate || !data.dueDate || data.dueDate >= data.startDate;

export const projectCreateSchema = z.object(projectShape).refine(projectDatesAreValid, {
  message: 'O prazo não pode ser anterior à data de início.',
  path: ['dueDate'],
});

export const projectUpdateSchema = z
  .object(projectShape)
  .partial()
  .refine(projectDatesAreValid, {
    message: 'O prazo não pode ser anterior à data de início.',
    path: ['dueDate'],
  });

export const projectQuerySchema = z.object({
  status: enumField(PROJECT_STATUSES, 'status do projeto').optional(),
  priority: enumField(PRIORITIES, 'prioridade').optional(),
  category: optionalText(60),
  search: optionalText(120),
});

const taskShape = {
  title: z.string().trim().min(1, 'Informe o título da tarefa.').max(160, 'Título muito longo.'),
  description: optionalText(2000),
  projectId: z.coerce.number().int().positive().nullish().transform((value) => value ?? null),
  status: enumField(TASK_STATUSES, 'status da tarefa').optional(),
  priority: enumField(PRIORITIES, 'prioridade').optional(),
  category: optionalText(60),
  dueDate: optionalDate,
};

export const taskCreateSchema = z.object(taskShape);
export const taskUpdateSchema = z.object(taskShape).partial();

export const taskStatusSchema = z.object({
  status: enumField(TASK_STATUSES, 'status da tarefa'),
});

export const taskQuerySchema = z.object({
  projectId: z.coerce.number().int().positive().optional(),
  status: enumField(TASK_STATUSES, 'status da tarefa').optional(),
  priority: enumField(PRIORITIES, 'prioridade').optional(),
  category: optionalText(60),
  search: optionalText(160),
  overdue: z
    .enum(['true', 'false'], { message: 'Use "true" ou "false" para o filtro de atrasadas.' })
    .optional()
    .transform((value) => value === 'true'),
});

const subjectShape = {
  name: z.string().trim().min(1, 'Informe o nome do assunto.').max(100),
  technology: optionalText(80),
  color: hexColorSchema.optional(),
};

export const subjectCreateSchema = z.object(subjectShape);
export const subjectUpdateSchema = z.object(subjectShape).partial();

const sessionShape = {
  subjectId: z.coerce.number().int().positive('Selecione um assunto de estudo.'),
  studiedOn: dateStringSchema,
  durationMinutes: z.coerce
    .number()
    .int('A duração deve ser um número inteiro.')
    .min(1, 'A duração deve ser de pelo menos 1 minuto.')
    .max(24 * 60, 'A duração não pode passar de 24 horas.'),
  notes: optionalText(2000),
};

export const sessionCreateSchema = z.object(sessionShape);
export const sessionUpdateSchema = z.object(sessionShape).partial();

export const sessionQuerySchema = z.object({
  subjectId: z.coerce.number().int().positive().optional(),
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
});

const goalShape = {
  title: z.string().trim().min(1, 'Informe o título da meta.').max(160),
  description: optionalText(2000),
  scope: enumField(GOAL_SCOPES, 'escopo da meta').optional(),
  progress: z.coerce
    .number()
    .int('O progresso deve ser um número inteiro.')
    .min(0, 'O progresso não pode ser negativo.')
    .max(100, 'O progresso não pode passar de 100.')
    .optional(),
  status: enumField(GOAL_STATUSES, 'status da meta').optional(),
  dueDate: optionalDate,
};

export const goalCreateSchema = z.object(goalShape);
export const goalUpdateSchema = z.object(goalShape).partial();

export const goalQuerySchema = z.object({
  status: enumField(GOAL_STATUSES, 'status da meta').optional(),
  scope: enumField(GOAL_SCOPES, 'escopo da meta').optional(),
  search: optionalText(160),
});

export const calendarQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Use o formato AAAA-MM.')
    .optional(),
});

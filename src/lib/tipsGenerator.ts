import type { Task } from './api';
import type { TipMessages } from './translations';

export interface TaskWithCompletion extends Task {
  completion_count: number;
}

export interface Tip {
  taskId: string;
  taskTitle: string;
  message: string;
  priority: number;
}

function getDayOfWeek(): number {
  const today = new Date();
  const day = today.getDay();
  return day === 0 ? 7 : day;
}

function getDaysUntilSunday(): number {
  return 7 - getDayOfWeek();
}

function getExpectedProgressForDay(targetCount: number): number {
  const dayOfWeek = getDayOfWeek();
  return Math.floor((targetCount / 7) * dayOfWeek);
}

function calculateTaskPriority(task: TaskWithCompletion, dayOfWeek: number): number {
  const completion_percentage = (task.completion_count / task.target_count) * 100;
  const behind = getExpectedProgressForDay(task.target_count) - task.completion_count;
  let priority = 0;
  if (task.completion_count === 0) priority += 100;
  if (behind > 0) priority += behind * 10;
  if (dayOfWeek >= 5 && completion_percentage < 70) priority += 30;
  if (completion_percentage < 30) priority += 20;
  return priority;
}

function generateTipMessage(
  task: TaskWithCompletion,
  dayOfWeek: number,
  daysLeft: number,
  tipMessages: TipMessages,
): string {
  const remaining = task.target_count - task.completion_count;
  const pct = (task.completion_count / task.target_count) * 100;

  let msgs: string[];
  if (dayOfWeek >= 6 && pct < 70) {
    msgs = tipMessages.urgentEndOfWeek(task.title, remaining, daysLeft);
  } else if (task.completion_count === 0) {
    msgs = tipMessages.notStarted(task.title);
  } else if (pct < 50) {
    msgs = tipMessages.farBehind(task.title, remaining, daysLeft);
  } else {
    msgs = tipMessages.almostThere(task.title, remaining);
  }
  return msgs[Math.floor(Math.random() * msgs.length)];
}

export function generateTips(
  tasks: TaskWithCompletion[],
  totalProgress: number,
  tipMessages: TipMessages,
): Tip[] {
  const dayOfWeek = getDayOfWeek();
  const daysLeft = getDaysUntilSunday();

  if (dayOfWeek === 1 || totalProgress >= 85) return [];

  const tasksWithPriority = tasks
    .filter(task => task.completion_count < task.target_count)
    .map(task => ({ task, priority: calculateTaskPriority(task, dayOfWeek) }))
    .sort((a, b) => b.priority - a.priority);

  let maxTips = 0;
  if (dayOfWeek === 2) maxTips = 1;
  else if (dayOfWeek === 3) maxTips = totalProgress < 40 ? 2 : 1;
  else if (dayOfWeek === 4) maxTips = totalProgress < 50 ? 2 : 1;
  else if (dayOfWeek >= 5) maxTips = totalProgress < 60 ? 3 : totalProgress < 75 ? 2 : 1;

  return tasksWithPriority.slice(0, maxTips).map(({ task }) => ({
    taskId: task.id,
    taskTitle: task.title,
    message: generateTipMessage(task, dayOfWeek, daysLeft, tipMessages),
    priority: calculateTaskPriority(task, dayOfWeek),
  }));
}

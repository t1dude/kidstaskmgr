import type { Task } from './api';

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
  const dayOfWeek = getDayOfWeek();
  return 7 - dayOfWeek;
}

function getExpectedProgressForDay(targetCount: number): number {
  const dayOfWeek = getDayOfWeek();
  const expectedPerDay = targetCount / 7;
  return Math.floor(expectedPerDay * dayOfWeek);
}

function calculateTaskPriority(task: TaskWithCompletion, dayOfWeek: number): number {
  const completion_percentage = (task.completion_count / task.target_count) * 100;
  const expected = getExpectedProgressForDay(task.target_count);
  const behind = expected - task.completion_count;

  let priority = 0;

  if (task.completion_count === 0) {
    priority += 100;
  }

  if (behind > 0) {
    priority += behind * 10;
  }

  if (dayOfWeek >= 5 && completion_percentage < 70) {
    priority += 30;
  }

  if (completion_percentage < 30) {
    priority += 20;
  }

  return priority;
}

function generateTipMessage(task: TaskWithCompletion, dayOfWeek: number, daysLeft: number): string {
  const remaining = task.target_count - task.completion_count;
  const completion_percentage = (task.completion_count / task.target_count) * 100;

  const messages = {
    notStarted: [
      `Du har ikke startet med "${task.title}" ennå. Kanskje du kan ta den i dag?`,
      `"${task.title}" venter på deg! Få den unna så er du ett skritt nærmere målet`,
      `Hva med å ta "${task.title}" nå? Det blir kult å se fremgangen!`,
    ],
    farBehind: [
      `Du ligger litt bak på "${task.title}". ${remaining} ganger igjen, men det rekker du!`,
      `"${task.title}" trenger litt kjærlighet! ${remaining} ganger til, you got this`,
      `Kun ${daysLeft} dager igjen! "${task.title}" trenger ${remaining} ganger til`,
    ],
    almostThere: [
      `Nesten i mål med "${task.title}"! Bare ${remaining} gang${remaining > 1 ? 'er' : ''} igjen`,
      `Du er så nære! "${task.title}" mangler bare ${remaining} gang${remaining > 1 ? 'er' : ''}`,
      `Nice! "${task.title}" er nesten ferdig, bare ${remaining} til!`,
    ],
    urgentEndOfWeek: [
      `⚡ Kun ${daysLeft} dag${daysLeft > 1 ? 'er' : ''} igjen! "${task.title}" trenger ${remaining} ganger til`,
      `⚡ Weekend-push! "${task.title}" mangler ${remaining} ganger`,
      `⚡ Siste mulighet! Ta "${task.title}" ${remaining} ganger så er du i mål`,
    ],
  };

  if (dayOfWeek >= 6 && completion_percentage < 70) {
    const randomIndex = Math.floor(Math.random() * messages.urgentEndOfWeek.length);
    return messages.urgentEndOfWeek[randomIndex];
  }

  if (task.completion_count === 0) {
    const randomIndex = Math.floor(Math.random() * messages.notStarted.length);
    return messages.notStarted[randomIndex];
  }

  if (completion_percentage < 50) {
    const randomIndex = Math.floor(Math.random() * messages.farBehind.length);
    return messages.farBehind[randomIndex];
  }

  const randomIndex = Math.floor(Math.random() * messages.almostThere.length);
  return messages.almostThere[randomIndex];
}

export function generateTips(
  tasks: TaskWithCompletion[],
  totalProgress: number
): Tip[] {
  const dayOfWeek = getDayOfWeek();
  const daysLeft = getDaysUntilSunday();

  if (dayOfWeek === 1) {
    return [];
  }

  if (totalProgress >= 85) {
    return [];
  }

  const tasksWithPriority = tasks
    .filter(task => task.completion_count < task.target_count)
    .map(task => ({
      task,
      priority: calculateTaskPriority(task, dayOfWeek),
    }))
    .sort((a, b) => b.priority - a.priority);

  let maxTips = 0;
  if (dayOfWeek === 2) maxTips = 1;
  else if (dayOfWeek === 3) maxTips = totalProgress < 40 ? 2 : 1;
  else if (dayOfWeek === 4) maxTips = totalProgress < 50 ? 2 : 1;
  else if (dayOfWeek >= 5) maxTips = totalProgress < 60 ? 3 : totalProgress < 75 ? 2 : 1;

  const selectedTasks = tasksWithPriority.slice(0, maxTips);

  return selectedTasks.map(({ task }) => ({
    taskId: task.id,
    taskTitle: task.title,
    message: generateTipMessage(task, dayOfWeek, daysLeft),
    priority: calculateTaskPriority(task, dayOfWeek),
  }));
}

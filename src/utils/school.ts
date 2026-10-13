import type { LessonMark, LessonMarks, StarHistoryEntry } from '../types';

export const SCHOOL_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
export const SCHOOL_DAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'];
export const MAX_LESSONS = 10;

/** Local date as YYYY-MM-DD */
export function toDateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Sunday 00:00 of the week containing d */
export function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

/** YYYY-MM-DD → DD/MM */
export function formatShortDate(key: string): string {
  const [, m, d] = key.split('-');
  return `${d}/${m}`;
}

export function dayLetterOf(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return SCHOOL_DAY_LETTERS[new Date(y, m - 1, d).getDay()] ?? '';
}

export interface BehaviorAlert {
  date: string;
  lesson: number;
  mark: LessonMark;
}

/** All "bad behavior" marks, newest first */
export function getBehaviorAlerts(marks?: LessonMarks | null): BehaviorAlert[] {
  const alerts: BehaviorAlert[] = [];
  for (const [date, lessons] of Object.entries(marks ?? {})) {
    for (const [lesson, mark] of Object.entries(lessons ?? {})) {
      if (mark?.type === 'bad') alerts.push({ date, lesson: Number(lesson), mark });
    }
  }
  return alerts.sort((a, b) => (a.date === b.date ? b.lesson - a.lesson : b.date.localeCompare(a.date)));
}

export function countUnseenAlerts(marks?: LessonMarks | null): number {
  return getBehaviorAlerts(marks).filter((a) => !a.mark.seen).length;
}

/** Older versions also logged teacher stars in starHistory; keep only the parents' entries */
export function isParentEntry(entry: StarHistoryEntry): boolean {
  return !entry.approver?.startsWith('המורה ');
}

/** Net stars the parents gave in [from, from + 7 days) — entries without a timestamp are skipped */
export function parentStarsInWeek(history: StarHistoryEntry[], from: Date): number {
  const start = from.getTime();
  const end = addDays(from, 7).getTime();
  return history
    .filter((e) => isParentEntry(e) && e.at != null && e.at >= start && e.at < end)
    .reduce((n, e) => n + (e.action === 'add' ? 1 : -1), 0);
}

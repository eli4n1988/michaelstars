import { useState } from 'react';
import type { LessonMarks, StarHistoryEntry, TeacherInfo } from '../types';
import { SCHOOL_DAYS, SCHOOL_DAY_LETTERS, toDateKey, addDays, startOfWeek, formatShortDate, parentStarsInWeek } from '../utils/school';

interface SchoolWeekTableProps {
  teacher: TeacherInfo;
  lessonMarks: LessonMarks;
  /** When given, the summary shows parent and teacher stars side by side */
  parentHistory?: StarHistoryEntry[];
  /** Show the teacher's note on ⚠️ cells (parents only) */
  showNotes?: boolean;
}

/** Read-only week grid for parents: lessons (rows) × school days (columns) */
export function SchoolWeekTable({ teacher, lessonMarks, parentHistory, showNotes = true }: SchoolWeekTableProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const today = new Date();
  const todayKey = toDateKey(today);
  const weekStart = addDays(startOfWeek(today), weekOffset * 7);
  const days = SCHOOL_DAYS.map((_, d) => toDateKey(addDays(weekStart, d)));
  const maxLessons = Math.max(0, ...teacher.schedule);

  const countOn = (key: string, type: 'star' | 'bad') =>
    Object.values(lessonMarks[key] ?? {}).filter((m) => m?.type === type).length;
  const dayStars = days.map((key) => countOn(key, 'star'));
  const weekStars = dayStars.reduce((a, b) => a + b, 0);
  const weekBad = days.reduce((sum, key) => sum + countOn(key, 'bad'), 0);

  return (
    <div className="swt">
      <div className="tc-week-nav">
        <button className="tc-week-btn" onClick={() => setWeekOffset((w) => w - 1)} aria-label="שבוע קודם">→</button>
        <span>{formatShortDate(days[0])} – {formatShortDate(days[5])}</span>
        <button className="tc-week-btn" onClick={() => setWeekOffset((w) => w + 1)} disabled={weekOffset >= 0} aria-label="שבוע הבא">←</button>
      </div>

      {parentHistory ? (
        <div className="swt-tiles">
          <div className="swt-tile">
            <span className="swt-tile-num">{Math.max(0, parentStarsInWeek(parentHistory, weekStart))}</span>
            <span className="swt-tile-label">👨‍👩‍👧 מההורים</span>
          </div>
          <div className="swt-tile">
            <span className="swt-tile-num">{weekStars}</span>
            <span className="swt-tile-label">🏫 מהמורה</span>
          </div>
        </div>
      ) : (
        <div className="swt-summary">
          <span>⭐ {weekStars} כוכבים השבוע</span>
          {weekBad > 0 && <span className="swt-summary-bad">⚠️ {weekBad}</span>}
        </div>
      )}

      <div className="swt-scroll">
        <table className="swt-table">
          <thead>
            <tr>
              <th />
              {days.map((key, d) => (
                <th key={key} className={key === todayKey ? 'today' : ''}>
                  <div>{SCHOOL_DAY_LETTERS[d]}</div>
                  <div className="swt-date">{formatShortDate(key)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxLessons }, (_, lesson) => (
              <tr key={lesson}>
                <th className="swt-lesson">{lesson + 1}</th>
                {days.map((key, d) => {
                  if (lesson >= (teacher.schedule[d] ?? 0)) {
                    return <td key={key} className="swt-none" />;
                  }
                  const mark = lessonMarks[key]?.[String(lesson)];
                  const future = key > todayKey;
                  return (
                    <td
                      key={key}
                      className={`${mark ? `swt-${mark.type}` : future ? 'swt-future' : 'swt-empty'} ${showNotes ? '' : 'no-notes'}`}
                      title={showNotes && mark?.type === 'bad' && mark.note ? mark.note : undefined}
                      aria-label={`יום ${SCHOOL_DAYS[d]} שיעור ${lesson + 1}: ${
                        mark?.type === 'star' ? 'כוכב' : mark?.type === 'bad' ? 'התנהגות לא טובה' : 'ללא סימון'
                      }`}
                    >
                      {mark?.type === 'star' ? '⭐' : mark?.type === 'bad' ? '⚠️' : future ? '' : '·'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th>סה״כ</th>
              {dayStars.map((n, d) => (
                <td key={d}>{n > 0 ? `⭐${n}` : '–'}</td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

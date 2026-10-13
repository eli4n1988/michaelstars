import { useState } from 'react';
import type { LessonMark } from '../types';
import type { TeacherChildView } from '../hooks/useTeacherChild';
import { SCHOOL_DAYS, SCHOOL_DAY_LETTERS, toDateKey, addDays, startOfWeek, formatShortDate } from '../utils/school';
import { useSound } from '../hooks/useSound';

interface TeacherDayProps {
  child: TeacherChildView & { teacher: NonNullable<TeacherChildView['teacher']> };
  onSetMark: (date: string, lesson: number, mark: LessonMark | null, approver: string) => Promise<void>;
  onEditSchedule: () => void;
  onBack: () => void;
  onLogout: () => void;
}

export function TeacherDay({ child, onSetMark, onEditSchedule, onBack, onLogout }: TeacherDayProps) {
  const today = new Date();
  const todayKey = toDateKey(today);
  const [weekOffset, setWeekOffset] = useState(0);
  // Saturday has no school — fall back to Friday
  const [day, setDay] = useState(Math.min(today.getDay(), 5));
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [badLesson, setBadLesson] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const playSound = useSound();

  const weekStart = addDays(startOfWeek(today), weekOffset * 7);
  const dayKey = toDateKey(addDays(weekStart, day));
  const isFuture = dayKey > todayKey;
  const lessons = child.teacher.schedule[day] ?? 0;
  const dayMarks = child.lessonMarks[dayKey] ?? {};

  const apply = async (lesson: number, mark: LessonMark | null) => {
    setBusy(lesson);
    setError('');
    try {
      await onSetMark(dayKey, lesson, mark, `המורה ${child.teacher.name} · שיעור ${lesson + 1}`);
      if (mark?.type === 'star') playSound('earn');
    } catch (err) {
      console.error('Setting lesson mark failed:', err);
      setError('השמירה נכשלה. בדקו את חיבור האינטרנט ונסו שוב');
    } finally {
      setBusy(null);
    }
  };

  const handleStar = (lesson: number) => {
    const current = dayMarks[lesson];
    apply(lesson, current?.type === 'star' ? null : { type: 'star', at: Date.now() });
  };

  const handleBad = (lesson: number) => {
    if (dayMarks[lesson]?.type === 'bad') {
      apply(lesson, null);
    } else {
      setNote('');
      setBadLesson(lesson);
    }
  };

  const confirmBad = () => {
    if (badLesson === null) return;
    const mark: LessonMark = { type: 'bad', at: Date.now(), seen: false };
    if (note.trim()) mark.note = note.trim();
    apply(badLesson, mark);
    setBadLesson(null);
  };

  const starsOn = (d: number) =>
    Object.values(child.lessonMarks[toDateKey(addDays(weekStart, d))] ?? {}).filter((m) => m?.type === 'star').length;

  return (
    <>
      <div className="tc-topbar">
        <button className="back-btn" onClick={onBack}>תלמידים →</button>
        <button className="back-btn" onClick={onLogout}>התנתק</button>
      </div>

      <h1>{child.childName}</h1>
      <div className="tc-subtitle">שלום {child.teacher.name}! ⭐ {child.stars} כוכבים</div>

      <div className="tc-card">
        <div className="tc-week-nav">
          <button className="tc-week-btn" onClick={() => setWeekOffset((w) => w - 1)} aria-label="שבוע קודם">→</button>
          <span>
            {formatShortDate(toDateKey(weekStart))} – {formatShortDate(toDateKey(addDays(weekStart, 5)))}
          </span>
          <button className="tc-week-btn" onClick={() => setWeekOffset((w) => w + 1)} disabled={weekOffset >= 0} aria-label="שבוע הבא">←</button>
        </div>

        <div className="tc-days">
          {SCHOOL_DAYS.map((name, d) => {
            const key = toDateKey(addDays(weekStart, d));
            const n = starsOn(d);
            return (
              <button
                key={d}
                className={`tc-day ${d === day ? 'active' : ''} ${key === todayKey ? 'today' : ''}`}
                onClick={() => setDay(d)}
                aria-label={`יום ${name} ${formatShortDate(key)}`}
              >
                <span className="tc-day-letter">{SCHOOL_DAY_LETTERS[d]}</span>
                <span className="tc-day-date">{formatShortDate(key)}</span>
                <span className="tc-day-stars">{n > 0 ? `⭐${n}` : ' '}</span>
              </button>
            );
          })}
        </div>

        {isFuture && <div className="tc-info">אי אפשר לסמן יום שעוד לא הגיע</div>}
        {lessons === 0 && <div className="tc-info">אין שיעורים ביום {SCHOOL_DAYS[day]}</div>}

        <div className="tc-lessons">
          {Array.from({ length: lessons }, (_, lesson) => {
            const mark = dayMarks[lesson];
            const disabled = isFuture || busy !== null;
            return (
              <div key={lesson} className={`tc-lesson ${mark?.type ?? ''}`}>
                <div className="tc-lesson-main">
                  <span className="tc-lesson-name">שיעור {lesson + 1}</span>
                  <div className="tc-lesson-actions">
                    <button
                      className={`tc-mark-btn star ${mark?.type === 'star' ? 'on' : ''}`}
                      onClick={() => handleStar(lesson)}
                      disabled={disabled}
                      aria-pressed={mark?.type === 'star'}
                      aria-label={`כוכב על שיעור ${lesson + 1}`}
                    >
                      ⭐
                    </button>
                    <button
                      className={`tc-mark-btn bad ${mark?.type === 'bad' ? 'on' : ''}`}
                      onClick={() => handleBad(lesson)}
                      disabled={disabled}
                      aria-pressed={mark?.type === 'bad'}
                      aria-label={`התנהגות לא טובה בשיעור ${lesson + 1}`}
                    >
                      ⚠️
                    </button>
                  </div>
                </div>
                {mark?.type === 'bad' && mark.note && <div className="tc-lesson-note">{mark.note}</div>}
              </div>
            );
          })}
        </div>

        {error && <div className="tc-error">{error}</div>}
        <div className="tc-legend">⭐ התנהג/ה יפה · ⚠️ התנהגות לא טובה (ההורים יקבלו הודעה)</div>
      </div>

      <button className="reset-btn tc-edit-btn" onClick={onEditSchedule}>✏️ עריכת מערכת השעות</button>

      {badLesson !== null && (
        <div className="confirm-modal-overlay" onClick={() => setBadLesson(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-modal-title">⚠️ שיעור {badLesson + 1}</h3>
            <p className="confirm-modal-message">מה קרה? (לא חובה — ההורים יראו את זה)</p>
            <textarea
              className="tc-note-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="למשל: הפריע בשיעור"
              maxLength={200}
              rows={3}
              autoFocus
            />
            <div className="confirm-modal-actions">
              <button className="confirm-modal-btn danger" onClick={confirmBad}>סמן</button>
              <button className="confirm-modal-btn cancel" onClick={() => setBadLesson(null)}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

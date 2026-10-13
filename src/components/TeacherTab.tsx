import { useState } from 'react';
import type { TeacherData } from '../hooks/useChildData';
import { SCHOOL_DAY_LETTERS, getBehaviorAlerts, formatShortDate, dayLetterOf } from '../utils/school';
import { TEACHER_USERNAME } from '../constants';
import { ConfirmModal } from './ConfirmModal';

interface TeacherTabProps {
  childName: string;
  teacherData: TeacherData;
  onCreateCode: () => Promise<void>;
  onMarkSeen: (date: string, lesson: number) => Promise<void>;
  onReset: () => Promise<void>;
}

export function TeacherTab({ childName, teacherData, onCreateCode, onMarkSeen, onReset }: TeacherTabProps) {
  const { teacherCode, teacher, lessonMarks } = teacherData;
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const alerts = getBehaviorAlerts(lessonMarks);

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      await onCreateCode();
    } catch (err) {
      console.error('Creating teacher code failed:', err);
      setError('שגיאה ביצירת הקוד. נסו שוב');
    } finally {
      setCreating(false);
    }
  };

  const handleSeen = (date: string, lesson: number) => {
    onMarkSeen(date, lesson).catch((err) => {
      console.error('Mark seen failed:', err);
      setError('השמירה נכשלה. נסו שוב');
    });
  };

  return (
    <div className="pd-section">
      <div className="pd-subtitle">⚠️ דיווחי התנהגות</div>
      {alerts.length === 0 ? (
        <div className="pd-empty">אין דיווחים מהמורה 🎉</div>
      ) : (
        <div className="pd-history-list">
          {alerts.map(({ date, lesson, mark }) => (
            <div key={`${date}-${lesson}`} className={`pd-alert ${mark.seen ? 'seen' : ''}`}>
              <div className="pd-alert-text">
                <div className="pd-alert-when">
                  יום {dayLetterOf(date)} {formatShortDate(date)} · שיעור {lesson + 1}
                </div>
                {mark.note && <div className="pd-alert-note">{mark.note}</div>}
              </div>
              {mark.seen ? (
                <span className="pd-alert-done">✓ דיברנו</span>
              ) : (
                <button className="pd-alert-btn" onClick={() => handleSeen(date, lesson)}>
                  ✓ דיברנו
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <hr className="pd-divider" />

      <div className="pd-subtitle">🧑‍🏫 המורה</div>
      {teacher ? (
        <div className="pd-teacher-info">
          <div><b>{teacher.name}</b></div>
          <div className="pd-teacher-schedule">
            {SCHOOL_DAY_LETTERS.map((d, i) => (
              <span key={i}>{d} {teacher.schedule[i] ?? 0}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="pd-empty">עדיין לא חובר/ה מורה</div>
      )}

      <div className="pd-subtitle">🔗 קוד חיבור למורה</div>
      {teacherCode ? (
        <div className="pd-code" dir="ltr">{teacherCode}</div>
      ) : null}
      <div className="pd-help">
        המורה נכנס/ת בתור „מורה" (שם משתמש: <span dir="ltr">{TEACHER_USERNAME}</span>),
        מזין/ה את הקוד, ואז יכול/ה לתת ל{childName} כוכבים על כל שיעור.
      </div>
      <button className="pd-btn pd-btn-save" onClick={handleCreate} disabled={creating}>
        {creating ? '...' : teacherCode ? '🔄 צור קוד חדש' : '➕ צור קוד למורה'}
      </button>
      {error && <div className="pd-warning">{error}</div>}

      {(teacher || teacherCode || alerts.length > 0 || Object.keys(lessonMarks).length > 0) && (
        <>
          <hr className="pd-divider" />
          <button
            className="pd-btn pd-btn-reset"
            style={{ color: '#e53935' }}
            onClick={() => setConfirmReset(true)}
          >
            🗑️ איפוס כל נתוני המורה
          </button>
        </>
      )}

      <ConfirmModal
        isOpen={confirmReset}
        title="🗑️ איפוס נתוני המורה"
        message="למחוק את המורה, מערכת השעות, כל הסימונים והדיווחים, ואת קוד החיבור? (הכוכבים שנצברו נשארים — אפשר לאפס אותם בלשונית „כוכבים”)"
        confirmText="מחק"
        cancelText="ביטול"
        danger
        onConfirm={() => {
          setConfirmReset(false);
          setError('');
          onReset().catch((err) => {
            console.error('Teacher reset failed:', err);
            setError('האיפוס נכשל. נסו שוב');
          });
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}

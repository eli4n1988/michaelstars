import { useState } from 'react';
import type { TeacherData } from '../hooks/useChildData';
import { SCHOOL_DAY_LETTERS, getBehaviorAlerts, formatShortDate, dayLetterOf } from '../utils/school';
import { TEACHER_USERNAME } from '../constants';
import { ConfirmModal } from './ConfirmModal';
import { SchoolWeekTable } from './SchoolWeekTable';

interface TeacherTabProps {
  childName: string;
  teacherData: TeacherData;
  onCreateCode: () => Promise<void>;
  onMarkSeen: (date: string, lesson: number) => Promise<void>;
  onReset: () => Promise<void>;
  onDisconnect: () => Promise<void>;
}

export function TeacherTab({ childName, teacherData, onCreateCode, onMarkSeen, onReset, onDisconnect }: TeacherTabProps) {
  const { teacherCode, teacher, lessonMarks, teacherUids } = teacherData;
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
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
      {teacher && (
        <>
          <div className="pd-subtitle">🏫 כוכבים מהמורה</div>
          <SchoolWeekTable teacher={teacher} lessonMarks={lessonMarks} />
          <hr className="pd-divider" />
        </>
      )}

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
        שלחו את הקוד רק למורה.
      </div>
      <div className="pd-help">
        {teacherUids.length === 0
          ? 'אין מכשירי מורה מחוברים'
          : `מכשירי מורה מחוברים: ${teacherUids.length}`}
      </div>
      <button className="pd-btn pd-btn-save" onClick={handleCreate} disabled={creating}>
        {creating ? '...' : teacherCode ? '🔄 צור קוד חדש' : '➕ צור קוד למורה'}
      </button>
      {error && <div className="pd-warning">{error}</div>}

      {(teacherUids.length > 0 || teacherCode) && (
        <button className="pd-btn pd-btn-reset" onClick={() => setConfirmDisconnect(true)}>
          🔌 נתק את כל המורים
        </button>
      )}

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
        isOpen={confirmDisconnect}
        title="🔌 ניתוק מורים"
        message="לנתק את כל מכשירי המורה ולבטל את קוד החיבור? מערכת השעות והסימונים יישמרו. כדי לחבר שוב צרו קוד חדש."
        confirmText="נתק"
        cancelText="ביטול"
        danger
        onConfirm={() => {
          setConfirmDisconnect(false);
          setError('');
          onDisconnect().catch((err) => {
            console.error('Disconnect failed:', err);
            setError('הניתוק נכשל. נסו שוב');
          });
        }}
        onCancel={() => setConfirmDisconnect(false)}
      />

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

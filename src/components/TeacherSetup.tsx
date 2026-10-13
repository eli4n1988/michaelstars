import { useState } from 'react';
import type { TeacherInfo } from '../types';
import { SCHOOL_DAYS } from '../utils/school';
import { ScheduleBuilder } from './ScheduleBuilder';

interface TeacherSetupProps {
  childName: string;
  initial: TeacherInfo | null;
  onSave: (info: TeacherInfo) => Promise<void>;
  onCancel: () => void;
}

export function TeacherSetup({ childName, initial, onSave, onCancel }: TeacherSetupProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initial?.name ?? '');
  const [schedule, setSchedule] = useState<number[]>(
    () => SCHOOL_DAYS.map((_, i) => initial?.schedule?.[i] ?? 0),
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleNext = () => {
    if (!name.trim()) {
      setError('נא להזין שם');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleFinish = async () => {
    if (schedule.every((n) => n === 0)) {
      setError('נא לקבוע לפחות שיעור אחד');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSave({ name: name.trim(), schedule });
    } catch (err) {
      console.error('Saving teacher setup failed:', err);
      setError('שגיאה בשמירה. נסו שוב');
      setSaving(false);
    }
  };

  const stepIndicator = (
    <div className="step-indicator">
      {[1, 2].map((i) => (
        <span key={i} className={`step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} />
      ))}
    </div>
  );

  return (
    <div className="onboarding">
      {step === 1 && (
        <div className="onboarding-step">
          {stepIndicator}
          <h2>🧑‍🏫 שלום!</h2>
          <p>מה השם שלך? (כך {childName} וההורים יראו אותך)</p>
          <input
            type="text"
            placeholder="שם המורה"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            autoFocus
          />
          <div className="error-msg">{error}</div>
          <button className="onboarding-btn" onClick={handleNext}>הבא</button>
          <button className="modal-cancel" onClick={onCancel}>ביטול</button>
        </div>
      )}

      {step === 2 && (
        <div className="onboarding-step tc-setup-step">
          {stepIndicator}
          <h2>📅 מערכת השעות</h2>
          <p>כמה שיעורים יש ל{childName} בכל יום? לחצו על המשבצות או על + / −</p>
          <ScheduleBuilder schedule={schedule} onChange={setSchedule} />
          <div className="error-msg">{error}</div>
          <button className="onboarding-btn" onClick={handleFinish} disabled={saving}>
            {saving ? '...' : 'סיום'}
          </button>
          <button className="modal-cancel" onClick={() => setStep(1)}>חזרה</button>
        </div>
      )}
    </div>
  );
}

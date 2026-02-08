import { useState } from 'react';
import { ALL_REWARDS } from '../constants';
import type { AppConfig } from '../types';

interface OnboardingProps {
  onComplete: (config: AppConfig) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [selectedPrizes, setSelectedPrizes] = useState<Set<string>>(new Set());
  const [nameError, setNameError] = useState('');
  const [passError, setPassError] = useState('');
  const [prizeError, setPrizeError] = useState('');

  const handleStep1 = () => {
    if (!name.trim()) {
      setNameError('נא להזין שם');
      return;
    }
    setNameError('');
    setStep(2);
  };

  const handleStep2 = () => {
    if (!password) {
      setPassError('נא להזין סיסמה');
      return;
    }
    if (password !== passwordConfirm) {
      setPassError('הסיסמאות לא תואמות');
      return;
    }
    setPassError('');
    setStep(3);
  };

  const togglePrize = (key: string) => {
    setSelectedPrizes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleFinish = () => {
    if (selectedPrizes.size === 0) {
      setPrizeError('נא לבחור לפחות פרס אחד');
      return;
    }
    onComplete({
      childName: name.trim(),
      password,
      selectedRewards: Array.from(selectedPrizes),
    });
  };

  return (
    <div className="onboarding">
      {step === 1 && (
        <div className="onboarding-step">
          <h2>⭐ ברוכים הבאים!</h2>
          <p>מה השם של הילד/ה?</p>
          <input
            type="text"
            placeholder="שם הילד/ה"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStep1()}
            autoFocus
          />
          <div className="error-msg">{nameError}</div>
          <button className="onboarding-btn" onClick={handleStep1}>הבא ←</button>
        </div>
      )}

      {step === 2 && (
        <div className="onboarding-step">
          <h2>🔒 סיסמת הורה</h2>
          <p>בחרו סיסמה להגנה על פעולות הורה</p>
          <input
            type="password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <input
            type="password"
            placeholder="אימות סיסמה"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStep2()}
          />
          <div className="error-msg">{passError}</div>
          <button className="onboarding-btn" onClick={handleStep2}>הבא ←</button>
        </div>
      )}

      {step === 3 && (
        <div className="onboarding-step">
          <h2>🎁 בחרו פרסים!</h2>
          <p>לחצו לבחירת הפרסים (לפחות 1)</p>
          <div className="prize-grid">
            {Object.entries(ALL_REWARDS).map(([key, r]) => (
              <div
                key={key}
                className={`prize-option ${selectedPrizes.has(key) ? 'selected' : ''}`}
                onClick={() => togglePrize(key)}
              >
                <span className="prize-emoji">{r.emoji}</span>
                <span className="prize-name">{r.name}</span>
                <span className="prize-cost">{r.cost} ⭐</span>
              </div>
            ))}
          </div>
          <div className="error-msg">{prizeError}</div>
          <button className="onboarding-btn" onClick={handleFinish}>!סיים</button>
        </div>
      )}
    </div>
  );
}

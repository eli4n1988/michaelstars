import { useState } from 'react';
import { TEACHER_USERNAME, TEACHER_PASSWORD } from '../constants';

interface TeacherLoginProps {
  onLogin: (password: string) => Promise<void>;
  onBack: () => void;
}

export function TeacherLogin({ onLogin, onBack }: TeacherLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (username.trim().toLowerCase() !== TEACHER_USERNAME || password !== TEACHER_PASSWORD) {
      setError('שם משתמש או סיסמה שגויים');
      return;
    }
    setLoading(true);
    try {
      await onLogin(password);
    } catch (err) {
      console.error('Teacher login failed:', err);
      setError('שגיאה בהתחברות. בדקו את חיבור האינטרנט ונסו שוב');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding">
      <div className="onboarding-step">
        <h2>🧑‍🏫 כניסת מורה</h2>
        <p>הזינו שם משתמש וסיסמה</p>
        <input
          type="text"
          placeholder="שם משתמש"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          dir="ltr"
          className="login-input-ltr"
        />
        <input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          dir="ltr"
          className="login-input-ltr"
        />
        <div className="error-msg">{error}</div>
        <button className="onboarding-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? '...' : 'כניסה'}
        </button>
        <button className="modal-cancel login-toggle-btn" onClick={onBack}>
          חזרה
        </button>
      </div>
    </div>
  );
}

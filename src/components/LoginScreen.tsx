import { useState } from 'react';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string) => Promise<void>;
}

export function LoginScreen({ onLogin, onRegister }: LoginScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email.trim()) {
      setError('נא להזין אימייל');
      return;
    }
    if (!password) {
      setError('נא להזין סיסמה');
      return;
    }
    if (isRegister && password !== passwordConfirm) {
      setError('הסיסמאות לא תואמות');
      return;
    }
    if (isRegister && password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await onRegister(email.trim(), password);
      } else {
        await onLogin(email.trim(), password);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setError('אימייל או סיסמה שגויים');
      } else if (code === 'auth/email-already-in-use') {
        setError('האימייל כבר רשום. נסו להתחבר');
      } else if (code === 'auth/weak-password') {
        setError('הסיסמה חלשה מדי (לפחות 6 תווים)');
      } else if (code === 'auth/invalid-email') {
        setError('כתובת אימייל לא תקינה');
      } else {
        setError('שגיאה בהתחברות. נסו שוב');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding">
      <div className="onboarding-step">
        <h2>⭐ כוכבים!</h2>
        <p>{isRegister ? 'צרו חשבון חדש' : 'התחברו לחשבון שלכם'}</p>

        <input
          type="text"
          placeholder="אימייל"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
          dir="ltr"
          style={{ textAlign: 'center' }}
        />

        <input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isRegister && handleSubmit()}
          dir="ltr"
          style={{ textAlign: 'center' }}
        />

        {isRegister && (
          <input
            type="password"
            placeholder="אימות סיסמה"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            dir="ltr"
            style={{ textAlign: 'center' }}
          />
        )}

        <div className="error-msg">{error}</div>

        <button
          className="onboarding-btn"
          onClick={handleSubmit}
          disabled={loading}
          style={loading ? { opacity: 0.6 } : undefined}
        >
          {loading ? '...' : isRegister ? 'הרשמה' : 'התחברות'}
        </button>

        <button
          className="modal-cancel"
          onClick={() => {
            setIsRegister(!isRegister);
            setError('');
          }}
          style={{ marginTop: '15px', display: 'block', width: '100%' }}
        >
          {isRegister ? 'כבר יש לי חשבון — התחברות' : 'אין לי חשבון — הרשמה'}
        </button>
      </div>
    </div>
  );
}

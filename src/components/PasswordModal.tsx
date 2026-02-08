import { useState, useRef, useEffect } from 'react';

interface PasswordModalProps {
  isOpen: boolean;
  password: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function PasswordModal({ isOpen, password, onSuccess, onClose }: PasswordModalProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInput('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (input !== password) {
      setError('סיסמה שגויה');
      return;
    }
    onSuccess();
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`}>
      <div className="password-modal">
        <h3>🔒 הזינו סיסמת הורה</h3>
        <input
          type="password"
          placeholder="סיסמה"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          ref={inputRef}
        />
        <div className="error-msg">{error}</div>
        <button className="onboarding-btn" onClick={handleSubmit} style={{ marginLeft: '10px' }}>
          אישור
        </button>
        <button className="modal-cancel" onClick={onClose}>ביטול</button>
      </div>
    </div>
  );
}

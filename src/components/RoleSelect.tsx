interface RoleSelectProps {
  onSelect: (role: 'parent' | 'teacher') => void;
}

export function RoleSelect({ onSelect }: RoleSelectProps) {
  return (
    <div className="onboarding">
      <div className="onboarding-step">
        <h2>⭐ כוכבים!</h2>
        <p>איך נכנסים היום?</p>
        <div className="role-grid">
          <button className="role-btn" onClick={() => onSelect('parent')}>
            <span className="role-emoji">👨‍👩‍👧</span>
            <span className="role-label">הורה</span>
          </button>
          <button className="role-btn" onClick={() => onSelect('teacher')}>
            <span className="role-emoji">🧑‍🏫</span>
            <span className="role-label">מורה</span>
          </button>
        </div>
      </div>
    </div>
  );
}

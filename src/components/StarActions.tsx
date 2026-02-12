import type { RefObject } from 'react';

interface StarActionsProps {
  onAdd: () => void;
  onRemove: () => void;
  addBtnRef: RefObject<HTMLButtonElement | null>;
  disabled?: boolean;
}

export function StarActions({ onAdd, onRemove, addBtnRef, disabled }: StarActionsProps) {
  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '40px', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <button
          className="add-star-btn"
          onClick={onAdd}
          title="הוסף כוכב על התנהגות טובה!"
          aria-label="הוסף כוכב"
          ref={addBtnRef}
          disabled={disabled}
          style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
        >
          ⭐
          <span className="tooltip">הוסף כוכב</span>
        </button>
        <button
          className="remove-star-btn"
          onClick={onRemove}
          title="הסר כוכב על התנהגות לא טובה"
          aria-label="הסר כוכב"
          disabled={disabled}
          style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
        >
          ❌
          <span className="tooltip">הסר כוכב</span>
        </button>
      </div>
      {disabled && (
        <span className="star-disabled-msg">
          ⏳ כבר השתמשת בכוכב היום — נסו שוב מחר!
        </span>
      )}
    </div>
  );
}

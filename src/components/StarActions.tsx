import type { RefObject } from 'react';

interface StarActionsProps {
  onAdd: () => void;
  onRemove: () => void;
  addBtnRef: RefObject<HTMLButtonElement | null>;
}

export function StarActions({ onAdd, onRemove, addBtnRef }: StarActionsProps) {
  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '40px', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <button
          className="add-star-btn"
          onClick={onAdd}
          title="הוסף כוכב על התנהגות טובה!"
          aria-label="הוסף כוכב"
          ref={addBtnRef}
        >
          ⭐
          <span className="tooltip">הוסף כוכב</span>
        </button>
        <button
          className="remove-star-btn"
          onClick={onRemove}
          title="הסר כוכב על התנהגות לא טובה"
          aria-label="הסר כוכב"
        >
          ❌
          <span className="tooltip">הסר כוכב</span>
        </button>
      </div>
    </div>
  );
}

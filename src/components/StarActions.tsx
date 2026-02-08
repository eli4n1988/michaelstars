import type { RefObject } from 'react';

interface StarActionsProps {
  onAdd: () => void;
  onRemove: () => void;
  addBtnRef: RefObject<HTMLButtonElement | null>;
}

export function StarActions({ onAdd, onRemove, addBtnRef }: StarActionsProps) {
  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px' }}>
      <button
        className="add-star-btn"
        onClick={onAdd}
        title="הוסף כוכב על התנהגות טובה!"
        ref={addBtnRef}
      >
        ⭐
        <span className="tooltip">הוסף כוכב</span>
      </button>
      <button
        className="remove-star-btn"
        onClick={onRemove}
        title="הסר כוכב על התנהגות לא טובה"
      >
        ❌
        <span className="tooltip">הסר כוכב</span>
      </button>
    </div>
  );
}

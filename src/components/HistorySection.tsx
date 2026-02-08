import type { HistoryEntry } from '../types';

interface HistorySectionProps {
  history: HistoryEntry[];
  onDelete: (index: number) => void;
}

export function HistorySection({ history, onDelete }: HistorySectionProps) {
  return (
    <div className="history">
      <h2>היסטוריית פרסים</h2>
      <ul className="history-list">
        {history.length === 0 ? (
          <li className="empty">עדיין לא מימשת פרסים. המשך לאסוף כוכבים!</li>
        ) : (
          history.map((h, i) => (
            <li key={i}>
              <span>{h.emoji} {h.name}</span>
              <span>
                {h.date}
                <button
                  className="delete-btn"
                  onClick={() => onDelete(i)}
                  title="מחק"
                >
                  ✕
                </button>
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

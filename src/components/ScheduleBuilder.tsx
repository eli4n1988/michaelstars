import { SCHOOL_DAYS, SCHOOL_DAY_LETTERS, MAX_LESSONS } from '../utils/school';

interface ScheduleBuilderProps {
  schedule: number[];
  onChange: (schedule: number[]) => void;
}

/** Interactive weekly bar chart: tap a cell to set the number of lessons that day */
export function ScheduleBuilder({ schedule, onChange }: ScheduleBuilderProps) {
  const setDay = (day: number, count: number) => {
    const next = [...schedule];
    next[day] = Math.max(0, Math.min(MAX_LESSONS, count));
    onChange(next);
  };

  return (
    <div className="sb-grid">
      {SCHOOL_DAYS.map((dayName, day) => {
        const count = schedule[day] ?? 0;
        return (
          <div key={day} className="sb-col">
            <div className="sb-count">{count}</div>
            <div className="sb-stack">
              {Array.from({ length: MAX_LESSONS }, (_, k) => {
                const filled = k < count;
                return (
                  <button
                    key={k}
                    type="button"
                    className={`sb-cell ${filled ? 'filled' : ''}`}
                    // Tapping the top filled cell removes it; any other cell sets the height
                    onClick={() => setDay(day, k + 1 === count ? k : k + 1)}
                    aria-label={`יום ${dayName}: ${k + 1} שיעורים`}
                  >
                    {filled ? k + 1 : ''}
                  </button>
                );
              })}
            </div>
            <div className="sb-day">{SCHOOL_DAY_LETTERS[day]}</div>
            <div className="sb-steppers">
              <button type="button" className="sb-step" onClick={() => setDay(day, count + 1)} disabled={count >= MAX_LESSONS} aria-label={`הוסף שיעור ביום ${dayName}`}>+</button>
              <button type="button" className="sb-step" onClick={() => setDay(day, count - 1)} disabled={count <= 0} aria-label={`הורד שיעור ביום ${dayName}`}>−</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

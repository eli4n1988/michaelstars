interface ParentZoneProps {
  onReset: () => void;
}

export function ParentZone({ onReset }: ParentZoneProps) {
  return (
    <div className="parent-zone">
      <button className="reset-btn" onClick={onReset}>
        הורה: אפס כוכבים
      </button>
    </div>
  );
}

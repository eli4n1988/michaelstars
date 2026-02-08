interface StarCounterProps {
  stars: number;
}

export function StarCounter({ stars }: StarCounterProps) {
  return (
    <div className="star-count">
      <div className="label">הכוכבים שלי</div>
      <div><span className="number">{stars}</span></div>
    </div>
  );
}

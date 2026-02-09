interface StarCounterProps {
  stars: number;
}

export function StarCounter({ stars }: StarCounterProps) {
  return (
    <div className="star-count">
      <div><span className="number">{stars}</span></div>
    </div>
  );
}

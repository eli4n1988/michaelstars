interface StarGridProps {
  stars: number;
}

export function StarGrid({ stars }: StarGridProps) {
  const displayCount = Math.min(stars, 30);

  return (
    <div className="star-display">
      {Array.from({ length: displayCount }, (_, i) => (
        <span
          key={i}
          className="star"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          ⭐
        </span>
      ))}
      {stars > 30 && (
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', alignSelf: 'center' }}>
          +{stars - 30} נוספים
        </span>
      )}
    </div>
  );
}

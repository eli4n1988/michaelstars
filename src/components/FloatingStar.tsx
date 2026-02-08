import { useEffect, useState } from 'react';

interface FloatingStarProps {
  trigger: number;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

interface StarPos {
  left: number;
  top: number;
  id: number;
}

export function FloatingStar({ trigger, buttonRef }: FloatingStarProps) {
  const [stars, setStars] = useState<StarPos[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    const btn = buttonRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const newStar: StarPos = {
      left: rect.left + rect.width / 2 - 16,
      top: rect.top,
      id: Date.now(),
    };

    setStars((prev) => [...prev, newStar]);

    const timer = setTimeout(() => {
      setStars((prev) => prev.filter((s) => s.id !== newStar.id));
    }, 1000);

    return () => clearTimeout(timer);
  }, [trigger, buttonRef]);

  return (
    <>
      {stars.map((s) => (
        <div
          key={s.id}
          className="float-star"
          style={{ left: `${s.left}px`, top: `${s.top}px` }}
        >
          ⭐
        </div>
      ))}
    </>
  );
}

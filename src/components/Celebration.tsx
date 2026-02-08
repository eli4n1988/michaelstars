import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  emoji: string;
  left: string;
  delay: string;
  duration: string;
}

interface CelebrationProps {
  active: boolean;
  onDone: () => void;
}

const EMOJIS = ['⭐', '✨', '🎉', '🎊', '❤️', '🌟'];

export function Celebration({ active, onDone }: CelebrationProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active) return;

    const newPieces: ConfettiPiece[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 0.5}s`,
      duration: `${2 + Math.random() * 2}s`,
    }));
    setPieces(newPieces);

    const timer = setTimeout(() => {
      setPieces([]);
      onDone();
    }, 4000);

    return () => clearTimeout(timer);
  }, [active, onDone]);

  return (
    <div className="celebration">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
}

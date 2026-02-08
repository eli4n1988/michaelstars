import type { Reward } from '../types';

interface RewardCardProps {
  rewardKey: string;
  reward: Reward;
  stars: number;
  onClaim: (key: string, cost: number) => void;
}

export function RewardCard({ rewardKey, reward, stars, onClaim }: RewardCardProps) {
  const canClaim = stars >= reward.cost;
  const needed = reward.cost - stars;

  return (
    <div className="reward-card">
      <span className="emoji">{reward.emoji}</span>
      <div className="name">{reward.name}!</div>
      <div className="cost">
        <span className="star-cost">⭐ {reward.cost} כוכבים</span>
      </div>
      <div className="stars-needed">
        {Array.from({ length: reward.cost }, (_, i) => (
          <span key={i} className={`pip ${i < stars ? 'filled' : 'empty'}`}>
            ⭐
          </span>
        ))}
      </div>
      <button
        className={`claim-btn ${canClaim ? 'available' : 'locked'}`}
        onClick={() => canClaim && onClaim(rewardKey, reward.cost)}
      >
        {canClaim ? 'קבל את הפרס!' : `חסרים ${needed} כוכבים`}
      </button>
    </div>
  );
}

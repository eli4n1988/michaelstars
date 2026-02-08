import type { Reward } from '../types';
import { RewardCard } from './RewardCard';

interface RewardsSectionProps {
  rewards: Record<string, Reward>;
  stars: number;
  onClaim: (key: string, cost: number) => void;
}

export function RewardsSection({ rewards, stars, onClaim }: RewardsSectionProps) {
  return (
    <div className="rewards">
      {Object.entries(rewards).map(([key, reward]) => (
        <RewardCard
          key={key}
          rewardKey={key}
          reward={reward}
          stars={stars}
          onClaim={onClaim}
        />
      ))}
    </div>
  );
}

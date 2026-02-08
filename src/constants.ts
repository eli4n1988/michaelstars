import type { Reward } from './types';

export const STORAGE_KEY = 'starRewardsApp';
export const CONFIG_KEY = 'starRewardsConfig';

export const ALL_REWARDS: Record<string, Reward> = {
  candy:    { name: 'ממתקים', emoji: '🍬', cost: 2 },
  stickers: { name: 'מדבקות', emoji: '🌟', cost: 2 },
  pizza:    { name: 'פיצה', emoji: '🍕', cost: 3 },
  screen:   { name: 'זמן מסך', emoji: '📱', cost: 3 },
  movie:    { name: 'סרט ופופקורן', emoji: '🎦🍿', cost: 4 },
  park:     { name: 'פארק שעשועים', emoji: '🎡', cost: 4 },
  pool:     { name: 'בריכה וגלידה', emoji: '🏊🍨', cost: 5 },
  puzzle:   { name: 'פאזל', emoji: '🧩', cost: 5 },
  toy:      { name: 'צעצוע חדש', emoji: '🧸', cost: 5 },
};

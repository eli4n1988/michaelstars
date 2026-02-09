export interface Reward {
  name: string;
  emoji: string;
  cost: number;
}

export interface HistoryEntry {
  name: string;
  emoji: string;
  date: string;
}

export interface AppState {
  stars: number;
  history: HistoryEntry[];
  lastStarDate?: string; // ISO date string (YYYY-MM-DD) of last star add/remove
}

export interface AppConfig {
  childName: string;
  password: string;
  selectedRewards: string[];
}

export type PendingAction = 'add' | 'remove' | null;

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
}

export interface AppConfig {
  childName: string;
  password: string;
  selectedRewards: string[];
}

export type PendingAction = 'add' | 'remove' | null;

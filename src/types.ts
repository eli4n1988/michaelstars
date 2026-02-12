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

export interface StarHistoryEntry {
  action: 'add' | 'remove';
  date: string;
  approver: string;
}

export interface AppState {
  stars: number;
  history: HistoryEntry[];
  starHistory?: StarHistoryEntry[];
  lastStarDate?: string; // local date string (YYYY-MM-DD) of last star add/remove
}

export interface AppConfig {
  childName: string;
  password: string;
  selectedRewards: string[];
  customCosts?: Record<string, number>;
}

/** Combined type representing a child document in Firestore */
export type ChildProfile = AppConfig & AppState;

export type PendingAction = 'add' | 'remove' | null;

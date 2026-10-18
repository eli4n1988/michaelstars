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
  /** ms timestamp (entries from before Oct 2026 don't have one) */
  at?: number;
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

/** Teacher-side data stored on the child document */
export interface TeacherInfo {
  name: string;
  /** Number of lessons per school day, index 0 = Sunday … 5 = Friday */
  schedule: number[];
}

export interface LessonMark {
  type: 'star' | 'bad';
  at: number;
  note?: string;
  /** Parent has talked with the child about this (bad marks only) */
  seen?: boolean;
}

/** lessonMarks[YYYY-MM-DD][lessonIndex] */
export type LessonMarks = Record<string, Record<string, LessonMark>>;

/** A student linked on the teacher's device */
export interface TeacherLink {
  parentUid: string;
  childId: string;
  childName: string;
  /** Link code used to join (lets a personal link re-join after the session is lost) */
  code?: string;
}

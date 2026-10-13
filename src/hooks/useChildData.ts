import { useState, useEffect, useCallback, useRef } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  FieldPath,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { AppState, AppConfig, TeacherInfo, LessonMarks } from '../types';

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
}

export interface TeacherData {
  teacherCode: string | null;
  teacher: TeacherInfo | null;
  lessonMarks: LessonMarks;
}

const DEFAULT_TEACHER_DATA: TeacherData = { teacherCode: null, teacher: null, lessonMarks: {} };

const DEFAULT_STATE: AppState = { stars: 0, history: [] };

/** Recursively replace undefined with null so Firestore doesn't reject the write */
function stripUndefined(obj: unknown): unknown {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    clean[k] = stripUndefined(v);
  }
  return clean;
}

/**
 * Hook that subscribes to a child's Firestore document and provides
 * config/state getters and setters compatible with the existing app logic.
 */
export function useChildData(userId: string, childId: string) {
  const [config, setConfigLocal] = useState<AppConfig | null>(null);
  const [state, setStateLocal] = useState<AppState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [teacherData, setTeacherData] = useState<TeacherData>(DEFAULT_TEACHER_DATA);

  const stateRef = useRef(state);
  stateRef.current = state;
  const configRef = useRef(config);
  configRef.current = config;

  const docRef = doc(db, 'users', userId, 'children', childId);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setConfigLocal({
          childName: data.childName ?? '',
          password: data.password ?? '',
          selectedRewards: data.selectedRewards ?? [],
          customCosts: data.customCosts,
        });
        const newState: AppState = {
          stars: data.stars ?? 0,
          history: data.history ?? [],
          starHistory: data.starHistory ?? [],
          lastStarDate: data.lastStarDate,
        };
        setStateLocal(newState);
        stateRef.current = newState;
        setTeacherData({
          teacherCode: data.teacherCode ?? null,
          teacher: data.teacher ?? null,
          lessonMarks: data.lessonMarks ?? {},
        });
      } else {
        setTeacherData(DEFAULT_TEACHER_DATA);
        setConfigLocal(null);
        setStateLocal(DEFAULT_STATE);
        stateRef.current = DEFAULT_STATE;
      }
      setLoading(false);
    });
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, childId]);

  const writeDoc = useCallback(
    (newConfig: AppConfig, newState: AppState) => {
      const data = stripUndefined({
        childName: newConfig.childName,
        password: newConfig.password,
        selectedRewards: newConfig.selectedRewards,
        customCosts: newConfig.customCosts ?? null,
        stars: newState.stars,
        history: newState.history,
        starHistory: newState.starHistory ?? [],
        lastStarDate: newState.lastStarDate ?? null,
      }) as Record<string, unknown>;
      setWriteError(null);
      setDoc(docRef, data, { merge: true }).catch((err) => {
        console.error('Firestore write failed:', err);
        setWriteError(String(err));
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, childId],
  );

  const setState = useCallback(
    (action: AppState | ((prev: AppState) => AppState)) => {
      const prev = stateRef.current;
      const next = typeof action === 'function' ? action(prev) : action;
      setStateLocal(next);
      stateRef.current = next;
      if (configRef.current) {
        writeDoc(configRef.current, next);
      }
    },
    [writeDoc],
  );

  const setConfig = useCallback(
    (newConfig: AppConfig | null) => {
      if (newConfig === null) {
        deleteDoc(docRef);
        setConfigLocal(null);
        setStateLocal(DEFAULT_STATE);
        stateRef.current = DEFAULT_STATE;
      } else {
        setConfigLocal(newConfig);
        configRef.current = newConfig;
        writeDoc(newConfig, stateRef.current);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [writeDoc],
  );

  /** Create a new teacher link code (replacing any previous one) */
  const createTeacherCode = useCallback(async () => {
    const oldCode = teacherData.teacherCode;
    let code = '';
    for (let attempt = 0; ; attempt++) {
      code = randomCode();
      try {
        // Rules only allow creating a code that doesn't exist yet
        await setDoc(doc(db, 'teacherLinks', code), { parentUid: userId, childId });
        break;
      } catch (err) {
        if (attempt >= 4) throw err;
      }
    }
    await updateDoc(docRef, { teacherCode: code });
    if (oldCode) {
      deleteDoc(doc(db, 'teacherLinks', oldCode)).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, childId, teacherData.teacherCode]);

  const markAlertSeen = useCallback(
    (date: string, lesson: number) =>
      updateDoc(docRef, new FieldPath('lessonMarks', date, String(lesson), 'seen'), true),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, childId],
  );

  return {
    config, state, setConfig, setState, loading, writeError,
    teacherData, createTeacherCode, markAlertSeen,
  };
}

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { AppState, AppConfig } from '../types';

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

  // Keep latest values in refs for use in callbacks
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
        setStateLocal({
          stars: data.stars ?? 0,
          history: data.history ?? [],
          starHistory: data.starHistory ?? [],
          lastStarDate: data.lastStarDate,
        });
      } else {
        setConfigLocal(null);
        setStateLocal(DEFAULT_STATE);
      }
      setLoading(false);
    });
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, childId]);

  // Merge-write only the fields the web app manages
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
      setDoc(docRef, data, { merge: true }).catch((err) => {
        console.error('Firestore write failed:', err);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, childId],
  );

  const setState = useCallback(
    (action: AppState | ((prev: AppState) => AppState)) => {
      const prev = stateRef.current;
      const next = typeof action === 'function' ? action(prev) : action;
      // Optimistic local update
      setStateLocal(next);
      stateRef.current = next;
      // Write to Firestore
      if (configRef.current) {
        writeDoc(configRef.current, next);
      }
    },
    [writeDoc],
  );

  const setConfig = useCallback(
    (newConfig: AppConfig | null) => {
      if (newConfig === null) {
        // Delete the child document
        deleteDoc(docRef);
        setConfigLocal(null);
        setStateLocal(DEFAULT_STATE);
      } else {
        setConfigLocal(newConfig);
        configRef.current = newConfig;
        writeDoc(newConfig, stateRef.current);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [writeDoc],
  );

  return { config, state, setConfig, setState, loading };
}

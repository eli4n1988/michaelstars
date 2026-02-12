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

  // Write the full document to Firestore from config + state
  const writeDoc = useCallback(
    (newConfig: AppConfig, newState: AppState) => {
      setDoc(docRef, {
        childName: newConfig.childName,
        password: newConfig.password,
        selectedRewards: newConfig.selectedRewards,
        customCosts: newConfig.customCosts ?? null,
        stars: newState.stars,
        history: newState.history,
        starHistory: newState.starHistory ?? [],
        lastStarDate: newState.lastStarDate ?? null,
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

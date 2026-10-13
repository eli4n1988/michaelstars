import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  runTransaction,
  deleteField,
  FieldPath,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { LessonMark, LessonMarks, StarHistoryEntry, TeacherInfo } from '../types';

export interface TeacherChildView {
  childName: string;
  stars: number;
  teacher: TeacherInfo | null;
  lessonMarks: LessonMarks;
}

/**
 * Teacher-side access to a child document. The teacher may only change
 * stars, starHistory, teacher and lessonMarks (enforced in firestore.rules).
 */
export function useTeacherChild(parentUid: string, childId: string) {
  const [child, setChild] = useState<TeacherChildView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const docRef = useMemo(
    () => doc(db, 'users', parentUid, 'children', childId),
    [parentUid, childId],
  );

  useEffect(() => {
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setChild({
            childName: data.childName ?? '',
            stars: data.stars ?? 0,
            teacher: data.teacher ?? null,
            lessonMarks: data.lessonMarks ?? {},
          });
        } else {
          setChild(null);
        }
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error('Teacher snapshot failed:', err);
        setChild(null);
        setError(String(err));
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [docRef]);

  const saveTeacher = useCallback(
    (info: TeacherInfo) => setDoc(docRef, { teacher: info }, { merge: true }),
    [docRef],
  );

  /** Set (or clear, with null) the mark for one lesson; keeps the star count in sync */
  const setMark = useCallback(
    (date: string, lesson: number, mark: LessonMark | null, approver: string) =>
      runTransaction(db, async (tx) => {
        const snap = await tx.get(docRef);
        if (!snap.exists()) throw new Error('child not found');
        const data = snap.data();
        const prev: LessonMark | undefined = data.lessonMarks?.[date]?.[String(lesson)];
        const delta = (mark?.type === 'star' ? 1 : 0) - (prev?.type === 'star' ? 1 : 0);

        let stars: number = data.stars ?? 0;
        let starHistory: StarHistoryEntry[] = data.starHistory ?? [];
        if (delta !== 0) {
          stars = Math.max(0, stars + delta);
          const dateStr = new Date().toLocaleDateString('he-IL', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          });
          starHistory = [
            { action: delta > 0 ? ('add' as const) : ('remove' as const), date: dateStr, approver },
            ...starHistory,
          ].slice(0, 50);
        }

        tx.update(
          docRef,
          'stars', stars,
          'starHistory', starHistory,
          new FieldPath('lessonMarks', date, String(lesson)), mark ?? deleteField(),
        );
      }),
    [docRef],
  );

  return { child, loading, error, saveTeacher, setMark };
}

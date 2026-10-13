import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '../firebase';
import { TEACHER_EMAIL } from '../constants';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  /** Sign in to the shared teacher account, creating it on first use */
  const loginTeacher = async (password: string) => {
    try {
      await signInWithEmailAndPassword(auth, TEACHER_EMAIL, password);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== 'auth/invalid-credential' && code !== 'auth/user-not-found') throw err;
      await createUserWithEmailAndPassword(auth, TEACHER_EMAIL, password);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return { user, loading, login, register, loginTeacher, logout };
}

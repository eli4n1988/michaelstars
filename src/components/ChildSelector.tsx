import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { AppConfig } from '../types';
import { Onboarding } from './Onboarding';
import { STORAGE_KEY, CONFIG_KEY } from '../constants';

interface ChildSelectorProps {
  userId: string;
  onSelect: (childId: string) => void;
  onLogout: () => Promise<void>;
}

interface ChildSummary {
  id: string;
  childName: string;
  stars: number;
}

export function ChildSelector({ userId, onSelect, onLogout }: ChildSelectorProps) {
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const [migrationAvailable, setMigrationAvailable] = useState(false);

  useEffect(() => {
    const colRef = collection(db, 'users', userId, 'children');
    const unsubscribe = onSnapshot(colRef, (snap) => {
      const kids: ChildSummary[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        kids.push({
          id: doc.id,
          childName: data.childName ?? 'ילד/ה',
          stars: data.stars ?? 0,
        });
      });
      setChildren(kids);
      setLoading(false);
    });
    return unsubscribe;
  }, [userId]);

  // Check for localStorage migration data
  useEffect(() => {
    const hasState = localStorage.getItem(STORAGE_KEY);
    const hasConfig = localStorage.getItem(CONFIG_KEY);
    if (hasState && hasConfig) {
      setMigrationAvailable(true);
    }
  }, []);

  const handleMigrate = async () => {
    try {
      const stateData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const configData = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');

      const colRef = collection(db, 'users', userId, 'children');
      const docRef = await addDoc(colRef, {
        childName: configData.childName ?? 'ילד/ה',
        password: configData.password ?? '',
        selectedRewards: configData.selectedRewards ?? [],
        customCosts: configData.customCosts ?? null,
        stars: stateData.stars ?? 0,
        history: stateData.history ?? [],
        starHistory: stateData.starHistory ?? [],
        lastStarDate: stateData.lastStarDate ?? null,
      });

      // Clear localStorage after successful migration
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CONFIG_KEY);
      setMigrationAvailable(false);

      // Select the migrated child
      onSelect(docRef.id);
    } catch {
      alert('שגיאה בייבוא הנתונים');
    }
  };

  const handleAddChild = async (config: AppConfig) => {
    const colRef = collection(db, 'users', userId, 'children');
    const docRef = await addDoc(colRef, {
      childName: config.childName,
      password: config.password,
      selectedRewards: config.selectedRewards,
      customCosts: null,
      stars: 0,
      history: [],
      starHistory: [],
      lastStarDate: null,
    });
    setShowAddChild(false);
    onSelect(docRef.id);
  };

  if (showAddChild) {
    return <Onboarding onComplete={handleAddChild} />;
  }

  if (loading) {
    return (
      <div className="onboarding">
        <div className="onboarding-step">
          <h2>⭐ טוען...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding">
      <div className="onboarding-step" style={{ maxWidth: '550px' }}>
        <h2>⭐ בחרו ילד/ה</h2>
        <p>לחצו על השם כדי לפתוח את לוח הכוכבים</p>

        {migrationAvailable && (
          <div style={{
            background: '#fff8e1',
            border: '2px solid #ffd54f',
            borderRadius: '14px',
            padding: '14px',
            marginBottom: '20px',
            textAlign: 'center',
          }}>
            <div style={{ fontWeight: 700, marginBottom: '6px', color: '#333' }}>
              📦 נמצאו נתונים מקומיים
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>
              יש נתונים שמורים מהמכשיר הזה. רוצים לייבא אותם?
            </div>
            <button className="onboarding-btn" onClick={handleMigrate} style={{ padding: '10px 24px', fontSize: '1rem' }}>
              ייבא נתונים
            </button>
          </div>
        )}

        {children.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => onSelect(child.id)}
                style={{
                  background: '#f8f6ff',
                  border: '2px solid #e0d6f3',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                  fontSize: '1.1rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#764ba2';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e0d6f3';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <span style={{ fontWeight: 700, color: '#333' }}>
                  {child.childName}
                </span>
                <span style={{ color: '#888' }}>
                  ⭐ {child.stars}
                </span>
              </button>
            ))}
          </div>
        )}

        {children.length === 0 && !migrationAvailable && (
          <div style={{ color: '#999', fontStyle: 'italic', marginBottom: '20px' }}>
            עדיין לא הוספתם ילדים. לחצו על הכפתור למטה כדי להתחיל!
          </div>
        )}

        <button
          className="onboarding-btn"
          onClick={() => setShowAddChild(true)}
          style={{ marginBottom: '12px' }}
        >
          + הוסף ילד/ה
        </button>

        <button className="modal-cancel" onClick={onLogout} style={{ display: 'block', width: '100%' }}>
          התנתק
        </button>
      </div>
    </div>
  );
}

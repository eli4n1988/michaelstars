import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
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
  const [addingChild, setAddingChild] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    const colRef = collection(db, 'users', userId, 'children');
    const unsubscribe = onSnapshot(colRef, (snap) => {
      const kids: ChildSummary[] = [];
      snap.forEach((d) => {
        const data = d.data();
        kids.push({
          id: d.id,
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

      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CONFIG_KEY);
      setMigrationAvailable(false);
      onSelect(docRef.id);
    } catch {
      alert('שגיאה בייבוא הנתונים');
    }
  };

  const handleAddChild = async (config: AppConfig) => {
    if (addingChild) return; // Prevent double-clicks
    setAddingChild(true);
    setAddError('');
    try {
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
      setAddingChild(false);
      onSelect(docRef.id);
    } catch (err) {
      console.error('Failed to add child:', err);
      setAddError('שגיאה בשמירת הנתונים. בדקו את חיבור האינטרנט ונסו שוב.');
      setAddingChild(false);
    }
  };

  const handleDeleteChild = async (childId: string, childName: string) => {
    if (!confirm(`למחוק את "${childName}"? כל הנתונים יימחקו לצמיתות!`)) return;
    try {
      await deleteDoc(doc(db, 'users', userId, 'children', childId));
    } catch (err) {
      console.error('Failed to delete child:', err);
      alert('שגיאה במחיקה');
    }
  };

  if (showAddChild) {
    if (addingChild) {
      return (
        <div className="onboarding">
          <div className="onboarding-step">
            <h2>⭐ שומר...</h2>
          </div>
        </div>
      );
    }
    return (
      <>
        <Onboarding onComplete={handleAddChild} />
        {addError && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#c62828',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '14px',
            zIndex: 9999,
            fontSize: '0.95rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            {addError}
          </div>
        )}
      </>
    );
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
    <div className="onboarding" style={{ overflowY: 'auto' }}>
      <div className="onboarding-step" style={{ maxWidth: '550px', maxHeight: '85vh', overflowY: 'auto' }}>
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
              <div
                key={child.id}
                style={{
                  background: '#f8f6ff',
                  border: '2px solid #e0d6f3',
                  borderRadius: '16px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s ease',
                }}
              >
                <button
                  onClick={() => onSelect(child.id)}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '1.1rem',
                    padding: '4px 0',
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#333' }}>
                    {child.childName}
                  </span>
                  <span style={{ color: '#888' }}>
                    ⭐ {child.stars}
                  </span>
                </button>
                <button
                  onClick={() => handleDeleteChild(child.id, child.childName)}
                  title="מחק"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ccc',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    padding: '4px 6px',
                    borderRadius: '8px',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#e53935'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#ccc'; }}
                >
                  ✕
                </button>
              </div>
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

import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { AppConfig } from '../types';
import { Onboarding } from './Onboarding';
import { ConfirmModal } from './ConfirmModal';
import { STORAGE_KEY, CONFIG_KEY } from '../constants';
import { countUnseenAlerts } from '../utils/school';

interface ChildSelectorProps {
  userId: string;
  onSelect: (childId: string) => void;
  onLogout: () => Promise<void>;
}

interface ChildSummary {
  id: string;
  childName: string;
  stars: number;
  alerts: number;
}

export function ChildSelector({ userId, onSelect, onLogout }: ChildSelectorProps) {
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const [migrationAvailable, setMigrationAvailable] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [addError, setAddError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

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
          alerts: countUnseenAlerts(data.lessonMarks),
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

  const handleDeleteChild = async (childId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId, 'children', childId));
    } catch (err) {
      console.error('Failed to delete child:', err);
    }
    setDeleteTarget(null);
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
        <Onboarding onComplete={handleAddChild} onCancel={() => setShowAddChild(false)} />
        {addError && (
          <div className="error-toast">
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
    <div className="onboarding child-selector-container">
      <div className="onboarding-step child-selector-step">
        <h2>⭐ בחרו ילד/ה</h2>
        <p>לחצו על השם כדי לפתוח את לוח הכוכבים</p>

        {migrationAvailable && (
          <div className="migration-box">
            <div className="migration-title">
              📦 נמצאו נתונים מקומיים
            </div>
            <div className="migration-desc">
              יש נתונים שמורים מהמכשיר הזה. רוצים לייבא אותם?
            </div>
            <button className="onboarding-btn migration-btn" onClick={handleMigrate}>
              ייבא נתונים
            </button>
          </div>
        )}

        {children.length > 0 && (
          <div className="child-list">
            {children.map((child) => (
              <div key={child.id} className="child-card">
                <button
                  className="child-select-btn"
                  onClick={() => onSelect(child.id)}
                >
                  <span className="child-name">
                    {child.childName}
                  </span>
                  <span className="child-stars">
                    ⭐ {child.stars}
                  </span>
                  {child.alerts > 0 && (
                    <span className="child-alerts" title="דיווחים חדשים מהמורה">
                      ⚠️ {child.alerts}
                    </span>
                  )}
                </button>
                <button
                  className="child-delete-btn"
                  onClick={() => setDeleteTarget({ id: child.id, name: child.childName })}
                  title="מחק"
                  aria-label={`מחק את ${child.childName}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {children.length === 0 && !migrationAvailable && (
          <div className="child-empty-state">
            עדיין לא הוספתם ילדים. לחצו על הכפתור למטה כדי להתחיל!
          </div>
        )}

        <button
          className="onboarding-btn child-add-btn"
          onClick={() => setShowAddChild(true)}
        >
          + הוסף ילד/ה
        </button>

        <button className="modal-cancel child-logout-btn" onClick={onLogout}>
          התנתק
        </button>
      </div>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="🗑️ מחיקת ילד/ה"
        message={`למחוק את "${deleteTarget?.name ?? ''}"? כל הנתונים יימחקו לצמיתות!`}
        confirmText="מחק"
        cancelText="ביטול"
        danger
        onConfirm={() => deleteTarget && handleDeleteChild(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

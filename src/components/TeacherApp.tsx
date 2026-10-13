import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebase';
import type { TeacherLink } from '../types';
import { TEACHER_LINKS_KEY } from '../constants';
import { useTeacherChild } from '../hooks/useTeacherChild';
import { TeacherSetup } from './TeacherSetup';
import { TeacherDay } from './TeacherDay';

// The teacher login is shared, so linked students are remembered per device
function loadLinks(): TeacherLink[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(TEACHER_LINKS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface TeacherAppProps {
  onLogout: () => void;
}

export function TeacherApp({ onLogout }: TeacherAppProps) {
  const [links, setLinks] = useState<TeacherLink[]>(loadLinks);
  const [activeId, setActiveId] = useState<string | null>(() => {
    const initial = loadLinks();
    return initial.length === 1 ? initial[0].childId : null;
  });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(TEACHER_LINKS_KEY, JSON.stringify(links));
    } catch {
      // Storage unavailable — links last for this session only
    }
  }, [links]);

  const handleLinked = (link: TeacherLink) => {
    setLinks((prev) => [...prev.filter((l) => l.childId !== link.childId), link]);
    setActiveId(link.childId);
    setAdding(false);
  };

  const handleRemove = (childId: string) => {
    setLinks((prev) => prev.filter((l) => l.childId !== childId));
    setActiveId(null);
  };

  if (adding || links.length === 0) {
    return (
      <TeacherLinkScreen
        onLinked={handleLinked}
        onCancel={links.length > 0 ? () => setAdding(false) : undefined}
        onLogout={onLogout}
      />
    );
  }

  const active = links.find((l) => l.childId === activeId);
  if (active) {
    return (
      <TeacherStudent
        key={active.childId}
        link={active}
        onBack={() => setActiveId(null)}
        onRemove={() => handleRemove(active.childId)}
        onLogout={onLogout}
      />
    );
  }

  return (
    <div className="onboarding child-selector-container">
      <div className="onboarding-step child-selector-step">
        <h2>🧑‍🏫 התלמידים שלי</h2>
        <p>בחרו תלמיד/ה</p>
        <div className="child-list">
          {links.map((l) => (
            <div key={l.childId} className="child-card">
              <button className="child-select-btn" onClick={() => setActiveId(l.childId)}>
                <span className="child-name">{l.childName}</span>
              </button>
              <button
                className="child-delete-btn"
                onClick={() => handleRemove(l.childId)}
                title="הסר מהמכשיר"
                aria-label={`הסר את ${l.childName} מהמכשיר`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button className="onboarding-btn child-add-btn" onClick={() => setAdding(true)}>
          + הוסף תלמיד/ה
        </button>
        <button className="modal-cancel child-logout-btn" onClick={onLogout}>התנתק</button>
      </div>
    </div>
  );
}

// ─── Link a student using the code from the parent dashboard ───────────────

interface TeacherLinkScreenProps {
  onLinked: (link: TeacherLink) => void;
  onCancel?: () => void;
  onLogout: () => void;
}

function TeacherLinkScreen({ onLinked, onCancel, onLogout }: TeacherLinkScreenProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setError('נא להזין קוד');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const linkSnap = await getDoc(doc(db, 'teacherLinks', clean));
      if (!linkSnap.exists()) {
        setError('הקוד לא נמצא. בדקו עם ההורים');
        return;
      }
      const { parentUid, childId } = linkSnap.data() as { parentUid: string; childId: string };
      const childRef = doc(db, 'users', parentUid, 'children', childId);
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('not signed in');
      // Register this device; the rules accept it only with the child's current code
      try {
        await updateDoc(childRef, { teacherUids: arrayUnion(uid), joinCode: clean });
      } catch (err) {
        console.error('Join failed:', err);
        setError('הקוד כבר לא בתוקף. בקשו מההורים קוד חדש');
        return;
      }
      const childSnap = await getDoc(childRef);
      if (!childSnap.exists()) {
        setError('התלמיד/ה לא נמצא/ה. בקשו מההורים קוד חדש');
        return;
      }
      onLinked({ parentUid, childId, childName: childSnap.data().childName ?? 'תלמיד/ה' });
    } catch (err) {
      console.error('Linking failed:', err);
      setError('שגיאה בחיבור. בדקו את חיבור האינטרנט ונסו שוב');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding">
      <div className="onboarding-step">
        <h2>🔗 חיבור תלמיד/ה</h2>
        <p>הזינו את קוד החיבור שקיבלתם מההורים (נמצא בלוח ההורים, בלשונית „מורה")</p>
        <input
          type="text"
          placeholder="קוד חיבור"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
          autoCapitalize="characters"
          autoCorrect="off"
          dir="ltr"
          className="login-input-ltr tc-code-input"
          maxLength={8}
        />
        <div className="error-msg">{error}</div>
        <button className="onboarding-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? '...' : 'חיבור'}
        </button>
        {onCancel ? (
          <button className="modal-cancel login-toggle-btn" onClick={onCancel}>ביטול</button>
        ) : (
          <button className="modal-cancel login-toggle-btn" onClick={onLogout}>התנתק</button>
        )}
      </div>
    </div>
  );
}

// ─── One student: first-time setup, then the daily lesson view ─────────────

interface TeacherStudentProps {
  link: TeacherLink;
  onBack: () => void;
  onRemove: () => void;
  onLogout: () => void;
}

function TeacherStudent({ link, onBack, onRemove, onLogout }: TeacherStudentProps) {
  const { child, loading, saveTeacher, setMark } = useTeacherChild(link.parentUid, link.childId);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (child) document.title = `הכוכבים של ${child.childName} — מורה`;
  }, [child]);

  if (loading) {
    return (
      <div className="onboarding">
        <div className="onboarding-step"><h2>⭐ טוען...</h2></div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="onboarding">
        <div className="onboarding-step">
          <h2>😕 לא נמצא</h2>
          <p>אין גישה ל{link.childName}. ייתכן שההורים ניתקו את המכשיר — בקשו מהם קוד חיבור חדש.</p>
          <button className="onboarding-btn" onClick={onRemove}>הזנת קוד חדש</button>
          <button className="modal-cancel" onClick={onBack}>חזרה</button>
        </div>
      </div>
    );
  }

  if (!child.teacher || editing) {
    return (
      <TeacherSetup
        childName={child.childName}
        initial={child.teacher}
        onSave={async (info) => {
          await saveTeacher(info);
          setEditing(false);
        }}
        onCancel={child.teacher ? () => setEditing(false) : onBack}
      />
    );
  }

  return (
    <TeacherDay
      child={{ ...child, teacher: child.teacher }}
      onSetMark={setMark}
      onEditSchedule={() => setEditing(true)}
      onBack={onBack}
      onLogout={onLogout}
    />
  );
}

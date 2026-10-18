import { useState, useEffect, useRef } from 'react';
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

/** Thrown by joinWithCode with a message to show the teacher */
class JoinError extends Error {}

/**
 * Join a child with a link code: look the code up, register this device in the
 * child's teacherUids (the rules accept it only with the current code), and
 * return the link to remember. Safe to repeat.
 */
async function joinWithCode(rawCode: string): Promise<TeacherLink> {
  const code = rawCode.trim().toUpperCase();
  const linkSnap = await getDoc(doc(db, 'teacherLinks', code));
  if (!linkSnap.exists()) throw new JoinError('הקוד לא נמצא או שכבר לא בתוקף. בקשו מההורים קוד חדש');
  const { parentUid, childId } = linkSnap.data() as { parentUid: string; childId: string };
  const childRef = doc(db, 'users', parentUid, 'children', childId);
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('not signed in');
  try {
    await updateDoc(childRef, { teacherUids: arrayUnion(uid), joinCode: code });
  } catch (err) {
    console.error('Join failed:', err);
    throw new JoinError('הקוד כבר לא בתוקף. בקשו מההורים קוד חדש');
  }
  const childSnap = await getDoc(childRef);
  if (!childSnap.exists()) throw new JoinError('התלמיד/ה לא נמצא/ה. בקשו מההורים קוד חדש');
  return { parentUid, childId, childName: childSnap.data().childName ?? 'תלמיד/ה', code };
}

function joinErrorMessage(err: unknown): string {
  if (err instanceof JoinError) return err.message;
  console.error('Linking failed:', err);
  return 'שגיאה בחיבור. בדקו את חיבור האינטרנט ונסו שוב';
}

interface TeacherAppProps {
  onLogout: () => void;
  /** Code from a personal link (…/#teacher/CODE): join automatically */
  inviteCode?: string | null;
}

export function TeacherApp({ onLogout, inviteCode }: TeacherAppProps) {
  const [links, setLinks] = useState<TeacherLink[]>(loadLinks);
  const [activeId, setActiveId] = useState<string | null>(() => {
    const initial = loadLinks();
    return initial.length === 1 ? initial[0].childId : null;
  });
  const [adding, setAdding] = useState(false);
  const [autoJoin, setAutoJoin] = useState<'running' | 'done'>(inviteCode ? 'running' : 'done');
  const [autoJoinError, setAutoJoinError] = useState('');
  const autoJoinStarted = useRef(false);
  // Bumped after a silent re-join so the student view resubscribes
  const [rejoinCount, setRejoinCount] = useState(0);

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

  // Personal link: (re)join on every open, so a device that lost its sign-in
  // or its saved students goes straight back to the lessons
  useEffect(() => {
    if (!inviteCode || autoJoinStarted.current) return;
    autoJoinStarted.current = true;
    joinWithCode(inviteCode)
      .then(handleLinked)
      .catch((err) => {
        setAutoJoinError(joinErrorMessage(err));
        setAdding(true);
      })
      .finally(() => setAutoJoin('done'));
  }, [inviteCode]);

  if (autoJoin === 'running') {
    return (
      <div className="onboarding">
        <div className="onboarding-step"><h2>⭐ מתחבר...</h2></div>
      </div>
    );
  }

  const handleRemove = (childId: string) => {
    setLinks((prev) => prev.filter((l) => l.childId !== childId));
    setActiveId(null);
  };

  if (adding || links.length === 0) {
    return (
      <TeacherLinkScreen
        initialError={autoJoinError}
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
        key={`${active.childId}-${rejoinCount}`}
        link={active}
        onRejoined={() => setRejoinCount((n) => n + 1)}
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
  initialError?: string;
  onLinked: (link: TeacherLink) => void;
  onCancel?: () => void;
  onLogout: () => void;
}

function TeacherLinkScreen({ initialError, onLinked, onCancel, onLogout }: TeacherLinkScreenProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(initialError ?? '');
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
      onLinked(await joinWithCode(clean));
    } catch (err) {
      setError(joinErrorMessage(err));
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
  onRejoined: () => void;
  onBack: () => void;
  onRemove: () => void;
  onLogout: () => void;
}

function TeacherStudent({ link, onRejoined, onBack, onRemove, onLogout }: TeacherStudentProps) {
  const { child, loading, saveTeacher, setMark } = useTeacherChild(link.parentUid, link.childId);
  const [editing, setEditing] = useState(false);
  // No access (e.g. the device lost its sign-in): try once more with the saved code
  const [rejoinFailed, setRejoinFailed] = useState(false);
  const rejoinStarted = useRef(false);
  const lostAccess = !loading && !child;

  useEffect(() => {
    if (!lostAccess || !link.code || rejoinStarted.current) return;
    rejoinStarted.current = true;
    joinWithCode(link.code).then(onRejoined, () => setRejoinFailed(true));
  }, [lostAccess, link.code, onRejoined]);

  useEffect(() => {
    if (child) document.title = `הכוכבים של ${child.childName} — מורה`;
  }, [child]);

  if (loading || (lostAccess && link.code && !rejoinFailed)) {
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

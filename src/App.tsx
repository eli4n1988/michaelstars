import { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import type { AppState, PendingAction, Reward } from './types';
import { ALL_REWARDS } from './constants';
import { useAuth } from './hooks/useAuth';
import { useChildData } from './hooks/useChildData';
import { useSound } from './hooks/useSound';
import { LoginScreen } from './components/LoginScreen';
import { ChildSelector } from './components/ChildSelector';
import { StarCounter } from './components/StarCounter';
import { StarActions } from './components/StarActions';
import { StarGrid } from './components/StarGrid';
import { RewardsSection } from './components/RewardsSection';
import { HistorySection } from './components/HistorySection';
import { ParentApprovalModal } from './components/ParentApprovalModal';
import { PasswordModal } from './components/PasswordModal';
import { Celebration } from './components/Celebration';
import { FloatingStar } from './components/FloatingStar';
import { ParentDashboard } from './components/ParentDashboard';
import { SchoolWeekTable } from './components/SchoolWeekTable';
import { RoleSelect } from './components/RoleSelect';
import { TeacherLogin } from './components/TeacherLogin';
import { TeacherApp } from './components/TeacherApp';
import { countUnseenAlerts } from './utils/school';

type Role = 'parent' | 'teacher';

/**
 * Role from the URL: …/michaelstars/#parent, …/#teacher, or a teacher's personal
 * link …/#teacher/CODE that signs in and joins with the code automatically.
 */
function parseHash(): { role: Role | null; inviteCode: string | null } {
  const [rawRole, rawCode] = window.location.hash.replace(/^#\/?/, '').split('/');
  const role = rawRole?.toLowerCase();
  if (role === 'parent') return { role, inviteCode: null };
  if (role === 'teacher') {
    const code = rawCode && /^[A-Za-z0-9]{4,12}$/.test(rawCode) ? rawCode.toUpperCase() : null;
    return { role, inviteCode: code };
  }
  return { role: null, inviteCode: null };
}

function App() {
  const { user, loading: authLoading, login, register, loginTeacher, logout } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [{ role, inviteCode }, setHashState] = useState(parseHash);

  // Keep the URL in sync so each role has its own link
  const setRole = (next: Role | null) => {
    setHashState({ role: next, inviteCode: null });
    const { pathname, search } = window.location;
    window.history.replaceState(null, '', next ? `${pathname}${search}#${next}` : `${pathname}${search}`);
  };

  useEffect(() => {
    const onHashChange = () => setHashState(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Stay on the same role's login after logging out (dropping a personal link's
  // code, so logging out doesn't sign straight back in)
  const handleLogout = async () => {
    setSelectedChildId(null);
    if (role) setRole(role);
    await logout();
  };

  // Auth gate
  if (authLoading) {
    return (
      <div className="onboarding">
        <div className="onboarding-step">
          <h2>⭐ טוען...</h2>
        </div>
      </div>
    );
  }

  // Every visit starts by choosing a role, even when a session is remembered
  if (!role) {
    return <RoleSelect onSelect={setRole} />;
  }

  const isTeacher = user?.isAnonymous === true;

  if (role === 'teacher') {
    if (isTeacher) return <TeacherApp onLogout={handleLogout} inviteCode={inviteCode} />;
    // A personal link carries the code (the real key), so skip the password screen
    if (inviteCode) return <AutoTeacherLogin onLogin={loginTeacher} onFallback={() => setRole('teacher')} />;
    return <TeacherLogin onLogin={loginTeacher} onBack={() => setRole(null)} />;
  }

  if (!user || isTeacher) {
    return <LoginScreen onLogin={login} onRegister={register} onBack={() => setRole(null)} />;
  }

  if (!selectedChildId) {
    return (
      <ChildSelector
        userId={user.uid}
        onSelect={setSelectedChildId}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <StarChart
      userId={user.uid}
      childId={selectedChildId}
      onBack={() => setSelectedChildId(null)}
    />
  );
}

// ─── Signs a teacher in automatically when opened from a personal link ─────

function AutoTeacherLogin({ onLogin, onFallback }: { onLogin: () => Promise<void>; onFallback: () => void }) {
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice; sign in only once
    started.current = true;
    onLogin().catch((err) => {
      console.error('Automatic teacher sign-in failed:', err);
      setFailed(true);
    });
  }, [onLogin]);

  return (
    <div className="onboarding">
      <div className="onboarding-step">
        {failed ? (
          <>
            <h2>😕 לא הצלחנו להתחבר</h2>
            <p>בדקו את חיבור האינטרנט ונסו שוב</p>
            <button className="onboarding-btn" onClick={() => window.location.reload()}>נסו שוב</button>
            <button className="modal-cancel" onClick={onFallback}>כניסה עם שם משתמש</button>
          </>
        ) : (
          <h2>⭐ מתחבר...</h2>
        )}
      </div>
    </div>
  );
}

// ─── Star Chart (the main child view) ───────────────────────────────────────

interface StarChartProps {
  userId: string;
  childId: string;
  onBack: () => void;
}

function StarChart({ userId, childId, onBack }: StarChartProps) {
  const {
    config, state, setConfig, setState, loading, writeError,
    teacherData, createTeacherCode, markAlertSeen, resetTeacherData, disconnectTeachers,
  } = useChildData(userId, childId);
  const unseenAlerts = countUnseenAlerts(teacherData.lessonMarks);

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [floatTrigger, setFloatTrigger] = useState(0);
  const [parentDashboardOpen, setParentDashboardOpen] = useState(false);

  const pendingPasswordAction = useRef<(() => void) | null>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const playSound = useSound();

  // Update document title when config changes
  useEffect(() => {
    if (config) {
      document.title = `הכוכבים של ${config.childName}!`;
    }
  }, [config]);

  // Build active rewards from config (with custom costs)
  const rewards: Record<string, Reward> = {};
  if (config?.selectedRewards) {
    for (const key of config.selectedRewards) {
      if (ALL_REWARDS[key]) {
        const customCost = config.customCosts?.[key];
        rewards[key] = customCost != null
          ? { ...ALL_REWARDS[key], cost: customCost }
          : ALL_REWARDS[key];
      }
    }
  }

  // --- Star actions ---
  const handleAddStar = () => {
    setPendingAction('add');
  };

  const handleRemoveStar = () => {
    if (state.stars <= 0) return;
    setPendingAction('remove');
  };

  const handleConfirmStar = (approver: string) => {
    const action = pendingAction;
    setPendingAction(null);
    const dateStr = new Date().toLocaleDateString('he-IL', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    if (action === 'add') {
      setState((prev: AppState) => ({
        ...prev,
        stars: prev.stars + 1,
        starHistory: [{ action: 'add' as const, date: dateStr, approver, at: Date.now() }, ...(prev.starHistory || [])].slice(0, 50),
      }));
      setFloatTrigger((n) => n + 1);
    } else if (action === 'remove') {
      setState((prev: AppState) => ({
        ...prev,
        stars: prev.stars - 1,
        starHistory: [{ action: 'remove' as const, date: dateStr, approver, at: Date.now() }, ...(prev.starHistory || [])].slice(0, 50),
      }));
    }
    playSound('earn');
  };

  const handleCloseModal = () => {
    setPendingAction(null);
  };

  // --- Rewards ---
  const handleClaimReward = (key: string, cost: number) => {
    if (state.stars < cost) return;
    const r = rewards[key];
    const date = new Date().toLocaleDateString('he-IL', { month: 'short', day: 'numeric' });

    setState((prev: AppState) => ({
      ...prev,
      stars: prev.stars - cost,
      history: [{ name: r.name, emoji: r.emoji, date }, ...prev.history].slice(0, 20),
    }));

    setCelebrating(true);
    playSound('claim');
  };

  const handleCelebrationDone = useCallback(() => {
    setCelebrating(false);
  }, []);

  // --- Password-protected actions ---
  const requirePassword = (action: () => void) => {
    pendingPasswordAction.current = action;
    setPasswordModalOpen(true);
  };

  const handlePasswordSuccess = () => {
    setPasswordModalOpen(false);
    if (pendingPasswordAction.current) {
      pendingPasswordAction.current();
      pendingPasswordAction.current = null;
    }
  };

  const handlePasswordClose = () => {
    setPasswordModalOpen(false);
    pendingPasswordAction.current = null;
  };

  const handleResetStars = () => {
    setState((prev: AppState) => ({ ...prev, stars: 0 }));
  };

  const handleFullReset = () => {
    setConfig(null); // Deletes child document from Firestore
    setParentDashboardOpen(false);
    onBack(); // Go back to child selector
  };

  const handleOpenParentDashboard = () => {
    requirePassword(() => {
      setParentDashboardOpen(true);
    });
  };

  // Parent dashboard: add/remove star (bypasses daily limit)
  const handleParentAddStar = () => {
    const dateStr = new Date().toLocaleDateString('he-IL', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    setState((prev: AppState) => ({
      ...prev,
      stars: prev.stars + 1,
      starHistory: [{ action: 'add' as const, date: dateStr, approver: 'הורה (לוח)', at: Date.now() }, ...(prev.starHistory || [])].slice(0, 50),
    }));
    playSound('earn');
  };

  const handleParentRemoveStar = () => {
    if (state.stars <= 0) return;
    const dateStr = new Date().toLocaleDateString('he-IL', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    setState((prev: AppState) => ({
      ...prev,
      stars: prev.stars - 1,
      starHistory: [{ action: 'remove' as const, date: dateStr, approver: 'הורה (לוח)', at: Date.now() }, ...(prev.starHistory || [])].slice(0, 50),
    }));
  };

  const handleDeleteHistory = (index: number) => {
    requirePassword(() => {
      setState((prev: AppState) => {
        const entry = prev.history[index];
        const rewardKey = Object.keys(ALL_REWARDS).find((k) => ALL_REWARDS[k].name === entry.name);
        const refund = rewardKey ? ALL_REWARDS[rewardKey].cost : 0;
        const newHistory = [...prev.history];
        newHistory.splice(index, 1);
        return { ...prev, stars: prev.stars + refund, history: newHistory };
      });
    });
  };

  if (loading) {
    return (
      <div className="onboarding">
        <div className="onboarding-step">
          <h2>⭐ טוען...</h2>
        </div>
      </div>
    );
  }

  if (!config) {
    // Child document was deleted or doesn't exist
    onBack();
    return null;
  }

  return (
    <>
      <button
        className="back-btn"
        onClick={onBack}
        title="חזרה לבחירת ילד"
        aria-label="חזרה לבחירת ילד"
      >
        חזרה →
      </button>

      <h1>הכוכבים של {config.childName}!</h1>

      {writeError && (
        <div style={{ background: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '8px', margin: '8px 16px', fontSize: '13px', direction: 'ltr', wordBreak: 'break-all' }}>
          Firestore error: {writeError}
        </div>
      )}

      <StarCounter stars={state.stars} />

      <StarActions
        onAdd={handleAddStar}
        onRemove={handleRemoveStar}
        addBtnRef={addBtnRef}
      />

      <StarGrid stars={state.stars} />

      {teacherData.teacher && (
        <div className="school-card">
          <h2 className="school-card-title">📅 השבוע של {config.childName}</h2>
          <SchoolWeekTable
            teacher={teacherData.teacher}
            lessonMarks={teacherData.lessonMarks}
            parentHistory={state.starHistory || []}
            showNotes={false}
          />
        </div>
      )}

      <RewardsSection
        rewards={rewards}
        stars={state.stars}
        onClaim={handleClaimReward}
      />

      <HistorySection
        history={state.history}
        onDelete={handleDeleteHistory}
      />

      <div className="parent-zone">
        <button className="reset-btn" onClick={handleOpenParentDashboard}>
          🔒 כניסת הורים
          {unseenAlerts > 0 && <span className="pd-tab-badge">{unseenAlerts}</span>}
        </button>
      </div>

      <ParentDashboard
        isOpen={parentDashboardOpen}
        onClose={() => setParentDashboardOpen(false)}
        stars={state.stars}
        starHistory={state.starHistory || []}
        config={config}
        onAddStar={handleParentAddStar}
        onRemoveStar={handleParentRemoveStar}
        onResetStars={handleResetStars}
        onUpdateConfig={setConfig}
        onFullReset={handleFullReset}
        teacherData={teacherData}
        onCreateTeacherCode={createTeacherCode}
        onMarkAlertSeen={markAlertSeen}
        onResetTeacherData={resetTeacherData}
        onDisconnectTeachers={disconnectTeachers}
      />

      <ParentApprovalModal
        pendingAction={pendingAction}
        childName={config.childName}
        onConfirm={handleConfirmStar}
        onClose={handleCloseModal}
      />

      <PasswordModal
        isOpen={passwordModalOpen}
        password={config.password}
        onSuccess={handlePasswordSuccess}
        onClose={handlePasswordClose}
      />

      <Celebration active={celebrating} onDone={handleCelebrationDone} />

      <FloatingStar trigger={floatTrigger} buttonRef={addBtnRef} />
    </>
  );
}

export default App;

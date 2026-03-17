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

function App() {
  const { user, loading: authLoading, login, register, logout } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

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

  if (!user) {
    return <LoginScreen onLogin={login} onRegister={register} />;
  }

  if (!selectedChildId) {
    return (
      <ChildSelector
        userId={user.uid}
        onSelect={setSelectedChildId}
        onLogout={logout}
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

// ─── Star Chart (the main child view) ───────────────────────────────────────

interface StarChartProps {
  userId: string;
  childId: string;
  onBack: () => void;
}

function StarChart({ userId, childId, onBack }: StarChartProps) {
  const { config, state, setConfig, setState, loading, writeError } = useChildData(userId, childId);

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
        starHistory: [{ action: 'add' as const, date: dateStr, approver }, ...(prev.starHistory || [])].slice(0, 50),
      }));
      setFloatTrigger((n) => n + 1);
    } else if (action === 'remove') {
      setState((prev: AppState) => ({
        ...prev,
        stars: prev.stars - 1,
        starHistory: [{ action: 'remove' as const, date: dateStr, approver }, ...(prev.starHistory || [])].slice(0, 50),
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
      starHistory: [{ action: 'add' as const, date: dateStr, approver: 'הורה (לוח)' }, ...(prev.starHistory || [])].slice(0, 50),
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
      starHistory: [{ action: 'remove' as const, date: dateStr, approver: 'הורה (לוח)' }, ...(prev.starHistory || [])].slice(0, 50),
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

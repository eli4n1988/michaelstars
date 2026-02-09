import { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import type { AppState, AppConfig, PendingAction, Reward } from './types';
import { STORAGE_KEY, CONFIG_KEY, ALL_REWARDS } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSound } from './hooks/useSound';
import { Onboarding } from './components/Onboarding';
import { StarCounter } from './components/StarCounter';
import { StarActions } from './components/StarActions';
import { StarGrid } from './components/StarGrid';
import { RewardsSection } from './components/RewardsSection';
import { HistorySection } from './components/HistorySection';
import { ParentZone } from './components/ParentZone';
import { ParentApprovalModal } from './components/ParentApprovalModal';
import { PasswordModal } from './components/PasswordModal';
import { Celebration } from './components/Celebration';
import { FloatingStar } from './components/FloatingStar';

const DEFAULT_STATE: AppState = { stars: 0, history: [] };

function App() {
  const [config, setConfig] = useLocalStorage<AppConfig | null>(CONFIG_KEY, null);
  const [state, setState] = useLocalStorage<AppState>(STORAGE_KEY, DEFAULT_STATE);

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [floatTrigger, setFloatTrigger] = useState(0);

  const pendingPasswordAction = useRef<(() => void) | null>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const playSound = useSound();

  // Update document title when config changes
  useEffect(() => {
    if (config) {
      document.title = `הכוכבים של ${config.childName}!`;
    }
  }, [config]);

  // Build active rewards from config
  const rewards: Record<string, Reward> = {};
  if (config?.selectedRewards) {
    for (const key of config.selectedRewards) {
      if (ALL_REWARDS[key]) rewards[key] = ALL_REWARDS[key];
    }
  }

  // --- Star actions ---
  const getLocalDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const todayStr = getLocalDateStr();
  const starUsedToday = state.lastStarDate === todayStr;

  const handleAddStar = () => {
    if (starUsedToday) return;
    setPendingAction('add');
  };

  const handleRemoveStar = () => {
    if (starUsedToday) return;
    if (state.stars <= 0) return;
    setPendingAction('remove');
  };

  const handleConfirmStar = (_approver: string) => {
    const action = pendingAction;
    setPendingAction(null);
    const today = getLocalDateStr();

    if (action === 'add') {
      setState((prev) => ({ ...prev, stars: prev.stars + 1, lastStarDate: today }));
      setFloatTrigger((n) => n + 1);
    } else if (action === 'remove') {
      setState((prev) => ({ ...prev, stars: prev.stars - 1, lastStarDate: today }));
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

    setState((prev) => ({
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
    requirePassword(() => {
      if (!confirm('לאפס את כל הכוכבים ל-0? (ההיסטוריה תישמר)')) return;
      setState((prev) => ({ ...prev, stars: 0 }));
    });
  };

  const handleDeleteHistory = (index: number) => {
    requirePassword(() => {
      setState((prev) => {
        const entry = prev.history[index];
        const rewardKey = Object.keys(ALL_REWARDS).find((k) => ALL_REWARDS[k].name === entry.name);
        const refund = rewardKey ? ALL_REWARDS[rewardKey].cost : 0;
        const newHistory = [...prev.history];
        newHistory.splice(index, 1);
        return { ...prev, stars: prev.stars + refund, history: newHistory };
      });
    });
  };

  // --- Onboarding ---
  const handleOnboardingComplete = (newConfig: AppConfig) => {
    setConfig(newConfig);
  };

  if (!config) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <>
      <h1>הכוכבים של {config.childName}!</h1>

      <StarCounter stars={state.stars} />

      <StarActions
        onAdd={handleAddStar}
        onRemove={handleRemoveStar}
        addBtnRef={addBtnRef}
        disabled={starUsedToday}
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

      <ParentZone onReset={handleResetStars} />

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

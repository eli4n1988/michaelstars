import { useState } from 'react';
import type { AppConfig, StarHistoryEntry, Reward } from '../types';
import { ALL_REWARDS } from '../constants';
import { ConfirmModal } from './ConfirmModal';

interface ParentDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  stars: number;
  starHistory: StarHistoryEntry[];
  config: AppConfig;
  onAddStar: () => void;
  onRemoveStar: () => void;
  onResetStars: () => void;
  onUpdateConfig: (config: AppConfig) => void;
  onFullReset: () => void;
}

type Tab = 'history' | 'prizes' | 'stars';

export function ParentDashboard({
  isOpen,
  onClose,
  stars,
  starHistory,
  config,
  onAddStar,
  onRemoveStar,
  onResetStars,
  onUpdateConfig,
  onFullReset,
}: ParentDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('stars');
  const [editSelected, setEditSelected] = useState<string[]>([...config.selectedRewards]);
  const [editCosts, setEditCosts] = useState<Record<string, number>>(() => {
    const costs: Record<string, number> = {};
    for (const [key, reward] of Object.entries(ALL_REWARDS)) {
      costs[key] = config.customCosts?.[key] ?? reward.cost;
    }
    return costs;
  });
  const [saved, setSaved] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | 'reset' | 'fullReset'>(null);

  if (!isOpen) return null;

  const handleToggleReward = (key: string) => {
    setEditSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    setSaved(false);
  };

  const handleCostChange = (key: string, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= 99) {
      setEditCosts((prev) => ({ ...prev, [key]: num }));
      setSaved(false);
    }
  };

  const handleSavePrizes = () => {
    if (editSelected.length === 0) return;
    const customCosts: Record<string, number> = {};
    for (const [key, reward] of Object.entries(ALL_REWARDS)) {
      if (editCosts[key] !== reward.cost) {
        customCosts[key] = editCosts[key];
      }
    }
    onUpdateConfig({
      ...config,
      selectedRewards: editSelected,
      customCosts: Object.keys(customCosts).length > 0 ? customCosts : undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetStars = () => {
    setConfirmAction('reset');
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'stars', label: 'כוכבים', icon: '⭐' },
    { id: 'history', label: 'היסטוריה', icon: '📋' },
    { id: 'prizes', label: 'פרסים', icon: '🎁' },
  ];

  return (
    <div className="parent-dashboard-overlay">
      <div className="parent-dashboard">
        <div className="pd-header">
          <h2>לוח הורים</h2>
          <button className="pd-close-btn" onClick={onClose} aria-label="סגור לוח הורים">✕</button>
        </div>

        <div className="pd-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`pd-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        <div className="pd-content">
          {/* Stars Tab */}
          {activeTab === 'stars' && (
            <div className="pd-section">
              <div className="pd-star-display">
                <span className="pd-star-count">{stars}</span>
                <span className="pd-star-label">כוכבים</span>
              </div>
              <div className="pd-star-actions">
                <button className="pd-btn pd-btn-add" onClick={onAddStar}>
                  ⭐ הוסף כוכב
                </button>
                <button
                  className="pd-btn pd-btn-remove"
                  onClick={onRemoveStar}
                  disabled={stars <= 0}
                >
                  ❌ הסר כוכב
                </button>
              </div>
              <button className="pd-btn pd-btn-reset" onClick={handleResetStars}>
                🔄 אפס כוכבים
              </button>
              <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '8px 0' }} />
              <button
                className="pd-btn pd-btn-reset"
                style={{ color: '#e53935' }}
                onClick={() => setConfirmAction('fullReset')}
              >
                🗑️ איפוס מלא (חזרה להגדרה מחדש)
              </button>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="pd-section">
              <div className="pd-history-list">
                {starHistory.length === 0 ? (
                  <div className="pd-empty">אין היסטוריה עדיין</div>
                ) : (
                  starHistory.map((entry, i) => (
                    <div key={i} className="pd-history-item">
                      <span className={`pd-history-badge ${entry.action}`}>
                        {entry.action === 'add' ? '+1 ⭐' : '-1 ❌'}
                      </span>
                      <span className="pd-history-approver">{entry.approver}</span>
                      <span className="pd-history-date">{entry.date}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Prizes Tab */}
          {activeTab === 'prizes' && (
            <div className="pd-section">
              <div className="pd-prizes-list">
                {Object.entries(ALL_REWARDS).map(([key, reward]: [string, Reward]) => (
                  <div key={key} className={`pd-prize-row ${editSelected.includes(key) ? 'selected' : ''}`}>
                    <button
                      className={`pd-prize-toggle ${editSelected.includes(key) ? 'on' : 'off'}`}
                      onClick={() => handleToggleReward(key)}
                    >
                      {editSelected.includes(key) ? '✓' : ''}
                    </button>
                    <span className="pd-prize-emoji">{reward.emoji}</span>
                    <span className="pd-prize-name">{reward.name}</span>
                    <div className="pd-prize-cost-edit">
                      <label>⭐</label>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={editCosts[key]}
                        onChange={(e) => handleCostChange(key, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="pd-btn pd-btn-save"
                onClick={handleSavePrizes}
                disabled={editSelected.length === 0}
              >
                {saved ? '✓ נשמר!' : '💾 שמור שינויים'}
              </button>
              {editSelected.length === 0 && (
                <div className="pd-warning">יש לבחור לפחות פרס אחד</div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmAction === 'reset'}
        title="🔄 איפוס כוכבים"
        message="לאפס את כל הכוכבים ל-0? (ההיסטוריה תישמר)"
        confirmText="אפס"
        cancelText="ביטול"
        danger
        onConfirm={() => { onResetStars(); setConfirmAction(null); }}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal
        isOpen={confirmAction === 'fullReset'}
        title="🗑️ איפוס מלא"
        message="לאפס הכל ולחזור להגדרה מחדש? כל הנתונים יימחקו לצמיתות!"
        confirmText="מחק הכל"
        cancelText="ביטול"
        danger
        onConfirm={() => { onFullReset(); setConfirmAction(null); }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}

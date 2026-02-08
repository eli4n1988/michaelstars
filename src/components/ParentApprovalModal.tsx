import type { PendingAction } from '../types';

interface ParentApprovalModalProps {
  pendingAction: PendingAction;
  childName: string;
  onConfirm: (approver: string) => void;
  onClose: () => void;
}

export function ParentApprovalModal({ pendingAction, childName, onConfirm, onClose }: ParentApprovalModalProps) {
  const isAdd = pendingAction === 'add';

  return (
    <div className={`modal-overlay ${pendingAction ? 'active' : ''}`}>
      <div className="modal">
        <span className="modal-star">{isAdd ? '⭐' : '❌'}</span>
        <div className="modal-title">
          {isAdd ? 'מי מאשר את הכוכב?' : 'מי מאשר הסרת כוכב?'}
        </div>
        <div className="modal-subtitle">
          {isAdd ? `${childName} היה ילד טוב היום!` : `${childName} לא התנהג יפה...`}
        </div>
        <div className="modal-buttons">
          <button className="modal-btn mama" onClick={() => onConfirm('אמא')}>
            👩 אמא
          </button>
          <button className="modal-btn abba" onClick={() => onConfirm('אבא')}>
            👨 אבא
          </button>
        </div>
        <button className="modal-cancel" onClick={onClose}>ביטול</button>
      </div>
    </div>
  );
}

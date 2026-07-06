import { useState, useEffect, useRef } from "react";
import { AlertTriangle, RotateCcw, Check, X, ShieldAlert, Zap } from "lucide-react";
import { useSwipeGesture } from "../hooks/useSwipeGesture";
import type { WarningSign } from "../domain/careTypes";

const warningDetails: Record<WarningSign, { label: string; desc: string; severity: "high" | "critical" }> = {
  self_harm_risk: {
    label: "Self-harm risk",
    desc: "Patient shows signs of self-harm or suicidal ideation. Requires immediate crisis resources and warm handoff.",
    severity: "critical"
  },
  pregnancy_bleeding: {
    label: "Pregnancy bleeding",
    desc: "Active bleeding during pregnancy. High risk for obstetric emergency; immediate clinical triage mandatory.",
    severity: "critical"
  },
  infant_fever: {
    label: "Infant fever",
    desc: "Fever in child under 5 (especially under 3 months). Fast triage needed due to risks of rapid escalation.",
    severity: "high"
  },
  severe_dehydration: {
    label: "Severe dehydration",
    desc: "Unable to keep fluids down, lethargic, or showing sunken eyes. Immediate fluid replacement needed.",
    severity: "high"
  },
  chest_pain: {
    label: "Chest pain",
    desc: "Ischemic or acute chest pain. Risk of cardiac event. Do not delay emergency transport.",
    severity: "critical"
  },
  breathing_difficulty: {
    label: "Breathing difficulty",
    desc: "Severe respiratory distress, stridor, or accessory muscle use. Immediate oxygen/clinical assessment.",
    severity: "critical"
  }
};

interface SwipeTriagePanelProps {
  warningSigns: WarningSign[];
  onConfirm: (sign: WarningSign) => void;
  onDismiss: (sign: WarningSign) => void;
  onClose: () => void;
  isHybridMode: boolean;
}

interface GestureHistoryItem {
  sign: WarningSign;
  action: "confirm" | "dismiss";
}

export function SwipeTriagePanel({
  warningSigns,
  onConfirm,
  onDismiss,
  onClose,
  isHybridMode
}: SwipeTriagePanelProps) {
  // Local list of cards that need verification
  const [cards, setCards] = useState<WarningSign[]>([]);
  const [history, setHistory] = useState<GestureHistoryItem[]>([]);
  
  // Velocity Sentinel
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedTimeLeft, setBlockedTimeLeft] = useState(0);
  const swipeTimestamps = useRef<number[]>([]);
  const blockTimer = useRef<number | null>(null);

  // Initialize cards from warningSigns prop
  useEffect(() => {
    // If warningSigns are empty and hybrid mode is on, we can show a demo stack for training
    if (warningSigns.length === 0 && isHybridMode) {
      setCards(Object.keys(warningDetails) as WarningSign[]);
    } else {
      setCards(warningSigns);
    }
  }, [warningSigns, isHybridMode]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (blockTimer.current) window.clearInterval(blockTimer.current);
    };
  }, []);

  const activeCard = cards[0] || null;

  // Track swipe timestamps for Velocity Sentinel
  const registerSwipe = () => {
    const now = Date.now();
    swipeTimestamps.current.push(now);
    
    // Keep only last 3 timestamps
    if (swipeTimestamps.current.length > 3) {
      swipeTimestamps.current.shift();
    }
    
    if (swipeTimestamps.current.length === 3) {
      const [t1, t2, t3] = swipeTimestamps.current;
      // If 3 swipes happen within 1.2 seconds total, trigger block
      if (t3 - t1 < 1200) {
        setIsBlocked(true);
        setBlockedTimeLeft(5);
        
        if (blockTimer.current) window.clearInterval(blockTimer.current);
        
        blockTimer.current = window.setInterval(() => {
          setBlockedTimeLeft((prev) => {
            if (prev <= 1) {
              if (blockTimer.current) window.clearInterval(blockTimer.current);
              setIsBlocked(false);
              swipeTimestamps.current = []; // reset timestamps
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
  };

  const handleSwipeRight = () => {
    if (isBlocked || !activeCard) return;
    registerSwipe();
    
    // Confirm: keep in intake (it is already in intake if selected, but we mark it verified)
    onConfirm(activeCard);
    
    setHistory((prev) => [...prev, { sign: activeCard, action: "confirm" }]);
    setCards((prev) => prev.slice(1));
  };

  const handleSwipeLeft = () => {
    if (isBlocked || !activeCard) return;
    registerSwipe();
    
    // Dismiss: remove from warningSigns intake
    onDismiss(activeCard);
    
    setHistory((prev) => [...prev, { sign: activeCard, action: "dismiss" }]);
    setCards((prev) => prev.slice(1));
  };

  const handleUndo = () => {
    if (isBlocked || history.length === 0) return;
    
    const lastAction = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    
    // Put card back to the top of stack
    setCards((prev) => [lastAction.sign, ...prev]);
    
    // Revert the action in the parent state
    if (lastAction.action === "dismiss") {
      // Re-add to intake warning signs
      onConfirm(lastAction.sign);
    } else {
      // It was confirmed. To revert a confirm, we don't necessarily remove it
      // unless the user wants to start over. For safety, we keep it in warnings
      // and let the user decide. Re-triggering state triggers updates.
      onConfirm(lastAction.sign);
    }
  };

  // Keyboard handlers: Backspace for undo, Left arrow for dismiss, Right arrow for confirm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isBlocked) return;
      if (e.key === "Backspace") {
        e.preventDefault();
        handleUndo();
      } else if (e.key === "ArrowLeft" && activeCard) {
        e.preventDefault();
        handleSwipeLeft();
      } else if (e.key === "ArrowRight" && activeCard) {
        e.preventDefault();
        handleSwipeRight();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCard, isBlocked, history]);

  const {
    x,
    y,
    rotate,
    isDragging,
    isSticky,
    holdProgress,
    errorMessage,
    pointerHandlers
  } = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight
  });

  const cardDetails = activeCard ? warningDetails[activeCard] : null;

  return (
    <div className="swipe-triage-panel" aria-live="polite">
      <div className="swipe-header">
        <div>
          <span className="eyebrow-accent">Critical Safety Verification</span>
          <h3>Cognitive Friction Triage (CFT)</h3>
        </div>
        <button className="close-btn" onClick={onClose} aria-label="Close swipe panel">
          <X size={18} />
        </button>
      </div>

      <p className="swipe-intro">
        Critical symptoms require deliberate confirmation. Swiping right verifies the risk. Swiping left dismisses it.
      </p>

      {isBlocked ? (
        <div className="velocity-sentinel-overlay">
          <ShieldAlert size={48} className="sentinel-icon animate-pulse" />
          <h4>Velocity Sentinel Activated</h4>
          <p>You are swiping too fast. Verification requires deliberate action.</p>
          <div className="countdown-ring">
            <span>Locked for {blockedTimeLeft}s</span>
          </div>
        </div>
      ) : activeCard && cardDetails ? (
        <div className="card-arena-container">
          <div className="swipe-indicators">
            <div className={`indicator left-ind ${x < -40 ? "active" : ""}`}>
              <X size={16} /> Dismiss
            </div>
            <div className={`indicator right-ind ${x > 40 ? "active" : ""}`}>
              <Check size={16} /> Confirm
            </div>
          </div>

          <div className="card-stack-perspective">
            {/* Active Top Card */}
            <div
              className={`triage-card active-card ${isDragging ? "dragging" : ""} ${isSticky ? "sticky" : ""}`}
              style={{
                transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg)`,
                cursor: isDragging ? "grabbing" : "grab"
              }}
              {...pointerHandlers}
            >
              {isSticky && (
                <div className="hold-progress-overlay">
                  <div className="hold-bar" style={{ width: `${holdProgress * 100}%` }}></div>
                  <div className="hold-text">
                    <Zap size={14} className="hold-icon animate-spin" />
                    Holding: {Math.round(holdProgress * 100)}%
                  </div>
                </div>
              )}

              <div className={`card-severity-tag ${cardDetails.severity}`}>
                <AlertTriangle size={14} />
                <span>{cardDetails.severity.toUpperCase()}</span>
              </div>

              <h4 className="card-title">{cardDetails.label}</h4>
              <p className="card-description">{cardDetails.desc}</p>

              <div className="card-footer-tip">
                <span>Swipe left to Dismiss · Swipe right to Confirm</span>
              </div>
            </div>

            {/* Visual Under-cards for 3D Stack */}
            {cards.length > 1 && (
              <div className="triage-card under-card-1" style={{ transform: "translate3d(0, 8px, -20px) scale(0.96)", zIndex: 1, opacity: 0.85 }}>
                <h4 className="card-title">{warningDetails[cards[1]]?.label}</h4>
              </div>
            )}
            {cards.length > 2 && (
              <div className="triage-card under-card-2" style={{ transform: "translate3d(0, 16px, -40px) scale(0.92)", zIndex: 0, opacity: 0.65 }}>
                <h4 className="card-title">{warningDetails[cards[2]]?.label}</h4>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="swipe-error-toast">
              <Zap size={14} />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-cards-state">
          <Check size={40} className="success-icon" />
          <h4>No signs to verify</h4>
          <p>All warning signs have been successfully triaged and verified.</p>
          <button className="text-button btn-primary" onClick={onClose}>
            Return to Case Builder
          </button>
        </div>
      )}

      {/* Control Actions */}
      <div className="swipe-actions">
        <button
          className="icon-button undo-btn"
          disabled={history.length === 0 || isBlocked}
          onClick={handleUndo}
          title="Undo last action (Backspace)"
          aria-label="Undo last action"
        >
          <RotateCcw size={18} />
          <span className="btn-label">Undo</span>
        </button>

        {activeCard && (
          <>
            <button
              className="text-button dismiss-action-btn"
              disabled={isBlocked}
              onClick={handleSwipeLeft}
            >
              <X size={16} /> Dismiss (Left)
            </button>

            <button
              className="text-button confirm-action-btn"
              disabled={isBlocked}
              onClick={handleSwipeRight}
            >
              <Check size={16} /> Confirm (Right)
            </button>
          </>
        )}
      </div>

      <div className="keyboard-shortcuts-hint">
        <span>Keyboard: ← Left (Dismiss) · → Right (Confirm) · Backspace (Undo)</span>
      </div>
    </div>
  );
}

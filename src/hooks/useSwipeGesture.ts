import { useState, useRef, useEffect } from "react";

interface UseSwipeGestureProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
  flickVelocityThreshold?: number; // px/ms
  holdDuration?: number; // ms
  stickyOffset?: number; // px
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 120,
  flickVelocityThreshold = 0.5,
  holdDuration = 1500,
  stickyOffset = 140
}: UseSwipeGestureProps) {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 1
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startX = useRef(0);
  const startY = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const stickyTimer = useRef<number | null>(null);
  const holdStart = useRef<number | null>(null);
  const direction = useRef<"left" | "right" | null>(null);

  useEffect(() => {
    return () => {
      if (stickyTimer.current) {
        cancelAnimationFrame(stickyTimer.current);
      }
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only respond to primary button (left click)
    if (e.button !== 0) return;
    
    // Capture pointer to continue receiving events even if pointer leaves element bounds
    e.currentTarget.setPointerCapture(e.pointerId);

    startX.current = e.clientX;
    startY.current = e.clientY;
    lastX.current = e.clientX;
    lastTime.current = performance.now();
    
    setIsDragging(true);
    setIsSticky(false);
    setHoldProgress(0);
    setErrorMessage(null);
    direction.current = null;
    setX(0);
    setY(0);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const now = performance.now();
    const dt = now - lastTime.current;
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    const dx = clientX - startX.current;
    const dy = clientY - startY.current;

    // Calculate instantaneous velocity in X direction
    const deltaX = clientX - lastX.current;
    const velocity = dt > 0 ? Math.abs(deltaX) / dt : 0;

    lastX.current = clientX;
    lastTime.current = now;

    if (isSticky) {
      // In sticky mode, lock position to the stickyOffset in the active direction
      const currentDir = direction.current;
      if (currentDir) {
        const targetX = currentDir === "right" ? stickyOffset : -stickyOffset;
        // Allow minor wiggle but keep locked mostly
        setX(targetX + (clientX - (startX.current + targetX * 1.5)) * 0.15);
        setY(dy * 0.15);
      }
      return;
    }

    // Viscous/damping mapping to make it feel heavy (Sticky Drag)
    const dampedX = dx * 0.65;
    const dampedY = dy * 0.3;

    // Detect flick (fast drag)
    if (velocity > flickVelocityThreshold && Math.abs(dampedX) > 30) {
      setIsSticky(true);
      const swipeDir = dampedX > 0 ? "right" : "left";
      direction.current = swipeDir;
      const targetX = swipeDir === "right" ? stickyOffset : -stickyOffset;
      setX(targetX);
      setY(0);
      setErrorMessage("Flick prevented! Hold pointer for 1.5s to confirm.");
      
      holdStart.current = performance.now();
      
      const tick = () => {
        if (!holdStart.current) return;
        const elapsed = performance.now() - holdStart.current;
        const progress = Math.min(elapsed / holdDuration, 1);
        setHoldProgress(progress);
        
        if (progress < 1) {
          stickyTimer.current = requestAnimationFrame(tick);
        } else {
          setErrorMessage(null); // hold complete
        }
      };
      
      stickyTimer.current = requestAnimationFrame(tick);
      return;
    }

    setX(dampedX);
    setY(dampedY);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (stickyTimer.current) {
      cancelAnimationFrame(stickyTimer.current);
      stickyTimer.current = null;
    }

    if (isSticky) {
      // Must have held for holdDuration
      if (holdProgress >= 1) {
        if (direction.current === "right") {
          onSwipeRight();
        } else if (direction.current === "left") {
          onSwipeLeft();
        }
      } else {
        // Failed hold, spring back
        setErrorMessage("Swipe canceled: Hold was too short.");
        setTimeout(() => setErrorMessage(null), 2500);
      }
      setIsSticky(false);
      setHoldProgress(0);
      setX(0);
      setY(0);
      direction.current = null;
      holdStart.current = null;
      return;
    }

    // Non-sticky release evaluation
    if (x > threshold) {
      onSwipeRight();
    } else if (x < -threshold) {
      onSwipeLeft();
    }

    setX(0);
    setY(0);
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    if (stickyTimer.current) {
      cancelAnimationFrame(stickyTimer.current);
      stickyTimer.current = null;
    }
    
    setIsSticky(false);
    setHoldProgress(0);
    setX(0);
    setY(0);
    direction.current = null;
    holdStart.current = null;
  };

  // Rotation calculation for visual card feedback
  const rotate = x * 0.08;

  return {
    x,
    y,
    rotate,
    isDragging,
    isSticky,
    holdProgress,
    errorMessage,
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel
    }
  };
}

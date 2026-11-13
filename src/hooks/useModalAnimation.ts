import { useState, useEffect } from 'react';

// Modal lifecycle hook ensuring DOM presence during exit transition.
export function useModalAnimation(isOpen: boolean, durationMs: number = 200) {
  const [mounted, setMounted] = useState<boolean>(isOpen);
  const [active, setActive] = useState<boolean>(false);

  useEffect(() => {
    let unmountTimer: ReturnType<typeof setTimeout> | undefined;
    let animFrame: number | undefined;

    if (isOpen) {
      setMounted(true);
      // Apply active transition class on next animation frame.
      if (typeof requestAnimationFrame !== 'undefined') {
        animFrame = requestAnimationFrame(() => {
          setActive(true);
        });
      } else {
        animFrame = setTimeout(() => {
          setActive(true);
        }, 16) as any;
      }
    } else {
      setActive(false);
      unmountTimer = setTimeout(() => {
        setMounted(false);
      }, durationMs);
    }

    return () => {
      if (animFrame) {
        if (typeof cancelAnimationFrame !== 'undefined') {
          cancelAnimationFrame(animFrame);
        } else {
          clearTimeout(animFrame as any);
        }
      }
      if (unmountTimer) {
        clearTimeout(unmountTimer);
      }
    };
  }, [isOpen, durationMs]);

  return { mounted, active };
}

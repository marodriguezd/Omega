import { useState, useEffect } from 'react';

/**
 * Hook to manage smooth GPU-accelerated enter and exit animations for modal dialogs.
 * Ensures the modal remains mounted in DOM while playing exit transition.
 */
export function useModalAnimation(isOpen: boolean, durationMs: number = 200) {
  const [mounted, setMounted] = useState<boolean>(isOpen);
  const [active, setActive] = useState<boolean>(false);

  useEffect(() => {
    let unmountTimer: ReturnType<typeof setTimeout> | undefined;
    let animFrame: number | undefined;

    if (isOpen) {
      setMounted(true);
      // Ensure DOM has mounted before applying active class for smooth enter animation
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

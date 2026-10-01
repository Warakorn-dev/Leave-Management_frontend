'use client';

import { useEffect, useState } from 'react';

/**
 * Sidebar collapsed state: collapsed below 1024px, expanded from 1024px up.
 * It follows the screen only when the width crosses that breakpoint, so a
 * sidebar the user collapsed or expanded by hand stays that way while the
 * window is merely resized.
 */
export function useSidebarCollapsed() {
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)');
    const follow = () => setIsCollapsed(!wide.matches);
    follow();
    wide.addEventListener('change', follow);
    return () => wide.removeEventListener('change', follow);
  }, []);

  return [isCollapsed, setIsCollapsed] as const;
}

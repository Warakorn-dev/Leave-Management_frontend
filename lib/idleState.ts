/**
 * Shared singleton for idle timeout state.
 * This is the single source of truth used by:
 *  - IdleTimeoutGuard (periodic check)
 *  - axios interceptor (on 401)
 *  - dashboard-shell / RoleGuard (on mount checks)
 */

import Swal from 'sweetalert2';

const idleState = {
  lastActivityTime: Date.now(),
  timeoutMs: 60 * 60 * 1000, // default: 60 minutes (overridden by backend config)
  isPopupShowing: false,

  /** Call this whenever user activity is detected */
  resetActivity() {
    if (!this.isPopupShowing) {
      this.lastActivityTime = Date.now();
    }
  },

  /** Returns true if the user has been idle longer than the configured timeout */
  isIdle() {
    return (Date.now() - this.lastActivityTime) >= this.timeoutMs;
  },

  /**
   * Returns true when the session-expired popup is currently visible
   * OR has been triggered and session hasn't been cleared yet.
   */
  isBlocked(): boolean {
    return this.isPopupShowing || sessionStorage.getItem('idleTimeoutTriggered') === 'true';
  },

  /**
   * Show the session-expired popup (idempotent – safe to call multiple times).
   * Keeps session alive while popup is shown.
   * Clears session and redirects ONLY after the user clicks the confirm button.
   */
  showExpiredPopup(timeoutMinutes: number) {
    if (typeof window !== 'undefined' && window.location.pathname === '/login') return;
    if (this.isPopupShowing) return; // already showing
    this.isPopupShowing = true;

    // Set flag IMMEDIATELY so every other guard/interceptor stops redirecting
    sessionStorage.setItem('idleTimeoutTriggered', 'true');

    Swal.fire({
      icon: 'warning',
      title: 'เซสชันหมดอายุ',
      html: `
        <div style="text-align:center; padding: 8px 0;">
          <p style="margin-bottom: 8px; color: #555; font-size: 15px;">
            คุณไม่ได้ใช้งานระบบเป็นเวลา <strong>${timeoutMinutes} นาที</strong>
          </p>
          <p style="color: #555; font-size: 14px;">
            ระบบได้ออกจากระบบโดยอัตโนมัติเพื่อความปลอดภัย<br/>
            กรุณาเข้าสู่ระบบใหม่เพื่อดำเนินการต่อ
          </p>
        </div>
      `,
      confirmButtonText: '🔐 เข้าสู่ระบบอีกครั้ง',
      confirmButtonColor: '#3b82f6',
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then(() => {
      // Clear session AFTER user clicks confirm
      sessionStorage.clear();
      this.isPopupShowing = false;
      this.lastActivityTime = Date.now();
      window.location.href = '/login';
    });
  },
};

export default idleState;

/**
 * Signs the user out. The local session is forgotten first, so no request sent
 * afterwards still carries the old token (it would 401 and pop the
 * "session expired" dialog), then the backend is asked to revoke the refresh
 * token and bump tokenVersion. When the access token has already expired, the
 * refresh token is traded for a fresh one first so the revoke still happens.
 * Best effort: offline, the local session still ends. Await it only when the
 * page is about to unload (full navigation); SPA navigation keeps it running.
 */
export async function endSession(): Promise<void> {
  const accessToken = sessionStorage.getItem('accessToken') || sessionStorage.getItem('token');
  const refreshToken = sessionStorage.getItem('refreshToken');
  sessionStorage.clear();

  const logout = (token: string) =>
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      keepalive: true,
    });

  try {
    if (accessToken && (await logout(accessToken)).ok) return;
    if (!refreshToken) return;
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` },
      keepalive: true,
    });
    if (!res.ok) return; // refresh token already invalid: nothing left to revoke
    const body = await res.json();
    const fresh: string | undefined = body?.data?.accessToken ?? body?.accessToken;
    if (fresh) await logout(fresh);
  } catch {
    // Offline or the server is down: the local session is already gone.
  }
}

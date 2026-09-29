'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import axiosInstance from '@/lib/api/axios';

interface User {
  id?: string;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  department?: string;
  position?: string;
  email?: string;
  employeeId?: string;
  profilePic?: string;
}

interface AuthContextType {
  user: User | null;
}

const AuthContext = createContext<AuthContextType>({ user: null });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuthLogic();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

function useAuthLogic() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const role = sessionStorage.getItem('role');
    const username = sessionStorage.getItem('username') || role || 'User';
    const fullName = sessionStorage.getItem('fullName');

    if (role) {
      // Admin accounts have no employee profile: /leave/me answers 403.
      const hasEmployeeProfile = role.toLowerCase() !== 'admin';
      setUser({
        id: sessionStorage.getItem('userId') || undefined,
        role,
        username,
        firstName: fullName || username,
        lastName: '',
        fullName: fullName || undefined,
        department: sessionStorage.getItem('department') || undefined,
        position: sessionStorage.getItem('position') || undefined,
        email: sessionStorage.getItem('email') || undefined,
        employeeId: sessionStorage.getItem('employeeId') || undefined,
        profilePic: sessionStorage.getItem('profilePic') || undefined,
      });

      // Fetch latest profile from DB to keep data in sync
      const fetchLatestProfile = async () => {
        try {
          const token =
            sessionStorage.getItem('accessToken') ||
            sessionStorage.getItem('token');
          if (!token) return;

          // Use axiosInstance so global interceptors (like 401 kick-out) work
          const res = await axiosInstance.get('/leave/me');

          if (res.status === 200) {
            const profile = res.data?.data || res.data;

            // Only update if it's an employee (has firstName)
            if (profile.firstName) {
              const latestFullName = `${profile.firstName} ${profile.lastName}`;
              sessionStorage.setItem('fullName', latestFullName);
              sessionStorage.setItem(
                'department',
                profile.department?.name || '',
              );
              sessionStorage.setItem('position', profile.position?.name || '');
              sessionStorage.setItem('employeeId', profile.id || '');
              if (profile.user?.avatarUrl)
                sessionStorage.setItem('profilePic', profile.user.avatarUrl);

              setUser((prev) =>
                prev
                  ? {
                      ...prev,
                      firstName: profile.firstName,
                      lastName: profile.lastName,
                      fullName: latestFullName,
                      department: profile.department?.name || prev.department,
                      position: profile.position?.name || prev.position,
                      employeeId: profile.id || prev.employeeId,
                      profilePic: profile.user?.avatarUrl || prev.profilePic,
                    }
                  : null,
              );
            }
          }
        } catch (error) {
          console.error('Failed to fetch latest profile', error);
        }
      };

      if (!hasEmployeeProfile) return;

      // Fetch immediately on mount
      fetchLatestProfile();

      // Poll every 5 seconds for immediate kick-out on suspension
      const intervalId = setInterval(() => {
        // Don't poll while the idle-timeout popup is showing
        if (sessionStorage.getItem('idleTimeoutTriggered') === 'true') return;
        fetchLatestProfile();
      }, 5000);
      return () => clearInterval(intervalId);
    }
  }, []);

  return { user };
}

/**
 * The signed-in user. AuthProvider wraps the whole dashboard (app/dashboard/
 * layout.tsx), so there is exactly one profile fetch + 5-second poll for the
 * page and its sidebar — every caller shares it instead of starting its own.
 */
export const useAuth = () => useContext(AuthContext);

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
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const role = sessionStorage.getItem('role');
    const username = sessionStorage.getItem('username') || role || 'User';
    const fullName = sessionStorage.getItem('fullName');

    if (role) {
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

      // Fetch immediately on mount
      fetchLatestProfile();

      // Poll every 5 seconds for immediate kick-out on suspension
      const intervalId = setInterval(fetchLatestProfile, 5000);
      return () => clearInterval(intervalId);
    }
  }, []);

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};

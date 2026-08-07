'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import axiosInstance from '@/api/axios';

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
          const token = sessionStorage.getItem('accessToken') || sessionStorage.getItem('token');
          if (!token) return;

          // Use axiosInstance so global interceptors (like 401 kick-out) work
          const res = await axiosInstance.get('/leave/me');
          
          if (res.status === 200) {
            const profile = res.data?.data || res.data;
            
            // Only update if it's an employee (has firstName)
            if (profile.firstName) {
              const latestFullName = `${profile.firstName} ${profile.lastName}`;
              sessionStorage.setItem('fullName', latestFullName);
              sessionStorage.setItem('department', profile.department?.name || '');
              sessionStorage.setItem('position', profile.position?.name || '');
              sessionStorage.setItem('employeeId', profile.id || '');
              if (profile.user?.avatarUrl) sessionStorage.setItem('profilePic', profile.user.avatarUrl);

              setUser(prev => prev ? {
                ...prev,
                firstName: profile.firstName,
                lastName: profile.lastName,
                fullName: latestFullName,
                department: profile.department?.name || prev.department,
                position: profile.position?.name || prev.position,
                employeeId: profile.id || prev.employeeId,
                profilePic: profile.user?.avatarUrl || prev.profilePic,
              } : null);
            }
          }
        } catch (error) {
          console.error("Failed to fetch latest profile", error);
        }
      };
      
      // Fetch immediately on mount
      fetchLatestProfile();
      
      // Poll every 5 seconds for immediate kick-out on suspension
      const intervalId = setInterval(fetchLatestProfile, 5000);
      return () => clearInterval(intervalId);
    }
  }, []);

  return { user };
}

export const useAuth = () => {
  // We can just rely on the local state since AuthProvider is not actually wrapping the application
  // but just in case, we will always call useContext.
  const context = useContext(AuthContext);
  const localAuth = useAuthLogic();
  
  // If the context is somehow populated (someone used AuthProvider), return it
  if (context.user) {
    return context;
  }
  
  // Otherwise fallback to our local state
  return localAuth;
};


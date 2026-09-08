'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RoleGuard({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: string[];
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const userRole = sessionStorage.getItem('role')?.toLowerCase() || '';

    if (!userRole) {
      router.push('/login');
      return;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(userRole)) {
        // Redirect to their specific dashboard or login if role doesn't match
        if (userRole === 'manager') {
          router.push('/dashboard/manager/status');
        } else if (userRole === 'hr') {
          router.push('/dashboard/hr/dashboard');
        } else if (userRole === 'ceo') {
          router.push('/dashboard/ceo/dashboard');
        } else if (userRole === 'admin') {
          router.push('/dashboard/admin/dashboard');
        } else if (userRole === 'user') {
          router.push('/dashboard/user/status');
        } else {
          router.push('/login');
        }
        return;
      }
    }

    setIsAuthorized(true);
  }, [router, allowedRoles]);

  if (!isAuthorized) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}


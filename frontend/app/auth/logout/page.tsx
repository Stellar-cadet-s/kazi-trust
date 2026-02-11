'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuth } from '@/lib/auth';

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    clearAuth();
    router.replace('/');
  }, [router]);
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-600">Signing out...</p>
    </div>
  );
}

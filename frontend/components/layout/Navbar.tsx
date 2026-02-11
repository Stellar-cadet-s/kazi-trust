'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui';

export function Navbar() {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#7B3FF2] to-[#00A8E8] rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative bg-gradient-to-r from-[#7B3FF2] to-[#00A8E8] p-2 rounded-lg">
                <Shield className="text-white" size={24} />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#7B3FF2] via-[#00A8E8] to-[#006B3F] bg-clip-text text-transparent">
                Kazi Trust
              </span>
              <p className="text-xs text-gray-500">Powered by Stellar</p>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#how-it-works" className="text-gray-600 hover:text-[#7B3FF2] font-medium transition-colors">
              How it Works
            </Link>
            <Link href="#for-workers" className="text-gray-600 hover:text-[#006B3F] font-medium transition-colors">
              For Workers
            </Link>
            <Link href="#for-employers" className="text-gray-600 hover:text-[#00A8E8] font-medium transition-colors">
              For Employers
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="outline">Login</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

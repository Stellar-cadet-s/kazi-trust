'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { Shield, LogOut } from 'lucide-react';

interface SidebarItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface SidebarProps {
  items: SidebarItem[];
}

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-md border-r border-gray-200 min-h-screen sticky top-0">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#7B3FF2] to-[#00A8E8] rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative bg-gradient-to-r from-[#7B3FF2] to-[#00A8E8] p-2 rounded-lg">
              <Shield className="text-white" size={20} />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#7B3FF2] via-[#00A8E8] to-[#006B3F] bg-clip-text text-transparent">
              Kazi Trust
            </span>
            <p className="text-xs text-gray-500">Dashboard</p>
          </div>
        </Link>
      </div>
      
      <nav className="px-4 space-y-2">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-[#7B3FF2] to-[#00A8E8] text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:bg-gradient-to-r hover:from-[#7B3FF2]/10 hover:to-[#00A8E8]/10 hover:text-[#7B3FF2]'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        <button
          onClick={() => window.location.href = '/auth/login'}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-300 mt-8"
        >
          <LogOut size={20} />
          <span className="font-medium">Log out</span>
        </button>
      </nav>
    </aside>
  );
}

import { ReactNode } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Briefcase, BookOpen, LogOut } from 'lucide-react';
import { Sidebar } from '@/components/layout';

const workerNav = [
  { href: '/worker/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { href: '/worker/browse', label: 'Browse Jobs', icon: <Briefcase size={20} /> },
  { href: '/worker/rights', label: 'Know Your Rights', icon: <BookOpen size={20} /> },
];

export default function WorkerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-64 flex flex-col bg-white border-r border-gray-200 min-h-screen">
        <Sidebar items={workerNav} />
        <div className="p-4 mt-auto border-t border-gray-200">
          <Link
            href="/auth/logout"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50"
          >
            <LogOut size={20} />
            <span>Log out</span>
          </Link>
        </div>
      </div>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

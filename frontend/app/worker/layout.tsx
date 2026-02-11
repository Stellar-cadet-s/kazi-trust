import { ReactNode } from 'react';
import { LayoutDashboard, Briefcase, BookOpen } from 'lucide-react';
import { Sidebar } from '@/components/layout';

const workerNav = [
  { href: '/worker/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { href: '/worker/browse', label: 'Browse Jobs', icon: <Briefcase size={20} /> },
  { href: '/worker/rights', label: 'Know Your Rights', icon: <BookOpen size={20} /> },
];

export default function WorkerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={workerNav} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

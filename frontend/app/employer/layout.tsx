import { ReactNode } from 'react';
import { LayoutDashboard, Briefcase, Users, BookOpen } from 'lucide-react';
import { Sidebar } from '@/components/layout';

const employerNav = [
  { href: '/employer/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { href: '/employer/contracts/new', label: 'Post a Job', icon: <Briefcase size={20} /> },
  { href: '/employer/workers', label: 'Find Workers', icon: <Users size={20} /> },
  { href: '/employer/rights', label: 'Know Your Rights', icon: <BookOpen size={20} /> },
];

export default function EmployerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={employerNav} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

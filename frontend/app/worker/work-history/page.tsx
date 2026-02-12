'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/ui';
import { employeeService, type WorkHistoryEntry } from '@/services/api';
import { getToken, getUser } from '@/lib/auth';

function formatDuration(days: number): string {
  if (days === 0) return 'Same day';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.floor(days / 7)} wk`;
  return `${Math.floor(days / 30)} mo`;
}

export default function WorkHistoryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<WorkHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.push('/auth/login');
      return;
    }
    const user = getUser();
    if (user?.user_type !== 'employee') {
      router.push('/employer/dashboard');
      return;
    }
    employeeService
      .workHistory()
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div>
        <PageHeader title="My work history" description="Loading..." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Verifiable work history"
        description="Completed jobs that employers can see when you apply"
      />
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      <p className="text-gray-600 mb-6">
        This list shows your completed jobs. Employers see this when you apply so they can trust your experience.
      </p>
      {entries.length === 0 ? (
        <Card>
          <p className="text-gray-500 py-8 text-center">
            No completed jobs yet. Complete jobs to build your verifiable work history.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((e) => (
            <Card key={e.job_id} className="p-5 border-l-4 border-emerald-500">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 rounded-full shrink-0">
                  <CheckCircle className="text-emerald-600" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{e.job_title}</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
                      Verified
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {e.employer_name && <span>{e.employer_name} · </span>}
                    <span className="flex items-center gap-1 mt-0.5">
                      <Clock size={12} />
                      {formatDuration(e.duration_days)}
                      {e.completed_at && (
                        <span> · {new Date(e.completed_at).toLocaleDateString()}</span>
                      )}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">KES {e.budget}</p>
                  {e.work_summary && (
                    <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded-lg">
                      {e.work_summary}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import { jobService } from '@/services/api';
import { getToken, getUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import type { JobListing } from '@/types';

export default function WorkerDashboardPage() {
  const router = useRouter();
  const user = getUser();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.push('/auth/login');
      return;
    }
    jobService
      .list()
      .then((list) => setJobs(Array.isArray(list) ? list : []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [router]);

  const myJobs = user ? jobs.filter((j) => j.employee === user.id) : [];
  const openCount = jobs.filter((j) => j.status === 'open').length;
  const activeCount = myJobs.filter((j) => ['assigned', 'in_progress'].includes(j.status)).length;

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Loading..." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your jobs and earnings overview"
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Briefcase className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-sm text-gray-600">Active Jobs</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <DollarSign className="text-emerald-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{openCount}</p>
              <p className="text-sm text-gray-600">Open Jobs</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">My Jobs</h2>
          <Link href="/worker/browse">
            <Button variant="primary">Browse open jobs</Button>
          </Link>
        </div>
        <div className="space-y-4">
          {myJobs.length === 0 ? (
            <p className="text-gray-500 py-4">You have no assigned jobs yet. Browse open jobs to apply.</p>
          ) : (
            myJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div>
                  <p className="font-semibold text-gray-900">{job.title}</p>
                  <p className="text-sm text-gray-600">KES {job.budget} · {job.status}</p>
                </div>
                <Badge variant={job.status === 'completed' ? 'success' : 'warning'}>{job.status}</Badge>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

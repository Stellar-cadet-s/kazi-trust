'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Users, Clock, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import { jobService } from '@/services/api';
import { getToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import type { JobListing } from '@/types';

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  open: 'info',
  assigned: 'warning',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
};

export default function EmployerDashboardPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/auth/login');
      return;
    }
    jobService
      .list()
      .then((list) => setJobs(Array.isArray(list) ? list : []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load jobs'))
      .finally(() => setLoading(false));
  }, [router]);

  const active = jobs.filter((j) => ['open', 'assigned', 'in_progress'].includes(j.status)).length;
  const completed = jobs.filter((j) => j.status === 'completed').length;
  const withWorker = jobs.filter((j) => j.employee != null).length;

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Loading..." />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your jobs and workers"
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
              <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
              <p className="text-sm text-gray-600">Total Jobs</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Users className="text-emerald-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{withWorker}</p>
              <p className="text-sm text-gray-600">Workers Hired</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{active}</p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completed}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Jobs</h2>
          <Link href="/employer/contracts/new">
            <Button variant="primary">Post a Job</Button>
          </Link>
        </div>
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <p className="text-gray-500 py-4">No jobs yet. Post your first job to get started.</p>
          ) : (
            jobs.slice(0, 10).map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div>
                  <p className="font-semibold text-gray-900">{job.title}</p>
                  <p className="text-sm text-gray-600">
                    KES {job.budget} · {job.employer_name || 'Your job'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={statusVariant[job.status] || 'info'}>{job.status}</Badge>
                  <Link href={`/employer/jobs/${job.id}`}>
                    <Button variant="outline">View</Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

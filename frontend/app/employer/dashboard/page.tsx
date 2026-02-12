'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Users, Clock, CheckCircle, Wallet, History } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import { PaystackButton } from '@/components/PaystackButton';
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

function durationDays(job: JobListing): number | null {
  const start = job.assigned_at ? new Date(job.assigned_at).getTime() : job.created_at ? new Date(job.created_at).getTime() : null;
  if (start == null) return null;
  const end = job.completed_at ? new Date(job.completed_at).getTime() : Date.now();
  return Math.floor((end - start) / (24 * 60 * 60 * 1000));
}

function formatDuration(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.floor(days / 7)} wk`;
  return `${Math.floor(days / 30)} mo`;
}

export default function EmployerDashboardPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadJobs = () => {
    jobService
      .list()
      .then((list) => setJobs(Array.isArray(list) ? list : []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load jobs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/auth/login');
      return;
    }
    loadJobs();
  }, [router]);

  const active = jobs.filter((j) => ['open', 'assigned', 'in_progress'].includes(j.status)).length;
  const completed = jobs.filter((j) => j.status === 'completed').length;
  const hired = jobs.filter((j) => j.employee != null);
  const needsDeposit = jobs.filter((j) => j.status === 'open' && j.escrow_contract_id);
  const canComplete = jobs.filter((j) => ['assigned', 'in_progress'].includes(j.status) && j.employee);

  const handleComplete = async (jobId: number) => {
    try {
      await jobService.complete(jobId);
      loadJobs();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

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
              <p className="text-2xl font-bold text-gray-900">{hired.length}</p>
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

      {hired.length > 0 && (
        <Card className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={22} />
            Employees Hired & Duration
          </h2>
          <div className="space-y-3">
            {hired.map((job) => {
              const days = durationDays(job);
              return (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{job.title}</p>
                    <p className="text-sm text-gray-600">
                      {job.employee_name || 'Worker'} · KES {job.budget}
                      {days != null && (
                        <span className="ml-2 text-gray-500">
                          · {formatDuration(days)}{job.status === 'completed' ? '' : ' (active)'}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusVariant[job.status] || 'info'}>{job.status}</Badge>
                    {['assigned', 'in_progress'].includes(job.status) && (
                      <Button
                        variant="primary"
                        onClick={() => handleComplete(job.id)}
                      >
                        Work done
                      </Button>
                    )}
                    <Link href={`/employer/jobs/${job.id}`}>
                      <Button variant="outline">View</Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Jobs</h2>
          <div className="flex gap-2 flex-wrap">
            <Link href="/employer/workers">
              <Button variant="outline" className="flex items-center gap-2">
                <Users size={18} />
                Find Workers
              </Button>
            </Link>
            <Link href="/employer/transactions">
              <Button variant="outline" className="flex items-center gap-2">
                <History size={18} />
                Transactions
              </Button>
            </Link>
            <Link href="/employer/contracts/new">
              <Button variant="primary">Post a Job</Button>
            </Link>
          </div>
        </div>
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <p className="text-gray-500 py-4">No jobs yet. Post your first job to get started.</p>
          ) : (
            jobs.slice(0, 10).map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl flex-wrap gap-3"
              >
                <div>
                  <p className="font-semibold text-gray-900">{job.title}</p>
                  <p className="text-sm text-gray-600">
                    KES {job.budget}
                    {job.employee_name && ` · ${job.employee_name}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant={statusVariant[job.status] || 'info'}>{job.status}</Badge>
                  {job.status === 'open' && job.escrow_contract_id && (
                    <PaystackButton
                      jobId={job.id}
                      onSuccess={loadJobs}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Deposit
                    </PaystackButton>
                  )}
                  {['assigned', 'in_progress'].includes(job.status) && job.employee && (
                    <Button
                      variant="primary"
                      onClick={() => handleComplete(job.id)}
                    >
                      Work done
                    </Button>
                  )}
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

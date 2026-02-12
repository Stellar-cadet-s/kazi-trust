'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card, Input, Badge, Button } from '@/components/ui';
import { jobService, employeeService } from '@/services/api';
import { getToken, getUser } from '@/lib/auth';
import type { JobListing } from '@/types';

export default function BrowseJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());
  const [pendingJobIds, setPendingJobIds] = useState<Set<number>>(new Set());

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
    Promise.all([jobService.list(), employeeService.myApplications().catch(() => [])])
      .then(([list, applications]) => {
        setJobs(Array.isArray(list) ? list : []);
        const ids = new Set<number>();
        const pending = new Set<number>();
        (applications || []).forEach((a: { job_id: number; status: string }) => {
          ids.add(a.job_id);
          if (a.status === 'pending') pending.add(a.job_id);
        });
        setAppliedIds(ids);
        setPendingJobIds(pending);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load jobs'))
      .finally(() => setLoading(false));
  }, [router]);

  const user = getUser();
  const openJobs = jobs.filter((j) => j.status === 'open');
  const filtered = search.trim()
    ? openJobs.filter(
        (j) =>
          j.title.toLowerCase().includes(search.toLowerCase()) ||
          j.description.toLowerCase().includes(search.toLowerCase())
      )
    : openJobs;

  const handleApply = async (jobId: number) => {
    if (!user?.id) return;
    setApplyingId(jobId);
    setError('');
    try {
      await jobService.apply(jobId);
      setAppliedIds((prev) => new Set(prev).add(jobId));
      setPendingJobIds((prev) => new Set(prev).add(jobId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply');
    } finally {
      setApplyingId(null);
    }
  };

  const handleWithdraw = async (jobId: number) => {
    setWithdrawingId(jobId);
    setError('');
    try {
      await jobService.withdrawApplication(jobId);
      setAppliedIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
      setPendingJobIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw');
    } finally {
      setWithdrawingId(null);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Browse Jobs" description="Loading..." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Browse Jobs"
        description="Find domestic work opportunities"
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <Card className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search jobs..."
              className="w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card>
            <p className="text-gray-500 py-4">
              {openJobs.length === 0 ? 'No open jobs at the moment.' : 'No jobs match your search.'}
            </p>
          </Card>
        ) : (
          filtered.map((job) => (
            <Card key={job.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    <Badge variant="info">{job.status}</Badge>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>

                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <DollarSign size={16} />
                      KES {job.budget}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {appliedIds.has(job.id) ? (
                    <>
                      <span className="text-sm text-gray-500">Applied</span>
                      {pendingJobIds.has(job.id) && (
                        <Button
                          variant="outline"
                          onClick={() => handleWithdraw(job.id)}
                          disabled={withdrawingId === job.id}
                        >
                          {withdrawingId === job.id ? 'Withdrawing...' : 'Withdraw'}
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => handleApply(job.id)}
                      disabled={applyingId === job.id}
                    >
                      {applyingId === job.id ? 'Applying...' : 'Apply'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

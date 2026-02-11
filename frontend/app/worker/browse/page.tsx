'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card, Input, Badge, Button } from '@/components/ui';
import { jobService } from '@/services/api';
import { getToken, getUser } from '@/lib/auth';
import type { JobListing } from '@/types';

export default function BrowseJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [applyingId, setApplyingId] = useState<number | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push('/auth/login');
      return;
    }
    jobService
      .list()
      .then((list) => setJobs(Array.isArray(list) ? list : []))
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
      await jobService.update(jobId, { employee_id: user.id });
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: 'assigned' as const, employee: user.id } : j))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply');
    } finally {
      setApplyingId(null);
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

                <Button
                  variant="primary"
                  onClick={() => handleApply(job.id)}
                  disabled={applyingId === job.id}
                >
                  {applyingId === job.id ? 'Applying...' : 'Apply'}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

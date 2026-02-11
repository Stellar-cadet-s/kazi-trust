'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout';
import { Card, Badge, Button, Input } from '@/components/ui';
import { jobService } from '@/services/api';
import { getToken } from '@/lib/auth';
import type { JobListing } from '@/types';

export default function EmployerJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.push('/auth/login');
      return;
    }
    jobService
      .get(id)
      .then(setJob)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load job'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleComplete = async () => {
    setCompleting(true);
    setError('');
    try {
      await jobService.complete(id);
      if (job) setJob({ ...job, status: 'completed' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete');
    } finally {
      setCompleting(false);
    }
  };

  const handleAssign = async () => {
    const eid = Number(employeeId);
    if (!eid) return;
    setAssigning(true);
    setError('');
    try {
      const updated = await jobService.update(id, { employee_id: eid });
      setJob(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  if (loading || !job) {
    return (
      <div>
        <PageHeader title="Job" description={loading ? 'Loading...' : 'Not found'} />
      </div>
    );
  }

  const canComplete = job.status === 'in_progress';
  const canAssign = job.status === 'open';

  return (
    <div>
      <PageHeader
        title={job.title}
        description={`KES ${job.budget} · ${job.status}`}
      />
      <div className="mb-4">
        <Link href="/employer/dashboard" className="text-blue-600 hover:underline">
          ← Back to dashboard
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <Card className="max-w-2xl mb-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant={job.status === 'completed' ? 'success' : 'info'}>{job.status}</Badge>
            {job.escrow_contract_id && (
              <span className="text-sm text-gray-500">Escrow: {job.escrow_contract_id}</span>
            )}
          </div>
          <p className="text-gray-700">{job.description}</p>
          <p className="text-sm text-gray-600">
            Budget: KES {job.budget} · Created {new Date(job.created_at).toLocaleDateString()}
          </p>
        </div>
      </Card>

      {canAssign && (
        <Card className="max-w-2xl mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Assign worker</h3>
          <p className="text-sm text-gray-600 mb-3">
            Enter the worker&apos;s user ID (they must have registered as Worker).
          </p>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Worker user ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="flex-1"
            />
            <Button variant="primary" onClick={handleAssign} disabled={assigning}>
              {assigning ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </Card>
      )}

      {canComplete && (
        <Card className="max-w-2xl">
          <h3 className="font-semibold text-gray-900 mb-2">Work complete</h3>
          <p className="text-sm text-gray-600 mb-3">
            Releasing escrow will pay the worker via mobile money.
          </p>
          <Button variant="primary" onClick={handleComplete} disabled={completing}>
            {completing ? 'Releasing...' : 'Mark complete & release payment'}
          </Button>
        </Card>
      )}
    </div>
  );
}

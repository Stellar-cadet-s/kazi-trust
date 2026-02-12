'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import { PaystackButton } from '@/components/PaystackButton';
import { jobService, type JobApplicant, type EscrowInfo, type WorkHistoryItem } from '@/services/api';
import { getToken } from '@/lib/auth';
import type { JobListing } from '@/types';

export default function EmployerJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [job, setJob] = useState<JobListing | null>(null);
  const [applicants, setApplicants] = useState<JobApplicant[]>([]);
  const [escrow, setEscrow] = useState<EscrowInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplicantId, setSelectedApplicantId] = useState<string>('');
  const [workSummary, setWorkSummary] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [completing, setCompleting] = useState(false);

  const load = () => {
    jobService.get(id).then(setJob).catch(() => setError('Failed to load job'));
    jobService.applicants(id).then(setApplicants).catch(() => {});
    jobService.escrow(id).then(setEscrow).catch(() => {});
  };

  useEffect(() => {
    if (!getToken()) {
      router.push('/auth/login');
      return;
    }
    Promise.all([
      jobService.get(id),
      jobService.applicants(id).catch(() => []),
      jobService.escrow(id).catch(() => null),
    ])
      .then(([j, a, e]) => {
        setJob(j);
        setApplicants(Array.isArray(a) ? a : []);
        setEscrow(e ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleAssign = async () => {
    const applicantId = selectedApplicantId ? Number(selectedApplicantId) : null;
    if (!applicantId) return;
    setAssigning(true);
    setError('');
    try {
      const updated = await jobService.update(id, { applicant_id: applicantId });
      setJob(updated);
      setApplicants((prev) => prev.filter((a) => a.id !== applicantId));
      setSelectedApplicantId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    setError('');
    try {
      await jobService.complete(id, workSummary ? { work_summary: workSummary } : undefined);
      const updated = await jobService.get(id);
      setJob(updated);
      jobService.escrow(id).then(setEscrow);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete');
    } finally {
      setCompleting(false);
    }
  };

  if (loading || !job) {
    return (
      <div>
        <PageHeader title="Job" description={loading ? 'Loading...' : 'Not found'} />
      </div>
    );
  }

  const canAssign = job.status === 'open' && applicants.length > 0;
  const canComplete = ['assigned', 'in_progress'].includes(job.status) && job.employee;
  const canDeposit = job.status === 'open' && job.escrow_contract_id;

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

      {escrow && (
        <Card className="mb-6 bg-blue-50/50 border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">Escrow</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-600">Amount held (KES / XLM):</span>
            <span className="font-medium">{escrow.amount_held_kes ?? escrow.amount_held}</span>
            <span className="text-gray-600">Status:</span>
            <span className="font-medium">{escrow.status}</span>
            <span className="text-gray-600">When release:</span>
            <span className="font-medium">{escrow.when_release ?? '—'}</span>
          </div>
        </Card>
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
            {job.employee_name && ` · Worker: ${job.employee_name}`}
          </p>
          {job.employee_name && job.employee_phone && (
            <p className="text-sm text-gray-700 mt-2 flex items-center gap-1">
              <Phone size={14} />
              M-Pesa number for payment: {job.employee_phone}
            </p>
          )}
        </div>
      </Card>

      {canDeposit && (
        <Card className="max-w-2xl mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Fund escrow</h3>
          <p className="text-sm text-gray-600 mb-3">Pay with Paystack to hold funds in escrow until work is done.</p>
          <PaystackButton jobId={id} onSuccess={load} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700">
            Deposit with Paystack
          </PaystackButton>
        </Card>
      )}

      {canAssign && (
        <Card className="max-w-2xl mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Available applicants</h3>
          <p className="text-sm text-gray-600 mb-3">Select a worker to assign. Verified work history is shown below.</p>
          <div className="flex gap-2 flex-wrap items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Applicant</label>
              <select
                value={selectedApplicantId}
                onChange={(e) => setSelectedApplicantId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose...</option>
                {applicants.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.employee_name} · {a.employee_phone}
                    {a.work_history?.length ? ` (${a.work_history.length} verified jobs)` : ''}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="primary"
              onClick={handleAssign}
              disabled={!selectedApplicantId || assigning}
            >
              {assigning ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
          {selectedApplicantId && (() => {
            const app = applicants.find((a) => String(a.id) === selectedApplicantId);
            const history = app?.work_history || [];
            if (history.length === 0) return null;
            return (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-2">Verified work history</p>
                <ul className="space-y-2 text-sm">
                  {history.map((w: WorkHistoryItem, idx: number) => (
                    <li key={idx} className="text-gray-700">
                      <span className="font-medium">{w.job_title}</span>
                      {w.duration_days >= 0 && (
                        <span className="text-gray-500 ml-1">
                          · {w.duration_days === 0 ? 'Same day' : w.duration_days === 1 ? '1 day' : `${w.duration_days} days`}
                        </span>
                      )}
                      {w.work_summary && <p className="text-gray-600 mt-0.5">{w.work_summary}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}
        </Card>
      )}

      {canComplete && (
        <Card className="max-w-2xl">
          <h3 className="font-semibold text-gray-900 mb-2">Work complete</h3>
          <p className="text-sm text-gray-600 mb-3">
            Release escrow to pay the worker via M-Pesa. Optionally add a short summary of tasks done (visible as verified work to other employers).
          </p>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tasks completed (optional)</label>
            <textarea
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              placeholder="e.g. Cleaning, laundry, cooking as agreed"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              rows={2}
            />
          </div>
          {job.employee_phone && (
            <p className="text-sm text-gray-700 mb-3 flex items-center gap-1">
              <Phone size={14} />
              Payment will be sent to: {job.employee_phone}
            </p>
          )}
          <Button variant="primary" onClick={handleComplete} disabled={completing}>
            {completing ? 'Releasing...' : 'Mark complete & release payment'}
          </Button>
        </Card>
      )}
    </div>
  );
}

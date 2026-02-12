'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, User, Briefcase, Clock, Phone, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card, Input, Badge, Button } from '@/components/ui';
import { employerService, jobService, type HiredWorker, type OpenJobWithApplicants } from '@/services/api';
import { getToken, getUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

function formatDuration(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.floor(days / 7)} wk`;
  return `${Math.floor(days / 30)} mo`;
}

export default function FindWorkersPage() {
  const router = useRouter();
  const [hired, setHired] = useState<HiredWorker[]>([]);
  const [openJobs, setOpenJobs] = useState<OpenJobWithApplicants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [assigningJobId, setAssigningJobId] = useState<number | null>(null);
  const [assigningApplicantId, setAssigningApplicantId] = useState<number | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push('/auth/login');
      return;
    }
    const user = getUser();
    if (user?.user_type !== 'employer') {
      router.push('/worker/dashboard');
      return;
    }
    employerService
      .workersOverview()
      .then((res) => {
        setHired(res.hired_workers || []);
        setOpenJobs(res.open_jobs_with_applicants || []);
        setError('');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load workers');
        setHired([]);
        setOpenJobs([]);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const filteredHired = search.trim()
    ? hired.filter(
        (w) =>
          w.employee_name.toLowerCase().includes(search.toLowerCase()) ||
          w.job_title.toLowerCase().includes(search.toLowerCase())
      )
    : hired;
  const jobsWithApplicants = openJobs.filter((j) => (j.applicant_count || (j.applicants?.length ?? 0)) > 0);

  const handleAssign = async (jobId: number, applicantId: number) => {
    setAssigningJobId(jobId);
    setAssigningApplicantId(applicantId);
    setError('');
    try {
      await jobService.update(jobId, { applicant_id: applicantId });
      const res = await employerService.workersOverview();
      setHired(res.hired_workers || []);
      setOpenJobs(res.open_jobs_with_applicants || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign');
    } finally {
      setAssigningJobId(null);
      setAssigningApplicantId(null);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Find Workers" description="Loading..." />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Find Workers"
        description="Hired workers and jobs waiting for assignment"
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <Card className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by worker or job..."
              className="w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {jobsWithApplicants.length > 0 && (
        <Card className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase size={22} />
            Open jobs – employees who applied (assign to a job)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Below are workers who applied. Assign one to the job; payment will be sent to their M-Pesa number when you mark work complete.
          </p>
          <div className="space-y-6">
            {jobsWithApplicants.map((job) => {
              const applicants = job.applicants || [];
              return (
                <div key={job.job_id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-gray-900">{job.job_title}</p>
                    <Link href={`/employer/jobs/${job.job_id}`}>
                      <Button variant="outline" className="text-sm">View job</Button>
                    </Link>
                  </div>
                  {applicants.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {applicants.map((a) => {
                        const history = a.work_history || [];
                        return (
                          <Card key={a.id} className="p-4 flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-gray-900">{a.employee_name}</p>
                                {a.employee_phone && (
                                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                                    <Phone size={14} />
                                    {a.employee_phone}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="primary"
                                className="text-sm"
                                onClick={() => handleAssign(job.job_id, a.id)}
                                disabled={assigningJobId === job.job_id && assigningApplicantId === a.id}
                              >
                                {assigningJobId === job.job_id && assigningApplicantId === a.id ? 'Assigning...' : 'Assign'}
                              </Button>
                            </div>
                            {history.length > 0 && (
                              <div className="mt-2 pt-3 border-t border-gray-200">
                                <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-2">
                                  <CheckCircle size={14} />
                                  Verified work ({history.length} job{history.length !== 1 ? 's' : ''})
                                </p>
                                <ul className="space-y-2 text-sm">
                                  {history.slice(0, 3).map((w, idx) => (
                                    <li key={idx} className="text-gray-700">
                                      <span className="font-medium">{w.job_title}</span>
                                      {w.duration_days >= 0 && (
                                        <span className="text-gray-500 ml-1">
                                          · {formatDuration(w.duration_days)}
                                        </span>
                                      )}
                                      {w.work_summary && (
                                        <p className="text-gray-600 mt-0.5 truncate max-w-full" title={w.work_summary}>
                                          {w.work_summary}
                                        </p>
                                      )}
                                    </li>
                                  ))}
                                  {history.length > 3 && (
                                    <li className="text-gray-500">+{history.length - 3} more</li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {job.applicant_count || 0} applicant(s).{' '}
                      <Link href={`/employer/jobs/${job.job_id}`} className="text-blue-600 hover:underline">
                        Open job to assign
                      </Link>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {openJobs.length > 0 && jobsWithApplicants.length === 0 && (
        <Card className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Open jobs</h2>
          <p className="text-sm text-gray-600 mb-4">
            No applicants yet. Workers apply from the worker app (Browse Jobs). Share your job or wait for applications.
          </p>
          <div className="flex flex-wrap gap-2">
            {openJobs.map((job) => (
              <Link key={job.job_id} href={`/employer/jobs/${job.job_id}`}>
                <Button variant="outline">{job.job_title}</Button>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User size={22} />
          Hired workers
        </h2>
        {filteredHired.length === 0 ? (
          <p className="text-gray-500 py-4">
            {hired.length === 0
              ? 'No workers hired yet. Post a job, then assign from applicants on the job page.'
              : 'No workers match your search.'}
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredHired.map((w) => (
              <div key={`${w.job_id}-${w.employee_id}`} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{w.employee_name}</h3>
                    <p className="text-sm text-gray-600">{w.job_title}</p>
                    {w.employee_phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                        <Phone size={14} />
                        M-Pesa: {w.employee_phone}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <Clock size={14} />
                      {formatDuration(w.duration_days)}
                      {w.status === 'completed' ? ' · Completed' : ' · Active'}
                    </p>
                  </div>
                  <Badge variant={w.status === 'completed' ? 'success' : 'warning'}>
                    {w.status}
                  </Badge>
                </div>
                <Link href={`/employer/jobs/${w.job_id}`} className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                  View job →
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

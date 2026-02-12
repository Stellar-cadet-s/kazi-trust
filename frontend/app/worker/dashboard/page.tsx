'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, DollarSign, Wallet, History, Phone, TrendingUp, Coins } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import { jobService, transactionService, type EscrowInfo, type TransactionItem } from '@/services/api';
import { getToken, getUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import type { JobListing } from '@/types';

export default function WorkerDashboardPage() {
  const router = useRouter();
  const user = getUser();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [escrows, setEscrows] = useState<EscrowInfo[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.push('/auth/login');
      return;
    }
    Promise.all([
      jobService.list(),
      transactionService.list().catch(() => []),
    ])
      .then(([list, txList]) => {
        const arr = Array.isArray(list) ? list : [];
        setJobs(arr);
        setTransactions(Array.isArray(txList) ? (txList as TransactionItem[]) : []);
        const myJobs = user ? arr.filter((j) => j.employee === user.id) : [];
        return Promise.all(myJobs.map((j) => jobService.escrow(j.id).catch(() => null)));
      })
      .then((results) => setEscrows(results.filter((e): e is EscrowInfo => e != null)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [router, user?.id]);

  const myJobs = user ? jobs.filter((j) => j.employee === user.id) : [];
  const openCount = jobs.filter((j) => j.status === 'open').length;
  const activeCount = myJobs.filter((j) => ['assigned', 'in_progress'].includes(j.status)).length;
  const totalHeld = escrows
    .filter((e) => e.status === 'funded' || e.status === 'in_progress')
    .reduce((sum, e) => sum + parseFloat(e.amount_held || '0'), 0);
  const totalEarnings = (transactions || [])
    .filter((t) => t.type === 'payout' && String(t.status).toLowerCase() === 'completed')
    .reduce((sum, t) => sum + parseFloat(String(t.amount || '0')), 0);
  const mpesaNumber = user?.phone_number || null;
  const stellarInvested = 0;
  const stellarReturnRate = 5;
  const stellarReturnAmount = (stellarInvested * stellarReturnRate) / 100;

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
        description="Your jobs and earnings"
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <DollarSign className="text-emerald-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">KES {totalEarnings.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Total earnings</p>
            </div>
          </div>
        </Card>
        {mpesaNumber && (
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Phone className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 truncate">{mpesaNumber}</p>
                <p className="text-sm text-gray-600">M-Pesa (payment number)</p>
              </div>
            </div>
          </Card>
        )}
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
            <div className="p-3 bg-amber-100 rounded-xl">
              <DollarSign className="text-amber-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{openCount}</p>
              <p className="text-sm text-gray-600">Open Jobs</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Save & earn with Stellar */}
      <Card className="mb-8 bg-gradient-to-br from-amber-50 to-white border-amber-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Coins size={22} className="text-amber-600" />
          Save & earn interest (Stellar USD)
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          You can invest part of your earnings in Stellar USD and earn interest over time. Your money grows while you work.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 bg-white/70 rounded-xl border border-amber-100">
            <p className="text-sm text-gray-500">Amount invested</p>
            <p className="text-2xl font-bold text-gray-900">KES {stellarInvested.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Start saving to see your balance here</p>
          </div>
          <div className="p-4 bg-white/70 rounded-xl border border-emerald-100">
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <TrendingUp size={14} />
              Est. return (~{stellarReturnRate}% APY)
            </p>
            <p className="text-2xl font-bold text-emerald-700">KES {stellarReturnAmount.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Earn more when you invest</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4">
          When you’re ready, you’ll be able to choose how much to keep in M-Pesa and how much to put into Stellar USD to earn interest.
        </p>
      </Card>

      {escrows.length > 0 && (
        <Card className="mb-8 bg-blue-50/50 border-blue-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Wallet size={22} />
            Amount held in escrow (KES / XLM)
          </h2>
          <div className="space-y-4">
            {escrows.map((e) => (
              <div key={e.job_id} className="p-4 bg-white rounded-xl border border-gray-200">
                <p className="font-semibold text-gray-900">{e.job_title}</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">
                  KES {e.amount_held_kes ?? e.amount_held}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Status: {e.status} · When you receive: {e.when_release ?? 'When employer marks work done'}
                </p>
              </div>
            ))}
            <p className="text-sm text-gray-600 pt-2">
              Total held: KES {totalHeld.toFixed(2)}. Released to your mobile money when employer marks work done.
            </p>
          </div>
        </Card>
      )}

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">My Jobs</h2>
          <div className="flex gap-2">
            <Link href="/worker/transactions">
              <Button variant="outline" className="flex items-center gap-2">
                <History size={18} />
                Transactions
              </Button>
            </Link>
            <Link href="/worker/browse">
              <Button variant="primary">Browse open jobs</Button>
            </Link>
          </div>
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

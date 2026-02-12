'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout';
import { Card, Badge } from '@/components/ui';
import { transactionService, type TransactionItem } from '@/services/api';
import { getToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function EmployerTransactionsPage() {
  const router = useRouter();
  const [list, setList] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push('/auth/login');
      return;
    }
    transactionService
      .list()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div>
      <PageHeader
        title="Transaction history"
        description="Deposits and payments"
      />
      <div className="mb-4">
        <Link href="/employer/dashboard" className="text-blue-600 hover:underline">
          ← Dashboard
        </Link>
      </div>
      <Card>
        {loading ? (
          <p className="text-gray-500 py-4">Loading...</p>
        ) : list.length === 0 ? (
          <p className="text-gray-500 py-4">No transactions yet.</p>
        ) : (
          <div className="space-y-3">
            {list.map((t) => (
              <div
                key={`${t.type}-${t.id}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div>
                  <p className="font-semibold text-gray-900">{t.job_title}</p>
                  <p className="text-sm text-gray-600">
                    {t.type === 'deposit' ? 'Deposit' : 'Payout'} · {t.currency} {t.amount}
                  </p>
                  <p className="text-xs text-gray-500">{new Date(t.created_at).toLocaleString()}</p>
                </div>
                <Badge variant={t.status === 'completed' ? 'success' : 'warning'}>{t.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

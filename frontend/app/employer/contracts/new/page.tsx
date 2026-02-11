'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, Input, Textarea, Button } from '@/components/ui';
import { jobService } from '@/services/api';
import { getToken } from '@/lib/auth';

export default function PostJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }
      await jobService.create({
        title: title.trim(),
        description: description.trim(),
        budget: budget.trim(),
      });
      router.push('/employer/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Post a Job"
        description="Create a new job listing. Escrow will be set up for the budget."
      />

      <Card className="max-w-2xl">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <Input
            label="Job Title"
            placeholder="e.g., House Cleaning, Gardening"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Textarea
            label="Job Description"
            placeholder="Describe the work to be done..."
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <Input
            type="number"
            label="Budget (KES)"
            placeholder="5000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
            min={1}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-4">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Posting...' : 'Post Job'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/employer/dashboard')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

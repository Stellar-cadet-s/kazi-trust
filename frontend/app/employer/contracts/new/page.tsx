'use client';

import { PageHeader } from '@/components/layout';
import { Card, Input, Textarea, Button } from '@/components/ui';

export default function PostJobPage() {
  return (
    <div>
      <PageHeader
        title="Post a Job"
        description="Create a new contract for domestic work"
      />

      <Card className="max-w-2xl">
        <form className="space-y-6">
          <Input
            label="Job Title"
            placeholder="e.g., House Cleaning, Gardening"
            required
          />

          <Textarea
            label="Job Description"
            placeholder="Describe the work to be done..."
            rows={4}
            required
          />

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              type="number"
              label="Payment Amount (KES)"
              placeholder="5000"
              required
            />
            <Input
              type="date"
              label="Start Date"
              required
            />
          </div>

          <Input
            label="Location"
            placeholder="Nairobi, Kenya"
            required
          />

          <div className="flex gap-4">
            <Button type="submit" variant="primary">
              Post Job
            </Button>
            <Button type="button" variant="outline">
              Save as Draft
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

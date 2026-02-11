import { Search, MapPin, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card, Input, Badge, Button } from '@/components/ui';

export default function BrowseJobsPage() {
  return (
    <div>
      <PageHeader
        title="Browse Jobs"
        description="Find domestic work opportunities"
      />

      <Card className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search jobs..."
              className="w-full"
            />
          </div>
          <Button variant="primary">
            <Search size={20} />
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    House Cleaning - Weekly
                  </h3>
                  <Badge variant="success">New</Badge>
                </div>

                <p className="text-gray-600 mb-4">
                  Looking for a reliable house cleaner for weekly cleaning. Must be experienced
                  and have references.
                </p>

                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin size={16} />
                    Nairobi, Kenya
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign size={16} />
                    KES 5,000/week
                  </span>
                </div>
              </div>

              <Button variant="primary">Apply Now</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

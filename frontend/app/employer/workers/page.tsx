import { Search, MapPin, Star } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card, Input, Badge, Button } from '@/components/ui';

export default function FindWorkersPage() {
  return (
    <div>
      <PageHeader
        title="Find Workers"
        description="Browse verified domestic workers"
      />

      <Card className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or skill..."
              className="w-full"
            />
          </div>
          <Button variant="primary">
            <Search size={20} />
          </Button>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Sarah Johnson</h3>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin size={14} />
                  Nairobi, Kenya
                </p>
              </div>
              <Badge variant="verified">Verified</Badge>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Experienced house cleaner with 5+ years. Specializes in deep cleaning.
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-yellow-500">
                <Star size={16} fill="currentColor" />
                <span className="text-sm font-medium text-gray-900">4.8</span>
                <span className="text-sm text-gray-600">(24)</span>
              </div>
              <Button variant="outline">View Profile</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

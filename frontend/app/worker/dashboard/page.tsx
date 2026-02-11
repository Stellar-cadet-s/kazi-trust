import { Briefcase, DollarSign, Clock, Star } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';

export default function WorkerDashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your jobs and earnings overview"
      />

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Briefcase className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">5</p>
              <p className="text-sm text-gray-600">Active Jobs</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <DollarSign className="text-emerald-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">KES 45K</p>
              <p className="text-sm text-gray-600">This Month</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">2</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Star className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">4.9</p>
              <p className="text-sm text-gray-600">Rating</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Jobs */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Jobs</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-semibold text-gray-900">House Cleaning - Weekly</p>
                <p className="text-sm text-gray-600">John Smith • Nairobi</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold text-gray-900">KES 5,000</p>
                <Badge variant="success">In Progress</Badge>
                <Button variant="outline">View Details</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

import { Shield, FileText, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/ui';

export default function EmployerRightsPage() {
  return (
    <div>
      <PageHeader
        title="Know Your Rights"
        description="Understanding your rights and responsibilities as an employer"
      />

      <div className="space-y-6">
        <Card>
          <div className="flex gap-4">
            <Shield className="text-blue-600 flex-shrink-0" size={32} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Your Rights as an Employer
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Right to verify worker credentials and background</li>
                <li>• Right to set clear job expectations and requirements</li>
                <li>• Right to terminate contract with proper notice</li>
                <li>• Right to dispute resolution through platform</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex gap-4">
            <FileText className="text-emerald-600 flex-shrink-0" size={32} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Your Responsibilities
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Provide safe working conditions</li>
                <li>• Pay agreed wages on time</li>
                <li>• Respect worker dignity and rights</li>
                <li>• Follow labor laws and regulations</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex gap-4">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={32} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Important Guidelines
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Always use escrow for payment protection</li>
                <li>• Document all agreements in writing</li>
                <li>• Report any issues through the platform</li>
                <li>• Maintain professional communication</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

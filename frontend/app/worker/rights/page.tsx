import { Shield, FileText, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/ui';

export default function WorkerRightsPage() {
  return (
    <div>
      <PageHeader
        title="Know Your Rights"
        description="Understanding your rights and protections as a worker"
      />

      <div className="space-y-6">
        <Card>
          <div className="flex gap-4">
            <Shield className="text-blue-600 flex-shrink-0" size={32} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Your Rights as a Worker
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Right to fair wages and timely payment</li>
                <li>• Right to safe working conditions</li>
                <li>• Right to dignity and respect</li>
                <li>• Right to refuse unsafe work</li>
                <li>• Right to dispute resolution</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex gap-4">
            <FileText className="text-emerald-600 flex-shrink-0" size={32} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Payment Protection
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• All payments held in secure escrow</li>
                <li>• Automatic release upon job completion</li>
                <li>• Protection against non-payment</li>
                <li>• Transparent payment tracking</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex gap-4">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={32} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Safety Guidelines
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Always verify employer identity</li>
                <li>• Report any safety concerns immediately</li>
                <li>• Keep records of all work agreements</li>
                <li>• Use platform messaging for communication</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { Shield, CheckCircle, Zap, ArrowRight } from 'lucide-react';
import { Navbar, Container } from '@/components/layout';
import { Button, Card } from '@/components/ui';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Building Trust in Domestic Work
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Secure contracts, verified workers, and protected payments through blockchain-powered escrow
            </p>
            
            <div className="flex gap-4 justify-center">
              <Link href="/auth/register?type=employer">
                <Button variant="primary">Continue as Employer</Button>
              </Link>
              <Link href="/auth/register?type=worker">
                <Button variant="secondary">Continue as Worker</Button>
              </Link>
            </div>
          </div>

          {/* Trust Flow */}
          <div className="mt-16 flex items-center justify-center gap-8 max-w-3xl mx-auto">
            <Card className="flex-1 text-center">
              <p className="font-semibold text-gray-900">Employer</p>
            </Card>
            <ArrowRight className="text-blue-600" size={32} />
            <Card className="flex-1 text-center bg-blue-50 border-blue-200">
              <Shield className="mx-auto mb-2 text-blue-600" size={32} />
              <p className="font-semibold text-blue-900">Secure Escrow</p>
            </Card>
            <ArrowRight className="text-blue-600" size={32} />
            <Card className="flex-1 text-center">
              <p className="font-semibold text-gray-900">Worker</p>
            </Card>
          </div>
        </Container>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20">
        <Container>
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How it Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CheckCircle className="text-emerald-500 mb-4" size={40} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Verified Profiles
              </h3>
              <p className="text-gray-600">
                All workers undergo thorough verification to ensure trust and safety
              </p>
            </Card>

            <Card>
              <Shield className="text-blue-600 mb-4" size={40} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Smart Escrow
              </h3>
              <p className="text-gray-600">
                Payments held securely on Stellar blockchain until work is completed
              </p>
            </Card>

            <Card>
              <Zap className="text-yellow-500 mb-4" size={40} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Instant Payments
              </h3>
              <p className="text-gray-600">
                Workers receive payment immediately upon contract completion
              </p>
            </Card>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <Container>
          <div className="flex justify-center gap-8 text-gray-600">
            <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-900">Terms</Link>
            <Link href="/support" className="hover:text-gray-900">Support</Link>
          </div>
        </Container>
      </footer>
    </div>
  );
}

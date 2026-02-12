import Link from 'next/link';
import { Shield, CheckCircle, Zap, ArrowRight, Lock, TrendingUp, Coins } from 'lucide-react';
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

      {/* What the system does + Trust mechanism */}
      <section className="py-20 bg-white border-y border-gray-100">
        <Container>
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            What We Do
          </h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
            We connect employers with domestic workers and hold payment safely until the job is done. No one pays upfront without protection; no one works without guaranteed pay.
          </p>

          <h3 className="text-2xl font-bold text-center text-gray-900 mb-6">
            The Trust Mechanism
          </h3>
          <div className="max-w-3xl mx-auto space-y-6 text-gray-700">
            <Card className="p-6 border-l-4 border-blue-500">
              <div className="flex gap-3">
                <Lock className="text-blue-600 shrink-0 mt-0.5" size={24} />
                <div>
                  <p className="font-semibold text-gray-900">For the employer (sender)</p>
                  <p className="text-gray-600 mt-1">
                    You deposit the agreed amount into secure escrow. Money is only released when you confirm the work is done. If something goes wrong, funds stay protected—you stay in control.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-l-4 border-emerald-500">
              <div className="flex gap-3">
                <Shield className="text-emerald-600 shrink-0 mt-0.5" size={24} />
                <div>
                  <p className="font-semibold text-gray-900">For the worker (receiver)</p>
                  <p className="text-gray-600 mt-1">
                    Payment is already set aside before you start. Once the employer marks the job complete, the money is released straight to your M-Pesa. You don’t chase payment—it’s guaranteed by the system.
                  </p>
                </div>
              </div>
            </Card>
            <p className="text-center text-gray-500 text-sm">
              Escrow creates trust between both sides: the sender knows their money is safe until they’re satisfied; the receiver knows the money is already there and will be paid out.
            </p>
          </div>
        </Container>
      </section>

      {/* Stellar Save & Earn */}
      <section className="py-20 bg-gradient-to-b from-amber-50/50 to-white">
        <Container>
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Save & Earn Interest on Your Money
          </h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
            As a worker, you can put part of your earnings into Stellar-based savings and earn interest over time. Your money works for you.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center p-6 bg-white/80">
              <Coins className="mx-auto mb-3 text-amber-600" size={40} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Stellar USD</h3>
              <p className="text-sm text-gray-600">
                Save in a stable digital currency (USD) on the Stellar network. Safe and easy to understand.
              </p>
            </Card>
            <Card className="text-center p-6 bg-white/80">
              <TrendingUp className="mx-auto mb-3 text-emerald-600" size={40} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Earn APY</h3>
              <p className="text-sm text-gray-600">
                Earn interest on what you save. Example: save KES 10,000 and earn returns over time—your balance grows without extra work.
              </p>
            </Card>
            <Card className="text-center p-6 bg-white/80">
              <Zap className="mx-auto mb-3 text-blue-600" size={40} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">You Choose</h3>
              <p className="text-sm text-gray-600">
                Decide how much to keep in M-Pesa and how much to invest. Start small, add more when you’re ready.
              </p>
            </Card>
          </div>
          <p className="text-center text-gray-500 text-sm mt-8 max-w-xl mx-auto">
            On your worker dashboard you can see your total earnings, your payment number, and the option to invest in Stellar USD and track your returns.
          </p>
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

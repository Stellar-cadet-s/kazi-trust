'use client';

import Link from 'next/link';
import { Shield, CheckCircle, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { Navbar, Container } from '@/components/layout';
import { Button, Card } from '@/components/ui';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#7B3FF2]/10 via-[#00A8E8]/10 to-[#006B3F]/10" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#7B3FF2]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#00A8E8]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <Container className="relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6 shadow-lg">
              <Sparkles className="text-[#FFB81C]" size={20} />
              <span className="text-sm font-semibold bg-gradient-to-r from-[#7B3FF2] to-[#00A8E8] bg-clip-text text-transparent">
                Powered by Stellar Blockchain
              </span>
            </div>
            
            <h1 className="text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-[#7B3FF2] via-[#00A8E8] to-[#006B3F] bg-clip-text text-transparent">
                Building Trust
              </span>
              <br />
              <span className="text-gray-900">in Domestic Work</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Secure contracts, verified workers, and protected payments through
              <span className="font-semibold text-[#7B3FF2]"> blockchain-powered escrow</span>
            </p>
            
            <div className="flex gap-4 justify-center">
              <Button variant="stellar" onClick={() => window.location.href = '/auth/register?type=employer'}>
                Continue as Employer
              </Button>
              <Button variant="kenya" onClick={() => window.location.href = '/auth/register?type=worker'}>
                Continue as Worker
              </Button>
            </div>
          </div>

          {/* Trust Flow */}
          <div className="mt-20 flex items-center justify-center gap-6 max-w-4xl mx-auto">
            <Card hover gradient className="flex-1 text-center">
              <p className="font-semibold text-gray-900">Employer</p>
              <p className="text-xs text-gray-500 mt-1">Posts Job</p>
            </Card>
            <ArrowRight className="text-[#7B3FF2] animate-pulse" size={32} />
            <Card hover gradient className="flex-1 text-center bg-gradient-to-br from-[#7B3FF2]/10 to-[#00A8E8]/10">
              <Shield className="mx-auto mb-2 text-[#7B3FF2]" size={32} />
              <p className="font-semibold bg-gradient-to-r from-[#7B3FF2] to-[#00A8E8] bg-clip-text text-transparent">Stellar Escrow</p>
              <p className="text-xs text-gray-500 mt-1">Funds Secured</p>
            </Card>
            <ArrowRight className="text-[#006B3F] animate-pulse" size={32} style={{ animationDelay: '0.5s' }} />
            <Card hover gradient className="flex-1 text-center">
              <p className="font-semibold text-gray-900">Worker</p>
              <p className="text-xs text-gray-500 mt-1">Gets Paid</p>
            </Card>
          </div>
        </Container>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#7B3FF2] to-[#00A8E8] bg-clip-text text-transparent">
                How it Works
              </span>
            </h2>
            <p className="text-gray-600">Simple, secure, and transparent</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card hover gradient>
              <div className="w-16 h-16 bg-gradient-to-br from-[#006B3F] to-[#00A8E8] rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Verified Profiles
              </h3>
              <p className="text-gray-600">
                All workers undergo thorough verification to ensure trust and safety
              </p>
            </Card>

            <Card hover gradient>
              <div className="w-16 h-16 bg-gradient-to-br from-[#7B3FF2] to-[#00A8E8] rounded-2xl flex items-center justify-center mb-4">
                <Shield className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Smart Escrow
              </h3>
              <p className="text-gray-600">
                Payments held securely on Stellar blockchain until work is completed
              </p>
            </Card>

            <Card hover gradient>
              <div className="w-16 h-16 bg-gradient-to-br from-[#FFB81C] to-[#BB0000] rounded-2xl flex items-center justify-center mb-4">
                <Zap className="text-white" size={32} />
              </div>
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
      <footer className="bg-gradient-to-r from-[#7B3FF2] via-[#00A8E8] to-[#006B3F] text-white py-12">
        <Container>
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield size={32} />
              <span className="text-2xl font-bold">Kazi Trust</span>
            </div>
            <p className="text-white/80 mb-6">Building trust in domestic work across Kenya</p>
            <div className="flex justify-center gap-8 text-white/90">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/support" className="hover:text-white transition-colors">Support</Link>
            </div>
            <p className="text-white/60 text-sm mt-6">© 2024 Kazi Trust. Powered by Stellar.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
